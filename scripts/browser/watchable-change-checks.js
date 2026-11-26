import assert from 'node:assert/strict';
import { motionSettled, reduceMotion } from './motion-settled.js';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const fills = ".foundation-pool .scene-token-fill";
// Read every played bar in the same task as the action, before any time passes.
const playedBars = `Array.from(document.querySelectorAll('${fills}'), fill => {
  const animation = fill.getAnimations().find(item => item instanceof CSSTransition === false);
  const frames = animation?.effect.getKeyframes() || [];
  return animation ? { from: frames[0].width, to: frames.at(-1).width, final: fill.style.width, delay: animation.effect.getTiming().delay, duration: animation.effect.getTiming().duration } : null;
})`;
const act = (evaluate, script) => evaluate(`(() => { ${script}; return { bars: ${playedBars}, top: document.querySelector('.foundation-balances').getBoundingClientRect().top, y: scrollY }; })()`);

// The learner can watch the swap: the page lands first, then the balances move
// from the starting pool to the result. Replay plays the same change again, and
// the bars keep their place when the result lines appear.
export async function checkFoundationMotion({ evaluate, navigate, base, call }) {
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate(base + 'learn.html#lesson=swap-impact');
  await evaluate("document.getElementById('learn-variation').click()");
  for (let i = 0; i < 3 && !(await evaluate("document.getElementById('learn-variation-label').textContent")).includes('1 of 3'); i++) await evaluate("document.getElementById('learn-variation').click()");
  assert.equal(await evaluate("document.querySelector('.scene-player').dataset.stage"), '0');
  assert.equal(await evaluate("document.getElementById('foundation-average').checkVisibility()"), true, 'The average line keeps its space before the swap.');
  assert.match(await evaluate("document.querySelector('.foundation-execution-pending').textContent"), /appears after the swap/);

  const shown = await act(evaluate, "document.getElementById('foundation-next').click()");
  assert.ok(shown.bars.every(bar => bar && bar.from !== bar.to && bar.to === bar.final), 'Showing the swap plays each balance from the starting pool to the result.');
  assert.ok(shown.bars.every(bar => bar.duration >= 700 && bar.delay === 0), 'A pressed action plays at once and slowly enough to follow.');
  assert.match(await evaluate("document.getElementById('foundation-pool-eth').textContent"), /110\.00 ETH/, 'Values are final at once.');
  await motionSettled(evaluate);

  // Stepping back and forward must not move the bars while they change.
  await evaluate("document.getElementById('foundation-previous').click()"); await motionSettled(evaluate);
  await evaluate("document.querySelector('.foundation-balances').scrollIntoView({block:'center',behavior:'instant'})"); await settle(evaluate);
  const before = await evaluate("document.querySelector('.foundation-balances').getBoundingClientRect().top");
  const forward = await act(evaluate, "document.getElementById('foundation-next').click()");
  assert.equal(forward.top, before, 'The average line appears without pushing the bars down.');
  await motionSettled(evaluate);

  // Replay plays the change again from where it started, with the bars in view.
  const replayAt = await evaluate("(() => { const button = document.getElementById('foundation-replay'); button.scrollIntoView({block:'start',behavior:'instant'}); scrollBy(0, -40); return document.querySelector('.foundation-balances').getBoundingClientRect().bottom; })()");
  assert.ok(replayAt < 70, 'Set-up: the bars start above the screen.');
  const replay = await act(evaluate, "document.getElementById('foundation-replay').click()");
  assert.deepEqual(replay.bars.map(bar => [bar.from, bar.to]), shown.bars.map(bar => [bar.from, bar.to]), 'Replay plays the same change from the starting pool.');
  assert.ok(replay.top >= 60 && replay.top < 300, 'Replay brings the bars into view below the header.');
  assert.equal(await evaluate("document.getElementById('foundation-replay').getBoundingClientRect().bottom <= innerHeight"), true, 'Replay keeps its own button on screen.');
  await motionSettled(evaluate);

  // The reveal lands on the outcome first; the swap starts once the eye can find it.
  await evaluate("document.getElementById('foundation-previous').click()"); await motionSettled(evaluate);
  await evaluate("document.querySelector('.scene-prediction input[value=same]').click()");
  const reveal = await act(evaluate, "document.querySelector('.scene-prediction-show').click()");
  assert.ok(reveal.bars.every(bar => bar && bar.delay >= 300 && bar.from !== bar.to), 'The revealed swap waits for the scroll to land, then plays.');
  assert.ok(reveal.top > 0 && reveal.top < 844 - 120, 'The revealed bars are on the screen that the page lands on.');
  assert.match(await evaluate("document.getElementById('learn-prediction-feedback').textContent"), /differs from your prediction/);
  await motionSettled(evaluate);

  // A deposit plays the same way and also grows the striped share.
  await navigate(base + 'learn.html#lesson=pool-share');
  const deposit = await evaluate(`(() => { document.getElementById('foundation-next').click();
    return Array.from(document.querySelectorAll('.foundation-owned'), owned => owned.getAnimations().filter(item => !(item instanceof CSSTransition)).length); })()`);
  assert.deepEqual(deposit, [1, 1], 'The striped share grows with the deposit.');
  assert.equal(await evaluate("document.getElementById('foundation-average').hidden"), true, 'A deposit has no average line.');
  await motionSettled(evaluate);

  await navigate(base + 'learn.html#lesson=swap-impact');
  await reduceMotion({ call, evaluate });
  try {
    await evaluate("document.getElementById('foundation-previous').click()");
    const reduced = await act(evaluate, "document.getElementById('foundation-next').click()");
    assert.deepEqual(reduced.bars, [null, null], 'Reduced motion shows the result at once.');
    await evaluate("document.getElementById('foundation-replay').click()");
    assert.equal(await evaluate("document.querySelector('.foundation-pool').getAnimations({subtree:true}).length"), 0);
  } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
  console.log('PASS: the swap plays after the page lands, bars hold their place, Replay plays start to end and reduced motion skips it');
}

// Presets, drags and chart taps put prices a person would type into the fields.
export async function checkRangePicks({ evaluate, navigate, base, call }) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'liquidity.html#scenario=cl-range-v2&investment=10000&start=3000&future=3600&fees=0&lower=2000&upper=4000&fullfees=0&feeMode=cash&feeAPR=0&days=30&openCost=0&collectCost=0&closeCost=0');
  const value = id => evaluate(`document.getElementById('${id}').value`);
  await evaluate("document.getElementById('cl-setup-details').open = true");
  await evaluate("document.querySelector('[data-range-width=\"0.1\"]').click()");
  assert.deepEqual([await value('cl-lower'), await value('cl-upper')], ['2700', '3300']);
  assert.equal(await evaluate("document.querySelector('[data-range-width=\"0.1\"]').getAttribute('aria-pressed')"), 'true');
  await evaluate("document.querySelector('[data-range-price=above]').click()");
  assert.equal(await value('cl-future'), '3960');
  const picked = await evaluate(`(() => {
    const chart = document.getElementById('cl-chart'), r = chart.getBoundingClientRect();
    chart.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width * 0.4, clientY: r.top + r.height / 2 }));
    const afterTap = document.getElementById('cl-future').value;
    const slider = document.getElementById('cl-explorer');
    slider.value = String(Number(slider.min) + (Number(slider.max) - Number(slider.min)) / 3);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    return [afterTap, document.getElementById('cl-future').value];
  })()`);
  for (const price of picked) assert.ok(Number.isInteger(Number(price)), `A picked price is a whole dollar on this scale: ${price}`);
  console.log('PASS: range presets, chart taps and slider drags write prices without floating-point noise');
}
