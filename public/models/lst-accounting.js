// Shared accrual and legacy full-sale exit accounting for versioned LST models.
export function lstBalance(collateral, debt, marketPrice, oraclePrice, threshold, walletWETH = 0, walletLST = 0, flashDebt = 0) {
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
  const remaining = lstBalance(Math.max(0, end.collateral - seized), Math.max(0, end.debt - repay),
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
    lstBalance(collateral, debt, end.marketPrice, end.oraclePrice, input.threshold, walletWETH, walletLST, flashDebt);
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

export function finishLST(input, { initial, steps, start, buildCosts, buildFlashCost = 0 }, model) {
  const { collateral, debt } = start;
  const years = input.days / 365;
  const rate = input.rate * (1 + input.stakingAPY / 100) ** years;
  const accruedCollateral = collateral * (1 + input.lendingAPY / 100) ** years;
  const firstDays = input.rateChange ? Math.min(input.days, input.changeDay) : input.days;
  const integratedAPR = input.borrowAPR * firstDays + input.laterAPR * (input.days - firstDays);
  const accruedDebt = debt * Math.exp(integratedAPR / 36500);
  const marketPrice = rate * (1 - input.discount / 100);
  const oraclePrice = input.oracleMode === 'market' ? marketPrice : rate;
  const end = lstBalance(accruedCollateral, accruedDebt, marketPrice, oraclePrice, input.threshold);
  const firstRateBoundary = rateBoundary(start, input);
  const holding = input.collateral * marketPrice;
  const holdingAfterExit = holding * (1 - input.exitCost / 100) - input.gas;
  const targetDebt = end.collateralValue - holding;
  const breakEvenAPR = debt > 0 && input.days > 0 && targetDebt > 0
    ? Math.log(targetDebt / debt) * 36500 / input.days : null;
  return {
    model, input: { ...input }, initial, steps, start, end, rate, buildCosts, buildFlashCost,
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
