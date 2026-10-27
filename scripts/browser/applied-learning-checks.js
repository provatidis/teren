import assert from 'node:assert/strict';

export async function checkAppliedLearning({ evaluate, click, fill, text, navigate, reload, base, call, nextEvent }) {
  const existingKeys = ['degenerator-learning-liquidity-v1', 'defi-sandbox-v1', 'degenerator-pool-snapshot-v1', 'degenerator-v3-position-snapshot-v1'];
  const before = await evaluate('JSON.stringify(' + JSON.stringify(existingKeys) + '.map(key=>localStorage.getItem(key)))');
  const choose = (name, value) => evaluate(`document.querySelector('input[name="${name}"][value="${value}"]').click()`);
  const savedAnswer = id => evaluate(`JSON.parse(localStorage.getItem('passiko-applied-liquidity-v1')).drafts['${id}'].answer`);
  const ready = () => evaluate("new Promise((resolve,reject)=>{const end=Date.now()+5000;const check=()=>{if(document.getElementById('learn-applied').getAttribute('aria-busy')==='false')resolve();else if(Date.now()>end)reject(new Error('Applied record did not load'));else setTimeout(check,25)};check()})");
  const cases = [['fees-over-time', 'earned', '2.36', 'growth', 'in-range', 'same'], ['between-samples', 'possible', '2724', 'returned', 'range-return', 'edge-placement'], ['period-vs-holding', 'can-trail', '0.17', 'price-returned', 'range-return', 'smaller-lead']];
  for (const [id, prediction, legacyAnswer, reason, record, application] of cases) {
    await navigate(base + 'learn.html#applied=' + id); await ready();
    assert.equal(await evaluate("document.getElementById('learn-essential').hidden"), true);
    assert.equal(await evaluate("document.getElementById('learn-applied').hidden"), false);
    assert.equal(await evaluate("document.querySelector('[data-applied-id=" + id + "]').getAttribute('aria-current')"), 'step');
    assert.equal(await evaluate("document.querySelectorAll('[data-lesson-id][aria-current=step]').length"), 0);
    assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), true);
    assert.equal(await evaluate("document.getElementById('applied-reveal').disabled"), false);
    assert.equal(await evaluate("document.querySelector('#applied-setup .applied-start-track').checkVisibility()"), true, 'Starting price and range are introduced before the prediction');
    assert.equal(await evaluate("document.querySelector('#applied-setup .scene-range-scale').textContent"), 'ETH price', 'The opening picture labels meaningful prices, not decorative padding.');
    assert.match(await text('applied-setup'), /WETH principal.*USDC principal/);
    assert.equal(await evaluate("document.querySelectorAll('#applied-prediction-home button').length"), 1, 'One reveal control');
    await choose('applied-prediction', prediction); await click('applied-reveal');
    // Numeric answers from older releases remain inert without resetting the lesson.
    await evaluate(`(() => { const key = 'passiko-applied-liquidity-v1', progress = JSON.parse(localStorage.getItem(key));
      progress.drafts['${id}'].answer = '${legacyAnswer}'; localStorage.setItem(key, JSON.stringify(progress)); })()`);
    await reload(); await ready();
    assert.equal(await savedAnswer(id), legacyAnswer);
    assert.equal(await evaluate("document.querySelector('input[name=applied-prediction]:checked').value"), prediction);
    assert.equal(await evaluate("document.querySelectorAll('#applied-answer, #applied-calculation, #applied-calculation-check').length"), 0);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('passiko-applied-liquidity-v1')).completed.includes('${id}')`), false, 'A legacy numeric answer cannot complete the conceptual questions.');
    assert.equal(await evaluate("document.getElementById('applied-feedback').hidden && document.getElementById('applied-continue').hidden"), true);
    assert.equal(await evaluate("document.getElementById('applied-observe').hidden"), false);
    assert.equal(await evaluate("document.getElementById('applied-assessment').hidden"), false);
    assert.ok((await text('applied-pitfall')).length>40);
    assert.equal(await evaluate("document.getElementById('applied-observe-title').getBoundingClientRect().top >= document.querySelector('.topbar').getBoundingClientRect().bottom"), true);
    if (id === 'fees-over-time') {
      assert.match(await text('applied-metrics'), /2.36/);
      assert.match(await text('applied-reason-evidence'), /New fees during this record.*All tokens available to collect/s);
      assert.equal(await evaluate("document.getElementById('applied-reason-evidence').checkVisibility()"),true);
      assert.equal(await evaluate("document.getElementById('applied-application-evidence').hidden"),true);
    }
    if (id === 'between-samples') {
      assert.match(await text('applied-metrics'), /2,724 seconds/);
      assert.match(await text('applied-interval-summary'), /26084375 → 26085000/);
      assert.match(await text('applied-observation'), /Both endpoints are outside/);
      assert.match(await text('applied-reason-evidence'), /26084375.*26085000.*45m 24s.*Unchanged/s);
      assert.match(await text('applied-application-evidence'), /Where this range started.*Starting ETH price.*Lower.*Upper/s);
      assert.doesNotMatch(await text('applied-application-evidence'), /0\.44%/);
      assert.equal(await evaluate("document.querySelector('#applied-application-evidence .scene-range-marker').checkVisibility()"), true);
      assert.equal(await evaluate("document.querySelector('#applied-application-evidence .scene-range-scale').textContent"), 'ETH price', 'Padding endpoints are not presented as meaningful prices.');
      assert.match(await text('applied-application-evidence'), /starting price marker is close to the upper bound/);
      assert.equal(await evaluate("document.getElementById('applied-reason-evidence').checkVisibility()&&document.getElementById('applied-application-evidence').checkVisibility()"),true);
    }
    if (id === 'period-vs-holding') {
      assert.match(await text('applied-metrics'), /\+\$0.17/);
      assert.equal(await evaluate("document.getElementById('applied-cost-example').hidden"),false);
      assert.match(await text('applied-cost-example'),/hypothetical \$1.00 LP-only cost/);
      assert.match(await text('applied-cost-example'),/historical record is unchanged/);
      assert.match(await text('applied-reason-question'),/shortfall before fees shrink/i);
      assert.match(await text('applied-collection-evidence'), /\$0\.51/);
      assert.match(await text('applied-collection-evidence'), /fee value/i);
      assert.match(await text('applied-price-evidence'), /USDC[\s\S]*ETH|ETH[\s\S]*USDC/);
      assert.match(await text('applied-price-evidence'), /holding/i);
      assert.match(await text('applied-collection-evidence'), /Smaller principal shortfall.*\$0.47.*Increase in period fee value.*\$0.22/s);
      assert.equal(await evaluate("document.querySelectorAll('#applied-collection-evidence .learn-evidence-track').length"),2);
      const ethAmount = value => Number(value.match(/[\d,.]+/)[0].replaceAll(',', ''));
      const lpETH = ethAmount(await text('applied-price-lp-eth')), holdingETH = ethAmount(await text('applied-price-hold-eth'));
      assert.ok(lpETH > 0 && lpETH < .0001, 'The LP still owns a small, nonzero amount of earned ETH.');
      assert.ok(Math.abs(holdingETH - .014920139441099508) < .000001, 'The holding basket has substantially more ETH.');
      assert.equal(await evaluate("document.getElementById('applied-collection-evidence').checkVisibility() && document.getElementById('applied-price-evidence').checkVisibility()"), true);
      assert.deepEqual(await evaluate(`['applied-collection-evidence','applied-price-evidence'].map(id => {
        const panel = document.getElementById(id); return document.getElementById(panel.getAttribute('aria-labelledby'))?.textContent;
      })`), ['Why the comparison improved', 'If ETH rises from here']);
      assert.equal(await evaluate("document.getElementById('applied-assessment-scope')"), null, 'Each question presents its evidence instead of explaining internal lesson state.');
      assert.match(await text('applied-question-window'), /Final comparison checkpoint: block 26090000/);
      assert.equal(await evaluate("document.getElementById('applied-checkpoint').value"), '16', 'The observation still opens at the fixed final checkpoint.');
    } else {
      assert.equal(await evaluate("document.getElementById('applied-cost-example').hidden"),true);
      assert.equal(await evaluate("document.getElementById('applied-collection-evidence').hidden && document.getElementById('applied-price-evidence').hidden"), true);
    }
    const question = await text('applied-application-context');
    const localIds=id==='period-vs-holding'?['applied-collection-evidence','applied-price-evidence']:['applied-reason-evidence','applied-application-evidence'];
    const evidence = await Promise.all(localIds.map(text));
    const target = await evaluate("document.getElementById('applied-checkpoint').value");
    const originalHandoff = await evaluate("document.getElementById('applied-explore').href");
    await fill('applied-checkpoint', '0');
    assert.equal(await text('applied-application-context'), question, 'Checkpoint exploration keeps the assessment fixed.');
    assert.deepEqual(await Promise.all(localIds.map(text)), evidence, 'Each question keeps its own evidence while the chart is explored.');
    assert.equal(await evaluate("document.getElementById('applied-return-question').hidden"), false);
    if (id === 'period-vs-holding') assert.equal(await text('applied-return-question'), 'Return to the final comparison checkpoint →');
    assert.equal(await evaluate("document.querySelectorAll('#applied-assessment-form input[type=number]').length"),0);
    const exploredHandoff = await evaluate("document.getElementById('applied-explore').href");
    await choose('applied-reason', reason); await choose('applied-application', application);
    await click('applied-check'); assert.equal(await text('applied-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate("document.getElementById('applied-explore').href"), exploredHandoff, 'Answering does not change the selected snapshot handed to the lab.');
    await click('applied-return-question');
    assert.equal(await evaluate("document.getElementById('applied-checkpoint').value"), target);
    assert.equal(await evaluate("document.getElementById('applied-explore').href"), originalHandoff);
    assert.equal(await evaluate("document.querySelector('input[name=applied-application]:checked').value"), application);
    const transferred = await evaluate("document.getElementById('applied-explore').href");
    const params = new URLSearchParams(new URL(transferred).hash.slice(1));
    assert.equal(params.get('scenario'), 'cl-range-v1'); assert.equal(params.get('fees'), '0'); assert.equal(params.get('fullfees'), '0');
    assert.equal(params.get('future'), params.get('start'));
    assert.equal(await evaluate("document.getElementById('applied-explore').target"), '_blank');
    assert.equal(await evaluate("document.getElementById('applied-inspect').href"), base + 'liquidity.html' + (record === 'in-range' ? '#historical-case' : '#historical-case=range-return'));
    await evaluate("document.querySelector('#applied-deeper summary').click()");
    assert.equal(await evaluate("document.getElementById('applied-accounting').checkVisibility() && document.getElementById('applied-evidence').checkVisibility()"), true);
    assert.match(await text('applied-accounting'), /This checkpoint’s principal: [\d.]+ USDC \+ [\d.]+ WETH\. Holding: [\d.]+ USDC \+ [\d.]+ WETH\. Period fees: [\d.]+ USDC \+ [\d.]+ WETH\./);
    assert.match(await text('applied-evidence'), /Block hash0x[0-9a-f]{64}/);
    assert.match(await text('applied-evidence'), /Period fee base units\d+ USDC; \d+ WETH/);
    assert.match(await text('applied-evidence'), /Independent fee checkRead-only collect difference/);
    assert.match(await text('applied-source'), /Position #\d+.*checkpoints.*blocks \d+–\d+/);
    assert.equal(await evaluate("document.querySelectorAll('#applied-deeper a').length"), 4, 'The accounting sources and verification method remain available.');
    assert.equal(await evaluate("Array.from(document.querySelectorAll('#applied-deeper a')).every(a=>a.target==='_blank'&&a.rel.includes('noopener')&&a.href.startsWith('https:'))"), true);
    assert.equal(await evaluate("document.getElementById('applied-continue').hidden"), false);
    // Explanation and transfer are independently required.
    await choose('applied-reason', id === 'fees-over-time' ? 'owed' : id === 'between-samples' ? 'stayed-out' : 'reinvested'); await click('applied-check');
    assert.equal(await evaluate("document.getElementById('applied-applications-feedback').dataset.state"), 'match');
    assert.equal(await evaluate("document.getElementById('applied-reasons-feedback').dataset.state"), 'different');
    await choose('applied-reason', reason);
    await choose('applied-application',id === 'fees-over-time' ? 'less' : id === 'between-samples' ? 'centered' : 'larger-lead'); await click('applied-check');
    assert.equal(await text('applied-feedback-title'),'Review your answers.');
    assert.equal(await evaluate("document.getElementById('applied-continue').hidden"),true);
    await choose('applied-application',application); await click('applied-check');
    // A revised prediction is independent of the evidence already explored and checked.
    await fill('applied-checkpoint','0');
    const currentHandoff=await evaluate("document.getElementById('applied-explore').href");
    await evaluate("document.querySelector('input[name=applied-prediction]:not(:checked)').click()");
    assert.equal(await evaluate("document.getElementById('applied-prediction-feedback').dataset.state"),'different');
    assert.equal(await evaluate("document.querySelector('input[name=applied-reason]:checked').value"),reason);
    assert.equal(await evaluate("document.querySelector('input[name=applied-application]:checked').value"),application);
    assert.equal(await evaluate("document.getElementById('applied-observe').hidden||document.getElementById('applied-assessment').hidden||document.getElementById('applied-continue').hidden"),false);
    assert.equal(await evaluate("document.getElementById('applied-checkpoint').value"),'0');
    assert.equal(await evaluate("document.getElementById('applied-explore').href"),currentHandoff);
    assert.equal(await savedAnswer(id), legacyAnswer, 'Revising a prediction preserves the older draft without displaying it.');
    assert.equal(await text('applied-feedback-title'),'Both answers are correct.');
    await choose('applied-prediction',prediction);
    assert.equal(await evaluate("document.getElementById('applied-prediction-feedback').dataset.state"),'match');
    await click('applied-reveal');
    assert.equal(await evaluate("document.getElementById('applied-checkpoint').value"),target,'Showing the outcome again explicitly returns to the question checkpoint.');
    const order = await evaluate("Array.from(document.querySelectorAll('input[name=applied-reason],input[name=applied-application]')).map(input=>input.value).join(',')");
    await reload(); await ready();
    assert.equal(await evaluate("Array.from(document.querySelectorAll('input[name=applied-reason],input[name=applied-application]')).map(input=>input.value).join(',')"),order);
    assert.equal(await savedAnswer(id), legacyAnswer);
    assert.equal(await evaluate("document.querySelector('input[name=applied-reason]:checked').value"), reason);
    assert.equal(await evaluate("document.querySelector('input[name=applied-application]:checked').value"), application);
    assert.equal(await text('applied-feedback-title'), 'Both answers are correct.');
    assert.deepEqual(await Promise.all(localIds.map(text)), evidence, 'Reload restores the same local evidence beside both questions.');
    await evaluate("document.querySelector('[data-applied-id=" + id + "]').click()");
    assert.equal(await evaluate("document.getElementById('applied-title').getBoundingClientRect().top >= document.querySelector('.topbar').getBoundingClientRect().bottom"), true);
    assert.equal(await savedAnswer(id), legacyAnswer);
    if (id === 'fees-over-time') {
      await navigate(transferred);
      assert.equal(await evaluate("document.getElementById('cl-investment').value"), params.get('investment'));
      assert.equal(await evaluate("document.getElementById('cl-fees').value"), '0');
    }
  }
  assert.equal(await text('applied-progress-count'), '3 of 3 checked');
  assert.equal(await evaluate("document.getElementById('applied-reflection').hidden"), false);
  assert.equal(await evaluate('JSON.stringify(' + JSON.stringify(existingKeys) + '.map(key=>localStorage.getItem(key)))'), before, 'Applied work preserves all existing lesson and snapshot storage.');
  // A saved choice for the retired outcome question is not an answer to the new mechanism question.
  await evaluate(`(() => { const key = 'passiko-applied-liquidity-v1'; const progress = JSON.parse(localStorage.getItem(key));
    progress.drafts['period-vs-holding'].prediction = 'lp'; localStorage.setItem(key, JSON.stringify(progress)); })()`);
  await reload(); await ready();
  assert.equal(await evaluate("document.querySelector('input[name=applied-prediction]:checked')"), null);
  assert.equal(await text('applied-feedback-title'), 'Both answers are correct.', 'Earlier conceptual completion remains valid');
  // Retired conceptual choices are cleared without clearing completion or legacy draft data.
  await evaluate(`(() => { const key='passiko-applied-liquidity-v1', progress=JSON.parse(localStorage.getItem(key));
    const draft=progress.drafts['period-vs-holding']; draft.reason='shortfall'; draft.application='current-values';
    draft.questionRevisions={prediction:1,reason:2,application:2}; localStorage.setItem(key,JSON.stringify(progress)); })()`);
  await reload(); await ready();
  assert.equal(await evaluate("document.querySelector('input[name=applied-reason]:checked')"),null);
  assert.equal(await evaluate("document.querySelector('input[name=applied-application]:checked')"),null);
  assert.equal(await evaluate("document.getElementById('applied-feedback').hidden"),true);
  assert.equal(await evaluate("document.getElementById('applied-continue').hidden"),true);
  assert.equal(await text('applied-progress-count'),'3 of 3 checked');
  assert.equal(await savedAnswer('period-vs-holding'),'0.17');
  assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('passiko-applied-liquidity-v1')).drafts['period-vs-holding'].questionRevisions"), {prediction:1,reason:4,application:3});
  await evaluate(`(() => {const key='passiko-applied-liquidity-v1', progress=JSON.parse(localStorage.getItem(key));
    progress.drafts['between-samples']={prediction:'possible',reason:'counters',application:'fee-records',answer:'2724',revealed:true,checkpoint:3,choiceSeed:12,questionRevisions:{prediction:1,reason:1,application:2}};
    localStorage.setItem(key,JSON.stringify(progress));})()`);
  await navigate(base + 'learn.html#applied=between-samples'); await ready();
  assert.equal(await evaluate("document.querySelector('input[name=applied-prediction]:checked').value"),'possible');
  assert.equal(await evaluate("document.querySelector('input[name=applied-reason]:checked')"),null);
  assert.equal(await evaluate("document.querySelector('input[name=applied-application]:checked')"),null);
  assert.equal(await evaluate("document.getElementById('applied-checkpoint').value"),'3');
  assert.equal(await savedAnswer('between-samples'),'2724');
  assert.equal(await text('applied-progress-count'),'3 of 3 checked');
  assert.match(await text('applied-reason-evidence'), /45m 24s/);
  await choose('applied-reason','returned'); await choose('applied-application','edge-placement'); await click('applied-check');
  assert.equal(await text('applied-feedback-title'),'Both answers are correct.');
  await click('applied-restart'); await ready();
  assert.equal(await evaluate("document.getElementById('applied-observe').hidden"), true);
  assert.equal(await evaluate("document.getElementById('applied-reveal').disabled"), false);
  const saved = await evaluate("localStorage.getItem('passiko-applied-liquidity-v1')");
  await evaluate("Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}");
  await choose('applied-prediction', 'possible'); await click('applied-reveal');
  assert.match(await text('learn-storage'), /Saving is unavailable/);
  assert.equal(await evaluate("document.getElementById('applied-observe').hidden"), false);
  assert.equal(await evaluate("localStorage.getItem('passiko-applied-liquidity-v1')"), saved);
  await navigate(base + 'learn.html#applied=invalid');
  assert.equal(await evaluate("document.getElementById('learn-applied').hidden"), true);
  assert.equal(await evaluate("document.getElementById('learn-essential').hidden"), false);
  assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), false);
  // Record-loading races and retry are exercised against actual page requests.
  try {
    await call('Fetch.enable', {patterns:[{urlPattern:'*/examples/uniswap-v3-position-*.json',requestStage:'Request'}]});
    const failed = nextEvent('Fetch.requestPaused'), opening = navigate(base + 'learn.html#applied=fees-over-time');
    const request = await failed;
    await call('Fetch.failRequest', {requestId:request.requestId,errorReason:'Failed'}); await opening; await ready();
    assert.equal(await text('applied-reveal'), 'Retry loading the record →');
    assert.equal(await evaluate("document.getElementById('applied-setup').hidden"), true, 'No position preview is shown for unavailable evidence');
    await call('Fetch.disable');
    await click('applied-reveal'); await ready(); assert.match(await text('applied-source'), /#1382030/);
    await call('Fetch.enable', {patterns:[{urlPattern:'*/examples/uniswap-v3-position-*.json',requestStage:'Request'}]});
    const held = nextEvent('Fetch.requestPaused'), loading = navigate(base + 'learn.html#applied=fees-over-time');
    const pending = await held; await loading;
    const newer = nextEvent('Fetch.requestPaused');
    await evaluate("document.querySelector('[data-applied-id=between-samples]').click()");
    const next = await newer; await call('Fetch.continueRequest', {requestId:next.requestId}); await ready();
    assert.match(await text('applied-source'), /#1375047/);
    await call('Fetch.continueRequest', {requestId:pending.requestId});
    await evaluate("new Promise(resolve=>setTimeout(resolve,100))");
    assert.equal(await evaluate('location.hash'), '#applied=between-samples'); assert.match(await text('applied-source'), /#1375047/);
  } finally { await call('Fetch.disable'); }
  await navigate(base + 'liquidity.html');
  console.log('PASS: applied historical lessons, fixed assessments, checkpoint exploration, exact record outcomes, zero-fee Playground handoffs, independent progress, record retry and selection races');
}

export async function checkMobileAppliedLearning({ evaluate, click, fill, text, navigate, base, call }) {
  const ready = () => evaluate("new Promise(resolve=>{const tick=()=>document.getElementById('learn-applied').getAttribute('aria-busy')==='false'?resolve():setTimeout(tick,25);tick()})");
  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', {width,height:844,deviceScaleFactor:1,mobile:true});
    await navigate(base + 'learn.html#applied=between-samples');
    await ready();
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await evaluate("document.querySelector('input[name=applied-prediction][value=possible]').click()"); await click('applied-reveal');
    const fixedEvidence=await text('applied-reason-evidence');
    assert.equal(await evaluate("document.querySelector('#applied-application-evidence .scene-range-scale').textContent"), 'ETH price');
    assert.match(await text('applied-application-evidence'), /Starting ETH price.*Lower.*Upper.*starting price marker is close to the upper bound/s);

    assert.match(fixedEvidence,/45m 24s/);
    for(const id of ['applied-reason-evidence','applied-application-evidence']) {
      assert.equal(await evaluate(`(()=>{const n=document.getElementById('${id}'),r=n.getBoundingClientRect();return n.checkVisibility()&&r.left>=0&&r.right<=innerWidth})()`),true);
    }
    await fill('applied-checkpoint','0');
    assert.equal(await text('applied-reason-evidence'),fixedEvidence);
    await evaluate("document.querySelector('#applied-deeper summary').click()");
    assert.equal(await evaluate("document.querySelectorAll('#applied-answer, #applied-calculation').length"), 0);
    assert.equal(await evaluate("document.getElementById('applied-accounting').checkVisibility() && document.getElementById('applied-evidence').checkVisibility()"), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await evaluate("document.querySelector('input[name=applied-application][value=edge-placement]').click()"); await evaluate("document.querySelector('input[name=applied-reason][value=returned]').click()"); await click('applied-check');
    assert.equal(await text('applied-feedback-title'), 'Both answers are correct.');
    assert.equal(await text('learn-current-chapter'), 'Recorded cases');
    assert.equal(await text('learn-current-progress'), await text('applied-progress-count'));
    assert.equal(await evaluate('document.activeElement.id'), 'applied-feedback');
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    assert.ok(await evaluate("(()=>{const r=document.getElementById('applied-next').getBoundingClientRect();return r.top>=document.querySelector('.topbar').getBoundingClientRect().bottom&&r.bottom<=innerHeight})()"), 'The next exercise is visible with its feedback.');

    await click('applied-topics'); await evaluate("document.querySelector('[data-applied-id=period-vs-holding]').click()");
    await ready();
    assert.equal(await evaluate("document.getElementById('learn-course').open"), false);
    assert.equal(await text('applied-title'), 'Explain the period’s result');
    await click('applied-reveal');
    const evidence = [await text('applied-collection-evidence'), await text('applied-price-evidence')];
    const localPanels = await evaluate(`['applied-collection-evidence','applied-price-evidence'].map(id => {
      const node = document.getElementById(id), rect = node.getBoundingClientRect();
      return {visible:node.checkVisibility(),fits:rect.left>=0&&rect.right<=innerWidth};
    })`);
    assert.deepEqual(localPanels, [{visible:true,fits:true},{visible:true,fits:true}], 'Recorded evidence is readable beside each question on a phone.');
    await fill('applied-checkpoint', '0');
    assert.deepEqual([await text('applied-collection-evidence'), await text('applied-price-evidence')], evidence);
    await evaluate("document.querySelector('input[name=applied-reason][value=price-returned]').click(); document.querySelector('input[name=applied-application][value=smaller-lead]').click()");
    await click('applied-check');
    assert.equal(await text('applied-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await evaluate("document.querySelector('.learn-entry-links a[href=\"#lesson=swap-impact\"]').click()");
    assert.equal(await evaluate("document.getElementById('learn-applied').hidden"), true);
    assert.equal(await text('learn-lesson-title'), 'Trade size and execution price');
  }
  await call('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate(base + 'liquidity.html');
  console.log('PASS: applied chapter navigation, assessment, disclosures and overflow at 390px/320px');
}
