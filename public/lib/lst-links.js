import { LST_MODEL, LST_KEYS, validateLST } from '../models/lst-loop-v1.js';

export const LST_VIEWS = ['build', 'hold', 'exit'];
export function lstHash(input, view = 'hold') {
  if (Object.keys(validateLST(input)).length || !LST_VIEWS.includes(view)) throw new RangeError('Use a valid LST loop setup.');
  const params = new URLSearchParams({ lst: LST_MODEL, view });
  for (const key of LST_KEYS) params.set(key, String(input[key]));
  return '#' + params;
}
export function readLSTHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!params.has('lst')) return { status: 'none' };
  if (hash.length > 2500 || params.get('lst') !== LST_MODEL || !LST_VIEWS.includes(params.get('view')) ||
    [...params.keys()].some(key => !['lst', 'view', ...LST_KEYS].includes(key) || params.getAll(key).length !== 1) ||
    LST_KEYS.some(key => !params.get(key)?.trim())) return { status: 'invalid' };
  const input = {};
  for (const key of LST_KEYS) {
    const value = params.get(key);
    if (['rateChange', 'exitAvailable'].includes(key)) {
      if (!['true', 'false'].includes(value)) return { status: 'invalid' };
      input[key] = value === 'true';
    } else input[key] = key === 'oracleMode' ? value : Number(value);
  }
  return Object.keys(validateLST(input)).length ? { status: 'invalid' } : { status: 'ready', input, view: params.get('view') };
}
