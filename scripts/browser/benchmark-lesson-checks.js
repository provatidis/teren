import assert from 'node:assert/strict';
import { lessonSetup, runLesson } from '../../public/models/lesson-experiments.js';
import { usd } from '../../public/lib/format.js';
import { lessonApplicationCopy } from '../../public/lib/lesson-application-copy.js';
import { motionSettled, reduceMotion } from './motion-settled.js';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const figureText = "['benchmark-at', 'benchmark-hold', 'benchmark-hold-tokens', 'benchmark-claim', 'benchmark-claim-tokens', 'benchmark-against-start', 'benchmark-against-gap'].map(id => document.getElementById(id).textContent)";

// Liquidity lesson 4 compares one claim with holding and with its start. The
// figure comes first, its question reveals the price move in place, and the
// slider appears with the outcome, right under the bars it moves.
export async function checkBenchmarkLesson({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="${group}"][value="${value}"]').click()`);
  const saved = () => evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  const reset = async () => {
    await click('learn-variation');
    for (let i = 0; i < 3 && !(await text('learn-variation-label')).includes('1 of 3'); i++) await click('learn-variation');
  };
  const shownParts = "['#learn-run', '#learn-setup', '#learn-explanation', '#benchmark-price', '#benchmark-invite', '#benchmark-outcome'].filter(id => document.querySelector(id)?.checkVisibility())";
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'learn.html#lesson=loss-vs-profit'); await reset();
  assert.equal(await evaluate("document.getElementById('learn-essential').hasAttribute('data-pool-first')"), true);
  assert.equal(await evaluate("Boolean(document.querySelector('.benchmark-figure').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true, 'The figure comes before its question.');
  assert.deepEqual(await evaluate(shownParts), [], 'Before the outcome there is one thing to do: answer or skip the question.');
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"),
    'ETH rises from $2,000.00 to $4,000.00. Holding would then be worth $7,500.00. Will your claim be worth more, less, or the same?');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#learn-predictions label'), label => label.textContent.trim())"), ['More than holding', 'Less than holding', 'The same as holding']);
  assert.doesNotMatch(await text('learn-intro'), /behind holding|fall behind/, 'The introduction does not answer the question.');
  // At the start, holding and the claim are the same tokens and the same value.
  assert.deepEqual(await evaluate(figureText), ['ETH at $2,000.00', '$5,000.00', '1.25 ETH + 2,500 USDC', '$5,000.00', '1.25 ETH + 2,500 USDC', 'Against your start: $0.00', 'Against holding: $0.00']);
  const start = await evaluate("document.querySelector('.benchmark-figure').outerHTML");
  const before = await saved();
  await click('learn-reveal');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'skipped');
  assert.deepEqual(await evaluate(shownParts), ['#benchmark-price', '#benchmark-invite', '#benchmark-outcome']);
  assert.deepEqual(await evaluate(figureText), ['ETH at $4,000.00', '$7,500.00', '1.25 ETH + 2,500 USDC', '$7,071.07', '0.8839 ETH + 3,535.53 USDC', 'Against your start: +$2,071.07', 'Against holding: −$428.93']);
  assert.equal(await evaluate("document.getElementById('benchmark-price').value"), '4000');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.benchmark-scene .scene-shortcut'), button => [button.textContent, button.getAttribute('aria-pressed')])"),
    [['Start · $2,000', 'false'], ['The question · $4,000', 'true']]);
  assert.match(await text('learn-prediction-feedback'), /ETH at \$4,000\.00: Less\. Your claim is worth \$7,071\.07, which is \$428\.93 less than holding\. It is still \$2,071\.07 more than the \$5,000\.00 you started with\./);
  assert.deepEqual(await evaluate("[document.querySelector('.scene-prediction').dataset.folded, document.querySelector('.scene-prediction-recap span').textContent]"), ['true', 'Your prediction for ETH at $4,000.00']);
  assert.equal(await text('benchmark-invite'), 'Now drag the price both ways. Can your claim ever beat holding?');
  assert.deepEqual(await evaluate(`(order => order.map((id, i) => i === 0 || Boolean(document.querySelector(order[i - 1]).compareDocumentPosition(document.querySelector(id)) & Node.DOCUMENT_POSITION_FOLLOWING)))(
    ['.benchmark-figure', '#benchmark-invite', '#benchmark-price', '#learn-prediction-feedback', '.scene-prediction-recap', '#benchmark-outcome', '.learn-about-example'])`), Array(7).fill(true));
  assert.equal(await text('benchmark-copy'), 'At this price your claim is worth 5.72% less than holding.');
  assert.match(await text('benchmark-why'), /never beats holding[\s\S]*impermanent loss[\s\S]*a comparison, not a charge/);
  // The panel names the cause for both directions, so it stays true wherever the slider is.
  assert.match(await text('benchmark-why'), /As ETH rises, traders buy ETH from the pool\. As it falls, they sell ETH to it\. Holding makes neither trade/);
  assert.deepEqual(await evaluate("['benchmark-why', 'learn-pitfall'].map(id => document.getElementById(id).closest('#benchmark-outcome') !== null && document.getElementById(id).checkVisibility())"), [true, true]);
  assert.match(await text('learn-results-title'), /Look closer/);
  assert.deepEqual([await text('learn-explore-question'), await text('learn-explore')], ['Compared with what?', 'Open this example in the full-range lab ↗']);
  assert.notEqual(await saved(), before);
  const revealed = await saved();

  // Exploring: the claim is behind holding at every price but the starting one,
  // and halving the price opens the same percentage gap as doubling it.
  await fill('benchmark-price', '4000');
  const figure = await evaluate("document.querySelector('.benchmark-figure').outerHTML");
  await fill('benchmark-price', '1000');
  assert.deepEqual(await evaluate(figureText), ['ETH at $1,000.00', '$3,750.00', '1.25 ETH + 2,500 USDC', '$3,535.53', '1.7678 ETH + 1,767.77 USDC', 'Against your start: −$1,464.47', 'Against holding: −$214.47']);
  assert.equal(await text('benchmark-copy'), 'At this price your claim is worth 5.72% less than holding.');
  for (const price of [1020, 1500, 1980, 2020, 3000, 3980]) {
    await fill('benchmark-price', String(price));
    assert.match(await text('benchmark-against-gap'), /^Against holding: −\$/, 'Before fees the claim trails holding at $' + price + '.');
  }
  await fill('benchmark-price', '2000');
  assert.equal(await evaluate("document.querySelector('.benchmark-figure').outerHTML"), start, 'The starting price shows the starting figure again.');
  assert.equal(await text('benchmark-copy'), 'At the starting price there is no gap: your claim and holding are the same tokens.');
  await fill('benchmark-price', '4000');
  assert.equal(await evaluate("document.querySelector('.benchmark-figure').outerHTML"), figure);
  await fill('benchmark-price', '1000');
  assert.equal(await saved(), revealed, 'Exploration must not change the fixed question or progress.');
  assert.match(await text('learn-prediction-feedback'), /ETH at \$4,000\.00/, 'The verdict stays with the question’s price.');

  // The question: two true readings of one claim. Each wrong answer folds them into one.
  const asked = await text('learn-application-context');
  assert.equal(asked, 'Your dashboard says you are up 41.42% on what you started with. Another view says you are 5.72% behind holding.');
  assert.equal(await text('learn-application-question'), 'Can both be right?');
  assert.equal(await evaluate("document.querySelectorAll('#learn-assessment-form fieldset').length"), 1);
  await fill('benchmark-price', '3000');
  assert.equal(await text('learn-application-context'), asked, 'Exploring a price must not rewrite the question.');
  await choose('learn-application', 'gap-only'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your answer.');
  assert.match(await text('learn-applications-feedback'), /Being behind holding is not a loss of money\. Your claim is worth \$2,071\.07 more than you started with\. Holding would be worth \$428\.93 more still\./);
  await choose('learn-application', 'profit-only'); await click('learn-check');
  assert.match(await text('learn-applications-feedback'), /rose from \$5,000\.00 to \$7,071\.07\. Holding the same tokens rose further, to \$7,500\.00\./);
  await choose('learn-application', 'both-right'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Lesson 4 done.');
  assert.match(await text('learn-applications-feedback'), /^That’s right\.\s*Against the \$5,000\.00 you started with, your claim is up \$2,071\.07\. Against holding, worth \$7,500\.00, it is \$428\.93 behind\. Say what you compare with: your start, or holding\.$/);
  // A prediction chosen afterwards keeps the checked answer.
  await evaluate("document.querySelector('.scene-prediction-recap button').click()");
  await choose('learn-prediction', 'less');
  assert.match(await text('learn-prediction-feedback'), /^Your prediction matches/);
  assert.equal(await evaluate("document.querySelector('input[name=learn-application]:checked').value"), 'both-right');
  assert.equal(await text('learn-feedback-title'), 'Lesson 4 done.');
  const link = await evaluate("document.getElementById('learn-explore').href");
  assert.match(link, /future=4000/); assert.match(link, /fees=0/);
  await fill('benchmark-price', '1000');
  assert.equal(await evaluate("document.getElementById('learn-explore').href"), link);
  await reload();
  assert.equal(await text('learn-feedback-title'), 'Lesson 4 done.');
  assert.deepEqual([await evaluate("document.getElementById('benchmark-price').value"), await text('benchmark-at'), await evaluate("document.querySelector('input[name=learn-prediction]:checked').value")],
    ['4000', 'ETH at $4,000.00', 'less'], 'A restored lesson shows its outcome and the slider at the question’s price.');

  // Every variation shows the model's own values and asks the same idea, worded for its direction.
  for (let variant = 0; variant < 3; variant++) {
    if (variant) { await click('learn-variation'); await click('learn-reveal'); }
    const question = runLesson('loss-vs-profit', lessonSetup('loss-vs-profit', variant), variant);
    assert.equal(await text('benchmark-hold'), usd(question.result.holdValue));
    assert.equal(await text('benchmark-claim'), usd(question.result.lpBeforeFees));
    assert.ok((await evaluate("document.querySelector('.benchmark-figure .scene-key').textContent")).includes(usd(question.setup.investment)));
    assert.match(await text('learn-prediction-feedback'), /: Less\. Your claim is worth/);
    const copy = lessonApplicationCopy('loss-vs-profit', question), wrong = Object.fromEntries(copy.choices);
    assert.equal(await text('learn-application-context'), copy.context);
    assert.match(copy.context, variant === 1 ? /^Your dashboard says you are down 29\.29% on what you started with\. Another view says you are 5\.72% behind holding\.$/ : /^Your dashboard says you are up /);
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#learn-applications label'), label => label.textContent.trim()).sort()"), copy.choices.map(([, label]) => label).sort());
    if (variant === 1) {
      // ETH fell: the claim is down and behind, by different amounts. Holding fell too.
      assert.equal(wrong['profit-only'], 'No. A claim that is down 29.29% is 29.29% behind holding.');
      await choose('learn-application', 'profit-only'); await click('learn-check');
      assert.match(await text('learn-applications-feedback'), /Holding fell too: it is worth \$2,250\.00, down from \$3,000\.00\. Your claim, at \$2,121\.32, is \$128\.68 behind that, which is 5\.72%\./);
      await choose('learn-application', 'both-right'); await click('learn-check');
      assert.equal(await text('learn-feedback-title'), 'Lesson 4 done.');
      assert.match(await text('learn-applications-feedback'), /your claim is down \$878\.68\. Against holding, worth \$2,250\.00, it is \$128\.68 behind\./);
    } else if (variant === 2) {
      await choose('learn-application', 'both-right'); await click('learn-check');
      assert.match(await text('learn-applications-feedback'), /your claim is up \$1,348\.47\. Against holding, worth \$7,500\.00, it is \$151\.53 behind\./);
    }
  }
  console.log('PASS: lesson 4 shows holding and the claim first, reveals in place, never lets the claim beat holding before fees, keeps exploration apart from the question and restores completion');

  const progressKey = 'degenerator-learning-liquidity-v1';
  const kept = await saved();
  try {
    for (const [width, height] of [[390, 844], [320, 640]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await evaluate(`localStorage.removeItem('${progressKey}')`);
      await navigate(base + 'learn.html#lesson=loss-vs-profit');
      const box = selector => `(r => [r.top, r.bottom])(document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect())`;
      const arrive = await evaluate(`({ figure: ${box('.benchmark-figure')}, question: ${box('.scene-prediction-question')}, header: document.querySelector('.topbar').getBoundingClientRect().bottom, height: innerHeight, fits: document.documentElement.scrollWidth <= innerWidth })`);
      assert.ok(arrive.fits && arrive.question[0] - arrive.figure[1] < 120, 'The question sits right under the figure: ' + JSON.stringify(arrive));
      if (width === 390) assert.ok(arrive.figure[0] >= arrive.header && arrive.figure[1] <= arrive.height, 'Arriving from a link shows the figure on the first screen: ' + JSON.stringify(arrive));
      await evaluate("document.querySelector('.scene-prediction input[value=more]').click()");
      await evaluate(`(b => scrollBy(0, b.bottom - innerHeight + 40))(document.getElementById('learn-reveal').getBoundingClientRect())`);
      const figureTop = "(r => r.top + scrollY)(document.querySelector('.benchmark-figure').getBoundingClientRect())";
      const placed = await evaluate(figureTop);
      const reveal = await evaluate(`(() => {
        document.getElementById('learn-reveal').click();
        const figure = document.querySelector('.benchmark-figure').getBoundingClientRect(), header = document.querySelector('.topbar').getBoundingClientRect().bottom;
        const bars = document.querySelector('.benchmark-figure .scene-token-row').getBoundingClientRect();
        const slider = document.getElementById('benchmark-price').getBoundingClientRect(), feedback = document.getElementById('learn-prediction-feedback');
        return { onScreen: figure.top >= header - 1 && figure.bottom <= innerHeight, gap: slider.top - figure.bottom,
          // The bars, their two lines and the slider share one screen under the sticky header.
          // Measured against the header's visible part, with room for a font that wraps differently.
          together: slider.bottom - bars.top <= innerHeight - header - 24,
          afterSlider: document.getElementById('benchmark-price').closest('.scene-price-control').nextElementSibling === feedback, verdict: feedback.textContent,
          fills: [...document.querySelectorAll('.benchmark-figure .scene-token-fill')].map(fill => {
            const animation = fill.getAnimations().find(item => !(item instanceof CSSTransition)), frames = animation?.effect.getKeyframes() || [];
            return animation ? { moved: frames[0].width !== frames.at(-1).width, final: frames.at(-1).width === fill.style.width, delay: animation.effect.getTiming().delay, duration: animation.effect.getTiming().duration } : null; }) };
      })()`);
      assert.ok(reveal.onScreen, `${width}px: the figure stays on screen while the price move plays: ` + JSON.stringify(reveal));
      assert.ok(reveal.gap < 170 && reveal.together, `${width}px: the slider sits right under the bars it moves, on one screen with them: ` + JSON.stringify(reveal));
      assert.ok(reveal.fills.every(bar => bar && bar.moved && bar.final && bar.delay >= 300 && bar.duration >= 700), 'The revealed price move plays both bars from the starting value: ' + JSON.stringify(reveal.fills));
      assert.equal(await evaluate(figureTop), placed, 'The slider and the verdict appear without moving the figure.');
      assert.match(reveal.verdict, /differs from your prediction[\s\S]*Less\./);
      assert.ok(reveal.afterSlider, 'The verdict follows the slider.');
      await motionSettled(evaluate);

      // Keyboard endpoints, then a touch drag that must not move the slider.
      await evaluate("document.getElementById('benchmark-price').focus()");
      for (const key of ['End', 'Home']) {
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
        assert.equal(await evaluate("document.getElementById('benchmark-price').value"), await evaluate(`document.getElementById('benchmark-price').${key === 'End' ? 'max' : 'min'}`));
      }
      await evaluate("document.getElementById('benchmark-price').scrollIntoView({block:'center'})"); await settle(evaluate);
      const slider = await evaluate("(r => ({left:r.left,top:r.top,width:r.width,height:r.height}))(document.getElementById('benchmark-price').getBoundingClientRect())");
      assert.ok(slider.height >= 44);
      const point = fraction => ({ x: slider.left + 26 + (slider.width - 52) * fraction, y: slider.top + slider.height / 2, id: 0 });
      await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      try {
        await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
        for (const fraction of [.25, .5, .75, 1]) {
          await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] }); await settle(evaluate);
          assert.ok(Math.abs(await evaluate("document.getElementById('benchmark-price').getBoundingClientRect().top") - slider.top) < 1, 'Changing numbers must not move the slider during a drag.');
        }
        await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally { await call('Emulation.setTouchEmulationEnabled', { enabled: false }); }
      assert.equal(await evaluate("document.getElementById('benchmark-price').value"), await evaluate("document.getElementById('benchmark-price').max"));
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    }
    // Reduced motion shows the outcome at once.
    await evaluate("document.getElementById('learn-variation').click()");
    await reduceMotion({ call, evaluate });
    await evaluate("document.getElementById('learn-reveal').click()");
    assert.deepEqual(await evaluate("[document.querySelector('.benchmark-figure').getAnimations({subtree:true}).length, document.getElementById('benchmark-at').textContent]"), [0, 'ETH at $750.00']);
  } finally {
    await call('Emulation.setEmulatedMedia', { features: [] });
    await evaluate(`${kept === null ? `localStorage.removeItem('${progressKey}')` : `localStorage.setItem('${progressKey}', ${JSON.stringify(kept)})`}`);
  }
  console.log('PASS: lesson 4 at 390px/320px keeps the bars with their slider, plays the reveal after the page lands, supports keyboard endpoints and stable touch dragging, and respects reduced motion');
}
