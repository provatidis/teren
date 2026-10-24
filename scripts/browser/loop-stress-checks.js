import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkLoopStressLesson({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const saved = () => evaluate("localStorage.getItem('teren-loop-learning-v1')");
  const working = () => evaluate("[sessionStorage.getItem('teren-lending-draft-v1'),sessionStorage.getItem('teren-loop-draft-v1'),localStorage.getItem('teren-lending-learning-v1')]");
  const choose = (name, value) => evaluate(`document.querySelector('input[name="lend-${name}"][value="${value}"]').click()`);
  const mode = () => evaluate("document.querySelector('.stress-scene').dataset.mode");
  const key = async (id, name) => {
    await evaluate(`document.getElementById('${id}').focus()`);
    const code = { Home: 36, End: 35, ArrowLeft: 37, ArrowRight: 39 }[name];
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: code });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'lending.html#loop-lesson=stress'); await click('lend-retry');
  const initial = await saved(), drafts = await working();
  const handoff = await evaluate("document.getElementById('lend-explore').href");
  assert.match(handoff, /future=1500&days=0&supplyAPR=0&borrowAPR=0/);
  assert.equal(await text('lend-flow-title'), 'Same start, different exposure');
  assert.equal(await evaluate("document.querySelector('.stress-figure figcaption').textContent"), 'Gain or loss from the start');
  assert.equal(await evaluate("document.getElementById('lend-reveal').disabled"), false);
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), await text('lend-question'));
  assert.equal(await evaluate("document.querySelector('.scene-prediction').open"), false);
  assert.equal(await text('stress-holding-value'), '$10,000.00');
  assert.equal(await text('stress-loop-value'), '$10,000.00');
  await fill('stress-price', '1500');
  assert.equal(await text('stress-holding-change'), 'Loss: $2,500.00');
  assert.equal(await text('stress-loop-change'), 'Loss: $4,687.50');
  assert.equal(await text('stress-health'), '1.29');
  const bars = await evaluate("Array.from(document.querySelectorAll('.stress-fill')).map(el=>({width:el.getBoundingClientRect().width,left:parseFloat(el.style.left)}))");
  assert.ok(Math.abs(bars[1].width / bars[0].width - 1.875) < .01);
  assert.ok(bars.every(bar=>bar.left < 50), 'Losses extend left of the shared zero.');
  await click('stress-mode-price');
  assert.equal(await evaluate("document.getElementById('stress-price').value"), '1500');
  assert.equal(await evaluate("Array.from(document.querySelectorAll('.stress-scene [role=status]')).every(el=>el.textContent==='')"), true);
  await evaluate("Array.from(document.querySelectorAll('.stress-scene .scene-shortcut')).find(button=>button.textContent==='Boundary').click()");
  const boundary = Number(await evaluate("document.getElementById('stress-price').value"));
  assert.ok(Math.abs(boundary - 1166.6666666666667) < 1e-9);
  assert.equal(await text('stress-health'), '1.00');
  assert.equal(await text('stress-status'), 'At the liquidation boundary.');
  assert.equal(await evaluate("Array.from(document.querySelectorAll('.stress-scene .scene-shortcut')).find(button=>button.textContent==='Boundary').getAttribute('aria-pressed')"), 'true');
  await fill('stress-price', String(boundary - .01));
  assert.equal(await text('stress-health'), '< 1.00');
  assert.equal(await text('stress-status'), 'Eligible for liquidation.');
  assert.match(await evaluate("document.querySelector('.stress-figure').textContent"), /before any liquidation/);
  await fill('stress-price', String(boundary + .01));
  assert.equal(await text('stress-health'), '> 1.00');
  await key('stress-price', 'Home');
  assert.equal(await text('stress-loop-value'), '$625.00');
  assert.equal(await text('stress-debt'), '8,750.00');
  await key('stress-price', 'End');
  assert.equal(await text('stress-loop-change'), 'Gain: $9,375.00');
  assert.equal(await text('stress-holding-change'), 'Gain: $5,000.00');
  assert.equal(await evaluate("Array.from(document.querySelectorAll('.stress-fill')).every(el=>el.style.left==='50%')"), true);
  await click('stress-mode-time'); await key('stress-time', 'End');
  assert.match(await text('stress-assumptions'), /0% supply APR; 10% borrow APR, continuously compounded/);
  assert.equal(await text('stress-holding-value'), '$10,000.00');
  assert.equal(await text('stress-loop-value'), '$9,079.75');
  assert.equal(await text('stress-debt'), '9,670.25');
  assert.equal(await text('stress-health'), '1.55');
  assert.match(await text('stress-interest'), /0.000 ETH supplied; 920.25 USDC debt/);
  await click('stress-mode-time');
  assert.equal(await evaluate("document.getElementById('stress-time').value"), '365');
  await click('stress-mode-price');
  assert.equal(await text('stress-loop-value'), '$10,000.00');
  assert.equal(await text('stress-debt'), '8,750.00');
  assert.equal(await saved(), initial);
  assert.deepEqual(await working(), drafts);
  assert.equal(await evaluate("document.getElementById('lend-explore').href"), handoff);
  await click('stress-mode-time'); await key('stress-time', 'End'); await click('lend-reveal');
  assert.equal(await mode(), 'price');
  assert.equal(await evaluate("document.getElementById('stress-price').value"), '1500');
  assert.equal(await evaluate("Array.from(document.querySelectorAll('.stress-scene [role=status]')).every(el=>el.textContent==='')"), true);
  assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked')===null"), true);
  assert.equal(await evaluate("document.getElementById('lend-explanation').hidden"), false);
  await choose('reason', 'exposure'); await choose('application', 'falls'); await click('lend-check');
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  await click('stress-mode-time'); await key('stress-time', 'End'); await reload();
  assert.equal(await mode(), 'price');
  assert.equal(await evaluate("document.getElementById('stress-price').value"), '1500');
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  await evaluate("document.querySelector('.scene-prediction > summary').click()");
  await choose('prediction', 'hold'); await click('lend-reveal');
  assert.match(await text('lend-prediction-feedback'), /^Compare this with your prediction/);
  await choose('reason', 'exposure'); await choose('application', 'falls'); await click('lend-check'); await reload();
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked').value"), 'hold');
  assert.deepEqual(await working(), drafts);
  assert.equal(await evaluate("document.getElementById('lend-explore').href"), handoff);
  await navigate(base + 'lending.html#loop-lesson=unwind');
  assert.equal(await text('lend-flow-title'), 'Follow the money');
  assert.equal(await text('lend-flow-instruction'), 'Take one action, then look at what changed.');
  await navigate(base + 'lending.html#lesson=conditions');
  assert.equal(await text('lend-flow-title'), 'Watch the health factor');
  assert.equal(await evaluate("document.querySelector('.stress-scene')===null"), true);
  console.log('PASS: same-capital loop comparison, gain/loss scale, exact boundary, independent interest, optional completion and restored drafts/handoffs');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'lending.html#loop-lesson=stress');
    for (const current of ['price', 'time']) {
      await click('stress-mode-' + current);
      const id = 'stress-' + current;
      await key(id, 'Home');
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      const size = await evaluate(`({scene:document.getElementById('${id}').getBoundingClientRect().bottom-document.querySelector('.stress-figure').getBoundingClientRect().top,available:innerHeight-document.querySelector('.topbar').getBoundingClientRect().height})`);
      assert.ok(size.scene <= size.available, `Loop ${current} at ${width}px needs ${size.scene}px; available ${size.available}px.`);
      await evaluate(`document.getElementById('${id}').scrollIntoView({block:'center'})`);
      await settle(evaluate);
      const box = await evaluate(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()`);
      assert.ok(box.height >= 44);
      const point = fraction => ({ x: box.left + 26 + (box.width - 52) * fraction, y: box.top + box.height / 2, id: 0 });
      await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      try {
        await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
        for (const fraction of [.2, .4, .6, .8, 1]) {
          await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] });
          await settle(evaluate);
          const top = await evaluate(`document.getElementById('${id}').getBoundingClientRect().top`);
          assert.ok(Math.abs(top - box.top) < 1, `Loop ${current} slider moved during a drag at ${width}px.`);
        }
        await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally { await call('Emulation.setTouchEmulationEnabled', { enabled: false }); }
      assert.equal(await evaluate(`document.getElementById('${id}').value`), current === 'price' ? '3000' : '365');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      try {
        await key(id, 'Home');
        assert.equal(await evaluate("document.querySelector('.stress-scene').getAnimations({subtree:true}).length"), 0);
        assert.ok(await evaluate("Array.from(document.querySelectorAll('.stress-modes button')).every(button=>button.getBoundingClientRect().height>=44)"));
      } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
    }
  }
  console.log('PASS: loop price/time lesson at 390px/320px, chart/control proximity, stable native touch dragging, keyboard and reduced motion');
}
