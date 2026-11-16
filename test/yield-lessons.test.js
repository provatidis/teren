import test from 'node:test';
import assert from 'node:assert/strict';
import { YIELD_LESSONS } from '../public/learning/yield-lessons.js';
import { readSplitSetup } from '../public/data/split-yield-state.js';
import { splitDeposit } from '../public/models/split-yield-v1.js';

function handoff(lesson) {
  const url = new URL(lesson.experimentHref, 'https://teren.sh/');
  assert.equal(url.pathname, '/yield.html');
  assert.equal(url.searchParams.get('from'), 'lesson');
  return readSplitSetup(url.hash);
}

test('the split follows one deposit; the zero-yield buyers receive its principal and no interest', () => {
  const [split, buyers] = YIELD_LESSONS;
  const { inputs } = handoff(split);
  assert.equal(inputs.ytPrice, 0.02);
  assert.equal(inputs.days, 90);
  const sale = split.scene.stages.find(stage => stage.transfer);
  assert.deepEqual(sale.transfer, { from: 'YT buyer', to: 'Your wallet', value: '20 USDC' });
  assert.equal(split.scene.stages[split.scene.outcome].retainedPayment.value, sale.transfer.value);
  const owners = sale.rows.map(([label, , role]) => [label, role]);
  assert.deepEqual(owners, [['You keep', 'pt'], ['The buyer gets', 'yt']]);
  const { inputs: zero } = handoff(buyers);
  assert.deepEqual([zero.firstApy, zero.secondApy], [0, 0]);
  const payments = buyers.scene.stages[0].rows.map(([, value]) => value);
  const redemptions = buyers.scene.stages[buyers.scene.outcome].rows.map(([, value]) => value);
  assert.deepEqual(payments, ['980 USDC paid', '20 USDC paid']);
  assert.deepEqual(redemptions, ['1,000 USDC in principal', '0 USDC in interest']);
});

test('timing shows opposite YT outcomes on one scale and sends the earlier rise to Experiment', () => {
  const lesson = YIELD_LESSONS.find(item => item.id === 'timing');
  const { inputs, exit } = handoff(lesson);
  assert.deepEqual([inputs.firstApy, inputs.secondApy, inputs.switchDay, inputs.days], [5, 15, 10, 90]);
  assert.equal(exit, null);
  const ratePeriods = lesson.scene.stages.map(({ path }) => [
    [path.switchDay, path.firstApy], [path.days - path.switchDay, path.secondApy],
  ]);
  assert.deepEqual(ratePeriods, [[[80, 5], [10, 15]], [[10, 5], [80, 15]]]);
  const [late, early] = lesson.scene.stages.map(stage => stage.bars);
  assert.equal(late.max, early.max);
  // The same 20 USDC purchase earns ~13.90 or ~30.86 after the yield fee.
  const money = bars => bars.items.map(item => item.value.toFixed(2));
  assert.deepEqual(money(late), ['20.00', '13.90']);
  assert.deepEqual(money(early), ['20.00', '30.86']);
  assert.equal(lesson.scene.stages[lesson.scene.outcome].bars, early);
  const reversed = splitDeposit({ ...inputs, firstApy: 15, secondApy: 5, switchDay: 10 });
  assert.equal(reversed.netInterest.toFixed(2), money(late)[1], 'Ten high-rate days earn the same total at either end of the term.');
});

test('both day-45 offers keep the seller’s earned yield; the question opens the higher quote', () => {
  const lesson = YIELD_LESSONS.find(item => item.id === 'exit');
  const { inputs, exit } = handoff(lesson);
  assert.equal(inputs.budget, 1000);
  assert.deepEqual(exit, { exitDay: 45, exitApy: 15 });
  const [low, high] = lesson.scene.stages;
  const money = stage => stage.bars.items.map(item => item.value.toFixed(2));
  assert.deepEqual(money(low), ['299.86', '286.58']);
  assert.deepEqual(money(high), ['854.17', '286.58']);
  assert.equal(low.bars.max, high.bars.max);
  assert.deepEqual(high.rows.map(([, value]) => value), ['1,002.98 USDC', '1,140.75 USDC']);
  assert.equal(lesson.scene.stages[lesson.scene.outcome], high);
});
