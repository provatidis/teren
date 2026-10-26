// Shared balance sheet; accrual is supplied by the versioned loan model.
function position(collateralTokens, debt, price, threshold, enabled, useBoundaryRatio) {
  const collateralValue = collateralTokens * price;
  const weightedCollateral = enabled ? collateralValue * threshold / 100 : 0;
  const boundaryPrice = debt === 0 || !enabled ? null : debt / (collateralTokens * threshold / 100);
  // The equivalent price ratio makes an exact computed boundary exactly 1,
  // without treating a genuinely lower price as equal through a tolerance.
  const healthFactor = debt === 0 ? null : useBoundaryRatio && enabled ? price / boundaryPrice : weightedCollateral / debt;
  const status = debt === 0 ? 'no-debt' : healthFactor === 1 ? 'boundary' : healthFactor < 1 ? 'eligible' : 'above';
  return { collateralTokens, collateralValue, debt, healthFactor, boundaryPrice, status };
}

export function finishLoan(input, supplyInterestTokens, borrowInterest, model) {
  const state = (collateral, debt, price) => position(collateral, debt, price,
    input.threshold, input.collateralEnabled, model !== 'collateral-loan-v1');
  const start = state(input.collateral, input.borrow, input.start);
  const end = state(input.collateral + supplyInterestTokens, input.borrow + borrowInterest, input.future);
  const repaid = Math.min(input.budget, end.debt);
  const repay = state(end.collateralTokens, end.debt - repaid, input.future);
  const add = state(end.collateralTokens + input.budget / input.future, end.debt, input.future);
  return {
    model, input: { ...input }, start, end,
    startingLimit: input.collateralEnabled ? input.collateral * input.start * input.maxLTV / 100 : 0,
    supplyInterestTokens, borrowInterest, borrowedCash: input.borrow,
    netAssets: end.collateralValue + input.borrow - end.debt,
    holdingValue: input.collateral * input.future,
    interestDifference: supplyInterestTokens * input.future - borrowInterest,
    responses: { unchanged: end, repay: { ...repay, spent: repaid, unused: input.budget - repaid }, add: { ...add, spent: input.budget, unused: 0 } },
  };
}
