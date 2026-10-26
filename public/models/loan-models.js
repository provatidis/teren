import * as legacy from './collateral-loan-v1.js';
import * as current from './collateral-loan-v2.js';

const keys = [...Object.keys(legacy.LOAN_LIMITS), 'collateralEnabled'];
const versions = Object.freeze({
  [legacy.LOAN_MODEL]: { ...legacy, version: 1, keys },
  [current.LOAN_MODEL]: { ...current, version: 2, keys: [...keys, 'interestMode'] },
});

export const loanModel = model => Object.hasOwn(versions, model) ? versions[model] : null;
export const loanModelForInput = input => versions[Object.hasOwn(input ?? {}, 'interestMode') ? current.LOAN_MODEL : legacy.LOAN_MODEL];
export const calculateLoanForInput = input => loanModelForInput(input).calculateLoan(input);
