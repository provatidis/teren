import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOP_DEFAULTS, calculateLoop } from '../public/models/borrowing-loop-v1.js';
import { loopCase } from '../public/models/loop-lessons.js';
import { loopFlowStages } from '../public/lib/loop-flow-stages.js';

const close = (actual, expected) => assert.ok(
  Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)),
  `${actual} != ${expected}`,
);

test('a zero-cost unwind moves assets without creating wealth, then separately withdraws debt-free ETH', () => {
  const result = calculateLoop({ ...LOOP_DEFAULTS, rounds: 3, swapCost: 0 });
  const actions = result.unwind.actions;
  assert.deepEqual(actions.map(step => step.action), ['withdraw', 'sell', 'repay', 'withdraw', 'sell', 'repay', 'release']);
  const [withdraw, sell, repay] = actions;
  // Hand-worked first pass: 95% of $7,812.50 headroom = $7,421.875.
  assert.equal(withdraw.position.walletETH, 3.7109375);
  assert.equal(withdraw.position.collateralTokens, 5.6640625);
  assert.equal(withdraw.position.debt, 8750);
  assert.equal(withdraw.position.cash, 0);
  assert.equal(sell.position.walletETH, 0);
  assert.equal(sell.position.cash, 7421.875);
  assert.equal(sell.position.debt, 8750);
  assert.equal(repay.position.cash, 0);
  assert.equal(repay.position.debt, 1328.125);
  for (const action of actions) {
    assert.equal(action.position.netAssets, 10000);
    assert.equal(action.costs, 0);
  }
  const paid = actions.at(-2).position, released = actions.at(-1).position;
  assert.equal(paid.debt, 0);
  assert.equal(paid.collateralTokens, 5);
  assert.equal(paid.walletETH, 0);
  assert.equal(released.collateralTokens, 0);
  assert.equal(released.walletETH, 5);
  assert.equal(released.healthFactor, null);
  assert.deepEqual(result.unwind.remaining, paid, 'Existing summary keeps the balance before the final wallet transfer.');
});

test('unwind sales charge costs while withdrawal and repayment keep assets minus debt unchanged', () => {
  const result = loopCase('unwind').result;
  let before = result.end, priorCosts = 0;
  for (const action of result.unwind.actions) {
    const after = action.position;
    close(after.netAssets, result.end.netAssets - action.costs);
    if (action.action === 'withdraw') {
      close(before.collateralTokens, after.collateralTokens + after.walletETH);
      assert.equal(after.debt, before.debt);
      assert.equal(after.cash, 0);
      assert.ok(after.healthFactor > 1);
      assert.ok(after.healthFactor < before.healthFactor);
    } else if (action.action === 'sell') {
      close(after.cash, before.walletETH * result.input.future * 0.997);
      close(before.netAssets - after.netAssets, action.costs - priorCosts);
      assert.ok(action.costs > priorCosts);
      assert.equal(after.walletETH, 0);
      assert.equal(after.debt, before.debt);
      assert.equal(after.healthFactor, before.healthFactor);
    } else if (action.action === 'repay') {
      close(before.debt - after.debt, before.cash);
      assert.equal(after.cash, 0);
      assert.equal(after.collateralTokens, before.collateralTokens);
      assert.ok(after.debt === 0 || after.healthFactor > before.healthFactor);
    } else {
      assert.equal(before.debt, 0);
      assert.equal(after.walletETH, before.collateralTokens);
      assert.equal(after.collateralTokens, 0);
    }
    if (action.action !== 'sell') {
      close(after.netAssets, before.netAssets);
      assert.equal(action.costs, priorCosts);
    }
    before = after; priorCosts = action.costs;
  }
  close(before.walletETH, 4.973755540421891);
  close(priorCosts, 26.283885406218587);
});

test('blocked, partial and debt-free previews never invent a completed release', () => {
  const base = calculateLoop(LOOP_DEFAULTS);
  for (const changes of [
    { future: base.end.boundaryPrice },
    { future: base.end.boundaryPrice * 0.99 },
    { future: base.end.boundaryPrice * (1 + 1e-12) },
    { rounds: 0 },
  ]) {
    const result = calculateLoop({ ...LOOP_DEFAULTS, ...changes });
    assert.notEqual(result.unwind.status, 'complete');
    assert.ok(result.unwind.actions.every(action => action.action !== 'release'));
    if (result.unwind.status !== 'limited') assert.deepEqual(result.unwind.actions, []);
    else {
      assert.ok(result.unwind.remaining.debt > 0);
      assert.deepEqual(result.unwind.actions.at(-1).position, result.unwind.remaining);
    }
    assert.throws(() => loopFlowStages(result, 'unwind'), RangeError);
  }
});

test('learning flows use ledger balances and distinguish sale, repayment and the final transfer', () => {
  for (const lesson of ['build', 'unwind']) {
    const result = loopCase(lesson).result;
    const flow = loopFlowStages(result, lesson);
    const ledger = lesson === 'build'
      ? [result.initial, ...result.steps.filter(step => step.round === 1).map(step => step.position)]
      : [result.end, ...result.unwind.actions.map(step => step.position)];
    assert.deepEqual(flow.stages.map(stage => stage.position), ledger);
  }
  const stages = loopFlowStages(loopCase('unwind').result, 'unwind').stages;
  assert.equal(stages.length, 8);
  assert.deepEqual(stages.map(stage => stage.action), ['start', 'withdraw', 'sell', 'repay', 'withdraw', 'sell', 'repay', 'release']);
  assert.deepEqual(loopFlowStages(loopCase('build').result, 'build').stages.map(stage => stage.action), ['start', 'borrow', 'buy', 'supply']);
  assert.equal(stages[4].pass, 'Pass 2 of 2');
  assert.equal(stages[7].pass, '');
  assert.equal(stages[2].changes.debt, 'Unchanged');
  assert.match(stages[6].copy, /still supplied/);
  assert.match(stages[7].copy, /now in your wallet/);
  assert.throws(() => loopFlowStages(loopCase('stress').result, 'stress'), RangeError);
});
