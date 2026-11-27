import assert from 'node:assert/strict';
import { lessonSetup, validateLessonInputs } from '../../public/models/lesson-experiments.js';
import { essentialQuestionRevisions } from '../../public/models/lesson-application.js';

// Older saved questions can contain custom inputs and numeric answers. Seed only
// this test profile's selected draft; the retained questions use conceptual answers.
async function restoreQuestion(evaluate, id, changes, savedAnswers = {}) {
  const revisions = essentialQuestionRevisions(id, 0);
  const draft = {
    variant: 0, inputs: validateLessonInputs(id, { ...lessonSetup(id), ...changes }),
    prediction: '', answer: '', application: '', ran: false, choiceSeed: 41,
    ...savedAnswers,
    predictionRevision: revisions.prediction, applicationRevision: revisions.application,
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
  await choose('learn-prediction','less'); await click('learn-reveal');
  await choose('learn-application','rebalance'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'),'Lesson 3 done.');
  const entries = await evaluate("performance.getEntriesByType('resource').map(entry=>entry.name)");
  const buildResponse = await fetch(base + 'build-manifest.json');
  const manifest = buildResponse.ok ? await buildResponse.json() : null;
  for (const path of ['models/lesson-experiments.js','models/lesson-application.js','learning/liquidity-essentials.js','lib/lesson-narration.js','lib/lesson-application-copy.js','lib/learning-choices.js','data/learning-progress.js']) {
    const expected = manifest ? manifest.assets[path] : path;
    assert.ok(entries.some(url=>url.endsWith('/' + expected)), path + ' must load its canonical build identity.');
    if (manifest) assert.ok(!entries.some(url=>url.endsWith('/' + path)), path + ' must not mix hashed and unversioned modules.');
  }
  for (const [price, prediction, direction, verdict, correction] of [[4000,'less','less ETH and more USDC',/Less ETH\. Traders bought ETH from the pool/,/does not watch the market[\s\S]*0\.8839 ETH \+ 3,535\.53 USDC/],
    [1000,'more','more ETH and less USDC',/More ETH\. Traders sold ETH to the pool/,/does not watch the market[\s\S]*1\.7678 ETH \+ 1,767\.77 USDC/],
    [2000,'same','Both token amounts stay the same',/The same ETH\. The pool’s price already matches the market’s, so no trade was needed to bring them together\./,/does not hold its amounts fixed/]]) {
    const completedBefore = await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).completed)");
    // A draft from an earlier version also carries a second answer, which is now ignored.
    const legacyAnswers = price === 1000 ? { prediction, answer: '123.45', reason: 'rebalance', application: 'rebalance', ran: true } : {};
    await restoreQuestion(evaluate,'token-balances',{futurePrice:price},legacyAnswers);
    await navigate(base + 'learn.html#lesson=token-balances');
    if (price === 1000) {
      assert.equal(await evaluate("document.querySelector('#learn-answer, #learn-calculation, #learn-calculation-check')"),null,'A saved numeric answer cannot restore the removed exercise.');
      assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked').value"),prediction);
      assert.equal(await evaluate("document.querySelector('input[name=learn-application]:checked').value"),'rebalance');
      assert.equal(await evaluate("document.getElementById('learn-feedback').hidden"),false,'The legacy numeric answer does not prevent restoring valid conceptual feedback.');
      assert.equal(await text('learn-feedback-title'),'Lesson 3 done.');
      assert.equal(await evaluate("'reason' in JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['token-balances']"),false,'The second answer is not kept.');
      assert.equal(await evaluate("document.getElementById('learn-continue').hidden"),false);
      assert.equal(await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).completed)"),completedBefore,'Restoring an old numeric answer preserves completion.');
    }
    await choose('learn-prediction',prediction); await click('learn-reveal');
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['token-balances'].inputs.futurePrice"),price,'The lesson retains the legacy custom question.');
    assert.match(await text('learn-prediction-feedback'),verdict);
    assert.ok((await text('token-scene-exchange')).includes(direction));
    await choose('learn-application','automatic'); await click('learn-check');
    assert.equal(await evaluate("document.getElementById('learn-feedback').hidden"), true, 'A wrong answer is answered under the answer, with no second box.');
    assert.match(await text('learn-applications-feedback'),correction);
    assert.equal(await evaluate("document.getElementById('learn-continue').hidden"),true);
    if (price === 2000) {
      assert.match(await text('learn-application-question'),/stay the same/);
      assert.match(await text('learn-applications'),/The pool’s price already matches the market’s, so no trade is needed\./);
    } else assert.match(await text('learn-application-context'),/nobody has traded with the pool yet\.$/);
    await choose('learn-application','rebalance'); await click('learn-check');
    assert.equal(await text('learn-feedback-title'),'Lesson 3 done.');
  }
  await restoreQuestion(evaluate,'fee-break-even',{futurePrice:4000,fees:100});
  await navigate(base + 'learn.html#lesson=fee-break-even');
  await choose('learn-prediction','toward-target'); await click('learn-reveal');
  assert.match(await text('learn-prediction-feedback'),/Only your claim\.[\s\S]*\$100\.00 takes it from \$428\.93 behind holding to \$328\.93 behind/);
  assert.match(await text('fee-why'),/break-even fees: \$428\.93 at this price/);
  await choose('learn-application','record'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'),'Lesson 5 done.');
  const checkedFeeDraft = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  await evaluate("document.querySelector('#learn-deeper > summary').click();document.querySelector('#learn-math > summary').click()");
  assert.match(await text('learn-worked-steps'),/428.93[\s\S]*328.93/);
  assert.ok((await text('learn-math-formula')).length > 5);
  assert.equal(await evaluate("document.querySelectorAll('#learn-sources a').length"),2);
  assert.equal(await evaluate("document.querySelector('#learn-answer, #learn-calculation, #learn-calculation-check')"),null);
  assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"),checkedFeeDraft,'Opening the worked explanation does not change checked answers or completion.');
  assert.equal(await evaluate("document.getElementById('learn-continue').hidden"),false);
  assert.equal(await text('learn-feedback-title'),'Lesson 5 done.');
  await navigate(base + 'learn.html#lesson=range-boundaries');
  await choose('learn-prediction','usdc'); await click('learn-reveal'); await choose('learn-application','path'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'),'Lesson 6 done.');
  await navigate(base + 'learn.html#applied=period-vs-holding');
  await evaluate("new Promise(resolve=>{const check=()=>document.getElementById('learn-applied').getAttribute('aria-busy')==='false'?resolve():setTimeout(check,25);check()})");
  await choose('applied-prediction','two-values'); await click('applied-reveal'); await fill('applied-checkpoint','8');
  assert.match(await text('applied-metrics'),/−\$0.01/);
  assert.match(await text('applied-explanation'),/earlier checkpoint[\s\S]*principal plus earned fees still trails holding[\s\S]*final checkpoint/);
  assert.match(await text('applied-prediction-feedback'),/checkpoint 7.*\$0.23.*trails holding by \$0.51.*\$0.17 ahead, before costs/);
  await choose('applied-application','smaller-lead'); await choose('applied-reason','reinvested'); await click('applied-check');
  assert.match(await text('applied-reasons-feedback'),/fees remain separate from principal[\s\S]*not reinvested[\s\S]*holding basket/i);
  assert.equal(await text('applied-feedback-title'),'Review your answers.');
  await navigate(base + 'liquidity.html');
  console.log('PASS: lesson direction, unchanged-price reasoning, misconception feedback, worked explanations, legacy numeric draft compatibility, historical question scope and versioned teaching compatibility');
}

export async function checkMobileLessonConsistency({ evaluate, click, fill, text, navigate, base, call }) {
  for (const width of [390,320]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    await restoreQuestion(evaluate,'token-balances',{futurePrice:4000});
    await navigate(base + 'learn.html#lesson=token-balances');
    await evaluate("document.querySelector('input[name=learn-prediction][value=less]').click()"); await click('learn-reveal');
    await evaluate("document.querySelector('input[name=learn-application][value=automatic]').click()"); await click('learn-check');
    assert.match(await text('learn-applications-feedback'),/does not watch the market[\s\S]*0\.8839 ETH \+ 3,535\.53 USDC/);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate(base + 'liquidity.html');
  console.log('PASS: mobile lesson explanations and corrective feedback at 390px/320px');
}
