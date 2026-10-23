import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOP_DEFAULTS } from '../public/models/borrowing-loop-v1.js';
import { calculateLoopComparison } from '../public/models/loop-comparison.js';
import { loopHash, readLoopHash } from '../public/lib/loop-links.js';
import { loopComparison, loopRoundLabel } from '../public/lib/loop-presentation.js';
import { LOOP_DRAFT_KEY, readLoopDraft, saveLoopDraft } from '../public/data/loop-state.js';

const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('one versus three rounds shares every assumption and exposes the extra price sensitivity', () => {
  const input = Object.freeze({ ...LOOP_DEFAULTS, rounds: 3, future: 1500, swapCost: 0 });
  const pair = calculateLoopComparison(input, 1);
  assert.deepEqual(pair.reference.input, { ...input, rounds: 1 });
  assert.equal(pair.current.ownCapital, pair.reference.ownCapital);
  assert.equal(pair.current.holdingValue, pair.reference.holdingValue);
  assert.equal(pair.reference.end.netAssets, 6250);
  assert.equal(pair.current.end.netAssets, 5312.5);
  assert.equal(pair.current.end.debt - pair.reference.end.debt, 3750);
  assert.equal(pair.current.end.collateralTokens - pair.reference.end.collateralTokens, 1.875);
  assert.ok(pair.current.end.healthFactor < pair.reference.end.healthFactor);
  const flat = calculateLoopComparison({ ...input, future: input.start }, 1);
  assert.equal(flat.current.end.netAssets, flat.reference.end.netAssets);
  const rising = calculateLoopComparison({ ...input, future: 2500 }, 1);
  assert.equal(rising.current.end.netAssets - rising.reference.end.netAssets, 937.5);
  assert.match(loopComparison(pair.current.end.netAssets, pair.reference.end.netAssets, 'the reference').label, /less than the reference/);
});

test('rates, elapsed time and swap losses affect both sides; supply only is not holding', () => {
  const input = { ...LOOP_DEFAULTS, rounds: 3, days: 365, supplyAPR: 4, borrowAPR: 12, swapCost: 1 };
  const pair = calculateLoopComparison(input, 1);
  for (const result of [pair.current, pair.reference]) {
    close(result.end.collateralTokens, result.start.collateralTokens * Math.exp(0.04));
    close(result.end.debt, result.start.debt * Math.exp(0.12));
    close(result.start.netAssets, result.ownCapital - result.buildCosts);
  }
  const zero = calculateLoopComparison(input, 0).reference;
  close(zero.end.netAssets, 10000 * Math.exp(0.04));
  assert.ok(zero.end.netAssets > zero.holdingValue);
  assert.equal(zero.end.healthFactor, null);
  assert.equal(zero.end.boundaryPrice, null);
  assert.equal(loopRoundLabel(0), 'Supply only');
});

test('equal counts match exactly and adverse prices retain debt and pre-liquidation losses', () => {
  const equal = calculateLoopComparison(LOOP_DEFAULTS, LOOP_DEFAULTS.rounds);
  assert.deepEqual(equal.current, equal.reference);
  const crash = calculateLoopComparison({ ...LOOP_DEFAULTS, rounds: 3, future: 100 }, 1);
  for (const result of [crash.current, crash.reference]) {
    assert.ok(result.end.netAssets < 0);
    assert.ok(result.end.debt > 0);
    assert.equal(result.end.status, 'eligible');
    assert.equal(result.unwind.status, 'blocked');
  }
  for (const rounds of [-1, 6, 1.5, '', '1', null, undefined, NaN, Infinity]) {
    assert.throws(() => calculateLoopComparison(LOOP_DEFAULTS, rounds), RangeError);
  }
});

test('comparison links preserve zero and reject ambiguous reference metadata', () => {
  for (const comparisonRounds of [null, 0, 1, 5]) {
    assert.deepEqual(readLoopHash(loopHash(LOOP_DEFAULTS, comparisonRounds)), {
      status: 'ready', input: LOOP_DEFAULTS, comparisonRounds,
    });
  }
  const link = loopHash(LOOP_DEFAULTS);
  for (const value of ['', ' ', '-1', '6', '1.5', '01', '1e0', '1&compare=2', 'NaN']) {
    assert.equal(readLoopHash(link + '&compare=' + value).status, 'invalid');
  }
  for (const value of [-1, 6, 1.5, '1']) assert.throws(() => loopHash(LOOP_DEFAULTS, value), RangeError);
});

test('old drafts survive and malformed optional comparison metadata cannot erase a valid setup', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const get = () => storage;
  const input = { ...LOOP_DEFAULTS, collateral: 7, rounds: 4 };
  for (const comparisonRounds of [undefined, '3', 9, {}]) {
    data.set(LOOP_DRAFT_KEY, JSON.stringify({ version: 1, input, comparisonRounds }));
    assert.deepEqual(readLoopDraft(get), { input, comparisonRounds: null, status: 'ready' });
  }
  assert.equal(saveLoopDraft(input, get, 0), true);
  assert.equal(readLoopDraft(get).comparisonRounds, 0);
  const saved = data.get(LOOP_DRAFT_KEY);
  assert.equal(saveLoopDraft(input, get, 6), false);
  assert.equal(data.get(LOOP_DRAFT_KEY), saved);
  assert.equal(saveLoopDraft(input, get), true);
  assert.equal(readLoopDraft(get).comparisonRounds, null);
});
