import { validateWidths } from '../models/range-width.js';

export const WIDTH_DRAFT_KEY = 'teren-width-comparison-v1';
export function readWidthDraft(getStorage = () => globalThis.localStorage) {
  try {
    const text = getStorage().getItem(WIDTH_DRAFT_KEY);
    if (!text) return { inputs: null, status: 'empty' };
    const record = JSON.parse(text);
    if (record?.version !== 1) return { inputs: null, status: 'invalid' };
    return { inputs: validateWidths(record.inputs), status: 'saved' };
  } catch (error) {
    return { inputs: null, status: error instanceof SyntaxError || error?.message?.includes('must be between') ? 'invalid' : 'unavailable' };
  }
}
export function saveWidthDraft(input, getStorage = () => globalThis.localStorage) {
  const inputs = validateWidths(input);
  try {
    getStorage().setItem(WIDTH_DRAFT_KEY, JSON.stringify({ version: 1, inputs }));
    return true;
  } catch { return false; }
}
