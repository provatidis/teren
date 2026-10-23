import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkLoanConsequences({ evaluate, click, fill, text, navigate, base, call }) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'lending.html#experiment');
  await click('loan-reset');
  await fill('loan-future', '1200');
  assert.equal(await evaluate("document.getElementById('loan-liquidation').open"), true);
  assert.equal(await text('loan-balances-title'), 'Balances before liquidation');
  assert.match(await text('loan-health-note'), /repay debt and take collateral plus a bonus/);
  assert.equal(await text('loan-net-assets'), '$6,000.00');
  assert.equal(await text('loan-liquidation-repaid'), '$2,500.00');
  assert.equal(await text('loan-liquidation-removed-value'), '$2,625.00 at the chosen price');
  assert.equal(await text('loan-liquidation-penalty'), '$125.00');
  assert.equal(await text('loan-liquidation-net'), '$5,875.00');
  assert.match(await text('loan-liquidation-health'), /1.08/);
  await fill('liquidation-repayPercent', '100');
  assert.equal(await text('loan-liquidation-debt'), '$0.00');
  await fill('liquidation-bonusPercent', '');
  assert.equal(await evaluate("document.getElementById('loan-liquidation-result').hidden"), true);
  assert.equal(await evaluate("document.getElementById('loan-outcomes').hidden"), false);
  assert.equal(await evaluate("document.getElementById('loan-share').disabled"), true);
  await fill('liquidation-bonusPercent', '8');
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}})");
  await click('loan-share');
  const shared = await evaluate("document.getElementById('loan-share-url').value");
  assert.match(shared, /single-liquidation-v1/);
  await navigate(shared);
  assert.equal(await evaluate("document.getElementById('liquidation-bonusPercent').value"), '8');
  assert.equal(await evaluate("document.getElementById('liquidation-repayPercent').value"), '100');
  await fill('loan-future', '300');
  assert.match(await text('loan-liquidation-status'), /All collateral.*debt remains unpaid/);
  assert.equal(await text('loan-liquidation-collateral'), '0 ETH');
  assert.equal(await text('loan-net-assets'), '$1,500.00');
  await fill('loan-future', '1250');
  assert.equal(await evaluate("document.getElementById('loan-liquidation-result').hidden"), true);
  assert.match(await text('loan-liquidation-status'), /not eligible for liquidation at this price/);
  await click('loan-reset');
  await fill('loan-borrowAPR', '100'); await fill('loan-days', '1825');
  assert.equal(await text('loan-simple-debt'), '$30,000.00');
  assert.equal(await text('loan-compound-debt'), '$742,065.80');
  assert.equal(await evaluate("document.getElementById('loan-interest-alert').hidden"), false);
  await click('loan-open-compounding');
  assert.equal(await evaluate("document.getElementById('loan-compounding').open"), true);
  await fill('loan-borrow', '0');
  assert.equal(await evaluate("document.getElementById('loan-chart-details').hidden"), true);
  assert.match(await text('loan-liquidation-status'), /no loan to liquidate/);

  for (const [width, height] of [[390, 844], [320, 740]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'lending.html#experiment');
    await click('loan-reset');
    await fill('loan-future', '1200');
    await evaluate("document.getElementById('loan-chart-details').open=true");
    await settle(evaluate);
    assert.equal(await text('loan-liquidation-net'), '$5,875.00');
    assert.match(await evaluate("document.getElementById('loan-health-chart').getAttribute('aria-label')"), /0.96/);
    assert.doesNotMatch(await evaluate("document.getElementById('loan-chart-line').getAttribute('d')"), /NaN|Infinity/);
    const fontSizes = await evaluate("(()=>{const svg=document.getElementById('loan-health-chart');return [...svg.querySelectorAll('.chart-label')].map(label=>parseFloat(getComputedStyle(label).fontSize)*svg.getBoundingClientRect().width/svg.viewBox.baseVal.width)})()");
    assert.ok(fontSizes.every(size => size >= 11.9), 'Health chart labels stay readable at ' + width);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
    await fill('liquidation-bonusPercent', '10');
    assert.equal(await text('loan-liquidation-penalty'), '$250.00');
    await navigate(base + 'lending.html#experiment');
    assert.equal(await evaluate("document.getElementById('liquidation-bonusPercent').value"), '10');
    await fill('loan-future', '300');
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
  }
  console.log('PASS: liquidation balance conservation, capped repayment, residual debt, explicit assumptions, compounding reference, shares, drafts and readable health chart at 390px/320px');
}
