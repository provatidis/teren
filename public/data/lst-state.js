import { LST_DEFAULTS } from '../models/lst-loop-v2.js';
import { lstModelForInput } from '../models/lst-models.js';
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
    const { version, LST_KEYS, validateLST } = lstModelForInput(saved.input);
    if (saved.version !== version || Object.keys(validateLST(saved.input)).length || !LST_VIEWS.includes(saved.view)) return fallback('invalid');
    return { input: Object.fromEntries(LST_KEYS.map(key => [key, saved.input[key]])), view: saved.view, status: 'ready' };
  } catch { return fallback('invalid'); }
}
export function saveLSTDraft(input, view, getStorage = () => globalThis.localStorage) {
  const { version, validateLST } = lstModelForInput(input);
  if (Object.keys(validateLST(input)).length || !LST_VIEWS.includes(view)) return false;
  try { getStorage().setItem(LST_DRAFT_KEY, JSON.stringify({ version, input, view })); return true; }
  catch { return false; }
}
