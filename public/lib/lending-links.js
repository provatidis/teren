import { LOAN_MODEL, LOAN_LIMITS, validateLoan } from '../models/collateral-loan-v1.js?v=1.17.1';

export function loanHash(input) {
  if (Object.keys(validateLoan(input)).length) throw new RangeError('Use a valid loan setup.');
  const params = new URLSearchParams({ loan: LOAN_MODEL });
  for (const key of Object.keys(LOAN_LIMITS)) params.set(key, String(input[key]));
  params.set('collateralEnabled', String(input.collateralEnabled));
  return '#' + params;
}

export function readLoanHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!params.has('loan')) return { status: 'none' };
  if (hash.length > 2000 || params.get('loan') !== LOAN_MODEL) return { status: 'invalid' };
  const allowed = ['loan', ...Object.keys(LOAN_LIMITS), 'collateralEnabled'];
  if ([...params.keys()].some(key => !allowed.includes(key) || params.getAll(key).length !== 1)) return { status: 'invalid' };
  const input = {};
  for (const key of Object.keys(LOAN_LIMITS)) {
    const value = params.get(key);
    if (value === null || value.trim() === '') return { status: 'invalid' };
    input[key] = Number(value);
  }
  if (!['true', 'false'].includes(params.get('collateralEnabled'))) return { status: 'invalid' };
  input.collateralEnabled = params.get('collateralEnabled') === 'true';
  return Object.keys(validateLoan(input)).length ? { status: 'invalid' } : { status: 'ready', input };
}

export function lendingLessonFromHash(hash) {
  const match = /^#lesson=(supply|borrow|conditions|respond)$/.exec(hash);
  return match?.[1] || null;
}
