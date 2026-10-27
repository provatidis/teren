import assert from 'node:assert/strict';
import { lessonSetup, validateLessonInputs } from '../../public/models/lesson-experiments.js';
import { essentialQuestionRevisions } from '../../public/models/lesson-application.js';

// Older saved questions can contain custom inputs even though the lesson no
// longer offers a second editor. Seed only this test profile's selected draft.
async function restoreQuestion(evaluate, id, changes) {
  const revisions = essentialQuestionRevisions(id, 0);
  const draft = {
    variant: 0, inputs: validateLessonInputs(id, { ...lessonSetup(id), ...changes }),
    prediction: '', answer: '', reason: '', application: '', ran: false, choiceSeed: 41,
    predictionRevision: revisions.prediction, reasonRevision: revisions.reason, applicationRevision: revisions.application,
  };
  await evaluate(`(() => {
    const key='degenerator-learning-liquidity-v1';
    const progress=JSON.parse(localStorage.getItem(key)) || {version:1,completed:[],drafts:{}};
    progress.drafts[${JSON.stringify(id)}]=${JSON.stringify(draft)};
    localStorage.setItem(key,JSON.stringify(progress));
  })()`);
}

export async function checkLessonConsistency({ evaluate, click, fill, text, navigate, base, call, nextEvent }) {
  const choose = (name, value) => evaluate(`document.querySelector('input[name="${name}"][value="${value}"]').click()`);
  await navigate(base + 'learn.html#lesson=token-balances');
  await choose('learn-prediction','less'); await click('learn-run');
  await choose('learn-reason','rebalance'); await choose('learn-application','original-mix'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'),'Both answers are correct.');
  const entries = await evaluate("performance.getEntriesByType('resource').map(entry=>entry.name)");
  const buildResponse = await fetch(base + 'build-manifest.json');
  const manifest = buildResponse.ok ? await buildResponse.json() : null;
  for (const path of ['models/lesson-experiments.js','models/learning-answer.js','models/lesson-application.js','learning/liquidity-essentials.js','lib/lesson-narration.js','lib/lesson-application-copy.js','lib/learning-choices.js','data/learning-progress.js']) {
    const expected = manifest ? manifest.assets[path] : path;
    assert.ok(entries.some(url=>url.endsWith('/' + expected)), path + ' must load its canonical build identity.');
    if (manifest) assert.ok(!entries.some(url=>url.endsWith('/' + path)), path + ' must not mix hashed and unversioned modules.');
  }
  for (const [price, prediction, direction] of [[4000,'less','less ETH and more USDC'],[1000,'more','more ETH and less USDC'],[2000,'same','both token quantities stay the same']]) {
    await restoreQuestion(evaluate,'token-balances',{futurePrice:price});
    await navigate(base + 'learn.html#lesson=token-balances');
    await choose('learn-prediction',prediction); await click('learn-run');
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['token-balances'].inputs.futurePrice"),price,'The lesson retains the legacy custom question.');
    assert.ok((await text('learn-explanation')).includes(direction));
    await choose('learn-application','original-mix'); await choose('learn-reason','automatic'); await click('learn-check');
    assert.equal(await text('learn-feedback-title'),'Review your answers.');
    assert.match(await text('learn-reasons-feedback'),/Tokens change hands through trades/);
    assert.ok((await text('learn-reasons-feedback')).includes(direction));
    assert.equal(await evaluate("document.getElementById('learn-continue').hidden"),true);
    if (price === 2000) {
      assert.match(await text('learn-reason-question'),/stay the same/);
      assert.match(await text('learn-reasons'),/no price change/);
    }
    await choose('learn-reason','rebalance'); await click('learn-check');
    assert.equal(await text('learn-feedback-title'),'Both answers are correct.');
  }
  await restoreQuestion(evaluate,'fee-break-even',{futurePrice:4000,fees:100});
  await navigate(base + 'learn.html#lesson=fee-break-even');
  await choose('learn-prediction','short'); await click('learn-run');
  assert.match(await text('learn-explanation'),/total fee target is \$428.93[\s\S]*\$328.93 additional/);
  await choose('learn-reason','assumption'); await choose('learn-application','gap-reopens'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'),'Both answers are correct.');
  await evaluate("document.querySelector('#learn-deeper summary').click();document.querySelector('#learn-calculation summary').click()");
  await fill('learn-answer','428.94'); await click('learn-calculation-check');
  assert.match(await text('learn-calculation-feedback'),/does not affect completion/);
  assert.equal(await evaluate("document.getElementById('learn-continue').hidden"),false);
  await fill('learn-answer','428.93'); await click('learn-calculation-check'); assert.match(await text('learn-calculation-feedback'),/Calculation matches/);
  await navigate(base + 'learn.html#lesson=range-boundaries');
  await choose('learn-prediction','usdc'); await click('learn-run'); await choose('learn-reason','path'); await choose('learn-application','both-inside'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'),'Both answers are correct.');
  await navigate(base + 'learn.html#applied=period-vs-holding');
  await evaluate("new Promise(resolve=>{const check=()=>document.getElementById('learn-applied').getAttribute('aria-busy')==='false'?resolve():setTimeout(check,25);check()})");
  await choose('applied-prediction','can-trail'); await click('applied-reveal'); await fill('applied-checkpoint','8');
  assert.match(await text('applied-metrics'),/−\$0.01/);
  assert.match(await text('applied-explanation'),/earlier checkpoint[\s\S]*principal plus earned fees still trails holding[\s\S]*final checkpoint/);
  assert.match(await text('applied-prediction-feedback'),/checkpoint 7.*\$0.23.*trails holding by \$0.51.*\$0.17 ahead, before costs/);
  await choose('applied-application','smaller-lead'); await choose('applied-reason','reinvested'); await click('applied-check');
  assert.match(await text('applied-reasons-feedback'),/fees remain separate from principal[\s\S]*not reinvested[\s\S]*holding basket/i);
  assert.equal(await text('applied-feedback-title'),'Review your answers.');
  await navigate(base + 'liquidity.html');
  console.log('PASS: lesson direction, unchanged-price reasoning, misconception feedback, optional calculation isolation, historical question scope and versioned teaching compatibility');
}

export async function checkMobileLessonConsistency({ evaluate, click, fill, text, navigate, base, call }) {
  for (const width of [390,320]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    await restoreQuestion(evaluate,'token-balances',{futurePrice:4000});
    await navigate(base + 'learn.html#lesson=token-balances');
    await evaluate("document.querySelector('input[name=learn-prediction][value=less]').click()"); await click('learn-run');
    await evaluate("document.querySelector('input[name=learn-application][value=original-mix]').click()"); await evaluate("document.querySelector('input[name=learn-reason][value=automatic]').click()"); await click('learn-check');
    assert.match(await text('learn-reasons-feedback'),/less ETH and more USDC/);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate(base + 'liquidity.html');
  console.log('PASS: mobile lesson explanations and corrective feedback at 390px/320px');
}
