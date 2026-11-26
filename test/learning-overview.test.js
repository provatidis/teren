import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNING_ROUTES } from '../public/lib/entry-links.js';
import { LEARNING_COURSES, nextLearningStep, readLearningOverview, topicProgress } from '../public/data/learning-overview.js';
import { LEARNING_KEY, saveProgress, emptyProgress } from '../public/data/learning-progress.js';
import { MANAGEMENT_KEY } from '../public/data/management-progress.js';
import { APPLIED_KEY } from '../public/data/applied-progress.js';
import { LOAN_LEARNING_KEY } from '../public/data/lending-state.js';
import { LOOP_LEARNING_KEY } from '../public/data/loop-state.js';
import { LST_LEARNING_KEY } from '../public/data/lst-lesson-progress.js';
import { YIELD_LEARNING_KEY } from '../public/data/yield-lesson-progress.js';

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), values };
}
const record = completed => JSON.stringify({ version: 1, completed, drafts: {} });

test('home progress reads each course under its own storage key', () => {
  assert.deepEqual(LEARNING_COURSES.map(course => course.key),
    [LEARNING_KEY, MANAGEMENT_KEY, APPLIED_KEY, LOAN_LEARNING_KEY, LOOP_LEARNING_KEY, LST_LEARNING_KEY, YIELD_LEARNING_KEY]);
  const lessons = readLearningOverview(() => storage());
  assert.deepEqual(lessons.map(lesson => lesson.route), Object.keys(LEARNING_ROUTES), 'Every lesson appears once, in its public order.');
  assert.ok(lessons.every(lesson => lesson.done === false && lesson.title === LEARNING_ROUTES[lesson.route]));
  assert.deepEqual(['liquidity', 'lending', 'yield'].map(topic => topicProgress(lessons, topic).total), [13, 8, 4]);
});

test('home progress counts what a course saved and never writes', () => {
  const saved = storage();
  saveProgress({ ...emptyProgress(), completed: ['swap-impact', 'pool-share'] }, () => saved);
  saved.setItem(LOOP_LEARNING_KEY, record(['build']));
  saved.setItem(YIELD_LEARNING_KEY, record(['split', 'buyers', 'timing', 'exit', 'unknown-lesson']));
  const before = JSON.stringify([...saved.values]);
  const lessons = readLearningOverview(() => saved);
  assert.equal(JSON.stringify([...saved.values]), before);
  const liquidity = topicProgress(lessons, 'liquidity');
  assert.deepEqual([liquidity.done, liquidity.total, liquidity.next.route], [2, 13, 'learn.html#lesson=token-balances']);
  const lending = topicProgress(lessons, 'lending');
  assert.deepEqual([lending.done, lending.next.route], [1, 'lending.html#lesson=supply'], 'A later chapter does not hide an unfinished earlier lesson.');
  assert.deepEqual(topicProgress(lessons, 'yield'), { done: 4, total: 4, next: null });
});

test('unreadable or outdated progress counts as nothing done', () => {
  for (const value of ['not json', 'null', '[]', JSON.stringify({ version: 2, completed: ['split'] }), JSON.stringify({ version: 1, completed: 'split' })]) {
    const lessons = readLearningOverview(() => storage({ [YIELD_LEARNING_KEY]: value }));
    assert.equal(topicProgress(lessons, 'yield').done, 0);
  }
  const lessons = readLearningOverview(() => { throw new Error('Storage is blocked'); });
  assert.equal(lessons.length, Object.keys(LEARNING_ROUTES).length);
  assert.ok(lessons.every(lesson => !lesson.done));
});

test('the next step resumes an unfinished lesson and moves on from a finished one', () => {
  const at = saved => readLearningOverview(() => storage(saved));
  let lessons = at({});
  assert.equal(nextLearningStep(lessons, 'unknown.html#lesson=none'), null);
  assert.deepEqual(nextLearningStep(lessons, 'lending.html#loop-lesson=unwind'),
    { topic: 'lending', route: 'lending.html#loop-lesson=unwind', title: 'Explore unwinding', done: false, resumed: true });

  lessons = at({ [LEARNING_KEY]: record(['swap-impact']) });
  let step = nextLearningStep(lessons, 'learn.html#lesson=swap-impact');
  assert.deepEqual([step.route, step.resumed], ['learn.html#lesson=pool-share', false]);

  // The last essentials lesson leads into the next liquidity chapter.
  lessons = at({ [LEARNING_KEY]: record(['final-challenge']) });
  assert.equal(nextLearningStep(lessons, 'learn.html#lesson=final-challenge').route, 'learn.html#manage=range-width');

  // A finished final lesson returns to gaps in its own topic before leaving it.
  lessons = at({ [YIELD_LEARNING_KEY]: record(['split', 'timing', 'exit']) });
  assert.equal(nextLearningStep(lessons, 'yield-learn.html#lesson=exit').route, 'yield-learn.html#lesson=buyers');

  // A finished topic points to the first unfinished lesson elsewhere, in topic order.
  lessons = at({ [YIELD_LEARNING_KEY]: record(['split', 'buyers', 'timing', 'exit']), [LEARNING_KEY]: record(['swap-impact']) });
  assert.equal(nextLearningStep(lessons, 'yield-learn.html#lesson=exit').route, 'learn.html#lesson=pool-share');
  lessons = at({ [LEARNING_KEY]: record(['swap-impact', 'pool-share', 'token-balances', 'loss-vs-profit', 'fee-break-even', 'range-boundaries', 'final-challenge']),
    [MANAGEMENT_KEY]: record(['range-width', 'fee-tiers', 'range-management']), [APPLIED_KEY]: record(['fees-over-time', 'between-samples', 'period-vs-holding']) });
  assert.equal(nextLearningStep(lessons, 'learn.html#applied=period-vs-holding').route, 'lending.html#lesson=supply');

  // Nothing is left to suggest once every lesson is done.
  const everything = Object.fromEntries(LEARNING_COURSES.map(({ key, prefix }) =>
    [key, record(Object.keys(LEARNING_ROUTES).filter(route => route.startsWith(prefix)).map(route => route.slice(prefix.length)))]));
  lessons = at(everything);
  assert.ok(lessons.every(lesson => lesson.done));
  assert.equal(nextLearningStep(lessons, 'yield-learn.html#lesson=exit'), null);
});
