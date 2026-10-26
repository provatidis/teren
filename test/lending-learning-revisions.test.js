import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLendingProgress, readLendingProgress, saveLendingProgress } from '../public/data/lending-state.js';
import { LOOP_LEARNING_KEY, readLoopProgress, saveLoopProgress } from '../public/data/loop-state.js';
import { checkLendingUnderstanding } from '../public/models/lending-lessons.js';
import { checkLoopUnderstanding, loopCase } from '../public/models/loop-lessons.js';

const memory = () => {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
};

test('a revised repayment explanation clears only that answer and retains prior completion', () => {
  const legacy = {
    version: 1, currentLesson: 'respond', completed: ['supply', 'respond'],
    drafts: {
      respond: { prediction: 'repay', reason: 'debt', application: 'none', revealed: true, seed: 7 },
      supply: { prediction: 'earn', reason: 'separate', application: 'enable', revealed: true, seed: 3 },
    },
  };
  const before = structuredClone(legacy);
  const parsed = parseLendingProgress(legacy);
  assert.deepEqual(legacy, before);
  assert.deepEqual(parsed.completed, legacy.completed);
  assert.equal(parsed.currentLesson, 'respond');
  assert.deepEqual(parsed.drafts.supply, legacy.drafts.supply);
  assert.deepEqual(parsed.drafts.respond, {
    prediction: 'repay', reason: '', application: 'none', revealed: true, seed: 7,
    questionRevisions: { reason: 1 },
  });
  assert.equal(checkLendingUnderstanding('respond', parsed.drafts.respond.reason, 'none').passed, false);
  const storage = memory();
  parsed.drafts.respond.reason = 'tradeoff';
  assert.equal(saveLendingProgress(parsed, () => storage), true);
  assert.deepEqual(readLendingProgress(() => storage).progress, parsed);
  assert.equal(checkLendingUnderstanding('respond', 'tradeoff', 'none').passed, true);
  parsed.drafts.respond.questionRevisions.reason = 2;
  assert.equal(parseLendingProgress(parsed).drafts.respond.reason, '', 'An unknown revision cannot grade a current question.');
});

test('loop application revisions preserve reasoning, predictions, scene state and every completion', () => {
  const legacy = {
    version: 1, currentLesson: 'unwind', completed: ['build', 'stress', 'unwind'],
    drafts: {
      build: { prediction: 'same', reason: 'debt', application: 'supplied', revealed: true, seed: 2 },
      stress: { prediction: 'loop', reason: 'exposure', application: 'loop-gain', revealed: true, seed: 3 },
      unwind: { prediction: 'stages', reason: 'backing', application: 'blocked', revealed: true, seed: 4 },
    },
  };
  const storage = memory();
  storage.setItem(LOOP_LEARNING_KEY, JSON.stringify(legacy));
  const parsed = readLoopProgress(() => storage).progress;
  assert.deepEqual(parsed.completed, legacy.completed);
  assert.equal(parsed.currentLesson, 'unwind');
  assert.deepEqual(parsed.drafts.build, legacy.drafts.build);
  for (const [id, answer] of [['stress', 'backing-not-profit'], ['unwind', 'repay-wallet']]) {
    const draft = parsed.drafts[id];
    assert.equal(draft.reason, legacy.drafts[id].reason);
    assert.equal(draft.prediction, legacy.drafts[id].prediction);
    assert.equal(draft.revealed, true);
    assert.equal(draft.seed, legacy.drafts[id].seed);
    assert.equal(draft.application, '');
    assert.deepEqual(draft.questionRevisions, { application: 1 });
    assert.equal(checkLoopUnderstanding(id, draft.reason, draft.application).passed, false);
    draft.application = answer;
    assert.equal(checkLoopUnderstanding(id, draft.reason, draft.application).passed, true);
  }
  assert.equal(saveLoopProgress(parsed, () => storage), true);
  assert.deepEqual(readLoopProgress(() => storage).progress, parsed);
});

test('the stress transfer has enough collateral and a larger loss than holding at the same time', () => {
  const { result } = loopCase('stress');
  assert.ok(result.end.healthFactor > 1);
  assert.ok(result.end.netAssets < result.holdingValue);
  assert.ok(result.end.netAssets < result.ownCapital);
  assert.equal(result.end.debt, result.start.debt);
  assert.equal(checkLoopUnderstanding('stress', 'exposure', 'backing-not-profit').passed, true);
  assert.equal(checkLoopUnderstanding('stress', 'exposure', 'loop-gain').passed, false);
  assert.equal(checkLoopUnderstanding('unwind', 'backing', 'blocked').passed, false);
  assert.equal(checkLendingUnderstanding('respond', 'debt', 'none').passed, false);
});
