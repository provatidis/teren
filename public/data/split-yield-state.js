import { SPLIT_MODEL, SPLIT_DEFAULTS, splitInputErrors } from '../models/split-yield-v1.js';
import { yieldExitErrors } from '../models/split-yield-exit-v1.js';

const DRAFT_KEY = 'teren-split-yield-v1';
const fields = Object.keys(SPLIT_DEFAULTS);

function validate(input, exit) {
  const errors = splitInputErrors(input);
  if (exit) Object.assign(errors, yieldExitErrors(input, exit));
  const [error] = Object.values(errors);
  if (error) throw new RangeError(error);
}

export function splitHash(input, exit = null) {
  validate(input, exit);
  const params = new URLSearchParams({ yield: SPLIT_MODEL });
  for (const field of fields) params.set(field, input[field]);
  if (exit) {
    params.set('exitDay', exit.exitDay);
    params.set('exitApy', exit.exitApy);
  }
  return '#' + params;
}

export function readSplitSetup(hash) {
  const params = new URLSearchParams(hash.slice(1));
  if (!params.has('yield')) return null;
  const hasExit = params.has('exitDay') || params.has('exitApy');
  if ([...params.keys()].length !== fields.length + (hasExit ? 3 : 1) || params.get('yield') !== SPLIT_MODEL) {
    throw new Error('This yield setup link is incomplete or unsupported.');
  }
  function number(field) {
    const raw = params.get(field);
    if (!raw?.trim()) throw new Error('This yield setup link is missing an input.');
    return Number(raw);
  }
  const inputs = Object.fromEntries(fields.map(field => [field, number(field)]));
  const exit = hasExit ? { exitDay: number('exitDay'), exitApy: number('exitApy') } : null;
  validate(inputs, exit);
  return { inputs, exit };
}

export function readSplitHash(hash) {
  return readSplitSetup(hash)?.inputs ?? null;
}

export function readSplitDraft(getStorage = () => globalThis.localStorage) {
  let raw;
  try { raw = getStorage().getItem(DRAFT_KEY); }
  catch { return { status: 'unavailable' }; }
  if (raw === null) return { status: 'empty' };
  try {
    const setup = readSplitSetup(raw);
    if (setup) return { ...setup, status: 'saved' };
  } catch { /* Keep the previous copy until the next valid edit. */ }
  return { status: 'invalid' };
}

export function saveSplitDraft(hash, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(DRAFT_KEY, hash); return true; }
  catch { return false; }
}
