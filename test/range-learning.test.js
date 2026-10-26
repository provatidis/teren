import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MANAGEMENT_IDS, MANAGEMENT_VARIANTS, managementCase, checkManagementUnderstanding } from '../public/models/range-decisions.js';
import { MANAGEMENT_LESSONS, managementPresentation, managementApplication } from '../public/learning/choosing-ranges.js';
import { managementLessonFromHash } from '../public/lib/management-links.js';
import { MANAGEMENT_KEY, emptyManagementProgress, parseManagementProgress, readManagementProgress, saveManagementProgress } from '../public/data/management-progress.js';
import { POOL_PITFALLS } from '../public/learning/pool-pitfalls.js';
import { LESSONS } from '../public/learning/liquidity-essentials.js';
import { APPLIED_LESSONS } from '../public/learning/applied-liquidity.js';
import { LESSON_IDS } from '../public/models/lesson-experiments.js';
import { APPLIED_IDS } from '../public/lib/applied-lessons.js';
import { rangeFromHash, rangeHash } from '../public/lib/range-links.js';

test('range widths use the same budget and price but each range’s own funding and holding basket',()=>{
  for(let variant=0;variant<3;variant++){
    const result=managementCase('range-width',variant);
    assert.equal(result.narrow.investment,result.wide.investment);assert.equal(result.narrow.initialPrice,2000);
    assert.equal(result.narrow.futurePrice,result.wide.futurePrice);
    assert.ok(result.narrow.liquidity>result.wide.liquidity);
    assert.notDeepEqual(result.narrow.initial,result.wide.initial);
    assert.equal(result.narrow.holdValue,result.narrow.initial.eth*result.price+result.narrow.initial.usdc);
    assert.equal(result.wide.state,'inside');assert.equal(result.prediction,variant===2?'both':'wide');
    assert.equal(result.narrow.state,['above','below','inside'][variant]);
    if(variant===2)assert.match(managementPresentation(result).reasoning,/Both are active/);
    assert.equal(result.application,['mix','wide-mix','own-basket'][variant]);
    for(const {scenario} of managementPresentation(result).links){
      const restored=rangeFromHash(rangeHash(scenario));assert.equal(restored.futurePrice,result.price);assert.equal(restored.fees,0);assert.equal(restored.fullRangeFees,0);
    }
  }
});
test('fee tiers alone never establish earnings, including supplied totals that reverse the tier ranking',()=>{
  assert.deepEqual(managementCase('fee-tiers',0).fees,[12,4]);
  for(let variant=0;variant<3;variant++){
    const result=managementCase('fee-tiers',variant),presentation=managementPresentation(result);
    assert.equal(result.prediction,'unknown');assert.equal(result.application,['smaller-share','more-income','larger-share'][variant]);
    assert.match(presentation.note,/supplied teaching facts/);assert.equal(presentation.links.length,0);
    if(variant===1)assert.ok(result.fees[0]>result.fees[1]&&result.rates[0]<result.rates[1]);
  }
});
test('an unchanged outside position retains its tokens and returns to activity without a new deposit',()=>{
  for(let variant=0;variant<3;variant++){
    const result=managementCase('range-management',variant);
    assert.equal(result.first.liquidity,result.second.liquidity);assert.equal(result.second.liquidity,result.returned.liquidity);
    assert.deepEqual(result.first.pooled,result.second.pooled);
    assert.equal(result.returned.state,'inside');assert.deepEqual(result.returned.pooled,result.returned.initial);
    assert.equal(result.prediction,['falls','same','rises'][variant]);assert.equal(result.application,['automatic','removed','sold-earlier'][variant]);
    if(variant===1){assert.equal(result.second.pooled.eth,0);assert.equal(result.second.lpBeforeFees,result.first.lpBeforeFees);}
    else{assert.equal(result.second.pooled.usdc,0);assert.equal(result.second.lpBeforeFees,result.second.pooled.eth*result.prices[1]);}
  }
});
test('every situation has one supported explanation and transfer answer, independent of its prediction',()=>{
  assert.deepEqual(MANAGEMENT_LESSONS.map(item=>item.id),MANAGEMENT_IDS);
  for(const lesson of MANAGEMENT_LESSONS)for(let variant=0;variant<MANAGEMENT_VARIANTS;variant++){
    const result=managementCase(lesson.id,variant),presentation=managementPresentation(result),transfer=managementApplication(result);
    assert.equal(presentation.predictions.filter(([id])=>id===result.prediction).length,1);
    assert.equal(lesson.reasons.filter(([id])=>id===result.reason).length,1);
    assert.equal(transfer.choices.filter(([id])=>id===result.application).length,1);
    for(const [reason]of lesson.reasons)for(const [application]of transfer.choices){
      assert.equal(checkManagementUnderstanding(lesson.id,variant,reason,application).passed,reason===result.reason&&application===result.application);
      if(reason!==result.reason)assert.ok(lesson.reasonFeedback[reason]);
      if(application!==result.application)assert.ok(transfer.feedbackByChoice[application]);
    }
    assert.equal(checkManagementUnderstanding(lesson.id,variant,'',result.application).passed,false);
    assert.equal(checkManagementUnderstanding(lesson.id,variant,result.reason,'').passed,false);
    assert.equal(checkManagementUnderstanding(lesson.id,variant,'unknown','unknown').passed,false);
    assert.doesNotMatch(JSON.stringify(presentation),/NaN|undefined|Infinity/);
    assert.ok(transfer.context&&transfer.question&&transfer.hint&&transfer.feedback&&transfer.label);
    assert.ok(presentation.reasonContext&&presentation.reasonLabel);
    assert.ok(lesson.deeper.length>=2&&lesson.sources.every(source=>new URL(source.url).protocol==='https:'));
  }
  for(const id of ['unknown',null])assert.throws(()=>managementCase(id));
  for(const variant of [-1,3,.5,'0',NaN])assert.throws(()=>managementCase('range-width',variant));
});
test('management routes reject duplicates and mixed chapter fragments without hijacking older lessons',()=>{
  for(const id of MANAGEMENT_IDS)assert.equal(managementLessonFromHash('#manage='+id),id);
  for(const hash of ['','#lesson=range-boundaries','#applied=fees-over-time','#manage=unknown','#manage=range-width&manage=range-width','#manage=fee-tiers&lesson=pool-share','#manage=range-width&applied=fees-over-time','#manage=range-width&extra=x'])assert.equal(managementLessonFromHash(hash),null);
});
test('new progress is bounded and independent of existing work, including blocked or damaged storage',()=>{
  const value={version:1,completed:['range-width','range-width','unknown'],drafts:{'range-width':{variant:2,prediction:'both',reason:'bounds',application:'unknown',revealed:true,choiceSeed:0,answer:999},'fee-tiers':{variant:1,prediction:'x'.repeat(25),reason:null,choiceSeed:-1},'range-management':{variant:99}}};
  const clean=parseManagementProgress(value);assert.deepEqual(clean.completed,['range-width']);
  assert.equal(clean.drafts['range-width'].choiceSeed,0);assert.equal(clean.drafts['range-width'].application,'');assert.equal(clean.drafts['range-width'].answer,undefined);
  assert.equal(clean.drafts['fee-tiers'].prediction,'');assert.equal(clean.drafts['fee-tiers'].choiceSeed,null);assert.equal(clean.drafts['range-management'],undefined);
  assert.deepEqual(parseManagementProgress({version:2}),emptyManagementProgress());
  const map=new Map([['degenerator-learning-liquidity-v1','old essentials'],['passiko-applied-liquidity-v1','old history'],['defi-sandbox-v1','old balances']]);
  const storage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
  assert.equal(saveManagementProgress(value,()=>storage),true);assert.deepEqual(readManagementProgress(()=>storage).progress,clean);
  assert.equal(map.get('defi-sandbox-v1'),'old balances');assert.equal(map.get('degenerator-learning-liquidity-v1'),'old essentials');assert.equal(map.get('passiko-applied-liquidity-v1'),'old history');assert.ok(map.has(MANAGEMENT_KEY));
  assert.equal(readManagementProgress(()=>{throw Error('Blocked');}).available,false);assert.equal(saveManagementProgress(value,()=>({setItem(){throw Error('Full');}})),false);
  assert.deepEqual(readManagementProgress(()=>({getItem:()=>'{bad'})).progress,emptyManagementProgress());
});
test('every existing subject has a plain visible pitfall, and the fee-target question has a clear scope',async()=>{
  assert.deepEqual(Object.keys(POOL_PITFALLS),[...LESSON_IDS,...APPLIED_IDS]);
  for(const entry of Object.values(POOL_PITFALLS)){assert.ok(entry.title&&entry.copy);assert.equal(new URL(entry.url).protocol,'https:');assert.doesNotMatch(entry.copy,/÷|×|√/);}
  assert.match(POOL_PITFALLS['swap-impact'].copy,/slippage limit/);assert.match(POOL_PITFALLS['loss-vs-profit'].copy,/before withdrawal/);
  assert.match(POOL_PITFALLS['range-boundaries'].copy,/value can keep falling/);assert.match(POOL_PITFALLS['between-samples'].copy,/require trades/);
  assert.match(LESSONS.find(item=>item.id==='fee-break-even').reasoning,/break-even fee target/);
  assert.doesNotMatch(LESSONS.find(item=>item.id==='pool-share').prediction,/÷|×|percent|divide/);
  for(const lesson of [...LESSONS,...APPLIED_LESSONS]){
    const counts=lesson.reasons.map(([,copy])=>copy.split(/\s+/).length);
    assert.ok(Math.max(...counts)-Math.min(...counts)<=7,lesson.id+': answer length should not give away the correct choice');
  }
  const html=await readFile(new URL('../public/learn.html',import.meta.url),'utf8');
  assert.match(html,/id="learn-pitfall"/);assert.match(html,/id="applied-pitfall"/);
  assert.doesNotMatch(html.slice(html.indexOf('<article id="learn-management"'),html.indexOf('<article id="learn-applied"')),/type="number"/);
});

test('range question revisions retire only changed draft answers and preserve completed work', () => {
  const old = {version:1, completed:MANAGEMENT_IDS, drafts:{
    'range-width':{variant:2,prediction:'both',reason:'bounds',application:'wide',revealed:true,choiceSeed:42},
    'fee-tiers':{variant:1,prediction:'unknown',reason:'trades',application:'a',revealed:true},
    'range-management':{variant:1,prediction:'same',reason:'asset',application:'removed',revealed:true},
  }};
  const migrated = parseManagementProgress(old);
  assert.deepEqual(migrated.completed, MANAGEMENT_IDS);
  for (const id of ['range-width','fee-tiers']) {
    assert.equal(migrated.drafts[id].application, '');
    assert.equal(migrated.drafts[id].prediction, old.drafts[id].prediction);
    assert.equal(migrated.drafts[id].reason, old.drafts[id].reason);
    assert.equal(migrated.drafts[id].revealed, true);
    assert.equal(migrated.drafts[id].variant, old.drafts[id].variant);
  }
  assert.equal(migrated.drafts['range-width'].choiceSeed,42);
  assert.equal(migrated.drafts['range-management'].application,'removed');
  migrated.drafts['range-width'].application='own-basket';
  migrated.drafts['fee-tiers'].application='more-income';
  assert.deepEqual(parseManagementProgress(migrated),migrated,'Current answers survive repeated saves and reloads.');
});


test('a rise below the narrow range changes only the wider position’s token mix', () => {
  const result = managementCase('range-width', 1);
  assert.equal(result.price, 1700);
  assert.equal(result.next.price, 1800);
  assert.equal(result.narrow.state, 'below');
  assert.equal(result.next.narrow.state, 'below');
  assert.deepEqual(result.next.narrow.pooled, result.narrow.pooled);
  assert.equal(result.wide.state, 'inside');
  assert.equal(result.next.wide.state, 'inside');
  assert.ok(result.next.wide.pooled.eth < result.wide.pooled.eth);
  assert.ok(result.next.wide.pooled.usdc > result.wide.pooled.usdc);
  assert.equal(result.application, 'wide-mix');
});

test('reinvesting fees increases fee share while collecting alone does not', () => {
  const own = 100, competitors = 900, reinvested = 20, fees = 10;
  const before = own / (own + competitors) * fees;
  const collectedOnly = own / (own + competitors) * fees;
  const after = (own + reinvested) / (own + reinvested + competitors) * fees;
  assert.equal(collectedOnly, before);
  assert.ok(after > before);
  const result = managementCase('fee-tiers', 2);
  assert.equal(result.application, 'larger-share');
  assert.equal(checkManagementUnderstanding('fee-tiers', 2, 'trades', 'larger-share').passed, true);
  assert.equal(checkManagementUnderstanding('fee-tiers', 2, 'trades', 'smaller-advantage').passed, false);
});

test('the second range-application revision clears replaced answers without losing completed situations', () => {
  const old = {version:1,completed:['range-width','fee-tiers'],drafts:{
    'range-width':{variant:1,prediction:'wide',reason:'bounds',application:'whole-period',revealed:true,choiceSeed:4,questionRevisions:{prediction:1,reason:1,application:2}},
    'fee-tiers':{variant:2,prediction:'unknown',reason:'trades',application:'smaller-advantage',revealed:true,choiceSeed:9,questionRevisions:{prediction:1,reason:1,application:2}},
  }};
  const migrated = parseManagementProgress(old);
  assert.deepEqual(migrated.completed, old.completed);
  for (const id of old.completed) {
    assert.equal(migrated.drafts[id].application, '');
    assert.equal(migrated.drafts[id].questionRevisions.application, 3);
    for (const key of ['prediction','reason','revealed','choiceSeed','variant']) assert.equal(migrated.drafts[id][key], old.drafts[id][key]);
  }
  migrated.drafts['range-width'].application = 'wide-mix';
  migrated.drafts['fee-tiers'].application = 'larger-share';
  assert.deepEqual(parseManagementProgress(migrated), migrated);
});


test('moving a range after a fall changes exposure to the supplied rebound, with costs counted once', () => {
  const result=managementCase('range-management',2), {before,unchanged,moved,cost}=result.rebalance;
  assert.equal(before.futurePrice,1400); assert.equal(unchanged.futurePrice,2000);
  assert.equal(before.pooled.usdc,0); assert.ok(Math.abs(before.pooled.eth-2.5709181086842334)<1e-12);
  assert.equal(moved.investment,before.lpBeforeFees-cost);
  assert.equal(cost,15); assert.equal(moved.initialPrice,1400); assert.equal(moved.futurePrice,2000);
  assert.equal(moved.lowerPrice,1260); assert.equal(moved.upperPrice,1540);
  assert.ok(moved.initial.eth<before.pooled.eth); assert.ok(moved.initial.usdc>0);
  assert.equal(moved.pooled.eth,0); assert.equal(unchanged.lpBeforeFees,5000);
  assert.ok(Math.abs(moved.lpBeforeFees-3667.485532841495)<1e-9);
  assert.equal(result.application,'sold-earlier');
  const application=managementApplication(result);
  assert.deepEqual(application.evidence.comparison.rows.map(row=>row.value),[unchanged.lpBeforeFees,moved.lpBeforeFees]);
  const link=rangeFromHash(new URL(application.evidence.explore.href,'https://teren.sh/').hash);
  assert.equal(link.investment,moved.investment); assert.equal(link.initialPrice,1400);
  assert.equal(link.futurePrice,1400); assert.equal(link.lowerPrice,1260); assert.equal(link.upperPrice,1540);
  assert.equal(link.fees,0); assert.equal(link.fullRangeFees,0);
  assert.equal(managementPresentation(result).links[0].scenario,result.second,'Observe handoff still opens the original example.');
});

test('only the replaced third management application is retired', () => {
  for(let variant=0;variant<3;variant++) {
    const previous={variant,prediction:'rises',reason:'asset',application:variant===1?'removed':'automatic',revealed:true,choiceSeed:6,questionRevisions:{prediction:1,reason:1,application:1}};
    const migrated=parseManagementProgress({version:1,completed:['range-management'],drafts:{'range-management':previous}});
    const draft=migrated.drafts['range-management'];
    assert.deepEqual(migrated.completed,['range-management']);
    assert.equal(draft.application,variant===2?'':previous.application);
    assert.equal(draft.questionRevisions.application,variant===2?2:1);
    for(const key of ['variant','prediction','reason','revealed','choiceSeed'])assert.equal(draft[key],previous[key]);
    if(variant===2)draft.application='sold-earlier';
    assert.deepEqual(parseManagementProgress(migrated),migrated);
  }
});
