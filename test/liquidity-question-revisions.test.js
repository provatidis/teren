import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSON_IDS, lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonApplication, checkLessonUnderstanding, essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { parseProgress } from '../public/data/learning-progress.js';
import { matchChallengeHolding } from '../public/models/liquidity-challenge.js';

test('custom saved prices keep their lesson, its completion and a current answer', () => {
  for (const id of ['token-balances', 'loss-vs-profit', 'final-challenge']) for (const variant of [0, 1, 2]) {
    const setup = lessonSetup(id, variant);
    const inputs = {...setup, futurePrice: setup.initialPrice * .87};
    const outcome = runLesson(id, inputs, variant);
    const revisions = essentialQuestionRevisions(id, variant);
    const task = id === 'final-challenge' ? matchChallengeHolding(outcome.setup, setup.initialPrice * .75) : undefined;
    const source = {version: 1, lastLesson: id, completed: [id, 'pool-share'], drafts: {
      [id]: {variant, inputs, prediction: outcome.prediction, predictionRevision: revisions.prediction,
        application: lessonApplication(id, outcome).expected, applicationRevision: revisions.application,
        answer: '17', ran: true, choiceSeed: 83, task, taskChecked: true},
      'pool-share': {variant: 0, inputs: lessonSetup('pool-share'), ran: true},
    }};
    const cleaned = parseProgress(source), draft = cleaned.drafts[id];
    assert.deepEqual(new Set(cleaned.completed), new Set(source.completed));
    assert.equal(draft.inputs.futurePrice, inputs.futurePrice);
    assert.equal(draft.application, source.drafts[id].application);
    assert.equal(draft.prediction, outcome.prediction);
    assert.equal(draft.answer, '17');
    assert.equal(draft.ran, true);
    assert.equal(draft.choiceSeed, 83);
    assert.equal(checkLessonUnderstanding(id, draft.inputs, variant, draft.application, draft.task).passed, true);
    if (task) {
      assert.deepEqual(draft.task, task);
      assert.equal(draft.taskChecked, true);
    }
    assert.deepEqual(parseProgress(cleaned), cleaned);
  }
});

test('a second answer saved by an earlier version is dropped, and it no longer decides anything', () => {
  for (const id of LESSON_IDS) for (const variant of [0, 1, 2]) {
    const inputs = lessonSetup(id, variant), outcome = runLesson(id, inputs, variant), revisions = essentialQuestionRevisions(id, variant);
    const task = id === 'final-challenge' ? matchChallengeHolding(inputs, inputs.initialPrice * .75) : undefined;
    const saved = { version: 1, completed: [id], drafts: { [id]: {
      inputs, variant, prediction: outcome.prediction, predictionRevision: revisions.prediction,
      reason: 'anything', reasonRevision: 1,
      application: lessonApplication(id, outcome).expected, applicationRevision: revisions.application,
      ran: true, task, taskChecked: true,
    } } };
    const draft = parseProgress(saved).drafts[id];
    assert.equal('reason' in draft, false);
    assert.equal(draft.application, saved.drafts[id].application);
    if (task) assert.equal(draft.taskChecked, true, 'A checked challenge stays checked without the second answer.');
  }
});

test('new fee and challenge predictions clear old guesses while retaining checked work', () => {
  for (const [id, former] of [['fee-break-even', 'short'], ['final-challenge', 'same-price']]) {
    const inputs = lessonSetup(id), revisions = essentialQuestionRevisions(id, 0);
    const outcome = runLesson(id, inputs);
    const task = matchChallengeHolding(inputs, inputs.initialPrice * .75);
    const old = { version: 1, completed: [id], drafts: { [id]: {
      inputs, variant: 0, prediction: former, predictionRevision: revisions.prediction - 1,
      application: lessonApplication(id, outcome).expected, applicationRevision: revisions.application,
      ran: true, task, taskChecked: true,
    } } };
    const clean = parseProgress(old), draft = clean.drafts[id];
    assert.equal(draft.prediction, '');
    assert.deepEqual(clean.completed, [id]);
    assert.equal(draft.application, old.drafts[id].application);
    if (id === 'final-challenge') {
      assert.deepEqual(draft.task, task);
      assert.equal(draft.taskChecked, true);
    }
  }
});
