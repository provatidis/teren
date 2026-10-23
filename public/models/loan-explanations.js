import { calculateLoan } from './collateral-loan-v1.js';

// A single hypothetical event, separate from the unchanged endpoint model.
// These editable assumptions are not a protocol's close-factor or bonus rules.
export const LIQUIDATION_MODEL = 'single-liquidation-v1';
export const LIQUIDATION_DEFAULTS = Object.freeze({ repayPercent: 50, bonusPercent: 5 });
export const LIQUIDATION_LIMITS = Object.freeze({ repayPercent: [1, 100], bonusPercent: [0, 30] });

export function validateLiquidation(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(LIQUIDATION_LIMITS)) {
    if (!Number.isFinite(input?.[key]) || input[key] < min || input[key] > max) {
      errors[key] = 'Enter a number from ' + min + ' to ' + max + '.';
    }
  }
  return errors;
}

export function singleLiquidation(input, assumptions = LIQUIDATION_DEFAULTS) {
  if (Object.keys(validateLiquidation(assumptions)).length) throw new RangeError('Use valid liquidation assumptions.');
  const loan = calculateLoan(input);
  if (loan.end.status !== 'eligible') return { model: LIQUIDATION_MODEL, status: 'ineligible' };
  const { end } = loan;
  const bonus = assumptions.bonusPercent / 100;
  const requested = end.debt * (assumptions.repayPercent / 100);
  const capacity = end.collateralValue / (1 + bonus);
  const exhausted = capacity <= requested;
  const repaid = Math.min(end.debt, requested, capacity);
  // Removing all collateral explicitly avoids a tiny negative floating-point tail.
  const removedTokens = exhausted ? end.collateralTokens : Math.min(end.collateralTokens, repaid * (1 + bonus) / input.future);
  const remainingTokens = exhausted ? 0 : end.collateralTokens - removedTokens;
  const remainingDebt = end.debt - repaid;
  const remainingValue = remainingTokens * input.future;
  const penalty = repaid * bonus;
  return {
    model: LIQUIDATION_MODEL, status: 'executed', assumptions: { ...assumptions },
    requested, repaid, removedTokens, removedValue: repaid + penalty, penalty,
    remainingTokens, remainingDebt, exhausted,
    remainingHealth: remainingDebt === 0 ? null : remainingValue * input.threshold / 100 / remainingDebt,
    netAssets: remainingValue + loan.borrowedCash - remainingDebt,
    beforeNetAssets: loan.netAssets,
  };
}

export function interestReference(input) {
  const loan = calculateLoan(input);
  const compoundedDebt = input.borrow * Math.exp(input.borrowAPR / 100 * input.days / 365);
  return { simpleDebt: loan.end.debt, compoundedDebt, difference: Math.max(0, compoundedDebt - loan.end.debt) };
}

export function healthPriceCurve(input) {
  const { end } = calculateLoan(input);
  if (end.healthFactor === null) return null;
  const maxPrice = Math.max(input.start, input.future, end.boundaryPrice) * 1.25;
  const maxHealth = Math.max(2, end.collateralTokens * maxPrice * input.threshold / 100 / end.debt);
  return { maxPrice, maxHealth, boundaryPrice: end.boundaryPrice, selectedHealth: end.healthFactor };
}
