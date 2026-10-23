import test from 'node:test';
import assert from 'node:assert/strict';
import { LOAN_DEFAULTS } from '../public/models/collateral-loan-v1.js';
import { singleLiquidation, interestReference, healthPriceCurve, validateLiquidation } from '../public/models/loan-explanations.js';
import { loanHash, readLoanHash } from '../public/lib/lending-links.js';
import { readLiquidationDraft, saveLiquidationDraft } from '../public/data/lending-state.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), actual + ' ≠ ' + expected);

test('one liquidation reduces debt and collateral; net loss is the bonus, not everything seized', () => {
  const result = singleLiquidation({ ...LOAN_DEFAULTS, future: 1200 });
  assert.equal(result.repaid, 2500);
  assert.equal(result.removedValue, 2625);
  assert.equal(result.removedTokens, 2.1875);
  assert.equal(result.remainingTokens, 2.8125);
  assert.equal(result.remainingDebt, 2500);
  assert.equal(result.penalty, 125);
  assert.equal(result.beforeNetAssets, 6000);
  assert.equal(result.netAssets, 5875);
  close(result.remainingHealth, 1.08);
});

test('exact boundary and zero debt do not execute a liquidation', () => {
  assert.equal(singleLiquidation({ ...LOAN_DEFAULTS, future: 1250 }).status, 'ineligible');
  assert.equal(singleLiquidation({ ...LOAN_DEFAULTS, borrow: 0, future: 1 }).status, 'ineligible');
});

test('a crash caps repayment at available collateral and exposes remaining debt', () => {
  const result = singleLiquidation({ ...LOAN_DEFAULTS, future: 300 });
  assert.equal(result.exhausted, true);
  assert.equal(result.remainingTokens, 0);
  close(result.repaid, 1500 / 1.05);
  close(result.remainingDebt, 5000 - 1500 / 1.05);
  close(result.netAssets, 1500 - result.penalty);
  assert.equal(result.remainingHealth, 0);
});

test('zero bonus, full repayment, accrued debt and finite extremes preserve the balance sheet', () => {
  for (const changes of [{ future: 1200 }, { future: 1000, days: 365 }, { future: 0.01, days: 1825, borrowAPR: 100 }]) {
    for (const assumptions of [{ repayPercent: 100, bonusPercent: 0 }, { repayPercent: 1, bonusPercent: 30 }]) {
      const result = singleLiquidation({ ...LOAN_DEFAULTS, ...changes }, assumptions);
      assert.ok(result.remainingTokens >= 0 && result.remainingDebt >= 0);
      close(result.beforeNetAssets - result.netAssets, result.penalty);
      close(result.removedValue, result.repaid + result.penalty);
    }
  }
  const result = singleLiquidation({ ...LOAN_DEFAULTS, future: 1200 }, { repayPercent: 100, bonusPercent: 5 });
  assert.equal(result.remainingDebt, 0);
  assert.equal(result.remainingHealth, null);
});

test('liquidation assumptions reject non-finite and out-of-range inputs without mutating the loan', () => {
  for (const assumptions of [{ repayPercent: NaN, bonusPercent: 5 }, { repayPercent: 0, bonusPercent: 5 }, { repayPercent: 50, bonusPercent: -1 }]) {
    assert.ok(Object.keys(validateLiquidation(assumptions)).length);
    assert.throws(() => singleLiquidation(LOAN_DEFAULTS, assumptions), RangeError);
  }
  assert.doesNotThrow(() => singleLiquidation(Object.freeze({ ...LOAN_DEFAULTS, future: 1200 })));
});

test('continuous compounding reference exposes the long-period simple-interest difference', () => {
  const result = interestReference({ ...LOAN_DEFAULTS, borrowAPR: 100, days: 1825 });
  assert.equal(result.simpleDebt, 30000);
  close(result.compoundedDebt, 5000 * Math.exp(5));
  assert.equal(interestReference({ ...LOAN_DEFAULTS, days: 0 }).difference, 0);
  assert.equal(interestReference({ ...LOAN_DEFAULTS, borrow: 0, days: 365 }).compoundedDebt, 0);
});

test('health curve spans the selected price and boundary at fixed accrued balances', () => {
  const input = { ...LOAN_DEFAULTS, days: 365, future: 300 };
  const curve = healthPriceCurve(input);
  assert.ok(curve.maxPrice > curve.boundaryPrice && curve.maxPrice > input.future);
  close(5.1 * curve.boundaryPrice * 0.8 / 5250, 1);
  close(curve.selectedHealth, 5.1 * 300 * 0.8 / 5250);
  assert.equal(healthPriceCurve({ ...input, borrow: 0 }), null);
});

test('event links retain their own assumptions while older loan links keep their original shape', () => {
  const liquidation = { repayPercent: 25, bonusPercent: 8 };
  const hash = loanHash(LOAN_DEFAULTS, liquidation);
  assert.deepEqual(readLoanHash(hash), { status: 'ready', input: LOAN_DEFAULTS, liquidation });
  assert.deepEqual(readLoanHash(loanHash(LOAN_DEFAULTS)), { status: 'ready', input: LOAN_DEFAULTS });
  for (const invalid of [hash + '&bonusPercent=5', hash.replace('bonusPercent=8', 'bonusPercent='), hash.replace('single-liquidation-v1', 'unknown'), loanHash(LOAN_DEFAULTS) + '&repayPercent=50']) {
    assert.equal(readLoanHash(invalid).status, 'invalid');
  }
});

test('event drafts preserve the last valid assumptions and blocked storage falls back to defaults', () => {
  const data = new Map();
  const storage = () => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) });
  const input = { repayPercent: 25, bonusPercent: 8 };
  assert.equal(saveLiquidationDraft(input, storage), true);
  assert.equal(saveLiquidationDraft({ ...input, bonusPercent: NaN }, storage), false);
  assert.deepEqual(readLiquidationDraft(storage), input);
  assert.deepEqual(readLiquidationDraft(() => { throw new Error('blocked'); }), { repayPercent: 50, bonusPercent: 5 });
});
