import { APPLIED_IDS } from '../lib/applied-lessons.js';
import { validChoiceSeed } from '../lib/learning-choices.js';

export const APPLIED_KEY = 'passiko-applied-liquidity-v1';
export const APPLIED_QUESTION_REVISIONS = Object.freeze({
  'fees-over-time': Object.freeze({prediction:1,reason:1,application:1}),
  'between-samples': Object.freeze({prediction:1,reason:2,application:5}),
  'period-vs-holding': Object.freeze({prediction:1,reason:4,application:3}),
});
export const emptyAppliedProgress = () => ({ version: 1, completed: [], drafts: {} });
export function parseAppliedProgress(value) {
  const clean = emptyAppliedProgress();
  if (value?.version !== 1) return clean;
  clean.completed = APPLIED_IDS.filter(id => Array.isArray(value.completed) && value.completed.includes(id));
  for (const id of APPLIED_IDS) {
    const draft = value.drafts?.[id];
    if (!draft || typeof draft !== 'object') continue;
    const short = (key, max) => typeof draft[key] === 'string' && draft[key].length <= max ? draft[key] : '';
    const questionRevisions = {...APPLIED_QUESTION_REVISIONS[id]};
    const answer = (key, max) => (draft.questionRevisions?.[key] ?? 1) === questionRevisions[key] ? short(key, max) : '';
    clean.drafts[id] = { prediction: answer('prediction', 16), answer: short('answer', 32), reason: answer('reason', 16),
      application: answer('application', 24), choiceSeed: validChoiceSeed(draft.choiceSeed) ? draft.choiceSeed : null,
      revealed: draft.revealed === true, checkpoint: Number.isInteger(draft.checkpoint) && draft.checkpoint >= 0 && draft.checkpoint < 32 ? draft.checkpoint : null, questionRevisions };
  }
  return clean;
}
export function readAppliedProgress(getStorage = () => globalThis.localStorage) {
  try { const raw = getStorage().getItem(APPLIED_KEY); return { progress: raw ? parseAppliedProgress(JSON.parse(raw)) : emptyAppliedProgress(), available: true }; }
  catch { return { progress: emptyAppliedProgress(), available: false }; }
}
export function saveAppliedProgress(progress, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(APPLIED_KEY, JSON.stringify(parseAppliedProgress(progress))); return true; }
  catch { return false; }
}
