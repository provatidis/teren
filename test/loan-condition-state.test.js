import test from 'node:test';
import assert from 'node:assert/strict';
import { lendingCase } from '../public/models/lending-lessons.js';
import { loanConditionFrame } from '../public/lib/loan-condition-state.js';
import { healthLabel } from '../public/lib/lending-presentation.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
  `${actual} should equal ${expected}`);

test('time isolates debt interest while price, supply, collateral rules and wallet cash stay fixed', () => {
  const { input } = lendingCase('conditions');
  let priorDebt = 0;
  for (const days of [0, 1, 180, 365]) {
    const frame = loanConditionFrame(input, 'time', days), { result } = frame;
    assert.equal(result.input.days, days);
    assert.equal(result.input.future, 2000);
    assert.equal(result.end.collateralTokens, 5);
    assert.equal(result.end.collateralValue, 10000);
    assert.equal(frame.backing, 8000);
    assert.equal(result.borrowedCash, 5000);
    close(result.end.debt, 5000 + 500 * days / 365);
    close(result.end.healthFactor, 8000 / result.end.debt);
    assert.ok(result.end.debt > priorDebt);
    priorDebt = result.end.debt;
    assert.deepEqual(frame.reference, { backing: 8000, debt: 5000, health: 1.6 });
  }
});

test('the complete year matches the assessed model and the initial price comparison', () => {
  const { input, result } = lendingCase('conditions');
  const year = loanConditionFrame(input, 'time', 365);
  const priceStart = loanConditionFrame(input, 'price', 2000);
  assert.deepEqual(year.result, result);
  assert.deepEqual(priceStart.result, result);
  assert.equal(year.result.end.debt, 5500);
  assert.equal(year.result.borrowInterest, 500);
  close(year.result.end.healthFactor, 16 / 11);
  assert.equal(year.questionBoundary, 1375);
  assert.equal(priceStart.reference.debt, 5500);
  assert.equal(priceStart.reference.health, result.end.healthFactor);
});

test('price changes only value after one year; a fall never removes tokens or repays debt', () => {
  const { input } = lendingCase('conditions');
  for (const price of [1000, 1370, 1375, 1380, 1500, 2000, 3000]) {
    const frame = loanConditionFrame(input, 'price', price), { result } = frame;
    assert.equal(result.input.days, 365);
    assert.equal(result.end.collateralTokens, 5);
    assert.equal(result.end.debt, 5500);
    assert.equal(result.borrowedCash, 5000);
    assert.equal(result.end.collateralValue, price * 5);
    close(frame.backing, price * 4);
    close(result.end.healthFactor, price * 4 / 5500);
    assert.equal(result.end.status, price < 1375 ? 'eligible' : price === 1375 ? 'boundary' : 'above');
    assert.equal(frame.reference.backing, 8000);
    assert.equal(frame.reference.debt, 5500);
  }
});

test('equal bar lengths represent health factor one, with truthful labels on either side', () => {
  const { input } = lendingCase('conditions');
  const boundary = loanConditionFrame(input, 'price', 1375);
  assert.equal(boundary.backing, boundary.result.end.debt);
  assert.equal(boundary.result.end.healthFactor, 1);
  assert.equal(healthLabel(boundary.result.end.healthFactor), '1.00');
  assert.equal(healthLabel(loanConditionFrame(input, 'price', 1370).result.end.healthFactor), '< 1.00');
  assert.equal(healthLabel(loanConditionFrame(input, 'price', 1380).result.end.healthFactor), '> 1.00');
});

test('both bars and their comparison markers share one stable dollar scale', () => {
  const { input } = lendingCase('conditions');
  const maximum = loanConditionFrame(input, 'time', 0).maxValue;
  for (const [mode, values] of [['time', [0, 365]], ['price', [1000, 1375, 3000]]]) {
    for (const value of values) {
      const frame = loanConditionFrame(input, mode, value);
      assert.equal(frame.maxValue, maximum);
      for (const amount of [frame.backing, frame.result.end.debt, frame.reference.backing, frame.reference.debt]) {
        assert.ok(amount > 0 && amount <= maximum);
      }
      close((frame.backing / maximum) / (frame.result.end.debt / maximum), frame.result.end.healthFactor);
    }
  }
});

test('returning from a below-boundary comparison does not invent liquidation or a price history', () => {
  const { input, result } = lendingCase('conditions');
  const original = structuredClone(input);
  Object.freeze(input);
  const before = loanConditionFrame(input, 'price', 2000);
  loanConditionFrame(input, 'price', 1000);
  assert.deepEqual(loanConditionFrame(input, 'price', 2000), before);
  assert.deepEqual(loanConditionFrame(input, 'time', 365).result, result);
  assert.deepEqual(input, original);
});

test('the lesson adapter rejects unsupported mechanisms, modes and exploration bounds', () => {
  const { input } = lendingCase('conditions');
  for (const change of [{ days: 180 }, { future: 1500 }, { supplyAPR: 2 }, { borrowAPR: 0 }, { borrow: 0 }, { collateralEnabled: false }]) {
    assert.throws(() => loanConditionFrame({ ...input, ...change }, 'time', 0), RangeError);
  }
  for (const [mode, values] of [['time', [-1, 366]], ['price', [999, 3001]]]) {
    for (const value of [...values, NaN, Infinity, '1000']) {
      assert.throws(() => loanConditionFrame(input, mode, value), RangeError);
    }
  }
  assert.throws(() => loanConditionFrame(input, 'both', 1000), RangeError);
});
