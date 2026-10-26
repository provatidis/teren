// Keep legacy storage and format identifiers so existing work survives rebranding.
import { LESSON_IDS, VARIANTS, validateLessonInputs } from '../models/lesson-experiments.js';
import { validChoiceSeed } from '../lib/learning-choices.js';
import { essentialQuestionRevisions } from '../models/lesson-application.js';
import { challengeSetup } from '../models/liquidity-challenge.js';
export const LEARNING_KEY = 'degenerator-learning-liquidity-v1';
export function emptyProgress() { return { version: 1, completed: [], lastLesson: LESSON_IDS[0], drafts: {} }; }
export function parseProgress(value) {
  const clean = emptyProgress();
  if (!value || value.version !== 1) return clean;
  clean.completed = LESSON_IDS.filter(id => Array.isArray(value.completed) && value.completed.includes(id));
  if (LESSON_IDS.includes(value.lastLesson)) clean.lastLesson = value.lastLesson;
  for (const id of LESSON_IDS) {
    const draft = value.drafts?.[id];
    if (!draft || !Number.isInteger(draft.variant) || draft.variant < 0 || draft.variant >= VARIANTS) continue;
    try {
      const inputs = validateLessonInputs(id, draft.inputs, draft.variant);
      const revisions = essentialQuestionRevisions(id, draft.variant);
      const samePrediction = (draft.predictionRevision ?? 1) === revisions.prediction;
      const sameReason = (draft.reasonRevision ?? 1) === revisions.reason;
      const sameApplication = (draft.applicationRevision ?? 1) === revisions.application;
      clean.drafts[id] = { variant: draft.variant, inputs,
        prediction: samePrediction && typeof draft.prediction === 'string' && draft.prediction.length <= 16 ? draft.prediction : '',
        answer: typeof draft.answer === 'string' && draft.answer.length <= 32 ? draft.answer : '',
        reason: sameReason && typeof draft.reason === 'string' && draft.reason.length <= 24 ? draft.reason : '',
        application: sameApplication && typeof draft.application === 'string' && draft.application.length <= 24 ? draft.application : '',
        predictionRevision: revisions.prediction, reasonRevision: revisions.reason, applicationRevision: revisions.application,
        choiceSeed: validChoiceSeed(draft.choiceSeed) ? draft.choiceSeed : null,
        ran: draft.ran === true };
      if (id === 'final-challenge') {
        const task = sameApplication ? challengeSetup(inputs, draft.task) : null;
        clean.drafts[id].task = task;
        clean.drafts[id].taskChecked = Boolean(task && sameReason && sameApplication && draft.taskChecked === true);
      }
    } catch { /* Ignore an invalid exercise without losing other progress. */ }
  }
  return clean;
}
export function readProgress(getStorage = () => globalThis.localStorage) {
  try {
    const raw = getStorage().getItem(LEARNING_KEY);
    return { progress: raw ? parseProgress(JSON.parse(raw)) : emptyProgress(), available: true };
  } catch { return { progress: emptyProgress(), available: false }; }
}
export function saveProgress(progress, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(LEARNING_KEY, JSON.stringify(parseProgress(progress))); return true; }
  catch { return false; }
}
