import assert from 'node:assert/strict';

export async function checkManagementLearning({evaluate,click,text,navigate,reload,base}) {
  const keys=['degenerator-learning-liquidity-v1','passiko-applied-liquidity-v1','defi-sandbox-v1','degenerator-pool-snapshot-v1','degenerator-v3-position-snapshot-v1','degenerator-experiments-v1'];
  const before=await evaluate('JSON.stringify('+JSON.stringify(keys)+'.map(key=>localStorage.getItem(key)))');
  const choose=(name,value)=>evaluate(`document.querySelector('input[name="${name}"][value="${value}"]').click()`);
  const cases=[['range-width','none','bounds','mix'],['fee-tiers','b','trades','more-volume'],['range-management','same','asset','automatic']];
  for(const [id,prediction,reason,application]of cases) {
    await navigate(base+'learn.html#manage='+id);
    assert.equal(await evaluate("document.getElementById('learn-essential').hidden&&document.getElementById('learn-applied').hidden&&!document.getElementById('learn-management').hidden"),true);
    assert.equal(await evaluate("document.querySelectorAll('[data-lesson-id][aria-current=step],[data-applied-id][aria-current=step]').length"),0);
    assert.equal(await evaluate("document.querySelector('[data-management-id="+id+"]').getAttribute('aria-current')"),'step');
    assert.equal(await evaluate("document.getElementById('manage-reveal').disabled"),false);
    assert.equal(await evaluate("document.querySelectorAll('#learn-management input[type=number]').length"),0);
    await choose('manage-prediction',prediction);await click('manage-reveal');
    assert.equal(await evaluate("document.getElementById('manage-observe').hidden"),false);
    assert.match(await text('manage-prediction-feedback'),/^The result differs from your prediction\./);
    assert.equal(await evaluate("document.getElementById('manage-observe-title').getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom"),true);
    if(id==='range-width')assert.match(await text('manage-metrics'),/Narrow range Inactive.*Wider range Active/s);
    if(id==='fee-tiers')assert.match(await text('manage-metrics'),/Unknown/);
    assert.ok((await text('manage-reason-context')).length>20);
    assert.ok((await text('manage-application-label')).length>10);
    assert.doesNotMatch(await text('manage-application-label'),/APPLY|CHANGE/);
    if(id==='range-management')assert.match(await text('manage-pitfall'),/does not refund earlier losses/);
    await choose('manage-reason',id==='range-width'?'budget':id==='fee-tiers'?'clock':'liquidated');await choose('manage-application',application);await click('manage-check');
    assert.equal(await text('manage-feedback-title'),'Review your answers.');
    assert.equal(await evaluate("document.getElementById('manage-continue').hidden"),true);
    await choose('manage-reason',reason);await choose('manage-application',id==='range-width'?'capital':id==='fee-tiers'?'bigger-share':'fees');await click('manage-check');
    assert.equal(await text('manage-feedback-title'),'Review your answers.');
    await choose('manage-application',application);await click('manage-check');
    assert.equal(await text('manage-feedback-title'),'Both answers are correct.');
    const saved=await evaluate("localStorage.getItem('passiko-range-learning-v1')");
    const order=await evaluate("Array.from(document.querySelectorAll('input[name=manage-reason],input[name=manage-application]')).map(input=>input.value).join(',')");
    await evaluate("document.querySelector('#manage-deeper summary').click()");
    assert.equal(await evaluate("localStorage.getItem('passiko-range-learning-v1')"),saved,'Reading cannot change answers or completion.');
    assert.equal(await evaluate("Array.from(document.querySelectorAll('#manage-sources a')).every(a=>a.href.startsWith('https:')&&a.target==='_blank'&&a.rel.includes('noopener'))"),true);
    for(const href of await evaluate("Array.from(document.querySelectorAll('#manage-handoffs a')).map(a=>a.href)")) {
      const params=new URLSearchParams(new URL(href).hash.slice(1));assert.equal(params.get('scenario'),'cl-range-v1');assert.equal(params.get('fees'),'0');assert.equal(params.get('fullfees'),'0');assert.equal(params.get('start'),'2000');
    }
    await reload();assert.equal(await text('manage-feedback-title'),'Both answers are correct.');
    assert.equal(await evaluate("Array.from(document.querySelectorAll('input[name=manage-reason],input[name=manage-application]')).map(input=>input.value).join(',')"),order);
    await evaluate("document.querySelector('[data-management-id="+id+"]').click()");
    assert.equal(await evaluate("document.getElementById('manage-title').getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom"),true);
    for(let variant=1;variant<3;variant++) {
      await click('manage-variation');assert.equal(await text('manage-variation-label'),'Situation '+(variant+1)+' of 3');
      assert.equal(await evaluate("document.getElementById('manage-reveal').disabled"),false);assert.equal(await evaluate("document.getElementById('manage-observe').hidden"),true);
      await choose('manage-prediction',id==='range-width'?(variant===2?'both':'wide'):id==='fee-tiers'?'unknown':variant===1?'same':'rises');await click('manage-reveal');
      const changedAnswer=id==='range-width'?(variant===1?'wide-mix':'own-basket'):id==='fee-tiers'?(variant===1?'smaller-share':'competition-offset'):variant===1?'removed':'sold-earlier';
      await choose('manage-reason',reason);await choose('manage-application',changedAnswer);await click('manage-check');assert.equal(await text('manage-feedback-title'),'Both answers are correct.');
      if(id==='range-width'&&variant===1){
        assert.match(await text('manage-application-context'),/\$1,700.00.*\$1,800.00/);
        assert.match(await text('manage-applications-feedback'),/wider position.*ETH for USDC/i);
      }
      if(id==='fee-tiers'&&variant===1){
        assert.match(await text('manage-application-evidence'),/87.6%.*0.10% yesterday.*0.05% today/s);
        assert.match(await text('manage-applications-feedback'),/\$6.00 instead of \$12.00/);
      }
      if(id==='fee-tiers'&&variant===2){
        assert.match(await text('manage-application-evidence'),/Before collecting.*10.00%.*After collecting.*10.00%.*6.25%/s);
        assert.match(await text('manage-applications-feedback'),/Collecting left your share unchanged.*other LPs added proportionally more/s);
      }
      if(id==='range-width'&&variant===2)assert.match(await text('manage-metrics'),/Narrow range Active.*Wider range Active/s);
      if(id==='fee-tiers')assert.match(await text('manage-metrics'),/Position A fees \$12.00.*Position B fees \$6.00/s);
      if(id==='range-management'&&variant===1)assert.match(await text('manage-metrics'),/USDC/);
      if(id==='range-management'&&variant===2){
        assert.match(await text('manage-application-evidence'),/Original range left in place.*\$5,000.00.*Moved range.*\$3,667.48/s);
        assert.match(await text('manage-applications-feedback'),/sells the remaining ETH.*\$1,540.00/s);
        const handoff=await evaluate("document.querySelector('#manage-application-evidence a').href");
        const linked=new URLSearchParams(new URL(handoff).hash.slice(1));
        assert.equal(linked.get('start'),'1400');assert.equal(linked.get('future'),'1400');
        assert.equal(linked.get('lower'),'1260');assert.equal(linked.get('upper'),'1540');
        assert.equal(linked.get('investment'),'3584.28');
        assert.equal(await evaluate("document.querySelectorAll('#manage-application-evidence .learn-evidence-track').length"),2);
        await choose('manage-application','kept-eth');await click('manage-check');
        assert.equal(await evaluate("document.getElementById('manage-applications-feedback').dataset.state"),'different');
        assert.match(await text('manage-applications-feedback'),/does the opposite/);
        await choose('manage-application','sold-earlier');await click('manage-check');
      }

    }
  }
  assert.equal(await text('manage-progress-count'),'3 of 3 checked');assert.equal(await evaluate("document.getElementById('manage-next').hash"),'#applied=fees-over-time');
  assert.equal(await evaluate('JSON.stringify('+JSON.stringify(keys)+'.map(key=>localStorage.getItem(key)))'),before,'Range lessons preserve all older progress and saved work.');
  // Retire only changed application answers; completed chapters and compatible explanations survive.
  await evaluate(`(() => {const key='passiko-range-learning-v1', progress=JSON.parse(localStorage.getItem(key));
    progress.drafts['range-width']={variant:1,prediction:'wide',reason:'bounds',application:'whole-period',revealed:true,choiceSeed:41,questionRevisions:{prediction:1,reason:1,application:2}};
    localStorage.setItem(key,JSON.stringify(progress));})()`);
  await navigate(base+'learn.html#manage=range-width');
  assert.equal(await evaluate("document.querySelector('input[name=manage-prediction]:checked').value"),'wide');
  assert.equal(await evaluate("document.querySelector('input[name=manage-reason]:checked').value"),'bounds');
  assert.equal(await evaluate("document.querySelector('input[name=manage-application]:checked')"),null);
  assert.equal(await text('manage-progress-count'),'3 of 3 checked');
  assert.equal(await text('manage-variation-label'),'Situation 2 of 3');
  await choose('manage-application','wide-mix');await click('manage-check');
  assert.equal(await text('manage-feedback-title'),'Both answers are correct.');
  // Continue the quota check from the range-management situation used below.
  await navigate(base+'learn.html#manage=range-management');
  const saved=await evaluate("localStorage.getItem('passiko-range-learning-v1')");
  await evaluate("Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}");await click('manage-variation');
  await choose('manage-prediction','falls');await click('manage-reveal');assert.match(await text('learn-storage'),/Saving is unavailable/);
  assert.equal(await evaluate("localStorage.getItem('passiko-range-learning-v1')"),saved);
  await navigate(base+'learn.html#manage=fee-tiers&applied=fees-over-time');
  assert.equal(await evaluate("document.getElementById('learn-management').hidden&&document.getElementById('learn-applied').hidden&&!document.getElementById('learn-essential').hidden"),true);
  assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"),false);
  await navigate(base + 'liquidity.html');
  console.log('PASS: practical range chapter, three situations per topic, conceptual-only completion, incorrect prediction, corrective feedback, versioned routes, source links, model handoffs, stable restoration and independent/full storage');
}
export async function checkMobileManagementLearning({evaluate,click,text,navigate,base,call}) {
  for(const width of [390,320]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    await navigate(base+'learn.html#manage=range-width');
    assert.equal(await evaluate("document.getElementById('learn-course').open"),false);
    for(let reset=0;reset<3&&(await text('manage-variation-label'))!=='Situation 1 of 3';reset++)await click('manage-variation');
    await evaluate("document.querySelector('input[name=manage-prediction][value=wide]').click()");await click('manage-reveal');
    await evaluate("document.querySelector('input[name=manage-reason][value=bounds]').click();document.querySelector('input[name=manage-application][value=mix]').click()");await click('manage-check');
    assert.equal(await text('manage-feedback-title'),'Both answers are correct.');
    assert.equal(await text('learn-current-chapter'), 'Range choices');
    assert.equal(await text('learn-current-progress'), await text('manage-progress-count'));
    assert.equal(await evaluate('document.activeElement.id'), 'manage-feedback');
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    assert.ok(await evaluate("(()=>{const r=document.getElementById('manage-next').getBoundingClientRect();return r.top>=document.querySelector('.topbar').getBoundingClientRect().bottom&&r.bottom<=innerHeight})()"), 'The next exercise is visible with its feedback.');
assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
    await click('manage-topics');await evaluate("document.querySelector('[data-management-id=fee-tiers]').click()");
    assert.equal(await evaluate("document.getElementById('learn-course').open"),false);assert.equal(await text('manage-title'),'A higher fee rate is not a higher return');
    assert.equal(await evaluate("document.getElementById('manage-title').getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom"),true);
    for (let reset=0;reset<3&&(await text('manage-variation-label'))!=='Situation 1 of 3';reset++) await click('manage-variation');
    for (let variant=0;variant<3;variant++) {
      await click('manage-reveal');
      assert.equal(await evaluate("(()=>{const n=document.getElementById('manage-application-evidence'),r=n.getBoundingClientRect();return n.checkVisibility()&&r.left>=0&&r.right<=innerWidth})()"),true);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
      assert.match(await text('manage-application-evidence'), variant===0 ? /\$24 million.*\$12,000/s : variant===1 ? /87.6%/ : /6.25%/);
      if (variant === 0) {
        assert.equal(await evaluate(`Array.from(document.querySelectorAll('#manage-application-evidence dd')).every(element => {
          return Array.from(element.textContent.matchAll(/\\$[\\d,.]+/g)).every(match => {
            const range = document.createRange();
            range.setStart(element.firstChild, match.index);
            range.setEnd(element.firstChild, match.index + match[0].length);
            return range.getClientRects().length === 1;
          });
        })`), true, 'Each currency amount stays on one line.');
      }
      if (variant<2) await click('manage-variation');
    }
    await click('learn-resume');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
    await navigate(base+'learn.html#manage=range-management');
    for(let reset=0;reset<3&&(await text('manage-variation-label'))!=='Situation 3 of 3';reset++)await click('manage-variation');
    await click('manage-reveal');
    assert.equal(await evaluate("(()=>{const n=document.getElementById('manage-application-evidence'),r=n.getBoundingClientRect();return n.checkVisibility()&&r.left>=0&&r.right<=innerWidth})()"),true);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
    assert.match(await text('manage-application-evidence'),/\$3,667.48/);

    await click('manage-topics');
    await evaluate("document.querySelector('[data-applied-id=fees-over-time]').click()");
    assert.equal(await evaluate("document.getElementById('learn-management').hidden&&!document.getElementById('learn-applied').hidden"),true);
    await evaluate("document.querySelector('.learn-entry-links a[href=\"#lesson=swap-impact\"]').click()");
    assert.equal(await evaluate("document.getElementById('learn-management').hidden&&!document.getElementById('learn-essential').hidden"),true);
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await navigate(base + 'liquidity.html');
  console.log('PASS: practical range entry, assessment, chapter switching, resume, sticky headings and no overflow at 390px/320px');
}
