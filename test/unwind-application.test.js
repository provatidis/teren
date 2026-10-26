import test from 'node:test';
import assert from 'node:assert/strict';
import { loopCase } from '../public/models/loop-lessons.js';
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
