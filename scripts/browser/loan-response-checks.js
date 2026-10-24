import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkLoanResponseLesson({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const saved = () => evaluate("localStorage.getItem('teren-lending-learning-v1')");
  const working = () => evaluate("[sessionStorage.getItem('teren-lending-draft-v1'),sessionStorage.getItem('teren-loop-draft-v1'),localStorage.getItem('teren-loop-learning-v1')]");
  const choose = (name, value) => evaluate(`document.querySelector('input[name="lend-${name}"][value="${value}"]').click()`);
  const key = async name => {
    await evaluate("document.getElementById('response-budget').focus()");
    const code = { Home: 36, End: 35, ArrowLeft: 37, ArrowRight: 39 }[name];
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: code });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
  };
  const shortcut = label => evaluate(`Array.from(document.querySelectorAll('.response-scene .scene-shortcut')).find(button=>button.textContent.startsWith('${label}')).click()`);
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'lending.html#lesson=respond');
  await click('lend-retry');
  const initial = await saved(), drafts = await working();
  const handoff = await evaluate("document.getElementById('lend-explore').href");
  assert.match(handoff, /future=1500&days=0/);
  assert.match(handoff, /budget=1000/);
  assert.equal(await text('lend-flow-title'), 'Where does the extra money go?');
  assert.equal(await evaluate("document.getElementById('lend-reveal').disabled"), false);
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), await text('lend-question'));
  assert.equal(await evaluate("document.querySelector('.scene-prediction').open"), false);
  assert.equal(await text('response-repay-health'), '1.20');
  assert.equal(await text('response-add-health'), '1.20');
  await shortcut('Question');
  assert.equal(await text('response-repay-backing'), '$6,000.00');
  assert.equal(await text('response-add-backing'), '$6,800.00');
  assert.equal(await text('response-repay-debt'), '$4,000.00');
  assert.equal(await text('response-add-debt'), '$5,000.00');
  assert.equal(await text('response-repay-health'), '1.50');
  assert.equal(await text('response-add-health'), '1.36');
  const bars = await evaluate("Array.from(document.querySelectorAll('.response-fill')).map(bar=>bar.getBoundingClientRect().width)");
  assert.ok(Math.abs(bars[0] / bars[2] - 1.5) < .01, 'Repay backing and debt have the same scale.');
  assert.ok(Math.abs(bars[1] / bars[3] - 1.36) < .01, 'Add backing and debt have the same scale.');
  await shortcut('Repay all');
  assert.equal(await text('response-repay-health'), 'No debt');
  assert.equal(await text('response-repay-eth'), '5.000 ETH');
  assert.equal(await text('response-repay-unused'), '$0.00');
  assert.equal(await text('response-add-debt'), '$5,000.00');
  assert.match(await text('response-copy'), /stays supplied.*no loan to liquidate/);
  await key('ArrowLeft');
  assert.equal(await text('response-repay-debt'), '$50.00');
  await key('ArrowRight');
  assert.equal(await text('response-repay-debt'), '$0.00');
  await key('End');
  assert.equal(await text('response-repay-unused'), '$1,000.00');
  assert.equal(await text('response-add-unused'), '$0.00');
  assert.equal(await text('response-add-eth'), '9.000 ETH');
  await key('Home');
  assert.equal(await text('response-repay-health'), '1.20', 'Exploration does not accumulate repayments.');
  assert.equal(await saved(), initial);
  assert.deepEqual(await working(), drafts);
  assert.equal(await evaluate("document.getElementById('lend-explore').href"), handoff);
  await click('lend-reveal');
  assert.equal(await evaluate("document.getElementById('response-budget').value"), '1000');
  assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked')===null"), true);
  await choose('reason', 'debt'); await choose('application', 'none'); await click('lend-check');
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  await key('End'); await reload();
  assert.equal(await evaluate("document.getElementById('response-budget').value"), '1000');
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked')===null"), true);
  await evaluate("document.querySelector('.scene-prediction > summary').click()");
  await choose('prediction', 'add'); await click('lend-reveal');
  assert.match(await text('lend-prediction-feedback'), /^Compare this with your prediction/);
  await choose('reason', 'debt'); await choose('application', 'none'); await click('lend-check');
  await reload();
  assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
  assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked').value"), 'add');
  assert.deepEqual(await working(), drafts);
  assert.equal(await evaluate("document.getElementById('lend-explore').href"), handoff);
  await navigate(base + 'lending.html#loop-lesson=stress');
  assert.equal(await evaluate("document.getElementById('lend-prediction-field').closest('.scene-prediction')===null"), true);
  await navigate(base + 'lending.html#loop-lesson=build');
  assert.equal(await text('lend-flow-title'), 'Follow the money');
  assert.equal(await text('lend-flow-instruction'), 'Take one action, then look at what changed.');
  console.log('PASS: equal-budget response comparison, capped repayment, supplied ETH, unused cash, optional completion and restored answers/drafts/handoffs');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'lending.html#lesson=respond');
    for (const budget of [0, 1000, 4950, 5000, 6000]) {
      await fill('response-budget', String(budget));
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      const size = await evaluate("({scene:document.getElementById('response-budget').getBoundingClientRect().bottom-document.querySelector('.response-figure').getBoundingClientRect().top,available:innerHeight-document.querySelector('.topbar').getBoundingClientRect().height})");
      assert.ok(size.scene <= size.available, `Response at ${width}px needs ${size.scene}px; available ${size.available}px.`);
    }
    await key('Home');
    await evaluate("document.getElementById('response-budget').scrollIntoView({block:'center'})");
    await settle(evaluate);
    const box = await evaluate("(()=>{const r=document.getElementById('response-budget').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()");
    assert.ok(box.height >= 44);
    const point = fraction => ({ x: box.left + 26 + (box.width - 52) * fraction, y: box.top + box.height / 2, id: 0 });
    await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    try {
      await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
      for (const fraction of [.2, .4, .6, .8, 1]) {
        await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] });
        await settle(evaluate);
        const top = await evaluate("document.getElementById('response-budget').getBoundingClientRect().top");
        assert.ok(Math.abs(top - box.top) < 1, `Response slider moved during a drag at ${width}px.`);
      }
      await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally { await call('Emulation.setTouchEmulationEnabled', { enabled: false }); }
    assert.equal(await evaluate("document.getElementById('response-budget').value"), '6000');
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    try {
      await shortcut('Question');
      assert.equal(await evaluate("document.querySelector('.response-scene').getAnimations({subtree:true}).length"), 0);
      assert.ok(await evaluate("Array.from(document.querySelectorAll('.response-scene button')).every(button=>button.getBoundingClientRect().height>=44)"));
    } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
  }
  console.log('PASS: response comparison at 390px/320px, simultaneous columns, chart/control proximity, stable native touch dragging and reduced motion');
}
