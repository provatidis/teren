import assert from 'node:assert/strict';

export async function checkStartup({ evaluate, click, fill, text, navigate, base, call, nextEvent, waitForStartup }) {
  const state = () => evaluate("document.getElementById('app-startup').dataset.state");
  const storage = () => evaluate('JSON.stringify([localStorage, sessionStorage])');
  const waitForFailure = () => evaluate(`new Promise((resolve, reject) => {
    const deadline = Date.now() + 5000;
    const check = () => {
      if (document.getElementById('app-startup').dataset.state === 'failed') return resolve();
      if (Date.now() > deadline) return reject(new Error('Startup failure was not reported'));
      setTimeout(check, 20);
    };
    check();
  })`);
  async function unavailable() {
    assert.equal(await evaluate("document.getElementById('app-startup').checkVisibility()"), true);
    assert.equal(await evaluate("document.getElementById('app-content').inert && !document.getElementById('app-content').checkVisibility({ visibilityProperty: true })"), true);
    assert.equal(await evaluate("[...document.querySelectorAll('#app-content input, #app-content button, #app-content select')].some(el => el.checkVisibility({ visibilityProperty: true }))"), false, 'No editable-looking controls survive a failed startup.');
    assert.equal(await evaluate("[...document.querySelectorAll('#app-content .loan-health, #app-content .lab-quick-result')].some(el => el.checkVisibility({ visibilityProperty: true }))"), false, 'Static or partially initialized verdicts stay unavailable.');
    assert.equal(await evaluate("document.querySelector('.brand').checkVisibility() && document.querySelector('.site-footer').checkVisibility()"), true, 'Navigation and information links remain available.');
  }
  async function noticeInView() {
    assert.equal(await evaluate("(() => { const rect = document.getElementById('app-startup').getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight; })()"), true, 'Deep links must not scroll past the startup explanation.');
  }
  async function intercept(route, pattern, response = null) {
    if (response === null) {
      // Block both a preload and any later import retry of the same asset.
      await call('Network.setBlockedURLs', { urls: [pattern] });
      await navigate(base + route, { startup: false });
      return;
    }
    await call('Fetch.enable', { patterns: [{ urlPattern: pattern, requestStage: 'Request' }] });
    const paused = nextEvent('Fetch.requestPaused');
    const opening = navigate(base + route, { startup: false });
    const request = await paused;
    await call('Fetch.fulfillRequest', {
      requestId: request.requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }],
      body: Buffer.from(response).toString('base64'),
    });
    await opening;
  }
  async function clearFault() {
    await call('Fetch.disable');
    await call('Network.setBlockedURLs', { urls: [] });
  }

  await call('Network.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  try {
    await navigate(base + 'lending.html#experiment');
    await fill('loan-future', '1750');
    const saved = await storage();
    for (const [route, entry] of [
      ['lending.html?review=startup#loops', 'lending-main'],
      ['liquidity.html#range-lab', 'main'],
      ['learn.html#applied=fees-over-time', 'learn-main'],
    ]) {
      for (const pattern of ['*/' + entry + '*.js', '*/lib/format*.js']) {
        await intercept(route, pattern);
        await waitForFailure();
        await unavailable();
        if (route.startsWith('lending.html')) assert.equal(await text('loan-health'), '—', 'Initial HTML does not claim a calculated health factor.');
        assert.equal(await storage(), saved, 'Failed module loading does not clear or rewrite saved work.');
        assert.equal(await evaluate('location.href'), base + route, 'The requested route stays intact.');
        assert.equal(await evaluate("document.getElementById('app-reload').checkVisibility()"), true);
        await clearFault();
      }
    }
    console.log('PASS: missing application entries and nested dependencies fail visibly across labs and lessons');

    // Even failure of the guard itself leaves the HTML fallback and locked content.
    for (const [route, entry] of [
      ['lending.html#lst-loops', 'lending-entry'],
      ['liquidity.html#saved-experiments', 'liquidity-entry'],
      ['learn.html#applied=fees-over-time', 'lib/app-startup'],
    ]) {
      await intercept(route, '*/' + entry + '*.js');
      assert.equal(await state(), 'loading');
      await unavailable();
      await noticeInView();
      assert.match(await text('app-startup-message'), /reload the page/);
      assert.equal(await storage(), saved);
      await clearFault();
    }
    console.log('PASS: unavailable startup guard retains the static explanation and safe initial state');

    await intercept('lending.html?review=startup#loops', '*/lending-main*.js',
      "document.getElementById('loan-health').textContent = '99.99'; throw new Error('Injected startup failure');");
    await waitForFailure();
    await unavailable();
    assert.equal(await storage(), saved);
    await clearFault();
    const reloaded = nextEvent('Page.loadEventFired');
    await click('app-reload');
    await reloaded;
    await waitForStartup();
    assert.equal(await evaluate('location.href'), base + 'lending.html?review=startup#loops');
    assert.equal(await evaluate('document.body.dataset.lendingView'), 'loops');
    assert.equal(await evaluate("document.getElementById('loan-future').value"), '1750', 'Reload preserves the last valid loan draft.');
    await navigate(base + 'lending.html#experiment');
    await fill('loan-future', '1000');
    assert.equal(await text('loan-health'), '0.80');
    assert.equal(await text('loan-state'), 'Eligible for liquidation');
    console.log('PASS: initialization exceptions stay contained; reload preserves route and draft and restores calculations');

    // Hold a real dependency rather than assuming that a long load has failed.
    await call('Fetch.enable', { patterns: [{ urlPattern: '*/lib/format*.js', requestStage: 'Request' }] });
    const held = nextEvent('Fetch.requestPaused');
    const loading = navigate(base + 'lending.html#experiment', { startup: false });
    const request = await held;
    await evaluate("new Promise(resolve => { const check = () => document.getElementById('app-startup') ? resolve() : setTimeout(check, 20); check(); })");
    await unavailable();
    assert.equal(await state(), 'loading');
    await call('Fetch.continueRequest', { requestId: request.requestId });
    await loading;
    await waitForStartup();
    assert.equal(await evaluate("document.getElementById('app-content').inert"), false);
    assert.equal(await text('loan-health'), '0.80');
    await clearFault();
    console.log('PASS: delayed dependencies remain safely pending and become interactive when ready');

    await intercept('', '*/home-main*.js');
    await waitForFailure();
    assert.equal(await evaluate("document.querySelector('.home-lab-link').checkVisibility()"), true);
    assert.equal(await evaluate("document.querySelector('.home-learn-link').checkVisibility()"), true);
    await clearFault();

    for (const width of [1440, 390]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 750 });
      await intercept('lending.html#experiment', '*/lending-main*.js');
      await waitForFailure();
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.equal(await evaluate("document.getElementById('app-reload').getBoundingClientRect().bottom < innerHeight"), true);
      await evaluate("document.getElementById('loan-future').focus()");
      assert.notEqual(await evaluate('document.activeElement.id'), 'loan-future', 'The hidden form cannot take keyboard focus.');
      await clearFault();
    }
    console.log('PASS: Home keeps its ordinary links; failure notices and reload work at desktop and phone sizes');

    await call('Emulation.setScriptExecutionDisabled', { value: true });
    for (const route of ['liquidity.html#lp-lab', 'learn.html#lesson=swap-impact', 'lending.html#lst-loops']) {
      const loaded = nextEvent('Page.loadEventFired', { startup: false });
      await call('Page.navigate', { url: base + route });
      await loaded;
      await unavailable();
      await noticeInView();
      assert.equal(await evaluate("document.querySelector('noscript').textContent.includes('JavaScript')"), true);
    }
    console.log('PASS: JavaScript-disabled pages explain the requirement without presenting usable calculators');
  } finally {
    await clearFault();
    await call('Emulation.setScriptExecutionDisabled', { value: false });
    await call('Network.setCacheDisabled', { cacheDisabled: false });
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await navigate(base);
    await evaluate('localStorage.clear(); sessionStorage.clear()');
  }
}
