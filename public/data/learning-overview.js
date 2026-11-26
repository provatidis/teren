import { LEARNING_ROUTES } from '../lib/entry-links.js';

// Each course keeps its own versioned progress record. Home reads only their
// completion lists and never writes them. The keys are repeated here so Home
// loads no lesson or model code; a unit test keeps them equal to each course's
// own constant.
export const LEARNING_COURSES = Object.freeze([
  ['liquidity', 'learn.html#lesson=', 'degenerator-learning-liquidity-v1'],
  ['liquidity', 'learn.html#manage=', 'passiko-range-learning-v1'],
  ['liquidity', 'learn.html#applied=', 'passiko-applied-liquidity-v1'],
  ['lending', 'lending.html#lesson=', 'teren-lending-learning-v1'],
  ['lending', 'lending.html#loop-lesson=', 'teren-loop-learning-v1'],
  ['lending', 'lending.html#lst-lesson=', 'teren-lst-learning-v1'],
  ['yield', 'yield-learn.html#lesson=', 'teren-yield-learning-v1'],
].map(([topic, prefix, key]) => Object.freeze({ topic, prefix, key })));

function completedIn(key, getStorage) {
  try {
    const record = JSON.parse(getStorage().getItem(key));
    return record?.version === 1 && Array.isArray(record.completed) ? record.completed : [];
  } catch { return []; }
}

// Every lesson in its public order, with the topic it belongs to and whether
// its understanding check has been passed in this browser.
export function readLearningOverview(getStorage = () => globalThis.localStorage) {
  const lessons = [];
  for (const { topic, prefix, key } of LEARNING_COURSES) {
    const completed = completedIn(key, getStorage);
    for (const [route, title] of Object.entries(LEARNING_ROUTES)) {
      if (route.startsWith(prefix)) lessons.push({ topic, route, title, done: completed.includes(route.slice(prefix.length)) });
    }
  }
  return lessons;
}

export function topicProgress(lessons, topic) {
  const own = lessons.filter(lesson => lesson.topic === topic);
  return { done: own.filter(lesson => lesson.done).length, total: own.length, next: own.find(lesson => !lesson.done) ?? null };
}

// The bookmarked lesson while it is unfinished. Afterwards: the rest of its
// topic, then earlier gaps in that topic, then the other topics in order.
export function nextLearningStep(lessons, bookmark) {
  const index = lessons.findIndex(lesson => lesson.route === bookmark);
  if (index < 0) return null;
  const current = lessons[index];
  if (!current.done) return { ...current, resumed: true };
  const open = lesson => !lesson.done;
  const sameTopic = lesson => lesson.topic === current.topic;
  const next = lessons.slice(index + 1).find(lesson => sameTopic(lesson) && open(lesson))
    ?? lessons.find(lesson => sameTopic(lesson) && open(lesson))
    ?? [...lessons.slice(index + 1), ...lessons.slice(0, index)].find(open);
  return next ? { ...next, resumed: false } : null;
}
