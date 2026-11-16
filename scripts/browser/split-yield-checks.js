import assert from 'node:assert/strict';
import { dragRangeToMax } from './touch-range.js';
import { checkSplitExit, checkSplitExitOnPhone } from './split-yield-exit-checks.js';

export async function checkSplitYield({ evaluate, click, fill, text, navigate, reload, base, call, nextEvent }) {
  await navigate(base);
  const before = await evaluate('({local: {...localStorage}, session: {...sessionStorage}})');
  const visible = id => evaluate('document.getElementById(' + JSON.stringify(id) + ').checkVisibility()');
  const value = id => evaluate('document.getElementById(' + JSON.stringify(id) + ').value');
  const stage = name => evaluate('document.querySelector(\'[data-stage="' + name + '"]\').click()');
  try {
    const opened = nextEvent('Page.loadEventFired');
    await evaluate("document.querySelector('.home-lab-link[href=\"yield.html\"]').click()");
    await opened;
    await click('split-reset');
    assert.equal(await text('split-yt-cost'), '20.00 USDC');
    assert.match(await text('split-reading'), /13.90 USDC.*6.10 USDC short/);
    assert.equal(await text('split-recover'), '21.05 USDC');
    assert.equal(await text('split-match'), '21.51 USDC');
    await stage('purchase');
    assert.match(await text('split-reading'), /up front/);
    await stage('change');
    assert.match(await text('split-reading'), /By day 80/);
    assert.equal(await text('strategy-yt-value'), '694.87 USDC', 'Maturity comparison is independent of the timeline point.');
    await stage('maturity');
    await fill('split-switch', '10');
    assert.match(await text('split-reading'), /30.86 USDC.*10.86 USDC above/);
    assert.equal(await text('strategy-pt-value'), '1,020.41 USDC');
    assert.equal(await text('strategy-yt-value'), '1,543.08 USDC');
    assert.equal(await text('strategy-hold-value'), '1,032.49 USDC');
    console.log('PASS: two claims on one deposit, early and late yield, independent timeline and equal-budget maturity outcomes');

    await click('yield-compare-link');
    assert.equal(await evaluate('document.activeElement.id'), 'comparison-title');
    await fill('split-budget', '500');
    assert.equal(await text('strategy-yt-value'), '771.54 USDC');
    assert.equal(await text('split-yt-cost'), '20.00 USDC');
    await click('split-share');
    const sharedLink = await value('split-link');
    assert.ok(sharedLink.startsWith(base + 'yield.html#yield=pendle-split-v1&'));
    await fill('split-budget', '');
    assert.equal(await visible('split-comparison-results'), false);
    assert.equal(await visible('yield-plot-panel'), true);
    assert.equal(await evaluate("document.getElementById('split-share').disabled"), true);
    await reload();
    assert.equal(await value('split-budget'), '500', 'Invalid edits preserve the last valid draft.');
    await navigate(base);
    assert.equal(await evaluate("document.getElementById('home-experiment').href"), sharedLink);
    await navigate(sharedLink);
    assert.equal(await value('split-switch'), '10');
    assert.equal(await text('yield-notice'), 'Shared yield setup loaded.');
    await evaluate("document.getElementById('split-settings').open = true");
    await fill('split-price', '1');
    assert.equal(await visible('yield-plot-panel'), false);
    assert.equal(await text('split-pt-cost'), '—');
    assert.equal(await visible('split-comparison-results'), false);
    await fill('split-price', '0.95');
    assert.equal(await text('split-match'), 'No finite yield');
    await fill('split-days', '0');
    assert.equal(await visible('split-days-error'), true);
    await fill('split-days', '180');
    assert.equal(await value('split-switch'), '20');
    assert.equal(await evaluate('location.hash.includes("days=180")'), true);
    await navigate(base + 'yield.html#yield=bad');
    assert.match(await text('yield-notice'), /could not be read.*last saved/);
    assert.equal(await value('split-price'), '0.95');
    await click('split-reset');
    console.log('PASS: yield links, Home resume, input isolation, missing and invalid inputs, recovery and unattainable benchmark');

    await checkSplitExit({ evaluate, click, fill, text, value, visible, navigate, reload, base }, sharedLink);

    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      await navigate(base + 'yield.html');
      const layout = await evaluate(`({page:document.documentElement.scrollWidth, width:innerWidth, scale:visualViewport.scale,
        outside:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>${width}+1)
          .slice(0,8).map(el=>el.id||el.className||el.tagName)})`);
      assert.ok(layout.page <= width, 'Yield layout exceeds the phone width: ' + JSON.stringify({ expectedWidth: width, ...layout }));
      await dragRangeToMax({ evaluate, call, fill }, 'split-switch');
      assert.match(await text('split-rates'), /5% APY for 90 days/);
      await evaluate("document.getElementById('split-switch').focus()");
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
      await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
      assert.equal(await value('split-switch'), '89');
      await click('yield-compare-link');
      assert.equal(await visible('strategy-hold-value'), true);
      await checkSplitExitOnPhone({ evaluate, call, click, fill, value }, width);
      assert.ok(await evaluate("document.querySelector('[aria-label=\"DeFi topic\"]').getBoundingClientRect().right") <= width);
      for (const page of ['about.html', 'methods.html#split-yield', 'learn.html', 'lending.html#experiment', 'liquidity.html#experiment']) {
        await navigate(base + page);
        const target = page === 'learn.html' ? 'yield-learn.html' : 'yield.html';
        assert.ok(await evaluate("document.querySelector('.topic-nav a[href=\"" + target + "\"]').getBoundingClientRect().right") <= width, 'Topic link fits ' + page + ' at ' + width + 'px');
      }
    }
    await fill('scenario-future', '3571');
    const away = nextEvent('Page.loadEventFired');
    await evaluate("document.querySelector('.topic-nav a[href=\"yield.html\"]').click()");
    await away;
    const back = nextEvent('Page.loadEventFired');
    await evaluate("document.querySelector('.topic-nav a[href^=\"liquidity.html\"]').click()");
    await back;
    assert.equal(await value('scenario-future'), '3571', 'Visiting Yield preserves the liquidity draft.');
    console.log('PASS: yield topic entry, keyboard and touch interaction at 390/320px and return to an edited liquidity lab');
  } finally {
    await call('Emulation.setTouchEmulationEnabled', { enabled: false });
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await navigate(base);
    await evaluate('localStorage.clear();sessionStorage.clear();Object.assign(localStorage,' + JSON.stringify(before.local)
      + ');Object.assign(sessionStorage,' + JSON.stringify(before.session) + ')');
  }
}
