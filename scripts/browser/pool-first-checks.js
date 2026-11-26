import assert from 'node:assert/strict';
import { motionSettled, reduceMotion } from './motion-settled.js';

const shown = id => `document.querySelector(${JSON.stringify(id)})?.checkVisibility() ?? false`;
const box = selector => `(r => [r.top, r.bottom])(document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect())`;

// Liquidity lessons 1 and 2 put the pool first: the question sits under it and
// reveals the outcome with the pool on screen. Links from lesson 1's pilot still
// open it, and later lessons keep the question-first layout.
export async function checkPoolFirstLesson({ evaluate, navigate, base, call }) {
  const progressKey = 'degenerator-learning-liquidity-v1';
  await navigate(base + 'learn.html');
  const saved = await evaluate(`localStorage.getItem('${progressKey}')`);
  try {
    for (const [width, height] of [[390, 844], [320, 640]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await evaluate(`localStorage.removeItem('${progressKey}')`);
      await navigate(base + 'learn.html#lesson=swap-impact');
      const layout = await evaluate(`({
        poolFirst: document.getElementById('learn-essential').hasAttribute('data-pool-first'),
        route: document.getElementById('learn-route-note').hidden,
        order: Boolean(document.querySelector('.foundation-pool').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING),
        visible: ['#learn-setup', '#learn-level', '#learn-skill', '.scene-player', '#foundation-amount', '#learn-run', '.foundation-execution'].filter(id => document.querySelector(id)?.checkVisibility()),
        about: document.querySelector('.learn-about-example summary')?.textContent,
      })`);
      assert.deepEqual(layout, { poolFirst: true, route: true, order: true, visible: [], about: 'About this example' }, `${width}px: ` + JSON.stringify(layout));
      const arrive = await evaluate(`({ bars: ${box('.foundation-balances')}, pool: ${box('.foundation-pool')}, question: ${box('.scene-prediction-question')}, header: document.querySelector('.topbar').getBoundingClientRect().bottom, height: innerHeight })`);
      assert.ok(arrive.question[0] - arrive.pool[1] < 120, 'The question sits right under the pool: ' + JSON.stringify(arrive));
      if (width === 390) assert.ok(arrive.bars[0] >= arrive.header && arrive.bars[1] <= arrive.height, 'Arriving from a link shows the pool on the first screen: ' + JSON.stringify(arrive));

      // A learner scrolls to the button, then taps it. The swap plays where the pool is.
      await evaluate("document.querySelector('.scene-prediction input[value=same]').click()");
      await evaluate(`(b => scrollBy(0, b.bottom - innerHeight + 40))(document.getElementById('learn-reveal').getBoundingClientRect())`);
      const reveal = await evaluate(`(() => {
        document.getElementById('learn-reveal').click();
        const bars = document.querySelector('.foundation-balances').getBoundingClientRect(), header = document.querySelector('.topbar').getBoundingClientRect().bottom;
        const fills = [...document.querySelectorAll('.foundation-pool .scene-token-fill')].map(fill => fill.getAnimations().find(item => !(item instanceof CSSTransition))?.effect.getTiming().delay ?? null);
        const feedback = document.getElementById('learn-prediction-feedback');
        return { onScreen: bars.top >= header - 1 && bars.bottom <= innerHeight, fills, verdict: feedback.textContent,
          underPool: document.querySelector('.scene-player').previousElementSibling === document.querySelector('.foundation-pool') && document.querySelector('.scene-player').nextElementSibling === feedback };
      })()`);
      assert.ok(reveal.onScreen, `${width}px: the pool stays on screen while the swap plays.`);
      assert.deepEqual(reveal.fills, [400, 400], 'The revealed swap plays from the starting pool.');
      assert.match(reveal.verdict, /differs from your prediction/);
      assert.ok(reveal.underPool, 'Replay and the verdict sit right under the pool.');
      if (width === 390) assert.ok(await evaluate(`document.getElementById('learn-prediction-feedback').getBoundingClientRect().bottom <= innerHeight`), 'The verdict is on screen too.');
      for (const id of ['#foundation-replay', '#foundation-invite', '#foundation-amount', '#foundation-comparison']) assert.equal(await evaluate(shown(id)), true, id + ' appears once the swap has been shown.');
      assert.equal(await evaluate(shown('#learn-run')), false, 'There is no separate explanation button.');
      // With the slider near the top of the screen, the comparison it drives is on screen with it.
      const together = await evaluate(`(() => { document.getElementById('foundation-invite').scrollIntoView({ block: 'start', behavior: 'instant' });
        const slider = document.getElementById('foundation-amount').getBoundingClientRect(), last = document.getElementById('foundation-comparison-copy').getBoundingClientRect();
        return { slider: slider.top, sentence: last.bottom, height: innerHeight }; })()`);
      if (width === 390) assert.ok(together.slider > 0 && together.sentence <= together.height, 'The slider, the three bars and their sentence share one phone screen: ' + JSON.stringify(together));
      await motionSettled(evaluate);
    }

    // Links from the pilot still open the lesson. Other layout values are not routes.
    await navigate(base + 'learn.html#lesson=swap-impact&layout=play');
    assert.deepEqual(await evaluate("[document.getElementById('learn-route-note').hidden, document.getElementById('learn-essential').hasAttribute('data-pool-first')]"), [true, true]);
    await navigate(base + 'learn.html#lesson=swap-impact&layout=classic');
    assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), false);
    await navigate(base + 'learn.html#lesson=pool-share&layout=play');
    assert.equal(await evaluate("document.getElementById('learn-route-note').hidden"), false, 'Only lesson 1 accepts the pilot link.');
    // Lesson 2 follows the same layout, with its later trade beside the pool.
    for (const [width, height] of [[390, 844], [320, 640]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await evaluate(`localStorage.removeItem('${progressKey}')`);
      await navigate(base + 'learn.html#lesson=pool-share');
      const arrive = await evaluate(`({ poolFirst: document.getElementById('learn-essential').hasAttribute('data-pool-first'), setup: ${shown('#learn-setup')},
        bars: ${box('.foundation-balances')}, pool: ${box('.foundation-pool')}, question: ${box('.scene-prediction-question')}, header: document.querySelector('.topbar').getBoundingClientRect().bottom, height: innerHeight })`);
      assert.deepEqual([arrive.poolFirst, arrive.setup], [true, false]);
      assert.ok(arrive.question[0] - arrive.pool[1] < 120, 'The question sits right under the pool: ' + JSON.stringify(arrive));
      if (width === 390) assert.ok(arrive.bars[0] >= arrive.header && arrive.bars[1] <= arrive.height, 'Arriving from a link shows the pool on the first screen: ' + JSON.stringify(arrive));
      await evaluate(`(b => scrollBy(0, b.bottom - innerHeight + 40))(document.getElementById('learn-reveal').getBoundingClientRect())`);
      await evaluate("document.getElementById('learn-reveal').click()");
      assert.ok(await evaluate(`(bars => bars.top >= document.querySelector('.topbar').getBoundingClientRect().bottom - 1 && bars.bottom <= innerHeight)(document.querySelector('.foundation-balances').getBoundingClientRect())`), `${width}px: the pool stays on screen while the deposit plays.`);
      await motionSettled(evaluate);
      // The learner scrolls to the trade button and presses it. The pool is still there to watch.
      await evaluate(`(b => scrollBy(0, b.bottom - innerHeight + 60))(document.getElementById('foundation-later-show').getBoundingClientRect())`);
      const trade = await evaluate(`(() => { document.getElementById('foundation-later-show').click();
        const bars = document.querySelector('.foundation-balances').getBoundingClientRect(), claim = document.getElementById('foundation-claim').getBoundingClientRect();
        return { bars: bars.top >= document.querySelector('.topbar').getBoundingClientRect().bottom - 1 && bars.bottom <= innerHeight, claim: claim.bottom <= innerHeight, stage: document.querySelector('.scene-player').dataset.stage }; })()`);
      assert.deepEqual(trade, { bars: true, claim: true, stage: '2' }, `${width}px: the bars and the claim are on screen for the later trade.`);
      await motionSettled(evaluate);
      const together = await evaluate(`(() => { document.getElementById('foundation-invite').scrollIntoView({ block: 'start', behavior: 'instant' });
        return { slider: document.getElementById('foundation-amount').getBoundingClientRect().top, sentence: document.getElementById('foundation-ownership-copy').getBoundingClientRect().bottom, height: innerHeight }; })()`);
      if (width === 390) assert.ok(together.slider > 0 && together.sentence <= together.height, 'The slider, the two bars and their sentence share one phone screen: ' + JSON.stringify(together));
    }
    // Later lessons keep the question-first layout, their setup box and the pitfall in the results.
    await navigate(base + 'learn.html#lesson=token-balances');
    await evaluate("document.getElementById('learn-run').click()");
    assert.deepEqual(await evaluate(`({ poolFirst: document.getElementById('learn-essential').hasAttribute('data-pool-first'), setup: ${shown('#learn-setup')}, run: ${shown('#learn-run')},
      pitfall: document.getElementById('learn-pitfall').closest('#learn-results') !== null && (${shown('#learn-pitfall')}), title: document.getElementById('learn-check-title').textContent })`),
      { poolFirst: false, setup: true, run: true, pitfall: true, title: 'Explain the result and apply the idea' });

    await navigate(base + 'learn.html#lesson=swap-impact');
    await reduceMotion({ call, evaluate });
    await evaluate("document.getElementById('learn-reveal').click()");
    assert.equal(await evaluate("document.querySelector('.foundation-pool').getAnimations({subtree:true}).length"), 0, 'Reduced motion shows the result at once.');
  } finally {
    await call('Emulation.setEmulatedMedia', { features: [] });
    await evaluate(`${saved === null ? `localStorage.removeItem('${progressKey}')` : `localStorage.setItem('${progressKey}', ${JSON.stringify(saved)})`}`);
  }
  console.log('PASS: lessons 1 and 2 show the pool first, reveal in place at 390/320px and keep slider and comparison together; later lessons are unchanged');
}
