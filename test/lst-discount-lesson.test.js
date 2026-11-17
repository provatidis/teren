import assert from 'node:assert/strict';
import test from 'node:test';
import { checkLSTDiscountUnderstanding, LST_DISCOUNT_LESSON, lstDiscountCase } from '../public/learning/lst-discount-lesson.js';
import { readLSTHash } from '../public/lib/lst-links.js';

test('the discounted sale reduces the WETH left after repayment with balances, time and lender price fixed', () => {
  const { stages: { start, discount } } = lstDiscountCase();
  assert.deepEqual(discount.input, { ...start.input, discount: 10 });
  assert.equal(start.input.days, 0);
  for (const { result } of [start, discount]) {
    assert.equal(result.end.collateral, 4);
    assert.equal(result.end.debt, 3.75);
    assert.equal(result.end.oraclePrice, 1.25);
    assert.equal(result.end.healthFactor.toFixed(2), '1.10');
    assert.equal(result.end.status, 'above');
    assert.equal(result.exit.status, 'complete');
  }
  assert.equal(start.result.end.collateralValue, 5);
  assert.equal(discount.result.end.collateralValue, 4.5);
  assert.equal(start.result.exit.cash, 1.25);
  assert.equal(discount.result.exit.cash, 0.75);
});

test('changing only the oracle crosses the boundary without a second market loss or an executed exit', () => {
  const { stages: { discount, market } } = lstDiscountCase();
  assert.deepEqual(market.input, { ...discount.input, oracleMode: 'market' });
  const { end, exit } = market.result;
  assert.equal(end.oraclePrice, end.marketPrice);
  assert.equal(end.healthFactor.toFixed(2), '0.99');
  assert.equal(end.status, 'eligible');
  for (const key of ['marketPrice', 'collateral', 'debt', 'collateralValue', 'net']) {
    assert.equal(end[key], discount.result.end[key]);
  }
  assert.equal(end.net, 0.75);
  assert.equal(exit.status, 'boundary');
  assert.equal(exit.cash, null);
  assert.equal(exit.remaining.debt, 3.75);
});

test('each scene hands off its exact model input to Hold and stress as an independent lesson example', () => {
  const { result, stages } = lstDiscountCase();
  assert.equal(result, stages.discount.result);
  for (const { href, input } of Object.values(stages)) {
    const url = new URL(href, 'https://teren.sh/');
    assert.equal(url.pathname, '/lending.html');
    assert.equal(url.search, '?from=lesson');
    assert.deepEqual(readLSTHash(url.hash), { status: 'ready', input, view: 'hold' });
  }
});

test('one partial liquidation cancels half the WETH debt and transfers collateral worth the repayment plus its bonus', () => {
  const { stages: { market }, liquidations: { withBonus } } = lstDiscountCase();
  const { end, liquidation } = withBonus.result;
  const { repay, seized, remaining } = liquidation;
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} differs from ${expected}`);
  assert.deepEqual(withBonus.input, market.input);
  assert.deepEqual(end, market.result.end);
  assert.equal(end.status, 'eligible');
  assert.equal(end.net, 0.75);
  assert.equal(end.marketPrice, 1.125);
  assert.equal(end.marketPrice, end.oraclePrice);
  assert.equal(withBonus.input.repayPercent, 50);
  assert.equal(withBonus.input.bonus, 3);
  assert.equal(repay, 1.875);
  assert.equal(remaining.debt, end.debt - repay);
  close(seized, 1.93125 / 1.125);
  close(remaining.collateral + seized, end.collateral);
  close(liquidation.marketValueTaken, 1.93125);
  close(liquidation.bonusAtOracle, 0.05625);
  close(remaining.net, 0.69375);
  close(end.net - remaining.net, liquidation.marketValueTaken - repay);
});

test('repeating the same liquidation without a bonus reduces collateral and debt by equal market value', () => {
  const { withBonus, zeroBonus } = lstDiscountCase().liquidations;
  assert.deepEqual(zeroBonus.input, { ...withBonus.input, bonus: 0 });
  assert.deepEqual(zeroBonus.result.end, withBonus.result.end);
  const { end, liquidation } = zeroBonus.result;
  assert.equal(liquidation.repay, withBonus.result.liquidation.repay);
  assert.equal(liquidation.bonusAtOracle, 0);
  assert.ok(liquidation.remaining.collateral < end.collateral);
  assert.equal(liquidation.remaining.debt, 1.875);
  assert.ok(Math.abs(liquidation.marketValueTaken - liquidation.repay) < 1e-12);
  assert.ok(Math.abs(liquidation.remaining.net - end.net) < 1e-12);
});

test('both bonus settings open the identical lesson assumptions in the lab’s liquidation disclosure', () => {
  for (const { href, input } of Object.values(lstDiscountCase().liquidations)) {
    const url = new URL(href, 'https://teren.sh/');
    assert.equal(url.pathname, '/lending.html');
    assert.equal(url.searchParams.get('from'), 'lesson');
    assert.equal(url.searchParams.get('show'), 'liquidation');
    assert.deepEqual(readLSTHash(url.hash), { status: 'ready', input, view: 'hold' });
  }
});

test('the lesson checks debt exposure and the oracle change independently with feedback on every option', () => {
  const lesson = LST_DISCOUNT_LESSON;
  assert.ok(lesson.predictions.some(([id]) => id === lstDiscountCase().prediction));
  for (const [reason] of lesson.reasons) {
    assert.ok(lesson.reasonFeedback[reason]);
    for (const [application] of lesson.applications) {
      assert.ok(lesson.applicationFeedbackByChoice[application]);
      const checked = checkLSTDiscountUnderstanding(lesson.id, reason, application);
      assert.equal(checked.reasoning, reason === 'debt-fixed');
      assert.equal(checked.application, application === 'health-only');
      assert.equal(checked.passed, checked.reasoning && checked.application);
    }
  }
});
