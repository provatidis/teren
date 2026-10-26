import { calculateLoanForInput as calculateLoan } from './loan-models.js';
import { LIQUIDATION_DEFAULTS, liquidateBalances } from './single-liquidation-v1.js';
export { LIQUIDATION_MODEL, LIQUIDATION_DEFAULTS, LIQUIDATION_LIMITS, validateLiquidation } from './single-liquidation-v1.js';

// A single hypothetical event, separate from the unchanged endpoint model.
// These editable assumptions are not a protocol's close-factor or bonus rules.
export function singleLiquidation(input, assumptions = LIQUIDATION_DEFAULTS) {
  const loan = calculateLoan(input);
  return liquidateBalances(loan.end, input.future, input.threshold, loan.borrowedCash, assumptions);
}

export function interestReference(input) {
  calculateLoan(input); // Validate both model versions before making the reference.
  const simpleDebt = input.borrow + input.borrow * input.borrowAPR / 100 * input.days / 365;
  const compoundedDebt = input.borrow * Math.exp(input.borrowAPR / 100 * input.days / 365);
  return { simpleDebt, compoundedDebt, difference: Math.max(0, compoundedDebt - simpleDebt) };
}

export function healthPriceCurve(input) {
  const { end } = calculateLoan(input);
  if (end.healthFactor === null) return null;
  const maxPrice = Math.max(input.start, input.future, end.boundaryPrice) * 1.25;
  const maxHealth = Math.max(2, end.collateralTokens * maxPrice * input.threshold / 100 / end.debt);
  return { maxPrice, maxHealth, boundaryPrice: end.boundaryPrice, selectedHealth: end.healthFactor };
}
