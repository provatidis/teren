import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LST_DEFAULTS, upgradeLST } from '../../public/models/lst-loop-v2.js';
import { LST_DEFAULTS as OLD_DEFAULTS } from '../../public/models/lst-loop-v1.js';
import { lstHash, readLSTHash } from '../../public/lib/lst-links.js';

export async function checkLSTTargets({ evaluate, click, fill, text, navigate, reload, base, call, downloadFile }) {
  await navigate(base + 'lending.html#lst-loops');
  const keys = ['teren-lst-loop-draft-v1', 'teren-experiment-location-v1', 'degenerator-experiments-v1'];
  const saved = await evaluate(`${JSON.stringify(keys)}.map(key=>[key,localStorage.getItem(key)])`);
  const draft = () => evaluate("JSON.parse(localStorage.getItem('teren-lst-loop-draft-v1'))");
  const value = id => evaluate(`document.getElementById('${id}').value`);
  const open = id => evaluate(`document.getElementById('${id}').open=true`);
  try {
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await click('lst-reset');
    assert.equal(await value('lst-buildMode'), 'target');
    assert.match(await text('lst-build-summary'), /3×.*15 wstETH.*12.018 WETH/);
    for (const title of ['Borrow temporarily to buy the target', 'Buy wstETH', 'Supply the purchased wstETH', 'Borrow against the completed collateral', 'Settle the build flash loan']) {
      await click('lst-build-scene-next'); assert.equal(await text('lst-build-scene-title'), title);
    }
    assert.match(await text('lst-build-scene'), /Temporary flash debt0 WETH/);
    await fill('lst-targetExposure', '3.456789');
    const before = await draft();
    await fill('lst-targetExposure', '50');
    assert.match(await text('lst-targetExposure-error'), /more debt than maximum LTV/);
    assert.equal(await evaluate("document.getElementById('lst-save').disabled"), true);
    assert.deepEqual(await draft(), before);
    await reload(); assert.equal(await value('lst-targetExposure'), '3.456789');
    await fill('lst-targetExposure', '');
    await fill('lst-buildMode', 'rounds');
    assert.equal(await evaluate("document.getElementById('lst-invalid').hidden"), true);
    await fill('lst-buildMode', 'target');
    await evaluate("document.querySelector('[data-lst-target=\"1\"]').click()");
    assert.match(await text('lst-build-summary'), /5 wstETH.*0 WETH/);
    assert.match(await text('lst-build-summary'), /No borrowing/);
    assert.equal(await evaluate("document.getElementById('lst-build-scene-next').disabled"), true);
    await click('lst-view-exit'); await click('lst-exit-wsteth'); await click('lst-exit-scene-next');
    assert.match(await text('lst-exit-scene'), /no loan to repay and no flash debt/);
    assert.match(await text('lst-exit-status'), /releases the collateral/);

    const old = { ...OLD_DEFAULTS, rounds: 2, oracleMode: 'market' };
    await navigate(base + 'lending.html' + lstHash(old, 'build'));
    assert.equal(await value('lst-buildMode'), 'rounds');
    assert.equal(await value('lst-rounds'), '2'); assert.equal(await value('lst-exitMode'), 'weth');
    assert.equal(await value('lst-oracleMode'), 'market');
    assert.deepEqual((await draft()).input, upgradeLST(old));
    console.log('PASS: exact LST targets, flash-build ledger, LTV validation, invalid-edit recovery and legacy scenario restoration');

    const example = { ...LST_DEFAULTS, collateral: 10, rate: 1, targetExposure: 2, days: 0,
      swapCost: 0, buildFlashFee: 0, exitCost: 20, flashFee: 5, gas: 1.5 };
    await navigate(base + 'lending.html' + lstHash(example, 'exit'));
    assert.equal(await text('lst-exit-weth-value'), '4 WETH');
    assert.equal(await text('lst-exit-wsteth-value'), '5 wstETH');
    const end = await text('lst-net');
    await click('lst-exit-wsteth');
    assert.equal(await evaluate('document.activeElement.id'), 'lst-exit-scene-title');
    assert.match(await text('lst-exit-scene-step'), /Keep wstETH/);
    for (const title of ['Take a temporary flash loan', 'Repay the original WETH debt', 'Release the collateral', 'Sell only what repayment needs', 'Keep the unsold wstETH']) {
      await click('lst-exit-scene-next'); assert.equal(await text('lst-exit-scene-title'), title);
    }
    assert.match(await text('lst-exit-scene'), /0 WETH \+ 5 wstETH/);
    assert.match(await text('lst-exit-outcome'), /15 wstETH/);
    assert.equal(await text('lst-net'), end);
    await reload(); assert.equal(await value('lst-exitMode'), 'wsteth');
    const link = await evaluate('location.href');
    assert.equal(readLSTHash(new URL(link).hash).input.exitMode, 'wsteth');
    await click('lst-save'); await fill('experiment-name', 'Target with retained wstETH'); await click('experiment-save-confirm');
    const entry = await evaluate("JSON.parse(localStorage.getItem('degenerator-experiments-v1')).experiments.find(e=>e.name==='Target with retained wstETH')");
    assert.equal(entry.model, 'lst-loop-v2'); assert.equal(entry.inputs.targetExposure, 2); assert.equal(entry.inputs.exitMode, 'wsteth');
    if (downloadFile) {
      await open('saved-experiments');
      const file = await downloadFile('experiments-export');
      const content = JSON.parse(await readFile(file, 'utf8'));
      assert.ok(content.experiments.some(e=>e.id===entry.id && e.inputs.exitMode==='wsteth'));
    }
    await navigate(base + 'liquidity.html#saved=' + entry.id);
    assert.equal(await value('lst-exitMode'), 'wsteth'); assert.equal(await value('lst-targetExposure'), '2');
    await navigate(base);
    assert.ok(await evaluate("!!document.querySelector('a[href*=\"lst-loop-v2\"][href*=\"exitMode=wsteth\"]')"));
    await navigate(link); await click('lst-exitAvailable');
    assert.equal(await text('lst-exit-wsteth-value'), 'Exit not run');
    assert.match(await text('lst-exit-comparison-note'), /Neither exit runs/);
    assert.match(await text('lst-exit-outcome'), /10 WETH/);
    await click('lst-exitAvailable'); await fill('lst-gas', '100');
    assert.match(await text('lst-exit-status'), /additional funding/);
    assert.equal(await text('lst-exit-scene-title'), 'Exit not run');
    console.log('PASS: both exit destinations, partial-sale ledger, unchanged position, costs, unavailable exits, named experiments, exports and Home resumption');

    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await navigate(base + 'lending.html' + lstHash(LST_DEFAULTS, 'build'));
      await fill('lst-targetExposure', '5');
      await open('lst-build-assumptions');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
      assert.ok(await evaluate("[...document.querySelectorAll('[data-lst-target]')].every(el=>el.getBoundingClientRect().height>=44)"));
      assert.ok(await evaluate("document.getElementById('lst-buildMode').getBoundingClientRect().height>=44"), 'Construction mode has a touch-sized control.');
      await click('lst-view-exit');
      await click('lst-exit-wsteth');
      assert.equal(await evaluate('document.activeElement.id'), 'lst-exit-scene-title');
      assert.ok(await evaluate("(()=>{const r=document.getElementById('lst-exit-scene-title').getBoundingClientRect();return r.top>=document.querySelector('.topbar').getBoundingClientRect().bottom&&r.bottom<innerHeight})()"), 'The chosen flow is brought below the sticky navigation.');
      if (width === 390) assert.ok(await evaluate("document.getElementById('lst-exit-scene-next').getBoundingClientRect().bottom<innerHeight"), 'The first next-step control is visible on the phone.');
      await click('lst-exit-scene-next');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
      assert.ok(await evaluate("['lst-exit-weth-value','lst-exit-wsteth-value'].every(id=>{const el=document.getElementById(id);const range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].length===1})"), 'Exit token amounts stay whole.');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await click('lst-exit-weth');
      assert.match(await text('lst-exit-scene-step'), /Exit to WETH/);
      await call('Emulation.setEmulatedMedia', { features: [] });
    }
    console.log('PASS: target controls and exit comparisons at 390px/320px, whole token figures, focus handoff and reduced-motion operation');
  } finally {
    await evaluate(`${JSON.stringify(saved)}.forEach(([key,value])=>value===null?localStorage.removeItem(key):localStorage.setItem(key,value))`);
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  }
}
