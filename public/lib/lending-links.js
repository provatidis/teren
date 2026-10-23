import { LOAN_MODEL, LOAN_LIMITS, validateLoan } from '../models/collateral-loan-v1.js';
import { LIQUIDATION_MODEL, LIQUIDATION_LIMITS, validateLiquidation } from '../models/loan-explanations.js';

export function loanHash(input, liquidation) {
  if (Object.keys(validateLoan(input)).length) throw new RangeError('Use a valid loan setup.');
  const params = new URLSearchParams({ loan: LOAN_MODEL });
  for (const key of Object.keys(LOAN_LIMITS)) params.set(key, String(input[key]));
  params.set('collateralEnabled', String(input.collateralEnabled));
  if (liquidation) {
    if (Object.keys(validateLiquidation(liquidation)).length) throw new RangeError('Use valid liquidation assumptions.');
    params.set('liquidation', LIQUIDATION_MODEL);
    for (const key of Object.keys(LIQUIDATION_LIMITS)) params.set(key, String(liquidation[key]));
  }
  return '#' + params;
}

export function readLoanHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!params.has('loan')) return { status: 'none' };
  if (hash.length > 2000 || params.get('loan') !== LOAN_MODEL) return { status: 'invalid' };
  const allowed = ['loan', ...Object.keys(LOAN_LIMITS), 'collateralEnabled', 'liquidation', ...Object.keys(LIQUIDATION_LIMITS)];
  if ([...params.keys()].some(key => !allowed.includes(key) || params.getAll(key).length !== 1)) return { status: 'invalid' };
  const input = {};
  for (const key of Object.keys(LOAN_LIMITS)) {
    const value = params.get(key);
    if (value === null || value.trim() === '') return { status: 'invalid' };
    input[key] = Number(value);
  }
  if (!['true', 'false'].includes(params.get('collateralEnabled'))) return { status: 'invalid' };
  input.collateralEnabled = params.get('collateralEnabled') === 'true';
  if (Object.keys(validateLoan(input)).length) return { status: 'invalid' };
  const extra = Object.keys(LIQUIDATION_LIMITS);
  if (!params.has('liquidation')) return extra.some(key => params.has(key)) ? { status: 'invalid' } : { status: 'ready', input };
  if (params.get('liquidation') !== LIQUIDATION_MODEL || extra.some(key => !params.get(key)?.trim())) return { status: 'invalid' };
  const liquidation = Object.fromEntries(extra.map(key => [key, Number(params.get(key))]));
  return Object.keys(validateLiquidation(liquidation)).length ? { status: 'invalid' } : { status: 'ready', input, liquidation };
}

export function lendingLessonFromHash(hash) {
  const match = /^#lesson=(supply|borrow|conditions|respond)$/.exec(hash);
  return match?.[1] || null;
}
