import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkLoanConditionLesson({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const saved = () => evaluate("localStorage.getItem('teren-lending-learning-v1')");
  const working = () => evaluate("[sessionStorage.getItem('teren-lending-draft-v1'),sessionStorage.getItem('teren-loop-draft-v1'),localStorage.getItem('teren-loop-learning-v1')]");
  const choose = (name, value) => evaluate(`document.querySelector('input[name="lend-${name}"][value="${value}"]').click()`);
  const mode = () => evaluate("document.querySelector('.condition-scene').dataset.mode");
  const key = async (id, name) => {
    await evaluate(`document.getElementById('${id}').focus()`);
    const code = { Home: 36, End: 35, ArrowLeft: 37, ArrowRight: 39 }[name];
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: code });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'lending.html#lesson=conditions');
  await click('lend-retry');
  const initial = await saved(), drafts = await working();
  const handoff = await evaluate("document.getElementById('lend-explore').href");
  assert.match(handoff, /future=2000&days=365&supplyAPR=0&borrowAPR=10/);
  assert.equal(await text('lend-flow-title'), 'Watch the health factor');
  assert.equal(await evaluate("document.getElementById('lend-reveal').disabled"), false);
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), await text('lend-question'));
  assert.equal(await evaluate("document.querySelector('.scene-prediction input').checkVisibility()"), true);
  assert.equal(await text('condition-backing'), '$8,000.00');
  assert.equal(await text('condition-debt'), '$5,000.00');
  assert.equal(await text('condition-health'), '1.60');
  await fill('condition-time', '180');
  await click('condition-mode-time');
  assert.equal(await evaluate("document.getElementById('condition-time').value"), '180', 'Re-selecting the active mode preserves exploration.');
  await key('condition-time', 'End');
  assert.equal(await text('condition-backing'), '$8,000.00');
  assert.equal(await text('condition-debt'), '$5,500.00');
  assert.equal(await text('condition-health'), '1.45');
  await click('condition-mode-price');
  assert.equal(await mode(), 'price');
  assert.equal(await text('condition-debt'), '$5,500.00', 'Switching to price never accrues interest twice.');
  assert.equal(await evaluate("document.getElementById('condition-price').value"), '2000');
  await evaluate("Array.from(document.querySelectorAll('.condition-scene .scene-shortcut')).find(button=>button.textContent.startsWith('Boundary')).click()");
  assert.equal(await evaluate("document.getElementById('condition-price').value"), '1375');
  assert.equal(await text('condition-health'), '1.00');
  const equal = await evaluate("Array.from(document.querySelectorAll('.condition-fill')).map(bar=>bar.getBoundingClientRect().width)");
  assert.equal(equal[0], equal[1], 'Both values use the same dollar scale.');
  await key('condition-price', 'ArrowLeft');
  assert.equal(await text('condition-health'), '< 1.00');
  assert.match(await text('condition-status'), /Eligible for liquidation.*before any liquidation/);
  await key('condition-price', 'ArrowRight'); await key('condition-price', 'ArrowRight');
  assert.equal(await text('condition-health'), '> 1.00');
  await key('condition-price', 'Home');
  assert.equal(await text('condition-backing'), '$4,000.00');
  assert.equal(await text('condition-debt'), '$5,500.00');
  assert.equal(await text('condition-health'), '0.73');
  await click('condition-mode-price');
  assert.equal(await evaluate("document.getElementById('condition-price').value"), '1000');
  await key('condition-price', 'End');
  assert.equal(await text('condition-backing'), '$12,000.00');
  assert.equal(await text('condition-debt'), '$5,500.00');
  assert.equal(await saved(), initial, 'Sliders and mode changes cannot change saved answers.');
  assert.deepEqual(await working(), drafts);
  assert.equal(await evaluate("document.getElementById('lend-explore').href"), handoff);
  await click('lend-reveal');
  assert.equal(await mode(), 'price', 'Reading the question explanation preserves the explored comparison.');
  assert.equal(await evaluate("document.getElementById('condition-price').value"), '3000');
  assert.equal(await text('lend-observe-title'), 'After one year at $2,000.00 per ETH');
  await evaluate("document.querySelector('#lend-money-flow .scene-prediction-show').click()");
  assert.equal(await mode(), 'time');
  assert.equal(await evaluate("document.getElementById('condition-time').value"), '365');
  assert.equal(await text('condition-health'), '1.45');
  assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked')===null"), true);
  await choose('reason', 'interest'); await choose('application', 'backing-faster'); await click('lend-check');
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  await click('condition-mode-price'); await fill('condition-price', '1000');
  await reload();
  assert.equal(await mode(), 'time');
  assert.equal(await evaluate("document.getElementById('condition-time').value"), '365');
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  assert.equal(await evaluate("document.querySelector('.scene-prediction input').checkVisibility()"), true);
  await choose('prediction', 'higher'); await click('lend-reveal');
  assert.match(await text('lend-prediction-feedback'), /^The result differs from your prediction\./);
  await choose('reason', 'interest'); await choose('application', 'backing-faster'); await click('lend-check');
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  assert.deepEqual(await working(), drafts);
  await navigate(base + 'lending.html#loop-lesson=stress');
  assert.equal(await evaluate("document.getElementById('lend-prediction-field').closest('.scene-prediction')===null"), false);
  await navigate(base + 'lending.html#loop-lesson=build');
  assert.equal(await text('lend-flow-title'), 'Follow the money');
  assert.equal(await text('lend-flow-instruction'), 'Take one action, then look at what changed.');
  assert.equal(await evaluate("document.querySelector('.condition-scene')===null"), true);
  console.log('PASS: independent time/price comparisons, equal-bar boundary, truthful nearby health labels, optional completion, exact handoffs and restored progress');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'lending.html#lesson=conditions');
    for (const current of ['time', 'price']) {
      await click('condition-mode-' + current);
      const id = 'condition-' + current;
      await key(id, 'Home');
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      const size = await evaluate(`({scene:document.getElementById('${id}').getBoundingClientRect().bottom-document.querySelector('.condition-figure').getBoundingClientRect().top,available:innerHeight-Math.max(0,document.querySelector('.topbar').getBoundingClientRect().bottom)})`);
      assert.ok(size.scene <= size.available, `${current} at ${width}px needs ${size.scene}px for chart and slider; available ${size.available}px.`);
      await evaluate(`document.getElementById('${id}').scrollIntoView({block:'center'})`);
      await settle(evaluate);
      const box = await evaluate(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()`);
      assert.ok(box.height >= 44);
      const point = fraction => ({ x: box.left + 26 + (box.width - 52) * fraction, y: box.top + box.height / 2, id: 0 });
      await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      try {
        await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
        for (const fraction of [.25, .5, .75, 1]) {
          await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] });
          await settle(evaluate);
          const top = await evaluate(`document.getElementById('${id}').getBoundingClientRect().top`);
          assert.ok(Math.abs(top - box.top) < 1, `The ${current} slider moved during a drag at ${width}px.`);
        }
        await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally { await call('Emulation.setTouchEmulationEnabled', { enabled: false }); }
      assert.equal(await evaluate(`document.getElementById('${id}').value`), current === 'time' ? '365' : '3000');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      try {
        await key(id, 'Home');
        assert.equal(await evaluate("document.querySelector('.condition-scene').getAnimations({subtree:true}).length"), 0);
        assert.ok(await evaluate("Array.from(document.querySelectorAll('.condition-modes button')).every(button=>button.getBoundingClientRect().height>=44)"));
      } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
    }
  }
  console.log('PASS: time/price lesson at 390px/320px, chart/control proximity, stable native touch dragging, keyboard and reduced motion');
}
