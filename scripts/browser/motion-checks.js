import assert from 'node:assert/strict';
import { motionSettled, reduceMotion } from './motion-settled.js';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const bar = "document.querySelector('.benchmark-figure [data-benchmark=claim] .scene-token-fill')";
const duration = evaluate => evaluate(`getComputedStyle(${bar}).transitionDuration`);
const width = evaluate => evaluate(`${bar}.getBoundingClientRect().width`);
// Press a price shortcut and measure in the same task, before any time can pass.
const press = (evaluate, label) => evaluate(`(() => {
  const bar = ${bar}, before = bar.getBoundingClientRect().width;
  Array.from(document.querySelectorAll('.benchmark-scene .scene-shortcut')).find(button => button.textContent === ${JSON.stringify(label)}).click();
  const after = bar.getBoundingClientRect().width;
  return { before, after, eased: bar.getAnimations().map(animation => animation.transitionProperty) };
})()`);

// Bars ease after a button or keyboard step and follow a dragged slider
// directly. Reduced motion removes the easing; the final sizes never differ.
export async function checkMotion({ evaluate, navigate, base, call }) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'learn.html#lesson=loss-vs-profit');
  // Lesson 4's slider appears with its outcome. A played reveal owns the bars until the slider or a shortcut is used.
  if (!await evaluate("document.getElementById('benchmark-price').checkVisibility()")) await evaluate("document.getElementById('learn-reveal').click()");
  await motionSettled(evaluate);
  await press(evaluate, 'The question · $4,000');
  await motionSettled(evaluate);
  assert.match(await duration(evaluate), /^0\.28s/);
  const atQuestion = await width(evaluate);
  const eased = await press(evaluate, 'Start · $2,000');
  assert.ok(eased.eased.includes('width'), 'A preset eases the bar to its new value.');
  assert.ok(Math.abs(eased.after - eased.before) < 1 && Math.abs(eased.before - atQuestion) < 1, 'The bar starts from where it was.');
  await motionSettled(evaluate);
  const atStart = await width(evaluate);
  assert.ok(Math.abs(atStart - atQuestion) > 20, 'The two prices give visibly different bars.');

  // Pressing a slider marks the page until release; bars then track the thumb.
  await evaluate("document.getElementById('benchmark-price').scrollIntoView({block:'center'})"); await settle(evaluate);
  const box = await evaluate("(r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2, step: r.width / 4 }))(document.getElementById('benchmark-price').getBoundingClientRect())");
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

  await reduceMotion({ call, evaluate });
  try {
    assert.equal(await duration(evaluate), '0s');
    const reduced = await press(evaluate, 'Start · $2,000');
    assert.deepEqual(reduced.eased, []);
    assert.equal(reduced.after, atStart, 'Reduced motion reaches the same size at once.');
  } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
  console.log('PASS: bars ease after presets, follow a dragged slider directly and respect reduced motion');
}
