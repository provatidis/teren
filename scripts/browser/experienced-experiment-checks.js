import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkExperiencedExperiments({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const localKeys = ['degenerator-experiments-v1', 'teren-experiment-location-v1', 'teren-learning-location-v1', 'teren-lst-loop-draft-v1'];
  const sessionKeys = ['teren-loop-draft-v1', 'teren-lending-draft-v1', 'teren-liquidation-draft-v1'];
  const before = await evaluate(`({ local: ${JSON.stringify(localKeys)}.map(k => [k, localStorage.getItem(k)]), session: ${JSON.stringify(sessionKeys)}.map(k => [k, sessionStorage.getItem(k)]) })`);
  const library = () => evaluate("JSON.parse(localStorage.getItem('degenerator-experiments-v1'))");
  const select = (id, value) => evaluate(`{ const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true})); }`);
  const summary = id => evaluate(`document.querySelector('#${id} > summary').click()`);
  const action = (id, label) => evaluate(`Array.from(document.querySelectorAll('[data-experiment-id="${id}"] button')).find(e=>e.textContent===${JSON.stringify(label)}).click()`);
  const save = async (button, name) => {
    await click(button); await fill('experiment-name', name); await fill('experiment-notes', 'A saved comparison, with its original assumptions.');
    await click('experiment-save-confirm'); await settle(evaluate);
    assert.equal(await evaluate("document.getElementById('experiment-dialog').open"), false);
  };
  try {
    await evaluate(`${JSON.stringify(localKeys)}.forEach(k=>localStorage.removeItem(k));${JSON.stringify(sessionKeys)}.forEach(k=>sessionStorage.removeItem(k))`);
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await navigate(base + 'lending.html#loops');
    await fill('loop-rounds', '3'); await click('loop-compare-toggle');
    await select('loop-reference-rounds', '1'); await click('loop-reference-shared');
    await fill('loop-reference-borrow', '30'); await fill('loop-future', '1500'); await fill('loop-days', '90');
    const outcome = await text('loop-reference-difference');
    assert.equal(await text('loop-reference-fraction'), '30.00% per round');
    assert.ok(await evaluate("document.getElementById('loop-chart-reference').getAttribute('d').startsWith('M')"));
    await fill('loop-reference-borrow', '');
    assert.equal(await evaluate("document.getElementById('loop-save').disabled"), true);
    assert.equal(await evaluate("document.getElementById('loop-results').hidden"), false, 'An incomplete reference does not erase the current loop.');
    assert.equal(await evaluate("document.getElementById('loop-round-comparison').hidden"), true);
    await fill('loop-reference-borrow', '30');
    await save('loop-save', 'Three rounds and a lighter reference');
    const first = (await library()).experiments[0];
    assert.deepEqual(first.comparison, { rounds: 1, borrowPercent: 30 });
    await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}})");
    await click('loop-share');
    const shared = await evaluate("document.getElementById('loop-share-url').value");
    assert.match(shared, /compareBorrow=30/);
    await navigate(base);
    assert.equal(await evaluate("document.getElementById('home-experiment').href"), shared);
    assert.equal(await evaluate("document.getElementById('home-experiment').hidden"), false);
    await navigate(shared);
    assert.equal(await text('loop-reference-difference'), outcome);

    await summary('loop-build-visual'); await settle(evaluate);
    assert.match(await text('lab-build-selected'), /1 \/ 10/);
    await click('lab-build-next'); await click('lab-build-next');
    assert.equal(await text('lab-build-debt'), '5,000 USDC');
    assert.match(await text('lab-build-wallet'), /2.4925 ETH/);
    assert.match(await text('lab-build-copy'), /swap costs \$15.00/);
    await summary('loop-unwind-visual'); await settle(evaluate);
    assert.equal(await evaluate("new Set([...document.querySelectorAll('[id]')].map(e=>e.id)).size===document.querySelectorAll('[id]').length"), true, 'Lab and lesson player IDs stay distinct.');
    await fill('loop-future', '100');
    assert.match(await text('lab-unwind-copy'), /blocked/);
    assert.equal(await evaluate("document.querySelector('#loop-unwind-flow .scene-player').hidden"), true);
    assert.match(await text('loop-compare-cost-rows'), /Blocked · no actions/);
    assert.notEqual(await text('lab-unwind-debt'), '0 USDC');

    await navigate(base + 'lending.html#saved-experiments');
    await action(first.id, 'Duplicate as variation');
    await fill('experiment-name', 'Copy for another question'); await click('experiment-save-confirm'); await settle(evaluate);
    const copy = (await library()).experiments[0];
    assert.notEqual(copy.id, first.id);
    assert.deepEqual(copy.inputs, first.inputs);
    assert.deepEqual(copy.comparison, first.comparison);
    await action(first.id, 'Open in lab');
    assert.equal(await text('loop-reference-difference'), outcome);
    await fill('loop-rounds', '1');
    assert.deepEqual((await library()).experiments.find(e=>e.id===first.id), first, 'Working edits never rewrite the saved original.');
    await navigate(base + 'lending.html#saved-experiments');
    for (const entry of [first, copy]) await evaluate(`document.querySelector('[data-compare-id="${entry.id}"]').click()`);
    await click('experiments-compare');
    assert.match(await text('experiments-comparison-context'), /Same original ETH/);
    assert.match(await text('experiments-comparison-cards'), /USDC debt/);

    await navigate(base + 'lending.html#experiment');
    await fill('loan-future', '1200'); await fill('liquidation-repayPercent', '40'); await fill('liquidation-bonusPercent', '7');
    await save('loan-save', 'Loan with an event assumption');
    const loan = (await library()).experiments[0];
    assert.deepEqual(loan.liquidation, { repayPercent: 40, bonusPercent: 7 });
    await navigate(base + 'liquidity.html#saved-experiments');
    assert.equal(await evaluate("document.querySelectorAll('.experiment-entry').length"), 3);
    // The cross-topic saved URL resolves a local record, including its event fields.
    await navigate(base + 'lending.html#saved=' + loan.id);
    assert.equal(await evaluate("document.getElementById('liquidation-bonusPercent').value"), '7');
    assert.equal(await evaluate("document.getElementById('loan-future').value"), '1200');

    for (const [hash, view, input] of [['#experiment', 'loan', 'loan-future'], ['#loops', 'loops', 'loop-future'], ['#lst-loops', 'lst', 'lst-days']]) {
      await navigate(base + 'lending.html' + hash);
      const draftValue = await evaluate(`document.getElementById('${input}').value`);
      await evaluate("document.querySelector('#lending-tools a[href=\"#saved-experiments\"]').click()");
      await settle(evaluate);
      assert.equal(await evaluate('document.body.dataset.lendingView'), view, 'Opening Saved keeps the originating lending lab.');
      assert.equal(await evaluate("document.getElementById('lending-nav-experiment').getAttribute('href')"), hash);
      await reload(); await settle(evaluate);
      assert.equal(await evaluate('document.body.dataset.lendingView'), view, 'Reloading Saved keeps its history entry’s lab.');
      await click('lending-nav-experiment'); await settle(evaluate);
      assert.equal(await evaluate('location.hash'), hash);
      assert.equal(await evaluate(`document.getElementById('${input}').value`), draftValue);
      await evaluate("new Promise(resolve=>{addEventListener('hashchange',resolve,{once:true});history.back()})");
      await settle(evaluate);
      assert.equal(await evaluate('location.hash'), '#saved-experiments');
      assert.equal(await evaluate('document.body.dataset.lendingView'), view);
      await click('lending-tool-loan'); await settle(evaluate);
      await evaluate("new Promise(resolve=>{addEventListener('hashchange',resolve,{once:true});history.back()})");
      await settle(evaluate);
      assert.equal(await evaluate('document.body.dataset.lendingView'), view, 'Back restores the library’s original lab after visiting another one.');
    }

    for (const [width, height] of [[390, 844], [320, 740]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await navigate(shared);
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      await click('loop-compare-show'); await settle(evaluate);
      assert.equal(await evaluate('document.activeElement.id'), 'loop-round-comparison');
      await summary('loop-build-visual'); await settle(evaluate);
      await click('lab-build-next');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      await save('loop-save', 'Mobile ' + width);
      await navigate(base + 'lending.html#saved-experiments');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      await navigate(base);
      await evaluate("localStorage.setItem('teren-learning-location-v1','lending.html#lesson=borrow');dispatchEvent(new Event('storage'))");
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.equal(await evaluate("document.querySelectorAll('.home-topic-actions .button').length"), 4);
      const returnLinks = await evaluate("['home-experiment','home-continue'].map(id=>{const link=document.getElementById(id),title=link.querySelector('strong').getBoundingClientRect(),arrow=link.lastElementChild.getBoundingClientRect();return {shown:!link.hidden,titleRight:title.right,titleBottom:title.bottom,arrowLeft:arrow.left,arrowTop:arrow.top}})");
      assert.ok(returnLinks.every(link => link.shown && link.arrowLeft >= link.titleRight + 8 && link.arrowTop < link.titleBottom), 'Return-link arrows stay beside their destinations, including a long lesson title.');
    }
    console.log('PASS: personal experiments, shared-condition loop comparisons, save/duplicate/reopen, Saved navigation/history, local Home resume, custom ledger visuals and mobile layouts');
  } finally {
    await evaluate(`for(const [k,v] of ${JSON.stringify(before.local)})v===null?localStorage.removeItem(k):localStorage.setItem(k,v);for(const [k,v] of ${JSON.stringify(before.session)})v===null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)`);
  }
}
