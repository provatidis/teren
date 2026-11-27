import assert from 'node:assert/strict';
import { lessonSetup, runLesson } from '../../public/models/lesson-experiments.js';
import { usd } from '../../public/lib/format.js';
import { motionSettled, reduceMotion } from './motion-settled.js';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const figureText = "['fee-at', 'fee-hold', 'fee-claim', 'fee-claim-tokens', 'fee-earned', 'fee-against-gap'].map(id => document.getElementById(id).textContent)";

// Liquidity lesson 5 starts where lesson 4 ended: the price has moved and the
// claim trails holding. Fees are added to the claim, and the reader looks for
// the amount that closes the gap.
export async function checkFeeLesson({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="${group}"][value="${value}"]').click()`);
  const saved = () => evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  const reset = async () => {
    await click('learn-variation');
    for (let i = 0; i < 3 && !(await text('learn-variation-label')).includes('1 of 3'); i++) await click('learn-variation');
  };
  const gapBar = () => evaluate("document.querySelector('#fee-gap .scene-token-fill').style.width");
  const shownParts = "['#learn-run', '#learn-setup', '#learn-explanation', '#fee-amount', '#fee-invite', '#fee-outcome'].filter(id => document.querySelector(id)?.checkVisibility())";
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'learn.html#lesson=fee-break-even'); await reset();
  assert.equal(await evaluate("document.getElementById('learn-essential').hasAttribute('data-pool-first')"), true);
  assert.equal(await evaluate("Boolean(document.querySelector('.benchmark-figure').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true, 'The figure comes before its question.');
  assert.deepEqual(await evaluate(shownParts), [], 'Before the outcome there is one thing to do: answer or skip the question.');
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"),
    'ETH is at $4,000.00. Before any fees, your claim is $428.93 behind holding. Then it earns $100.00 in trading fees. Which bar grows?');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#learn-predictions label'), label => label.textContent.trim())"), ['Only my claim', 'Both bars', 'Neither. The fees go to whoever runs the pool.']);
  // The figure opens where lesson 4 ended, with no fees.
  assert.deepEqual(await evaluate(figureText), ['ETH at $4,000.00', '$7,500.00', '$7,071.07', '0.8839 ETH + 3,535.53 USDC', 'Gap covered: $0.00 of $428.93', 'Against holding: −$428.93']);
  assert.equal(await gapBar(), '0%');
  const start = await evaluate("document.querySelector('.benchmark-figure').outerHTML");
  const before = await saved();
  await click('learn-reveal');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'skipped');
  assert.deepEqual(await evaluate(shownParts), ['#fee-amount', '#fee-invite', '#fee-outcome']);
  assert.deepEqual(await evaluate(figureText), ['ETH at $4,000.00', '$7,500.00', '$7,171.07', '0.8839 ETH + 3,535.53 USDC + fees', 'Gap covered: $100.00 of $428.93', 'Against holding: −$328.93']);
  assert.match(await gapBar(), /^23\.3\d+%$/, 'The fees fill their share of the gap.');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.fee-scene .scene-shortcut'), button => [button.textContent, button.getAttribute('aria-pressed')])"),
    [['The question · $100', 'true'], ['Match holding', 'false']]);
  assert.match(await text('learn-prediction-feedback'), /Only your claim\. Traders pay fees into the pool, so your share of them is part of your claim\. \$100\.00 takes it from \$428\.93 behind holding to \$328\.93 behind\. Holding is tokens in a wallet: it earns no fees\./);
  assert.deepEqual(await evaluate("[document.querySelector('.scene-prediction').dataset.folded, document.querySelector('.scene-prediction-recap span').textContent]"), ['true', 'Your prediction for $100.00 in fees']);
  assert.equal(await text('fee-invite'), 'Now drag the fees. How much does your claim need to match holding?');
  assert.deepEqual(await evaluate(`(order => order.map((id, i) => i === 0 || Boolean(document.querySelector(order[i - 1]).compareDocumentPosition(document.querySelector(id)) & Node.DOCUMENT_POSITION_FOLLOWING)))(
    ['.benchmark-figure', '#fee-invite', '#fee-amount', '#learn-prediction-feedback', '.scene-prediction-recap', '#fee-outcome', '.learn-about-example'])`), Array(7).fill(true));
  assert.equal(await text('fee-copy'), 'Your claim needs $328.93 more in fees to match holding.');
  assert.match(await text('fee-why'), /break-even fees: \$428\.93 at this price, or 8\.58% of what you started with[\s\S]*how much trading it sees and for how long/);
  assert.deepEqual(await evaluate("['fee-why', 'comparison-fee-context', 'learn-pitfall'].map(id => document.getElementById(id).closest('#fee-outcome') !== null && document.getElementById(id).checkVisibility())"), [true, true, true]);
  assert.match(await text('learn-pitfall'), /Break-even fees are not an earnings forecast/);
  assert.notEqual(await saved(), before);
  const revealed = await saved();

  // Exploring: the shortcut lands exactly on the break-even fees; more than that puts the claim ahead.
  await evaluate("Array.from(document.querySelectorAll('.fee-scene .scene-shortcut')).find(button => button.textContent === 'Match holding').click()");
  assert.deepEqual(await evaluate(figureText), ['ETH at $4,000.00', '$7,500.00', '$7,500.00', '0.8839 ETH + 3,535.53 USDC + fees', 'Gap covered: $428.93 of $428.93', 'Against holding: $0.00']);
  assert.equal(await text('fee-copy'), 'Level with holding. $428.93 in fees closes the gap at this price.');
  assert.equal(await gapBar(), '100%');
  await fill('fee-amount', '500');
  assert.deepEqual([await text('fee-against-gap'), await text('fee-copy'), await gapBar()], ['Against holding: +$71.07', 'Your claim is $71.07 ahead of holding.', '100%']);
  await fill('fee-amount', '0');
  assert.equal(await evaluate("document.querySelector('.benchmark-figure').outerHTML"), start, 'No fees shows the starting figure again.');
  assert.equal(await evaluate("document.getElementById('fee-hold').textContent"), '$7,500.00', 'Holding never moves with fees.');
  assert.equal(await saved(), revealed, 'Exploration must not change the fixed question or progress.');
  assert.match(await text('learn-prediction-feedback'), /\$100\.00 takes it from/, 'The verdict stays with the question’s fees.');
  // A single arrow step that would cross the break-even amount stops on it.
  await fill('fee-amount', '427');
  await evaluate("document.getElementById('fee-amount').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  assert.equal(await text('fee-against-gap'), 'Against holding: $0.00', 'A keyboard step settles on the exact amount.');

  // The check questions.
  assert.equal(await text('learn-reason-question'), 'What do the break-even fees tell you?');
  const evidence = await text('learn-application-evidence');
  for (const phrase of ['Starting ETH price', '$2,000.00', 'fees covered the gap', '$4,000.00', 'Later ETH price', '$6,000.00']) assert.ok(evidence.includes(phrase));
  await fill('fee-amount', '250');
  assert.equal(await text('learn-application-evidence'), evidence, 'Exploring fees must not change the evidence beside the application.');
  await choose('learn-reason', 'compound'); await choose('learn-application', 'still-matches'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your answers.');
  assert.match(await text('learn-reasons-feedback'), /not a balance you can collect/);
  assert.match(await text('learn-applications-feedback'), /Matching holding at one price does not lock in that result/);
  await choose('learn-reason', 'assumption'); await choose('learn-application', 'gap-reopens'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  await evaluate("document.querySelector('.scene-prediction-recap button').click()");
  await choose('learn-prediction', 'toward-target');
  assert.match(await text('learn-prediction-feedback'), /^Your prediction matches/);
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.', 'A prediction chosen afterwards keeps the checked answers.');
  const link = await evaluate("document.getElementById('learn-explore').href");
  assert.match(link, /future=4000/); assert.match(link, /fees=100/);
  await reload();
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  assert.deepEqual([await evaluate("document.getElementById('fee-amount').value"), await text('fee-earned'), await evaluate("document.querySelector('input[name=learn-prediction]:checked').value")],
    ['100', 'Gap covered: $100.00 of $428.93', 'toward-target'], 'A restored lesson shows its outcome and the slider at the question’s fees.');

  // Every variation shows the model's own values. In the third, the question's fees pass the gap.
  for (let variant = 0; variant < 3; variant++) {
    if (variant) { await click('learn-variation'); await click('learn-reveal'); }
    const { result, setup } = runLesson('fee-break-even', lessonSetup('fee-break-even', variant), variant);
    assert.deepEqual([await text('fee-hold'), await text('fee-claim'), await text('fee-earned')], [usd(result.holdValue), usd(result.lpValue), 'Gap covered: ' + usd(setup.fees) + ' of ' + usd(result.breakEvenFees)]);
    assert.match(await text('learn-prediction-feedback'), variant === 2 ? /to \$98\.47 ahead\./ : /behind\. Holding is tokens/);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
  }
  console.log('PASS: lesson 5 opens on the gap to holding, adds fees to the claim alone, lands exactly on the break-even fees, keeps exploration apart from the question and restores completion');

  const progressKey = 'degenerator-learning-liquidity-v1';
  const kept = await saved();
  try {
    for (const [width, height] of [[390, 844], [320, 640]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await evaluate(`localStorage.removeItem('${progressKey}')`);
      await navigate(base + 'learn.html#lesson=fee-break-even');
      const box = selector => `(r => [r.top, r.bottom])(document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect())`;
      const arrive = await evaluate(`({ figure: ${box('.benchmark-figure')}, question: ${box('.scene-prediction-question')}, header: document.querySelector('.topbar').getBoundingClientRect().bottom, height: innerHeight, fits: document.documentElement.scrollWidth <= innerWidth })`);
      assert.ok(arrive.fits && arrive.question[0] - arrive.figure[1] < 120, 'The question sits right under the figure: ' + JSON.stringify(arrive));
      if (width === 390) assert.ok(arrive.figure[0] >= arrive.header && arrive.figure[1] <= arrive.height, 'Arriving from a link shows the figure on the first screen: ' + JSON.stringify(arrive));
      await evaluate("document.querySelector('.scene-prediction input[value=both-earn]').click()");
      await evaluate(`(b => scrollBy(0, b.bottom - innerHeight + 40))(document.getElementById('learn-reveal').getBoundingClientRect())`);
      const figureTop = "(r => r.top + scrollY)(document.querySelector('.benchmark-figure').getBoundingClientRect())";
      const placed = await evaluate(figureTop);
      const reveal = await evaluate(`(() => {
        document.getElementById('learn-reveal').click();
        const figure = document.querySelector('.benchmark-figure').getBoundingClientRect(), header = document.querySelector('.topbar').getBoundingClientRect().bottom;
        const bars = document.querySelector('.benchmark-figure .scene-token-row').getBoundingClientRect();
        const slider = document.getElementById('fee-amount').getBoundingClientRect(), feedback = document.getElementById('learn-prediction-feedback');
        const played = fill => { const animation = fill.getAnimations().find(item => !(item instanceof CSSTransition)), frames = animation?.effect.getKeyframes() || [];
          return animation ? { moved: frames[0].width !== frames.at(-1).width, delay: animation.effect.getTiming().delay, duration: animation.effect.getTiming().duration } : null; };
        return { onScreen: figure.top >= header - 1 && figure.bottom <= innerHeight, gap: slider.top - figure.bottom,
          // The bars, their lines and the slider share one screen under the sticky header,
          // with room for a font that wraps differently.
          together: slider.bottom - bars.top <= innerHeight - header - 24,
          afterSlider: document.getElementById('fee-amount').closest('.scene-price-control').nextElementSibling === feedback, verdict: feedback.textContent,
          fees: [...document.querySelectorAll('.benchmark-figure .benchmark-fees')].map(played), hold: played(document.querySelector('[data-benchmark=hold] .scene-token-fill')) };
      })()`);
      assert.ok(reveal.onScreen, `${width}px: the figure stays on screen while the fees arrive: ` + JSON.stringify(reveal));
      assert.ok(reveal.gap < 170 && reveal.together, `${width}px: the slider sits right under the bars it moves, on one screen with them: ` + JSON.stringify(reveal));
      assert.ok(reveal.fees.length === 2 && reveal.fees.every(bar => bar && bar.moved && bar.delay >= 300 && bar.duration >= 700), 'The revealed fees play on the claim and on the gap: ' + JSON.stringify(reveal.fees));
      assert.ok(!reveal.hold || !reveal.hold.moved, 'Holding does not move.');
      assert.equal(await evaluate(figureTop), placed, 'The slider and the verdict appear without moving the figure.');
      assert.match(reveal.verdict, /differs from your prediction[\s\S]*Only your claim\./);
      assert.ok(reveal.afterSlider, 'The verdict follows the slider.');
      await motionSettled(evaluate);

      // A touch drag across the whole range must not move the slider.
      await evaluate("document.getElementById('fee-amount').scrollIntoView({block:'center'})"); await settle(evaluate);
      const slider = await evaluate("(r => ({left:r.left,top:r.top,width:r.width,height:r.height}))(document.getElementById('fee-amount').getBoundingClientRect())");
      assert.ok(slider.height >= 44);
      const point = fraction => ({ x: slider.left + 26 + (slider.width - 52) * fraction, y: slider.top + slider.height / 2, id: 0 });
      await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      try {
        await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
        for (const fraction of [.25, .5, .75, 1]) {
          await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] }); await settle(evaluate);
          assert.ok(Math.abs(await evaluate("document.getElementById('fee-amount').getBoundingClientRect().top") - slider.top) < 1, 'Changing numbers must not move the slider during a drag.');
        }
        await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally { await call('Emulation.setTouchEmulationEnabled', { enabled: false }); }
      assert.equal(Number(await evaluate("document.getElementById('fee-amount').value")), Number(await evaluate("document.getElementById('fee-amount').max")));
      assert.equal(await evaluate("document.getElementById('learn-application-evidence').hidden"), false);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    }
    // Reduced motion shows the outcome at once.
    await evaluate("document.getElementById('learn-variation').click()");
    await reduceMotion({ call, evaluate });
    await evaluate("document.getElementById('learn-reveal').click()");
    assert.deepEqual(await evaluate("[document.querySelector('.benchmark-figure').getAnimations({subtree:true}).length, document.getElementById('fee-earned').textContent]"), [0, 'Gap covered: $50.00 of $128.68']);
  } finally {
    await call('Emulation.setEmulatedMedia', { features: [] });
    await evaluate(`${kept === null ? `localStorage.removeItem('${progressKey}')` : `localStorage.setItem('${progressKey}', ${JSON.stringify(kept)})`}`);
  }
  console.log('PASS: lesson 5 at 390px/320px keeps the bars with their slider, plays the fees on the claim and the gap only, supports stable touch dragging, and respects reduced motion');
}
