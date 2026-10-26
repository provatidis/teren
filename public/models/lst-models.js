import * as legacy from './lst-loop-v1.js';
import * as current from './lst-loop-v2.js';

const versions = Object.freeze({
  [legacy.LST_MODEL]: { ...legacy, version: 1 },
  [current.LST_MODEL]: { ...current, version: 2 },
});
const additions = current.LST_KEYS.filter(key => !legacy.LST_KEYS.includes(key));

export const lstModel = model => Object.hasOwn(versions, model) ? versions[model] : null;
export const lstModelForInput = input => versions[additions.some(key => Object.hasOwn(input ?? {}, key)) ? current.LST_MODEL : legacy.LST_MODEL];
