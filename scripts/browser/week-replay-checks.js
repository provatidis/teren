import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRecordedCase, recordedPeriod } from '../../public/data/position-history.js';

const wait = (evaluate, condition) => evaluate('new Promise((resolve,reject)=>{const end=Date.now()+10000;const check=()=>{if(' + condition + ')resolve();else if(Date.now()>end)reject(new Error("Week replay check timed out"));else setTimeout(check,20)};check()})');
const ready = (evaluate, id = '1375090') => wait(evaluate, "document.getElementById('historical-case').getAttribute('aria-busy')==='false' && !document.getElementById('period-result').hidden && document.getElementById('period-title').textContent.includes(" + JSON.stringify(id) + ')');
const choose = (evaluate, id) => evaluate("{const select=document.getElementById('period-case');select.value=" + JSON.stringify(id) + ";select.dispatchEvent(new Event('change',{bubbles:true}));}");

export async function checkWeekReplay({ evaluate, click, fill, text, navigate, base, downloadFile, call }) {
  await navigate(base + 'liquidity.html#historical-case=one-week'); await ready(evaluate);
  const keys = ['defi-sandbox-v1', 'degenerator-learning-liquidity-v1', 'degenerator-experiments-v1', 'degenerator-pool-snapshot-v1', 'degenerator-v3-position-snapshot-v1'];
  const stored = await evaluate(JSON.stringify(keys) + '.map(key=>localStorage.getItem(key))');
  assert.equal(await text('period-week-capital'), '$140.75');
  assert.equal(await text('period-week-time'), '7d');
  assert.equal(await text('period-week-fees'), '$0.00');
  assert.match(await text('period-week-takeaway'), /Seven days passed without new fee tokens/);
  assert.equal(await text('period-lp'), '$133.80');
  assert.equal(await text('period-hold'), '$133.80');
  assert.equal(await text('period-fees'), '$0.00');
  assert.equal(await text('period-range-time'), '0.0%');
  assert.equal(await text('period-outside-time'), '7d');
  assert.match(await text('period-capital-change'), /starting value of \$140.75.*−\$6.96.*holding −\$6.96/);
  assert.match(await text('period-providers'), /eth\.drpc\.org.*rpc\.mevblocker\.io/);
  assert.equal(await evaluate("document.querySelectorAll('#period-milestones button').length"), 8);
  assert.equal(await evaluate("document.getElementById('period-checkpoint').max"), '7');
  await fill('period-checkpoint', '0');
  assert.equal(await text('period-lp'), '$140.75');
  assert.match(await text('period-outcome'), /equal at the start/);
  assert.equal(await text('period-week-time'), '7d', 'The week overview stays distinct from the selected checkpoint.');
  await evaluate("document.getElementById('period-checkpoint').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight' });
  assert.match(await text('period-current'), /Checkpoint 2 of 8.*2026-10-13/);
  assert.match(await text('period-interval-range'), /0s of 24h/);
  await evaluate("document.querySelector('#period-daily-details>summary').click()");
  assert.equal(await evaluate("document.querySelectorAll('#period-daily-rows tr').length"), 7);
  const days = await evaluate("Array.from(document.querySelectorAll('#period-daily-rows tr')).map(row=>row.textContent)");
  assert.ok(days.every(row => /\$0\.00.*0 WETH.*0 USDC.*0s/.test(row)));
  await evaluate("document.querySelector('#period-daily-rows button[data-index=\"3\"]').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.match(await text('period-current'), /Checkpoint 4 of 8.*2026-10-15/);
  assert.equal(await evaluate("document.activeElement.dataset.index"), '3', 'Selecting a day preserves keyboard focus.');
  assert.equal(await evaluate("document.querySelector('#period-daily-rows button[data-index=\"3\"]').getAttribute('aria-pressed')"), 'true');
  await evaluate("document.querySelector('#period-selection-details>summary').click()");
  assert.match(await text('period-selection-details'), /first eligible.*Small balances, inactivity and zero fees were allowed/s);
  const exported = validateRecordedCase(JSON.parse(await readFile(await downloadFile('period-export'), 'utf8')));
  assert.equal(exported.kind, 'fixed-position-history'); assert.equal(exported.segments.length, 7);
  assert.equal(recordedPeriod(exported).eventQueries.length, 105);
  assert.deepEqual(exported.validation.earnedRaw, ['0', '0']);
  await choose(evaluate, 'in-range'); await ready(evaluate, '1382030');
  assert.equal(await evaluate("document.getElementById('period-week-summary').hidden && document.getElementById('period-daily-details').hidden"), true);
  await choose(evaluate, 'one-week'); await ready(evaluate);
  assert.match(await text('period-current'), /Checkpoint 4 of 8/);
  await click('period-apply');
  assert.match(await text('cl-origin'), /1375090.*26194189/);
  assert.equal(await evaluate("document.getElementById('cl-fees').value"), '0');
  assert.equal(await evaluate("document.getElementById('cl-start').value === document.getElementById('cl-future').value"), true);
  assert.deepEqual(await evaluate(JSON.stringify(keys) + '.map(key=>localStorage.getItem(key))'), stored);
  console.log('PASS: complete week, daily keyboard exploration, dollar loss versus holding, full segment export and isolated principal-only handoff');

  await navigate(base + 'liquidity.html#historical-case'); await ready(evaluate, '1382030');
  await evaluate("{const original=window.fetch;let failed=false;window.fetch=async(url,options)=>{const response=await original(url,options);if(!failed&&String(url).endsWith('/uniswap-v3-position-week.json')){failed=true;const body=await response.json();body.segments.pop();return new Response(JSON.stringify(body));}return response;};}");
  await choose(evaluate, 'one-week'); await wait(evaluate, "!document.getElementById('period-retry').hidden");
  assert.equal(await evaluate("document.getElementById('period-result').hidden && document.getElementById('period-export').disabled && document.getElementById('period-apply').disabled"), true);
  await click('period-retry'); await ready(evaluate);
  await navigate(base + 'liquidity.html');
  console.log('PASS: incomplete week evidence hides results and disables handoffs; retry loads and validates the complete case');
}

export async function checkMobileWeekReplay({ evaluate, click, text, navigate, base, call }) {
  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'liquidity.html#historical-case=one-week'); await ready(evaluate);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    const controls = await evaluate("Array.from(document.querySelectorAll('#period-milestones button')).map(button=>({height:button.getBoundingClientRect().height,width:button.getBoundingClientRect().width}))");
    assert.ok(controls.every(button => button.height >= 44 && button.width >= 44));
    await evaluate("document.querySelector('#period-milestones button[data-index=\"6\"]').click();document.querySelector('#period-daily-details>summary').click();document.querySelector('#period-selection-details>summary').click()");
    assert.match(await text('period-current'), /Checkpoint 7 of 8/);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    assert.equal(await evaluate("document.querySelectorAll('#period-daily-rows tr').length"), 7);
    assert.ok(await evaluate("Array.from(document.querySelectorAll('#period-daily-rows button')).every(button=>button.getBoundingClientRect().height>=44)"));
    await click('nav-experiment'); await wait(evaluate, "location.hash==='#experiment'&&scrollY<=1");
  }
  console.log('PASS: daily week replay at 390px/320px, touch targets, disclosures without overflow and primary navigation');
}
