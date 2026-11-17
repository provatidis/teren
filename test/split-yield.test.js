import assert from 'node:assert/strict';
import test from 'node:test';
import { DEPOSIT, SPLIT_DEFAULTS, SPLIT_MODEL, YT_FEE, grossYieldAt, splitAtMaturity } from '../public/models/split-yield-v1.js';
import { readSplitDraft, readSplitHash, readSplitSetup, saveSplitDraft, splitHash } from '../public/data/split-yield-state.js';
import { readExperimentLocation, saveExperimentLocation } from '../public/data/experiment-location.js';
import { YIELD_LESSONS } from '../public/learning/yield-lessons.js';

const model = overrides => splitAtMaturity({ ...SPLIT_DEFAULTS, ...overrides });

test('early-exit links preserve both assumptions and reject ambiguous or partial settings', () => {
  const exit = { exitDay: 0, exitApy: 137.25 };
  const maturity = splitHash(SPLIT_DEFAULTS);
  const hash = splitHash(SPLIT_DEFAULTS, exit);
  assert.equal(hash, maturity + '&exitDay=0&exitApy=137.25');
  assert.deepEqual(readSplitSetup(hash), { inputs: SPLIT_DEFAULTS, exit });
  assert.deepEqual(readSplitSetup(maturity), { inputs: SPLIT_DEFAULTS, exit: null });
  for (const suffix of ['&exitApy=0', '&exitDay=0&exitApy=', '&exitDay=90&exitDay=90',
    '&exitDay=91&exitApy=10', '&exitDay=45&exitApy=-3', '&exitDay=45&exitApy=Infinity']) {
    assert.throws(() => readSplitSetup(maturity + suffix));
  }
});

test('lesson links and saved exit setups restore on browsers without URLSearchParams.size', t => {
  const links = YIELD_LESSONS.map(lesson => new URL(lesson.experimentHref, 'https://teren.sh/'));
  const expected = links.map(link => readSplitSetup(link.hash));
  const size = Object.getOwnPropertyDescriptor(URLSearchParams.prototype, 'size');
  t.after(() => Object.defineProperty(URLSearchParams.prototype, 'size', size));
  delete URLSearchParams.prototype.size;

  for (const [index, link] of links.entries()) {
    assert.deepEqual(readSplitSetup(link.hash), expected[index], link.href);
    assert.throws(() => readSplitSetup(link.hash + '&days=90'));
    assert.throws(() => readSplitSetup(link.hash + '&extra=0'));
  }
  const inputs = { ...SPLIT_DEFAULTS, budget: 555, switchDay: 10 };
  const exit = { exitDay: 22, exitApy: 11 };
  const stored = new Map();
  const storage = () => ({ getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) });
  assert.equal(saveSplitDraft(splitHash(inputs, exit), storage), true);
  assert.deepEqual(readSplitDraft(storage), { status: 'saved', inputs, exit });
});

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), actual + ' ≠ ' + expected);
}

test('one deposit splits the upfront cost and retains principal, net yield and the yield fee', () => {
  // Independent decimal reference for (1.05^(80/365) * 1.15^(10/365) - 1).
  const r = model({});
  close(r.ptCost, 980); close(r.ytCost, 20);
  close(r.grossInterest, 14.62879757084504);
  close(r.netInterest, 13.897357692302789);
  close(r.netInterest - r.ytCost, -6.102642307697211);
  close(r.ptCost + r.ytCost, DEPOSIT);
  close(DEPOSIT + r.netInterest + YT_FEE * r.grossInterest, r.holdFinal);
  close(r.ptFinal, 1020.4081632653061);
  close(r.ytFinal, 694.8678846151394);
  close(r.holdFinal, 1014.628797570845);
});

test('the timing of the same rate rise can flip the YT result without changing PT redemption', () => {
  const early = model({ switchDay: 10 });
  const late = model({});
  close(early.netInterest, 30.861685170015454);
  close(early.ptFinal, late.ptFinal);
  assert.ok(late.ytFinal < late.holdFinal && early.ytFinal > early.holdFinal);
  const input = { ...SPLIT_DEFAULTS, firstApy: 10, secondApy: 0, days: 365, switchDay: 100 };
  close(grossYieldAt(input, 0), 0);
  close(grossYieldAt(input, 50), 1.1 ** (50 / 365) - 1);
  close(grossYieldAt(input, 365), grossYieldAt(input, 100));
  close(model({ days: 365, switchDay: 0 }).grossInterest, 150);
  close(model({ days: 365, switchDay: 365 }).grossInterest, 50);
  assert.throws(() => grossYieldAt(input, 366));
});

test('the two gross interest targets solve different equal-budget equalities', () => {
  const r = model({});
  close(r.recoverGross, 21.05263157894737);
  close(r.matchGross, 21.50537634408602);
  function atInterest(gross) {
    return model({ days: 365, switchDay: 365, firstApy: gross / DEPOSIT * 100 });
  }
  const recovered = atInterest(r.recoverGross);
  close(recovered.ytFinal, SPLIT_DEFAULTS.budget);
  assert.ok(recovered.ytFinal < recovered.holdFinal);
  const matched = atInterest(r.matchGross);
  close(matched.ytFinal, matched.holdFinal);
  const between = atInterest((r.recoverGross + r.matchGross) / 2);
  assert.ok(between.ytFinal > SPLIT_DEFAULTS.budget && between.ytFinal < between.holdFinal);
  for (const ytPrice of [0.95, 0.9999]) {
    const high = model({ ytPrice });
    assert.equal(high.matchGross, null);
    assert.ok(high.ytFinal < high.holdFinal);
  }
});

test('maturity APYs explain all three equal-budget comparisons over the selected term', () => {
  const r = model({});
  close(r.scenarioApy, 6.06671951738105);
  close(r.entryImpliedApy, 8.538330586413794);
  close(r.recoverApy, 8.816609419028476);
  close(r.matchApy, 9.012424009117995);
  close(r.ptMatchGross, 20.40816326530612);
  const flat = apy => model({ firstApy: apy, secondApy: apy });
  for (const [rate, strategy] of [[r.entryImpliedApy, 'ptFinal'], [r.matchApy, 'ytFinal']]) {
    const atTarget = flat(rate);
    close(atTarget.holdFinal, atTarget[strategy]);
  }
  close(flat(r.recoverApy).ytFinal, SPLIT_DEFAULTS.budget);
  const between = flat(8.9);
  close(between.scenarioApy, 8.9);
  assert.ok(between.ytFinal > SPLIT_DEFAULTS.budget);
  assert.ok(between.holdFinal > between.ptFinal && between.holdFinal > between.ytFinal);
});

test('an overflowing annual rate still has a finite interest target when matching is possible', () => {
  const short = { days: 1, switchDay: 0, firstApy: 100, secondApy: 0 };
  const expensive = model({ ...short, ytPrice: 0.94999999 });
  assert.equal(expensive.scenarioApy, 0);
  assert.equal(expensive.entryImpliedApy, null);
  assert.equal(expensive.matchApy, null);
  assert.ok(expensive.matchGross > 0 && Number.isFinite(expensive.matchGross));
  assert.ok(expensive.recoverApy > 0 && Number.isFinite(expensive.recoverApy));
  const unreachable = model({ ...short, ytPrice: 0.95 });
  assert.equal(unreachable.matchApy, null);
  assert.equal(unreachable.matchGross, null);
});

test('budget scales every strategy equally and zero underlying yield pays YT nothing', () => {
  const small = model({ budget: 1 });
  const large = model({ budget: 10000000 });
  for (const key of ['ptUnits', 'ytUnits', 'ptFinal', 'ytFinal', 'holdFinal']) close(large[key], small[key] * 10000000);
  for (const key of ['ytCost', 'ptCost', 'recoverGross', 'matchGross']) close(large[key], small[key]);
  const zero = model({ firstApy: 0, secondApy: 0 });
  assert.equal(zero.ytFinal, 0); assert.equal(zero.holdFinal, SPLIT_DEFAULTS.budget);
  assert.ok(zero.ptFinal > zero.holdFinal);
});

test('bounded inputs, fractional prices, short terms and switches at both endpoints', () => {
  for (const days of [1, 90, 730]) for (const switchDay of [0, days]) {
    for (const ytPrice of [0.0001, 0.02, 0.94999999, 0.9999]) {
      const r = model({ days, switchDay, ytPrice, firstApy: 100, secondApy: 0 });
      assert.ok(Object.values(r).every(v => v === null || Number.isFinite(v)));
    }
  }
  for (const invalid of [{ ytPrice: 0 }, { ytPrice: 1 }, { ytPrice: NaN }, { days: 0 }, { days: 2.5 },
    { switchDay: 91 }, { switchDay: -1 }, { firstApy: -1 }, { secondApy: Infinity }, { budget: '1000' }]) {
    assert.throws(() => model(invalid), RangeError);
    assert.throws(() => splitHash({ ...SPLIT_DEFAULTS, ...invalid }), RangeError);
  }
});

test('links and drafts round-trip exact inputs and preserve old data on read failure', () => {
  const inputs = { ...SPLIT_DEFAULTS, ytPrice: 0.023456, switchDay: 0, budget: 1234.56 };
  const hash = splitHash(inputs);
  assert.deepEqual(readSplitHash(hash), inputs);
  assert.equal(readSplitHash('#comparison'), null);
  for (const invalid of [hash + '&days=90', hash.replace('ytPrice=0.023456', 'ytPrice='), hash.replace('budget=', 'oops='),
    hash.replace(SPLIT_MODEL, 'unknown-v1'), hash.replace('switchDay=0', 'switchDay=91'), hash.replace('days=90', 'days=NaN')]) {
    assert.throws(() => readSplitHash(invalid));
  }
  const map = new Map();
  const storage = () => ({ getItem: key => map.get(key) ?? null, setItem: (key, v) => map.set(key, v) });
  assert.equal(readSplitDraft(storage).status, 'empty');
  assert.equal(saveSplitDraft(hash, storage), true);
  assert.deepEqual(readSplitDraft(storage).inputs, inputs);
  assert.equal(saveExperimentLocation(SPLIT_MODEL, hash, storage), true);
  assert.equal(readExperimentLocation(storage).route, 'yield.html' + hash);
  map.set('teren-split-yield-v1', 'broken');
  assert.equal(readSplitDraft(storage).status, 'invalid');
  assert.equal(map.get('teren-split-yield-v1'), 'broken');
  const blocked = () => { throw new Error('Storage unavailable'); };
  assert.equal(readSplitDraft(blocked).status, 'unavailable');
  assert.equal(saveSplitDraft(hash, blocked), false);
});
