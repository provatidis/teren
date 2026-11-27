import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../public/learning/liquidity-essentials.js';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { checkLessonUnderstanding } from '../public/models/lesson-application.js';
import { tokenBalanceNarration, untradedMarketQuestion, claimText, benchmarkNarration } from '../public/lib/lesson-narration.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';
import { lessonWalkthrough } from '../public/lib/lesson-walkthrough.js';
import { readFile } from 'node:fs/promises';
import { validatePositionPeriod } from '../public/data/position-period.js';
import { appliedQuestion, appliedReasonFeedback } from '../public/lib/applied-lessons.js';
import { appliedApplication, checkAppliedUnderstanding } from '../public/lib/applied-applications.js';
import { APPLIED_LESSONS } from '../public/learning/applied-liquidity.js';

test('rising, falling and unchanged prices agree with the explanation and never accept token creation', () => {
  for (let variant = 0; variant < 3; variant++) for (const factor of [.5, 1, 2]) {
    const setup = lessonSetup('token-balances', variant), input = {futurePrice: setup.initialPrice * factor};
    const result = runLesson('token-balances', input, variant), copy = tokenBalanceNarration(result), question = untradedMarketQuestion(result);
    const start = claimText(result.result.held), now = claimText(result.result.pooled);
    assert.equal(result.prediction, factor < 1 ? 'more' : factor > 1 ? 'less' : 'same');
    assert.equal(copy.direction, factor < 1 ? 'down' : factor > 1 ? 'up' : 'same');
    if (factor > 1) {
      assert.ok(result.result.pooled.eth < result.result.held.eth && result.result.pooled.usdc > result.result.held.usdc);
      assert.match(copy.exchange, /buy ETH from the pool.*less ETH and more USDC/);
    } else if (factor < 1) {
      assert.ok(result.result.pooled.eth > result.result.held.eth && result.result.pooled.usdc < result.result.held.usdc);
      assert.match(copy.exchange, /sell ETH to the pool.*more ETH and less USDC/);
    } else {
      assert.deepEqual(result.result.pooled, result.result.held);
      assert.match(question.question, /stay the same/); assert.equal(question.choices[0][1], 'The pool’s price already matches the market’s, so no trade is needed.');
      // No trade is needed to close a gap. Nothing here says that nobody trades.
      assert.doesNotMatch(JSON.stringify([copy, question]), /nobody ha[sd] a reason|nothing to trade on/);
      assert.match(lessonWalkthrough('token-balances', result)[2][0], /unchanged/);
    }
    // The question steps outside the scene: the market moved and nobody has traded yet.
    if (factor !== 1) {
      assert.match(question.context, new RegExp('market price ' + (factor > 1 ? 'jumps' : 'drops') + ' to .*nobody has traded with the pool yet'));
      assert.equal(question.choices[0][1], 'No. Still ' + start + '. Nothing has moved in or out.');
      assert.ok(question.choices.find(([id]) => id === 'automatic')[1].startsWith('Yes. Already ' + now + '.'));
      assert.ok(question.feedbackByChoice.automatic.includes(now) && question.feedbackByChoice.rebalance.includes(start));
    }
    assert.deepEqual(question.choices.map(([id]) => id), ['rebalance', 'automatic', 'drift']);
    assert.match(copy.explanation, /neither ETH nor USDC is created/);
    // The lesson's question is this one, with its feedback for every answer.
    const asked = lessonApplicationCopy('token-balances', { ...result, variant });
    assert.equal(asked.expected, 'rebalance'); assert.deepEqual(asked.choices, question.choices);
    for (const wrong of ['automatic', 'drift']) {
      assert.equal(checkLessonUnderstanding('token-balances', input, variant, wrong).passed, false);
      assert.equal(asked.feedbackByChoice[wrong], question.feedbackByChoice[wrong]);
    }
    assert.equal(checkLessonUnderstanding('token-balances', input, variant, 'rebalance').passed, true);
    assert.match(question.feedbackByChoice.drift, /Time alone changes nothing in a pool/);
    assert.match(question.feedbackByChoice.automatic, factor === 1 ? /does not hold its amounts fixed/ : /does not watch the market/);
    assert.ok(question.hint);
  }
});
test('every wrong answer is rejected and has its own feedback in every variation', () => {
  for (const lesson of LESSONS) for (let variant = 0; variant < 3; variant++) {
    const inputs = lessonSetup(lesson.id, variant), result = { ...runLesson(lesson.id, inputs, variant), variant };
    const copy = lessonApplicationCopy(lesson.id, result);
    for (const [answer] of copy.choices) {
      assert.equal(checkLessonUnderstanding(lesson.id, inputs, variant, answer).application, answer === copy.expected);
      if (answer !== copy.expected) assert.ok(copy.feedbackByChoice[answer], lesson.id + ' ' + answer);
    }
    assert.ok(copy.feedbackByChoice[copy.expected] || copy.feedback, lesson.id);
  }
});
test('benchmark explanations follow actual profit, total targets and additional fees including no price change', () => {
  for (let variant = 0; variant < 3; variant++) for (const factor of [.5, 1, 2]) {
    const base = lessonSetup('loss-vs-profit', variant), price = base.initialPrice * factor;
    const loss = runLesson('loss-vs-profit', {futurePrice: price}, variant);
    // Before fees the claim trails holding whenever the price has moved, either way.
    assert.equal(loss.prediction, factor === 1 ? 'same' : 'less');
    assert.ok(benchmarkNarration('loss-vs-profit', loss).includes('before-fee shortfall'));
    if (factor === 1) assert.equal(loss.result.breakEvenFees, 0);
    const fees = runLesson('fee-break-even', {futurePrice: price, fees: 0}, variant);
    const covered = runLesson('final-challenge', {futurePrice: price, fees: Math.min(base.investment / 2, fees.result.breakEvenFees + 1)}, variant);
    assert.equal(covered.prediction, 'lower-price'); assert.ok(covered.result.difference >= 0);
    assert.match(benchmarkNarration('fee-break-even', fees), /total target/);
    assert.match(benchmarkNarration('final-challenge', covered), /conditional on/);
  }
});
test('range boundary questions and predictions agree across all widths and variations', () => {
  for (let variant = 0; variant < 3; variant++) for (const width of [.05, .1, .5]) {
    const {initialPrice} = lessonSetup('range-boundaries', variant);
    for (const [factor, prediction, share] of [[.5,'eth',100],[1-width,'eth',100],[1,'both',null],[1+width,'usdc',0],[2,'usdc',0]]) {
      const result = runLesson('range-boundaries', {futurePrice: initialPrice * factor, width}, variant);
      assert.equal(result.prediction, prediction);
      if (share !== null) assert.equal(result.result.finalEthPercent, share);
      assert.equal(checkLessonUnderstanding('range-boundaries', result.setup, variant, 'same-end').passed, false);
      assert.equal(checkLessonUnderstanding('range-boundaries', result.setup, variant, 'path').passed, true);
    }
  }
});
test('historical questions keep their period scope and reject every unsupported conclusion', async () => {
  const records = await Promise.all(['uniswap-v3-position-period.json','uniswap-v3-position-range-return.json'].map(async file => validatePositionPeriod(JSON.parse(await readFile(new URL('../public/examples/' + file, import.meta.url), 'utf8')))));
  for (const lesson of APPLIED_LESSONS) {
    const question = appliedQuestion(records[lesson.caseId === 'in-range' ? 0 : 1], lesson.id);
    const application = appliedApplication(lesson.id, question);
    for (const [reason] of lesson.reasons) {
      assert.equal(checkAppliedUnderstanding(question, application, reason, application.expected).passed, reason === question.reason);
      if (reason !== question.reason) assert.doesNotMatch(appliedReasonFeedback(lesson.id, reason), /^Choose a conclusion/);
    }
  }
  assert.match(APPLIED_LESSONS.at(-1).explanation, /At the final checkpoint/);
});
