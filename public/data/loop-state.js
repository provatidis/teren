import { LOOP_DEFAULTS, LOOP_LIMITS, validateLoop } from '../models/borrowing-loop-v1.js';
import { parseLendingProgress } from './lending-state.js';

export const LOOP_DRAFT_KEY = 'teren-loop-draft-v1';
export const LOOP_LEARNING_KEY = 'teren-loop-learning-v1';
export const LOOP_LESSON_IDS = ['build', 'stress', 'unwind'];
const CHAPTER_KEY = 'teren-lending-chapter-v1';

export function readLoopDraft(getStorage = () => globalThis.sessionStorage) {
  try {
    const raw = getStorage().getItem(LOOP_DRAFT_KEY);
    if (!raw) return { input: { ...LOOP_DEFAULTS }, status: 'empty' };
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || Object.keys(validateLoop(saved.input)).length) throw new Error('Unsupported draft');
    return { input: Object.fromEntries([...Object.keys(LOOP_LIMITS), 'interestMode'].map(key => [key, saved.input[key]])), status: 'ready' };
  } catch { return { input: { ...LOOP_DEFAULTS }, status: 'unavailable' }; }
}

export function saveLoopDraft(input, getStorage = () => globalThis.sessionStorage) {
  if (Object.keys(validateLoop(input)).length) return false;
  try { getStorage().setItem(LOOP_DRAFT_KEY, JSON.stringify({ version: 1, input })); return true; }
  catch { return false; }
}

export function readLoopProgress(getStorage = () => globalThis.localStorage) {
  try { return { progress: parseLendingProgress(JSON.parse(getStorage().getItem(LOOP_LEARNING_KEY)), LOOP_LESSON_IDS), available: true }; }
  catch { return { progress: parseLendingProgress(null, LOOP_LESSON_IDS), available: false }; }
}

export function saveLoopProgress(progress, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(LOOP_LEARNING_KEY, JSON.stringify(parseLendingProgress(progress, LOOP_LESSON_IDS))); return true; }
  catch { return false; }
}

export function readLendingChapter(getStorage = () => globalThis.sessionStorage) {
  try { return getStorage().getItem(CHAPTER_KEY) === 'loops' ? 'loops' : 'essentials'; }
  catch { return 'essentials'; }
}

export function saveLendingChapter(chapter, getStorage = () => globalThis.sessionStorage) {
  try { getStorage().setItem(CHAPTER_KEY, chapter === 'loops' ? 'loops' : 'essentials'); return true; }
  catch { return false; }
}
