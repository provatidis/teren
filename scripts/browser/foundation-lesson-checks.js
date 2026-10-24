import { dragRangeToMax } from './touch-range.js';
import assert from 'node:assert/strict';

const progressKey = 'degenerator-learning-liquidity-v1';
const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkFoundationLessons({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="${group}"][value="${value}"]').click()`);
  const saved = () => evaluate(`localStorage.getItem('${progressKey}')`);
  const stage = () => evaluate("document.querySelector('.scene-player').dataset.stage");
  const key = async (id, key) => {
    await evaluate(`document.getElementById('${id}').focus()`);
    const input = key === 'Enter' ? { key, code: key, windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' } : { key, code: key };
    await call('Input.dispatchKeyEvent', { type: 'keyDown', ...input });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
  };
  const reset = async () => {
    await click('learn-variation');
    for (let i = 0; i < 3 && !(await text('learn-variation-label')).includes('1 of 3'); i++) await click('learn-variation');
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const sandbox = await evaluate("localStorage.getItem('defi-sandbox-v1')");
  for (const [id, reason, application, amount] of [['swap-impact', 'curve', 'more', '10'], ['pool-share', 'ownership', 'smaller', '5']]) {
    await navigate(base + 'learn.html#lesson=' + id);
    await reset();
    assert.equal(await evaluate("document.getElementById('learn-run').disabled"), false);
    assert.equal(await evaluate("document.querySelector('.scene-prediction').open"), false);
    assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), await text('learn-prediction-question'));
    assert.equal(await evaluate("document.querySelector('.scene-prediction-question').checkVisibility()"), true);
    const initial = await saved();
    await key('foundation-next', 'Enter');
    assert.equal(await stage(), '1');
    if (id === 'swap-impact') {
      assert.equal(await text('foundation-pool-eth'), '110.00 ETH');
      assert.equal(await text('foundation-pool-usdc'), '181,867.78 USDC');
      assert.equal(await text('foundation-execution-2'), '1,813.22');
      await key('foundation-amount', 'End');
      assert.equal(await text('foundation-execution-2'), '1,330.66');
      await key('foundation-amount', 'Home');
      assert.equal(await text('foundation-execution-2'), await text('foundation-execution-1'));
    } else {
      assert.equal(await text('foundation-pool-eth'), '105.00 ETH');
      assert.equal(await text('foundation-pool-price'), 'Pool price: $2,000.00 per ETH');
      const share = await text('foundation-pool-share');
      await click('foundation-next');
      assert.equal(await stage(), '2');
      assert.equal(await text('foundation-pool-eth'), '115.00 ETH');
      assert.equal(await text('foundation-pool-usdc'), '191,789.16 USDC');
      assert.equal(await text('foundation-pool-share'), share);
      assert.match(await text('foundation-claim'), /5.4762 ETH \+ 9,132.82 USDC/);
      assert.match(await text('foundation-flow'), /Another trader/);
    }
    const frame = await evaluate("document.querySelector('.foundation-pool').textContent");
    await click('foundation-replay'); await click('foundation-replay');
    assert.equal(await evaluate("document.querySelector('.foundation-pool').textContent"), frame);
    assert.equal(await saved(), initial, 'Playing and exploring must not alter saved answers or the assessed setup.');
    await click('learn-run');
    assert.equal(await evaluate("document.getElementById('foundation-amount').value"), amount);
    assert.equal(await stage(), '1', 'The explanation must return to the actual question action.');
    assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked')===null"), true);
    await choose('learn-reason', reason); await choose('learn-application', application); await click('learn-check');
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
    const checked = await saved();
    const link = await evaluate("document.getElementById('learn-explore').href");
    assert.equal(link, base + 'liquidity.html#swap-sandbox', 'Foundations retain their independent sandbox handoff.');
    await fill('foundation-amount', '1');
    assert.equal(await saved(), checked);
    assert.equal(await evaluate("document.getElementById('learn-explore').href"), link);
    await reload();
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate("document.getElementById('foundation-amount').value"), amount);
    await evaluate("document.querySelector('.scene-prediction > summary').click()");
    assert.equal(await evaluate("document.getElementById('learn-predictions').checkVisibility()"), true);
    await choose('learn-prediction', 'less');
    await click('learn-run');
    assert.equal(await text('learn-prediction-feedback'), 'Your prediction matches the result.');
    await evaluate("document.querySelector('.scene-question-settings > summary').click()");
    const control = id === 'swap-impact' ? 'amount' : 'depositEth';
    await fill('learn-input-' + control, '1');
    assert.equal(await evaluate("document.getElementById('learn-results').hidden"), true);
    assert.equal(await evaluate("document.getElementById('foundation-amount').value"), '1');
    assert.match(await text('foundation-amount-scope'), /checks use a 1 ETH/);
    for (let variant = 1; variant <= 2; variant++) {
      await click('learn-variation');
      assert.match(await text('learn-variation-label'), new RegExp('Variation ' + (variant + 1)));
      await click('foundation-next');
      if (id === 'pool-share') {
        assert.equal(await text('foundation-pool-price'), variant === 1 ? 'Pool price: $1,500.00 per ETH' : 'Pool price: $3,000.00 per ETH');
        const share = await text('foundation-pool-share');
        await click('foundation-next');
        assert.equal(await text('foundation-pool-share'), share);
      }
    }
  }
  assert.equal(await evaluate("localStorage.getItem('defi-sandbox-v1')"), sandbox);
  await navigate(base + 'learn.html#lesson=range-boundaries');
  assert.equal(await evaluate("document.getElementById('learn-prediction-field').closest('.scene-prediction')===null"), true);
  assert.ok(await evaluate("document.getElementById('learn-prediction-question').getBoundingClientRect().width") > 100, 'Other lessons retain their visible group legend.');
  console.log('PASS: swap/deposit actions, exact token transfers, constant ownership through a trade, optional predictions, restoration and isolated exploration');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    for (const id of ['swap-impact', 'pool-share']) {
      await navigate(base + 'learn.html#lesson=' + id); await reset();
      await click('foundation-next');
      if (id === 'pool-share') await click('foundation-next');
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      const sceneHeight = await evaluate("document.getElementById('foundation-next').getBoundingClientRect().bottom-document.querySelector('.foundation-pool').getBoundingClientRect().top");
      const available = await evaluate("innerHeight-document.querySelector('.topbar').getBoundingClientRect().height");
      assert.ok(sceneHeight <= available, `${id} at ${width}px: pool state and primary action need ${sceneHeight}px; available ${available}px.`);
      await dragRangeToMax({ evaluate, call, fill }, 'foundation-amount');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      try {
        await click('foundation-replay');
        assert.equal(await evaluate("getComputedStyle(document.querySelector('.foundation-pool .scene-token-fill')).animationName"), 'none');
        assert.ok(await evaluate("Array.from(document.querySelectorAll('.scene-actions button')).every(button=>button.getBoundingClientRect().height>=44)"));
      } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
    }
  }
  console.log('PASS: foundation scenes at 390px/320px, short-screen controls, stable touch dragging, keyboard actions and reduced motion');
}
