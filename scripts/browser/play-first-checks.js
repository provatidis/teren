import assert from 'node:assert/strict';
import { motionSettled, reduceMotion } from './motion-settled.js';

const pilot = 'learn.html#lesson=swap-impact&layout=play';
const shown = id => `document.querySelector(${JSON.stringify(id)})?.checkVisibility() ?? false`;
const box = selector => `(r => [r.top, r.bottom])(document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect())`;

// Pilot of the play-first layout on liquidity lesson 1. Only its own link opens
// it: the pool comes first, the question sits under it, and the swap plays with
// the pool on screen. The usual layout is unchanged everywhere else.
export async function checkPlayFirstPilot({ evaluate, navigate, base, call }) {
  const progressKey = 'degenerator-learning-liquidity-v1';
  await navigate(base + 'learn.html');
  const saved = await evaluate(`localStorage.getItem('${progressKey}')`);
  try {
    for (const [width, height] of [[390, 844], [320, 640]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await evaluate(`localStorage.removeItem('${progressKey}')`);
      await navigate(base + pilot);
      const layout = await evaluate(`({
        pilot: document.getElementById('learn-essential').hasAttribute('data-play-first'),
        route: document.getElementById('learn-route-note').hidden,
        poolFirst: Boolean(document.querySelector('.foundation-pool').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING),
        hidden: ['#learn-setup', '#learn-level', '#learn-skill', '.scene-player', '#foundation-amount', '#learn-run', '.foundation-execution'].filter(id => ${'document.querySelector(id)?.checkVisibility()'}),
        about: document.querySelector('.learn-about-example summary')?.textContent,
      })`);
      assert.deepEqual(layout, { pilot: true, route: true, poolFirst: true, hidden: [], about: 'About this example' }, `${width}px: ` + JSON.stringify(layout));
      const arrive = await evaluate(`({ bars: ${box('.foundation-balances')}, pool: ${box('.foundation-pool')}, question: ${box('.scene-prediction-question')}, header: document.querySelector('.topbar').getBoundingClientRect().bottom, height: innerHeight })`);
      assert.ok(arrive.question[0] - arrive.pool[1] < 120, 'The question sits right under the pool: ' + JSON.stringify(arrive));
      if (width === 390) assert.ok(arrive.bars[0] >= arrive.header && arrive.bars[1] <= arrive.height, 'Arriving from a link shows the pool on the first screen: ' + JSON.stringify(arrive));

      // A learner scrolls to the button, then taps it. The swap plays where the pool is.
      await evaluate("document.querySelector('.scene-prediction input[value=same]').click()");
      await evaluate(`(b => scrollBy(0, b.bottom - innerHeight + 40))(document.querySelector('.scene-prediction-show').getBoundingClientRect())`);
      const reveal = await evaluate(`(() => {
        document.querySelector('.scene-prediction-show').click();
        const bars = document.querySelector('.foundation-balances').getBoundingClientRect(), header = document.querySelector('.topbar').getBoundingClientRect().bottom;
        const fills = [...document.querySelectorAll('.foundation-pool .scene-token-fill')].map(fill => fill.getAnimations().find(item => !(item instanceof CSSTransition))?.effect.getTiming().delay ?? null);
        const feedback = document.getElementById('learn-prediction-feedback');
        return { onScreen: bars.top >= header - 1 && bars.bottom <= innerHeight, fills, verdict: feedback.textContent, underPool: document.querySelector('.foundation-pool').nextElementSibling === feedback };
      })()`);
      assert.ok(reveal.onScreen, `${width}px: the pool stays on screen while the swap plays.`);
      assert.deepEqual(reveal.fills, [400, 400], 'The revealed swap plays from the starting pool.');
      assert.match(reveal.verdict, /differs from your prediction/);
      assert.ok(reveal.underPool, 'The verdict sits right under the pool.');
      if (width === 390) assert.ok(await evaluate(`document.getElementById('learn-prediction-feedback').getBoundingClientRect().bottom <= innerHeight`), 'The verdict is on screen too.');
      for (const id of ['.scene-player', '#foundation-amount', '#learn-run']) assert.equal(await evaluate(shown(id)), true, id + ' appears once the swap has been shown.');
      await motionSettled(evaluate);
    }

    // The usual link, and every other lesson, keep the usual layout.
    await navigate(base + 'learn.html#lesson=swap-impact');
    assert.deepEqual(await evaluate(`({ pilot: document.getElementById('learn-essential').hasAttribute('data-play-first'), setup: ${shown('#learn-setup')},
      questionFirst: Boolean(document.querySelector('.scene-prediction').compareDocumentPosition(document.querySelector('.foundation-pool')) & Node.DOCUMENT_POSITION_FOLLOWING) })`),
      { pilot: false, setup: true, questionFirst: true });
    await navigate(base + 'learn.html#lesson=pool-share&layout=play');
    assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), false, 'Only lesson 1 has a pilot layout.');
    assert.equal(await evaluate("document.getElementById('learn-essential').hasAttribute('data-play-first')"), false);

    await navigate(base + pilot);
    await reduceMotion({ call, evaluate });
    await evaluate("document.querySelector('.scene-prediction-show').click()");
    assert.equal(await evaluate("document.querySelector('.foundation-pool').getAnimations({subtree:true}).length"), 0, 'Reduced motion shows the result at once.');
  } finally {
    await call('Emulation.setEmulatedMedia', { features: [] });
    await evaluate(`${saved === null ? `localStorage.removeItem('${progressKey}')` : `localStorage.setItem('${progressKey}', ${JSON.stringify(saved)})`}`);
  }
  console.log('PASS: play-first pilot shows the pool first, plays the swap in place at 390/320px, and leaves the usual layout alone');
}
