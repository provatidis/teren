import assert from 'node:assert/strict';
import { calculateWidthComparison, DEFAULT_WIDTHS } from '../../public/models/range-width.js';
import { widthHash } from '../../public/lib/width-links.js';
import { dragRangeToMax } from './touch-range.js';

const settle = evaluate => evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');

export async function checkWidthComparison({ evaluate, click, fill, text, navigate, reload, base, call }) {
  await navigate(base + 'liquidity.html#compare-widths');
  const ownKeys = ['teren-width-comparison-v1', 'teren-experiment-location-v1'];
  const retained = await evaluate(`${JSON.stringify(ownKeys)}.map(key=>[key,localStorage.getItem(key)])`);
  const unrelated = await evaluate("['degenerator-learning-v1','degenerator-experiments-v1','teren-loop-learning-v1'].map(key=>localStorage.getItem(key))");
  try {
    await click('width-reset');
    assert.equal(await evaluate("document.getElementById('width-workspace').hidden"), false);
    assert.equal(await evaluate("document.getElementById('nav-experiment').getAttribute('aria-current')"), 'page');
    assert.match(await text('width-holding'), /\$5,500.00/);
    assert.match(await text('width-takeaway'), /A is narrower/);
    await fill('width-b', '20');
    assert.match(await text('width-takeaway'), /widths are equal/);
    await fill('width-a', '100');
    assert.match(await text('width-takeaway'), /B is narrower/);
    const validDraft = await evaluate("localStorage.getItem('teren-width-comparison-v1')");
    await fill('width-a', '0');
    assert.equal(await evaluate("document.getElementById('width-results').hidden&&document.getElementById('width-share').disabled"), true);
    assert.equal(await evaluate("document.getElementById('width-a').getAttribute('aria-invalid')"), 'true');
    assert.equal(await evaluate("localStorage.getItem('teren-width-comparison-v1')"), validDraft);
    await fill('width-a', '12.345'); await fill('width-price', '2345.6789');
    await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}})");
    await click('width-share');
    const shared = await evaluate("document.getElementById('width-share-url').value");
    assert.equal(await evaluate('document.activeElement.id'), 'width-share-url');
    await navigate(base);
    assert.equal(await evaluate("document.getElementById('home-experiment').href"), shared);
    await navigate(shared);
    assert.equal(await evaluate("document.getElementById('width-a').value"), '12.345');
    assert.equal(await evaluate("document.getElementById('width-price').value"), '2345.6789');
    await reload();
    assert.equal(await evaluate("document.getElementById('width-price').value"), '2345.6789');

    const expected = calculateWidthComparison({ ...DEFAULT_WIDTHS, widthA: 12.345, widthB: 20, futurePrice: 2345.6789 });
    for (const range of expected.ranges) {
      await navigate(shared);
      await evaluate(`document.querySelector('[data-width-apply="${range.id}"]').click()`); await settle(evaluate);
      assert.equal(await evaluate('location.hash'), '#range-lab');
      for (const [id, value] of [['cl-lower', range.lowerPrice], ['cl-upper', range.upperPrice], ['cl-future', range.futurePrice], ['cl-fees', 0]]) {
        assert.equal(Number(await evaluate(`document.getElementById('${id}').value`)), value);
      }
      const history = await call('Page.getNavigationHistory');
      await call('Page.navigateToHistoryEntry', { entryId: history.entries[history.currentIndex - 1].id }); await settle(evaluate);
      assert.equal(await evaluate("document.getElementById('width-workspace').hidden"), false);
      assert.equal(await evaluate("document.getElementById('width-a').value"), '12.345');
    }
    await navigate(base + 'liquidity.html' + widthHash(DEFAULT_WIDTHS) + '&a=10');
    assert.match(await text('width-notice'), /repeated inputs.*default setup/);
    await navigate(base + 'liquidity.html#compare-widths');
    await evaluate("localStorage.setItem('teren-width-comparison-v1','{broken')"); await reload();
    assert.match(await text('width-notice'), /previous local comparison could not be read/);
    assert.equal(await evaluate("localStorage.getItem('teren-width-comparison-v1')"), '{broken');
    await click('width-reset');
    await evaluate("document.getElementById('width-price-slider').focus()");
    for (const [key, code] of [['Home', 36], ['End', 35]]) {
      await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code });
      await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code });
      assert.equal(await evaluate("document.getElementById('width-price-slider').value"), await evaluate("document.getElementById('width-price-slider')." + (key === 'Home' ? 'min' : 'max')));
    }
    assert.deepEqual(await evaluate("['degenerator-learning-v1','degenerator-experiments-v1','teren-loop-learning-v1'].map(key=>localStorage.getItem(key))"), unrelated);
    console.log('PASS: controlled widths, common basket, equal/reversed comparisons, invalid inputs, precise links, Home resume, isolated handoffs and draft recovery');

    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await navigate(base + 'liquidity.html' + widthHash(DEFAULT_WIDTHS));
      await dragRangeToMax({ evaluate, call, fill }, 'width-price-slider');
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      const cards = await evaluate("Array.from(document.querySelectorAll('.width-result')).map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}})");
      assert.ok(cards[1].top >= cards[0].bottom && cards.every(card => card.left >= 0 && card.right <= width),
        'Give each outcome the available phone width, without overlap or clipping.');
      await evaluate("document.querySelector('.width-edges summary').click();document.querySelector('#width-chart-details summary').click()"); await settle(evaluate);
      assert.ok(await evaluate("Array.from(document.querySelectorAll('#width-price-shortcuts button')).every(button=>button.getBoundingClientRect().height>=44)"));
      assert.ok(await evaluate("Array.from(document.querySelectorAll('#width-gap-chart .chart-label')).every(label=>parseFloat(getComputedStyle(label).fontSize)*label.ownerSVGElement.getBoundingClientRect().width/600>=11.9)"));
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      await evaluate("document.querySelector('[data-width-price=\"a-lower\"]').click()");
      assert.match(await text('width-cards'), /At the lower edge/);
      await click('nav-inspect'); await settle(evaluate);
      assert.equal(await evaluate("document.getElementById('width-workspace').hidden"), true);
      await click('nav-experiment'); await settle(evaluate);
      assert.equal(await evaluate('location.hash'), '#experiment');
    }
    console.log('PASS: width comparison at 390px/320px, stable native touch dragging, keyboard endpoints, readable charts and primary navigation');
  } finally {
    await evaluate(`${JSON.stringify(retained)}.forEach(([key,value])=>value===null?localStorage.removeItem(key):localStorage.setItem(key,value))`);
    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  }
}
