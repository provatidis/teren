import { lstModel, lstModelForInput } from '../models/lst-models.js';
import { validateLSTComparison } from '../models/lst-comparison.js';

export const LST_VIEWS = ['build', 'hold', 'exit'];
export function lstHash(input, view = 'hold', comparison = null) {
  const { LST_MODEL, LST_KEYS, validateLST } = lstModelForInput(input);
  if (Object.keys(validateLST(input)).length || !LST_VIEWS.includes(view)) throw new RangeError('Use a valid LST loop setup.');
  const params = new URLSearchParams({ lst: LST_MODEL, view });
  for (const key of LST_KEYS) params.set(key, String(input[key]));
  const reference = validateLSTComparison(input, comparison);
  if (reference) params.set('compareTarget', String(reference.targetExposure));
  return '#' + params;
}
export function readLSTHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!params.has('lst')) return { status: 'none' };
  const model = lstModel(params.get('lst'));
  if (!model) return { status: 'invalid' };
  const { LST_KEYS, validateLST } = model;
  if (hash.length > 2500 || !LST_VIEWS.includes(params.get('view')) ||
    [...params.keys()].some(key => !['lst', 'view', 'compareTarget', ...LST_KEYS].includes(key) || params.getAll(key).length !== 1) ||
    LST_KEYS.some(key => !params.get(key)?.trim())) return { status: 'invalid' };
  const input = {};
  for (const key of LST_KEYS) {
    const value = params.get(key);
    if (['rateChange', 'exitAvailable'].includes(key)) {
      if (!['true', 'false'].includes(value)) return { status: 'invalid' };
      input[key] = value === 'true';
    } else input[key] = ['oracleMode', 'buildMode', 'exitMode'].includes(key) ? value : Number(value);
  }
  if (Object.keys(validateLST(input)).length) return { status: 'invalid' };
  try {
    const comparison = params.has('compareTarget')
      ? validateLSTComparison(input, { targetExposure: params.get('compareTarget').trim() ? Number(params.get('compareTarget')) : NaN }) : null;
    return { status: 'ready', input, view: params.get('view'), ...(comparison ? { comparison } : {}) };
  } catch { return { status: 'invalid' }; }
}
