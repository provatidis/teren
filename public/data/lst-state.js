import { LST_DEFAULTS, LST_KEYS, validateLST } from '../models/lst-loop-v1.js';
import { LST_VIEWS } from '../lib/lst-links.js';

export const LST_DRAFT_KEY = 'teren-lst-loop-draft-v1';
export function readLSTDraft(getStorage = () => globalThis.localStorage) {
  const fallback = status => ({ input: { ...LST_DEFAULTS }, view: 'build', status });
  let raw;
  try { raw = getStorage().getItem(LST_DRAFT_KEY); }
  catch { return fallback('unavailable'); }
  if (!raw) return fallback('empty');
  try {
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || Object.keys(validateLST(saved.input)).length || !LST_VIEWS.includes(saved.view)) return fallback('invalid');
    return { input: Object.fromEntries(LST_KEYS.map(key => [key, saved.input[key]])), view: saved.view, status: 'ready' };
  } catch { return fallback('invalid'); }
}
export function saveLSTDraft(input, view, getStorage = () => globalThis.localStorage) {
  if (Object.keys(validateLST(input)).length || !LST_VIEWS.includes(view)) return false;
  try { getStorage().setItem(LST_DRAFT_KEY, JSON.stringify({ version: 1, input, view })); return true; }
  catch { return false; }
}
