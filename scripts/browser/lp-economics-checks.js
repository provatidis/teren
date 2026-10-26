import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function checkLPEconomics({ evaluate, click, fill, text, navigate, reload, base, call, downloadFile }) {
  const mode = (prefix, value) => evaluate(`{const el=document.getElementById('${prefix}-fee-mode');el.value='${value}';el.dispatchEvent(new Event('change',{bubbles:true}));}`);
  const value = id => evaluate(`document.getElementById('${id}').value`);
  for (const width of [1440, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 950, deviceScaleFactor: 1, mobile: width < 750 });
    await navigate(base + 'liquidity.html#lp-lab'); await click('scenario-reset');
    await mode('scenario', 'apr'); await fill('scenario-investment', '10000');
    await fill('scenario-future', '8000'); await fill('scenario-fee-apr', '36.5'); await fill('scenario-fee-days', '100');
    await evaluate("document.getElementById('scenario-cost-details').open=true");
    await fill('scenario-opening-cost', '40'); await fill('scenario-collection-cost', '10'); await fill('scenario-closing-cost', '50');
    assert.equal(await text('scenario-lp-value'), '$20,900.00');
    assert.equal(await text('scenario-hold-value'), '$25,000.00');
    assert.equal(await text('scenario-break-even'), '$5,100.00');
    assert.match(await text('scenario-break-even-apr'), /186.15/);
    assert.match(await text('scenario-fee-basis'), /36.5.*100.*365/);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('#scenario-economics dd')].map(el=>el.textContent)"), ['$20,000.00', '$1,000.00', '$100.00', '$20,900.00', '$25,000.00']);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    await fill('scenario-fee-days', '');
    assert.equal(await evaluate("document.getElementById('scenario-share').disabled"), true);
    assert.match(await text('scenario-fee-days-error'), /greater than zero/);
    await mode('scenario', 'cash');
    assert.equal(await text('scenario-lp-value'), '$20,000.00');
    assert.match(await text('scenario-break-even-apr'), /Add a duration/);
    await fill('scenario-fee-days', '100'); await mode('scenario', 'apr');
    await click('scenario-share'); const shared = await value('scenario-share-url');
    assert.match(shared, /scenario=cp50-v2/); assert.match(shared, /openCost=40/);
    await navigate(shared);
    assert.equal(await text('scenario-lp-value'), '$20,900.00');
    assert.equal(await value('scenario-fee-mode'), 'apr');
    assert.equal(await value('scenario-fees'), '100', 'Inactive cash draft survives a share.');
    await click('scenario-save'); await fill('experiment-name', 'APR and costs ' + width); await click('experiment-save-confirm');
    const entry = await evaluate("JSON.parse(localStorage.getItem('degenerator-experiments-v1')).experiments[0]");
    assert.equal(entry.model, 'cp50-v2'); assert.equal(entry.inputs.collectionCost, 10);
    await navigate(base + 'learn.html#lesson=fee-break-even');
    // Capture the actual Learn handoff by following its link from the lab.
    await navigate(shared);
    await evaluate("document.querySelector('a[href=\"learn.html\"]').click()");
    await evaluate("new Promise(resolve=>setTimeout(resolve,100))");
    await navigate(base + 'liquidity.html');
    assert.equal(await value('scenario-fee-mode'), 'apr'); assert.equal(await value('scenario-closing-cost'), '50');
    if (width === 1440) {
      const path = await downloadFile('scenario-export');
      const csv = await readFile(path, 'utf8');
      assert.match(csv, /lp_after_fees_and_costs_usd/); assert.match(csv, /apr,100,36.5,100,40,10,50,additional_to_holding/);
      await click('scenario-image');
      await evaluate("new Promise((resolve,reject)=>{const until=Date.now()+5000;const poll=()=>{if(!document.getElementById('scenario-card-preview').hidden)resolve();else if(Date.now()>until)reject(new Error('Card missing'));else setTimeout(poll,20)};poll()})");
      const png = await readFile(await downloadFile('scenario-image-download'));
      assert.equal(png.readUInt32BE(20), 820);
    }
    await click('lab-range-tab'); await click('cl-reset');
    await evaluate("document.getElementById('cl-setup-details').open=true;document.getElementById('cl-fee-details').open=true;document.getElementById('cl-cost-details').open=true");
    await mode('cl', 'apr'); await fill('cl-fee-apr', '12'); await fill('cl-fee-days', '365');
    await fill('cl-opening-cost', '20'); await fill('cl-closing-cost', '30');
    await fill('cl-future', '4000'); await fill('cl-full-fees', '50');
    assert.match(await text('cl-fees-note'), /\$600.00.*\$50.00/);
    assert.match(await text('cl-full-note'), /\$50.00.*\$50.00/);
    await click('cl-share'); const rangeURL = await value('cl-share-url');
    assert.match(rangeURL, /scenario=cl-range-v2/); await navigate(rangeURL);
    assert.equal(await evaluate("document.getElementById('lab-range-tab').getAttribute('aria-selected')"), 'true');
    assert.equal(await value('cl-fee-apr'), '12'); assert.equal(await value('cl-closing-cost'), '30');
    await click('cl-match-fees'); assert.match(await text('cl-verdict'), /differ by less than half a cent/);
    await fill('cl-closing-cost', '100000');
    assert.match(await text('cl-value'), /\$-/);
    assert.equal(await evaluate("document.getElementById('cl-chart-range').getAttribute('d').includes('NaN')"), false);
    assert.equal(await evaluate("[...document.querySelectorAll('#cl-economics rect')].every(el=>Number(el.getAttribute('x'))>=0&&Number(el.getAttribute('width'))>=0)"), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    await fill('cl-opening-cost', '-1');
    assert.equal(await evaluate("document.getElementById('cl-share').disabled"), true);
    assert.match(await text('cl-opening-cost-error'), /Opening cost/);
  }
  await navigate(base + 'liquidity.html#scenario=cl-range-v1&investment=5000&start=2000&future=2100&fees=0&lower=1800&upper=2200&fullfees=0');
  assert.equal(await value('cl-opening-cost'), '0'); assert.equal(await value('cl-fee-days'), '');
  assert.equal(await value('cl-fee-mode'), 'cash');
  assert.match(await text('cl-break-even-apr'), /Add a duration/);
  await reload(); assert.equal(await value('cl-closing-cost'), '0');
  console.log('PASS: liquidity APR/costs on desktop, 390px and 320px; invalid inputs, versioned shares, saved drafts, net breakdown, negative results and actual CSV/PNG exports');
}
