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
  for (const [id, reason, application] of [['loss-vs-profit', 'traded-mix', 'holding-basket'], ['fee-break-even', 'assumption', 'gap-reopens'], ['final-challenge', 'total', 'relative-gap']]) {
    await navigate(base + 'learn.html#lesson=' + id); await reset();
    assert.equal(await evaluate("document.getElementById('learn-run').disabled"), false);
    assert.equal(await evaluate("document.querySelector('.scene-prediction-question').checkVisibility()"), true);
    const before = await saved();
    if (id !== 'fee-break-even') {
      await fill('comparison-price', '1000');
      assert.match(await text('comparison-profit'), /below the starting capital/);
      assert.match(await text('comparison-holding'), /below holding/);
      await fill('comparison-price', '4000');
      assert.match(await text('comparison-profit'), /above the starting capital/);
      assert.match(await text('comparison-holding'), /below holding/);
    }
    if (id !== 'loss-vs-profit') {
      if (id === 'final-challenge') await mode('Assumed fees');
      const principal = await evaluate("document.querySelector('[data-comparison=lp] .comparison-principal').style.width");
      await click('comparison-match');
      assert.equal(await text('comparison-holding'), 'LP + fees matches holding.');
      assert.equal(await evaluate("document.querySelector('[data-comparison=lp] .comparison-principal').style.width"), principal);
      await fill('comparison-fees', '2500');
      assert.match(await text('comparison-holding'), /above holding/);
      if (id === 'final-challenge') {
        await mode('ETH price'); await fill('comparison-price', '1000'); await mode('Assumed fees');
        assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '2500');
        assert.match(await text('comparison-match'), /\$214.47/);
      }
    }
    assert.equal(await saved(), before, 'Exploration must not change the fixed question or progress.');
    await click('learn-run');
    assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked')===null"), true);
    assert.match(await text('comparison-scope'), /^Showing the question setup/);
    const questionEvidence = await text('learn-application-evidence');
    if (id === 'fee-break-even') {
      for (const phrase of ['Starting ETH price', '$2,000.00', 'fees covered the gap', '$4,000.00', 'Later ETH price', '$6,000.00']) assert.ok(questionEvidence.includes(phrase));
      assert.equal(await evaluate("document.getElementById('learn-application-evidence').hidden"), false);
      await fill('comparison-fees', '2500');
      assert.equal(await text('learn-application-evidence'), questionEvidence, 'Exploring assumed fees must not change the changed-price evidence beside the application.');
      await choose('learn-reason', reason); await choose('learn-application', 'still-matches');
      await click('learn-check');
      assert.match(await text('learn-applications-feedback'), /Matching holding at one price does not lock in that result/);
      assert.equal(await text('learn-feedback-title'), 'Review your answers.');
    } else if (id === 'loss-vs-profit') {
      for (const phrase of ['Original deposit', '$5,000.00', 'Position tokens, excluding fees', '$7,071.07', 'Fees, held separately', '$180.00', '$7,251.07']) assert.ok(questionEvidence.includes(phrase));
      assert.match(await evaluate("document.querySelector('#learn-application-evidence a').href"), /future=4000.*fees=180/);
      assert.equal(await evaluate("document.querySelector('#learn-application-evidence a').target"), '_blank');
      await fill('comparison-price', '1000');
      assert.equal(await text('learn-application-evidence'), questionEvidence, 'Exploring a price must not rewrite the dashboard question.');
      await choose('learn-reason', reason); await choose('learn-application', 'original-deposit'); await click('learn-check');
      assert.match(await text('learn-applications-feedback'), /dollar return already shown/);
    } else assert.equal(await evaluate("document.getElementById('learn-application-evidence').hidden"), true);
    await choose('learn-reason', reason); await choose('learn-application', application);
    if (id === 'final-challenge') await click('liquidity-task-example');
    await click('learn-check');
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
    const link = await evaluate("document.getElementById('learn-explore').href");
    assert.match(link, /future=4000/);
    assert.match(link, id === 'loss-vs-profit' ? /fees=0/ : /fees=100/);
    if (id === 'fee-break-even') await fill('comparison-fees', '0');
    else await fill('comparison-price', '1000');
    assert.equal(await text('learn-application-evidence'), questionEvidence);
    assert.equal(await evaluate("document.getElementById('learn-explore').href"), link);
    await reload();
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
    assert.match(await text('comparison-scope'), /^Showing the question setup/);
    assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked')===null"), true);
    for (let variant = 0; variant < 3; variant++) {
      if (variant) { await click('learn-variation'); await click('learn-run'); }
      const question = runLesson(id, lessonSetup(id, variant), variant);
      assert.equal(await text('comparison-hold-value'), usd(question.result.holdValue));
      assert.equal(await text('comparison-lp-value'), usd(question.result.lpValue));
      assert.equal(await text('comparison-start-value'), usd(question.setup.investment));
      if (id === 'loss-vs-profit') {
        if (variant === 1) {
          assert.equal(await text('learn-application-label'), 'Withdrawing the position');
          assert.equal(await evaluate("document.getElementById('learn-application-evidence').hidden"), true);
          await choose('learn-reason', question.reason); await choose('learn-application', 'gap-unchanged'); await click('learn-check');
          assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
        } else if (variant === 2) {
          await choose('learn-reason', question.reason); await choose('learn-application', 'holding-basket'); await click('learn-check');
          assert.match(await text('learn-applications-feedback'), /48.47 ahead of holding/);
        }
      }
    }
  }
  console.log('PASS: three comparison lessons, all variants, optional predictions, fixed benchmarks, exact fee target, mode preservation, isolated exploration and restored conceptual completion');

  await reset(); await click('learn-run');
  await fill('learn-input-futurePrice', '2000'); await fill('learn-input-fees', '125');
  assert.equal(await evaluate("document.getElementById('learn-results').hidden"), true);
  assert.equal(await evaluate("document.querySelector('input[name=learn-reason]:checked')===null"), true);
  await click('learn-run');
  await evaluate("{const progress=JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1'));Object.assign(progress.drafts['final-challenge'].inputs,{futurePrice:2033.25,fees:123.45});localStorage.setItem('degenerator-learning-liquidity-v1',JSON.stringify(progress));}");
  await reload();
  assert.equal(await evaluate("document.getElementById('comparison-price').value"), '2033.25');
  assert.equal(await evaluate("document.getElementById('comparison-fees').value"), '123.45');
  assert.match(await evaluate("document.getElementById('learn-explore').href"), /future=2033.25.*fees=123.45/);
  console.log('PASS: explicit question edits invalidate old answers; fractional saved price and fees restore without snapping and retain their exact handoff');

  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    for (const id of ['loss-vs-profit', 'fee-break-even', 'final-challenge']) {
      await navigate(base + 'learn.html#lesson=' + id); await reset();
      if (id === 'final-challenge') await mode('Assumed fees');
      const slider = id === 'loss-vs-profit' ? 'comparison-price' : 'comparison-fees';
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      const fit = await evaluate(`({height:document.getElementById('${slider}').getBoundingClientRect().bottom-document.querySelector('.comparison-figure').getBoundingClientRect().top,available:innerHeight-document.querySelector('.topbar').getBoundingClientRect().height})`);
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
      if (id === 'fee-break-even' || id === 'loss-vs-profit') {
        await click('learn-run');
        assert.equal(await evaluate("document.getElementById('learn-application-evidence').hidden"), false);
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      }
    }
  }
  await call('Emulation.setEmulatedMedia', { features: [] });
  console.log('PASS: comparison figures and controls fit at 390px/320px, with keyboard endpoints, stable touch sliders and immediate reduced-motion frames');
}
