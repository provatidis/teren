import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOP_DEFAULTS, LOOP_LIMITS, calculateLoop, validateLoop, loopAtPrice } from '../public/models/borrowing-loop-v1.js';
import { loopCase, checkLoopUnderstanding } from '../public/models/loop-lessons.js';
import { LOOP_LESSONS } from '../public/learning/borrowing-loops.js';
import { loopHash, readLoopHash, loopLessonFromHash } from '../public/lib/loop-links.js';
import { loopMoney, loopComparison, loopUnwindLabels } from '../public/lib/loop-presentation.js';
import { LOOP_DRAFT_KEY, LOOP_LEARNING_KEY, readLoopDraft, saveLoopDraft, readLoopProgress, saveLoopProgress, readLendingChapter, saveLendingChapter } from '../public/data/loop-state.js';
import { LOAN_DRAFT_KEY, LOAN_LEARNING_KEY, parseLendingProgress } from '../public/data/lending-state.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const loop = changes => calculateLoop({ ...LOOP_DEFAULTS, ...changes });
const memory = () => {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('holding comparisons keep the sign of real sub-cent differences and identify equality', () => {
  const loss = loopComparison(0.001 - 5e-8, 0.001);
  assert.equal(loss.relation, 'behind');
  assert.ok(loss.difference < 0);
  assert.match(loss.compact, /^−/);
  assert.match(loss.label, /less than holding/);
  const gain = loopComparison(0.001 + 5e-8, 0.001);
  assert.equal(gain.relation, 'ahead');
  assert.match(gain.compact, /^\+/);
  const equal = loopComparison(10000, 10000);
  assert.equal(equal.relation, 'equal');
  assert.equal(equal.label, 'Matches holding');
  const noise = loopComparison(10000 + Number.EPSILON * 10000, 10000);
  assert.equal(noise.relation, 'equal');
  assert.match(noise.label, /Nearly/);
});

test('unwind labels distinguish blocked, partial, completed and unnecessary previews', () => {
  assert.match(loopUnwindLabels('blocked').net, /before liquidation/);
  assert.match(loopUnwindLabels('blocked').debt, /still owed/);
  assert.match(loopUnwindLabels('limited').net, /partial/);
  assert.match(loopUnwindLabels('complete').eth, /freed/);
  assert.match(loopUnwindLabels('no-debt').eth, /no sale needed/);
  assert.throws(() => loopUnwindLabels('unknown'), RangeError);
});

test('one round moves borrowed cash into wallet ETH then collateral without creating equity', () => {
  const result = loop({ swapCost: 0 });
  assert.equal(result.ownCapital, 10000);
  assert.equal(result.steps.length, 3);
  const [borrow, swap, supply] = result.steps;
  assert.equal(borrow.position.cash, 5000);
  assert.equal(borrow.position.debt, 5000);
  assert.equal(borrow.position.collateralTokens, 5);
  assert.equal(swap.position.cash, 0);
  assert.equal(swap.position.walletETH, 2.5);
  assert.equal(swap.position.collateralTokens, 5);
  assert.equal(supply.position.walletETH, 0);
  assert.equal(supply.position.collateralTokens, 7.5);
  for (const step of result.steps) assert.equal(step.position.netAssets, 10000);
  assert.equal(result.start.cash, 0);
  assert.equal(result.startingExposure, 1.5);
  close(borrow.position.healthFactor, 1.6);
  close(supply.position.healthFactor, 2.4);
});

test('repeated rounds borrow against the previous purchase rather than all collateral', () => {
  const result = loop({ rounds: 3, swapCost: 0 });
  assert.deepEqual(result.rounds.map(round => round.borrowed), [5000, 2500, 1250]);
  assert.equal(result.start.collateralTokens, 9.375);
  assert.equal(result.start.debt, 8750);
  assert.equal(result.start.netAssets, 10000);
  for (const step of result.steps.filter(item => item.action === 'borrow')) {
    close(step.position.debt / step.position.collateralValue, 0.5);
    assert.ok(step.position.debt <= step.position.collateralValue * result.input.maxLTV / 100);
  }
});

test('swap loss reduces purchased tokens and equity, including later round sizes', () => {
  const result = loop({ rounds: 2, swapCost: 1 });
  close(result.rounds[0].purchased, 2.475);
  close(result.rounds[1].borrowed, 2475);
  close(result.buildCosts, 74.75);
  close(result.start.netAssets, result.ownCapital - result.buildCosts);
  close(result.end.netAssets - result.holdingValue, -result.buildCosts);
});

test('zero rounds is supplied original ETH, with no debt, swaps or liquidation boundary', () => {
  const result = loop({ rounds: 0, days: 365 });
  assert.deepEqual(result.steps, []);
  assert.equal(result.startingExposure, 1);
  assert.equal(result.end.debt, 0);
  assert.equal(result.end.healthFactor, null);
  assert.equal(result.end.boundaryPrice, null);
  assert.equal(result.unwind.status, 'no-debt');
  close(result.end.netAssets, result.supplyOnlyValue);
  assert.ok(result.end.netAssets > result.holdingValue);
});

test('price sensitivity uses gross ETH exposure and the same original-capital benchmark', () => {
  const result = loop({ rounds: 3, swapCost: 0, future: 1500 });
  assert.equal(result.end.netAssets, 5312.5);
  assert.equal(result.holdingValue, 7500);
  close(loopAtPrice(result, 2000).netAssets - result.end.netAssets, 9.375 * 500);
  assert.equal(result.end.cash, 0);
  assert.equal(result.end.debt, 8750);
  assert.throws(() => loopAtPrice(result, 0), RangeError);
});

test('interest compounds each token balance separately, with simple interest explicitly selectable', () => {
  const result = loop({ days: 365, swapCost: 0, supplyAPR: 2, borrowAPR: 10 });
  close(result.end.collateralTokens, 7.5 * Math.exp(0.02));
  close(result.end.debt, 5000 * Math.exp(0.1));
  const simple = loop({ days: 365, swapCost: 0, supplyAPR: 2, borrowAPR: 10, interestMode: 'simple' });
  close(simple.end.collateralTokens, 7.65);
  close(simple.end.debt, 5500);
  assert.ok(result.end.debt > simple.end.debt);
  const high = loop({ days: 1825, borrowAPR: 100 });
  close(high.end.debt, high.start.debt * Math.exp(5));
  assert.ok(high.end.netAssets < 0);
  assert.equal(high.unwind.status, 'blocked');
  assert.equal(high.unwind.remaining.debt, high.end.debt);
});

test('liquidation boundary and both sides remain distinct without invented liquidations', () => {
  const boundary = loop({}).end.boundaryPrice;
  const at = loop({ future: boundary });
  assert.equal(at.end.status, 'boundary');
  assert.equal(at.unwind.status, 'blocked');
  const below = loop({ future: boundary * (1 - 1e-10) });
  assert.equal(below.end.status, 'eligible');
  assert.equal(below.unwind.remaining.collateralTokens, below.end.collateralTokens);
  const above = loop({ future: boundary * (1 + 1e-10) });
  assert.equal(above.end.status, 'above');
  assert.notEqual(above.unwind.status, 'blocked');
  assert.equal(below.end.debt, at.end.debt);
});

test('unwinding conserves net value less swap costs and checks withdrawal before repayment', () => {
  const result = loop({ rounds: 3 });
  const preview = result.unwind;
  assert.equal(preview.status, 'complete');
  assert.equal(preview.remaining.debt, 0);
  assert.equal(preview.remaining.cash, 0);
  assert.equal(preview.remaining.walletETH, 0);
  assert.ok(preview.steps.length > 1);
  close(preview.steps.reduce((sum, step) => sum + step.repaid, 0), result.end.debt);
  close(preview.steps.reduce((sum, step) => sum + step.soldTokens, 0) + preview.remaining.collateralTokens, result.end.collateralTokens);
  close(preview.remaining.netAssets, result.end.netAssets - preview.costs);
  for (const step of preview.steps) {
    assert.ok(step.withdrawalHealth > 1);
    close(step.repaid + step.cost, step.soldValue);
    assert.ok(step.remaining.debt >= 0);
    assert.ok(step.remaining.collateralTokens >= 0);
  }
});

test('zero-cost unwinding preserves equity while high swap losses remain charged', () => {
  const free = loop({ rounds: 5, swapCost: 0 });
  assert.equal(free.unwind.status, 'complete');
  close(free.unwind.remaining.netAssets, free.end.netAssets);
  const costly = loop({ rounds: 5, swapCost: 5 });
  assert.equal(costly.unwind.status, 'complete');
  assert.ok(costly.unwind.costs > 0);
  close(costly.unwind.remaining.netAssets, costly.end.netAssets - costly.unwind.costs);
});

test('a near-boundary numerical stop leaves debt visible instead of assuming a completed unwind', () => {
  const price = loop({}).end.boundaryPrice * (1 + 1e-12);
  const result = loop({ future: price });
  assert.equal(result.end.status, 'above');
  assert.equal(result.unwind.status, 'limited');
  assert.ok(result.unwind.remaining.debt > 0);
  assert.ok(result.unwind.steps.length <= 64);
  close(result.unwind.remaining.netAssets, result.end.netAssets - result.unwind.costs);
  assert.equal(loopMoney(-0.0001), '−<$0.01');
});

test('swap losses can prevent a withdrawal-first unwind from completing despite health factor above one', () => {
  const settings = { rounds: 5, borrowPercent: 95, maxLTV: 95, threshold: 99, swapCost: 5 };
  const price = loop(settings).end.boundaryPrice * 1.01;
  const result = loop({ ...settings, future: price });
  assert.equal(result.end.status, 'above');
  assert.equal(result.unwind.status, 'limited');
  assert.ok(result.unwind.remaining.debt > 0);
  assert.ok(result.unwind.steps.every(step => step.withdrawalHealth > 1));
  close(result.unwind.remaining.netAssets, result.end.netAssets - result.unwind.costs);
});

test('bounded inputs reject incomplete, nonfinite, fractional and inconsistent loop parameters', () => {
  for (const [key, [min, max]] of Object.entries(LOOP_LIMITS)) {
    for (const value of [NaN, Infinity, '', null, min - 1, max + 1]) assert.throws(() => loop({ [key]: value }), RangeError);
  }
  for (const changes of [{ rounds: 1.5 }, { borrowPercent: 76 }, { threshold: 75 }, { interestMode: 'aave' }]) assert.throws(() => loop(changes), RangeError);
  assert.ok(Object.keys(validateLoop(null)).length);
  const input = Object.freeze({ ...LOOP_DEFAULTS });
  assert.doesNotThrow(() => calculateLoop(input));
});

test('independent geometric references and balance conservation hold across varied bounded setups', () => {
  let seed = 1902;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let index = 0; index < 1000; index++) {
    const input = { ...LOOP_DEFAULTS, collateral: 0.001 + random() * 1000, start: 1 + random() * 10000,
      future: 1 + random() * 10000, borrowPercent: 1 + random() * 74, swapCost: random() * 5,
      rounds: Math.floor(random() * 6), days: random() * 1825, supplyAPR: random() * 50, borrowAPR: random() * 100 };
    const result = calculateLoop(input), r = input.borrowPercent / 100, a = r * (1 - input.swapCost / 100);
    const exposure = (1 - a ** (input.rounds + 1)) / (1 - a);
    const debt = input.rounds ? input.collateral * input.start * r * (1 - a ** input.rounds) / (1 - a) : 0;
    close(result.start.collateralTokens, input.collateral * exposure);
    close(result.start.debt, debt);
    close(result.start.netAssets, result.ownCapital - result.buildCosts);
    assert.ok(Number.isFinite(result.end.netAssets));
    assert.ok(result.unwind.steps.length <= 64);
    for (const step of result.unwind.steps) assert.ok(step.withdrawalHealth > 1);
    for (const action of result.unwind.actions) {
      close(action.position.netAssets, result.end.netAssets - action.costs);
      assert.ok(action.position.debt >= 0);
      assert.ok(action.position.collateralTokens >= 0);
      assert.ok(action.position.cash >= 0);
      assert.ok(action.position.walletETH >= 0);
    }
    close(result.unwind.remaining.netAssets, result.end.netAssets - result.unwind.costs);
  }
});

test('strict loop links round trip all assumptions without touching loan routes', () => {
  const valid = loopHash(LOOP_DEFAULTS);
  assert.deepEqual(readLoopHash(valid), { status: 'ready', input: LOOP_DEFAULTS, comparisonRounds: null });
  assert.equal(readLoopHash('#experiment').status, 'none');
  for (const hash of [valid + '&rounds=2', valid + '&rpc=https://example.com', valid.replace('borrowing-loop-v1', 'other'), valid.replace('rounds=1', 'rounds='), valid.replace('&days=0', ''), valid.replace('interestMode=compound', 'interestMode=other')]) assert.equal(readLoopHash(hash).status, 'invalid');
  assert.equal(loopLessonFromHash('#loop-lesson=build'), 'build');
  assert.equal(loopLessonFromHash('#loop-lesson=build&extra=1'), null);
  assert.equal(loopLessonFromHash('#lesson=borrow'), null);
});

test('loop storage and learning stay independent from existing single-loan drafts and progress', () => {
  const storage = memory(), get = () => storage;
  storage.setItem(LOAN_DRAFT_KEY, 'old loan'); storage.setItem(LOAN_LEARNING_KEY, 'old course');
  assert.equal(readLoopDraft(get).status, 'empty');
  assert.equal(saveLoopDraft(LOOP_DEFAULTS, get), true);
  assert.deepEqual(readLoopDraft(get).input, LOOP_DEFAULTS);
  assert.equal(saveLoopDraft({ ...LOOP_DEFAULTS, rounds: -1 }, get), false);
  assert.deepEqual(readLoopDraft(get).input, LOOP_DEFAULTS);
  storage.setItem(LOOP_DRAFT_KEY, '{broken');
  assert.equal(readLoopDraft(get).status, 'unavailable');
  assert.equal(storage.getItem(LOOP_DRAFT_KEY), '{broken');
  const progress = { version: 1, currentLesson: 'stress', completed: ['build', 'borrow'], drafts: { build: { seed: 5, prediction: 'same', revealed: true } } };
  assert.equal(saveLoopProgress(progress, get), true);
  const parsed = readLoopProgress(get).progress;
  assert.deepEqual(parsed.completed, ['build']);
  assert.equal(parsed.currentLesson, 'stress');
  assert.equal(parsed.drafts.build.prediction, 'same');
  assert.equal(parseLendingProgress(progress).currentLesson, 'supply');
  assert.equal(storage.getItem(LOAN_DRAFT_KEY), 'old loan');
  assert.equal(storage.getItem(LOAN_LEARNING_KEY), 'old course');
  assert.ok(storage.getItem(LOOP_LEARNING_KEY));
  assert.equal(readLendingChapter(get), 'essentials');
  saveLendingChapter('loops', get); assert.equal(readLendingChapter(get), 'loops');
  const blocked = () => { throw new Error('blocked'); };
  assert.equal(readLoopDraft(blocked).status, 'unavailable');
  assert.equal(saveLoopDraft(LOOP_DEFAULTS, blocked), false);
  assert.equal(readLoopProgress(blocked).available, false);
  assert.equal(saveLoopProgress(progress, blocked), false);
  assert.equal(readLendingChapter(blocked), 'essentials');
  assert.equal(saveLendingChapter('loops', blocked), false);
});

test('three conceptual lessons use the actual model and grade every answer combination', () => {
  const expected = { build: ['debt', 'supplied'], stress: ['exposure', 'loop-gain'], unwind: ['backing', 'blocked'] };
  for (const lesson of LOOP_LESSONS) {
    const example = loopCase(lesson.id);
    assert.deepEqual(example.result, calculateLoop(example.input));
    assert.ok(lesson.predictions.some(([id]) => id === example.prediction));
    for (const [reason] of [...lesson.reasons, ['']]) for (const [application] of [...lesson.applications, ['']]) {
      const result = checkLoopUnderstanding(lesson.id, reason, application);
      assert.equal(result.reasoning, reason === expected[lesson.id][0]);
      assert.equal(result.application, application === expected[lesson.id][1]);
      assert.equal(result.passed, result.reasoning && result.application);
    }
    assert.ok(lesson.reasons.every(([id]) => lesson.reasonFeedback[id]));
  }
  assert.equal(loopCase('build').result.end.netAssets, 10000);
  assert.equal(loopCase('stress').result.end.netAssets, 5312.5);
  assert.equal(loopCase('unwind').result.unwind.status, 'complete');
  assert.throws(() => loopCase('other'), RangeError);
  assert.throws(() => checkLoopUnderstanding('other', '', ''), RangeError);
});
