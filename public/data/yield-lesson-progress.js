import { newChoiceSeed, validChoiceSeed } from '../lib/learning-choices.js';

export const YIELD_LEARNING_KEY = 'teren-yield-learning-v1';

export function freshYieldDraft(lesson) {
  return {
    seed: newChoiceSeed(), prediction: '', reason: '', application: '', revealed: false, checked: false,
    questionRevisions: {
      prediction: lesson.prediction.revision ?? 1,
      reason: lesson.reason.revision ?? 1,
      application: lesson.application.revision ?? 1,
    },
  };
}

function emptyProgress() {
  return { version: 1, completed: [], drafts: {} };
}

export function parseYieldProgress(record, lessons) {
  const progress = emptyProgress();
  if (record?.version !== 1) return progress;

  for (const lesson of lessons) {
    if (Array.isArray(record.completed) && record.completed.includes(lesson.id)) progress.completed.push(lesson.id);
    const saved = record.drafts?.[lesson.id];
    if (!saved || typeof saved !== 'object') continue;
    const draft = freshYieldDraft(lesson);
    if (validChoiceSeed(saved.seed)) draft.seed = saved.seed;
    draft.revealed = saved.revealed === true;
    draft.checked = draft.revealed && saved.checked === true;
    for (const key of ['prediction', 'reason', 'application']) {
      if ((saved.questionRevisions?.[key] ?? 1) !== draft.questionRevisions[key]) {
        if (key !== 'prediction') draft.checked = false;
        continue;
      }
      if ((draft.revealed || key === 'prediction') && lesson[key].choices.some(([id]) => saved[key] === id)) {
        draft[key] = saved[key];
      }
    }
    progress.drafts[lesson.id] = draft;
  }
  return progress;
}

export function readYieldProgress(lessons, getStorage = () => globalThis.localStorage) {
  try {
    const raw = getStorage().getItem(YIELD_LEARNING_KEY);
    return raw ? parseYieldProgress(JSON.parse(raw), lessons) : emptyProgress();
  } catch { return emptyProgress(); }
}

export function saveYieldProgress(progress, lessons, id, getStorage = () => globalThis.localStorage) {
  try {
    const latest = readYieldProgress(lessons, getStorage);
    latest.drafts = { ...progress.drafts, ...latest.drafts, [id]: progress.drafts[id] };
    latest.completed = [...new Set([...latest.completed, ...progress.completed])];
    getStorage().setItem(YIELD_LEARNING_KEY, JSON.stringify(latest));
    Object.assign(progress, latest);
    return true;
  } catch { return false; }
}
