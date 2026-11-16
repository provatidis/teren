import { SPLIT_MODEL, SPLIT_DEFAULTS, splitInputErrors } from '../models/split-yield-v1.js';

const DRAFT_KEY = 'teren-split-yield-v1';
const fields = Object.keys(SPLIT_DEFAULTS);

export function splitHash(input) {
  const [error] = Object.values(splitInputErrors(input));
  if (error) throw new RangeError(error);
  const params = new URLSearchParams({ yield: SPLIT_MODEL });
  for (const field of fields) params.set(field, input[field]);
  return '#' + params;
}

export function readSplitHash(hash) {
  const params = new URLSearchParams(hash.slice(1));
  if (!params.has('yield')) return null;
  const input = {};
  if (params.size !== fields.length + 1 || params.get('yield') !== SPLIT_MODEL) {
    throw new Error('This yield setup link is incomplete or unsupported.');
  }
  for (const field of fields) {
    const raw = params.get(field);
    if (!raw?.trim()) throw new Error('This yield setup link is missing an input.');
    input[field] = Number(raw);
  }
  const [error] = Object.values(splitInputErrors(input));
  if (error) throw new RangeError(error);
  return input;
}

export function readSplitDraft(getStorage = () => globalThis.localStorage) {
  let raw;
  try { raw = getStorage().getItem(DRAFT_KEY); }
  catch { return { status: 'unavailable' }; }
  if (raw === null) return { status: 'empty' };
  try {
    const inputs = readSplitHash(raw);
    if (inputs) return { inputs, status: 'saved' };
  } catch { /* Keep the previous copy until the next valid edit. */ }
  return { status: 'invalid' };
}

export function saveSplitDraft(hash, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(DRAFT_KEY, hash); return true; }
  catch { return false; }
}
