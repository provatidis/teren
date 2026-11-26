import assert from 'node:assert/strict';
import { motionSettled } from './motion-settled.js';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const bar = "document.querySelector('.comparison-scene [data-comparison=lp] .comparison-principal')";
const duration = evaluate => evaluate(`getComputedStyle(${bar}).transitionDuration`);
const width = evaluate => evaluate(`${bar}.getBoundingClientRect().width`);

// Bars ease after a button or keyboard step and follow a dragged slider
// directly. Reduced motion removes the easing; the final sizes never differ.
export async function checkMotion({ evaluate, navigate, base, call }) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'learn.html#lesson=loss-vs-profit');
  await evaluate("document.querySelector('#learn-prediction-field button, .scene-prediction button')?.click()");
  await evaluate("Array.from(document.querySelectorAll('.comparison-scene .scene-shortcut')).find(button => button.textContent === 'Question price').click()");
  await settle(evaluate);
  await motionSettled(evaluate);
  assert.match(await duration(evaluate), /^0\.28s/);
  const atQuestion = await width(evaluate);
  await evaluate("Array.from(document.querySelectorAll('.comparison-scene .scene-shortcut')).find(button => button.textContent === 'Starting price').click()");
  await settle(evaluate);
  const moving = await width(evaluate);
  assert.equal(await evaluate(`${bar}.getAnimations().length > 0`), true, 'A preset eases the bar to its new value.');
  await motionSettled(evaluate);
  const atStart = await width(evaluate);
  assert.ok(Math.abs(atStart - atQuestion) > 20, 'The two prices give visibly different bars.');
  assert.ok(Math.min(atStart, atQuestion) < moving && moving < Math.max(atStart, atQuestion), 'The bar passes through intermediate sizes.');

  // Pressing a slider marks the page until release; bars then track the thumb.
  await evaluate("document.getElementById('comparison-price').scrollIntoView({block:'center'})"); await settle(evaluate);
  const box = await evaluate("(r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2, step: r.width / 4 }))(document.getElementById('comparison-price').getBoundingClientRect())");
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  assert.equal(await evaluate('document.documentElement.dataset.scrubbing'), 'true');
  assert.equal(await duration(evaluate), '0s');
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + box.step, y: box.y, button: 'left', buttons: 1 });
  await settle(evaluate);
  const dragged = await width(evaluate);
  assert.equal(await evaluate(`${bar}.getAnimations().length`), 0, 'A dragged bar is not eased behind the thumb.');
  assert.ok(Math.abs(dragged - atStart) > 5, 'The drag changed the bar.');
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + box.step, y: box.y, button: 'left', clickCount: 1 });
  assert.equal(await evaluate("'scrubbing' in document.documentElement.dataset"), false);
  assert.match(await duration(evaluate), /^0\.28s/);
  assert.equal(await width(evaluate), dragged, 'Releasing the slider leaves the bar where the drag put it.');

  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  try {
    assert.equal(await duration(evaluate), '0s');
    await evaluate("Array.from(document.querySelectorAll('.comparison-scene .scene-shortcut')).find(button => button.textContent === 'Starting price').click()");
    assert.equal(await evaluate(`${bar}.getAnimations().length`), 0);
    assert.equal(await width(evaluate), atStart, 'Reduced motion reaches the same size at once.');
  } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
  console.log('PASS: bars ease after presets, follow a dragged slider directly and respect reduced motion');
}
