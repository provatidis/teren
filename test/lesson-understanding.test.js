import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LESSON_IDS, VARIANTS, lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonApplication, checkLessonUnderstanding, essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';
import { appliedApplication, appliedCostExample, checkAppliedUnderstanding } from '../public/lib/applied-applications.js';
import { appliedQuestion } from '../public/lib/applied-lessons.js';
import { validatePositionPeriod } from '../public/data/position-period.js';
import { matchChallengeHolding } from '../public/models/liquidity-challenge.js';
import { LESSONS } from '../public/learning/liquidity-essentials.js';
import { APPLIED_LESSONS } from '../public/learning/applied-liquidity.js';
import { parseProgress } from '../public/data/learning-progress.js';
import { deeperPoolQuestion, depositPrediction, lessonFinding } from '../public/lib/lesson-narration.js';
import { fmt, usd } from '../public/lib/format.js';
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

test('every lesson asks one answerable question after its figure, independently of predictions', () => {
  for (const id of LESSON_IDS) for (let variant = 0; variant < VARIANTS; variant++) {
    const input = lessonSetup(id,variant), before = {...input}, result = runLesson(id,input,variant);
    const copy = lessonApplicationCopy(id,result);
    const task = id === 'final-challenge' ? matchChallengeHolding(result.setup, result.setup.initialPrice * .75) : undefined;
    assert.equal(copy.choices.filter(([value])=>value===copy.expected).length,1);
    assert.equal(checkLessonUnderstanding(id,input,variant,copy.expected,task).passed,true);
    assert.equal(checkLessonUnderstanding(id,input,variant,'',task).passed,false);
    for (const [answer] of copy.choices) assert.equal(checkLessonUnderstanding(id,input,variant,answer,task).passed,answer===copy.expected);
    assert.equal(checkLessonUnderstanding(id,input,variant,'unknown',task).passed,false);
    // The challenge also needs its task; no other lesson has one.
    assert.equal(checkLessonUnderstanding(id,input,variant,copy.expected).passed,id!=='final-challenge');
    assert.deepEqual(Object.keys(checkLessonUnderstanding(id,input,variant,copy.expected,task)).sort(),['application','demonstration','passed']);
    assert.deepEqual(input,before);
    // Its case, the question, a hint, and feedback for the right answer.
    assert.ok(copy.context && copy.question && copy.hint && (copy.feedbackByChoice[copy.expected] || copy.feedback), id);
    assert.ok(copy.choices.length === 3 || id === 'final-challenge' && copy.choices.length === 2);
    assert.doesNotMatch(JSON.stringify(copy),/NaN|undefined|Infinity/);
  }
});
test('each question is built from the selected setup and its wrong answers are false there, at extremes too', () => {
  for (let variant=0;variant<VARIANTS;variant++) {
    const start = lessonSetup('swap-impact',variant);
    for (const amount of [1,start.amount,start.reserveEth/2]) {
      const result=runLesson('swap-impact',{amount},variant), app=lessonApplication('swap-impact',result);
      assert.deepEqual([app.kind,app.expected],['deeper-pool','deeper']);
      // The deeper pool pays more, so "neither" and "this pool" are false.
      assert.equal(app.deeperOut,result.deeperOut); assert.ok(result.deeperOut>result.out);
    }
    // Lesson 2: another provider changes the share and leaves the tokens. The
    // scene itself shows a trade, so no variation asks about that again.
    const share=runLesson('pool-share',lessonSetup('pool-share',variant),variant), app=lessonApplication('pool-share',share);
    assert.deepEqual([app.kind,app.expected],[variant===1?'later-withdrawal':'later-deposit','same-tokens']);
    const pool=share.setup.reserveEth+share.setup.depositEth, mine=share.setup.depositEth;
    for (const other of [-share.setup.reserveEth/2,share.setup.reserveEth]) {
      // A proportional deposit or withdrawal by someone else scales the pool and its LP tokens together.
      const after=pool+other, myShare=mine/after;
      assert.equal(myShare<mine/pool,other>0);
      assert.ok(Math.abs(myShare*after-mine)<1e-12);
    }
    for (const multiplier of [.5,.75,1,1.5,2]) {
      const futurePrice=start.initialPrice*multiplier;
      assert.equal(lessonApplication('token-balances',runLesson('token-balances',{futurePrice},variant)).expected,'rebalance');
      // Lesson 4: two true readings of one claim.
      const original=runLesson('loss-vs-profit',{futurePrice},variant), views=lessonApplication('loss-vs-profit',original);
      const copy=lessonApplicationCopy('loss-vs-profit',original), r=views.result, invested=views.setup.investment;
      assert.deepEqual([views.kind,views.expected],['two-views','both-right']);
      // At the starting price there is nothing to compare, so the question borrows the variation's own move.
      assert.equal(views.setup.futurePrice,multiplier===1?lessonSetup('loss-vs-profit',variant).futurePrice:futurePrice);
      assert.ok(Math.abs(views.returnPercent-(r.lpBeforeFees/invested-1)*100)<1e-12);
      assert.ok(Math.abs(views.behindPercent-r.breakEvenFees/r.holdValue*100)<1e-12);
      const up=views.setup.futurePrice>views.setup.initialPrice, change=fmt(Math.abs(views.returnPercent),2)+'%', behind=fmt(views.behindPercent,2)+'%';
      assert.equal(copy.context,'Your dashboard says you are '+(up?'up ':'down ')+change+' on what you started with. Another view says you are '+behind+' behind holding.');
      assert.equal(copy.question,'Can both be right?');
      const text=Object.fromEntries(copy.choices);
      assert.equal(text['both-right'],'Yes. One compares with what I started with, the other with holding.');
      assert.ok(views.behindPercent>0 && r.lpBeforeFees<r.holdValue,'Behind holding either way.');
      if (up) {
        // Up and behind at once, and no money lost: both "No" answers are false.
        assert.ok(r.lpBeforeFees>invested);
        assert.equal(text['profit-only'],'No. A claim that is up '+change+' cannot be behind.');
        assert.equal(text['gap-only'],'No. A claim that is behind holding has lost money.');
        assert.ok(copy.feedbackByChoice['gap-only'].includes(usd(r.lpBeforeFees-invested)+' more than you started with'));
      } else {
        // Holding fell too, so the fall and the gap are different sizes: both "No" answers are false.
        assert.ok(r.lpBeforeFees<invested && r.holdValue<invested);
        assert.ok(Math.abs(views.returnPercent)>views.behindPercent && change!==behind);
        assert.equal(text['profit-only'],'No. A claim that is down '+change+' is '+change+' behind holding.');
        assert.equal(text['gap-only'],'No. A claim that is '+behind+' behind holding has lost only '+behind+'.');
        assert.ok(copy.feedbackByChoice['profit-only'].includes(usd(r.holdValue)+', down from '+usd(invested)));
      }
      assert.ok(copy.feedback.includes(usd(r.holdValue)) && copy.feedback.includes(usd(r.breakEvenFees)+' behind'));
      // Lesson 5: the figure's fees are an amount the reader sets.
      for (const fees of [0,100,start.investment/2]) {
        const priced=runLesson('fee-break-even',{futurePrice,fees},variant), evidence=lessonApplication('fee-break-even',priced);
        assert.deepEqual([evidence.kind,evidence.expected],['fee-evidence','record']);
        assert.equal(evidence.gap,priced.result.breakEvenFees);
        assert.ok(lessonApplicationCopy('fee-break-even',priced).context.startsWith(multiplier===1?'Enter any fees and':'Enter more than '+usd(evidence.gap)+' in fees and'));
      }
      // Lesson 6: the same idea whatever the range and wherever the price ends.
      for (const width of [.05,.1,.5]) {
        const ranged=runLesson('range-boundaries',{futurePrice,width},variant), path=lessonApplication('range-boundaries',ranged);
        assert.deepEqual([path.kind,path.expected,path.state],['path-fees','path',ranged.result.state]);
      }
    }
    // The amount lesson 5's question names can be reached on its fee slider, which runs to a tenth of the start.
    const fee=runLesson('fee-break-even',lessonSetup('fee-break-even',variant),variant);
    assert.ok(fee.result.breakEvenFees<Math.max(fee.setup.investment/10,fee.setup.fees),'variation '+(variant+1));
    assert.equal(lessonApplication('final-challenge',runLesson('final-challenge',lessonSetup('final-challenge',variant),variant)).expected,'relative-gap');
  }
  assert.throws(()=>lessonApplication('unknown',{setup:{}}));
});
test('every wrong answer has its own feedback, and the deeper-pool question answers each choice with both quotes', () => {
  for (const item of LESSONS) for (let variant=0;variant<VARIANTS;variant++) {
    const result=runLesson(item.id,lessonSetup(item.id,variant),variant);
    const copy=lessonApplicationCopy(item.id,result);
    // The case is its own sentence above the question: no extra label.
    assert.equal('label' in copy,false); assert.equal('evidence' in copy,false);
    for (const [answer] of copy.choices) if(answer!==copy.expected) assert.ok(copy.feedbackByChoice[answer],item.id+' '+answer);
    assert.equal(copy.expected in copy.feedbackByChoice && Boolean(copy.feedback),false,'One feedback for the right answer.');
    if(item.id==='swap-impact') for (const [answer] of copy.choices) {
      const feedback=copy.feedbackByChoice[answer];
      assert.ok(feedback.includes(fmt(result.out,2)+' USDC')&&feedback.includes(fmt(result.deeperOut,2)+' USDC'),feedback);
    }
    // Each lesson's cut second question leaves no trace in its definition.
    for (const key of ['reasoning','reasons','reasonFeedbackByChoice']) assert.equal(key in item,false,item.id+' '+key);
  }
});
test('answers to replaced questions are cleared without erasing completion, and the challenge keeps its unchanged question', () => {
  const former = {'swap-impact':'quote-received','pool-share':'diluted-same-claim','token-balances':'original-mix','loss-vs-profit':'holding-basket','fee-break-even':'gap-reopens','range-boundaries':'narrow-out','final-challenge':'relative-gap'};
  const priorApplication = (id,variant) => id==='swap-impact'?3:id==='pool-share'?[2,3,2][variant]:id==='loss-vs-profit'?(variant!==1?4:3):id==='range-boundaries'?[2,3,2][variant]:id==='fee-break-even'?3:id==='final-challenge'?2:variant===1?2:1;
  const priorPrediction = (id,variant) => id==='fee-break-even'?4:['final-challenge','pool-share','loss-vs-profit'].includes(id)||(id==='range-boundaries'&&variant>0)?2:1;
  for (const id of LESSON_IDS) for (let variant=0;variant<VARIANTS;variant++) {
    const result=runLesson(id,lessonSetup(id,variant),variant), revisions=essentialQuestionRevisions(id,variant);
    assert.deepEqual(Object.keys(revisions).sort(),['application','prediction']);
    const kept=id==='final-challenge';
    assert.equal(revisions.application>priorApplication(id,variant),!kept,id+' '+variant);
    assert.equal(revisions.application===priorApplication(id,variant),kept);
    const old={version:1,completed:[id],lastLesson:id,drafts:{[id]:{
      variant,inputs:result.setup,reason:'former',reasonRevision:4,
      application:former[id],applicationRevision:priorApplication(id,variant),
      prediction:result.prediction,predictionRevision:priorPrediction(id,variant),answer:'123',ran:true,choiceSeed:19,
    }}};
    const migrated=parseProgress(old), draft=migrated.drafts[id];
    assert.deepEqual(migrated.completed,[id]);
    assert.equal(draft.application,kept?former[id]:'');
    assert.equal(draft.applicationRevision,revisions.application);
    // The second question's answer is not carried anywhere.
    assert.equal('reason' in draft,false); assert.equal('reasonRevision' in draft,false);
    // Lessons 1, 3 and 7 ask a reworded prediction, so theirs is cleared too.
    assert.equal(draft.prediction,['swap-impact','token-balances','final-challenge'].includes(id)?'':result.prediction,id);
    assert.equal(draft.predictionRevision,revisions.prediction);
    assert.equal(draft.answer,'123');
    assert.equal(draft.ran,true);
    assert.equal(draft.choiceSeed,19);
    draft.application=lessonApplication(id,result).expected; draft.prediction=result.prediction;
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

test('the deeper-pool question uses each variation’s own swap', () => {
  for (let variant = 0; variant < VARIANTS; variant++) {
    const setup = lessonSetup('swap-impact', variant), result = runLesson('swap-impact', setup, variant);
    // Same swap, same starting price and fee, ten times the balances.
    const effective = setup.amount * 0.997, deepEth = setup.reserveEth * 10;
    const expected = deepEth * setup.initialPrice * effective / (deepEth + effective);
    assert.ok(Math.abs(result.deeperOut - expected) < 0.01, variant + ': ' + result.deeperOut + ' vs ' + expected);
    assert.ok(result.deeperOut > result.out && result.deeperOut < setup.amount * setup.initialPrice);
    const copy = deeperPoolQuestion(result), asked = lessonApplicationCopy('swap-impact', result);
    assert.match(copy.context, new RegExp('You sell ' + setup.amount + ' ETH into each\\.$'));
    assert.equal(copy.question, 'Which pool gives you more USDC, and why?');
    assert.deepEqual(Object.keys(copy.feedbackByChoice).sort(), copy.choices.map(([id]) => id).sort());
    assert.deepEqual([asked.context, asked.question, asked.choices, asked.hint], [copy.context, copy.question, copy.choices, copy.hint]);
    assert.ok(checkLessonUnderstanding('swap-impact', setup, variant, 'deeper').passed);
    assert.equal(checkLessonUnderstanding('swap-impact', setup, variant, 'equal').passed, false);
  }
});

test('lesson 2 asks its share prediction in each variation’s numbers and never repeats its own scene', () => {
  for (let variant = 0; variant < VARIANTS; variant++) {
    const setup = lessonSetup('pool-share', variant), result = { ...runLesson('pool-share', setup, variant), variant };
    const prediction = depositPrediction(setup), choice = Object.fromEntries(prediction.choices);
    assert.equal(result.prediction, 'less');
    // The correct choice is the deposit against the enlarged pool; the other is against the pool before it.
    assert.equal(choice.less, fmt(result.share, 2) + '%, my ' + setup.depositEth + ' ETH out of the ' + (setup.reserveEth + setup.depositEth) + ' ETH it will hold');
    assert.equal(choice.same, setup.depositEth / setup.reserveEth * 100 + '%, my ' + setup.depositEth + ' ETH out of the ' + setup.reserveEth + ' ETH it holds now');
    assert.match(lessonFinding('pool-share', result), new RegExp('holds ' + (setup.reserveEth + setup.depositEth) + ' ETH after your deposit, and ' + setup.depositEth + ' of them came from you\\. You own ' + fmt(result.share, 2).replace('.', '\\.') + '% of the pool'));
    // Every variation asks the same idea: another provider changes the share, and the tokens stay.
    const copy = lessonApplicationCopy('pool-share', result), leaves = variant === 1;
    assert.equal(copy.context, leaves ? 'Another provider withdraws their share of both tokens. Nobody trades. Your share gets larger.'
      : 'Another provider adds both tokens in the pool’s current ratio. Nobody trades. Your share gets smaller.');
    assert.equal(copy.question, 'What happens to the tokens you could withdraw right now?');
    assert.deepEqual(copy.choices.map(([id]) => id), ['same-tokens', 'follow-share', 'follow-pool']);
    assert.deepEqual(copy.choices.map(([, text]) => text), leaves ? ['They stay the same.', 'They grow with my share.', 'They shrink with the pool.']
      : ['They stay the same.', 'They shrink with my share.', 'They grow with the pool.']);
    assert.match(copy.feedback, leaves ? /^You own a larger share of a smaller pool\./ : /^You own a smaller share of a larger pool\./);
    assert.doesNotMatch(JSON.stringify(copy), /trader|swap\b/i, 'The scene already shows a trade.');
    for (const [, text] of copy.choices) assert.doesNotMatch(text, /percentage|fraction|reserves/, 'Use “share” in the choices.');
    assert.ok(checkLessonUnderstanding('pool-share', setup, variant, copy.expected).passed);
  }
});
