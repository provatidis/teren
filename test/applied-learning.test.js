import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APPLIED_IDS, appliedLessonFromHash, appliedQuestion, checkAppliedAnswer, appliedReasonFeedback } from '../public/lib/applied-lessons.js';
import { appliedApplication, appliedCostExample, appliedPriceExposure, checkAppliedUnderstanding } from '../public/lib/applied-applications.js';
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
  assert.equal(checkAppliedAnswer(between, '17580', 'returned').numeric, false, 'Cumulative active time is not the interval answer.');
  const final = appliedQuestion(returning, 'period-vs-holding');
  assert.equal(final.index, 16); assert.equal(final.prediction, 'can-trail');
  assert.equal(final.view.holding.amount0, 4982691068n); assert.equal(final.view.holding.amount1, 14920139441099507n);
  assert.ok(final.view.principalGapUSD < 0 && final.view.gapUSD > 0);
  assert.ok(Math.abs(final.answer - .17457169368572067) < 1e-12);
  assert.equal(checkAppliedAnswer(final, '0.17', 'price-returned').passed, true);
  assert.equal(checkAppliedAnswer(final, '0.18', 'price-returned').numeric, false);
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

test('collecting fees still conserves tokens even though the finale now explains price recovery', () => {
  const original = JSON.stringify(returning), question = appliedQuestion(returning, 'period-vs-holding');
  const view = question.contrast;
  assert.equal(question.reason, 'price-returned');
  assert.equal(question.contrastIndex, 6);
  assert.ok(view.feesUSD > 0 && view.gapUSD < 0);
  const ownerBefore = {usdc: view.principal.amount0 + view.earned0, eth: view.principal.amount1 + view.earned1};
  const positionAfter = {...view.principal}, walletAfter = {amount0: view.earned0, amount1: view.earned1};
  const ownerAfter = {usdc: positionAfter.amount0 + walletAfter.amount0, eth: positionAfter.amount1 + walletAfter.amount1};
  assert.deepEqual(ownerAfter, ownerBefore);
  const value = tokens => Number(tokens.usdc) / 1e6 + Number(tokens.eth) / 1e18 * view.price;
  assert.equal(value(ownerBefore) - view.holdingUSD, value(ownerAfter) - view.holdingUSD);
  assert.ok(Math.abs(value(ownerBefore) - view.lpUSD) < 1e-9);
  assert.equal(JSON.stringify(returning), original);
});
test('the price-rise application follows the real ETH exposure, including uncollected fee ETH', () => {
  const original = JSON.stringify(returning), question = appliedQuestion(returning, 'period-vs-holding');
  const view = question.view, exposure = appliedPriceExposure(question);
  const application = appliedApplication('period-vs-holding', question);
  assert.equal(application.expected, 'smaller-lead');
  assert.deepEqual(application.exposure, exposure);
  assert.equal(exposure.principalETH, 0);
  assert.ok(exposure.feeETH > 0 && exposure.feeETH < exposure.holdingETH);
  assert.equal(exposure.lpETH, exposure.feeETH);
  assert.equal(checkAppliedUnderstanding(question, application, 'price-returned', 'smaller-lead').passed, true);
  for (const wrong of ['narrower-gap', 'wider-gap', 'shortfall']) {
    assert.equal(checkAppliedUnderstanding(question, application, wrong, 'smaller-lead').passed, false);
  }
  // Value the unchanged raw token balances independently at successively higher prices.
  const valueLP = price => Number(view.principal.amount0 + view.earned0) / 1e6
    + Number(view.principal.amount1 + view.earned1) / 1e18 * price;
  const valueHolding = price => Number(view.holding.amount0) / 1e6 + Number(view.holding.amount1) / 1e18 * price;
  const initialGap = valueLP(view.price) - valueHolding(view.price);
  let previousGap = initialGap;
  for (const increase of [.01, 1, 10, 100]) {
    const price = view.price + increase;
    const lp = valueLP(price), holding = valueHolding(price), gap = lp - holding;
    assert.ok(lp > valueLP(view.price), 'Previously earned ETH fees gain value outside the range.');
    assert.ok(holding > valueHolding(view.price));
    assert.ok(gap < previousGap);
    assert.ok(Math.abs((gap - initialGap) - exposure.ethDifference * increase) < 1e-9);
    if (increase === .01) assert.ok(gap > 0, 'A shrinking lead need not reverse.');
    previousGap = gap;
  }
  for (const changed of [
    {...view, state: 'inside'},
    {...view, price: view.range.upperPrice},
    {...view, principal: {...view.principal, amount1: 1n}},
    {...view, holding: {...view.holding, amount1: view.earned1}},
  ]) assert.throws(() => appliedPriceExposure({...question, view: changed}), /above-range position/);
  assert.equal(JSON.stringify(returning), original);
});
test('the separate cost illustration preserves the final record', () => {
  const original = JSON.stringify(returning), question = appliedQuestion(returning, 'period-vs-holding');
  const example = appliedCostExample(question);
  assert.equal(example.costUSD, 1); assert.equal(example.lpUSD, question.view.lpUSD - 1);
  assert.ok(question.view.gapUSD > 0 && example.gapUSD < 0);
  assert.match(example.text, /hypothetical \$1.00 LP-only cost/);
  assert.match(example.text, /historical record is unchanged/);
  assert.equal(JSON.stringify(returning), original);
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
  assert.equal(migrated.drafts['between-samples'].reason,'');
  assert.equal(migrated.drafts['between-samples'].application,'');
  assert.equal(migrated.drafts['period-vs-holding'].reason,'');
  assert.equal(migrated.drafts['period-vs-holding'].application,'');
  for(const id of APPLIED_IDS)for(const key of ['prediction','answer','revealed','checkpoint'])assert.equal(migrated.drafts[id][key],old.drafts[id][key]);
  assert.equal(migrated.drafts['period-vs-holding'].choiceSeed,7);
  migrated.drafts['between-samples'].reason='returned';
  migrated.drafts['between-samples'].application='edge-placement';
  migrated.drafts['period-vs-holding'].reason='price-returned';
  migrated.drafts['period-vs-holding'].application='smaller-lead';
  assert.deepEqual(parseAppliedProgress(migrated),migrated);
});

test('the 1.46 question revision clears only the replaced comparison answers', () => {
  const old = {version: 1, completed: ['period-vs-holding'], drafts: {
    'period-vs-holding': {prediction: 'can-trail', reason: 'shortfall', application: 'current-values',
      answer: '0.17', revealed: true, checkpoint: 6, choiceSeed: 7,
      questionRevisions: {prediction: 1, reason: 2, application: 2}},
  }};
  const migrated = parseAppliedProgress(old), draft = migrated.drafts['period-vs-holding'];
  assert.deepEqual(migrated.completed, old.completed);
  assert.equal(draft.reason, ''); assert.equal(draft.application, '');
  assert.deepEqual(draft.questionRevisions, {prediction: 1, reason: 4, application: 3});
  for (const key of ['prediction', 'answer', 'revealed', 'checkpoint', 'choiceSeed']) {
    assert.equal(draft[key], old.drafts['period-vs-holding'][key]);
  }
  draft.reason = 'price-returned'; draft.application = 'smaller-lead';
  assert.deepEqual(parseAppliedProgress(migrated), migrated);
});


test('recorded fee evidence distinguishes new earnings from the whole collectable balance', () => {
  const question = appliedQuestion(baseline, 'fees-over-time');
  const before = JSON.stringify(baseline);
  const application = appliedApplication('fees-over-time', question);
  const snapshot = question.view.point.snapshot;
  assert.ok(BigInt(snapshot.fees.collectable0Raw) > question.view.earned0);
  assert.ok(BigInt(snapshot.fees.collectable1Raw) > question.view.earned1);
  assert.match(application.reasonEvidence.rows[0][1], /0.1127 USDC/);
  assert.match(application.reasonEvidence.rows[1][0], /All tokens/);
  assert.equal(application.expected, 'same');
  assert.ok(application.feedbackByChoice.less && application.feedbackByChoice.more);
  assert.equal(JSON.stringify(baseline), before);
});

test('outside samples plus recorded active time require a return inside unchanged bounds', () => {
  const question = appliedQuestion(returning, 'between-samples');
  const before = JSON.stringify(returning);
  const application = appliedApplication('between-samples', question);
  assert.equal(question.reason, 'returned');
  assert.equal(question.interval.startState, 'above');
  assert.equal(question.view.state, 'above');
  assert.equal(question.interval.secondsInRange, 2724);
  assert.equal(application.reasonEvidence.rows[2][1], '45m 24s');
  assert.match(application.reasonEvidence.rows[3][1], /Unchanged/);
  assert.equal(application.expected, 'edge-placement');
  assert.equal(checkAppliedUnderstanding(question, application, 'returned', 'edge-placement').passed, true);
  assert.equal(checkAppliedUnderstanding(question, application, 'counters', 'edge-placement').passed, false);
  assert.equal(checkAppliedUnderstanding(question, application, 'returned', 'fee-records').passed, false);
  assert.ok(question.placement.upwardRoomPercent>0&&question.placement.upwardRoomPercent<.5);
  assert.equal(question.placement.secondsInRange,50256);
  assert.equal(question.placement.durationSeconds,120468);
  assert.match(application.evidence.rows[3][1],/0.44%/);
  assert.match(application.evidence.note,/41.7%/);
  assert.match(application.evidence.note,/do not reveal every move/);
  assert.equal(question.placement.range.lowerPrice,periodPointView(returning,0).range.lowerPrice);
  for (let i=0;i<returning.points.length;i++) periodPointView(returning,i);
  assert.deepEqual(appliedApplication('between-samples', appliedQuestion(returning,'between-samples')), application);
  assert.equal(JSON.stringify(returning), before);
});

test('revised interval questions clear obsolete selections but preserve completion and navigation', () => {
  const old = {version:1,completed:['between-samples'],drafts:{
    'between-samples':{prediction:'possible',reason:'counters',application:'fee-records',answer:'2724',revealed:true,checkpoint:3,choiceSeed:12,questionRevisions:{prediction:1,reason:1,application:2}},
  }};
  const migrated = parseAppliedProgress(old), draft = migrated.drafts['between-samples'];
  assert.deepEqual(migrated.completed, old.completed);
  assert.equal(draft.reason, ''); assert.equal(draft.application, '');
  assert.deepEqual(draft.questionRevisions, {prediction:1,reason:2,application:4});
  for (const key of ['prediction','answer','revealed','checkpoint','choiceSeed']) assert.equal(draft[key], old.drafts['between-samples'][key]);
  draft.reason='returned'; draft.application='edge-placement';
  assert.deepEqual(parseAppliedProgress(migrated), migrated);
});


test('the recorded recovery separates unchanged principal exposure from the increase in fee value', () => {
  const original=JSON.stringify(returning),q=appliedQuestion(returning,'period-vs-holding');
  assert.equal(q.reason,'price-returned');
  assert.equal(q.contrast.state,'above'); assert.equal(q.view.state,'above');
  assert.equal(q.contrast.principal.amount0,q.view.principal.amount0);
  assert.equal(q.contrast.principal.amount1,0n); assert.equal(q.view.principal.amount1,0n);
  assert.ok(returning.points.some((_,index)=>index>q.contrastIndex&&index<q.index&&periodPointView(returning,index).state==='inside'),
    'Matching all-USDC endpoints do not imply that the position stayed outside between them.');
  const reentryChoice=APPLIED_LESSONS.find(lesson=>lesson.id==='period-vs-holding').reasons.find(([key])=>key==='reentered')[1];
  assert.match(reentryChoice,/At the final checkpoint/);
  assert.match(appliedReasonFeedback('period-vs-holding','reentered'),/did return inside between these checkpoints/);
  assert.ok(q.contrast.price>q.view.price&&q.view.price>q.view.range.upperPrice);
  assert.ok(Math.abs(q.recovery.principalImprovement-.46863)<.00001);
  assert.ok(Math.abs(q.recovery.feeValueChange-.21792656548525485)<1e-12);
  assert.ok(Math.abs(q.recovery.principalImprovement+q.recovery.feeValueChange-q.recovery.gapChange)<1e-9);
  const holdingETH=Number(q.view.holding.amount1)/1e18;
  assert.ok(Math.abs(q.recovery.principalImprovement-holdingETH*(q.contrast.price-q.view.price))<1e-9);
  assert.equal(JSON.stringify(returning),original);
});

test('the new recorded questions preserve the compatible interval reason and final application', () => {
  const old={version:1,completed:APPLIED_IDS,drafts:{
    'between-samples':{prediction:'possible',reason:'returned',application:'smaller-share',answer:'2724',revealed:true,checkpoint:3,choiceSeed:6,questionRevisions:{prediction:1,reason:2,application:3}},
    'period-vs-holding':{prediction:'can-trail',reason:'same-gap',application:'smaller-lead',answer:'0.17',revealed:true,checkpoint:6,choiceSeed:7,questionRevisions:{prediction:1,reason:3,application:3}},
  }};
  const migrated=parseAppliedProgress(old);
  assert.deepEqual(migrated.completed,old.completed);
  assert.equal(migrated.drafts['between-samples'].reason,'returned');
  assert.equal(migrated.drafts['between-samples'].application,'');
  assert.equal(migrated.drafts['period-vs-holding'].reason,'');
  assert.equal(migrated.drafts['period-vs-holding'].application,'smaller-lead');
  for(const id of Object.keys(old.drafts))for(const key of ['prediction','answer','revealed','checkpoint','choiceSeed'])assert.equal(migrated.drafts[id][key],old.drafts[id][key]);
  migrated.drafts['between-samples'].application='edge-placement';
  migrated.drafts['period-vs-holding'].reason='price-returned';
  assert.deepEqual(parseAppliedProgress(migrated),migrated);
});
