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
  const progressKey = 'degenerator-learning-liquidity-v1';
  await navigate(base + 'learn.html');
  const saved = await evaluate(`localStorage.getItem('${progressKey}')`);
  const documentTop = "(r => r.top + scrollY)(document.querySelector('.foundation-balances').getBoundingClientRect())";
  try {
    await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate(`localStorage.removeItem('${progressKey}')`);

    // Lesson 1: the question reveals the swap. The page lands, then the bars move.
    await navigate(base + 'learn.html#lesson=swap-impact');
    assert.equal(await evaluate("document.querySelector('.scene-player').dataset.stage"), '0');
    await evaluate("document.querySelector('.scene-prediction input[value=same]').click()");
    await evaluate("(b => scrollBy(0, b.bottom - innerHeight + 40))(document.getElementById('learn-reveal').getBoundingClientRect())");
    const before = await evaluate(documentTop);
    const reveal = await act(evaluate, "document.getElementById('learn-reveal').click()");
    assert.ok(reveal.bars.every(bar => bar && bar.from !== bar.to && bar.to === bar.final), 'The reveal plays each balance from the starting pool to the result.');
    assert.ok(reveal.bars.every(bar => bar.delay >= 300 && bar.duration >= 700), 'The swap waits for the page to land, then plays slowly enough to follow.');
    assert.equal(await evaluate(documentTop), before, 'The average line and the verdict appear without moving the bars.');
    assert.ok(reveal.top > 60 && reveal.top < 844 - 160, 'The bars are on the screen that the page lands on.');
    assert.match(await evaluate("document.getElementById('foundation-pool-eth').textContent"), /110\.00 ETH/, 'Values are final at once.');
    await motionSettled(evaluate);

    // Replay plays the change again from where it started, with the bars in view.
    const replayAt = await evaluate("(() => { const button = document.getElementById('foundation-replay'); button.scrollIntoView({block:'start',behavior:'instant'}); scrollBy(0, -40); return document.querySelector('.foundation-balances').getBoundingClientRect().bottom; })()");
    assert.ok(replayAt < 70, 'Set-up: the bars start above the screen.');
    const replay = await act(evaluate, "document.getElementById('foundation-replay').click()");
    assert.deepEqual(replay.bars.map(bar => [bar.from, bar.to, bar.delay]), reveal.bars.map(bar => [bar.from, bar.to, 0]), 'Replay plays the same change from the starting pool, at once.');
    assert.ok(replay.top >= 60 && replay.top < 300, 'Replay brings the bars into view below the header.');
    assert.equal(await evaluate("document.getElementById('foundation-replay').getBoundingClientRect().bottom <= innerHeight"), true, 'Replay keeps its own button on screen.');
    await motionSettled(evaluate);
    // After exploring another size, Replay plays that size's swap.
    await evaluate("(slider => { slider.value = '36'; slider.dispatchEvent(new Event('input', { bubbles: true })); })(document.getElementById('foundation-amount'))");
    const explored = await act(evaluate, "document.getElementById('foundation-replay').click()");
    assert.ok(explored.bars.every((bar, i) => bar.from === reveal.bars[i].from && bar.to !== reveal.bars[i].to && bar.to === bar.final), 'Replay follows the explored trade size.');
    await motionSettled(evaluate);

    // Lesson 2: the revealed deposit grows the striped share; the later trade is a
    // pressed action, so it plays at once, and it does not push the bars.
    await navigate(base + 'learn.html#lesson=pool-share');
    const deposit = await evaluate(`(() => { document.getElementById('learn-reveal').click();
      return { owned: Array.from(document.querySelectorAll('.foundation-owned'), owned => owned.getAnimations().filter(item => !(item instanceof CSSTransition)).length), bars: ${playedBars} }; })()`);
    assert.deepEqual(deposit.owned, [1, 1], 'The striped share grows with the deposit.');
    assert.ok(deposit.bars.every(bar => bar && bar.from !== bar.to && bar.delay >= 300 && bar.duration >= 700), 'The revealed deposit waits for the page to land, then plays.');
    assert.equal(await evaluate("document.getElementById('foundation-average').hidden"), true, 'A deposit has no average line.');
    await motionSettled(evaluate);
    await evaluate("document.querySelector('.foundation-balances').scrollIntoView({block:'center',behavior:'instant'})"); await settle(evaluate);
    const steady = await evaluate("document.querySelector('.foundation-balances').getBoundingClientRect().top");
    const trade = await act(evaluate, "document.getElementById('foundation-later-show').click()");
    assert.ok(trade.bars.every((bar, i) => bar && bar.from === deposit.bars[i].to && bar.from !== bar.to && bar.delay === 0 && bar.duration >= 700), 'The later trade plays at once, from the pool after the deposit.');
    assert.equal(trade.top, steady, 'The trade changes the lines under the bars without pushing the bars.');
    await motionSettled(evaluate);

    await navigate(base + 'learn.html#lesson=swap-impact');
    await reduceMotion({ call, evaluate });
    const reduced = await act(evaluate, "document.getElementById('learn-reveal').click()");
    assert.deepEqual(reduced.bars, [null, null], 'Reduced motion shows the result at once.');
    await evaluate("document.getElementById('foundation-replay').click()");
    assert.equal(await evaluate("document.querySelector('.foundation-pool').getAnimations({subtree:true}).length"), 0);
  } finally {
    await call('Emulation.setEmulatedMedia', { features: [] });
    await evaluate(`${saved === null ? `localStorage.removeItem('${progressKey}')` : `localStorage.setItem('${progressKey}', ${JSON.stringify(saved)})`}`);
  }
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
