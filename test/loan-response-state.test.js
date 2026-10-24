import test from 'node:test';
import assert from 'node:assert/strict';
import { lendingCase } from '../public/models/lending-lessons.js';
import { loanResponseFrame } from '../public/lib/loan-response-state.js';
import { healthLabel } from '../public/lib/lending-presentation.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
  `${actual} should equal ${expected}`);

test('zero outside budget leaves both alternatives at the same original loan', () => {
  const { input, result } = lendingCase('respond');
  const frame = loanResponseFrame(input, 0);
  for (const method of ['repay', 'add']) {
    const position = frame[method];
    for (const key of Object.keys(result.end)) assert.equal(position[key], result.end[key]);
    assert.equal(position.spent, 0);
    assert.equal(position.unused, 0);
    assert.equal(position.backing, 6000);
  }
  assert.equal(frame.result.borrowedCash, 5000);
  assert.equal(frame.result.borrowInterest, 0);
});

test('the question budget reduces debt or adds ETH without changing price, rules or borrowed cash', () => {
  const { input, result } = lendingCase('respond');
  const frame = loanResponseFrame(input, 1000);
  assert.deepEqual(frame.result, result);
  assert.equal(frame.repay.collateralTokens, 5);
  assert.equal(frame.repay.debt, 4000);
  assert.equal(frame.repay.backing, 6000);
  assert.equal(frame.repay.healthFactor, 1.5);
  close(frame.add.collateralTokens, 5 + 1000 / 1500);
  assert.equal(frame.add.debt, 5000);
  assert.equal(frame.add.backing, 6800);
  assert.equal(frame.add.healthFactor, 1.36);
  assert.equal(frame.result.input.future, input.future);
  assert.equal(frame.result.input.threshold, input.threshold);
  assert.equal(frame.result.borrowedCash, 5000);
});

test('each response uses the outside budget once and conserves assets minus debt including unused cash', () => {
  const { input, result } = lendingCase('respond');
  for (const budget of [0, 50, 1000, 4950, 5000, 5050, 6000]) {
    const frame = loanResponseFrame(input, budget);
    for (const method of ['repay', 'add']) {
      const position = frame[method];
      close(position.spent + position.unused, budget);
      const net = position.collateralValue + frame.result.borrowedCash + position.unused - position.debt;
      close(net, result.netAssets + budget);
    }
    assert.equal(frame.add.debt, result.end.debt);
    assert.equal(frame.repay.collateralTokens, result.end.collateralTokens);
  }
});

test('full repayment removes the loan boundary without selling or withdrawing the ETH', () => {
  const { input } = lendingCase('respond');
  assert.notEqual(loanResponseFrame(input, 4950).repay.healthFactor, null);
  for (const budget of [5000, 5050, 6000]) {
    const { repay, add } = loanResponseFrame(input, budget);
    assert.equal(repay.debt, 0);
    assert.equal(repay.healthFactor, null);
    assert.equal(healthLabel(repay.healthFactor), 'No debt');
    assert.equal(repay.boundaryPrice, null);
    assert.equal(repay.status, 'no-debt');
    assert.equal(repay.collateralTokens, 5);
    assert.equal(repay.spent, 5000);
    assert.equal(repay.unused, budget - 5000);
    assert.equal(add.unused, 0);
    assert.equal(add.debt, 5000);
  }
});

test('bar values and before-response markers share one stable dollar scale in both branches', () => {
  const { input } = lendingCase('respond');
  let maximum;
  for (const budget of [0, 1000, 4950, 5000, 6000]) {
    const frame = loanResponseFrame(input, budget);
    maximum ??= frame.maxValue;
    assert.equal(frame.maxValue, maximum);
    assert.deepEqual(frame.reference, { backing: 6000, debt: 5000 });
    for (const method of ['repay', 'add']) {
      const position = frame[method];
      assert.ok(position.backing <= maximum && position.debt <= maximum);
      if (position.debt) close(position.backing / position.debt, position.healthFactor);
    }
  }
});

test('returning to a smaller budget starts again from the original loan', () => {
  const { input, result } = lendingCase('respond');
  const original = structuredClone(input);
  Object.freeze(input);
  const first = loanResponseFrame(input, 1000);
  loanResponseFrame(input, 6000);
  assert.deepEqual(loanResponseFrame(input, 1000), first);
  assert.deepEqual(first.result, result);
  assert.deepEqual(input, original);
});

test('the response scene rejects invalid budgets and setups outside its immediate pre-liquidation scope', () => {
  const { input } = lendingCase('respond');
  for (const budget of [-1, 6001, NaN, Infinity, '1000']) {
    assert.throws(() => loanResponseFrame(input, budget), RangeError);
  }
  for (const change of [{ days: 1 }, { future: 1250 }, { future: 1000 }, { borrow: 0 }, { collateralEnabled: false }]) {
    assert.throws(() => loanResponseFrame({ ...input, ...change }, 1000), RangeError);
  }
});
