import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenSceneState, rangeSceneState } from '../public/lib/liquidity-scene-state.js';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { managementCase } from '../public/models/range-decisions.js';

// The new presentation must preserve the existing model and the fixed question.
test('token frames explain both directions and returning to start without accumulating slider history', () => {
  for (let variant = 0; variant < 3; variant++) {
    const input = Object.freeze(lessonSetup('token-balances', variant));
    const question = runLesson('token-balances', input, variant);
    for (const factor of [2, .5, 1, 1.25, .75, 1]) {
      const frame = tokenSceneState(input, input.initialPrice * factor);
      assert.equal(frame.direction, factor > 1 ? 'up' : factor < 1 ? 'down' : 'same');
      const { held, pooled } = frame.result;
      if (factor > 1) {
        assert.ok(pooled.eth < held.eth && pooled.usdc > held.usdc);
        assert.match(frame.exchange, /USDC into the pool and take ETH out/);
      } else if (factor < 1) {
        assert.ok(pooled.eth > held.eth && pooled.usdc < held.usdc);
        assert.match(frame.exchange, /ETH into the pool and take USDC out/);
      } else assert.deepEqual(pooled, held);
      assert.equal(frame.result.fees, 0);
    }
    assert.deepEqual(tokenSceneState(input, input.futurePrice).result, question.result);
    assert.deepEqual(input, lessonSetup('token-balances', variant));
  }
});

test('range frames distinguish exact boundaries and retain single-token assets outside', () => {
  const { narrow, wide } = managementCase('range-width');
  Object.freeze(narrow); Object.freeze(wide);
  const cases = [
    [1400, 'Outside range', 'Outside range', 'ETH only', 'ETH only'],
    [1500, 'Outside range', 'At boundary', 'ETH only', 'ETH only'],
    [1900, 'At boundary', 'Inside range', 'ETH only', 'ETH + USDC'],
    [2000, 'Inside range', 'Inside range', 'ETH + USDC', 'ETH + USDC'],
    [2100, 'At boundary', 'Inside range', 'USDC only', 'ETH + USDC'],
    [2500, 'Outside range', 'At boundary', 'USDC only', 'USDC only'],
    [2800, 'Outside range', 'Outside range', 'USDC only', 'USDC only'],
  ];
  for (const [price, nState, wState, nTokens, wTokens] of cases) {
    const [n, w] = rangeSceneState(narrow, wide, price);
    assert.deepEqual([n.status, w.status, n.tokens, w.tokens], [nState, wState, nTokens, wTokens]);
    assert.deepEqual(n.result.initial, narrow.initial);
    assert.deepEqual(w.result.initial, wide.initial);
    assert.equal(n.result.fees + w.result.fees, 0);
    assert.ok(n.result.lpBeforeFees > 0 && w.result.lpBeforeFees > 0);
  }
  assert.notDeepEqual(narrow.initial, wide.initial, 'Equal funding must not become an identical starting basket.');
});

test('exploration returns exactly to each range question without changing its follow-up assumptions', () => {
  for (let variant = 0; variant < 3; variant++) {
    const question = managementCase('range-width', variant), before = structuredClone(question);
    rangeSceneState(question.narrow, question.wide, 2800);
    const [narrow, wide] = rangeSceneState(question.narrow, question.wide, question.price);
    assert.deepEqual(narrow.result, question.narrow);
    assert.deepEqual(wide.result, question.wide);
    assert.deepEqual(question, before);
  }
});
