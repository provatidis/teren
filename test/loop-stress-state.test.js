import test from 'node:test';
import assert from 'node:assert/strict';
import { loopCase } from '../public/models/loop-lessons.js';
import { loopStressFrame } from '../public/lib/loop-stress-state.js';
import { healthLabel } from '../public/lib/lending-presentation.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
  `${actual} should equal ${expected}`);

test('holding and the three-round loop start with equal net value and different ETH exposure', () => {
  const { input } = loopCase('stress');
  const frame = loopStressFrame(input, 'price', 2000);
  assert.equal(frame.result.ownCapital, 10000);
  assert.equal(frame.holding.value, 10000);
  assert.equal(frame.loop.value, 10000);
  assert.equal(frame.holding.change, 0);
  assert.equal(frame.loop.change, 0);
  assert.equal(frame.holding.tokens, 5);
  assert.equal(frame.loop.tokens, 5 + 2.5 + 1.25 + .625);
  assert.equal(frame.result.end.debt, 5000 + 2500 + 1250);
  assert.equal(frame.result.end.cash, 0, 'Borrowed USDC was spent, not kept alongside the ETH.');
});

test('the fixed price-fall question preserves the model and shows loss even above the liquidation boundary', () => {
  const { input, result } = loopCase('stress');
  const frame = loopStressFrame(input, 'price', 1500);
  assert.deepEqual(frame.result, result);
  assert.equal(frame.holding.value, 7500);
  assert.equal(frame.loop.value, 5312.5);
  assert.equal(frame.holding.change, -2500);
  assert.equal(frame.loop.change, -4687.5);
  assert.equal(frame.result.end.status, 'above');
  assert.ok(frame.result.end.healthFactor > 1);
});

test('both gains and losses use the same starting capital and fixed token quantities', () => {
  const { input } = loopCase('stress');
  for (const price of [1000, 1500, 2000, 2500, 3000]) {
    const frame = loopStressFrame(input, 'price', price);
    assert.equal(frame.holding.tokens, 5);
    assert.equal(frame.loop.tokens, 9.375);
    assert.equal(frame.result.end.debt, 8750);
    close(frame.holding.change, 5 * (price - 2000));
    close(frame.loop.change, 9.375 * (price - 2000));
    assert.equal(frame.result.supplyInterestTokens, 0);
    assert.equal(frame.result.borrowInterest, 0);
    close(frame.loop.value + frame.result.end.debt, frame.loop.tokens * price);
  }
});

test('the exact and adjacent boundary cases retain pre-liquidation balances and truthful health labels', () => {
  const { input } = loopCase('stress');
  const boundary = 8750 / (9.375 * .8);
  for (const [price, status, label] of [
    [boundary - .01, 'eligible', '< 1.00'], [boundary, 'boundary', '1.00'], [boundary + .01, 'above', '> 1.00'],
  ]) {
    const frame = loopStressFrame(input, 'price', price);
    assert.equal(frame.result.end.status, status);
    assert.equal(healthLabel(frame.result.end.healthFactor), label);
    assert.equal(frame.result.end.debt, 8750);
    assert.equal(frame.loop.tokens, 9.375);
    close(frame.loop.value, 9.375 * price - 8750);
  }
});

test('time fixes price and supply while continuously compounded debt reduces net value and health', () => {
  const { input } = loopCase('stress');
  for (const days of [0, 1, 180, 365]) {
    const frame = loopStressFrame(input, 'time', days);
    const debt = 8750 * Math.exp(.1 * days / 365);
    assert.equal(frame.result.input.future, 2000);
    assert.equal(frame.result.input.supplyAPR, 0);
    assert.equal(frame.result.input.borrowAPR, 10);
    assert.equal(frame.result.input.interestMode, 'compound');
    assert.equal(frame.loop.tokens, 9.375);
    assert.equal(frame.result.supplyInterestTokens, 0);
    assert.equal(frame.holding.value, 10000);
    assert.equal(frame.holding.change, 0);
    close(frame.result.end.debt, debt);
    close(frame.loop.value, 18750 - debt);
    close(frame.loop.change, -(debt - 8750));
    close(frame.result.end.healthFactor, 15000 / debt);
    close(frame.result.end.boundaryPrice, debt / 7.5);
  }
});

test('one zero and dollar scale fit both price directions and every time frame', () => {
  const { input } = loopCase('stress');
  let maximum;
  for (const [mode, values] of [['price', [1000, 1500, 2000, 3000]], ['time', [0, 180, 365]]]) {
    for (const value of values) {
      const frame = loopStressFrame(input, mode, value);
      maximum ??= frame.maxChange;
      assert.equal(frame.maxChange, maximum);
      for (const position of [frame.holding, frame.loop]) assert.ok(Math.abs(position.change) < maximum);
    }
  }
});

test('reversals and mode changes do not compound previous frames, apply liquidation or mutate the question', () => {
  const { input, result } = loopCase('stress');
  const original = structuredClone(input);
  Object.freeze(input);
  const frame = loopStressFrame(input, 'price', 1500);
  loopStressFrame(input, 'price', 1000);
  loopStressFrame(input, 'time', 365);
  assert.deepEqual(loopStressFrame(input, 'price', 1500), frame);
  assert.deepEqual(frame.result, result);
  assert.deepEqual(input, original);
  assert.equal(loopStressFrame(input, 'time', 0).loop.value, 10000);
});

test('the fixed lesson rejects unsupported mechanics, modes and out-of-bounds values', () => {
  const { input } = loopCase('stress');
  for (const change of [{ rounds: 0 }, { rounds: 1 }, { days: 1 }, { swapCost: .3 }, { supplyAPR: 2 }, { borrowAPR: 5 }]) {
    assert.throws(() => loopStressFrame({ ...input, ...change }, 'price', 1500), RangeError);
  }
  for (const [mode, values] of [['price', [999, 3001]], ['time', [-1, 366]]]) {
    for (const value of [...values, NaN, Infinity, '1000']) assert.throws(() => loopStressFrame(input, mode, value), RangeError);
  }
  assert.throws(() => loopStressFrame(input, 'both', 1500), RangeError);
});
