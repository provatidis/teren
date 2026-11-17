// Shared balance sheet; accrual is supplied by the versioned loan model.
function position(collateralTokens, debt, price, threshold, enabled) {
  const collateralValue = collateralTokens * price;
  const boundaryPrice = debt === 0 || !enabled ? null : debt / (collateralTokens * threshold / 100);
  // Use the same unrounded boundary for the health factor and eligibility.
  const healthFactor = boundaryPrice === null ? null : price / boundaryPrice;
  const status = boundaryPrice === null ? 'no-debt' : price < boundaryPrice ? 'eligible' : price === boundaryPrice ? 'boundary' : 'above';
  return { collateralTokens, collateralValue, debt, healthFactor, boundaryPrice, status };
}

export function finishLoan(input, supplyInterestTokens, borrowInterest, model) {
  const state = (collateral, debt, price) => position(collateral, debt, price, input.threshold, input.collateralEnabled);
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
