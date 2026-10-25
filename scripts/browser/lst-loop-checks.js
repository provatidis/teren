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
  try {
    await click('lst-reset');
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

    await click('lst-reset'); await click('lst-view-hold'); await fill('lst-discount', '50');
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
    assert.equal(entry.model, 'lst-loop-v1');
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
    assert.match(await evaluate("document.querySelector('a[href*=\"#lst=lst-loop-v1\"]')?.textContent || ''"), /correlated-asset loops/i);
    assert.ok(await evaluate("!!document.querySelector('a[href=\"lending.html#lst-loops\"]')"));
    console.log('PASS: named LST experiments reopen across topics, malformed links preserve drafts, and Home offers direct access and resumption');

    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await navigate(base + 'lending.html#lst-loops'); await click('lst-reset');
      await dragRangeToMax({ evaluate, call, fill }, 'lst-rounds');
      assert.equal((await state()).input.rounds, 8);
      await click('lst-view-hold');
      await dragRangeToMax({ evaluate, call, fill }, 'lst-discount');
      assert.equal((await state()).input.discount, 50);
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
