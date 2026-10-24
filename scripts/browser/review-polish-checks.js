import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkReviewPolish({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const routes = [
    ['learn.html#lesson=swap-impact', 'learn-lesson-title'],
    ['learn.html#manage=range-width', 'manage-title'],
    ['learn.html#applied=fees-over-time', 'applied-title'],
    ['lending.html#lesson=conditions', 'lend-title'],
    ['lending.html#loop-lesson=stress', 'lend-title'],
  ];
  for (const width of [1440, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 1000 : 740, deviceScaleFactor: 1, mobile: width !== 1440 });
    for (const [route, id] of routes) {
      await navigate(base + route); await settle(evaluate);
      const entry = await evaluate(`({active:document.activeElement.id,top:document.getElementById('${id}').getBoundingClientRect().top,header:document.querySelector('.topbar').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth>innerWidth})`);
      assert.equal(entry.active, id, route + ' focuses the requested lesson.');
      assert.ok(entry.top >= entry.header && entry.top < entry.header + 180, route + ' opens below the sticky navigation.');
      assert.equal(entry.overflow, false);
    }
  }
  await navigate(base + 'learn.html#lesson=swap-impact'); await settle(evaluate);
  const progress = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  await fill('foundation-amount', '12');
  await click('learn-topics');
  await evaluate("document.querySelector('[data-lesson-id=\"swap-impact\"]').click()");
  await settle(evaluate);
  assert.equal(await evaluate('document.activeElement.id'), 'learn-lesson-title');
  assert.equal(await evaluate("document.getElementById('learn-course').open"), false);
  assert.equal(await evaluate("document.getElementById('foundation-amount').value"), '12', 'Returning to the selected lesson preserves exploration.');
  assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), progress);
  await evaluate("document.querySelector('.learn-entry-links a').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate('document.activeElement.id'), 'learn-lesson-title');
  await evaluate('scrollTo(0,400)'); await settle(evaluate);
  await reload(); await settle(evaluate);
  assert.ok(Math.abs(await evaluate('scrollY') - 400) <= 2, 'Reload keeps the reading position.');
  assert.equal(await text('learn-lesson-number'), 'LESSON 1 OF 7');
  await navigate(base + 'learn.html#lesson=final-challenge'); await settle(evaluate);
  assert.equal(await text('learn-lesson-number'), 'FINAL CHALLENGE · 7 OF 7');
  await navigate(base + 'learn.html'); await settle(evaluate);
  assert.ok(await evaluate('scrollY') <= 1, 'The generic Learn entry retains its overview.');
  const entries = await evaluate("Array.from(document.querySelectorAll('.learn-entry-links a')).map(a=>({top:a.getBoundingClientRect().top,height:a.getBoundingClientRect().height}))");
  assert.ok(entries.every(a => a.height >= 44 && Math.abs(a.top - entries[0].top) < 1), 'Mobile chapter links share one row with touch targets.');
  await navigate(base + 'learn.html#lesson=unknown'); await settle(evaluate);
  assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), false);
  assert.ok(await evaluate('scrollY') <= 1, 'Invalid routes keep their explanation visible.');
  console.log('PASS: direct lesson focus across five chapters, repeat-link keyboard navigation, preserved exploration, reload position and compact mobile overview');

  await navigate(base + 'liquidity.html#historical-case');
  await evaluate(`new Promise((resolve,reject)=>{const end=Date.now()+10000;const poll=()=>{if(!document.getElementById('period-result').hidden)resolve();else if(Date.now()>end)reject(new Error('Record did not load'));else setTimeout(poll,20)};poll()})`);
  const disclosure = await evaluate("Array.from(document.querySelectorAll('.period-details>summary')).map(el=>({height:el.getBoundingClientRect().height,outline:getComputedStyle(el).outlineStyle}))");
  assert.equal(disclosure.length, 2); assert.ok(disclosure.every(el => el.height >= 44));
  await evaluate("document.querySelector('.period-details>summary').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate("document.querySelector('.period-details').open"), true);
  console.log('PASS: historical evidence disclosures provide full touch targets and native keyboard access');
}
