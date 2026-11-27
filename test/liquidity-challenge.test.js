import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonSetup } from '../public/models/lesson-experiments.js';
import { checkLessonUnderstanding, essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { checkLiquidityChallenge, challengeSetup, matchChallengeHolding } from '../public/models/liquidity-challenge.js';
import { parseProgress } from '../public/data/learning-progress.js';
import { runLesson } from '../public/models/lesson-experiments.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';

test('the challenge accepts many loss-making matched cases and requires both comparisons', () => {
  for (let variant = 0; variant < 3; variant++) {
    const input = lessonSetup('final-challenge', variant), before = structuredClone(input);
    for (const fraction of [.5, .63, .75, .9, .99]) {
      const setup = matchChallengeHolding(input, input.initialPrice * fraction);
      const state = checkLiquidityChallenge(input, setup);
      assert.equal(state.passed, true);
      // Independent closed-form holding value; no model-derived expected answer.
      assert.ok(Math.abs(state.result.lpValue - input.investment * (1 + fraction) / 2) < 1e-8);
      assert.equal(checkLessonUnderstanding('final-challenge', input, variant, 'relative-gap', setup).passed, true);
      assert.equal(checkLessonUnderstanding('final-challenge', input, variant, 'capital-restored', setup).passed, false);
    }
    for (const fraction of [1, 1.5, 2]) {
      assert.equal(checkLiquidityChallenge(input, matchChallengeHolding(input, input.initialPrice * fraction)).passed, false);
    }
    assert.equal(checkLiquidityChallenge(input, {price: input.initialPrice * .75, fees: 0}).passed, false);
    const near = matchChallengeHolding(input, input.initialPrice * (1 - 1e-10));
    assert.equal(checkLiquidityChallenge(input, near).passed, false, 'Rounded starting values are not a meaningful dollar-loss example.');
    assert.equal(checkLessonUnderstanding('final-challenge', input, variant, 'relative-gap').passed, false);
    assert.deepEqual(input, before);
  }
});

test('invalid task inputs cannot count as a constructed example', () => {
  const input = lessonSetup('final-challenge');
  for (const bad of [null, {}, {price:1000,fees:-1}, {price:1000,fees:2501}, {price:999,fees:10}, {price:4001,fees:10}, {price:NaN,fees:0}, {price:1000,fees:Infinity}, {price:'1000',fees:10}]) {
    assert.equal(challengeSetup(input,bad),null);
    assert.equal(checkLiquidityChallenge(input,bad).passed,false);
  }
});

test('question revisions preserve completion and clear only materially changed answers', () => {
  for (const id of ['swap-impact','pool-share','token-balances','loss-vs-profit','fee-break-even','range-boundaries','final-challenge']) {
    for (let variant=0;variant<3;variant++) {
      const inputs=lessonSetup(id,variant), old={version:1,completed:[id],lastLesson:id,drafts:{[id]:{variant,inputs,prediction:'less',reason:'old-reason',application:'old-answer',answer:'123',ran:true}}};
      const clean=parseProgress(old), draft=clean.drafts[id], revision=essentialQuestionRevisions(id,variant);
      assert.deepEqual(clean.completed,[id]); assert.deepEqual(draft.inputs,inputs);
      assert.equal(draft.prediction,revision.prediction===1?'less':''); assert.equal(draft.answer,'123'); assert.equal(draft.ran,true);
      assert.equal('reason' in draft,false);
      assert.equal(draft.application,revision.application===1?'old-answer':'');
      assert.deepEqual(parseProgress(clean),clean);
    }
  }
});

test('checked task state survives reload independently from the worked question', () => {
  const id='final-challenge', inputs=lessonSetup(id), task=matchChallengeHolding(inputs,1500);
  const value={version:1,completed:[id],lastLesson:id,drafts:{[id]:{variant:0,inputs,application:'relative-gap',applicationRevision:essentialQuestionRevisions(id,0).application,task,taskChecked:true,ran:true}}};
  const clean=parseProgress(value);
  assert.deepEqual(clean.drafts[id].task,task); assert.equal(clean.drafts[id].taskChecked,true);
  assert.equal(clean.drafts[id].inputs.futurePrice,4000); assert.equal(clean.drafts[id].inputs.fees,100);
  assert.deepEqual(parseProgress(clean),clean);
  value.drafts[id].task.price=0;
  const corrupt=parseProgress(value);
  assert.equal(corrupt.drafts[id].task,null); assert.equal(corrupt.drafts[id].taskChecked,false);
  assert.deepEqual(corrupt.completed,[id]);
});

test('corrective feedback names what each wrong answer overlooks', () => {
  const copy = id => lessonApplicationCopy(id, runLesson(id, lessonSetup(id)));
  assert.match(copy('pool-share').feedbackByChoice['follow-pool'], /back their own claim, not yours/);
  assert.match(copy('fee-break-even').feedbackByChoice.figure, /cannot show whether any pool paid that amount/);
  assert.match(copy('fee-break-even').feedback, /an amount you chose[\s\S]*Its costs count too, and this figure leaves them out\.$/);
  assert.match(copy('range-boundaries').feedbackByChoice['same-end'], /the two paths did not have the same trades/);
  assert.match(copy('final-challenge').feedbackByChoice['capital-restored'], /leaves that dollar loss/);
});
