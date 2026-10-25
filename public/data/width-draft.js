import { validateWidths } from '../models/range-width.js';
import { validateFeeFlow } from '../models/range-fee-flow-v1.js';

export const WIDTH_DRAFT_KEY = 'teren-width-comparison-v1';
export function readWidthDraft(getStorage = () => globalThis.localStorage) {
  try {
    const text = getStorage().getItem(WIDTH_DRAFT_KEY);
    if (!text) return { inputs: null, status: 'empty' };
    const record = JSON.parse(text);
    if (![1, 2].includes(record?.version)) return { inputs: null, status: 'invalid' };
    try {
      return { inputs: validateWidths(record.inputs), status: 'saved',
        ...(record.version === 2 ? { flow: validateFeeFlow(record.flow) } : {}) };
    } catch { return { inputs: null, status: 'invalid' }; }
  } catch (error) {
    return { inputs: null, status: error instanceof SyntaxError || error?.message?.includes('must be between') ? 'invalid' : 'unavailable' };
  }
}
export function saveWidthDraft(input, getStorage = () => globalThis.localStorage, flow = null) {
  const inputs = validateWidths(input);
  const record = flow ? { version: 2, inputs, flow: validateFeeFlow(flow) } : { version: 1, inputs };
  try {
    getStorage().setItem(WIDTH_DRAFT_KEY, JSON.stringify(record));
    return true;
  } catch { return false; }
}
