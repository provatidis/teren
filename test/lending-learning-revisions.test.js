import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLendingProgress, readLendingProgress, saveLendingProgress } from '../public/data/lending-state.js';
import { LOOP_LEARNING_KEY, readLoopProgress, saveLoopProgress } from '../public/data/loop-state.js';
import { lendingCase, maximumBorrowingCase, checkLendingUnderstanding } from '../public/models/lending-lessons.js';
import { checkLoopUnderstanding, loopCase } from '../public/models/loop-lessons.js';
import { LENDING_LESSONS } from '../public/learning/lending-essentials.js';
import { LOOP_LESSONS } from '../public/learning/borrowing-loops.js';
import { LOAN_DEFAULTS, calculateLoan } from '../public/models/collateral-loan-v1.js';
import { liquidateBalances } from '../public/models/single-liquidation-v1.js';
import { readLoanHash } from '../public/lib/lending-links.js';

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
  assert.deepEqual(parsed.drafts.supply, {
    ...legacy.drafts.supply, application: '', questionRevisions: { application: 1 },
  });
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

test('the withdrawal application retires the collateral-toggle answer without resetting other learning work', () => {
  const legacy = {
    version: 1, currentLesson: 'supply', completed: ['supply', 'borrow', 'conditions'],
    drafts: {
      supply: { prediction: 'earn', reason: 'separate', application: 'enable', revealed: true, seed: 19 },
      borrow: { prediction: 'same', reason: 'liability', application: 'opening-limit', revealed: true, seed: 4, questionRevisions: { application: 2 } },
      conditions: { prediction: 'lower', reason: 'interest', application: 'backing-faster', revealed: true, seed: 12 },
    },
  };
  const before = structuredClone(legacy), parsed = parseLendingProgress(legacy);
  assert.deepEqual(legacy, before);
  assert.equal(parsed.currentLesson, 'supply');
  assert.deepEqual(parsed.completed, legacy.completed);
  assert.deepEqual(parsed.drafts.supply, {
    ...legacy.drafts.supply, application: '', questionRevisions: { application: 1 },
  });
  for (const id of ['borrow', 'conditions']) assert.deepEqual(parsed.drafts[id], legacy.drafts[id]);
  assert.equal(checkLendingUnderstanding('supply', 'separate', 'enable').passed, false);
  assert.equal(checkLendingUnderstanding('supply', 'separate', '').passed, false);
  const lesson = LENDING_LESSONS.find(item => item.id === 'supply');
  for (const [answer] of lesson.applications) {
    assert.equal(checkLendingUnderstanding('supply', 'separate', answer).passed, answer === 'withdraw');
  }
  parsed.drafts.supply.application = 'withdraw';
  const storage = memory();
  assert.equal(saveLendingProgress(parsed, () => storage), true);
  assert.deepEqual(readLendingProgress(() => storage).progress, parsed);
  assert.deepEqual(parseLendingProgress(parsed), parsed);
});

test('the latest loan applications preserve current explanations, predictions and completed lessons', () => {
  const saved = {
    version: 1, currentLesson: 'respond', completed: ['borrow', 'respond'],
    drafts: {
      borrow: { prediction: 'same', reason: 'liability', application: 'borrowing-blocked', revealed: true, seed: 4, questionRevisions: { application: 1 } },
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
    assert.equal(draft.questionRevisions.application, id === 'borrow' ? 2 : 1);
  }
  parsed.drafts.borrow.application = 'opening-limit';
  parsed.drafts.respond.application = 'remaining-backing';
  assert.deepEqual(parseLendingProgress(parsed), parsed);
  assert.equal(checkLendingUnderstanding('borrow', 'liability', 'boundary').passed, false);
  assert.equal(checkLendingUnderstanding('borrow', 'liability', 'borrowing-blocked').passed, false);
  assert.equal(checkLendingUnderstanding('respond', 'tradeoff', 'none').passed, false);
});

test('a loan can exceed its borrowing limit before it becomes eligible for liquidation', () => {
  const loan = calculateLoan({ ...LOAN_DEFAULTS, future: 1300, days: 0 });
  assert.ok(loan.end.debt / loan.end.collateralValue > LOAN_DEFAULTS.maxLTV / 100);
  assert.ok(loan.end.healthFactor > 1);
  assert.equal(loan.end.debt, LOAN_DEFAULTS.borrow);
  assert.match(LENDING_LESSONS.find(lesson => lesson.id === 'borrow').explanation, /past the borrowing limit without yet making the loan eligible for liquidation/);
});

test('the maximum-borrowing application shows model-derived headroom without changing the observed loan', () => {
  const example = lendingCase('borrow'), before = structuredClone(example);
  const { input, result, priceFallPercent } = example.application;
  assert.equal(example.input.borrow, 5000);
  assert.equal(example.result.start.healthFactor, 1.6);
  assert.equal(input.borrow, 7500);
  assert.equal(input.future, 2000);
  assert.equal(input.days, 0);
  assert.equal(result.end.boundaryPrice, 1875);
  assert.equal(priceFallPercent, 6.25);
  const atBoundary = calculateLoan({ ...input, future: result.end.boundaryPrice });
  assert.equal(atBoundary.end.healthFactor, 1);
  assert.equal(atBoundary.end.status, 'boundary');
  assert.equal(calculateLoan({ ...input, future: 1874 }).end.status, 'eligible');
  const lesson = LENDING_LESSONS.find(item => item.id === 'borrow');
  const { explore, ...evidence } = lesson.applicationEvidence(example);
  assert.deepEqual(evidence, {
    title: 'How much room does the maximum leave?',
    rows: [['Loan amount', '7,500 USDC'], ['ETH supplied', '5 ETH'], ['Price fall to the boundary', '6.25%']],
    priceMargin: { startPrice: 2000, boundaryPrice: 1875, label: 'ETH price and liquidation boundary' },
    note: 'No interest accrues here. USDC stays at $1, and the collateral rules stay unchanged.',
  });
  assert.equal(explore.text, 'Try a lower loan amount in the lab ↗');
  assert.deepEqual(readLoanHash(explore.href).input, input);
  assert.equal(checkLendingUnderstanding('borrow', 'liability', 'opening-limit').passed, true);
  assert.deepEqual(example, before);
});

test('maximum-borrowing headroom follows different collateral rules and prices', () => {
  const original = { ...LOAN_DEFAULTS, collateral: 4, start: 2500, future: 1800, maxLTV: 60, threshold: 75, days: 365 };
  const before = structuredClone(original), application = maximumBorrowingCase(original);
  assert.equal(application.input.borrow, 6000);
  assert.equal(application.input.future, 2500);
  assert.equal(application.input.days, 0);
  assert.equal(application.result.end.boundaryPrice, 2000);
  assert.ok(Math.abs(application.priceFallPercent - 20) < 1e-12);
  assert.deepEqual(original, before);
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
  for (const [id, answer] of [['stress', 'backing-not-profit'], ['unwind', 'debt-remains']]) {
    const draft = parsed.drafts[id];
    assert.equal(draft.reason, legacy.drafts[id].reason);
    assert.equal(draft.prediction, legacy.drafts[id].prediction);
    assert.equal(draft.revealed, true);
    assert.equal(draft.seed, legacy.drafts[id].seed);
    assert.equal(draft.application, '');
    assert.deepEqual(draft.questionRevisions, { application: 2 });
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


test('the sale-cost application retires the repayment answer without losing the loan or completion', () => {
  const saved = {
    version: 1, currentLesson: 'unwind', completed: ['build', 'stress', 'unwind'],
    drafts: {
      build: { prediction: 'same', reason: 'debt', application: 'supplied', revealed: true, seed: 2 },
      stress: { prediction: 'loop', reason: 'exposure', application: 'debt-offset', revealed: true, seed: 3, questionRevisions: { application: 1 } },
      unwind: { prediction: 'stages', reason: 'backing', application: 'repay-wallet', revealed: true, seed: 4, questionRevisions: { application: 1 } },
    },
  };
  const storage = memory();
  storage.setItem(LOOP_LEARNING_KEY, JSON.stringify(saved));
  const parsed = readLoopProgress(() => storage).progress;
  assert.deepEqual(parsed.completed, saved.completed);
  assert.deepEqual(parsed.drafts.build, saved.drafts.build);
  for (const id of ['stress', 'unwind']) {
    assert.deepEqual(parsed.drafts[id], { ...saved.drafts[id], application: '', questionRevisions: { application: 2 } });
  }
  assert.equal(checkLoopUnderstanding('unwind', 'backing', 'repay-wallet').passed, false);
  parsed.drafts.stress.application = 'backing-not-profit';
  parsed.drafts.unwind.application = 'debt-remains';
  assert.equal(saveLoopProgress(parsed, () => storage), true);
  assert.deepEqual(readLoopProgress(() => storage).progress, parsed);
});
