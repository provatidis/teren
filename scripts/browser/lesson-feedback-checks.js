import assert from 'node:assert/strict';

export async function checkLessonFeedback({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (prefix, group, value) => evaluate(`document.querySelector('input[name="${prefix}-${group}"][value="${value}"]').click()`);
  const cases = [
    ['learn.html#lesson=swap-impact', 'learn', 'same', 'less', 'curve', 'deeper-less', 'learn-reasons', 'learn-applications', 'learn-run'],
    ['learn.html#manage=fee-tiers', 'manage', 'a', 'unknown', 'trades', 'no', 'manage-reasons', 'manage-applications', 'manage-reveal'],
    ['learn.html#applied=period-vs-holding', 'applied', 'fees-win', 'can-trail', 'basket', 'hold', 'applied-reasons', 'applied-applications', 'applied-reveal'],
    ['lending.html#lesson=conditions', 'lend', 'higher', 'lower', 'interest', 'backing-faster', 'lend-reason-choices', 'lend-application-choices', 'lend-reveal'],
  ];
  const ready = () => evaluate(`new Promise(resolve => {
    const check = () => document.getElementById('learn-applied')?.getAttribute('aria-busy') === 'true' ? setTimeout(check, 25) : resolve(); check();
  })`);
  const resetVariation = async prefix => {
    await click(prefix + '-variation');
    for (let i = 0; i < 3 && !(await text(prefix + '-variation-label')).includes('1 of 3'); i++) await click(prefix + '-variation');
  };
  for (const width of [1440, 390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 750 });
    for (const [route, prefix, wrong, right, reason, application, reasons, applications, reveal] of cases) {
      await navigate(base + route); await ready();
      if (prefix === 'learn' || prefix === 'manage') await resetVariation(prefix);
      await choose(prefix, 'prediction', wrong);
      const neutral = await evaluate(`(() => { const choice = document.querySelector('#${prefix}-prediction-field input:checked').closest('label'); const style = getComputedStyle(choice); return style.borderTopColor === style.color; })()`);
      assert.equal(neutral, true, 'A selected guess has no green correctness cue.');
      await click(reveal);
      assert.equal(await evaluate(`document.getElementById('${prefix}-prediction-feedback').dataset.state`), 'different');
      assert.match(await text(prefix + '-prediction-feedback'), /^The result differs from your prediction\./);
      const wrongColor = await evaluate(`getComputedStyle(document.getElementById('${prefix}-prediction-feedback')).borderLeftColor`);
      await choose(prefix, 'prediction', right); await click(reveal);
      assert.equal(await evaluate(`document.getElementById('${prefix}-prediction-feedback').dataset.state`), 'match');
      assert.notEqual(await evaluate(`getComputedStyle(document.getElementById('${prefix}-prediction-feedback')).borderLeftColor`), wrongColor);
      assert.doesNotMatch(await text(prefix + '-prediction-feedback'), /In this setup:/, 'The finding explains an outcome, rather than echoing an option fragment.');
      await choose(prefix, 'reason', reason);
      await evaluate(`document.querySelector('#${applications} input:not([value="${application}"])').click()`);
      await click(prefix + '-check');
      assert.equal(await evaluate(`document.getElementById('${reasons}-feedback').dataset.state`), 'match');
      assert.equal(await evaluate(`document.getElementById('${applications}-feedback').dataset.state`), 'different');
      assert.equal(await evaluate('document.activeElement.id'), applications + '-feedback');
      const correction = await evaluate(`(() => {
        const feedback = document.getElementById('${applications}-feedback');
        const field = feedback.closest('fieldset');
        const question = field.querySelector('legend');
        const choice = field.querySelector('input:checked').closest('label');
        const inset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        return { questionVisible: question.getBoundingClientRect().top >= inset - 1,
          choiceVisible: choice.getBoundingClientRect().bottom <= innerHeight,
          named: feedback.getAttribute('aria-labelledby').split(' ').includes(question.id),
          described: !!document.getElementById(feedback.getAttribute('aria-describedby'))?.textContent };
      })()`);
      assert.deepEqual(correction, { questionVisible: true, choiceVisible: true, named: true, described: true }, route + ': correction keeps the question and selected answer visible and names them for assistive technology');
      assert.equal(await evaluate(`document.getElementById('${prefix}-continue').hidden`), true);
      assert.ok((await text(applications + '-feedback')).length > 80, 'An explanation is available on the first check.');
      await choose(prefix, 'application', application);
      assert.equal(await evaluate(`document.querySelector('[data-check="${prefix}"]') === null`), true, 'Changing an answer clears stale feedback.');
      await click(prefix + '-check');
      assert.equal(await text(prefix + '-feedback-title'), 'Both answers are correct.');
      await reload(); await ready();
      assert.equal(await text(prefix + '-feedback-title'), 'Both answers are correct.');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    }
    await navigate(base + 'learn.html#lesson=range-boundaries');
    await resetVariation('learn');
    await click('learn-run');
    assert.match(await text('boundary-scene-tokens'), /0.0000 ETH/);
    const guidesFit = () => evaluate(`(() => [...document.querySelectorAll('.scene-range-guide')].filter(guide => guide.checkVisibility()).every(guide => {
      const band = guide.querySelector('.scene-range-band').getBoundingClientRect();
      const bounds = ['lower', 'upper'].map(edge => guide.querySelector('.scene-range-' + edge));
      return bounds.every((row, index) => {
        const tick = row.querySelector('.scene-range-tick').getBoundingClientRect();
        const label = row.querySelector('.scene-range-bound-label').getBoundingClientRect();
        return Math.abs(tick.left - (index ? band.right : band.left)) < 2
          && label.left >= 0 && label.right <= innerWidth;
      }) && bounds[0].getBoundingClientRect().bottom <= bounds[1].getBoundingClientRect().top;
    }))()`);
    assert.equal(await guidesFit(), true, 'Boundary labels align with the band instead of pretending to be scale endpoints.');
    assert.equal(await evaluate(`(() => {
      const guide = document.querySelector('#learn-scene .scene-range-guide');
      return guide.querySelector('.scene-range-marker').getBoundingClientRect().left > guide.querySelector('.scene-range-band').getBoundingClientRect().right;
    })()`), true, 'The above-range question price is visibly beyond its upper boundary.');
    const handoff = await evaluate("document.getElementById('learn-explore').href");
    const progress = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
    await evaluate("[...document.querySelectorAll('#learn-scene .scene-shortcut')].find(button => button.textContent==='Just inside upper').click()");
    assert.match(await text('boundary-scene-status'), /Inside range/);
    assert.ok(await evaluate("document.getElementById('boundary-scene-status').getBoundingClientRect().height >= 24"), 'The range status must remain readable on phones.');
    assert.doesNotMatch(await text('boundary-scene-tokens'), /^0.0000 ETH/);
    assert.equal(await evaluate("document.getElementById('learn-explore').href"), handoff);
    assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), progress);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    for (const value of ['0.05', '0.5']) {
      await evaluate(`(() => { const field = document.getElementById('learn-input-width'); field.value = '${value}'; field.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      assert.equal(await guidesFit(), true, 'Narrow and wide boundary labels remain on screen.');
    }
    await navigate(base + 'learn.html#manage=range-width');
    await fill('range-scene-price', '2090');
    assert.match(await text('range-scene-gap-narrow'), /\$50.10/);
    assert.match(await text('range-scene-gap-wide'), /\$10.34/);
    assert.equal(await guidesFit(), true);
    await evaluate("document.querySelector('button[aria-label=\"Narrow upper boundary: $2,100.00\"]').click()");
    assert.equal(await evaluate("document.getElementById('range-scene-price').value"), '2100');
    assert.equal(await text('range-scene-narrow'), 'At boundary');
    await navigate(base + 'learn.html#applied=period-vs-holding'); await ready(); await click('applied-reveal');
    assert.equal(await guidesFit(), true, 'The recorded starting position uses the same correctly labelled scale.');
    assert.match(await text('applied-comparison'), /−\$0.51[\s\S]*\+\$0.17/);
    await evaluate("document.querySelector('#applied-comparison button').click()");
    assert.equal(await evaluate("document.getElementById('applied-checkpoint').value"), '6');
    assert.match(await text('applied-question-window'), /final block/);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    for (const lesson of ['build', 'unwind']) {
      const route = base + 'lending.html#loop-lesson=' + lesson;
      await navigate(route); await click('lend-reveal');
      const balances = () => evaluate(`['supplied', 'debt', 'wallet', 'selected'].map(id => document.getElementById('loop-flow-' + id).textContent)`);
      const outcome = await balances();
      if (lesson === 'build') { assert.equal(outcome[0], '7.5 ETH'); assert.equal(outcome[1], '5,000 USDC'); }
      else assert.equal(outcome[1], '0 USDC');
      const handoff = await evaluate("document.getElementById('lend-explore').href");
      await click('loop-flow-previous');
      assert.notDeepEqual(await balances(), outcome);
      await click('lend-reveal');
      assert.deepEqual(await balances(), outcome, 'Opening the explanation restores the assessed loop outcome.');
      await reload();
      assert.deepEqual(await balances(), outcome, 'Reload restores the same diagram as the revealed explanation.');
      await navigate(base + 'lending.html#lesson=supply'); await navigate(route);
      assert.deepEqual(await balances(), outcome, 'Returning to a revealed lesson restores its outcome.');
      assert.equal(await evaluate("document.getElementById('lend-explore').href"), handoff);
    }
  }
  console.log('PASS: distinct prediction outcomes, contextual correction, restored loop balances, aligned range guides and preserved handoffs at 1440/390/320px');
}
