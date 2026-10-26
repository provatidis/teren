import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APPLIED_IDS, appliedLessonFromHash, appliedQuestion, checkAppliedAnswer } from '../public/lib/applied-lessons.js';
import { appliedApplication, appliedCostExample, checkAppliedUnderstanding } from '../public/lib/applied-applications.js';
import { APPLIED_LESSONS } from '../public/learning/applied-liquidity.js';
import { validatePositionPeriod } from '../public/data/position-period.js';
import { periodPointView } from '../public/lib/period-presentation.js';
import { createAppliedRecordLoader } from '../public/data/applied-records.js';
import { APPLIED_KEY, emptyAppliedProgress, parseAppliedProgress, readAppliedProgress, saveAppliedProgress } from '../public/data/applied-progress.js';

const raw = await Promise.all(['uniswap-v3-position-period.json', 'uniswap-v3-position-range-return.json'].map(async file => JSON.parse(await readFile(new URL('../public/examples/' + file, import.meta.url), 'utf8'))));
const [baseline, returning] = raw.map(validatePositionPeriod);

test('applied questions use verified period earnings, interval counters and the same holding basket', () => {
  assert.deepEqual(APPLIED_LESSONS.map(item => item.id), APPLIED_IDS);
  const fees = appliedQuestion(baseline, 'fees-over-time');
  assert.equal(fees.index, 8); assert.equal(fees.view.earned0, 112674n); assert.equal(fees.view.earned1, 896672855663157n);
  assert.ok(Math.abs(fees.answer - 2.3572428756221475) < 1e-12);
  assert.equal(checkAppliedAnswer(fees, '2.36', 'growth').passed, true);
  const between = appliedQuestion(returning, 'between-samples');
  assert.equal(between.index, 8); assert.equal(between.view.state, 'above'); assert.equal(between.interval.startState, 'above');
  assert.equal(between.answer, 2724); assert.equal(between.interval.durationSeconds, 7560);
  assert.ok(between.interval.earned0 > 0n && between.interval.earned1 > 0n);
  assert.equal(checkAppliedAnswer(between, '17580', 'counters').numeric, false, 'Cumulative active time is not the interval answer.');
  const final = appliedQuestion(returning, 'period-vs-holding');
  assert.equal(final.index, 16); assert.equal(final.prediction, 'can-trail');
  assert.equal(final.view.holding.amount0, 4982691068n); assert.equal(final.view.holding.amount1, 14920139441099507n);
  assert.ok(final.view.principalGapUSD < 0 && final.view.gapUSD > 0);
  assert.ok(Math.abs(final.answer - .17457169368572067) < 1e-12);
  assert.equal(checkAppliedAnswer(final, '0.17', 'shortfall').passed, true);
  assert.equal(checkAppliedAnswer(final, '0.18', 'shortfall').numeric, false);
  assert.ok(periodPointView(returning, 8).gapUSD < 0, 'Earning fees does not guarantee beating holding at every checkpoint.');
});
test('exploring a different checkpoint cannot alter the fixed question or accept unsupported evidence', () => {
  const before = appliedQuestion(returning, 'period-vs-holding');
  for (let i = 0; i < returning.points.length; i++) periodPointView(returning, i);
  assert.deepEqual(appliedQuestion(returning, 'period-vs-holding'), before);
  assert.throws(() => appliedQuestion(baseline, 'period-vs-holding'), /recorded position/);
  assert.throws(() => appliedQuestion(returning, 'unknown'), /applied exercise/);
  assert.throws(() => appliedQuestion({ ...returning, points: [returning.points[0], returning.points.at(-1)] }, 'between-samples'), /interval is missing/);
});
test('optional applied calculation practice validates numbers and can reuse reasoning', () => {
  for (const item of APPLIED_LESSONS) {
    const question = appliedQuestion(item.caseId === 'in-range' ? baseline : returning, item.id);
    assert.ok(item.predictions.some(([id]) => id === question.prediction));
    assert.ok(item.reasons.some(([id]) => id === question.reason));
    assert.equal(checkAppliedAnswer(question, String(question.answer), question.reason).passed, true);
    assert.equal(checkAppliedAnswer(question, String(question.answer), 'wrong').passed, false);
    for (const answer of ['', ' ', 'Infinity', 'NaN', 'no']) assert.equal(checkAppliedAnswer(question, answer, question.reason).passed, false);
  }
});
test('applied routes are explicit and cannot hijack essential or malformed lesson links', () => {
  for (const id of APPLIED_IDS) assert.equal(appliedLessonFromHash('#applied=' + id), id);
  for (const hash of ['', '#lesson=range-boundaries', '#applied=unknown', '#applied=fees-over-time&applied=between-samples', '#applied=fees-over-time&lesson=swap-impact']) assert.equal(appliedLessonFromHash(hash), null);
});
test('applied progress has an independent key, bounded drafts and usable storage failures', () => {
  const progress = { version: 1, completed: ['fees-over-time', 'fees-over-time', 'unknown'], drafts: {
    'fees-over-time': { prediction: 'earned', answer: '2.36', reason: 'growth', revealed: true, checkpoint: 8 },
    'between-samples': { checkpoint: 99, prediction: 'x'.repeat(100), answer: null },
    unknown: { revealed: true },
  } };
  const clean = parseAppliedProgress(progress);
  assert.deepEqual(clean.completed, ['fees-over-time']); assert.equal(clean.drafts['fees-over-time'].answer, '2.36');
  assert.equal(clean.drafts['between-samples'].checkpoint, null); assert.equal(clean.drafts['between-samples'].prediction, '');
  assert.equal(clean.drafts.unknown, undefined); assert.deepEqual(parseAppliedProgress({version: 99}), emptyAppliedProgress());
  const map = new Map([['degenerator-learning-liquidity-v1', 'existing lessons'], ['defi-sandbox-v1', 'existing balances']]);
  const storage = { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value) };
  assert.equal(saveAppliedProgress(progress, () => storage), true); assert.deepEqual(readAppliedProgress(() => storage).progress, clean);
  assert.ok(map.has(APPLIED_KEY)); assert.equal(map.get('degenerator-learning-liquidity-v1'), 'existing lessons'); assert.equal(map.get('defi-sandbox-v1'), 'existing balances');
  assert.equal(saveAppliedProgress(progress, () => ({setItem() { throw Error('Full'); }})), false);
  assert.equal(readAppliedProgress(() => { throw Error('Blocked'); }).available, false);
  assert.deepEqual(readAppliedProgress(() => ({getItem: () => '{broken'})).progress, emptyAppliedProgress());
});
test('bundled record loading shares requests, validates evidence and retries a failed response', async () => {
  let count = 0;
  const loader = createAppliedRecordLoader(async url => {
    count++; assert.ok(url.pathname.endsWith('/examples/uniswap-v3-position-period.json'));
    return { ok: true, json: async () => raw[0] };
  });
  const [a, b] = await Promise.all([loader('in-range'), loader('in-range')]);
  assert.equal(count, 1); assert.deepEqual(a, baseline); assert.equal(a, b);
  await assert.rejects(loader('unknown'), /bundled historical/);
  let attempt = 0;
  const retry = createAppliedRecordLoader(async () => ++attempt === 1 ? {ok: false} : {ok: true, json: async () => raw[1]});
  await assert.rejects(retry('range-return'), /Try again/); assert.deepEqual(await retry('range-return'), returning);
  const bad = createAppliedRecordLoader(async () => ({ok: true, json: async () => ({...raw[0], validation: {}})}));
  await assert.rejects(bad('in-range'), /summary differs/);
});

test('the final explanation uses the earlier shortfall while the cost illustration preserves the final record', () => {
  const original=JSON.stringify(returning), question=appliedQuestion(returning,'period-vs-holding');
  assert.equal(question.reason,'shortfall');
  assert.ok(question.contrast.feesUSD>0 && question.contrast.feesUSD < -question.contrast.principalGapUSD);
  const application=appliedApplication('period-vs-holding',question);
  assert.equal(application.expected,'current-values');
  assert.equal(checkAppliedUnderstanding(question,application,'shortfall','current-values').passed,true);
  for(const wrong of ['collect','exit'])assert.equal(checkAppliedUnderstanding(question,application,wrong,'current-values').passed,false);
  const example=appliedCostExample(question);
  assert.equal(example.costUSD,1); assert.equal(example.lpUSD,question.view.lpUSD-1);
  assert.ok(question.view.gapUSD>0 && example.gapUSD<0);
  assert.match(example.text,/hypothetical \$1.00 LP-only cost/);
  assert.match(example.text,/historical record is unchanged/);
  assert.equal(JSON.stringify(returning),original);
});
test('applied question revisions preserve evidence navigation, optional calculations and completed lessons', () => {
  const old={version:1,completed:APPLIED_IDS,drafts:{
    'fees-over-time':{prediction:'earned',reason:'growth',application:'same',answer:'2.36',revealed:true,checkpoint:8},
    'between-samples':{prediction:'possible',reason:'counters',application:'not-proof',answer:'2724',revealed:true,checkpoint:8},
    'period-vs-holding':{prediction:'can-trail',reason:'basket',application:'hold',answer:'0.17',revealed:true,checkpoint:6,choiceSeed:7},
  }};
  const migrated=parseAppliedProgress(old);
  assert.deepEqual(migrated.completed,APPLIED_IDS);
  assert.equal(migrated.drafts['fees-over-time'].application,'same');
  assert.equal(migrated.drafts['between-samples'].reason,'counters');
  assert.equal(migrated.drafts['between-samples'].application,'');
  assert.equal(migrated.drafts['period-vs-holding'].reason,'');
  assert.equal(migrated.drafts['period-vs-holding'].application,'');
  for(const id of APPLIED_IDS)for(const key of ['prediction','answer','revealed','checkpoint'])assert.equal(migrated.drafts[id][key],old.drafts[id][key]);
  assert.equal(migrated.drafts['period-vs-holding'].choiceSeed,7);
  migrated.drafts['between-samples'].application='fee-records';
  migrated.drafts['period-vs-holding'].reason='shortfall';
  migrated.drafts['period-vs-holding'].application='current-values';
  assert.deepEqual(parseAppliedProgress(migrated),migrated);
});
