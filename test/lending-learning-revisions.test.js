import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLendingProgress, readLendingProgress, saveLendingProgress } from '../public/data/lending-state.js';
import { LOOP_LEARNING_KEY, readLoopProgress, saveLoopProgress } from '../public/data/loop-state.js';
import { checkLendingUnderstanding } from '../public/models/lending-lessons.js';
import { checkLoopUnderstanding, loopCase } from '../public/models/loop-lessons.js';
import { LENDING_LESSONS } from '../public/learning/lending-essentials.js';
import { LOOP_LESSONS } from '../public/learning/borrowing-loops.js';
import { LOAN_DEFAULTS, calculateLoan } from '../public/models/collateral-loan-v1.js';
import { liquidateBalances } from '../public/models/single-liquidation-v1.js';

const memory = () => {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
};

test('revised loan questions clear obsolete answers and retain compatible answers and completion', () => {
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
    prediction: 'repay', reason: '', application: '', revealed: true, seed: 7,
    questionRevisions: { reason: 1, application: 1 },
  });
  assert.equal(checkLendingUnderstanding('respond', parsed.drafts.respond.reason, 'none').passed, false);
  const storage = memory();
  parsed.drafts.respond.reason = 'tradeoff';
  parsed.drafts.respond.application = 'remaining-backing';
  assert.equal(saveLendingProgress(parsed, () => storage), true);
  assert.deepEqual(readLendingProgress(() => storage).progress, parsed);
  assert.equal(checkLendingUnderstanding('respond', 'tradeoff', 'remaining-backing').passed, true);
  parsed.drafts.respond.questionRevisions.reason = 2;
  assert.equal(parseLendingProgress(parsed).drafts.respond.reason, '', 'An unknown revision cannot grade a current question.');
});

test('the latest loan applications preserve current explanations, predictions and completed lessons', () => {
  const saved = {
    version: 1, currentLesson: 'respond', completed: ['borrow', 'respond'],
    drafts: {
      borrow: { prediction: 'same', reason: 'liability', application: 'boundary', revealed: true, seed: 4 },
      respond: { prediction: 'repay', reason: 'tradeoff', application: 'none', revealed: true, seed: 9, questionRevisions: { reason: 1 } },
    },
  };
  const before = structuredClone(saved), parsed = parseLendingProgress(saved);
  assert.deepEqual(saved, before);
  assert.deepEqual(parsed.completed, saved.completed);
  for (const id of ['borrow', 'respond']) {
    const draft = parsed.drafts[id];
    assert.equal(draft.reason, saved.drafts[id].reason);
    assert.equal(draft.prediction, saved.drafts[id].prediction);
    assert.equal(draft.seed, saved.drafts[id].seed);
    assert.equal(draft.revealed, true);
    assert.equal(draft.application, '');
    assert.equal(draft.questionRevisions.application, 1);
  }
  parsed.drafts.borrow.application = 'borrowing-blocked';
  parsed.drafts.respond.application = 'remaining-backing';
  assert.deepEqual(parseLendingProgress(parsed), parsed);
  assert.equal(checkLendingUnderstanding('borrow', 'liability', 'boundary').passed, false);
  assert.equal(checkLendingUnderstanding('respond', 'tradeoff', 'none').passed, false);
});

test('a loan can exceed its borrowing limit before it becomes eligible for liquidation', () => {
  const loan = calculateLoan({ ...LOAN_DEFAULTS, future: 1300, days: 0 });
  assert.ok(loan.end.debt / loan.end.collateralValue > LOAN_DEFAULTS.maxLTV / 100);
  assert.ok(loan.end.healthFactor > 1);
  assert.equal(loan.end.debt, LOAN_DEFAULTS.borrow);
  assert.equal(checkLendingUnderstanding('borrow', 'liability', 'borrowing-blocked').passed, true);
});

test('a recovery after a completed hypothetical liquidation does not restore the original token balances', () => {
  const falling = calculateLoan({ ...LOAN_DEFAULTS, future: 1200, days: 0 });
  assert.equal(falling.end.status, 'eligible');
  const liquidation = liquidateBalances(falling.end, 1200, LOAN_DEFAULTS.threshold, LOAN_DEFAULTS.borrow);
  assert.equal(liquidation.status, 'executed');
  assert.ok(liquidation.remainingTokens < LOAN_DEFAULTS.collateral);
  assert.ok(liquidation.remainingDebt < LOAN_DEFAULTS.borrow);
  const atRecovery = liquidation.remainingTokens * 2000 * LOAN_DEFAULTS.threshold / 100 / liquidation.remainingDebt;
  assert.ok(atRecovery > 1);
  assert.ok(atRecovery > liquidation.remainingHealth);
  assert.equal(checkLendingUnderstanding('respond', 'tradeoff', 'remaining-backing').passed, true);
});

test('the paused build application derives wallet and collateral evidence from the actual purchase step', () => {
  const lesson = LOOP_LESSONS.find(item => item.id === 'build');
  const example = loopCase('build'), before = structuredClone(example);
  assert.deepEqual(lesson.applicationEvidence(example).rows, [
    ['Supplied as collateral', '5 ETH'], ['In the wallet', '2.5 ETH'], ['Debt still owed', '5,000 USDC'],
  ]);
  assert.deepEqual(example, before);
  const bought = example.result.steps.find(step => step.action === 'swap').position;
  assert.equal(bought.collateralTokens, example.input.collateral);
  assert.equal(bought.walletETH, 2.5);
  assert.equal(bought.cash, 0);
});

test('each lending application responds to the selected misconception with its own explanation', () => {
  for (const lesson of [...LENDING_LESSONS, ...LOOP_LESSONS]) {
    assert.ok(lesson.applicationLabel);
    assert.doesNotMatch(lesson.applicationLabel, /APPLY|CHANGE THE SITUATION/);
    for (const [id] of lesson.applications) assert.ok(lesson.applicationFeedbackByChoice[id]);
    assert.equal(new Set(Object.values(lesson.applicationFeedbackByChoice)).size, lesson.applications.length);
  }
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
