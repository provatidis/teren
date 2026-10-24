import { LEARNING_ROUTES } from '../lib/entry-links.js';

const KEY = 'teren-learning-location-v1';

// A small navigation bookmark, independent of answers, completion and drafts.
export function saveLearningLocation(route, getStorage = () => globalThis.localStorage) {
  if (!Object.hasOwn(LEARNING_ROUTES, route)) return false;
  try { getStorage().setItem(KEY, route); return true; }
  catch { return false; }
}

export function readLearningLocation(getStorage = () => globalThis.localStorage) {
  try {
    const route = getStorage().getItem(KEY);
    return Object.hasOwn(LEARNING_ROUTES, route) ? { route, title: LEARNING_ROUTES[route] } : null;
  } catch { return null; }
}
