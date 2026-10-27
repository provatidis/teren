import test from 'node:test';
import assert from 'node:assert/strict';
import { loopCase, unwindSaleCostComparison } from '../public/models/loop-lessons.js';
import { LOOP_DEFAULTS, calculateLoop } from '../public/models/borrowing-loop-v1.js';
import { unwindApplicationStages } from '../public/lib/unwind-application.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9);

test('the application pauses at the first sale and reads the actual following repayment', () => {
  const { result } = loopCase('unwind');
  const before = structuredClone(result);
  const { sale, repayment } = unwindApplicationStages(result);
  const [withdrawn, sold, repaid] = result.unwind.actions;
  assert.equal(sale.action, 'sell');
  assert.equal(sale.position, sold.position);
  assert.equal(repayment.action, 'repay');
  assert.equal(repayment.position, repaid.position);
  assert.equal(sale.position.debt, withdrawn.position.debt, 'Selling has not repaid the loan.');
  assert.equal(sale.position.walletETH, 0);
  assert.ok(sale.position.cash > 0);
  assert.equal(sale.position.collateralTokens, repayment.position.collateralTokens);
  close(sale.position.cash - repayment.position.cash, sale.position.debt - repayment.position.debt);
  close(sale.position.netAssets, repayment.position.netAssets);
  assert.ok(repayment.position.healthFactor > sale.position.healthFactor);
  assert.ok(repayment.position.debt > 0, 'The first repayment must not be presented as closing the whole loop.');
  assert.deepEqual(result, before, 'Selecting the application frames must not alter Observe or its handoff.');
});


test('sale costs compare the same feasible ETH sale without rebuilding or changing the loan', () => {
  for (const swapCost of [0, 0.3, 5]) {
    const result = calculateLoop({ ...LOOP_DEFAULTS, rounds: 3, swapCost });
    const before = structuredClone(result);
    const sale = unwindSaleCostComparison(result);
    const withdrawal = result.unwind.actions.findLast(action => action.action === 'withdraw');
    assert.equal(sale.debt, withdrawal.position.debt);
    assert.equal(withdrawal.position.cash, 0, 'The comparison does not silently use other wallet USDC.');
    assert.equal(sale.price, result.input.future);
    assert.equal(sale.costPercent, swapCost);
    assert.ok(sale.soldETH <= withdrawal.position.walletETH + 1e-12, 'Both alternatives use ETH already available in the wallet.');
    close(sale.soldETH * sale.price, sale.debt);
    close(sale.proceedsWithoutCost, sale.debt);
    close(sale.proceedsWithCost, sale.debt * (1 - swapCost / 100));
    close(sale.remainingDebt, sale.debt * swapCost / 100);
    assert.equal(sale.remainingDebt > 0, swapCost > 0);
    assert.deepEqual(result, before, 'Neither the construction nor the unwind ledger can change.');
  }
  assert.throws(() => unwindSaleCostComparison(calculateLoop({ ...LOOP_DEFAULTS, rounds: 0 })), RangeError);
  assert.throws(() => unwindSaleCostComparison(calculateLoop({ ...LOOP_DEFAULTS, future: 100 })), RangeError);
});
