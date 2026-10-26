import test from 'node:test';
import assert from 'node:assert/strict';
import { LOAN_DEFAULTS, calculateLoan, validateLoan } from '../public/models/collateral-loan-v1.js';
import { lendingCase, checkLendingUnderstanding } from '../public/models/lending-lessons.js';
import { loanHash, readLoanHash, lendingLessonFromHash } from '../public/lib/lending-links.js';
import { healthLabel, loanMoney } from '../public/lib/lending-presentation.js';
import { readLoanDraft, saveLoanDraft, parseLendingProgress, readLendingProgress, saveLendingProgress, LOAN_DRAFT_KEY, LOAN_LEARNING_KEY } from '../public/data/lending-state.js';
import { LENDING_LESSONS } from '../public/learning/lending-essentials.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), actual + ' ≠ ' + expected);
const loan = changes => calculateLoan({ ...LOAN_DEFAULTS, ...changes });
const memory = () => {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('borrowing creates matched cash and debt without creating net assets', () => {
  const result = loan({});
  assert.equal(result.startingLimit, 7500);
  assert.equal(result.start.healthFactor, 1.6);
  assert.equal(result.end.collateralValue, 10000);
  assert.equal(result.end.debt, 5000);
  assert.equal(result.borrowedCash, 5000);
  assert.equal(result.netAssets, 10000);
  assert.equal(result.holdingValue, 10000);
  assert.equal(result.end.boundaryPrice, 1250);
});

test('simple fixed APR credits collateral tokens and debt tokens separately', () => {
  const result = loan({ days: 365 });
  close(result.supplyInterestTokens, 0.1);
  assert.equal(result.borrowInterest, 250);
  close(result.end.collateralTokens, 5.1);
  assert.equal(result.end.debt, 5250);
  assert.equal(result.borrowedCash, 5000);
  assert.equal(result.netAssets, 9950);
  close(result.interestDifference, -50);
  close(loan({ days: 182.5 }).borrowInterest, 125);
});

test('supply without collateral can earn interest and has no borrowing capacity or loan boundary', () => {
  const result = loan({ borrow: 0, days: 365, collateralEnabled: false });
  close(result.end.collateralTokens, 5.1);
  assert.equal(result.startingLimit, 0);
  assert.equal(result.end.healthFactor, null);
  assert.equal(result.end.boundaryPrice, null);
  assert.equal(result.end.status, 'no-debt');
  assert.equal(result.responses.add.status, 'no-debt');
  assert.equal(healthLabel(null), 'No debt');
});

test('new borrowing is bounded by max LTV while liquidation uses a different threshold', () => {
  assert.doesNotThrow(() => loan({ borrow: 7500 }));
  assert.throws(() => loan({ borrow: 7500.01 }), /starting borrowing limit/);
  const later = loan({ borrow: 7500, future: 1900 });
  assert.ok(later.end.debt / later.end.collateralValue > 0.75);
  assert.ok(later.end.healthFactor > 1);
  assert.equal(later.end.status, 'above');
  assert.throws(() => loan({ collateralEnabled: false }), /Enable collateral/);
});

test('the exact boundary and either side are distinguished before display rounding', () => {
  assert.equal(loan({ future: 1250 }).end.status, 'boundary');
  assert.equal(loan({ future: 1249.999 }).end.status, 'eligible');
  assert.equal(loan({ future: 1250.001 }).end.status, 'above');
  assert.equal(healthLabel(loan({ future: 1249.999 }).end.healthFactor), '< 1.00');
  assert.equal(healthLabel(loan({ future: 1250.001 }).end.healthFactor), '> 1.00');
});

test('small real debts and large valid balances remain finite and distinguishable', () => {
  const result = loan({ collateral: 1000000, start: 10000000, future: 10000000, borrow: 0.000001, days: 1825, supplyAPR: 50 });
  assert.ok(Number.isFinite(result.end.healthFactor));
  assert.equal(healthLabel(result.end.healthFactor), '≥ 1,000');
  assert.equal(loanMoney(result.end.debt), '<$0.01');
  assert.equal(loanMoney(result.end.collateralValue), '$35T');
});

test('adverse endpoints retain balances rather than pretending liquidation has been executed', () => {
  const result = loan({ future: 300 });
  assert.equal(result.end.status, 'eligible');
  assert.equal(result.end.debt, 5000);
  assert.equal(result.end.collateralTokens, 5);
  assert.equal(result.netAssets, 1500);
});

test('price and interest affect both sides without mutating assumptions', () => {
  const input = Object.freeze({ ...LOAN_DEFAULTS, future: 1500, days: 365 });
  const result = calculateLoan(input);
  close(result.end.collateralValue, 7650);
  close(result.netAssets - result.holdingValue, result.interestDifference);
  assert.ok(result.end.healthFactor < result.start.healthFactor);
  assert.ok(loan({ supplyAPR: 50, borrowAPR: 1, days: 365 }).end.healthFactor > result.start.healthFactor);
  assert.equal(input.collateral, 5);
});

test('response comparison uses the same additional budget and keeps unused repayment funds', () => {
  const result = loan({ future: 1500, budget: 1000 });
  close(result.end.healthFactor, 1.2);
  close(result.responses.repay.healthFactor, 1.5);
  close(result.responses.add.healthFactor, 1.36);
  assert.equal(result.responses.repay.debt, 4000);
  assert.equal(result.responses.add.debt, 5000);
  close(result.responses.add.collateralValue, 8500);
  const full = loan({ budget: 6000 }).responses.repay;
  assert.equal(full.debt, 0);
  assert.equal(full.status, 'no-debt');
  assert.equal(full.spent, 5000);
  assert.equal(full.unused, 1000);
  const zero = loan({ budget: 0 });
  assert.deepEqual(zero.responses.repay, { ...zero.end, spent: 0, unused: 0 });
});

test('bounded input validation rejects missing, negative, nonfinite and inconsistent values', () => {
  for (const changes of [{ collateral: 0 }, { start: '' }, { future: NaN }, { borrow: Infinity }, { borrow: Number.MIN_VALUE }, { budget: 1e-8 }, { days: -1 }, { supplyAPR: -1 }, { threshold: 75 }, { maxLTV: 96 }, { budget: -1 }, { collateralEnabled: 'true' }]) {
    assert.throws(() => loan(changes), RangeError);
  }
  assert.ok(Object.keys(validateLoan(null)).length);
});

test('loan links round trip all assumptions, including supply-only examples', () => {
  for (const input of [LOAN_DEFAULTS, { ...LOAN_DEFAULTS, borrow: 0, collateralEnabled: false, days: 12.5 }]) {
    assert.deepEqual(readLoanHash(loanHash(input)), { status: 'ready', input });
  }
  assert.equal(readLoanHash('#experiment').status, 'none');
});

test('loan links reject unknown models, duplicates, omitted fields and invalid numbers', () => {
  const valid = loanHash(LOAN_DEFAULTS);
  for (const hash of [valid.replace('collateral-loan-v1', 'collateral-loan-v2'), valid + '&borrow=1', valid + '&rpc=https://example.com', valid.replace('&days=0', ''), valid.replace('days=0', 'days='), valid.replace('borrow=5000', 'borrow=Infinity'), valid.replace('collateralEnabled=true', 'collateralEnabled=1')]) {
    assert.equal(readLoanHash(hash).status, 'invalid');
  }
  assert.equal(lendingLessonFromHash('#lesson=borrow'), 'borrow');
  assert.equal(lendingLessonFromHash('#lesson=borrow&extra=1'), null);
  assert.equal(lendingLessonFromHash('#lesson=pool-share'), null);
});

test('working loan drafts are scoped, validated and preserve the last valid setup', () => {
  const storage = memory(); const get = () => storage;
  assert.equal(readLoanDraft(get).status, 'empty');
  assert.equal(saveLoanDraft(LOAN_DEFAULTS, get), true);
  assert.equal(saveLoanDraft({ ...LOAN_DEFAULTS, borrow: -1 }, get), false);
  assert.deepEqual(readLoanDraft(get).input, LOAN_DEFAULTS);
  storage.setItem(LOAN_DRAFT_KEY, '{bad');
  assert.equal(readLoanDraft(get).status, 'unavailable');
  assert.equal(storage.getItem(LOAN_DRAFT_KEY), '{bad');
  storage.setItem('degenerator-learning-liquidity-v1', 'keep');
  saveLoanDraft(LOAN_DEFAULTS, get);
  assert.equal(storage.getItem('degenerator-learning-liquidity-v1'), 'keep');
});

test('unavailable browser storage does not prevent calculation or learning', () => {
  const blocked = () => { throw new Error('blocked'); };
  assert.equal(readLoanDraft(blocked).status, 'unavailable');
  assert.equal(saveLoanDraft(LOAN_DEFAULTS, blocked), false);
  assert.equal(readLendingProgress(blocked).available, false);
  assert.equal(saveLendingProgress({ version: 1 }, blocked), false);
});

test('lending progress rejects unrelated chapters and malformed values', () => {
  const parsed = parseLendingProgress({ version: 1, completed: ['borrow', 'pool-share', 'borrow'], drafts: { borrow: { prediction: 'same', reason: 'liability', application: 'boundary', revealed: true, seed: 5 }, supply: { seed: -1, reason: 4 } } });
  assert.deepEqual(parsed.completed, ['borrow']);
  assert.equal(parsed.drafts.borrow.reason, 'liability');
  assert.equal(parsed.drafts.supply.seed, 0);
  assert.equal(parsed.drafts.supply.reason, '');
  assert.deepEqual(parseLendingProgress({ version: 1, completed: 'supply' }).completed, []);
  assert.deepEqual(parseLendingProgress({ version: 2, completed: ['supply'] }).completed, []);
  const storage = memory(); saveLendingProgress(parsed, () => storage);
  assert.ok(storage.getItem(LOAN_LEARNING_KEY));
  assert.deepEqual(readLendingProgress(() => storage).progress, parsed);
});

test('lending resumes a known lesson while preserving older progress and explicit lesson choices', () => {
  const legacy = parseLendingProgress({ version: 1, completed: ['supply'], drafts: { supply: { prediction: 'earn', seed: 2 } } });
  assert.equal(legacy.currentLesson, 'supply');
  assert.deepEqual(legacy.completed, ['supply']);
  const storage = memory();
  saveLendingProgress({ ...legacy, currentLesson: 'conditions' }, () => storage);
  const restored = readLendingProgress(() => storage).progress;
  assert.equal(restored.currentLesson, 'conditions');
  assert.equal(restored.drafts.supply.prediction, 'earn');
  assert.equal(parseLendingProgress({ ...restored, currentLesson: 'unsupported' }).currentLesson, 'supply');
  assert.equal(lendingLessonFromHash('#lesson=borrow'), 'borrow');
});

test('the four lessons reproduce their independent numerical reference cases', () => {
  close(lendingCase('supply').result.end.collateralTokens, 5.1);
  assert.equal(lendingCase('borrow').result.netAssets, 10000);
  assert.equal(lendingCase('conditions').result.end.debt, 5500);
  close(lendingCase('conditions').result.end.healthFactor, 8000 / 5500);
  close(lendingCase('respond').result.responses.repay.healthFactor, 1.5);
  close(lendingCase('respond').result.responses.add.healthFactor, 1.36);
});

test('all lending answer combinations check understanding independently of predictions', () => {
  const expected = { supply: ['separate', 'enable'], borrow: ['liability', 'boundary'], conditions: ['interest', 'backing-faster'], respond: ['tradeoff', 'none'] };
  for (const lesson of LENDING_LESSONS) {
    for (const [reason] of [...lesson.reasons, ['']]) for (const [application] of [...lesson.applications, ['']]) {
      const result = checkLendingUnderstanding(lesson.id, reason, application);
      assert.equal(result.passed, reason === expected[lesson.id][0] && application === expected[lesson.id][1]);
      assert.equal(result.reasoning, reason === expected[lesson.id][0]);
      assert.equal(result.application, application === expected[lesson.id][1]);
    }
    assert.ok(lesson.predictions.some(([id]) => id === lendingCase(lesson.id).prediction));
    assert.ok(lesson.reasons.every(([id]) => lesson.reasonFeedback[id]));
  }
});
