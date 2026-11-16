import test from 'node:test';
import assert from 'node:assert/strict';
import { YIELD_LESSONS } from '../public/learning/yield-lessons.js';
import { freshYieldDraft, parseYieldProgress, readYieldProgress, saveYieldProgress } from '../public/data/yield-lesson-progress.js';

test('a damaged yield draft cannot fabricate a prediction, check or unlocked answers', () => {
  const progress = parseYieldProgress({
    version: 1, completed: ['split', 'unknown', 'split'],
    drafts: { split: { revealed: 'true', checked: true, prediction: 'invalid', reason: 'sale', seed: -1 } },
  }, YIELD_LESSONS);
  assert.deepEqual(progress.completed, ['split']);
  const draft = progress.drafts.split;
  assert.equal(draft.revealed, false);
  assert.equal(draft.checked, false);
  assert.equal(draft.reason, '');
  assert.equal(draft.prediction, '');
  assert.ok(draft.seed >= 0);
});

test('edits to different lessons in separate tabs preserve both drafts and completions', () => {
  const map = new Map();
  const storage = () => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) });
  const first = readYieldProgress(YIELD_LESSONS, storage), second = readYieldProgress(YIELD_LESSONS, storage);
  const split = YIELD_LESSONS[0], buyers = YIELD_LESSONS[1];
  first.completed.push(split.id);
  first.drafts[split.id] = { ...freshYieldDraft(), revealed: true, reason: split.reason.correct };
  assert.ok(saveYieldProgress(first, YIELD_LESSONS, split.id, storage));
  second.drafts[buyers.id] = { ...freshYieldDraft(), prediction: buyers.prediction.correct };
  assert.ok(saveYieldProgress(second, YIELD_LESSONS, buyers.id, storage));
  const final = readYieldProgress(YIELD_LESSONS, storage);
  assert.deepEqual(final.completed, [split.id]);
  assert.deepEqual(final.drafts[split.id], first.drafts[split.id]);
  assert.deepEqual(final.drafts[buyers.id], second.drafts[buyers.id]);
});
