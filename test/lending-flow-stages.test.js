import test from 'node:test';
import assert from 'node:assert/strict';
import { lendingFlowStages } from '../public/lib/lending-flow-stages.js';
import { lendingCase } from '../public/models/lending-lessons.js';
import { calculateLoan } from '../public/models/collateral-loan-v1.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
  `${actual} should equal ${expected}`);

test('supplying transfers wallet ETH into a pool claim without creating money or debt', () => {
  const { result } = lendingCase('supply');
  const [wallet, supply] = lendingFlowStages(result, 'supply').stages.map(stage => stage.position);
  assert.equal(wallet.walletETH, 5);
  assert.equal(wallet.suppliedETH, 0);
  assert.equal(supply.walletETH, 0);
  assert.equal(supply.suppliedETH, 5);
  assert.equal(wallet.walletETH + wallet.suppliedETH, supply.walletETH + supply.suppliedETH);
  for (const p of [wallet, supply]) {
    assert.equal(p.netAssets, 10000);
    assert.equal(p.cash, 0);
    assert.equal(p.debt, 0);
    assert.equal(p.available, 0);
    assert.equal(p.collateralEnabled, false);
  }
});

test('interest accrues to the supplied claim while collateral remains off', () => {
  const { result } = lendingCase('supply');
  const flow = lendingFlowStages(result, 'supply');
  const p = flow.stages[flow.questionIndex].position;
  assert.equal(p.suppliedETH, result.end.collateralTokens);
  close(p.suppliedETH, 5.1);
  close(p.netAssets, 10200);
  assert.equal(p.walletETH, 0);
  assert.equal(p.cash, 0);
  assert.equal(p.debt, 0);
  assert.equal(p.available, 0);
  assert.equal(p.collateralEnabled, false);
  assert.equal(p.healthFactor, null);
});

test('enabling the accrued supply changes capacity only and never accrues a second year', () => {
  const { result } = lendingCase('supply');
  const flow = lendingFlowStages(result, 'supply');
  const accrued = flow.stages[2].position, enabled = flow.stages[3].position;
  for (const key of ['walletETH', 'cash', 'suppliedETH', 'debt', 'netAssets', 'healthFactor']) {
    assert.equal(enabled[key], accrued[key], key + ' must be unchanged by a collateral setting.');
  }
  assert.equal(enabled.collateralEnabled, true);
  close(enabled.available, 7650);
  close(enabled.borrowLimit, 7650);
  assert.equal(enabled.debt, 0);
});

test('borrowing adds equal cash and debt and consumes only the matching capacity', () => {
  const { result } = lendingCase('borrow');
  const flow = lendingFlowStages(result, 'borrow');
  const before = flow.stages[0].position, after = flow.stages[flow.questionIndex].position;
  assert.equal(before.cash, 0);
  assert.equal(before.debt, 0);
  assert.equal(after.cash, 5000);
  assert.equal(after.debt, 5000);
  assert.equal(after.suppliedETH, before.suppliedETH);
  assert.equal(after.walletETH, before.walletETH);
  assert.equal(before.netAssets, 10000);
  assert.equal(after.netAssets, before.netAssets);
  assert.equal(before.borrowLimit, 7500);
  assert.equal(after.borrowLimit, before.borrowLimit);
  assert.equal(before.available, 7500);
  assert.equal(after.available, 2500);
  assert.equal(after.available, after.borrowLimit - after.debt);
  assert.equal(after.healthFactor, result.end.healthFactor);
});

test('every scene balance reconciles without counting pool claims twice or changing its source', () => {
  for (const id of ['supply', 'borrow']) {
    const { result } = lendingCase(id);
    const original = structuredClone(result);
    Object.freeze(result.input); Object.freeze(result.end); Object.freeze(result);
    const flow = lendingFlowStages(result, id);
    for (const { position: p } of flow.stages) {
      close(p.netAssets, (p.walletETH + p.suppliedETH) * result.input.start + p.cash - p.debt);
      assert.ok(p.available >= 0);
    }
    assert.deepEqual(lendingFlowStages(result, id), flow, 'Replaying does not accumulate balances.');
    assert.deepEqual(result, original);
  }
});

test('fixed scene labels reject a different period, price path or lending mechanism', () => {
  assert.throws(() => lendingFlowStages({}, 'supply'));
  assert.throws(() => lendingFlowStages(lendingCase('supply').result, 'unknown'));
  for (const change of [{ days: 0 }, { days: 180 }, { collateralEnabled: true }, { future: 1500 }, { borrow: 1000, collateralEnabled: true }]) {
    const result = calculateLoan({ ...lendingCase('supply').input, ...change });
    assert.throws(() => lendingFlowStages(result, 'supply'), RangeError);
  }
  for (const change of [{ days: 1 }, { future: 1500 }, { borrow: 0 }, { borrow: 0, collateralEnabled: false }]) {
    const result = calculateLoan({ ...lendingCase('borrow').input, ...change });
    assert.throws(() => lendingFlowStages(result, 'borrow'), RangeError);
  }
});
