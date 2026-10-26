import assert from 'node:assert/strict';
import { LST_DEFAULTS } from '../../public/models/lst-loop-v1.js';
import { lstHash, readLSTHash } from '../../public/lib/lst-links.js';
import { dragRangeToMax } from './touch-range.js';

export async function checkLSTLoops({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const keys = ['teren-lst-loop-draft-v1', 'teren-experiment-location-v1', 'degenerator-experiments-v1'];
  await navigate(base + 'lending.html#lst-loops');
  const saved = await evaluate(`${JSON.stringify(keys)}.map(key=>[key,localStorage.getItem(key)])`);
  const legacy = await evaluate("sessionStorage.getItem('teren-loop-draft-v1')");
  const state = () => evaluate("JSON.parse(localStorage.getItem('teren-lst-loop-draft-v1'))");
  const visible = id => evaluate(`!document.getElementById('${id}').hidden`);
  const open = id => evaluate(`document.getElementById('${id}').open=true`);
  const sliderKey = async (id, key) => {
    await evaluate(`document.getElementById('${id}').focus()`);
    const keyCode = { Home: 36, End: 35, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[key];
    for (const type of ['keyDown', 'keyUp']) await call('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: keyCode });
  };
  try {
    await click('lst-reset');
    await fill('lst-buildMode', 'rounds');
    assert.equal(await evaluate('document.body.dataset.lendingView'), 'lst');
    assert.equal(await visible('lending-experiment'), false);
    assert.equal(await visible('lending-loops'), false);
    await click('lst-build-scene-next');
    assert.match(await text('lst-build-scene-title'), /Borrow WETH/);
    assert.match(await text('lst-build-scene'), /4.5 WETH/);
    await click('lst-build-scene-next');
    assert.match(await text('lst-build-scene-title'), /Buy wstETH/);
    assert.match(await text('lst-build-scene'), /0 WETH \+ 3.7463 wstETH/);
    await click('lst-build-scene-next');
    assert.match(await text('lst-build-scene-title'), /Supply/);
    assert.match(await text('lst-build-scene'), /8.7463 wstETH/);
    console.log('PASS: LST construction shows borrowed cash, purchased tokens, collateral and matching debt separately');

    await click('lst-view-hold');
    const health = await text('lst-health'), net = await text('lst-net'), dollars = await text('lst-usd');
    await open('lst-oracle-settings');
    await fill('lst-ethUSD', '500');
    assert.equal(await text('lst-health'), health); assert.equal(await text('lst-net'), net);
    assert.notEqual(await text('lst-usd'), dollars);
    await fill('lst-discount', '10');
    assert.equal(await text('lst-health'), health, 'New setups use conversion-rate valuation');
    await fill('lst-oracleMode', 'market');
    assert.notEqual(await text('lst-health'), health);
    const discounted = await text('lst-net');
    await fill('lst-oracleMode', 'rate');
    assert.equal(await text('lst-health'), health); assert.equal(await text('lst-net'), discounted);
    assert.match(await text('lst-health-note'), /exit still uses the lower sale price/);
    await open('lst-rates');
    await click('lst-rateChange');
    const debt = await text('lst-debt');
    await fill('lst-laterAPR', '12');
    assert.notEqual(await text('lst-debt'), debt);
    assert.equal((await state()).input.laterAPR, 12);
    assert.equal((await state()).view, 'hold');
    const link = await evaluate('location.href');
    await reload();
    assert.equal(await visible('lst-hold'), true);
    assert.equal(await evaluate("document.getElementById('lst-laterAPR').value"), '12');
    assert.deepEqual(readLSTHash(new URL(link).hash).input, (await state()).input);
    assert.equal(await evaluate("sessionStorage.getItem('teren-loop-draft-v1')"), legacy);
    console.log('PASS: dollar prices, market discounts, oracle rules and two-phase borrowing costs remain distinct and survive reload');

    await click('lst-reset'); await click('lst-view-hold');
    await fill('lst-days-input', '7.25');
    await fill('lst-discount-input', '0.55');
    assert.equal((await state()).input.days, 7.25);
    assert.equal((await state()).input.discount, 0.55);
    assert.equal(await evaluate("document.getElementById('lst-days').value"), '7.25');
    assert.equal(await evaluate("document.getElementById('lst-discount').value"), '0.55');
    assert.match(await text('lst-chart-caption'), /^At 0\.55% discount,/);
    assert.match(await evaluate("document.getElementById('lst-health-chart').getAttribute('aria-label')"), /^At 0\.55% discount,/);
    assert.equal(readLSTHash(await evaluate('location.hash')).input.discount, 0.55);
    await reload();
    for (const [key, value] of [['days', '7.25'], ['discount', '0.55']]) {
      assert.equal(await evaluate(`document.getElementById('lst-${key}-input').value`), value);
      assert.equal(await evaluate(`document.getElementById('lst-${key}').value`), value);
    }
    for (const [key, start, step, maximum] of [['days', 7.25, 1, 1825], ['discount', 0.55, 0.1, 50]]) {
      await sliderKey('lst-' + key, 'ArrowRight');
      assert.equal((await state()).input[key], start + step);
      await sliderKey('lst-' + key, 'ArrowUp');
      assert.equal((await state()).input[key], Number((start + 2 * step).toFixed(2)));
      await sliderKey('lst-' + key, 'ArrowLeft');
      await sliderKey('lst-' + key, 'ArrowDown');
      assert.equal((await state()).input[key], start);
      await sliderKey('lst-' + key, 'Home'); await sliderKey('lst-' + key, 'ArrowLeft');
      assert.equal((await state()).input[key], 0);
      await sliderKey('lst-' + key, 'End'); await sliderKey('lst-' + key, 'ArrowRight');
      assert.equal((await state()).input[key], maximum);
      await fill('lst-' + key + '-input', String(start));
    }
    const exactDraft = await state(), exactURL = await evaluate('location.href');
    await fill('lst-days-input', '');
    assert.equal(await visible('lst-hold-results'), false);
    assert.equal(await evaluate("document.getElementById('lst-save').disabled && document.getElementById('lst-share').disabled"), true);
    assert.deepEqual(await state(), exactDraft, 'Incomplete numeric edits must preserve the last valid draft.');
    assert.equal(await evaluate('location.href'), exactURL, 'Incomplete edits must not replace the valid resume link.');
    await click('lst-view-exit');
    assert.equal(await visible('lst-exit-outcome'), false);
    await click('lst-fix');
    assert.equal(await evaluate('document.activeElement.id'), 'lst-days-input');
    assert.equal(await visible('lst-hold'), true);
    await fill('lst-days-input', '1826');
    assert.equal(await visible('lst-invalid'), true);
    assert.match(await text('lst-days-error'), /1825/);
    await fill('lst-days', '30');
    assert.equal(await evaluate("document.getElementById('lst-days-input').value"), '30');
    assert.equal(await visible('lst-invalid'), false, 'The slider can repair an invalid exact value.');
    await fill('lst-discount-input', '50.1');
    assert.equal(await visible('lst-invalid'), true);
    await fill('lst-discount', '2.4');
    assert.equal(await evaluate("document.getElementById('lst-discount-input').value"), '2.4');
    assert.equal(await visible('lst-invalid'), false);
    assert.equal((await state()).input.discount, 2.4);
    console.log('PASS: exact LST time and discount entries preserve fractional precision, synchronize with sliders and restore valid drafts without sharing invalid edits');

    await click('lst-reset'); await click('lst-view-hold'); await fill('lst-borrowAPR', '50');
    const bars = await evaluate(`(() => {
      const width = id => Number(document.getElementById(id).getAttribute('width'));
      return { collateral: width('lst-collateral-bar'), debt: width('lst-debt-bar'), hatch: width('lst-debt-pattern') };
    })()`);
    assert.equal(bars.debt, 500);
    assert.equal(bars.hatch, bars.debt);
    assert.ok(bars.collateral < bars.debt);
    const collateralValue = 15 * 1.2 * 1.03;
    const debtValue = 10 * 1.2 / (1 - 0.001) * (1 + 0.0005) * Math.exp(0.5);
    assert.ok(Math.abs(bars.collateral / bars.debt - collateralValue / debtValue) < 1e-12);
    assert.match(await text('lst-net'), /[−-]1\.2744 WETH/);
    assert.match(await text('lst-balance-label'), /Debt exceeds/);
    await fill('lst-borrowAPR', '2');
    assert.equal(await evaluate("Number(document.getElementById('lst-collateral-bar').getAttribute('width'))"), 500);
    assert.ok(await evaluate("Number(document.getElementById('lst-debt-bar').getAttribute('width')) < 500"));
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#experiments-empty a')).map(link=>link.getAttribute('href'))"), ['#experiment', '#loops', '#lst-loops']);
    console.log('PASS: LST collateral and debt keep a common scale above and below solvency; Lending’s empty library keeps its topic context');

    await click('lst-reset');
    await open('lst-build-assumptions');
    await fill('lst-rate', '');
    assert.equal(await visible('lst-invalid'), true);
    await click('lst-view-hold');
    assert.equal(await visible('lst-hold-results'), false);
    await click('lst-fix');
    assert.equal(await evaluate('document.activeElement.id'), 'lst-rate');
    assert.equal(await visible('lst-build'), true);
    assert.equal((await state()).input.rate, 1.2);
    await fill('lst-rate', '1.2');
    await click('lst-view-exit');
    assert.match(await text('lst-exit-status'), /clears both debts/);
    for (const title of ['Take a temporary flash loan', 'Repay the original WETH debt', 'Release the collateral', 'Sell the wstETH for WETH', 'Settle the temporary loan and costs']) {
      await click('lst-exit-scene-next'); assert.equal(await text('lst-exit-scene-title'), title);
    }
    await click('lst-exitAvailable');
    assert.match(await text('lst-exit-status'), /Exit unavailable/);
    assert.match(await text('lst-exit-outcome'), /WETH debt still owed/);
    assert.equal(await text('lst-exit-scene-title'), 'Exit not run');
    await click('lst-exitAvailable');
    await fill('lst-gas', '100');
    assert.match(await text('lst-exit-status'), /additional funding/);
    assert.match(await text('lst-exit-outcome'), /WETH debt still owed/);
    console.log('PASS: invalid inputs retain the valid draft; atomic exit keeps flash debt and blocks unavailable or underfunded execution');

    await click('lst-reset'); await click('lst-view-hold'); await fill('lst-oracleMode', 'market'); await fill('lst-discount', '50');
    assert.match(await text('lst-health-note'), /Eligible for liquidation/);
    assert.equal(await visible('lst-liquidation'), true);
    await open('lst-liquidation');
    assert.match(await text('lst-liquidation-results'), /WETH debt remaining/);
    await click('lst-view-exit'); assert.match(await text('lst-exit-status'), /at the boundary/);
    const recovered = { ...LST_DEFAULTS, rounds: 8, borrowPercent: 95, maxLTV: 97, threshold: 98, swapCost: 0,
      stakingAPY: 20, borrowAPR: 100, rateChange: true, laterAPR: 0, changeDay: 90 };
    await navigate(base + 'lending.html' + lstHash(recovered));
    assert.match(await text('lst-health-note'), /Above the liquidation boundary/);
    assert.equal(await visible('lst-path-note'), true);
    await click('lst-view-exit'); assert.match(await text('lst-exit-status'), /would already have reached/);
    console.log('PASS: endpoint liquidation and an earlier boundary followed by apparent recovery are both visible');

    await click('lst-reset'); await click('lst-view-hold');
    await click('lst-save'); await fill('experiment-name', 'Browser LST carry');
    await fill('experiment-notes', 'Rates and oracle are hypothetical.'); await click('experiment-save-confirm');
    const entry = await evaluate("JSON.parse(localStorage.getItem('degenerator-experiments-v1')).experiments.find(x=>x.name==='Browser LST carry')");
    assert.equal(entry.model, 'lst-loop-v2');
    await navigate(base + 'liquidity.html#saved=' + entry.id);
    assert.equal(await evaluate('document.body.dataset.lendingView'), 'lst');
    assert.equal(await visible('lst-hold'), true);
    assert.equal(await evaluate("document.getElementById('lst-rounds').value"), '3');
    await navigate(base + 'lending.html#lst=lst-loop-v1&broken=true');
    assert.equal(await visible('lst-route-note'), true);
    assert.equal(await evaluate("document.getElementById('lst-rounds').value"), '3');
    await click('lst-share');
    const shareURL = await evaluate("document.getElementById('lst-share-url').hidden ? location.href : document.getElementById('lst-share-url').value");
    // Successful clipboard copies do not change an intentionally invalid address.
    if (new URL(shareURL).hash.includes('&view=')) assert.equal(readLSTHash(new URL(shareURL).hash).status, 'ready');
    await navigate(base);
    assert.match(await evaluate("document.querySelector('a[href*=\"#lst=lst-loop-v2\"]')?.textContent || ''"), /correlated-asset loops/i);
    assert.ok(await evaluate("!!document.querySelector('a[href=\"lending.html#lst-loops\"]')"));
    console.log('PASS: named LST experiments reopen across topics, malformed links preserve drafts, and Home offers direct access and resumption');

    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await navigate(base + 'lending.html#lst-loops'); await click('lst-reset');
      await fill('lst-buildMode', 'rounds');
      await dragRangeToMax({ evaluate, call, fill }, 'lst-rounds');
      assert.equal((await state()).input.rounds, 8);
      await click('lst-view-hold');
      await fill('lst-days-input', '7');
      await fill('lst-discount-input', '0.5');
      assert.equal((await state()).input.days, 7);
      assert.equal((await state()).input.discount, 0.5);
      for (const id of ['lst-days-input', 'lst-discount-input']) {
        const bounds = await evaluate(`(() => { const r=document.getElementById('${id}').getBoundingClientRect(); return { width:r.width, height:r.height, left:r.left, right:r.right }; })()`);
        assert.ok(bounds.height >= 44 && bounds.width >= 60 && bounds.left >= 0 && bounds.right <= width, `${width}px ${id}: exact entry remains reachable`);
      }
      await open('lst-oracle-settings');
      await fill('lst-oracleMode', 'market');
      await dragRangeToMax({ evaluate, call, fill }, 'lst-discount');
      assert.equal((await state()).input.discount, 50);
      assert.equal(await evaluate("document.getElementById('lst-discount-input').value"), '50');
      assert.match(await text('lst-health-note'), /Eligible/);
      for (const view of ['build', 'hold', 'exit']) {
        await click('lst-view-' + view);
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `${width}px ${view}: no horizontal overflow`);
        const tabs = await evaluate("Array.from(document.querySelectorAll('.lst-views button')).map(el=>el.getBoundingClientRect().height)");
        assert.ok(tabs.every(height => height >= 44));
      }
    }
    console.log('PASS: 390px and 320px LST layouts keep labels readable, controls reachable and native touch sliders stable');
  } finally {
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate(`${JSON.stringify(saved)}.forEach(([key,value])=>value===null?localStorage.removeItem(key):localStorage.setItem(key,value))`);
  }
}
