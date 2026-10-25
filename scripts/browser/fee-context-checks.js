import assert from 'node:assert/strict';

export async function checkFeeContext({ evaluate, click, fill, text, navigate, base, call, nextEvent }) {
  const open = prefix => evaluate(`document.querySelector('#${prefix}-fee-context > summary').click()`);
  const records = prefix => evaluate(`document.querySelector('#${prefix}-fee-context .fee-context-records > summary').click()`);
  const window = (prefix, days) => evaluate(`{const select=document.getElementById('${prefix}-fee-window');select.value='${days}';select.dispatchEvent(new Event('change',{bubbles:true}));}`);
  const wait = condition => evaluate(`new Promise((resolve,reject)=>{const until=Date.now()+10000;const check=()=>{if(${condition})resolve();else if(Date.now()>until)reject(new Error('Fee context did not settle'));else setTimeout(check,20)};check()})`);
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'liquidity.html#lp-lab');
  await click('scenario-reset'); await fill('scenario-future', '4000'); await fill('scenario-fees', '100');
  await evaluate("{const original=window.fetch;window.feeRecordRequests=0;window.failFeeRecord=true;window.fetch=(url,options)=>{if(String(url).includes('/examples/uniswap-v3-position-')){window.feeRecordRequests++;if(window.failFeeRecord)return Promise.resolve({ok:false});}return original(url,options)};}");
  const hash = await evaluate('location.hash');
  await open('scenario'); await window('scenario', 7);
  assert.match(await text('scenario-fee-target'), /\$428.93 in total/);
  assert.match(await text('scenario-fee-assumption'), /Gap still to cover: \$328.93/);
  assert.match(await text('scenario-fee-daily'), /\$61.28 per day/);
  assert.equal(await evaluate('window.feeRecordRequests'), 0, 'No record fetch until the separate disclosure opens.');
  assert.equal(await evaluate('location.hash'), hash);
  assert.equal(await evaluate("document.getElementById('scenario-fees').value"), '100');
  await records('scenario');
  await wait("!document.querySelector('#scenario-fee-context .fee-context-records button').hidden");
  assert.match(await text('scenario-fee-context'), /hypothetical comparison still works/);
  await fill('scenario-fees', '500');
  assert.match(await text('scenario-fee-assumption'), /Covers the model’s fee target/);
  await evaluate("window.failFeeRecord=false;document.querySelector('#scenario-fee-context .fee-context-records button').click()");
  await wait("document.querySelectorAll('#scenario-fee-context .fee-context-record').length===3");
  const body = await text('scenario-fee-context');
  const flows = await evaluate("Array.from(document.querySelectorAll('#scenario-fee-context .fee-record-flow')).map(flow=>Array.from(flow.children).map(step=>({label:step.querySelector('dt').textContent,value:step.querySelector('dd').textContent,detail:step.querySelector('.fee-record-detail').textContent})))");
  assert.deepEqual(flows[0].map(step=>step.label), ['Starting capital', 'Recorded time', 'New fees earned']);
  assert.deepEqual(flows[0].map(step=>step.value), ['$47,793.97', '1h 23m 12s', '$2.36']);
  assert.deepEqual(flows[1].map(step=>step.value), ['$5,022.44', '33h 27m 48s', '$0.45']);
  assert.deepEqual(flows[2].map(step=>step.value), ['$140.75', '7d', '$0.00']);
  assert.equal(flows[2][1].detail, '0.0% in range');
  assert.equal(flows[0][2].detail, '0.0049% of starting capital');
  assert.equal(flows[1][1].detail, '41.7% in range');
  assert.match(body, /not typical returns/);
  assert.equal(await evaluate("document.querySelector('#scenario-fee-context .fee-context-method p').checkVisibility()"), false);
  await evaluate("document.querySelector('#scenario-fee-context .fee-context-record .fee-context-method > summary').click()");
  assert.equal(await evaluate("document.querySelector('#scenario-fee-context .fee-context-method p').checkVisibility()"), true);
  assert.match(body, /2026-10-11.*2026-10-12/s);
  const target = await text('scenario-fee-target');
  await click('scenario-share');
  const share = await evaluate("document.getElementById('scenario-share-url').value");
  await window('scenario', 90); await click('scenario-share');
  assert.equal(await text('scenario-fee-target'), target);
  assert.equal(await evaluate("document.querySelector('#scenario-fee-context .fee-record-flow dd').textContent"), '$47,793.97');
  assert.match(await text('scenario-fee-context'), /More time lowers the daily hurdle/);
  assert.equal(await evaluate("document.getElementById('scenario-share-url').value"), share);
  console.log('PASS: fee hurdle, assumed gap, view-only duration, lazy records, recoverable fetch failure and exact recorded context');

  await click('lab-range-tab'); await click('cl-reset'); await open('cl');
  await window('cl', 1);
  assert.match(await text('cl-fee-daily'), /Over 1 day,/);
  await records('cl');
  await wait("document.querySelectorAll('#cl-fee-context .fee-context-record').length===3");
  assert.equal(await evaluate("Array.from(document.querySelectorAll('[id]')).map(x=>x.id).length===new Set(Array.from(document.querySelectorAll('[id]')).map(x=>x.id)).size"), true);
  for (const id of ['fee-break-even', 'final-challenge']) {
    await navigate(base + 'learn.html#lesson=' + id);
    const before = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
    const scope = await text('comparison-scope');
    await open('comparison'); await window('comparison', 1); await records('comparison');
    await wait("document.querySelectorAll('#comparison-fee-context .fee-context-record').length===3");
    assert.equal(await text('comparison-scope'), scope);
    assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), before);
    assert.equal(await evaluate("new URL(document.querySelector('#comparison-fee-context .fee-context-record a').href).pathname"), new URL(base + 'liquidity.html').pathname);
    assert.match(await evaluate("document.querySelector('#comparison-fee-context .fee-context-record a').hash"), /^#historical-case$/);
  }
  const loaded = nextEvent('Page.loadEventFired');
  await evaluate("document.querySelector('#comparison-fee-context .fee-context-record a').click()");
  await loaded;
  await wait("document.getElementById('period-result')&&!document.getElementById('period-result').hidden");
  assert.equal(await text('period-fees'), '$2.36');
  console.log('PASS: range and fee lessons share context without mutating questions or progress; lesson evidence links open Inspect');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'learn.html#lesson=fee-break-even'); await open('comparison'); await records('comparison');
    await wait("document.querySelectorAll('#comparison-fee-context .fee-context-record').length===3");
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    assert.equal(await evaluate("(()=>{const steps=document.querySelector('#comparison-fee-context .fee-record-flow').children;return steps[1].getBoundingClientRect().top>=steps[0].getBoundingClientRect().bottom})()"), true);
    assert.equal(await evaluate("document.getElementById('comparison-fee-window').labels.length"), 1);
    await evaluate("document.getElementById('comparison-fee-window').focus()");
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Home', code: 'Home', windowsVirtualKeyCode: 36 });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Home', code: 'Home', windowsVirtualKeyCode: 36 });
    assert.equal(await evaluate("document.getElementById('comparison-fee-window').value"), '1');
    assert.match(await text('comparison-fee-daily'), /Over 1 day,/);
    assert.equal(await evaluate("document.getElementById('comparison-fee-window').getBoundingClientRect().height>=44"), true);
  }
  console.log('PASS: fee context at 390px and 320px, labeled native keyboard selection, 44px control and no page overflow');
}
