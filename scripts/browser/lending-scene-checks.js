import assert from 'node:assert/strict';

export async function checkLendingScenes({ evaluate, click, text, navigate, reload, base, call }) {
  const saved = () => evaluate("localStorage.getItem('teren-lending-learning-v1')");
  const isolated = () => evaluate("[sessionStorage.getItem('teren-lending-draft-v1'),sessionStorage.getItem('teren-loop-draft-v1'),localStorage.getItem('teren-loop-learning-v1')]");
  const stage = () => evaluate("document.querySelector('#lend-money-flow .scene-player').dataset.stage");
  const choose = (name, value) => evaluate(`document.querySelector('input[name="lend-${name}"][value="${value}"]').click()`);
  const enter = async id => {
    await evaluate(`document.getElementById('${id}').focus()`);
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'lending.html#lesson=supply');
  const working = await isolated();
  const completed = JSON.parse(await saved()).completed;
  for (const [id, questionStage, reason, application] of [
    ['supply', '2', 'separate', 'enable'], ['borrow', '1', 'liability', 'boundary'],
  ]) {
    await navigate(base + 'lending.html#lesson=' + id);
    await click('lend-retry');
    assert.equal(await stage(), '0');
    assert.equal(await evaluate("document.getElementById('lend-reveal').disabled"), false);
    assert.equal(await evaluate("document.querySelector('.scene-prediction').open"), false);
    assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), await text('lend-question'));
    const initial = await saved();
    await enter('loan-scene-next');
    assert.equal(await stage(), '1');
    if (id === 'supply') {
      assert.equal(await text('loan-scene-eth'), '0.00 ETH');
      assert.equal(await text('loan-scene-supply'), '5.00 ETH');
      assert.equal(await text('loan-scene-net'), '$10,000.00');
      await click('loan-scene-next');
      assert.equal(await text('loan-scene-supply'), '5.10 ETH');
      assert.equal(await text('loan-scene-capacity'), '$0.00');
      assert.equal(await text('loan-scene-net'), '$10,200.00');
      await click('loan-scene-next');
      assert.equal(await text('loan-scene-collateral'), 'Collateral on');
      assert.equal(await text('loan-scene-capacity'), '$7,650.00');
      assert.equal(await text('loan-scene-supply'), '5.10 ETH');
      assert.equal(await text('loan-scene-debt'), '0.00 USDC');
      assert.equal(await text('loan-scene-net'), '$10,200.00');
    } else {
      assert.equal(await text('loan-scene-cash'), '5,000.00 USDC');
      assert.equal(await text('loan-scene-debt'), '5,000.00 USDC');
      assert.equal(await text('loan-scene-supply'), '5.00 ETH');
      assert.equal(await text('loan-scene-capacity'), '$2,500.00');
      assert.equal(await text('loan-scene-net'), '$10,000.00');
      assert.match(await text('loan-scene-cue'), /^Pool → wallet:/);
    }
    const frame = await evaluate("document.querySelector('.loan-scene-figure').textContent");
    await click('loan-scene-replay'); await click('loan-scene-replay');
    assert.equal(await evaluate("document.querySelector('.loan-scene-figure').textContent"), frame);
    await evaluate("document.querySelector('.scene-jump > summary').click()");
    await evaluate("document.querySelector('.scene-jump [data-stage=\"0\"]').click()");
    assert.equal(await stage(), '0');
    assert.equal(await evaluate("document.querySelector('.scene-jump [data-stage=\"0\"]').getAttribute('aria-current')"), 'step');
    assert.equal(await evaluate("document.getElementById('loan-scene-previous').disabled"), true);
    assert.equal(await saved(), initial, 'Scene actions never alter saved answers.');
    await evaluate("document.querySelector('.scene-jump > summary').click()");
    await click('lend-reveal');
    assert.equal(await stage(), questionStage);
    if (id === 'supply') assert.equal(await text('loan-scene-collateral'), 'Collateral off');
    assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked')===null"), true);
    await choose('reason', reason); await choose('application', application); await click('lend-check');
    assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
    const checked = await saved();
    const handoff = await evaluate("document.getElementById('lend-explore').href");
    assert.match(handoff, /loan=collateral-loan-v1/);
    assert.match(handoff, id === 'supply' ? /collateralEnabled=false/ : /borrow=5000/);
    assert.match(handoff, id === 'supply' ? /days=365/ : /days=0/);
    await click('loan-scene-next');
    assert.equal(await saved(), checked);
    assert.equal(await evaluate("document.getElementById('lend-explore').href"), handoff);
    await reload();
    assert.equal(await stage(), questionStage);
    assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked')===null"), true);
    await evaluate("document.querySelector('.scene-prediction > summary').click()");
    assert.equal(await evaluate("document.getElementById('lend-prediction-field').checkVisibility()"), true);
    await choose('prediction', id === 'supply' ? 'earn' : 'same');
    assert.equal(await stage(), questionStage, 'Choosing a prediction must not reset the explored scene.');
    await click('lend-reveal');
    assert.match(await text('lend-prediction-feedback'), /^Your prediction matches/);
  }
  assert.deepEqual(await isolated(), working, 'The working loan, loop and loop progress stay unchanged.');
  assert.deepEqual(JSON.parse(await saved()).completed, completed, 'Existing completion survives retrying a visual lesson.');
  await navigate(base + 'lending.html#lesson=conditions');
  assert.equal(await evaluate("document.getElementById('lend-prediction-field').closest('.scene-prediction')===null"), true);
  assert.ok(await evaluate("document.getElementById('lend-question').getBoundingClientRect().width") > 100);
  await navigate(base + 'lending.html#loop-lesson=build');
  assert.equal(await evaluate("document.querySelector('.loan-scene')===null"), true);
  assert.ok(await evaluate("document.querySelector('#lend-money-flow .scene-player')!==null"));
  console.log('PASS: supply/borrow scenes, exact balances, optional predictions, keyboard actions, completion, restoration and draft/handoff isolation');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    for (const id of ['supply', 'borrow']) {
      await navigate(base + 'lending.html#lesson=' + id);
      await evaluate("document.querySelector('.scene-jump > summary').click()");
      const count = await evaluate("document.querySelectorAll('.scene-jump [data-stage]').length");
      for (let i = 0; i < count; i++) {
        await evaluate(`document.querySelector('.scene-jump [data-stage="${i}"]').click()`);
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
        const size = await evaluate("({scene:document.getElementById('loan-scene-next').getBoundingClientRect().bottom-document.querySelector('.loan-scene-figure').getBoundingClientRect().top,available:innerHeight-document.querySelector('.topbar').getBoundingClientRect().height})");
        assert.ok(size.scene <= size.available, `${id}, stage ${i}, ${width}px: scene and primary action need ${size.scene}px; available ${size.available}px.`);
      }
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      try {
        await click('loan-scene-replay');
        assert.equal(await evaluate("document.querySelector('.loan-scene-figure').getAnimations({subtree:true}).length"), 0);
        assert.ok(await evaluate("Array.from(document.querySelectorAll('.scene-actions button')).every(button=>button.getBoundingClientRect().height>=44)"));
      } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
    }
  }
  console.log('PASS: lending scenes at 390px/320px, short-screen balances and controls, direct steps and reduced motion');
}
