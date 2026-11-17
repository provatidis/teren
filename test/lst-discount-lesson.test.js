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
