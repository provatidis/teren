import test from 'node:test';
import assert from 'node:assert/strict';
import { isLiquidityEntry, LEARNING_ROUTES } from '../public/lib/entry-links.js';
import { readLearningLocation, saveLearningLocation } from '../public/data/learning-location.js';
import { LESSON_IDS } from '../public/models/lesson-experiments.js';
import { MANAGEMENT_IDS } from '../public/models/range-decisions.js';
import { APPLIED_IDS } from '../public/lib/applied-lessons.js';
import { LENDING_LESSON_IDS } from '../public/data/lending-state.js';
import { LOOP_LESSON_IDS, readLendingChapter, saveLendingChapter } from '../public/data/loop-state.js';
import { LENDING_LESSONS } from '../public/learning/lending-essentials.js';
import { YIELD_LESSONS } from '../public/learning/yield-lessons.js';
import { LOOP_LESSONS } from '../public/learning/borrowing-loops.js';
import { LST_DISCOUNT_LESSON } from '../public/learning/lst-discount-lesson.js';
import { readLSTLessonProgress, saveLSTLessonProgress } from '../public/data/lst-lesson-progress.js';

test('home recognises existing liquidity links while retaining home anchors', () => {
  for (const hash of ['#experiment', '#inspect', '#range-lab', '#swap-sandbox', '#saved-experiments',
    '#scenario=cp50-v1&investment=5000&future=3333', '#investment=5000&scenario=cp50-v1', '#scenario=unknown',
    '#example=position-fees', '#historical-case=range-return']) assert.equal(isLiquidityEntry(hash), true);
  for (const hash of ['', '#main-content', '#home-liquidity-title', '#home-lending-title', '#unknown']) assert.equal(isLiquidityEntry(hash), false);
});

test('resume routes cover all current lessons without importing their models on Home', () => {
  const routes = [
    ...LESSON_IDS.map(id => 'learn.html#lesson=' + id),
    ...MANAGEMENT_IDS.map(id => 'learn.html#manage=' + id),
    ...APPLIED_IDS.map(id => 'learn.html#applied=' + id),
    ...LENDING_LESSON_IDS.map(id => 'lending.html#lesson=' + id),
    ...YIELD_LESSONS.map(lesson => 'yield-learn.html#lesson=' + lesson.id),
    ...LOOP_LESSON_IDS.map(id => 'lending.html#loop-lesson=' + id),
    'lending.html#lst-lesson=' + LST_DISCOUNT_LESSON.id,
  ];
  assert.deepEqual(Object.keys(LEARNING_ROUTES).sort(), routes.sort());
  for (const lesson of LENDING_LESSONS) assert.equal(LEARNING_ROUTES['lending.html#lesson=' + lesson.id], lesson.short);
  for (const lesson of YIELD_LESSONS) assert.equal(LEARNING_ROUTES['yield-learn.html#lesson=' + lesson.id], lesson.short);
  for (const lesson of LOOP_LESSONS) assert.equal(LEARNING_ROUTES['lending.html#loop-lesson=' + lesson.id], lesson.short);
  assert.equal(LEARNING_ROUTES['lending.html#lst-lesson=' + LST_DISCOUNT_LESSON.id], LST_DISCOUNT_LESSON.short);
});

test('the optional LST lesson resumes separately from the directional loop course', () => {
  const data = new Map();
  const storage = () => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) });
  data.set('teren-loop-learning-v1', 'existing loop progress');
  assert.equal(readLSTLessonProgress(storage).progress.currentLesson, 'discount');
  const draft = { version: 1, completed: ['discount', 'build'], currentLesson: 'discount', drafts: {
    discount: { revealed: true, seed: 4, application: 'choice' },
  } };
  assert.equal(saveLSTLessonProgress(draft, storage), true);
  assert.equal(data.get('teren-loop-learning-v1'), 'existing loop progress');
  assert.deepEqual(readLSTLessonProgress(storage).progress.completed, ['discount']);
  assert.equal(readLSTLessonProgress(storage).progress.drafts.discount.application, 'choice');
  saveLendingChapter('lst', storage);
  assert.equal(readLendingChapter(storage), 'lst');
  assert.equal(saveLearningLocation('lending.html#lst-lesson=discount', storage), true);
  assert.equal(readLearningLocation(storage).route, 'lending.html#lst-lesson=discount');
  assert.equal(saveLearningLocation('lending.html#lst-lesson=other', storage), false);
  const blocked = () => { throw new Error('Storage blocked'); };
  assert.equal(readLSTLessonProgress(blocked).available, false);
  assert.equal(saveLSTLessonProgress(draft, blocked), false);
});

test('resume bookmark allows only known local routes and tolerates blocked storage', () => {
  const data = new Map();
  const storage = () => ({ getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) });
  assert.equal(readLearningLocation(storage), null);
  assert.equal(saveLearningLocation('lending.html#loop-lesson=unwind', storage), true);
  assert.equal(readLearningLocation(storage).route, 'lending.html#loop-lesson=unwind');
  for (const bad of ['https://example.com', 'javascript:alert(1)', 'learn.html#lesson=unknown', 'learn.html#lesson=pool-share&url=bad']) {
    assert.equal(saveLearningLocation(bad, storage), false);
    assert.equal(readLearningLocation(storage).route, 'lending.html#loop-lesson=unwind');
  }
  const blocked = () => { throw new Error('Blocked'); };
  assert.equal(readLearningLocation(blocked), null);
  assert.equal(saveLearningLocation('learn.html#lesson=pool-share', blocked), false);
  data.set('teren-learning-location-v1', 'https://example.com');
  assert.equal(readLearningLocation(storage), null);
});
