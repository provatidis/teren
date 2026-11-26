import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonApplication, checkLessonUnderstanding, essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { lossProfitReasoning, lessonReasonFeedback } from '../public/lib/lesson-narration.js';
import { parseProgress } from '../public/data/learning-progress.js';
import { matchChallengeHolding } from '../public/models/liquidity-challenge.js';

test('loss reasoning follows custom rising, falling and unchanged prices, independently of variation', () => {
  for (const variant of [0, 1, 2]) {
    const base = lessonSetup('loss-vs-profit', variant);
    for (const factor of [.5, .87, 1, 1.23, 2]) {
      const inputs = {futurePrice: base.initialPrice * factor};
      const outcome = runLesson('loss-vs-profit', inputs, variant);
      const copy = lossProfitReasoning(outcome);
      const {pooled, held, lpBeforeFees, holdValue} = outcome.result;
      assert.equal(copy.direction, factor < 1 ? 'down' : factor > 1 ? 'up' : 'same');
      assert.equal(outcome.reason, 'traded-mix');
      const correct = copy.reasons.find(([id]) => id === outcome.reason)[1];
      if (factor > 1) {
        assert.ok(pooled.eth < held.eth && pooled.usdc > held.usdc);
        assert.ok(lpBeforeFees < holdValue && lpBeforeFees > base.investment);
        assert.match(copy.reasoning, /your claim gain less than holding/);
        assert.match(correct, /bought ETH from the pool.*your claim holds less ETH/);
      } else if (factor < 1) {
        assert.ok(pooled.eth > held.eth && pooled.usdc < held.usdc);
        assert.ok(lpBeforeFees < holdValue && holdValue < base.investment);
        assert.match(copy.reasoning, /your claim lose more than holding/);
        assert.match(correct, /sold ETH to the pool.*your claim holds more ETH/);
      } else {
        assert.deepEqual(pooled, held);
        assert.equal(lpBeforeFees, holdValue);
        assert.match(copy.reasoning, /your claim match holding/);
        assert.match(correct, /same token amounts/);
      }
      const application = lessonApplication('loss-vs-profit', outcome);
      assert.equal(application.expected, variant === 1 ? 'gap-unchanged' : 'holding-basket');
      for (const [reason] of copy.reasons) {
        assert.equal(checkLessonUnderstanding('loss-vs-profit', inputs, variant, reason, application.expected).passed, reason === outcome.reason);
        assert.equal(lessonReasonFeedback('loss-vs-profit', outcome, reason), reason === outcome.reason ? copy.feedback : copy.feedbackByChoice[reason]);
      }
      assert.equal(checkLessonUnderstanding('loss-vs-profit', inputs, variant, 'benchmark', application.expected).passed, false);
    }
  }
});

test('revised reasoning clears old answers while keeping completed lessons, evidence and compatible applications', () => {
  for (const [id, oldRevision, oldReason] of [
    ['loss-vs-profit', 1, 'benchmark'], ['token-balances', 1, 'rebalance'], ['final-challenge', 2, 'total'],
  ]) for (const variant of [0, 1, 2]) {
    const setup = lessonSetup(id, variant);
    const inputs = {...setup, futurePrice: setup.initialPrice * .87};
    const outcome = runLesson(id, inputs, variant);
    const revisions = essentialQuestionRevisions(id, variant);
    const task = id === 'final-challenge' ? matchChallengeHolding(outcome.setup, setup.initialPrice * .75) : undefined;
    const source = {version: 1, lastLesson: id, completed: [id, 'pool-share'], drafts: {
      [id]: {variant, inputs, prediction: outcome.prediction, predictionRevision: revisions.prediction,
        reason: oldReason, reasonRevision: oldRevision,
        application: lessonApplication(id, outcome).expected, applicationRevision: revisions.application,
        answer: '17', ran: true, choiceSeed: 83, task, taskChecked: true},
      'pool-share': {variant: 0, inputs: lessonSetup('pool-share'), reason: 'ownership', ran: true},
    }};
    const cleaned = parseProgress(source), draft = cleaned.drafts[id];
    assert.deepEqual(new Set(cleaned.completed), new Set(source.completed));
    assert.equal(draft.inputs.futurePrice, inputs.futurePrice);
    assert.equal(draft.reason, '');
    assert.equal(draft.reasonRevision, revisions.reason);
    assert.equal(draft.application, source.drafts[id].application);
    assert.equal(draft.prediction, outcome.prediction);
    assert.equal(draft.answer, '17');
    assert.equal(draft.ran, true);
    assert.equal(draft.choiceSeed, 83);
    assert.equal(cleaned.drafts['pool-share'].reason, 'ownership');
    if (task) {
      assert.deepEqual(draft.task, task);
      assert.equal(draft.taskChecked, false);
    }
    assert.deepEqual(parseProgress(cleaned), cleaned);
    draft.reason = outcome.reason;
    assert.equal(parseProgress(cleaned).drafts[id].reason, outcome.reason);
  }
});

test('new fee and challenge predictions clear old winner guesses while retaining checked work', () => {
  for (const [id, former] of [['fee-break-even', 'short'], ['final-challenge', 'hold']]) {
    const inputs = lessonSetup(id), revisions = essentialQuestionRevisions(id, 0);
    const outcome = runLesson(id, inputs);
    const task = matchChallengeHolding(inputs, inputs.initialPrice * .75);
    const old = { version: 1, completed: [id], drafts: { [id]: {
      inputs, variant: 0, prediction: former, reason: outcome.reason, reasonRevision: revisions.reason,
      application: lessonApplication(id, outcome).expected, applicationRevision: revisions.application,
      ran: true, task, taskChecked: true,
    } } };
    const clean = parseProgress(old), draft = clean.drafts[id];
    assert.equal(draft.prediction, '');
    assert.deepEqual(clean.completed, [id]);
    assert.equal(draft.reason, outcome.reason);
    assert.equal(draft.application, old.drafts[id].application);
    if (id === 'final-challenge') {
      assert.deepEqual(draft.task, task);
      assert.equal(draft.taskChecked, true);
    }
  }
});
