import { LOAN_DEFAULTS, LOAN_LIMITS, validateLoan } from '../models/collateral-loan-v1.js?v=1.17.1';

export const LOAN_DRAFT_KEY = 'teren-lending-draft-v1';
export const LOAN_LEARNING_KEY = 'teren-lending-learning-v1';
export const LENDING_LESSON_IDS = ['supply', 'borrow', 'conditions', 'respond'];

export function readLoanDraft(getStorage = () => globalThis.sessionStorage) {
  try {
    const raw = getStorage().getItem(LOAN_DRAFT_KEY);
    if (!raw) return { input: { ...LOAN_DEFAULTS }, status: 'empty' };
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || Object.keys(validateLoan(saved.input)).length) throw new Error('Unsupported draft');
    return { input: Object.fromEntries([...Object.keys(LOAN_LIMITS), 'collateralEnabled'].map(key => [key, saved.input[key]])), status: 'ready' };
  } catch { return { input: { ...LOAN_DEFAULTS }, status: 'unavailable' }; }
}

export function saveLoanDraft(input, getStorage = () => globalThis.sessionStorage) {
  if (Object.keys(validateLoan(input)).length) return false;
  try { getStorage().setItem(LOAN_DRAFT_KEY, JSON.stringify({ version: 1, input })); return true; }
  catch { return false; }
}

export function parseLendingProgress(value) {
  const clean = { version: 1, completed: [], drafts: {}, currentLesson: 'supply' };
  if (value?.version !== 1) return clean;
  if (LENDING_LESSON_IDS.includes(value.currentLesson)) clean.currentLesson = value.currentLesson;
  clean.completed = LENDING_LESSON_IDS.filter(id => Array.isArray(value.completed) && value.completed.includes(id));
  for (const id of LENDING_LESSON_IDS) {
    const draft = value.drafts?.[id];
    if (!draft) continue;
    const choice = key => typeof draft[key] === 'string' && draft[key].length < 30 ? draft[key] : '';
    clean.drafts[id] = {
      prediction: choice('prediction'), reason: choice('reason'), application: choice('application'),
      revealed: draft.revealed === true,
      seed: Number.isInteger(draft.seed) && draft.seed >= 0 && draft.seed <= 0xffffffff ? draft.seed : 0,
    };
  }
  return clean;
}

export function readLendingProgress(getStorage = () => globalThis.localStorage) {
  try { return { progress: parseLendingProgress(JSON.parse(getStorage().getItem(LOAN_LEARNING_KEY))), available: true }; }
  catch { return { progress: parseLendingProgress(null), available: false }; }
}

export function saveLendingProgress(progress, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(LOAN_LEARNING_KEY, JSON.stringify(parseLendingProgress(progress))); return true; }
  catch { return false; }
}
