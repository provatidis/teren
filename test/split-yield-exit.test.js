import assert from 'node:assert/strict';
import test from 'node:test';
import { DEPOSIT, SPLIT_DEFAULTS, YT_FEE, splitAtMaturity } from '../public/models/split-yield-v1.js';
import { defaultYieldExit, splitAtExit, yieldExitErrors } from '../public/models/split-yield-exit-v1.js';

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-11 * Math.max(1, Math.abs(expected)), actual + ' ≠ ' + expected);
}

test('same-budget midterm sale: YT sale and earned interest belong on separate lines', () => {
  // High-precision decimal reference: 1.10^(-45/365) for the principal,
  // 1.05^(45/365) for the asset growth. The 5% fee applies only to interest.
  const r = splitAtExit(SPLIT_DEFAULTS, defaultYieldExit(90));
  assert.equal(r.remainingDays, 45);
  close(r.entryImpliedApy, 8.538330586413785);
  close(r.ptPrice, 0.9883181982168832);
  close(r.ytPrice, 0.011681801783116824);
  close(r.ptSale, 1008.4879573641665);
  close(r.ytSale, 584.0900891558411);
  close(r.ytInterest, 286.5842921583098);
  close(r.ytTotal, 870.6743813141509);
  close(r.holdValue, 1006.0333535191223);
  close(r.unchangedPtPrice, 0.9899494936611665);
  close(r.unchangedYtTotal, 789.1096090999831);
  assert.ok(r.ptSale < r.unchangedPtSale && r.ptSale > SPLIT_DEFAULTS.budget);
  assert.ok(r.ytTotal > r.unchangedYtTotal && r.ytTotal < SPLIT_DEFAULTS.budget);
});

test('same-day repricing transfers sale value between the paired claims, without changing earned interest', () => {
  const input = { ...SPLIT_DEFAULTS, days: 500, switchDay: 100 };
  for (const exitDay of [0, 99, 100, 101, 470]) {
    const low = splitAtExit(input, { exitDay, exitApy: 0 });
    const high = splitAtExit(input, { exitDay, exitApy: 300 });
    assert.equal(low.ptPrice, 1);
    assert.equal(low.ytPrice, 0);
    assert.equal(low.ytTotal, low.ytInterest);
    assert.ok(low.ptPrice > high.ptPrice && low.ytPrice < high.ytPrice);
    assert.equal(low.holdValue, high.holdValue);
    assert.equal(low.ytInterest, high.ytInterest);
    close(high.ptPrice + high.ytPrice, 1);
    // Buying *matched* claims in the original cost proportions gives the
    // unsplit asset less the fee on earned yield only, at either sale rate.
    for (const r of [low, high]) {
      const paired = (1 - input.ytPrice) * r.ptSale + input.ytPrice * r.ytTotal;
      close(paired, r.holdValue - YT_FEE * (r.holdValue - input.budget));
    }
  }
});

test('at purchase all unchanged-rate strategies start equal; at expiry every sale rate matches maturity', () => {
  for (const days of [1, 90, 730]) {
    const input = { ...SPLIT_DEFAULTS, days, switchDay: Math.floor(days / 2) };
    const start = splitAtExit(input, { exitDay: 0, exitApy: 10 });
    close(start.unchangedPtSale, input.budget);
    close(start.unchangedYtTotal, input.budget);
    assert.equal(start.holdValue, input.budget);
    assert.equal(start.ytInterest, 0);
    const m = splitAtMaturity(input);
    for (const exitApy of [0, 100, Number.MAX_VALUE]) {
      const end = splitAtExit(input, { exitDay: days, exitApy });
      assert.equal(end.ptPrice, 1);
      assert.equal(end.ytPrice, 0);
      close(end.ptSale, m.ptFinal);
      close(end.ytTotal, m.ytFinal);
      close(end.holdValue, m.holdFinal);
    }
  }
});

test('varying the remaining time changes the marks at an unchanged rate; future interest is never credited', () => {
  const before = splitAtExit(SPLIT_DEFAULTS, { exitDay: 10, exitApy: 10 });
  const after = splitAtExit(SPLIT_DEFAULTS, { exitDay: 75, exitApy: 10 });
  assert.ok(before.unchangedPtPrice < after.unchangedPtPrice && before.unchangedYtPrice > after.unchangedYtPrice);
  assert.deepEqual(after, splitAtExit({ ...SPLIT_DEFAULTS, secondApy: 100 }, { exitDay: 75, exitApy: 10 }));
  const zero = splitAtExit({ ...SPLIT_DEFAULTS, firstApy: 0 }, { exitDay: 75, exitApy: 5 });
  assert.equal(zero.ytInterest, 0);
  assert.ok(zero.ytSale > 0);
  assert.equal(zero.holdValue, SPLIT_DEFAULTS.budget);
});

test('extreme purchase discounts still have a valid same-rate mark, even when annualization overflows', () => {
  const input = { ...SPLIT_DEFAULTS, days: 2, switchDay: 0, ytPrice: 0.9999 };
  const r = splitAtExit(input, { exitDay: 1, exitApy: 10 });
  assert.equal(r.entryImpliedApy, null);
  close(r.unchangedPtPrice, 0.01);
  close(r.unchangedYtPrice, 0.99);
  for (const days of [1, 2, 730]) for (const ytPrice of [0.0001, 0.9999]) {
    for (const exitDay of [0, Math.floor(days / 2), days]) for (const exitApy of [0, 100, Number.MAX_VALUE]) {
      const r = splitAtExit({ ...input, days, ytPrice, budget: DEPOSIT * 10000 }, { exitDay, exitApy });
      assert.ok(Object.values(r).every(v => v === null || Number.isFinite(v)));
    }
  }
});

test('sale assumptions reject missing, nonnumeric and out-of-bounds values without changing the entry', () => {
  for (const exit of [null, {}, { exitDay: -1, exitApy: 10 }, { exitDay: 91, exitApy: 10 },
    { exitDay: 1.1, exitApy: 10 }, { exitDay: 45, exitApy: NaN }, { exitDay: 45, exitApy: '10' },
    { exitDay: 45, exitApy: -1 }, { exitDay: 45, exitApy: Infinity }, { exitDay: 45, exitApy: null }]) {
    assert.ok(Object.keys(yieldExitErrors(SPLIT_DEFAULTS, exit)).length);
    assert.throws(() => splitAtExit(SPLIT_DEFAULTS, exit), RangeError);
  }
  assert.throws(() => splitAtExit({ ...SPLIT_DEFAULTS, budget: 0 }, defaultYieldExit(90)), RangeError);
});
