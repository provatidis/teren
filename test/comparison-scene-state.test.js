import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonSceneState } from '../public/lib/comparison-scene-state.js';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('dollar profit can coexist with a loss against the exact starting basket', () => {
  const input = lessonSetup('loss-vs-profit');
  const state = comparisonSceneState(input, 4000);
  near(state.result.lpBeforeFees, 5000 * Math.sqrt(2));
  assert.equal(state.result.holdValue, 7500);
  assert.equal(state.versusStart, 'above');
  assert.equal(state.versusHolding, 'below');
  near(state.fromStart, 2071.067811865475);
  assert.deepEqual(state.result.held, { eth: 1.25, usdc: 2500 });
});

test('a falling price loses dollars as well as trailing holding; unchanged price matches both', () => {
  const input = lessonSetup('loss-vs-profit');
  const lower = comparisonSceneState(input, 1000);
  assert.equal(lower.versusStart, 'below'); assert.equal(lower.versusHolding, 'below');
  assert.equal(lower.result.holdValue, 3750);
  const unchanged = comparisonSceneState(input, 2000);
  assert.equal(unchanged.versusStart, 'equal'); assert.equal(unchanged.versusHolding, 'equal');
  assert.equal(unchanged.result.breakEvenFees, 0);
});

test('cash fees close the holding gap without altering the LP principal or token basket', () => {
  for (let variant = 0; variant < 3; variant++) {
    const input = lessonSetup('fee-break-even', variant);
    const before = comparisonSceneState(input, input.futurePrice);
    const target = before.result.breakEvenFees;
    for (const [fees, relation] of [[0, 'below'], [target / 2, 'below'], [target, 'equal'], [target + 1, 'above']]) {
      const after = comparisonSceneState(input, input.futurePrice, fees);
      assert.equal(after.versusHolding, relation);
      assert.deepEqual(after.result.pooled, before.result.pooled);
      assert.deepEqual(after.result.held, before.result.held);
      assert.equal(after.result.lpBeforeFees, before.result.lpBeforeFees);
      near(after.result.lpValue - before.result.lpValue, fees);
    }
  }
});

test('matching holding after a price fall can still mean a dollar loss', () => {
  const input = lessonSetup('fee-break-even', 1);
  const target = comparisonSceneState(input, input.futurePrice).result.breakEvenFees;
  const state = comparisonSceneState(input, input.futurePrice, target);
  assert.equal(state.versusHolding, 'equal'); assert.equal(state.versusStart, 'below');
});

test('fixed scale contains every supported price/fee corner and does not rescale between frames', () => {
  for (let variant = 0; variant < 3; variant++) {
    const input = lessonSetup('final-challenge', variant);
    for (const factor of [.5, .75, 1, 1.5, 2]) {
      for (const fees of [0, input.fees, input.investment / 2]) {
        const state = comparisonSceneState(input, input.initialPrice * factor, fees);
        assert.equal(state.ceiling, input.investment * 2);
        assert.ok(state.result.lpValue < state.ceiling && state.result.holdValue < state.ceiling);
      }
    }
  }
});

test('exploration neither accumulates history nor changes assessed inputs, including fractional saved values', () => {
  for (const id of ['loss-vs-profit', 'fee-break-even', 'final-challenge']) {
    for (let variant = 0; variant < 3; variant++) {
      const input = Object.freeze({ ...lessonSetup(id, variant), futurePrice: lessonSetup(id, variant).initialPrice * 1.016625 });
      const before = structuredClone(input);
      const question = runLesson(id, input, variant);
      comparisonSceneState(input, input.initialPrice / 2, input.investment / 2);
      comparisonSceneState(input, input.initialPrice * 2, 0);
      assert.deepEqual(comparisonSceneState(input, input.futurePrice, input.fees).result, question.result);
      assert.deepEqual(input, before);
    }
  }
});

test('the scene rejects inputs outside its dollar-scale bounds and invalid model values', () => {
  const input = lessonSetup('final-challenge');
  for (const [price, fees] of [[999, 0], [4001, 0], [2000, 2501], [NaN, 0], [2000, -1]]) {
    assert.throws(() => comparisonSceneState(input, price, fees));
  }
});
