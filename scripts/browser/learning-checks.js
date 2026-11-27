import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import assert from 'node:assert/strict';

export async function checkLearning({ evaluate, click, fill, text, navigate, reload, base, downloadFile }) {
  const sandbox = await evaluate("localStorage.getItem('defi-sandbox-v1')");
  const pool = await evaluate("localStorage.getItem('degenerator-pool-snapshot-v1')");
  const position = await evaluate("localStorage.getItem('degenerator-v3-position-snapshot-v1')");
  await navigate(base + 'learn.html#lesson=range-boundaries');
  assert.equal(await text('learn-lesson-title'), 'Token balances at range boundaries');
  assert.equal(await text('learn-progress-count'), '0 of 7 done');
  assert.equal(await evaluate("document.querySelector('.product-nav a[aria-current=page]').textContent"), 'Learn');
  assert.equal(await evaluate("document.querySelectorAll('[data-lesson-id]').length"), 7);
  assert.equal(await text('learn-level'), 'Uniswap v3-style · Ranges');
  assert.equal(await evaluate("document.querySelector('.learn-sidebar').getBoundingClientRect().height <= innerHeight - 48"), true);
  assert.equal(await evaluate("(()=>{const sidebar=document.querySelector('.learn-sidebar').getBoundingClientRect(),active=document.querySelector('[data-lesson-id=range-boundaries]').getBoundingClientRect();return active.top>=sidebar.top&&active.bottom<=sidebar.bottom;})()"), true);
  assert.equal(await evaluate("document.querySelectorAll('.learn-path-group').length"), 4);
  assert.equal(await evaluate("document.getElementById('learn-run').disabled"), false);
  await click('learn-resume');
  assert.equal(await evaluate('location.hash'), '#lesson=range-boundaries');
  assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), true);
  const choose = (name, value) => evaluate("document.querySelector('input[name=\"" + name + "\"][value=\"" + value + "\"]').click()");
  // One prediction and one question after the figure in every lesson.
  const cases = [
    ['swap-impact','less','deeper','Lesson 1 done.'],
    ['pool-share','less','same-tokens','Lesson 2 done.'],
    ['token-balances','less','rebalance','Lesson 3 done.'],
    ['loss-vs-profit','less','both-right','Lesson 4 done.'],
    ['fee-break-even','toward-target','record','Lesson 5 done.'],
    ['range-boundaries','usdc','path','Lesson 6 done.'],
    ['final-challenge','lower-price','relative-gap','Challenge done.'],
  ];
  for (const [id, prediction, application, done] of cases) {
    await navigate(base + 'learn.html#lesson=' + id);
    assert.equal(await evaluate("document.querySelectorAll('#learn-controls input[type=range]').length"), 0, 'Only the visual explores amounts, prices and fees.');
    await choose('learn-prediction', id === 'swap-impact' ? 'same' : prediction);
    // Every lesson reveals the outcome from its question; none has a separate explanation button.
    await click('learn-reveal');
    assert.equal(await evaluate("document.getElementById('learn-run').checkVisibility()"), false);
    assert.equal(await evaluate("document.getElementById('learn-results').hidden"), false);
    assert.ok((await text('learn-pitfall')).length>40);
    assert.equal(await evaluate("document.getElementById('learn-deeper').open"),false);
    assert.equal(await evaluate("document.getElementById('learn-math').open"),false);
    const beforeReading = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
    await evaluate("document.querySelector('#learn-deeper > summary').click()");
    assert.equal(await evaluate("document.querySelectorAll('#learn-worked-steps li').length"),4);
    assert.equal(await evaluate("Array.from(document.querySelectorAll('.learn-metric, .learn-step-copy, #learn-worked-steps li, #learn-sources li')).every(el => { const text = el.textContent; return Array.from(el.children).slice(1).every(child => { const previous = child.previousElementSibling; const boundary = previous.textContent + child.textContent; return !text.includes(boundary); }); })"), true, 'Labels, values and explanation paragraphs must remain separate in copied and accessible text.');
    assert.equal(await evaluate("document.querySelectorAll('#learn-sources a').length"),2);
    assert.equal(await evaluate("Array.from(document.querySelectorAll('#learn-sources a')).every(a=>a.href.startsWith('https:')&&a.target==='_blank'&&a.rel.includes('noopener'))"),true);
    const hasFeeCase = ['fee-break-even','range-boundaries','final-challenge'].includes(id);
    assert.equal(await evaluate("document.getElementById('learn-fee-case').hidden"), !hasFeeCase);
    if (hasFeeCase) {
      assert.equal(await evaluate("document.querySelector('#learn-fee-case a').href"), base + 'liquidity.html#example=position-fees');
      assert.equal(await evaluate("document.querySelector('#learn-fee-case a').target"), '_blank');
      assert.equal(await evaluate("document.querySelector('#learn-fee-case a').rel.includes('noopener')"), true);
    }
    await evaluate("document.querySelector('#learn-math > summary').click()");
    assert.equal(await evaluate("document.getElementById('learn-math').open"),true);
    assert.ok((await text('learn-math-formula')).length > 5, 'The worked explanation retains its formula.');
    assert.equal(await evaluate("document.querySelectorAll('#learn-deeper input').length"),0,'Go deeper explains the calculation without asking for a copied or rounded number.');
    assert.equal(await evaluate("document.querySelector('#learn-answer, #learn-calculation, #learn-calculation-check')"),null);
    assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"),beforeReading,'Reading cannot mark exercises complete or change their answers.');
    if(id==='fee-break-even') assert.match(await text('learn-worked-steps'),/428.93[\s\S]*328.93/);
    if(id==='range-boundaries') assert.match(await text('learn-worked-steps'),/5,116.06/);
    assert.equal(await evaluate("document.querySelectorAll('#learn-assessment-form input[type=number]').length"),0);
    assert.deepEqual(await evaluate("[document.querySelectorAll('#learn-assessment-form fieldset').length, document.querySelectorAll('input[name=learn-reason]').length, document.getElementById('learn-hint-text').textContent.length > 20]"), [1, 0, true], id + ': one question, with its hint');
    await choose('learn-application', application);
    if (id === 'swap-impact') {
      await choose('learn-application', 'equal'); await click('learn-check');
      assert.equal(await text('learn-feedback-title'), 'Review your answer.');
      assert.match(await text('learn-applications-feedback'), /^Not quite[\s\S]*price moves as you trade[\s\S]*19,743\.16 USDC, against 18,132\.22 USDC here/);
      assert.equal(await text('learn-progress-count'), '0 of 7 done');
      assert.equal(await evaluate("document.getElementById('learn-continue').hidden"), true);
      await choose('learn-application', application);
    }
    if (id === 'final-challenge') await click('liquidity-task-example');
    await click('learn-check');
    assert.equal(await text('learn-feedback-title'), done);
    assert.match(await text('learn-applications-feedback'), /^That’s right\./);
    assert.equal(await evaluate("document.getElementById('learn-continue').hidden"), false);
    const order = await evaluate("Array.from(document.querySelectorAll('input[name=learn-application]')).map(input=>input.value).join(',')");
    const completedDraft = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
    await evaluate("document.querySelector('#learn-deeper > summary').click();document.querySelector('#learn-deeper > summary').click()");
    assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"),completedDraft,'Reading after completion preserves the checked answers and final task.');
    assert.equal(await evaluate("document.getElementById('learn-continue').hidden"),false);
    assert.equal(await text('learn-feedback-title'),done);
    await reload();
    assert.equal(await evaluate("document.querySelector('#learn-answer, #learn-calculation, #learn-calculation-check')"),null);
    assert.equal(await evaluate("document.querySelector('input[name=learn-application]:checked').value"),application);
    assert.equal(await evaluate("Array.from(document.querySelectorAll('input[name=learn-application]')).map(input=>input.value).join(',')"),order);
    assert.equal(await evaluate("document.getElementById('learn-feedback').hidden"), false);
    if (id === 'range-boundaries') {
      const linked = await evaluate("document.getElementById('learn-explore').href");
      assert.ok(linked.startsWith(base));
      assert.ok(linked.includes('scenario=cl-range-v1'));
      assert.ok(linked.includes('future=2400'));
      assert.equal(await evaluate("document.getElementById('learn-explore').target"), '_blank');
    }
  }
  assert.equal(await text('learn-progress-count'), '7 of 7 done');
  assert.match(await text('learn-course-status'), /All essentials exercises done/);
  assert.equal(await evaluate("document.getElementById('learn-share').hidden"), false);
  await evaluate("Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{writeText:async value=>{window.learningCopied=value}} });");
  await click('learn-copy');
  const link = await evaluate("document.getElementById('learn-share-url').value");
  assert.equal(await evaluate('window.learningCopied'), link);
  assert.ok(link.includes('scenario=cp50-v1') && link.includes('fees=100'));
  await click('learn-create-card');
  await evaluate("new Promise((resolve,reject)=>{const until=Date.now()+5000;const check=()=>{if(!document.getElementById('learn-card-preview').hidden&&document.getElementById('learn-card-image').naturalWidth===1200)resolve();else if(Date.now()>until)reject(new Error('Learning card did not render'));else setTimeout(check,25)};check()})");
  const cardPath = await downloadFile('learn-card-download');
  assert.equal(basename(cardPath), 'teren-learning-challenge-cp50-v1.png');
  const card = await readFile(cardPath);
  assert.equal(card.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(card.readUInt32BE(16),1200);
  assert.equal(card.readUInt32BE(20),720);
  const beforeReadingCard = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  const taskBefore = await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['final-challenge'].task)");
  const cardSource = await evaluate("document.getElementById('learn-card-image').src");
  await evaluate("document.querySelector('#learn-deeper > summary').click();document.querySelector('#learn-math > summary').click()");
  assert.equal(await evaluate("document.getElementById('learn-card-preview').hidden"),false,'Reading the calculation preserves the completed result card.');
  assert.equal(await evaluate("document.getElementById('learn-card-image').src"),cardSource);
  assert.equal(await evaluate("document.getElementById('learn-share').hidden"),false);
  assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"),beforeReadingCard,'Reading preserves the final task, checked answers and completion.');
  await evaluate("Array.from(document.querySelectorAll('.comparison-modes button')).find(button=>button.textContent==='Fees').click()");
  await fill('comparison-fees', '500');
  await choose('learn-prediction', 'higher-price');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'different');
  assert.equal(await evaluate("document.getElementById('learn-results').hidden"), false);
  assert.equal(await evaluate("document.getElementById('learn-feedback').hidden"), false);
  assert.equal(await evaluate("document.getElementById('learn-card-preview').hidden"), false, 'Exploration and a revised prediction preserve the completed question card.');
  assert.equal(await evaluate("document.getElementById('learn-card-image').src"), cardSource);
  assert.equal(await evaluate("document.getElementById('learn-share').hidden"), false);
  assert.equal(await evaluate("document.querySelector('input[name=learn-application]:checked').value"), 'relative-gap');
  assert.equal(await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['final-challenge'].task)"), taskBefore);
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['final-challenge'].taskChecked"), true);
  assert.equal(await evaluate("document.getElementById('learn-share-url').value"), link);
  assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '500', 'A revised prediction keeps the explored fees.');
  assert.equal(await evaluate("document.getElementById('learn-card-preview').hidden"), false);
  assert.match(await text('learn-worked-steps'),/100.00/);
  assert.match(await text('learn-worked-steps'),/328.93/);
  await choose('learn-prediction', 'lower-price');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'match');
  await evaluate("document.querySelector('.scene-prediction-show').click()");
  assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '100', 'Only the explicit outcome action restores the question setup.');
  assert.equal(await evaluate("document.getElementById('learn-card-preview').hidden"), false);

  await click('learn-variation');
  assert.equal(await text('learn-variation-label'), 'Variation 2 of 3');
  assert.equal(await evaluate("document.getElementById('learn-results').hidden"), true);
  assert.equal(await evaluate("document.getElementById('learn-card-preview').hidden"), true);
  assert.equal(await evaluate("document.getElementById('learn-share').hidden"), true);
  assert.equal(await evaluate("document.querySelector('#learn-answer, #learn-calculation, #learn-calculation-check')"),null);
  assert.equal(await evaluate("document.getElementById('learn-reveal').disabled"), false, 'The challenge shows its answer without a prediction.');
  assert.equal(await text('learn-progress-count'), '7 of 7 done');
  await reload();
  assert.equal(await text('learn-variation-label'), 'Variation 2 of 3');
  await navigate(base + 'learn.html#lesson=not-a-lesson');
  assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), false);
  assert.equal(await text('learn-lesson-title'), 'Can you match holding and still lose dollars?');
  const savedLearn = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  await evaluate("Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}");
  await click('learn-variation');
  assert.match(await text('learn-storage'), /Saving is unavailable/);
  await choose('learn-prediction','higher-price'); await click('learn-reveal');
  assert.equal(await evaluate("document.getElementById('learn-results').hidden"), false);
  assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), savedLearn);
  assert.equal(await evaluate("localStorage.getItem('defi-sandbox-v1')"), sandbox);
  assert.equal(await evaluate("localStorage.getItem('degenerator-pool-snapshot-v1')"), pool);
  assert.equal(await evaluate("localStorage.getItem('degenerator-v3-position-snapshot-v1')"), position);
  await navigate(link);
  assert.equal(await text('scenario-hold-value'), '$7,500.00');
  assert.equal(await text('scenario-lp-value'), '$7,171.07');
  assert.equal(await evaluate("localStorage.getItem('defi-sandbox-v1')"), sandbox);
  await navigate(base + 'liquidity.html');
  console.log('PASS: optional deeper reading, fixed-question walkthroughs, math disclosures, source links, all learning assessments, feedback, progress restoration, deep links, state isolation, card/download, prediction preservation, variation invalidation and full storage');
}

export async function checkMobileLearning({ evaluate, click, fill, text, navigate, base }) {
  await navigate(base + 'learn.html#lesson=range-boundaries');
  assert.equal(await evaluate("document.getElementById('learn-course').open"), false);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate("document.querySelector('#learn-course summary').click()");
  await evaluate("document.querySelector('[data-lesson-id=pool-share]').click()");
  assert.equal(await text('learn-lesson-title'), 'Ownership after a liquidity deposit');
  assert.equal(await evaluate("document.getElementById('learn-course').open"), false);
  await navigate(base + 'learn.html#lesson=range-boundaries');
  await evaluate("document.querySelector('input[name=learn-prediction][value=usdc]').click()");
  await click('learn-reveal');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate("document.querySelector('#learn-deeper > summary').click()");
  await evaluate("document.querySelector('#learn-math > summary').click()");
  assert.equal(await evaluate("document.getElementById('learn-deeper').open && document.getElementById('learn-math').open"),true);
  assert.equal(await evaluate("document.querySelectorAll('#learn-deeper input').length"),0);
  assert.equal(await evaluate("document.querySelector('#learn-answer, #learn-calculation, #learn-calculation-check')"),null);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  await evaluate("document.querySelector('input[name=learn-application][value=path]').click()");
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'),'Lesson 6 done.');
    assert.equal(await text('learn-current-chapter'), 'Essentials');
    assert.equal(await text('learn-current-progress'), await text('learn-progress-count'));
    assert.equal(await evaluate('document.activeElement.id'), 'learn-feedback');
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    assert.ok(await evaluate("(()=>{const r=document.getElementById('learn-next').getBoundingClientRect();return r.top>=document.querySelector('.topbar').getBoundingClientRect().bottom&&r.bottom<=innerHeight})()"), 'The next exercise is visible with its feedback.');

  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  await navigate(base + 'liquidity.html');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.product-nav')).display"), 'flex');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  console.log('PASS: mobile lesson navigation, exercise, feedback, mode navigation and layout');
}
