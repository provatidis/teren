import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LESSON_IDS, VARIANTS, lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonApplication, checkLessonUnderstanding, essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { calculateScenario } from '../public/models/cp50-v1.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';
import { appliedApplication, appliedCostExample, checkAppliedUnderstanding } from '../public/lib/applied-applications.js';
import { appliedQuestion } from '../public/lib/applied-lessons.js';
import { validatePositionPeriod } from '../public/data/position-period.js';
import { matchChallengeHolding } from '../public/models/liquidity-challenge.js';
import { LESSONS } from '../public/learning/liquidity-essentials.js';
import { APPLIED_LESSONS } from '../public/learning/applied-liquidity.js';
import { parseProgress } from '../public/data/learning-progress.js';
import { parseAppliedProgress } from '../public/data/applied-progress.js';
import { newChoiceSeed, validChoiceSeed, orderedLearningChoices, predictionFeedback } from '../public/lib/learning-choices.js';

test('prediction feedback distinguishes a guess from a skipped observation', () => {
  const choices = [['more', 'More ETH'], ['less', 'Less ETH.']];
  assert.equal(predictionFeedback(choices, '', 'less'), 'In this setup: Less ETH.');
  assert.equal(predictionFeedback(choices, 'unknown', 'less'), 'In this setup: Less ETH.');
  assert.equal(predictionFeedback(choices, 'more', 'less'), 'The result differs from your prediction. In this setup: Less ETH. You expected: More ETH.');
  assert.equal(predictionFeedback(choices, 'less', 'less'), 'Your prediction matches. In this setup: Less ETH.');
  assert.equal(predictionFeedback(choices, '', 'less', 'The record shows fewer tokens.'), 'The record shows fewer tokens.');
});

const [baseline, returning] = await Promise.all(['uniswap-v3-position-period.json','uniswap-v3-position-range-return.json'].map(async file => validatePositionPeriod(JSON.parse(await readFile(new URL('../public/examples/' + file, import.meta.url),'utf8')))));

test('every exercise requires explanation and transfer, independently of numeric practice or predictions', () => {
  for (const id of LESSON_IDS) for (let variant = 0; variant < VARIANTS; variant++) {
    const input = lessonSetup(id,variant), before = {...input}, result = runLesson(id,input,variant);
    const copy = lessonApplicationCopy(id,result), item = LESSONS.find(lesson=>lesson.id===id);
    const task = id === 'final-challenge' ? matchChallengeHolding(result.setup, result.setup.initialPrice * .75) : undefined;
    assert.equal(copy.choices.filter(([value])=>value===copy.expected).length,1);
    assert.equal(checkLessonUnderstanding(id,input,variant,result.reason,copy.expected,task).passed,true);
    assert.equal(checkLessonUnderstanding(id,input,variant,'',copy.expected,task).passed,false);
    assert.equal(checkLessonUnderstanding(id,input,variant,result.reason,'',task).passed,false);
    for (const [reason] of item.reasons) for (const [answer] of copy.choices) {
      assert.equal(checkLessonUnderstanding(id,input,variant,reason,answer,task).passed,reason===result.reason && answer===copy.expected);
    }
    assert.equal(checkLessonUnderstanding(id,input,variant,'unknown','unknown').passed,false);
    assert.deepEqual(input,before);
    assert.ok(copy.context && copy.question && copy.hint && copy.feedback);
    assert.doesNotMatch(JSON.stringify(copy),/NaN|undefined|Infinity/);
  }
});
test('transfer changes the actual selected setup, including extremes and falling-price variations', () => {
  for (let variant=0;variant<VARIANTS;variant++) {
    const start = lessonSetup('swap-impact',variant);
    for (const amount of [1,start.reserveEth/2]) {
      const result=runLesson('swap-impact',{amount},variant), app=lessonApplication('swap-impact',result);
      assert.equal(app.quote,result.out);
      assert.equal(app.impact,result.impact);
      assert.equal(app.minimumReceived,result.out*.995);
      assert.equal(app.expected,'quote-received');
    }
    const share=runLesson('pool-share',lessonSetup('pool-share',variant),variant), app=lessonApplication('pool-share',share);
    assert.equal(app.expected,['share-same','diluted-same-claim','reverse-swap'][variant]);
    for (const multiplier of [.5,1,1.5,2]) {
      const futurePrice=start.initialPrice*multiplier;
      const balances=lessonApplication('token-balances',runLesson('token-balances',{futurePrice},variant));
      assert.equal(balances.expected,variant===1?'more-eth-less-value':'original-mix');
      assert.equal(balances.next.setup.initialPrice,start.initialPrice);
      if (variant===1) {
        assert.ok(balances.next.result.pooled.eth>balances.next.result.held.eth);
        assert.ok(balances.next.result.lpValue<start.investment);
      } else assert.deepEqual(balances.next.result.pooled,balances.next.result.held);
      const loss=lessonApplication('loss-vs-profit',runLesson('loss-vs-profit',{futurePrice},variant));
      assert.equal(loss.expected,variant===1?'gap-unchanged':'holding-basket');
      if (variant===1) {
        assert.ok(loss.next.result.lpBeforeFees < loss.next.result.holdValue);
        assert.equal(loss.next.result.lpReturn>0,multiplier<1);
      } else {
        assert.equal(loss.next.setup.futurePrice,futurePrice);
        assert.equal(loss.next.result.lpValue,loss.next.result.lpBeforeFees+loss.fees);
      }
      for (const fees of [0,100,start.investment/2]) {
        const original=runLesson('fee-break-even',{futurePrice,fees},variant), changed=lessonApplication('fee-break-even',original);
        assert.equal(changed.fees,original.result.breakEvenFees);
        assert.ok(changed.next.result.breakEvenFees>original.result.breakEvenFees);
        assert.equal(changed.expected,'gap-reopens');
      }
      for (const width of [.05,.1,.5]) {
        const original=runLesson('range-boundaries',{futurePrice,width},variant), changed=lessonApplication('range-boundaries',original);
        assert.equal(changed.expected,['both-inside','mostly-eth','eth-owned'][variant]);
        if (variant===2) { assert.equal(changed.next.result.state,'lower-edge'); assert.equal(changed.next.result.pooled.usdc,0); }
        else {
          assert.equal(changed.next.result.state,'inside');
          assert.ok(changed.next.result.pooled.eth>0 && changed.next.result.pooled.usdc>0);
          assert.equal(changed.next.result.finalEthPercent<50,variant===0);
        }
      }
    }
  }
  assert.throws(()=>lessonApplication('unknown',{setup:{}}));
});
test('the retained withdrawal variation moves custody without creating or erasing the holding shortfall', () => {
  for (const variant of [1]) {
    for (const multiplier of [.5,1,2]) {
      const setup=lessonSetup('loss-vs-profit',variant);
      const original=runLesson('loss-vs-profit',{futurePrice:setup.initialPrice*multiplier},variant);
      const application=lessonApplication('loss-vs-profit',original);
      const {pooled,held}=application.next.result;
      const walletValue=pooled.eth*application.futurePrice+pooled.usdc;
      const holdingValue=held.eth*application.futurePrice+held.usdc;
      assert.ok(Math.abs(walletValue-application.next.result.lpValue)<1e-8);
      assert.ok(Math.abs(walletValue-holdingValue-application.next.result.difference)<1e-8);
      assert.ok(walletValue<holdingValue);
      assert.equal(application.expected,'gap-unchanged');
    }
  }
});
test('a further price move can reopen a gap that earned USDC fees had covered', () => {
  for (let variant=0;variant<VARIANTS;variant++) {
    const setup=lessonSetup('fee-break-even',variant);
    for (const multiplier of [.5,.75,1,1.5,2]) {
      const original=runLesson('fee-break-even',{futurePrice:setup.initialPrice*multiplier,fees:setup.fees},variant);
      const before=structuredClone(original);
      const application=lessonApplication('fee-break-even',original);
      const matched=calculateScenario({...original.setup,fees:application.fees});
      assert.ok(Math.abs(matched.difference)<1e-8);
      assert.equal(application.next.setup.fees,application.fees);
      assert.deepEqual(application.next.result.held,matched.held);
      assert.ok(application.next.result.lpValue<application.next.result.holdValue);
      assert.equal(application.futurePrice>original.setup.futurePrice,multiplier>=1);
      assert.equal(application.expected,'gap-reopens');
      assert.deepEqual(original,before);
    }
  }
});
test('every essentials misconception has specific feedback and every application names its situation', () => {
  for (const item of LESSONS) for (let variant=0;variant<VARIANTS;variant++) {
    const result=runLesson(item.id,lessonSetup(item.id,variant),variant);
    const copy=lessonApplicationCopy(item.id,result);
    assert.ok(copy.label);
    for (const [reason] of item.reasons) {
      const dynamic=['token-balances','loss-vs-profit'].includes(item.id)||(item.id==='range-boundaries'&&reason==='zero');
      if(reason!==result.reason&&!dynamic) assert.ok(item.reasonFeedbackByChoice[reason]);
    }
    for (const [answer] of copy.choices) if(answer!==copy.expected) assert.ok(copy.feedbackByChoice[answer]);
    if(item.id==='fee-break-even') {
      assert.equal(copy.evidence.rows.length,3);
      assert.match(copy.evidence.note,/USDC/);
    }
  }
});
test('revised essentials applications clear obsolete answers without erasing completion or compatible drafts', () => {
  for(const id of ['loss-vs-profit','fee-break-even']) for(let variant=0;variant<VARIANTS;variant++) {
    const result=runLesson(id,lessonSetup(id,variant),variant);
    const old={version:1,completed:[id],lastLesson:id,drafts:{[id]:{
      variant,inputs:result.setup,reason:result.reason,reasonRevision:essentialQuestionRevisions(id,variant).reason,
      application:id==='loss-vs-profit'?'loss-and-gap':'same',applicationRevision:2,
      prediction:result.prediction,answer:'123',ran:true,choiceSeed:19,
    }}};
    const migrated=parseProgress(old), draft=migrated.drafts[id];
    assert.deepEqual(migrated.completed,[id]);
    assert.equal(draft.application,'');
    assert.equal(draft.applicationRevision,essentialQuestionRevisions(id,variant).application);
    assert.equal(draft.reason,result.reason);
    assert.equal(draft.prediction,result.prediction);
    assert.equal(draft.answer,'123');
    assert.equal(draft.ran,true);
    assert.equal(draft.choiceSeed,19);
    draft.application=lessonApplication(id,result).expected;
    assert.deepEqual(parseProgress(migrated),migrated);
  }
});
test('applied transfer exercises distinguish thought experiments from unchanged verified evidence', () => {
  const before = [JSON.stringify(baseline),JSON.stringify(returning)];
  for (const item of APPLIED_LESSONS) {
    const question=appliedQuestion(item.caseId==='in-range'?baseline:returning,item.id), app=appliedApplication(item.id,question);
    assert.equal(app.expected,item.id==='fees-over-time'?'same':item.id==='between-samples'?'edge-placement':'smaller-lead');
    for (const [reason] of item.reasons) for (const [answer] of app.choices) {
      assert.equal(checkAppliedUnderstanding(question,app,reason,answer).passed,reason===question.reason && answer===app.expected);
    }
    assert.equal(checkAppliedUnderstanding(question,app,question.reason,'').passed,false);
    if (item.id==='period-vs-holding') {
      const cost=appliedCostExample(question);
      assert.ok(question.view.gapUSD>0); assert.ok(cost.gapUSD<0);
      assert.equal(cost.lpUSD,question.view.lpUSD-1);
      assert.match(cost.text,/\$1.00/);
      assert.match(app.feedback,/fee|value/);
    }
  }
  assert.deepEqual([JSON.stringify(baseline),JSON.stringify(returning)],before);
  assert.throws(()=>appliedApplication('unknown',{}));
});
test('choice ordering is reproducible within a draft, varies across seeds and never mutates definitions', () => {
  const choices=[['correct','Correct'],['other','Other'],['third','Third']], before=structuredClone(choices), positions=new Set();
  for (let seed=0;seed<100;seed++) {
    const ordered=orderedLearningChoices(choices,seed,'lesson-reason');
    assert.deepEqual(ordered,orderedLearningChoices(choices,seed,'lesson-reason'));
    assert.deepEqual(ordered.map(([id])=>id).sort(),['correct','other','third']);
    positions.add(ordered.findIndex(([id])=>id==='correct'));
  }
  assert.deepEqual(choices,before); assert.equal(positions.size,3); assert.equal(validChoiceSeed(newChoiceSeed()),true);
  for (const invalid of [null,undefined,-1,2**32,.5,'1',NaN,Infinity]) assert.equal(validChoiceSeed(invalid),false);
});
test('additive draft fields preserve legacy completion and calculations without inventing new answers', () => {
  const old={version:1,completed:['token-balances'],lastLesson:'token-balances',drafts:{'token-balances':{variant:1,inputs:lessonSetup('token-balances',1),prediction:'more',reason:'rebalance',answer:'1.414',ran:true}}};
  const migrated=parseProgress(old), draft=migrated.drafts['token-balances'];
  assert.deepEqual(migrated.completed,old.completed); assert.equal(draft.answer,'1.414'); assert.equal(draft.ran,true);
  assert.equal(draft.application,''); assert.equal(draft.choiceSeed,null);
  draft.application='less'; draft.choiceSeed=4294967295;
  assert.deepEqual(parseProgress(migrated),migrated);
  draft.application='x'.repeat(25); draft.choiceSeed=-1;
  const stripped=parseProgress(migrated).drafts['token-balances']; assert.equal(stripped.application,''); assert.equal(stripped.choiceSeed,null);
  const applied=parseAppliedProgress({version:1,completed:['fees-over-time'],drafts:{'fees-over-time':{prediction:'earned',answer:'2.36',reason:'growth',revealed:true,checkpoint:8}}});
  assert.deepEqual(applied.completed,['fees-over-time']); assert.equal(applied.drafts['fees-over-time'].application,'');
  applied.drafts['fees-over-time'].application='same'; applied.drafts['fees-over-time'].choiceSeed=0;
  assert.deepEqual(parseAppliedProgress(applied),applied);
});
