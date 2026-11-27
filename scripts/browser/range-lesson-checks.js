import assert from 'node:assert/strict';
import { lessonSetup, runLesson } from '../../public/models/lesson-experiments.js';
import { fmt, usd } from '../../public/lib/format.js';
import { motionSettled, reduceMotion } from './motion-settled.js';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const figureText = "['boundary-at', 'boundary-where', 'boundary-eth', 'boundary-usdc'].map(id => document.getElementById(id).textContent)";
const bars = "['eth', 'usdc'].map(token => document.querySelector('.boundary-figure [data-token=' + token + '] .scene-token-fill').style.width)";

// Liquidity lesson 6: the claim now works inside a price range. The figure shows
// the range over the claim's two token bars, the reveal moves the price across
// the range, and the bars change only while the price is inside it.
export async function checkRangeLesson({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="${group}"][value="${value}"]').click()`);
  const saved = () => evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  const reset = async () => {
    await click('learn-variation');
    for (let i = 0; i < 3 && !(await text('learn-variation-label')).includes('1 of 3'); i++) await click('learn-variation');
  };
  const shortcut = label => evaluate(`Array.from(document.querySelectorAll('.boundary-scene .scene-shortcut')).find(button => button.textContent === ${JSON.stringify(label)}).click()`);
  const shownParts = "['#learn-run', '#learn-setup', '#learn-explanation', '#boundary-price', '#boundary-invite', '#boundary-outcome'].filter(id => document.querySelector(id)?.checkVisibility())";
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'learn.html#lesson=range-boundaries'); await reset();
  assert.equal(await evaluate("document.getElementById('learn-essential').hasAttribute('data-pool-first')"), true);
  assert.equal(await evaluate("Boolean(document.querySelector('.boundary-figure').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true, 'The figure comes before its question.');
  assert.deepEqual(await evaluate(shownParts), [], 'Before the outcome there is one thing to do: answer or skip the question.');
  assert.deepEqual(await evaluate("[document.getElementById('learn-input-width'), document.getElementById('learn-controls').childElementCount, document.getElementById('learn-controls').getBoundingClientRect().height]"), [null, 0, 0], 'The question no longer has a width editor of its own.');
  assert.equal(await text('learn-intro'), 'Here your liquidity works only inside a price range you choose. See what your claim holds when ETH leaves it.');
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), 'ETH rises from $2,000.00 to $2,400.00, above your range. What does your claim hold then?');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#learn-predictions label'), label => label.textContent.trim())"), ['Only ETH', 'ETH and USDC', 'Only USDC']);
  // The figure opens at the starting price: inside the range, with both tokens.
  assert.deepEqual(await evaluate(figureText), ['ETH at $2,000.00', 'Inside your range', '1.1889 ETH', '2,622.10 USDC']);
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.boundary-figure .scene-range-bound-label'), label => label.textContent)"), ['Lower $1,800.00', 'Upper $2,200.00']);
  assert.equal(await evaluate("document.querySelector('.boundary-figure .scene-key').textContent"), 'Band = your range. Dashed = start.');
  // The range takes about a third of the track, and the question's price is on it.
  const band = await evaluate("(band => [parseFloat(band.style.left), parseFloat(band.style.width)])(document.querySelector('.boundary-figure .scene-range-band'))");
  assert.ok(band[1] > 25 && band[1] < 45 && band[0] > 15, 'The range is wide enough to watch the price cross it: ' + band);
  const start = await evaluate("document.querySelector('.boundary-figure').outerHTML");
  const before = await saved();
  await click('learn-reveal');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'skipped');
  assert.deepEqual(await evaluate(shownParts), ['#boundary-price', '#boundary-invite', '#boundary-outcome']);
  assert.deepEqual(await evaluate(figureText), ['ETH at $2,400.00', 'Above your range', '0.0000 ETH', '5,116.06 USDC']);
  assert.deepEqual(await evaluate(bars), ['0%', '100%'], 'Past the upper end the claim is all USDC.');
  assert.equal(await evaluate("document.querySelector('.boundary-figure').dataset.state"), 'above');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.boundary-scene .scene-shortcut'), button => [button.textContent, button.getAttribute('aria-pressed')])"),
    [['Lower', 'false'], ['Upper', 'false'], ['The question · $2,400', 'true']]);
  assert.match(await text('learn-prediction-feedback'), /ETH at \$2,400\.00: Only USDC\. On the way up, traders bought ETH from your claim and paid in USDC\. The last ETH went at \$2,200\.00, the upper end of your range\. Above it nothing trades, so your claim stays at 5,116\.06 USDC\./);
  assert.deepEqual(await evaluate("[document.querySelector('.scene-prediction').dataset.folded, document.querySelector('.scene-prediction-recap span').textContent]"), ['true', 'Your prediction for ETH at $2,400.00']);
  assert.equal(await text('boundary-invite'), 'Now drag the price back through your range. Where do the bars stop?');
  assert.deepEqual(await evaluate(`(order => order.map((id, i) => i === 0 || Boolean(document.querySelector(order[i - 1]).compareDocumentPosition(document.querySelector(id)) & Node.DOCUMENT_POSITION_FOLLOWING)))(
    ['.boundary-figure', '#boundary-invite', '#boundary-price', '#learn-prediction-feedback', '.scene-prediction-recap', '#boundary-outcome', '.learn-about-example'])`), Array(7).fill(true));
  assert.equal(await text('boundary-outcome-title'), 'Inside and outside your range');
  assert.equal(await text('boundary-copy'), 'Above your range no one trades against your claim. It stays at 5,116.06 USDC and earns no new fees until ETH comes back below $2,200.00.');
  assert.match(await text('boundary-why'), /^Inside your range your claim trades as it would in a pool that covers every price, only faster[\s\S]*Outside the range nothing trades/);
  assert.deepEqual(await evaluate("['boundary-why', 'learn-pitfall'].map(id => document.getElementById(id).closest('#boundary-outcome') !== null && document.getElementById(id).checkVisibility())"), [true, true]);
  assert.match(await text('learn-pitfall'), /Outside the range is not liquidation\.[\s\S]*You still own your claim’s tokens/);
  assert.match(await evaluate("document.querySelector('.learn-about-example').textContent"), /one range, \$1,800\.00–\$2,200\.00, at \$2,000\.00 per ETH\. A range does not start half and half: this one starts with 1\.1889 ETH \+ 2,622\.10 USDC\./);
  assert.notEqual(await saved(), before);
  const revealed = await saved();

  // Exploring: each end is one token, one step inside is both, and past an end nothing changes.
  await shortcut('Upper');
  assert.deepEqual(await evaluate(figureText), ['ETH at $2,200.00', 'At the upper end', '0.0000 ETH', '5,116.06 USDC']);
  assert.equal(await text('boundary-copy'), 'At the upper end the last ETH is sold. One step back inside, your claim holds both tokens again.');
  await fill('boundary-price', '2180');
  assert.deepEqual([(await evaluate(figureText))[1], await evaluate("document.getElementById('boundary-eth').textContent !== '0.0000 ETH'"), await text('boundary-copy')],
    ['Inside your range', true, 'Traders are swapping against your claim here. It holds both tokens and can earn fees.']);
  await fill('boundary-price', '2700');
  assert.deepEqual(await evaluate(figureText), ['ETH at $2,700.00', 'Above your range', '0.0000 ETH', '5,116.06 USDC'], 'Farther past the range the claim holds the same tokens.');
  await shortcut('Lower');
  assert.deepEqual(await evaluate(figureText), ['ETH at $1,800.00', 'At the lower end', '2.5709 ETH', '0.00 USDC']);
  assert.deepEqual(await evaluate(bars), ['100%', '0%']);
  await fill('boundary-price', '1400');
  assert.deepEqual(await evaluate(figureText), ['ETH at $1,400.00', 'Below your range', '2.5709 ETH', '0.00 USDC']);
  assert.equal(await text('boundary-copy'), 'Below your range no one trades against your claim. It stays at 2.5709 ETH and earns no new fees until ETH comes back above $1,800.00.');
  await fill('boundary-price', '2000');
  assert.equal(await evaluate("document.querySelector('.boundary-figure').outerHTML"), start, 'The starting price shows the starting figure again.');
  assert.equal(await saved(), revealed, 'Exploration must not change the fixed question or progress.');
  assert.match(await text('learn-prediction-feedback'), /ETH at \$2,400\.00: Only USDC\./, 'The verdict stays with the question’s price.');

  // The check questions: one about fees, one about a range the figure does not show.
  assert.equal(await text('learn-reason-question'), 'What does the price ETH ends at tell you about your claim’s fees?');
  assert.equal(await text('learn-application-label'), 'A narrower range');
  assert.equal(await text('learn-application-context'), 'Someone else starts with the same $5,000.00 at the same price, in a narrower range: $1,900.00–$2,100.00. ETH is now $2,160.00: inside your range, above theirs.');
  assert.equal(await text('learn-application-question'), 'What do the two claims hold?');
  await choose('learn-reason', 'zero'); await choose('learn-application', 'narrow-keeps'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your answers.');
  assert.match(await text('learn-reasons-feedback'), /It does not say it earned nothing on the way/);
  assert.match(await text('learn-applications-feedback'), /A narrower range trades faster, not less[\s\S]*Theirs ran out at \$2,100\.00/);
  await choose('learn-reason', 'fixed'); await choose('learn-application', 'both-hold'); await click('learn-check');
  assert.match(await text('learn-reasons-feedback'), /The width decides at which prices your claim can trade/);
  assert.match(await text('learn-applications-feedback'), /Their range ends at \$2,100\.00, and their last ETH went there/);
  await choose('learn-reason', 'path'); await choose('learn-application', 'narrow-out'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  await evaluate("document.querySelector('.scene-prediction-recap button').click()");
  await choose('learn-prediction', 'usdc');
  assert.match(await text('learn-prediction-feedback'), /^Your prediction matches/);
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.', 'A prediction chosen afterwards keeps the checked answers.');
  assert.match(await evaluate("document.getElementById('learn-explore').href"), /liquidity\.html#/);
  assert.equal(await text('learn-explore-note'), 'Opens this range in a new tab. Move its ends and the price, and see where it runs out of a token.');
  await reload();
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  assert.deepEqual([await evaluate("document.getElementById('boundary-price').value"), await text('boundary-where'), await evaluate("document.querySelector('input[name=learn-prediction]:checked').value")],
    ['2400', 'Above your range', 'usdc'], 'A restored lesson shows its outcome and the slider at the question’s price.');

  // The variations end above, below and inside the range, with the model's own values.
  const expected = [
    ['Above your range', /Only USDC\.[\s\S]*the upper end of your range/, 'A narrower range'],
    ['Below your range', /Only ETH\. On the way down, traders sold ETH to your claim and took USDC\. The last USDC went at \$1,350\.00, the lower end of your range\. Below it nothing trades, so your claim stays at 2\.0567 ETH\./, 'A narrower range'],
    ['Inside your range', /ETH and USDC\. \$3,150\.00 is inside your range, so traders are still swapping against your claim\.[\s\S]*less ETH and more USDC than at the start\./, 'ETH falls below your range'],
  ];
  for (let variant = 0; variant < 3; variant++) {
    if (variant) { await click('learn-variation'); await click('learn-reveal'); }
    const { result, setup } = runLesson('range-boundaries', lessonSetup('range-boundaries', variant), variant);
    assert.deepEqual(await evaluate(figureText), ['ETH at ' + usd(setup.futurePrice), expected[variant][0], fmt(result.pooled.eth, 4) + ' ETH', fmt(result.pooled.usdc, 2) + ' USDC']);
    assert.match(await text('learn-prediction-feedback'), expected[variant][1]);
    assert.equal(await text('learn-application-label'), expected[variant][2]);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
  }
  assert.equal(await text('boundary-invite'), 'Now drag the price out of your range. Where do the bars stop?', 'Inside the range the invitation points outward.');
  assert.match(await text('learn-application-context'), /ETH reaches \$2,700\.00, the lower end of your range\. Your claim is now all ETH\./);
  await click('learn-variation'); await click('learn-variation'); await click('learn-reveal');
  assert.match(await text('learn-application-context'), /narrower range: \$1,425\.00–\$1,575\.00\. ETH is now \$1,380\.00: inside your range, below theirs\./);

  // A range width saved by the earlier editor still loads, with its own range and domain.
  await evaluate("{const progress=JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1'));Object.assign(progress.drafts['range-boundaries'].inputs,{width:.5});localStorage.setItem('degenerator-learning-liquidity-v1',JSON.stringify(progress));}");
  await reload();
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.boundary-figure .scene-range-bound-label'), label => label.textContent)"), ['Lower $750.00', 'Upper $2,250.00']);
  assert.match(await evaluate("document.querySelector('.scene-prediction-question').textContent"), /^ETH falls from \$1,500\.00 to \$1,275\.00, still inside your range\./);
  assert.equal(await evaluate("(slider => Number(slider.min) < 750 && Number(slider.max) > 2250)(document.getElementById('boundary-price'))"), true);
  await reset();
  console.log('PASS: lesson 6 opens on the claim inside its range, moves the price across it, holds one token past either end, keeps exploration apart from the question, asks about a narrower range and restores completion');

  const progressKey = 'degenerator-learning-liquidity-v1';
  const kept = await saved();
  try {
    for (const [width, height] of [[390, 844], [320, 640]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await evaluate(`localStorage.removeItem('${progressKey}')`);
      await navigate(base + 'learn.html#lesson=range-boundaries');
      const box = selector => `(r => [r.top, r.bottom])(document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect())`;
      const arrive = await evaluate(`({ figure: ${box('.boundary-figure')}, question: ${box('.scene-prediction-question')}, header: document.querySelector('.topbar').getBoundingClientRect().bottom, height: innerHeight, fits: document.documentElement.scrollWidth <= innerWidth,
        labels: Array.from(document.querySelectorAll('.boundary-figure .scene-range-bound-label, .boundary-figure .scene-token-heading > span, #boundary-where'), part => part.scrollWidth <= part.clientWidth + 1 && part.getBoundingClientRect().right <= document.querySelector('.boundary-figure').getBoundingClientRect().right + 1) })`);
      assert.ok(arrive.fits && arrive.labels.every(Boolean) && arrive.question[0] - arrive.figure[1] < 120, 'The question sits right under the figure, and every label fits: ' + JSON.stringify(arrive));
      if (width === 390) assert.ok(arrive.figure[0] >= arrive.header && arrive.figure[1] <= arrive.height, 'Arriving from a link shows the figure on the first screen: ' + JSON.stringify(arrive));
      await evaluate("document.querySelector('.scene-prediction input[value=both]').click()");
      await evaluate(`(b => scrollBy(0, b.bottom - innerHeight + 40))(document.getElementById('learn-reveal').getBoundingClientRect())`);
      const figureTop = "(r => r.top + scrollY)(document.querySelector('.boundary-figure').getBoundingClientRect())";
      const placed = await evaluate(figureTop);
      const reveal = await evaluate(`(() => {
        document.getElementById('learn-reveal').click();
        const figure = document.querySelector('.boundary-figure').getBoundingClientRect(), header = document.querySelector('.topbar').getBoundingClientRect().bottom;
        const guide = document.querySelector('.boundary-figure .scene-range-track').getBoundingClientRect();
        const slider = document.getElementById('boundary-price').getBoundingClientRect(), feedback = document.getElementById('learn-prediction-feedback');
        const played = (part, property) => { const animation = part.getAnimations().find(item => !(item instanceof CSSTransition)), frames = animation?.effect.getKeyframes() || [];
          return animation ? { frames: frames.map(frame => [frame.offset, frame[property]]), delay: animation.effect.getTiming().delay, duration: animation.effect.getTiming().duration } : null; };
        return { onScreen: figure.top >= header - 1 && figure.bottom <= innerHeight, gap: slider.top - figure.bottom,
          // The range, the bars and the slider share one screen under the sticky header,
          // with room for a font that wraps differently.
          together: slider.bottom - guide.top <= innerHeight - header - 24,
          afterSlider: document.getElementById('boundary-price').closest('.scene-price-control').nextElementSibling === feedback, verdict: feedback.textContent,
          marker: played(document.querySelector('.boundary-figure .scene-range-marker'), 'left'),
          fills: [...document.querySelectorAll('.boundary-figure .scene-token-fill')].map(fill => played(fill, 'width')) };
      })()`);
      assert.ok(reveal.onScreen, `${width}px: the figure stays on screen while the price moves: ` + JSON.stringify(reveal));
      assert.ok(reveal.gap < 170 && reveal.together, `${width}px: the slider sits right under the range and the bars it moves, on one screen with them: ` + JSON.stringify(reveal));
      // The marker travels for the whole move. The bars finish when it reaches the
      // upper end, halfway from $2,000 to $2,400, and stay there.
      assert.ok(reveal.marker && reveal.marker.frames.length === 2 && reveal.marker.frames[0][1] !== reveal.marker.frames[1][1] && reveal.marker.delay >= 300 && reveal.marker.duration >= 1000, 'The price marker plays the move: ' + JSON.stringify(reveal.marker));
      assert.ok(reveal.fills.length === 2 && reveal.fills.every(bar => bar && bar.frames.length === 3 && Math.abs(bar.frames[1][0] - .5) < 1e-6 && bar.frames[1][1] === bar.frames[2][1] && bar.frames[0][1] !== bar.frames[1][1]
        && bar.duration === reveal.marker.duration), 'The bars change only while the price is inside the range: ' + JSON.stringify(reveal.fills));
      assert.deepEqual(reveal.fills.map(bar => bar.frames[2][1]), ['0%', '100%']);
      assert.equal(await evaluate(figureTop), placed, 'The slider and the verdict appear without moving the figure.');
      assert.match(reveal.verdict, /differs from your prediction[\s\S]*Only USDC\./);
      assert.ok(reveal.afterSlider, 'The verdict follows the slider.');
      await motionSettled(evaluate);

      // A touch drag across the whole track must not move the slider.
      await evaluate("document.getElementById('boundary-price').scrollIntoView({block:'center'})"); await settle(evaluate);
      const slider = await evaluate("(r => ({left:r.left,top:r.top,width:r.width,height:r.height}))(document.getElementById('boundary-price').getBoundingClientRect())");
      assert.ok(slider.height >= 44);
      const point = fraction => ({ x: slider.left + 26 + (slider.width - 52) * fraction, y: slider.top + slider.height / 2, id: 0 });
      await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      try {
        await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(1)] });
        const seen = new Set();
        for (const fraction of [.8, .6, .45, .3, .15, 0]) {
          await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] }); await settle(evaluate);
          assert.ok(Math.abs(await evaluate("document.getElementById('boundary-price').getBoundingClientRect().top") - slider.top) < 1, 'Changing words and numbers must not move the slider during a drag.');
          seen.add(await text('boundary-where'));
        }
        await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.ok(seen.has('Inside your range') && seen.has('Below your range'), 'The drag passes through the range: ' + [...seen]);
      } finally { await call('Emulation.setTouchEmulationEnabled', { enabled: false }); }
      assert.equal(Number(await evaluate("document.getElementById('boundary-price').value")), Number(await evaluate("document.getElementById('boundary-price').min")));
      // The keyboard reaches both ends of the track.
      await evaluate("document.getElementById('boundary-price').focus()");
      for (const [key, code, end] of [['End', 35, 'max'], ['Home', 36, 'min']]) {
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code });
        assert.equal(await evaluate("document.getElementById('boundary-price').value"), await evaluate(`document.getElementById('boundary-price').${end}`));
      }
      assert.equal(await evaluate("Array.from(document.querySelectorAll('.boundary-scene .scene-shortcut')).every(button => button.getBoundingClientRect().height >= 44)"), true);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    }
    // Reduced motion shows the outcome at once.
    await evaluate("document.getElementById('learn-variation').click()");
    await reduceMotion({ call, evaluate });
    await evaluate("document.getElementById('learn-reveal').click()");
    assert.deepEqual(await evaluate("[document.querySelector('.boundary-figure').getAnimations({subtree:true}).length, document.getElementById('boundary-where').textContent, document.getElementById('boundary-usdc').textContent]"), [0, 'Below your range', '0.00 USDC']);
  } finally {
    await call('Emulation.setEmulatedMedia', { features: [] });
    await evaluate(`${kept === null ? `localStorage.removeItem('${progressKey}')` : `localStorage.setItem('${progressKey}', ${JSON.stringify(kept)})`}`);
  }
  console.log('PASS: lesson 6 at 390px/320px keeps the range and the bars with their slider, plays the price across the range with the bars stopping at its end, supports stable touch dragging, and respects reduced motion');
}
