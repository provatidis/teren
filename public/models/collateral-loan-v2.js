import { LOAN_DEFAULTS as LEGACY_DEFAULTS, validateLoan as validateLegacy, calculateLoan as calculateLegacy } from './collateral-loan-v1.js';
import { finishLoan } from './loan-accounting.js';
export { LOAN_LIMITS } from './collateral-loan-v1.js';

export const LOAN_MODEL = 'collateral-loan-v2';
export const LOAN_DEFAULTS = Object.freeze({ ...LEGACY_DEFAULTS, interestMode: 'compound' });
export const upgradeLoan = input => ({ ...input, interestMode: 'simple' });

export function validateLoan(input) {
  const errors = validateLegacy(input);
  if (!['simple', 'compound'].includes(input?.interestMode)) errors.interestMode = 'Choose an interest calculation.';
  return errors;
}

export function calculateLoan(input) {
  const errors = validateLoan(input);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors)[0]);
  // Preserve the original simple-interest arithmetic, including lesson endpoints.
  if (input.interestMode === 'simple') return { ...calculateLegacy(input), model: LOAN_MODEL };
  const years = input.days / 365;
  const supplyInterestTokens = input.collateral * Math.expm1(input.supplyAPR / 100 * years);
  const borrowInterest = input.borrow * Math.expm1(input.borrowAPR / 100 * years);
  return finishLoan(input, supplyInterestTokens, borrowInterest, LOAN_MODEL);
}
