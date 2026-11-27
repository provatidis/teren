import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonSetup } from '../public/models/lesson-experiments.js';
import { checkLessonUnderstanding, essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { checkLiquidityChallenge, challengeSetup, matchChallengeHolding } from '../public/models/liquidity-challenge.js';
import { parseProgress } from '../public/data/learning-progress.js';
import { runLesson } from '../public/models/lesson-experiments.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';
import { calculateScenario } from '../public/models/cp50-v1.js';
import { usd } from '../public/lib/format.js';

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
  // It stays with the reader's claim. It does not switch to what a pool paid.
  assert.equal(copy('fee-break-even').feedbackByChoice.figure, 'The figure is ahead because of the fee amount you entered. It cannot show what a real claim earned.');
  assert.match(copy('fee-break-even').feedback, /an amount you chose[\s\S]*Its costs count too, and this figure leaves them out\.$/);
  assert.match(copy('range-boundaries').feedbackByChoice['same-end'], /the two paths did not have the same trades/);
  // With no example yet, the challenge's feedback makes no claim about one.
  assert.equal(copy('final-challenge').feedbackByChoice['capital-restored'], 'Matching holding closes the gap to holding. When holding itself is below your start, that dollar loss remains.');
});

test('the challenge’s feedback on the wrong answer describes the reader’s own example as it stands', () => {
  for (let variant = 0; variant < 3; variant++) {
    const outcome = runLesson('final-challenge', lessonSetup('final-challenge', variant), variant), s = outcome.setup;
    const wrong = task => lessonApplicationCopy('final-challenge', outcome, task).feedbackByChoice['capital-restored'];
    const at = task => calculateScenario({ ...s, futurePrice: task.price, fees: task.fees });
    // Solved: both bars meet below the start, and the loss it names is the one on screen.
    const solved = matchChallengeHolding(s, s.initialPrice * .75), held = at(solved).holdValue;
    assert.equal(wrong(solved), 'In your example your claim and holding are both worth ' + usd(held) + ', which is ' + usd(s.investment - held)
      + ' less than you started with. Fees closed the gap to holding. That loss remains.');
    // Below the start and not matching yet, with no fees or with far too many.
    for (const fees of [0, s.investment / 2]) {
      const task = { price: s.initialPrice * .75, fees };
      assert.equal(checkLiquidityChallenge(s, task).matchesHolding, false);
      assert.equal(wrong(task), 'In your example holding is worth ' + usd(held) + ', which is ' + usd(s.investment - held)
        + ' less than you started with. A claim that matches it is worth the same, so the gap to holding closes and that loss remains.');
    }
    // At or above the start holding has lost nothing: it must never be told it has.
    for (const [price, where] of [[s.initialPrice, 'at'], [s.initialPrice * 1.5, 'above'], [s.initialPrice * 2, 'above']]) {
      for (const task of [{ price, fees: 0 }, matchChallengeHolding(s, price)]) {
        assert.ok(at(task).holdValue >= s.investment - .01);
        const text = wrong(task);
        assert.equal(text, 'In your example holding is ' + where + ' your start, so there is no loss on screen to cover. Choose a lower price. A claim that matches holding there is still worth less than you started with.');
        assert.doesNotMatch(text, /below your start/);
      }
    }
    // A value the task cannot hold falls back to the general statement.
    for (const task of [undefined, null, {}, { price: s.initialPrice * 3, fees: 0 }, { price: s.initialPrice, fees: -1 }]) {
      assert.equal(wrong(task), 'Matching holding closes the gap to holding. When holding itself is below your start, that dollar loss remains.');
    }
    // The question, its answers and its hint do not depend on the example.
    const plain = lessonApplicationCopy('final-challenge', outcome), moved = lessonApplicationCopy('final-challenge', outcome, solved);
    assert.deepEqual([moved.question, moved.choices, moved.hint, moved.feedback, moved.context], [plain.question, plain.choices, plain.hint, plain.feedback, '']);
    assert.equal(plain.hint, 'When the two bars line up, where are they relative to the dashed starting line?');
  }
});
