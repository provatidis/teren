import { LOAN_DEFAULTS } from '../models/collateral-loan-v2.js';
import { loanModelForInput } from '../models/loan-models.js';
import { LIQUIDATION_DEFAULTS, LIQUIDATION_LIMITS, validateLiquidation } from '../models/loan-explanations.js';

export const LOAN_DRAFT_KEY = 'teren-lending-draft-v1';
export const LOAN_LEARNING_KEY = 'teren-lending-learning-v1';
export const LIQUIDATION_DRAFT_KEY = 'teren-liquidation-draft-v1';
export const LENDING_LESSON_IDS = ['supply', 'borrow', 'conditions', 'respond'];
export const LENDING_QUESTION_REVISIONS = Object.freeze({
  supply: Object.freeze({ application: 1 }),
  borrow: Object.freeze({ application: 2 }),
  respond: Object.freeze({ reason: 1, application: 1 }),
});

export function readLoanDraft(getStorage = () => globalThis.sessionStorage) {
  try {
    const raw = getStorage().getItem(LOAN_DRAFT_KEY);
    if (!raw) return { input: { ...LOAN_DEFAULTS }, status: 'empty' };
    const saved = JSON.parse(raw);
    const { version, keys, validateLoan } = loanModelForInput(saved.input);
    if (saved.version !== version || Object.keys(validateLoan(saved.input)).length) throw new Error('Unsupported draft');
    return { input: Object.fromEntries(keys.map(key => [key, saved.input[key]])), status: 'ready' };
  } catch { return { input: { ...LOAN_DEFAULTS }, status: 'unavailable' }; }
}

export function saveLoanDraft(input, getStorage = () => globalThis.sessionStorage) {
  const { version, validateLoan } = loanModelForInput(input);
  if (Object.keys(validateLoan(input)).length) return false;
  try { getStorage().setItem(LOAN_DRAFT_KEY, JSON.stringify({ version, input })); return true; }
  catch { return false; }
}

export function readLiquidationDraft(getStorage = () => globalThis.sessionStorage) {
  try {
    const saved = JSON.parse(getStorage().getItem(LIQUIDATION_DRAFT_KEY));
    if (saved?.version !== 1 || Object.keys(validateLiquidation(saved.input)).length) return { ...LIQUIDATION_DEFAULTS };
    return Object.fromEntries(Object.keys(LIQUIDATION_LIMITS).map(key => [key, saved.input[key]]));
  } catch { return { ...LIQUIDATION_DEFAULTS }; }
}

export function saveLiquidationDraft(input, getStorage = () => globalThis.sessionStorage) {
  if (Object.keys(validateLiquidation(input)).length) return false;
  try { getStorage().setItem(LIQUIDATION_DRAFT_KEY, JSON.stringify({ version: 1, input })); return true; }
  catch { return false; }
}

export function parseLendingProgress(value, ids = LENDING_LESSON_IDS, revisions = LENDING_QUESTION_REVISIONS) {
  const clean = { version: 1, completed: [], drafts: {}, currentLesson: ids[0] };
  if (value?.version !== 1) return clean;
  if (ids.includes(value.currentLesson)) clean.currentLesson = value.currentLesson;
  clean.completed = ids.filter(id => Array.isArray(value.completed) && value.completed.includes(id));
  for (const id of ids) {
    const draft = value.drafts?.[id];
    if (!draft) continue;
    const choice = key => typeof draft[key] === 'string' && draft[key].length < 30 ? draft[key] : '';
    clean.drafts[id] = {
      prediction: choice('prediction'), reason: choice('reason'), application: choice('application'),
      revealed: draft.revealed === true,
      seed: Number.isInteger(draft.seed) && draft.seed >= 0 && draft.seed <= 0xffffffff ? draft.seed : 0,
    };
    if (revisions[id]) {
      const current = clean.drafts[id];
      current.questionRevisions = { ...revisions[id] };
      for (const [field, revision] of Object.entries(revisions[id])) {
        // Completion belongs to the learner; an answer belongs to its question.
        if (draft.questionRevisions?.[field] !== revision) current[field] = '';
      }
    }
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
