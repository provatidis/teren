import assert from 'node:assert/strict';

export async function checkLabRisk({ evaluate, click, fill, text, navigate, reload, base, call }) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'lending.html#loops');
  await click('loop-reset');
  assert.match(await text('loop-risk-distance'), /58.29% below the selected price/);
  assert.doesNotMatch(await text('loop-chart-limit'), /outside this chart/);
  assert.ok(await evaluate("document.getElementById('loop-chart-boundary').getAttribute('d').length > 0"));
  await fill('loop-future', '800');
  assert.equal(await evaluate("document.getElementById('loop-liquidation').open"), true);
  assert.equal(await text('loop-net'), '$994.00');
  assert.equal(await text('loop-liquidation-before'), '$994.00');
  assert.equal(await text('loop-liquidation-net'), '$869.00');
  assert.match(await text('loop-liquidation-removed-value'), /\$2,625.00.*\$2,500.00/);
  assert.equal(await text('loop-liquidation-penalty'), '$125.00');
  await fill('loop-liquidation-repayPercent', '25');
  await fill('loop-liquidation-bonusPercent', '8');
  assert.equal(await text('loop-liquidation-net'), '$894.00');
  await reload();
  assert.equal(await evaluate("document.getElementById('loop-liquidation-bonusPercent').value"), '8');
  await fill('loop-liquidation-bonusPercent', '');
  assert.equal(await evaluate("document.getElementById('loop-liquidation-result').hidden"), true);
  assert.equal(await evaluate("document.getElementById('loop-results').hidden"), false);
  assert.equal(await evaluate("document.getElementById('loop-share').disabled && document.getElementById('loop-save').disabled"), true);
  await reload();
  assert.equal(await evaluate("document.getElementById('loop-liquidation-bonusPercent').value"), '8');
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}})");
  await click('loop-share');
  const shared = await evaluate("document.getElementById('loop-share-url').value");
  assert.match(shared, /liquidation=single-liquidation-v1/);
  await navigate(shared);
  assert.equal(await evaluate("document.getElementById('loop-liquidation-repayPercent').value"), '25');
  assert.equal(await evaluate("document.getElementById('loop-liquidation-bonusPercent').value"), '8');
  await fill('loop-liquidation-repayPercent', '100');
  await fill('loop-future', '300');
  assert.match(await text('loop-liquidation-health'), /All collateral is used.*unpaid debt remains/);
  assert.equal(await text('loop-liquidation-collateral'), '0 ETH');
  assert.match(await text('loop-liquidation-net'), /^−?\$?-|^−/);
  await fill('loop-rounds', '0');
  assert.match(await text('loop-liquidation-status'), /no loan to liquidate/);
  assert.equal(await text('loop-risk-distance'), '');
  console.log('PASS: loop liquidation preserves cash/debt accounting, residual debt, separate previews, invalid-input recovery, drafts and shared assumptions');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'lending.html#loops');
    await click('loop-reset');
    assert.equal(await evaluate("[...document.querySelectorAll('#lending-tools a')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})"), true, 'Every lending tool is visible at ' + width);
    await fill('loop-future', '800');
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    await navigate(base + 'lending.html#experiment');
    await click('loan-reset');
    assert.equal(await evaluate("document.getElementById('loan-future').getBoundingClientRect().bottom < innerHeight"), true, 'The first loan input stays on screen at ' + width);
    assert.match(await text('loan-boundary-distance'), /37.50% below/);
    await fill('loan-future', '1000');
    assert.match(await text('loan-boundary-distance'), /25.00% above/);

    await navigate(base + 'liquidity.html#scenario=cp50-v1&investment=5000&start=2000&future=4000&fees=100');
    for (const id of ['scenario-hold-value', 'scenario-lp-value']) {
      assert.equal(await evaluate(`(()=>{const el=document.getElementById('${id}');const range=document.createRange();range.selectNodeContents(el);const lines=[...range.getClientRects()];return lines.length===1&&el.scrollWidth<=el.clientWidth+1})()`), true, 'Currency stays whole at ' + width + ': ' + id);
    }
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    await fill('scenario-investment', '1000000000');
    assert.match(await text('scenario-hold-value'), /B/);
    assert.equal(await evaluate("document.getElementById('scenario-hold-value').title"), '$1,500,000,000.00');
    assert.equal(await evaluate("(()=>{const el=document.querySelector('#scenario-quick-gap .money-figure');const range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].length===1})()"), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    await navigate(base + 'liquidity.html#compare-widths');
    assert.equal(await evaluate("[...document.querySelectorAll('.width-result .width-token-key span span')].every(el=>{const range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].length===1})"), true, 'Token amounts stay whole at ' + width);
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    await navigate(base + 'liquidity.html#range-lab');
    await evaluate("document.getElementById('cl-setup-details').open = true");
    await evaluate("document.querySelector('[data-range-centered]').click()");
    assert.match(await text('cl-initial-eth-share'), /50.0% ETH/);
    assert.match(await text('cl-initial-usdc-share'), /50.0% USDC/);
    const bounds = await evaluate("[Number(document.getElementById('cl-lower').value),Number(document.getElementById('cl-upper').value),Number(document.getElementById('cl-start').value)]");
    assert.ok(Math.abs(bounds[0] * bounds[1] / bounds[2] ** 2 - 1) < 1e-12);
    assert.equal(await evaluate("[...document.querySelectorAll('.cl-range-presets button')].every(el=>el.scrollWidth <= el.clientWidth + 1)"), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
  }
  console.log('PASS: visible mobile lending tools, explicit boundary distances, whole currency/token figures and centered 50/50 range presets at 390px/320px');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
}
