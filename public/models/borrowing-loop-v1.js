// Hypothetical, sequential borrowing and reinvestment. USDC = $1.
// All rounds happen at the starting price before the selected interest period.
export const LOOP_MODEL = 'borrowing-loop-v1';
export const LOOP_DEFAULTS = Object.freeze({
  collateral: 5, start: 2000, rounds: 1, borrowPercent: 50, swapCost: 0.3,
  maxLTV: 75, threshold: 80, future: 2000, days: 0,
  supplyAPR: 2, borrowAPR: 5, interestMode: 'compound',
});
export const LOOP_LIMITS = Object.freeze({
  collateral: [0.001, 1000000], start: [0.01, 10000000], rounds: [0, 5],
  borrowPercent: [1, 95], swapCost: [0, 5], maxLTV: [1, 95], threshold: [1, 99],
  future: [0.01, 10000000], days: [0, 1825], supplyAPR: [0, 50], borrowAPR: [0, 100],
});

export function validateLoop(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(LOOP_LIMITS)) {
    if (typeof input?.[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < min || input[key] > max) {
      errors[key] = 'Enter a number from ' + min.toLocaleString('en-US') + ' to ' + max.toLocaleString('en-US') + '.';
    }
  }
  if (!errors.rounds && !Number.isInteger(input.rounds)) errors.rounds = 'Choose a whole number of rounds from 0 to 5.';
  if (!['compound', 'simple'].includes(input?.interestMode)) errors.interestMode = 'Choose an interest assumption.';
  if (!errors.threshold && !errors.maxLTV && input.threshold <= input.maxLTV) errors.threshold = 'The liquidation threshold must be above maximum LTV.';
  if (!errors.borrowPercent && !errors.maxLTV && input.borrowPercent > input.maxLTV) errors.borrowPercent = 'Use a borrowing fraction no higher than maximum LTV.';
  return errors;
}

function balance(collateralTokens, debt, price, threshold, cash = 0, walletETH = 0) {
  const collateralValue = collateralTokens * price;
  const boundaryPrice = debt === 0 ? null : debt / (collateralTokens * threshold / 100);
  const healthFactor = debt === 0 ? null : collateralValue * threshold / 100 / debt;
  const status = debt === 0 ? 'no-debt' : price < boundaryPrice ? 'eligible' : price === boundaryPrice ? 'boundary' : 'above';
  return {
    collateralTokens, collateralValue, debt, cash, walletETH, boundaryPrice, healthFactor, status,
    exposureTokens: collateralTokens + walletETH,
    netAssets: collateralValue + cash + walletETH * price - debt,
  };
}

// Withdraw only part of the collateral headroom, sell it, then repay.
// This is an illustrative sequence, with no flash loan or outside cash.
function unwind(position, input) {
  let collateral = position.collateralTokens, debt = position.debt, costs = 0;
  const steps = [], price = input.future, threshold = input.threshold / 100, loss = input.swapCost / 100;
  if (debt === 0) return { status: 'no-debt', steps, costs, remaining: position };
  if (position.status !== 'above') return { status: 'blocked', steps, costs, remaining: position };
  for (let index = 0; index < 64 && debt > 0; index++) {
    const headroom = Math.max(0, collateral * price - debt / threshold);
    const needed = debt / (1 - loss);
    const soldValue = Math.min(needed, headroom * 0.95);
    // Never silently erase a small remaining debt when floating-point progress stops.
    if (soldValue <= Number.EPSILON * Math.max(1, collateral * price, debt) * 32) break;
    const repaid = soldValue === needed ? debt : soldValue * (1 - loss);
    const soldTokens = soldValue / price;
    collateral -= soldTokens;
    const withdrawalHealth = collateral * price * threshold / debt;
    debt = soldValue === needed ? 0 : debt - repaid;
    const cost = soldValue - repaid;
    costs += cost;
    steps.push({ index: index + 1, soldTokens, soldValue, repaid, cost, withdrawalHealth,
      remaining: balance(collateral, debt, price, input.threshold) });
  }
  return { status: debt === 0 ? 'complete' : 'limited', steps, costs,
    remaining: balance(collateral, debt, price, input.threshold) };
}

export function calculateLoop(input) {
  const errors = validateLoop(input);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors)[0]);
  const fraction = input.borrowPercent / 100, loss = input.swapCost / 100;
  let collateral = input.collateral, debt = 0, latestSupply = input.collateral, buildCosts = 0;
  const steps = [], rounds = [];
  const initial = balance(collateral, 0, input.start, input.threshold);
  for (let round = 1; round <= input.rounds; round++) {
    const borrowed = latestSupply * input.start * fraction;
    debt += borrowed;
    steps.push({ round, action: 'borrow', amount: borrowed,
      position: balance(collateral, debt, input.start, input.threshold, borrowed) });
    const cost = borrowed * loss, purchased = (borrowed - cost) / input.start;
    buildCosts += cost;
    steps.push({ round, action: 'swap', amount: purchased, cost,
      position: balance(collateral, debt, input.start, input.threshold, 0, purchased) });
    collateral += purchased;
    latestSupply = purchased;
    const position = balance(collateral, debt, input.start, input.threshold);
    steps.push({ round, action: 'supply', amount: purchased, position });
    rounds.push({ round, borrowed, purchased, cost, position });
  }
  const years = input.days / 365;
  const factor = apr => input.interestMode === 'compound' ? Math.exp(apr / 100 * years) : 1 + apr / 100 * years;
  const start = balance(collateral, debt, input.start, input.threshold);
  const end = balance(collateral * factor(input.supplyAPR), debt * factor(input.borrowAPR), input.future, input.threshold);
  return {
    model: LOOP_MODEL, input: { ...input }, initial, steps, rounds, start, end, buildCosts,
    ownCapital: input.collateral * input.start, startingExposure: collateral / input.collateral,
    supplyInterestTokens: end.collateralTokens - collateral, borrowInterest: end.debt - debt,
    holdingValue: input.collateral * input.future,
    supplyOnlyValue: input.collateral * factor(input.supplyAPR) * input.future,
    unwind: unwind(end, input),
  };
}

export function loopAtPrice(result, price) {
  if (!Number.isFinite(price) || price <= 0) throw new RangeError('Use a positive price.');
  return balance(result.end.collateralTokens, result.end.debt, price, result.input.threshold);
}
