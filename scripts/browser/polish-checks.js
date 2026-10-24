import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const waitForRecord = evaluate => evaluate(`new Promise((resolve, reject) => {
  const end = Date.now() + 10000;
  const check = () => {
    if (!document.getElementById('period-result').hidden) resolve();
    else if (Date.now() > end) reject(new Error(document.getElementById('period-status').textContent));
    else setTimeout(check, 20);
  };
  check();
})`);

export async function checkPolish({ evaluate, navigate, call, base }) {
  await navigate(base + 'liquidity.html#range-lab');
  const primaryValues = await evaluate("['cl-value','cl-hold-value'].map(id=>document.getElementById(id).textContent)");
  assert.equal(await evaluate("getComputedStyle(document.getElementById('cl-chart-full')).display"), 'none');
  for (const open of [true, false]) {
    await evaluate("document.querySelector('#cl-reference summary').click()");
    await settle(evaluate);
    assert.equal(await evaluate("document.getElementById('cl-reference').open"), open);
    assert.equal(await evaluate("getComputedStyle(document.getElementById('cl-chart-full')).display !== 'none'"), open);
    assert.equal(await evaluate("document.getElementById('cl-chart-title').textContent.includes('V2-style')"), open);
    assert.deepEqual(await evaluate("['cl-value','cl-hold-value'].map(id=>document.getElementById(id).textContent)"), primaryValues, 'Opening a reference must not change the experiment.');
  }
  for (const [fragment, body, input, price] of [
    ['lp-lab', 'scenario-comparisons', 'scenario-future', '1000'],
    ['range-lab', 'cl-comparisons', 'cl-future', '1440'],
  ]) {
    await navigate(base + 'liquidity.html#' + fragment);
    await evaluate(`document.getElementById('${fragment === 'lp-lab' ? 'scenario-reset' : 'cl-reset'}').click()`);
    if (fragment === 'range-lab') await evaluate("document.querySelector('#cl-comparison-card > summary').click()");
    await settle(evaluate);
    await evaluate(`document.querySelector('#${body} button').focus()`);
    assert.ok(await evaluate(`document.activeElement.matches('#${body} button')`), 'The comparison button is focused before activation.');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    assert.equal(await evaluate(`document.getElementById('${input}').value`), price);
    assert.ok(await evaluate(`document.activeElement.matches('#${body} .selected-scenario button')`), 'Selecting a price must retain keyboard focus.');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    assert.ok(await evaluate(`document.activeElement.matches('#${body} button')`), 'Tab must continue to the next comparison price.');
  }

  for (const [width, height] of [[390, 844], [320, 740]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    for (const [fragment, chart] of [['lp-lab', 'scenario-chart'], ['range-lab', 'cl-chart'], ['swap-sandbox', 'curve'], ['historical-case=range-return', 'period-chart']]) {
      await navigate(base + 'liquidity.html#' + fragment);
      if (chart === 'period-chart') await waitForRecord(evaluate);
      await settle(evaluate);
      const sizes = await evaluate(`(() => {
        const svg = document.getElementById('${chart}');
        return [...svg.querySelectorAll('.chart-label')].filter(label => label.textContent)
          .map(label => parseFloat(getComputedStyle(label).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width);
      })()`);
      assert.ok(sizes.length && sizes.every(size => size >= 11.9), 'Chart labels remain readable at ' + width + 'px: ' + chart);
      if (['scenario-chart', 'cl-chart'].includes(chart)) {
        const gap = await evaluate(`(() => {
          const svg = document.getElementById('${chart}');
          return svg.nextElementSibling.getBoundingClientRect().top - svg.querySelector('.chart-axis-title').getBoundingClientRect().bottom;
        })()`);
        assert.ok(gap >= 8, 'Larger axis labels must clear the explanation below the chart.');
      }
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
      if (chart === 'curve') {
        assert.ok(await evaluate("[...document.querySelectorAll('.stat strong')].every(element=>{const range=document.createRange();range.selectNodeContents(element);return range.getClientRects().length===1&&element.scrollWidth<=element.clientWidth})"), 'Sandbox amounts stay whole at ' + width + 'px.');
      }
    }
  }
  console.log('PASS: keyboard comparison continuity and readable chart labels across all four mobile workspaces');
}
