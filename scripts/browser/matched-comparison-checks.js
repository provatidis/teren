import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const wait = (evaluate, expression) => evaluate(`new Promise((resolve,reject)=>{const deadline=Date.now()+10000;const check=()=>{if(${expression})resolve();else if(Date.now()>deadline)reject(new Error(document.getElementById('comparison-status')?.textContent||'Comparison did not load'));else setTimeout(check,20)};check()})`);
const ready = evaluate => wait(evaluate, "!document.getElementById('fee-comparison').hidden&&!document.getElementById('comparison-result').hidden");
export async function checkMatchedComparison({ evaluate, click, fill, text, navigate, base, call, nextEvent, downloadFile }) {
  await navigate(base + 'liquidity.html#fee-comparison'); await ready(evaluate);
  assert.equal(await evaluate("document.getElementById('historical-case').hidden"), true);
  assert.equal(await evaluate("document.querySelectorAll('.matched-card').length"), 2);
  assert.match(await text('comparison-current'), /Day 7/);
  assert.equal(await evaluate("document.getElementById('nav-inspect').getAttribute('aria-current')"), 'page');
  const saved = await evaluate("['degenerator-learning-v1','teren-loop-learning-v1','teren-lending-learning-v1'].map(key=>localStorage.getItem(key))");
  await fill('comparison-day', '0');
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.matched-value')).every(item=>item.textContent==='0.000%')"));
  await evaluate("document.querySelector('#comparison-days button[data-day=\"4\"]').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.match(await text('comparison-current'), /Day 4/);
  const download = await downloadFile('comparison-export');
  const expected = JSON.parse(await readFile(new URL('../../public/examples/uniswap-v3-matched-week.json', import.meta.url), 'utf8'));
  assert.deepEqual(JSON.parse(await readFile(download, 'utf8')), expected);
  await evaluate("document.querySelector('[data-apply-comparison=narrower]').click()");
  assert.match(await text('cl-origin'), new RegExp(expected.records[0].record.id.replace('position-', '') + '.*' + expected.records[0].record.dailyBlocks[4]));
  assert.equal(await evaluate("document.getElementById('cl-fees').value"), '0');
  assert.equal(await evaluate("document.getElementById('cl-start').value===document.getElementById('cl-future').value"), true);
  await evaluate("location.hash='#fee-comparison'"); await ready(evaluate);
  assert.match(await text('comparison-current'), /Day 4/);
  assert.deepEqual(await evaluate("['degenerator-learning-v1','teren-loop-learning-v1','teren-lending-learning-v1'].map(key=>localStorage.getItem(key))"), saved);
  await evaluate("document.querySelector('#fee-comparison a[href=\"#historical-case=one-week\"]').click()");
  await wait(evaluate, "!document.getElementById('period-result').hidden&&document.getElementById('period-title').textContent.includes('1375090')");
  assert.equal(await evaluate("document.getElementById('fee-comparison').hidden&&!document.getElementById('historical-case').hidden"), true);

  await navigate(base + 'liquidity.html#experiment');
  await evaluate("{const original=window.fetch;let failed=false;window.fetch=async(url,options)=>{const response=await original(url,options);if(!failed&&String(url).endsWith('/uniswap-v3-matched-week.json')){failed=true;const body=await response.json();body.records.pop();return new Response(JSON.stringify(body));}return response;};}");
  await evaluate("location.hash='#fee-comparison'"); await wait(evaluate, "!document.getElementById('comparison-retry').hidden");
  assert.equal(await evaluate("document.getElementById('comparison-result').hidden&&document.getElementById('comparison-export').disabled"), true);
  await click('comparison-retry'); await ready(evaluate);
  console.log('PASS: matched week, keyboard day selection, complete evidence export, isolated handoff, restoration and invalid evidence recovery');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'liquidity.html#fee-comparison'); await ready(evaluate);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    assert.ok(await evaluate("Array.from(document.querySelectorAll('#comparison-days button')).every(button=>{const r=button.getBoundingClientRect();return r.height>=44&&r.width>=44})"));
    await evaluate("document.querySelector('.matched-active-days button[data-day=\"3\"]').click();document.querySelectorAll('.matched-card summary').forEach(item=>item.click())");
    assert.match(await text('comparison-current'), /Day 3/);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    await click('nav-experiment'); await wait(evaluate, "location.hash==='#experiment'&&scrollY<=1");
    await click('nav-inspect'); await wait(evaluate, "location.hash==='#inspect'&&scrollY<=1");
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  console.log('PASS: matched comparison at 390px/320px, controls, ledgers without overflow and primary navigation');
}
