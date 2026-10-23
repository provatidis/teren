import test from 'node:test';
import assert from 'node:assert/strict';
import { swapSceneState, depositSceneState } from '../public/lib/foundation-scene-state.js';
import { lessonSetup } from '../public/models/lesson-experiments.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
  `${actual} should equal ${expected}`);

test('the swap scene preserves the exact quote, token transfers and retained fee', () => {
  const frame = swapSceneState(lessonSetup('swap-impact'));
  assert.equal(frame.out, 18132.217877);
  assert.deepEqual(frame.before, { eth: 100, usdc: 200000 });
  assert.deepEqual(frame.after, { eth: 110, usdc: 181867.782123 });
  close(frame.average, 1813.2217877);
  close(frame.referenceAverage, 1974.316068);
  close(frame.afterPrice, 1653.3434738454546);
  close(frame.after.eth - frame.before.eth, frame.amount);
  close(frame.before.usdc - frame.after.usdc, frame.out);
  assert.ok(frame.after.eth * frame.after.usdc > frame.before.eth * frame.before.usdc,
    'The complete ETH input stays in the pool, including its retained swap fee.');
});

test('larger swaps receive more USDC in total and less per ETH in every variation', () => {
  for (let variant = 0; variant < 3; variant++) {
    const input = Object.freeze(lessonSetup('swap-impact', variant));
    const small = swapSceneState(input, 1, variant);
    const large = swapSceneState(input, input.reserveEth / 2, variant);
    assert.ok(large.out > small.out);
    assert.ok(large.average < small.average && small.average < small.beforePrice);
    assert.ok(large.afterPrice < small.afterPrice);
    assert.equal(small.average, small.referenceAverage);
    assert.deepEqual(large.before, small.before);
    assert.deepEqual(swapSceneState(input, 1, variant), small,
      'Exploration returns to the same fresh trade without accumulating swaps.');
    assert.deepEqual(input, lessonSetup('swap-impact', variant));
  }
});

test('a matching deposit preserves price and owns a fraction of the enlarged pool', () => {
  const frame = depositSceneState(lessonSetup('pool-share'));
  assert.deepEqual(frame.deposit, { eth: 5, usdc: 10000 });
  assert.deepEqual(frame.after, { eth: 105, usdc: 210000 });
  close(frame.fraction, 1 / 21);
  assert.deepEqual(frame.initialClaim, frame.deposit);
  assert.equal(frame.after.usdc / frame.after.eth, 2000);
  assert.equal(frame.tradeETH, 10);
  assert.equal(frame.tradeUSDC, 18210.837609);
  assert.deepEqual(frame.traded, { eth: 115, usdc: 191789.162391 });
  close(frame.laterClaim.eth, 115 / 21);
  close(frame.laterClaim.usdc, 191789.162391 / 21);
});

test('a separate later trade changes an LP claim without changing its percentage', () => {
  for (let variant = 0; variant < 3; variant++) {
    const input = Object.freeze(lessonSetup('pool-share', variant));
    for (const amount of [1, input.depositEth, input.reserveEth / 2, 1]) {
      const frame = depositSceneState(input, amount, variant);
      close(frame.after.usdc / frame.after.eth, input.initialPrice);
      close(frame.initialClaim.eth, amount);
      close(frame.initialClaim.usdc, amount * input.initialPrice);
      assert.ok(frame.laterClaim.eth > frame.initialClaim.eth);
      assert.ok(frame.laterClaim.usdc < frame.initialClaim.usdc);
      close(frame.traded.eth - frame.after.eth, frame.tradeETH);
      close(frame.after.usdc - frame.traded.usdc, frame.tradeUSDC);
      for (const token of ['eth', 'usdc']) {
        close(frame.laterClaim[token] / frame.traded[token], frame.fraction);
        close(frame.laterClaim[token] + frame.traded[token] * (1 - frame.fraction), frame.traded[token]);
      }
      assert.ok(frame.traded.eth * frame.traded.usdc > frame.after.eth * frame.after.usdc);
      assert.deepEqual(frame.before, { eth: input.reserveEth, usdc: input.reserveEth * input.initialPrice });
    }
    assert.deepEqual(input, lessonSetup('pool-share', variant));
  }
});

test('foundation scenes reject unsupported amounts rather than display a different question', () => {
  for (const [id, scene] of [['swap-impact', swapSceneState], ['pool-share', depositSceneState]]) {
    const input = lessonSetup(id);
    for (const amount of [0, -1, 1.5, 51, Infinity, NaN]) assert.throws(() => scene(input, amount));
    assert.throws(() => scene(input, 1, 3));
  }
});
