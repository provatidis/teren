import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LST_DEFAULTS } from '../../public/models/lst-loop-v2.js';
import { LST_DEFAULTS as LEGACY_DEFAULTS } from '../../public/models/lst-loop-v1.js';
import { lstHash, readLSTHash } from '../../public/lib/lst-links.js';
import { dragRangeToMax } from './touch-range.js';

export async function checkLSTComparison({ evaluate, click, fill, text, navigate, reload, base, call, downloadFile }) {
  await navigate(base + 'lending.html#lst-loops');
  const keys = ['teren-lst-loop-draft-v1', 'teren-experiment-location-v1', 'degenerator-experiments-v1', 'teren-loop-draft-v1'];
  const saved = await evaluate(`${JSON.stringify(keys)}.map(key=>[key,localStorage.getItem(key)])`);
  const draft = () => evaluate("JSON.parse(localStorage.getItem('teren-lst-loop-draft-v1'))");
  const value = id => evaluate(`document.getElementById(${JSON.stringify(id)}).value`);
  const card = kind => evaluate(`(()=>{const el=document.querySelector('[data-lst-comparison="${kind}"]');return el?{state:el.dataset.state,counterfactual:el.dataset.counterfactual,exitStatus:el.dataset.exitStatus,fields:Object.fromEntries([...el.querySelectorAll('[data-comparison-field]')].map(field=>[field.dataset.comparisonField,field.textContent]))}:null})()`);
  const pairLink = (input = LST_DEFAULTS, targetExposure = 2, view = 'hold') => base + 'lending.html' + lstHash(input, view, { targetExposure });
  const keyboard = async (key, code, keyCode) => {
    for (const type of ['keyDown', 'keyUp']) await call('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: keyCode });
  };
  try {
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await click('lst-reset'); await click('lst-view-hold');
    assert.equal(await evaluate("document.getElementById('lst-compare-toggle').checked"), false);
    assert.equal(await card('primary'), null, 'A standalone setup does not silently acquire a reference.');
    await click('lst-compare-toggle'); await fill('lst-reference-target', '2');
    const primary = await card('primary'), reference = await card('reference');
    const originalInput = (await draft()).input;
    assert.equal(primary.state, 'ready'); assert.equal(reference.state, 'ready');
    assert.notEqual(primary.fields['before-exit'], reference.fields['before-exit']);
    await fill('lst-reference-target', '5');
    assert.deepEqual(await card('primary'), primary, 'Editing the reference cannot alter the main setup or its outcomes.');
    assert.deepEqual((await draft()).input, originalInput);
    assert.deepEqual((await draft()).comparison, { targetExposure: 5 });
    await fill('lst-reference-target', '3');
    assert.deepEqual((await card('primary')).fields, (await card('reference')).fields, 'Equal targets have equal balances, risk and exits.');
    await navigate(pairLink({ ...LST_DEFAULTS, targetExposure: 2 }, 3));
    assert.deepEqual((await card('primary')).fields, reference.fields, 'Swapping target sizes swaps outcomes without changing the benchmark.');
    assert.deepEqual((await card('reference')).fields, primary.fields);

    await navigate(pairLink(LST_DEFAULTS, 5));
    const healthy = [await card('primary'), await card('reference')];
    await fill('lst-discount-input', '10');
    const discounted = [await card('primary'), await card('reference')];
    for (let i = 0; i < 2; i++) {
      assert.equal(discounted[i].fields.health, healthy[i].fields.health, 'Conversion-rate valuation ignores a sale discount for loan health.');
      assert.notEqual(discounted[i].fields['before-exit'], healthy[i].fields['before-exit'], 'Both setups still lose market value.');
    }
    await fill('lst-oracleMode', 'market');
    for (const [i, kind] of ['primary', 'reference'].entries()) {
      assert.ok(Number((await card(kind)).fields.health) < Number(discounted[i].fields.health), 'Market-oracle health falls for both setups.');
    }
    await fill('lst-days-input', '180.25'); await fill('lst-stakingAPY', '4');
    const updated = await draft();
    assert.equal(updated.input.days, 180.25); assert.equal(updated.input.stakingAPY, 4);
    assert.deepEqual(updated.comparison, { targetExposure: 5 }, 'All other assumptions remain shared rather than copied into a second model input.');
    assert.notEqual((await card('reference')).fields['before-exit'], discounted[1].fields['before-exit']);
    await click('lst-view-exit'); await click('lst-exit-wsteth'); await click('lst-view-hold');
    for (const kind of ['primary', 'reference']) {
      assert.match((await card(kind)).fields['exit-value'], / wstETH$/);
      assert.match((await card(kind)).fields['exit-difference'], / wstETH$/);
    }
    await click('lst-view-exit'); await click('lst-exit-weth'); await click('lst-view-hold');
    for (const kind of ['primary', 'reference']) assert.match((await card(kind)).fields['exit-value'], / WETH$/);
    console.log('PASS: live LST comparisons keep the original setup, share conditions, agree at equal targets and distinguish oracle health from sale value');

    const recovered = { ...LST_DEFAULTS, days: 730, stakingAPY: 20, borrowAPR: 100, rateChange: true, laterAPR: 0, changeDay: 90 };
    await navigate(pairLink(recovered, 5));
    const recoveredReference = await card('reference');
    assert.ok(Number(recoveredReference.fields.health) > 1, 'This fixture recovers above the boundary at the endpoint.');
    assert.match(recoveredReference.fields['before-exit'], /^\+/);
    assert.equal(recoveredReference.counterfactual, 'true');
    assert.equal(recoveredReference.exitStatus, 'boundary');
    assert.match(recoveredReference.fields['earlier-boundary'], /day.*no liquidation/i);
    assert.equal(recoveredReference.fields['exit-value'], 'Exit not run');
    assert.equal(recoveredReference.fields['exit-difference'], 'Unavailable');
    assert.equal((await card('primary')).exitStatus, 'complete');
    assert.equal(await evaluate("(()=>{const card=document.querySelector('[data-lst-comparison=reference]');const amount=card.querySelector('[data-comparison-field=before-exit]');return getComputedStyle(amount).color===getComputedStyle(card).color&&!card.querySelector('.gain,.positive,.success')})()"), true, 'A positive counterfactual is not styled as a successful realized return.');
    await navigate(pairLink({ ...LST_DEFAULTS, exitAvailable: false }, 2));
    for (const kind of ['primary', 'reference']) {
      assert.equal((await card(kind)).exitStatus, 'unavailable');
      assert.equal((await card(kind)).fields['exit-value'], 'Exit not run');
    }
    await navigate(pairLink(LST_DEFAULTS, 50));
    assert.equal((await card('primary')).state, 'ready');
    assert.equal((await card('reference')).state, 'unavailable');
    assert.match((await card('reference')).fields.unavailable, /maximum LTV/);
    assert.equal(await value('lst-reference-target'), '50', 'An infeasible reference is not silently reduced.');
    assert.deepEqual((await draft()).comparison, { targetExposure: 50 });
    assert.equal(await evaluate("document.getElementById('lst-share').disabled"), false, 'A declared but infeasible reference can still be reproduced.');

    await navigate(pairLink());
    const valid = await draft(), validHash = await evaluate('location.hash'), mainNet = await text('lst-net');
    for (const invalid of ['', '0', '51']) {
      await fill('lst-reference-target', invalid);
      assert.equal(await evaluate("document.getElementById('lst-reference-target').getAttribute('aria-invalid')"), 'true');
      assert.ok((await text('lst-reference-target-error')).length > 0);
      assert.equal(await evaluate("document.getElementById('lst-share').disabled&&document.getElementById('lst-save').disabled"), true);
      assert.deepEqual(await draft(), valid); assert.equal(await evaluate('location.hash'), validHash);
      assert.equal(await text('lst-net'), mainNet, 'An invalid reference does not erase the valid main setup.');
      assert.equal(await evaluate("document.getElementById('lst-hold-results').hidden"), false);
    }
    await click('lst-view-exit');
    assert.equal(await evaluate("document.getElementById('lst-invalid').hidden"), false, 'An invalid reference remains discoverable outside Hold.');
    await click('lst-fix');
    assert.equal(await evaluate('document.activeElement.id'), 'lst-reference-target');
    assert.equal(await evaluate("document.getElementById('lst-hold').hidden"), false);
    assert.deepEqual(await draft(), valid); assert.equal(await evaluate('location.hash'), validHash);
    await fill('lst-reference-target', '2.123456');
    assert.equal(await evaluate("document.getElementById('lst-share').disabled||document.getElementById('lst-save').disabled"), false);
    assert.deepEqual((await draft()).comparison, { targetExposure: 2.123456 });
    await reload(); assert.equal(await value('lst-reference-target'), '2.123456');
    await click('lst-reset');
    assert.equal(await evaluate("document.getElementById('lst-compare-toggle').checked"), false);
    assert.equal((await draft()).comparison, undefined);
    await navigate(base + 'lending.html' + lstHash({ ...LEGACY_DEFAULTS, rounds: 2 }, 'hold'));
    assert.equal(await value('lst-buildMode'), 'rounds');
    assert.equal(await value('lst-rounds'), '2');
    assert.equal(await evaluate("document.getElementById('lst-compare-toggle').disabled"), true);
    assert.equal((await draft()).comparison, undefined);
    await click('lst-comparison-build');
    assert.equal(await evaluate('document.activeElement.id'), 'lst-buildMode');
    assert.equal(await value('lst-buildMode'), 'rounds', 'Reviewing the build does not reinterpret existing rounds as a target.');
    console.log('PASS: earlier boundaries and unavailable references remain explicit; invalid reference edits preserve the valid draft, link and original setup');

    await navigate(pairLink({ ...LST_DEFAULTS, rateChange: true, laterAPR: 8, changeDay: 90 }));
    assert.equal(await text('lst-average-apr'), '6.52%');
    assert.equal(await evaluate("document.getElementById('lst-borrowAPR').closest('.lst-fields').nextElementSibling.id"), 'lst-carry-threshold', 'Break-even is beside the rate being edited.');
    await fill('lst-borrowAPR', '');
    assert.equal(await evaluate("document.getElementById('lst-carry-threshold').hidden"), true);
    await fill('lst-borrowAPR', '2');
    assert.equal(await evaluate("document.getElementById('lst-carry-threshold').hidden"), false);
    await click('lst-check-exit');
    assert.equal(await evaluate("document.getElementById('lst-view-exit').getAttribute('aria-pressed')"), 'true');

    const savedInput = { ...LST_DEFAULTS, targetExposure: 3.123456, days: 90.25, exitMode: 'wsteth' };
    await navigate(pairLink(savedInput, 2.123456));
    await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}})");
    await click('lst-share');
    const shared = await value('lst-share-url'), parsed = readLSTHash(new URL(shared).hash);
    assert.deepEqual(parsed.input, savedInput); assert.deepEqual(parsed.comparison, { targetExposure: 2.123456 });
    await click('lst-save'); await fill('experiment-name', 'Shared-condition LST pair'); await click('experiment-save-confirm');
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const entry = await evaluate("JSON.parse(localStorage.getItem('degenerator-experiments-v1')).experiments.find(e=>e.name==='Shared-condition LST pair')");
    assert.deepEqual(entry.inputs, savedInput); assert.deepEqual(entry.comparison, parsed.comparison);
    if (downloadFile) {
      await evaluate("document.getElementById('saved-experiments').open=true");
      const exported = JSON.parse(await readFile(await downloadFile('experiments-export'), 'utf8'));
      assert.deepEqual(exported.experiments.find(item=>item.id===entry.id).comparison, parsed.comparison);
    }
    await fill('lst-reference-target', '4');
    await navigate(base + 'liquidity.html#saved=' + entry.id);
    assert.equal(await value('lst-targetExposure'), '3.123456'); assert.equal(await value('lst-reference-target'), '2.123456');
    assert.equal(await value('lst-exitMode'), 'wsteth');
    await reload(); assert.deepEqual((await draft()).comparison, parsed.comparison);
    await navigate(base);
    const resume = await evaluate("document.getElementById('home-experiment').href");
    assert.deepEqual(readLSTHash(new URL(resume).hash).comparison, parsed.comparison);
    await navigate(resume);
    assert.equal((await card('reference')).state, 'ready');
    assert.deepEqual((await draft()).input, savedInput);
    assert.equal(await evaluate("localStorage.getItem('teren-loop-draft-v1')"), saved.find(([key])=>key==='teren-loop-draft-v1')[1]);
    console.log('PASS: average-rate guidance, both exit units, exact pair links, named saves, exports, cross-topic opening and Home resumption');

    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await navigate(base + 'lending.html' + lstHash(LST_DEFAULTS, 'hold'));
      await evaluate("document.getElementById('lst-compare-toggle').focus()");
      await keyboard(' ', 'Space', 32);
      assert.equal(await evaluate('document.activeElement.id'), 'lst-reference-target');
      assert.equal(await evaluate("document.getElementById('lst-compare-toggle').checked"), true);
      await fill('lst-reference-target', '2.123456');
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Comparison fits the phone viewport.');
      assert.equal(await text('lst-carry-value'), (await card('primary')).fields['before-exit']);
      assert.equal(await text('lst-reference-carry-value'), (await card('reference')).fields['before-exit']);
      assert.equal(await text('lst-carry-health'), (await card('primary')).fields.health);
      assert.equal(await text('lst-reference-carry-health'), (await card('reference')).fields.health);
      assert.equal(await evaluate("document.getElementById('lst-reference-preview').hidden"), false, 'Both results are visible beside the mobile controls.');
      assert.notEqual(await text('lst-carry-label'), await text('lst-reference-carry-label'), 'The compact results distinguish the original setup and reference.');
      assert.ok(await evaluate("document.getElementById('lst-reference-target').getBoundingClientRect().height>=44"));
      assert.ok(await evaluate("document.querySelector('label[for=lst-reference-target]')&&document.getElementById('lst-reference-target').getAttribute('aria-describedby').includes('lst-reference-target-error')"));
      assert.ok(await evaluate("[...document.querySelectorAll('[data-lst-comparison]')].every(card=>card.getBoundingClientRect().width<=innerWidth)"));
      await fill('lst-reference-target', '');
      assert.equal(await evaluate("document.getElementById('lst-reference-target-error').hidden"), false);
      await fill('lst-reference-target', '2.123456');
      assert.equal((await card('reference')).state, 'ready');
      await keyboard('Tab', 'Tab', 9);
      assert.equal(await evaluate('document.activeElement.id'), 'lst-days-input', 'Keyboard focus continues into the shared conditions.');
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      await fill('lst-reference-target', '50');
      assert.match(await text('lst-reference-carry-value'), /unavailable/i);
      assert.equal(await evaluate("document.getElementById('lst-reference-carry-health-row').hidden"), true);
      assert.equal(await text('lst-carry-value'), (await card('primary')).fields['before-exit']);
      await navigate(pairLink(recovered, 5));
      assert.equal(await evaluate("document.getElementById('lst-preview-warning').hidden"), false, 'A recovered endpoint must retain the earlier-boundary warning beside its mobile preview.');
      assert.match(await text('lst-preview-warning'), /boundary|liquidation/i);
      assert.equal((await card('reference')).counterfactual, 'true');
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      await click('lst-primary-details-summary');
      await evaluate("document.getElementById('lst-chart-details').open=true");
      assert.ok(await evaluate("(()=>{const svg=document.getElementById('lst-health-chart'), bounds=svg.getBoundingClientRect();return [...svg.querySelectorAll('.chart-label')].every(label=>{const r=label.getBoundingClientRect();return r.left>=bounds.left-.5&&r.right<=bounds.right+.5})})()"), 'Both chart endpoints remain fully readable in the narrower detail column.');
      await navigate(pairLink({ ...LST_DEFAULTS, oracleMode: 'market' }, 5));
      await dragRangeToMax({ evaluate, call, fill }, 'lst-discount');
      assert.equal((await draft()).input.discount, 50);
      assert.equal(await value('lst-discount-input'), '50');
      assert.equal((await card('primary')).counterfactual, 'true');
      assert.equal((await card('reference')).counterfactual, 'true');
      assert.equal(await evaluate("document.getElementById('lst-preview-warning').hidden"), false);
    }
    console.log('PASS: LST comparison keyboard operation, labelled exact targets, invalid-edit repair and 390px/320px layouts');
  } finally {
    await evaluate(`${JSON.stringify(saved)}.forEach(([key,value])=>value===null?localStorage.removeItem(key):localStorage.setItem(key,value))`);
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  }
}
