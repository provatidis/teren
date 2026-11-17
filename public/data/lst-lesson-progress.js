import { parseLendingProgress } from './lending-state.js';

export const LST_LEARNING_KEY = 'teren-lst-learning-v1';
const lessonIds = ['discount'];

export function readLSTLessonProgress(getStorage = () => globalThis.localStorage) {
  try {
    const saved = JSON.parse(getStorage().getItem(LST_LEARNING_KEY));
    return { progress: parseLendingProgress(saved, lessonIds), available: true };
  } catch {
    return { progress: parseLendingProgress(null, lessonIds), available: false };
  }
}

export function saveLSTLessonProgress(progress, getStorage = () => globalThis.localStorage) {
  try {
    getStorage().setItem(LST_LEARNING_KEY, JSON.stringify(parseLendingProgress(progress, lessonIds)));
    return true;
  } catch { return false; }
}
