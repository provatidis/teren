import assert from 'node:assert/strict';

export async function checkSdaiCase({ evaluate, fill, navigate, reload, base, call, nextEvent }) {
  const route = 'yield-inspect.html';
  const stages = ['entry', 'size', 'results', 'evidence'];
  const current = () => evaluate('(' + JSON.stringify(stages) + ').filter(id => document.getElementById(id).checkVisibility())');
  async function go(stage) {
    const event = nextEvent('Page.navigatedWithinDocument');
    await evaluate('document.querySelector(\'nav a[href="#' + stage + '"]\').click()');
    await event;
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    assert.deepEqual(await current(), [stage]);
  }
  try {
    await navigate(base);
    const saved = await evaluate('JSON.stringify([localStorage,sessionStorage])');
    const opened = nextEvent('Page.loadEventFired');
    await evaluate("document.querySelector('.home-detail-link[href=\"yield-inspect.html\"]').click()");
    await opened;
    assert.deepEqual(await current(), ['entry']);
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.product-nav a'), link => link.textContent)"), ['Learn', 'Experiment', 'Inspect']);
    const entry = await evaluate("document.getElementById('entry').innerText");
    for (const premise of ['5%', '5.35%', '1,000']) assert.ok(entry.includes(premise));
    assert.doesNotMatch(entry, /183\.96|15%/);
    await go('size');
    assert.match(await evaluate("document.getElementById('size').innerText"), /201\.05/);
    await go('results');
    const results = await evaluate("document.getElementById('results').innerText");
    for (const amount of ['183.96', '100.83', '100.41']) assert.ok(results.includes(amount));
    const labLink = await evaluate("document.querySelector('#results .case-link').getAttribute('href')");
    assert.equal(labLink, 'yield.html', 'The hypothetical lab opens its own draft without importing case inputs.');
    assert.match(results, /Open the hypothetical yield lab/);
    await go('evidence');
    const back = nextEvent('Page.navigatedWithinDocument');
    await evaluate('history.back()');
    await back;
    await reload();
    assert.deepEqual(await current(), ['results']);
    await navigate(base + route + '#evidence');
    assert.deepEqual(await current(), ['evidence']);
    const files = await evaluate("Array.from(document.querySelectorAll('#evidence a[href]'), a => a.href)");
    const zip = files.find(href => href.endsWith('.zip'));
    assert.ok(zip, 'The evidence archive is reachable from Inspect.');
    const response = await fetch(zip);
    assert.equal(response.status, 200);
    assert.equal(Buffer.from(await response.arrayBuffer()).readUInt32LE(0), 0x04034b50);
    assert.ok(files.some(href => href.includes('etherscan.io/tx/')));
    assert.equal(await evaluate('JSON.stringify([localStorage,sessionStorage])'), saved, 'Inspecting a case does not replace a draft or lesson.');

    await navigate(base + 'liquidity.html#experiment');
    await fill('scenario-future', '3467');
    const inspect = nextEvent('Page.navigatedWithinDocument');
    await evaluate("document.getElementById('nav-inspect').click()");
    await inspect;
    assert.equal(await evaluate("document.getElementById('topic-yield').getAttribute('href')"), route);
    const toYield = nextEvent('Page.loadEventFired');
    await evaluate("document.getElementById('topic-yield').click()");
    await toYield;
    assert.equal(await evaluate("document.querySelector('.topic-nav a[href^=\"liquidity.html\"]').getAttribute('href')"), 'liquidity.html#inspect');
    const toLiquidity = nextEvent('Page.loadEventFired');
    await evaluate("document.querySelector('.topic-nav a[href^=\"liquidity.html\"]').click()");
    await toLiquidity;
    assert.equal(await evaluate("document.getElementById('scenario-future').value"), '3467');
    await evaluate("document.getElementById('scenario-reset').click()");
    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await navigate(base + route);
      for (const stage of stages) {
        if (stage !== 'entry') await go(stage);
        assert.ok(await evaluate('document.documentElement.scrollWidth <= ' + width), stage + ' fits ' + width + 'px');
      }
    }
    console.log('PASS: sDAI entry, size limit, settlement outcomes, direct links, navigation history, evidence download and mobile stages');
  } finally {
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await navigate(base);
  }
}
