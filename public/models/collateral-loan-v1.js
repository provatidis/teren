// A teaching model, not Aave's indexed on-chain interest accounting.
// Both rates use constant, simple APR over a 365-day year. USDC is fixed at $1.
import { finishLoan } from './loan-accounting.js';
export const LOAN_MODEL = 'collateral-loan-v1';
export const LOAN_DEFAULTS = Object.freeze({
  collateral: 5, start: 2000, borrow: 5000, future: 2000, days: 0,
  supplyAPR: 2, borrowAPR: 5, maxLTV: 75, threshold: 80,
  budget: 500, collateralEnabled: true,
});
export const LOAN_LIMITS = Object.freeze({
  collateral: [0.000001, 1000000], start: [0.01, 10000000],
  borrow: [0, 1000000000], future: [0.01, 10000000], days: [0, 1825],
  supplyAPR: [0, 50], borrowAPR: [0, 100], maxLTV: [1, 95],
  threshold: [1, 99], budget: [0, 1000000000],
});

export function validateLoan(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(LOAN_LIMITS)) {
    if (typeof input?.[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < min || input[key] > max) {
      errors[key] = 'Enter a number from ' + min.toLocaleString('en-US') + ' to ' + max.toLocaleString('en-US') + '.';
    }
  }
  if (typeof input?.collateralEnabled !== 'boolean') errors.collateralEnabled = 'Choose whether the supply backs this loan.';
  for (const key of ['borrow', 'budget']) {
    if (!errors[key] && input[key] > 0 && input[key] < 0.000001) errors[key] = 'Use zero or at least 0.000001.';
  }
  if (!errors.threshold && !errors.maxLTV && input.threshold <= input.maxLTV) {
    errors.threshold = 'The liquidation threshold must be above the maximum starting LTV.';
  }
  if (!errors.borrow && input.borrow > 0) {
    if (input.collateralEnabled === false) errors.borrow = 'Enable collateral, or set the borrowed amount to zero.';
    else if (!errors.collateral && !errors.start && !errors.maxLTV && input.borrow > input.collateral * input.start * input.maxLTV / 100) {
      errors.borrow = 'The new loan exceeds the starting borrowing limit. Lower the borrowed amount or increase collateral.';
    }
  }
  return errors;
}

export function calculateLoan(input) {
  const errors = validateLoan(input);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors)[0]);
  const years = input.days / 365;
  const supplyInterestTokens = input.collateral * input.supplyAPR / 100 * years;
  const borrowInterest = input.borrow * input.borrowAPR / 100 * years;
  return finishLoan(input, supplyInterestTokens, borrowInterest, LOAN_MODEL);
}
