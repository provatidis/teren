import assert from 'node:assert/strict';
import { lessonSetup, runLesson } from '../../public/models/lesson-experiments.js';
import { usd } from '../../public/lib/format.js';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkComparisonLessons({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="${group}"][value="${value}"]').click()`);
  const mode = label => evaluate(`Array.from(document.querySelectorAll('.comparison-modes button')).find(button=>button.textContent===${JSON.stringify(label)}).click()`);
  const saved = () => evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  const reset = async () => {
    await click('learn-variation');
    for (let i = 0; i < 3 && !(await text('learn-variation-label')).includes('1 of 3'); i++) await click('learn-variation');
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  // Lesson 7 keeps one worked example as an optional extra under "Look closer".
  // Lessons 4 and 5 and the challenge itself use the shared figure: see
  // benchmark-lesson-checks.js, fee-lesson-checks.js and learning-application-checks.js.
  const id = 'final-challenge', application = 'relative-gap';
  const reveal = () => click('learn-reveal');
  const openWorked = () => evaluate("document.querySelector('#learn-worked-comparison > summary').click()");
  const explored = () => evaluate("({price:document.getElementById('comparison-price').value,fees:document.getElementById('comparison-fees').value,profit:document.getElementById('comparison-profit').textContent,holding:document.getElementById('comparison-holding').textContent})");
  await navigate(base + 'learn.html#lesson=' + id); await reset();
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').checkVisibility()"), true);
  // The first step has one true answer: holding falls below the start only when ETH falls.
  assert.deepEqual(await evaluate("[document.querySelector('.scene-prediction-question').textContent, ...Array.from(document.querySelectorAll('#learn-predictions label'), label => label.textContent.trim())]"),
    ['Which price move can leave holding worth less than your start?', 'A fall in ETH', 'A rise in ETH', 'Either one']);
  assert.equal(await evaluate("document.querySelectorAll('#learn-controls input[type=range]').length"), 0, 'The question has no sliders of its own.');
  assert.equal(await evaluate("document.getElementById('learn-worked-comparison').checkVisibility()"), false, 'The worked example waits until the answer is shown.');
  await reveal();
  assert.equal(await evaluate("document.getElementById('learn-worked-comparison').checkVisibility()"), true);
  assert.equal(await evaluate("document.getElementById('learn-worked-comparison').open"), false, 'The worked example opens only when asked for.');
  assert.equal(await evaluate("document.getElementById('comparison-price').checkVisibility()"), false);
  await openWorked();
  assert.equal(await evaluate("document.getElementById('comparison-price').checkVisibility()"), true);
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.comparison-scene .comparison-heading > span'), label => label.textContent)"), ['Your start', 'Holding', 'Your claim'], 'The worked example uses the lesson’s names.');
  assert.equal(await text('comparison-scope'), 'Showing the worked example.');
  const before = await saved();
  await fill('comparison-price', '1000');
  assert.match(await text('comparison-profit'), /^Your claim is \$[\d,.]+ below your start\.$/);
  assert.match(await text('comparison-holding'), /^Your claim is \$[\d,.]+ behind holding\.$/);
  await fill('comparison-price', '4000');
  assert.match(await text('comparison-profit'), /above your start/);
  assert.match(await text('comparison-holding'), /behind holding/);
  await mode('Fees');
  const principal = await evaluate("document.querySelector('.comparison-scene [data-comparison=lp] .comparison-principal').style.width");
  await click('comparison-match');
  assert.equal(await text('comparison-holding'), 'Your claim matches holding.');
  assert.equal(await evaluate("document.querySelector('.comparison-scene [data-comparison=lp] .comparison-principal').style.width"), principal);
  await fill('comparison-fees', '2500');
  assert.match(await text('comparison-holding'), /ahead of holding/);
  assert.match(await text('comparison-parts'), /^Solid: \$7,071\.07 in tokens · Striped: \$2,500\.00 in fees$/);
  await mode('ETH price'); await fill('comparison-price', '1000'); await mode('Fees');
  assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '2500');
  assert.match(await text('comparison-match'), /\$214.47/);
  assert.match(await text('comparison-scope'), /^You changed the worked example\. It began with ETH at \$4,000\.00 and \$100\.00 in fees\.$/);
  assert.equal(await saved(), before, 'Exploration must not change the fixed example or progress.');
  // Answering afterwards keeps what was explored; showing the answer again
  // returns the example to its own case.
  const changed = await explored();
  await choose('learn-prediction', 'higher-price');
  assert.deepEqual(await explored(), changed, 'Answering the question preserves the explored example.');
  assert.equal(await text('learn-results-title'), 'Look closer');
  await reveal();
  assert.equal(await evaluate("document.getElementById('comparison-price').value"), '4000');
  assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '100');
  // One question follows the challenge, with two answers. It is about the reader's own example.
  const asked = [await text('learn-application-context'), await text('learn-application-question')];
  assert.deepEqual(asked, ['Think back to the price and fees you chose in your own example.', 'When your claim matches holding below your start, what have its fees covered?']);
  assert.deepEqual(await evaluate("[document.querySelectorAll('#learn-assessment-form fieldset').length, Array.from(document.querySelectorAll('input[name=learn-application]'), input => input.value).sort().join(), document.getElementById('learn-check').textContent]"),
    [1, 'capital-restored,relative-gap', 'Check this setup and answer →']);
  assert.equal(await evaluate("document.getElementById('learn-reason-context')"), null);
  await choose('learn-application', 'capital-restored');
  await click('liquidity-task-example');
  await click('learn-check');
  assert.deepEqual([await text('learn-feedback-title'), await text('learn-feedback-copy')], ['Review your answer.', 'Read the feedback beside the task or question, then try again.']);
  assert.match(await text('learn-applications-feedback'), /Holding itself is below your start in your example/);
  await choose('learn-application', application); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Challenge done.');
  const task = await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['final-challenge']?.task)");
  const taskFeedback = await text('liquidity-task-feedback');
  await choose('learn-prediction', 'lower-price');
  assert.equal(await evaluate("document.querySelector('input[name=learn-application]:checked').value"), application);
  assert.equal(await evaluate("document.getElementById('learn-feedback').hidden"), false);
  assert.equal(await text('learn-feedback-title'), 'Challenge done.');
  assert.equal(await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['final-challenge'].task)"), task);
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1')).drafts['final-challenge'].taskChecked"), true);
  assert.equal(await evaluate("document.getElementById('liquidity-task-feedback').hidden"), false);
  assert.equal(await text('liquidity-task-feedback'), taskFeedback);
  await reveal();
  assert.equal(await text('liquidity-task-feedback'), taskFeedback);
  assert.equal(await evaluate("document.getElementById('liquidity-task-feedback').hidden"), false, 'Showing the answer again keeps checked task feedback.');
  // The lab link opens the reader's own example. Exploring the worked example does not move it.
  const link = await evaluate("document.getElementById('learn-explore').href");
  assert.match(link, /future=1500/);
  assert.equal(await text('learn-explore'), 'Open your example in the full-range lab ↗');
  assert.equal(await text('learn-explore-question'), 'Does your example still match holding once costs are counted?');
  assert.match(await text('learn-explore-note'), /^Opens ETH at \$1,500\.00 with \$44\.87 in fees, in a new tab\. Add the costs there\.$/);
  await fill('comparison-price', '1000');
  assert.deepEqual([await text('learn-application-context'), await text('learn-application-question')], asked);
  assert.equal(await evaluate("document.getElementById('learn-explore').href"), link);
  await reload();
  assert.equal(await text('learn-feedback-title'), 'Challenge done.');
  assert.equal(await evaluate("document.getElementById('comparison-price').value"), '4000');
  assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '100');
  assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked').value"), 'lower-price');
  for (let variant = 0; variant < 3; variant++) {
    if (variant) { await click('learn-variation'); await reveal(); }
    const question = runLesson(id, lessonSetup(id, variant), variant);
    assert.equal(await text('comparison-hold-value'), usd(question.result.holdValue));
    assert.equal(await text('comparison-lp-value'), usd(question.result.lpValue));
    assert.equal(await text('comparison-start-value'), usd(question.setup.investment));
  }
  console.log('PASS: lesson 7’s optional worked example in the lesson’s names, all variants, fixed benchmarks, exact fee target, mode preservation, isolated exploration and restored completion');

  await reset(); await reveal();
  await evaluate("{const progress=JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1'));Object.assign(progress.drafts['final-challenge'].inputs,{futurePrice:2033.25,fees:123.45});localStorage.setItem('degenerator-learning-liquidity-v1',JSON.stringify(progress));}");
  await reload();
  assert.equal(await evaluate("document.getElementById('comparison-price').value"), '2033.25');
  assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '123.45');
  // A saved worked example keeps its own price and fees in the result card's link.
  assert.match(await evaluate("document.getElementById('learn-share-url').value"), /future=2033.25.*fees=123.45/);
  assert.equal(await evaluate("document.querySelectorAll('#learn-controls input[type=range]').length"), 0);
  console.log('PASS: fractional legacy question prices and fees survive editor removal without snapping and retain their exact handoff');

  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    {
      await navigate(base + 'learn.html#lesson=' + id); await reset();
      await reveal(); await openWorked(); await mode('Fees');
      const slider = 'comparison-fees';
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      const fit = await evaluate(`({height:document.getElementById('${slider}').getBoundingClientRect().bottom-document.querySelector('.comparison-scene .comparison-figure').getBoundingClientRect().top,available:innerHeight-document.querySelector('.topbar').getBoundingClientRect().height})`);
      assert.ok(fit.height <= fit.available, `${id} at ${width}px: figure/control height ${fit.height} must fit in ${fit.available}px.`);
      await evaluate(`document.getElementById('${slider}').focus()`);
      for (const key of ['End', 'Home']) {
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
        assert.equal(await evaluate(`document.getElementById('${slider}').value`), await evaluate(`document.getElementById('${slider}').${key === 'End' ? 'max' : 'min'}`));
      }
      await evaluate(`document.getElementById('${slider}').scrollIntoView({block:'center'})`); await settle(evaluate);
      const box = await evaluate(`(()=>{const r=document.getElementById('${slider}').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()`);
      assert.ok(box.height >= 44);
      const point = fraction => ({ x: box.left + 26 + (box.width - 52) * fraction, y: box.top + box.height / 2, id: 0 });
      await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      try {
        await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
        for (const fraction of [.25, .5, .75, 1]) {
          await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] }); await settle(evaluate);
          assert.ok(Math.abs(await evaluate(`document.getElementById('${slider}').getBoundingClientRect().top`) - box.top) < 1, 'Changing numbers must not move the slider during a drag.');
        }
        await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally { await call('Emulation.setTouchEmulationEnabled', { enabled: false }); }
      assert.equal(await evaluate(`document.getElementById('${slider}').value`), await evaluate(`document.getElementById('${slider}').max`));
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    }
  }
  await call('Emulation.setEmulatedMedia', { features: [] });
  console.log('PASS: the worked example and its controls fit at 390px/320px, with keyboard endpoints, stable touch sliders and immediate reduced-motion frames');
}
