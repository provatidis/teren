import test from 'node:test';
import assert from 'node:assert/strict';
import { loopCase, unwindSaleCostComparison } from '../public/models/loop-lessons.js';
import { LOOP_DEFAULTS, calculateLoop } from '../public/models/borrowing-loop-v1.js';
import { formatTokenQuantity } from '../public/lib/format.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9);

test('sale costs compare the same feasible ETH sale without rebuilding or changing the loan', () => {
  const lesson = loopCase('unwind').result;
  const comparison = unwindSaleCostComparison(lesson);
  const finalSale = lesson.unwind.actions.findLast(action => action.action === 'sell');
  assert.deepEqual([
    formatTokenQuantity(comparison.soldETH, 4),
    formatTokenQuantity(comparison.remainingDebt, 2),
    formatTokenQuantity(finalSale.amount, 4),
  ], ['0.6783', '4.07', '0.6804'], 'The lesson feedback connects the hypothetical shortfall with the larger sale in Observe.');
  close(finalSale.proceeds, comparison.debt);
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
