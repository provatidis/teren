// Hypothetical wstETH collateral / WETH debt. Quantities and costs use WETH.
// The conversion rate is stETH per wstETH; the model's base case values stETH at 1 WETH.
export const LST_MODEL = 'lst-loop-v1';
export const LST_DEFAULTS = Object.freeze({
  collateral: 5, rate: 1.2, rounds: 3, borrowPercent: 75, maxLTV: 90, threshold: 94,
  swapCost: 0.1, days: 365, stakingAPY: 3, lendingAPY: 0, borrowAPR: 2,
  rateChange: false, laterAPR: 8, changeDay: 90, discount: 0, oracleMode: 'rate',
  ethUSD: 2000, exitCost: 0.3, flashFee: 0.05, gas: 0.003, exitAvailable: true,
  repayPercent: 50, bonus: 3,
});
export const LST_LIMITS = Object.freeze({
  collateral: [0.001, 1000000], rate: [0.01, 100], rounds: [0, 8],
  borrowPercent: [1, 95], maxLTV: [1, 98], threshold: [1, 99], swapCost: [0, 5],
  days: [0, 1825], stakingAPY: [-50, 50], lendingAPY: [0, 50], borrowAPR: [0, 100],
  laterAPR: [0, 100], changeDay: [0, 1825], discount: [0, 50], ethUSD: [0.01, 10000000],
  exitCost: [0, 20], flashFee: [0, 5], gas: [0, 100], repayPercent: [1, 100], bonus: [0, 30],
});
export const LST_KEYS = Object.freeze([...Object.keys(LST_LIMITS), 'rateChange', 'oracleMode', 'exitAvailable']);

export function validateLST(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(LST_LIMITS)) {
    if (typeof input?.[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < min || input[key] > max) {
      errors[key] = `Enter a number from ${min} to ${max}.`;
    }
  }
  if (!errors.rounds && !Number.isInteger(input.rounds)) errors.rounds = 'Choose a whole number of rounds from 0 to 8.';
  if (!errors.maxLTV && !errors.threshold && input.maxLTV >= input.threshold) errors.threshold = 'The liquidation threshold must be above maximum LTV.';
  if (!errors.borrowPercent && !errors.maxLTV && input.borrowPercent > input.maxLTV) errors.borrowPercent = 'Keep the borrowing fraction at or below maximum LTV.';
  for (const key of ['rateChange', 'exitAvailable']) if (typeof input?.[key] !== 'boolean') errors[key] = 'Choose an option.';
  if (!['market', 'rate'].includes(input?.oracleMode)) errors.oracleMode = 'Choose a supported oracle assumption.';
  return errors;
}

function balance(collateral, debt, marketPrice, oraclePrice, threshold, walletWETH = 0, walletLST = 0, flashDebt = 0) {
  const healthFactor = debt > 0 ? collateral * oraclePrice * threshold / 100 / debt : null;
  const status = debt === 0 ? 'no-debt' : Math.abs(healthFactor - 1) <= 1e-12 ? 'boundary' : healthFactor < 1 ? 'eligible' : 'above';
  return {
    collateral, debt, walletWETH, walletLST, flashDebt, healthFactor, status,
    marketPrice, oraclePrice, collateralValue: collateral * marketPrice,
    net: (collateral + walletLST) * marketPrice + walletWETH - debt - flashDebt,
  };
}

// A rate-only path has at most two exponential segments. Detect an earlier
// boundary even if a later rate reduction makes the endpoint look healthy.
function rateBoundary(start, input) {
  if (start.debt === 0) return null;
  const growth = Math.log1p(input.stakingAPY / 100) + Math.log1p(input.lendingAPY / 100);
  const split = input.rateChange ? Math.min(input.days, input.changeDay) : input.days;
  const segments = [[0, split, input.borrowAPR], [split, input.days, input.laterAPR]];
  let logHealth = Math.log(start.healthFactor);
  for (const [from, to, apr] of segments) {
    if (logHealth <= 0) return from;
    const slope = (growth - apr / 100) / 365;
    if (slope < 0 && logHealth + slope * (to - from) <= 0) return from - logHealth / slope;
    logHealth += slope * (to - from);
  }
  return null;
}

function liquidation(end, input) {
  if (!['eligible', 'boundary'].includes(end.status)) return null;
  const repay = Math.min(end.debt * input.repayPercent / 100,
    end.collateral * end.oraclePrice / (1 + input.bonus / 100));
  const seized = Math.min(end.collateral, repay * (1 + input.bonus / 100) / end.oraclePrice);
  const remaining = balance(Math.max(0, end.collateral - seized), Math.max(0, end.debt - repay),
    end.marketPrice, end.oraclePrice, input.threshold);
  return { repay, seized, bonusAtOracle: repay * input.bonus / 100,
    marketValueTaken: seized * end.marketPrice, remaining, netChange: remaining.net - end.net };
}

function exitPreview(end, firstRateBoundary, input) {
  const swapLoss = end.collateralValue * input.exitCost / 100;
  const proceeds = end.collateralValue - swapLoss;
  const flashCost = end.debt * input.flashFee / 100;
  const cash = proceeds - end.debt - flashCost - input.gas;
  const status = firstRateBoundary !== null || ['eligible', 'boundary'].includes(end.status) ? 'boundary'
    : !input.exitAvailable ? 'unavailable' : cash < 0 ? 'shortfall' : 'complete';
  const result = { status, swapLoss, flashCost, gas: input.gas, cash: status === 'complete' ? cash : null,
    shortfall: Math.max(0, -cash), steps: [], remaining: end };
  if (status !== 'complete') return result;
  const state = (collateral, debt, walletWETH = 0, walletLST = 0, flashDebt = 0) =>
    balance(collateral, debt, end.marketPrice, end.oraclePrice, input.threshold, walletWETH, walletLST, flashDebt);
  result.steps.push({ action: 'start', position: end });
  if (end.debt > 0) {
    result.steps.push({ action: 'flash', position: state(end.collateral, end.debt, end.debt, 0, end.debt) });
    result.steps.push({ action: 'repay', position: state(end.collateral, 0, 0, 0, end.debt) });
  }
  result.steps.push({ action: 'release', position: state(0, 0, 0, end.collateral, end.debt) });
  result.steps.push({ action: 'sell', position: state(0, 0, proceeds, 0, end.debt) });
  result.remaining = state(0, 0, cash);
  result.steps.push({ action: 'settle', position: result.remaining });
  return result;
}

export function calculateLST(input) {
  const errors = validateLST(input);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors)[0]);
  let collateral = input.collateral, latestSupply = collateral, debt = 0, buildCosts = 0;
  const state = (cash = 0, tokens = 0) => balance(collateral, debt, input.rate, input.rate, input.threshold, cash, tokens);
  const initial = state(), steps = [{ action: 'start', round: 0, position: initial }];
  for (let round = 1; round <= input.rounds; round++) {
    const borrowed = latestSupply * input.rate * input.borrowPercent / 100;
    debt += borrowed;
    steps.push({ action: 'borrow', round, amount: borrowed, position: state(borrowed) });
    const cost = borrowed * input.swapCost / 100;
    const purchased = (borrowed - cost) / input.rate;
    buildCosts += cost;
    steps.push({ action: 'buy', round, amount: purchased, cost, position: state(0, purchased) });
    collateral += purchased;
    latestSupply = purchased;
    steps.push({ action: 'supply', round, amount: purchased, position: state() });
  }
  const start = state(), years = input.days / 365;
  const rate = input.rate * (1 + input.stakingAPY / 100) ** years;
  const accruedCollateral = collateral * (1 + input.lendingAPY / 100) ** years;
  const firstDays = input.rateChange ? Math.min(input.days, input.changeDay) : input.days;
  const integratedAPR = input.borrowAPR * firstDays + input.laterAPR * (input.days - firstDays);
  const accruedDebt = debt * Math.exp(integratedAPR / 36500);
  const marketPrice = rate * (1 - input.discount / 100);
  const oraclePrice = input.oracleMode === 'market' ? marketPrice : rate;
  const end = balance(accruedCollateral, accruedDebt, marketPrice, oraclePrice, input.threshold);
  const firstRateBoundary = rateBoundary(start, input);
  const holding = input.collateral * marketPrice;
  const holdingAfterExit = holding * (1 - input.exitCost / 100) - input.gas;
  const targetDebt = end.collateralValue - holding;
  const breakEvenAPR = debt > 0 && input.days > 0 && targetDebt > 0
    ? Math.log(targetDebt / debt) * 36500 / input.days : null;
  return {
    model: LST_MODEL, input: { ...input }, initial, steps, start, end, rate, buildCosts,
    exposure: collateral / input.collateral, holding, holdingAfterExit,
    vsHolding: end.net - holding, initialValue: initial.net,
    stakingGain: collateral * (rate - input.rate),
    lendingGain: (accruedCollateral - collateral) * rate,
    borrowInterest: accruedDebt - debt,
    discountLoss: accruedCollateral * rate * input.discount / 100,
    averageBorrowAPR: input.days > 0 ? integratedAPR / input.days : input.borrowAPR,
    breakEvenAPR, firstRateBoundary,
    boundaryPrice: debt > 0 ? accruedDebt / (accruedCollateral * input.threshold / 100) : null,
    liquidation: liquidation(end, input), exit: exitPreview(end, firstRateBoundary, input),
  };
}
