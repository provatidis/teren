import assert from 'node:assert/strict';
import { YIELD_LESSONS } from '../../public/learning/yield-lessons.js';
import { dragRangeToMax } from './touch-range.js';

const progressKey = 'teren-yield-learning-v1';
const draftKey = 'teren-split-yield-v1';
const route = id => 'yield-learn.html#lesson=' + id;
const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const visible = (evaluate, id) => evaluate('document.getElementById(' + JSON.stringify(id) + ').checkVisibility()');
const select = (evaluate, selector) => evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()');

export async function checkSkippedYieldPrediction({ evaluate, call, reload, text }) {
  const selected = () => evaluate("document.querySelector('#yl-prediction-choices input:checked')?.value || null");
  assert.equal(await selected(), null);
  assert.equal(await text('yl-reveal'), 'Not sure — show me →');
  assert.equal(await visible(evaluate, 'yl-observe'), false);
  await evaluate("document.getElementById('yl-reveal').focus()");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await visible(evaluate, 'yl-observe'), true);
  assert.equal(await evaluate("document.getElementById('yl-prediction-feedback').dataset.state"), 'skipped');
  assert.equal(await selected(), null, 'Showing the outcome does not invent a guess.');
  await reload();
  assert.equal(await text('yl-reveal'), 'Show the outcome again ↓');
  assert.equal(await selected(), null);
  assert.equal(await visible(evaluate, 'yl-observe'), true);
}

async function tap(evaluate, call, selector) {
  const target = JSON.stringify(selector);
  await evaluate('document.querySelector(' + target + ').scrollIntoView({block:"center",behavior:"instant"})');
  await settle(evaluate);
  await call('Page.captureScreenshot', { format: 'jpeg', quality: 10, captureBeyondViewport: false });
  const point = await evaluate(`(() => {
    const button = document.querySelector(${target}), rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    if (!button.contains(document.elementFromPoint(x, y))) throw Error('Touch target is covered: ' + ${target});
    return {x, y};
  })()`);
  await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(evaluate);
}

async function checkPhoneLessons({ evaluate, call, navigate, base, reload, text }, width) {
  await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate('localStorage.removeItem(' + JSON.stringify(progressKey) + ')');
  for (const lesson of YIELD_LESSONS) {
    await navigate(base + route(lesson.id));
    const entry = await evaluate(`(() => {
      const heading = document.getElementById('yl-title').getBoundingClientRect();
      const header = document.querySelector('.topbar').getBoundingClientRect();
      const setup = document.querySelector('article .learn-setup');
      const options = document.getElementById('yl-prediction-choices');
      return { focus: document.activeElement.id, headingTop: heading.top, headerBottom:header.bottom,
        setupFirst: setup.getBoundingClientRect().bottom <= options.getBoundingClientRect().top,
        setupSize: parseFloat(getComputedStyle(setup).fontSize), hasChoices: options.querySelector('label').checkVisibility() };
    })()`);
    assert.equal(entry.focus, 'yl-title', 'Direct lesson link focuses its heading: ' + lesson.id);
    assert.ok(entry.headingTop >= entry.headerBottom - 1 && entry.headingTop < entry.headerBottom + 180, 'Heading clears navigation: ' + JSON.stringify(entry));
    assert.ok(entry.setupFirst && entry.setupSize >= 15 && entry.hasChoices, 'The premise is readable before the question.');
    await checkSkippedYieldPrediction({ evaluate, call, reload, text });
    const initial = await text('yl-scene');
    const selector = '#yl-stage-controls button[aria-pressed="false"]';
    assert.ok(await evaluate(`[...document.querySelectorAll('#yl-stage-controls button')].every(b => b.getBoundingClientRect().height >= 44)`));
    await tap(evaluate, call, selector);
    assert.notEqual(await text('yl-scene'), initial, 'A native tap explores another point in the story.');
    if (lesson.id === 'split') {
      await tap(evaluate, call, '#yl-stage-controls button:nth-child(2)');
      const receipt = await evaluate(`(() => {
        const item = document.querySelector('.yl-transfer');
        const [label, direction, amount] = [...item.children].map(node => node.getBoundingClientRect());
        return { text:item.textContent, labelEnd:label.bottom, directionTop:direction.top,
          directionEnd:direction.right, amountStart:amount.left, bottom:item.getBoundingClientRect().bottom,
          captionTop:document.getElementById('yl-scene-caption').getBoundingClientRect().top };
      })()`);
      assert.match(receipt.text, /Payment for YT YT buyer.*Your wallet 20 USDC/);
      assert.ok(receipt.labelEnd <= receipt.directionTop && receipt.directionEnd < receipt.amountStart &&
        receipt.bottom <= receipt.captionTop, 'The payment label, direction and amount stay distinct on a phone.');
    }
    if (lesson.id === 'timing') {
      for (const [index, days] of [80, 10].entries()) {
        await tap(evaluate, call, '#yl-stage-controls button:nth-child(' + (index + 1) + ')');
        const strip = await evaluate(`(() => {
          const group = document.querySelector('.yl-time-path');
          return { labels:[...group.querySelectorAll('.yl-time-labels span')].map(node => node.textContent),
            widths:[...group.querySelectorAll('rect')].map(rect => rect.getBoundingClientRect().width) };
        })()`);
        assert.deepEqual(strip.labels, [days + ' days at 5%', (90 - days) + ' days at 15%']);
        const [first, last] = strip.widths;
        assert.ok(Math.abs(first / (first + last) - days / 90) < .001, 'The rate strip shows actual days at each rate.');
      }
    }
    const fits = await evaluate(`({content:document.documentElement.scrollWidth,width:innerWidth,
      scale:visualViewport.scale, setup:document.querySelector('.learn-setup').getBoundingClientRect().right,
      scene:document.getElementById('yl-scene').getBoundingClientRect().right})`);
    assert.ok(fits.content <= width && fits.width === width && fits.scale === 1 && fits.setup <= width && fits.scene <= width, JSON.stringify(fits));
  }
}

// Lessons 3 and 4 put a slider under the drawing. The named cases stay as
// buttons above it; exploring never touches the question or saved answers.
async function checkYieldLessonSliders({ evaluate, call, navigate, base }) {
  const fill = (id, value) => evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); el.value = ${JSON.stringify(String(value))}; el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const state = () => evaluate(`({
    value: document.getElementById('yl-scene-slider').value, output: document.getElementById('yl-scene-slider-value').textContent,
    scope: document.getElementById('yl-scene-slider-scope').textContent, caption: document.getElementById('yl-scene-caption').textContent,
    pressed: [...document.querySelectorAll('#yl-stage-controls button')].map(button => button.getAttribute('aria-pressed')),
    labels: [...document.querySelectorAll('.yl-time-labels span')].map(node => node.textContent),
    bars: Object.fromEntries([...document.querySelectorAll('.yl-bar')].map(row => [row.dataset.role, Number(row.querySelector('progress').value)])),
    pt: document.querySelector('.yl-claim[data-role=pt] dd')?.textContent || null,
    saved: localStorage.getItem(${JSON.stringify(progressKey)}),
  })`);
  for (const width of [390, 320]) for (const lesson of YIELD_LESSONS) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate('localStorage.removeItem(' + JSON.stringify(progressKey) + ')');
    await navigate(base + route(lesson.id));
    const explore = lesson.scene.explore;
    assert.equal(await visible(evaluate, 'yl-scene-explorer'), Boolean(explore), 'Only lessons with a continuous condition show a slider: ' + lesson.id);
    if (!explore) continue;
    const start = await state();
    assert.deepEqual([start.value, start.pressed], [String(explore.values[0]), ['true', 'false']], 'The slider starts on the first named case.');
    const order = await evaluate(`(() => { const top = id => document.getElementById(id).getBoundingClientRect().top;
      return top('yl-stage-controls') < top('yl-scene-drawing') && top('yl-scene-drawing') < top('yl-scene-slider') && top('yl-scene-slider') < top('yl-scene-caption'); })()`);
    assert.ok(order, 'Named cases above the drawing, the slider under it and the caption last.');
    await dragRangeToMax({ evaluate, call, fill }, 'yl-scene-slider');
    const dragged = await state();
    assert.deepEqual(dragged.pressed, ['false', 'false'], 'No named case is pressed while exploring another value.');
    assert.match(dragged.scope, /^Exploring /);
    assert.equal(dragged.saved, start.saved, 'Exploring never saves or changes an answer.');
    await evaluate("document.querySelectorAll('#yl-stage-controls button')[1].click()");
    const named = await state();
    assert.deepEqual([named.value, named.pressed, named.caption], [String(explore.values[1]), ['false', 'true'], lesson.scene.stages[1].caption], 'A named case moves the slider and shows its own caption.');
    await fill('yl-scene-slider', explore.values[0]);
    assert.deepEqual((await state()).pressed, ['true', 'false'], 'Reaching a named value by dragging presses its button.');
    if (lesson.id === 'timing') {
      assert.deepEqual(dragged.labels, ['89 days at 5%', '1 day at 15%']);
      assert.match(dragged.caption, /for the last 1 day\. .*short of the 20 USDC they paid\.$/);
      const rows = [];
      for (const day of [1, 30, 54, 55, 89]) {
        await fill('yl-scene-slider', day);
        const view = await state();
        assert.equal(view.output, 'Day ' + day);
        rows.push([day, view.bars.yt, view.bars.cash, /more than/.test(view.caption)]);
      }
      assert.ok(rows.every(([, interest, cost]) => cost === 20) && rows.every((row, i) => !i || row[1] < rows[i - 1][1]), 'A later rise always earns less interest for the same 20 USDC: ' + JSON.stringify(rows));
      assert.deepEqual(rows.map(row => row[3]), [true, true, true, false, false], 'The buyer comes out ahead only when the rise comes by day 54.');
    } else {
      assert.equal(dragged.output, '20%');
      const rows = [];
      for (const apy of [0, 5, 10, 15, 20]) {
        await fill('yl-scene-slider', apy);
        const view = await state();
        rows.push([apy, Number(view.pt.replace(/[^0-9.]/g, '')), view.bars.sale, view.bars.earned]);
      }
      assert.equal(rows[0][2], 0, 'At 0% the remaining interest is worth nothing to a buyer.');
      assert.ok(rows.every((row, i) => !i || (row[1] < rows[i - 1][1] && row[2] > rows[i - 1][2] && row[3] === rows[0][3])),
        'A higher implied APY lowers the PT offer, raises the YT offer and leaves the earned interest alone: ' + JSON.stringify(rows));
    }
    await evaluate("document.getElementById('yl-reveal').click()");
    assert.equal((await state()).value, String(explore.values[lesson.scene.outcome]), 'Showing the outcome returns the slider to the question’s case.');
  }
  await evaluate('localStorage.removeItem(' + JSON.stringify(progressKey) + ')');
  console.log('PASS: yield lessons 3 and 4 explore a rise day and an implied APY with a slider under the drawing at 390/320px, keep named cases and saved answers');
}

export async function checkYieldLearning({ evaluate, click, text, navigate, reload, base, call, nextEvent }) {
  await navigate(base);
  const before = await evaluate('({local: {...localStorage}, session: {...sessionStorage}})');
  const choice = (group, id) => select(evaluate, '#yl-' + group + '-choices input[value="' + id + '"]');
  const feedback = group => evaluate("document.getElementById('yl-" + group + "-choices-feedback').dataset.state");
  try {
    await evaluate('localStorage.removeItem(' + JSON.stringify(progressKey) + ')');
    await navigate(base + 'yield.html');
    await evaluate("const budget = document.getElementById('split-budget'); budget.value='1234'; budget.dispatchEvent(new Event('input', {bubbles:true}))");
    const experimentDraft = await evaluate('localStorage.getItem(' + JSON.stringify(draftKey) + ')');
    assert.ok(experimentDraft, 'Start with a real saved lab setup that differs from every lesson.');
    await navigate(base);
    const homeExperiment = await evaluate("document.getElementById('home-experiment').href");
    const opened = nextEvent('Page.loadEventFired');
    await select(evaluate, '.home-learn-link[href="' + route('split') + '"]');
    await opened;
    assert.equal(await text('yl-title'), YIELD_LESSONS[0].title);
    let completed = 0;
    for (const lesson of YIELD_LESSONS) {
      const { id, prediction, reason, application } = lesson;
      if (id !== 'split') await navigate(base + route(id));
      assert.equal(await text('yl-title'), lesson.title);
      assert.equal(await visible(evaluate, 'yl-observe'), false);
      assert.equal(await evaluate("document.querySelectorAll('#yl-stage-controls').length"), 1);
      const colors = {};
      for (const [answer] of prediction.choices) {
        await choice('prediction', answer);
        await click('yl-reveal');
        const matched = answer === prediction.correct;
        assert.equal(await evaluate("document.getElementById('yl-prediction-feedback').dataset.state"), matched ? 'match' : 'different');
        colors[matched] = await evaluate("getComputedStyle(document.getElementById('yl-prediction-feedback')).borderLeftColor");
      }
      assert.notEqual(colors.true, colors.false, 'Correct and different predictions have distinct visual signals.');
      const link = await evaluate("({ href:document.getElementById('yl-explore').href, target:document.getElementById('yl-explore').target })");
      assert.equal(link.target, '_blank');
      assert.equal(link.href, new URL(lesson.experimentHref, base).href);
      assert.equal(await visible(evaluate, 'yl-explore-note'), id === 'exit');
      if (id === 'exit') {
        assert.equal(await text('yl-explore'), 'Explore the 15% offer ↗');
        assert.match(await text('yl-explore-note'), /day-45.*15%.*original 8\.54% implied APY/);
      }
      const beforeExplore = await text('yl-scene');
      await select(evaluate, '#yl-stage-controls button[aria-pressed="false"]');
      assert.notEqual(await text('yl-scene'), beforeExplore);
      assert.equal(await evaluate("document.getElementById('yl-explore').href"), link.href);
      await choice('reason', reason.correct);
      const wrong = application.choices.find(([option]) => option !== application.correct)[0];
      await choice('application', wrong);
      await click('yl-check');
      assert.equal(await feedback('reason'), 'match');
      assert.equal(await feedback('application'), 'different');
      assert.ok((await text('yl-application-choices-feedback')).includes(application.feedback[wrong]));
      assert.equal(await evaluate('document.activeElement.id'), 'yl-application-choices-feedback');
      await choice('application', application.correct);
      await click('yl-check');
      completed++;
      assert.equal(await feedback('application'), 'match');
      assert.match(await text('yl-progress'), new RegExp(completed + ' of 4'));
      await reload();
      assert.equal(await visible(evaluate, 'yl-observe'), true);
      assert.equal(await feedback('application'), 'match', 'Reload keeps the completed check.');
      await navigate(link.href);
      assert.equal(await evaluate("document.getElementById('split-budget').value"), '1000');
      assert.equal(await visible(evaluate, 'split-exit-results'), id === 'exit');
      if (id === 'exit') {
        assert.equal(await text('exit-entry-rate'), 'Entry rate · 8.54%');
        assert.equal(await text('exit-scenario-rate'), 'Exit rate · 15%');
      }
      await evaluate("const input = document.getElementById('split-budget'); input.value='777'; input.dispatchEvent(new Event('input',{bubbles:true}))");
      assert.equal(await evaluate("new URLSearchParams(location.hash.slice(1)).get('budget')"), '777');
      await click('split-share');
      const share = new URL(await evaluate("document.getElementById('split-link').value"));
      assert.equal(share.search, '');
      assert.equal(new URLSearchParams(share.hash.slice(1)).get('budget'), '777');
      assert.equal(await evaluate('localStorage.getItem(' + JSON.stringify(draftKey) + ')'), experimentDraft, 'Opening the lesson setup preserves an existing lab draft.');
    }
    await navigate(base);
    // A finished topic offers a review; Home's next lesson lies outside it.
    assert.equal(await evaluate("document.querySelector('.home-progress[data-topic=yield] .home-progress-count').textContent"), 'All 4 lessons done');
    assert.equal(await evaluate("document.querySelector('.home-learn-link[href=\"" + route('split') + "\"] .home-learn-label').textContent"), 'Review the lessons');
    assert.equal(await evaluate("(link => link.hidden || !link.getAttribute('href').startsWith('yield-learn.html'))(document.getElementById('home-continue'))"), true);
    assert.equal(await evaluate("document.getElementById('home-experiment').href"), homeExperiment, 'Editing the lesson handoff keeps the independent lab resume.');
    await navigate(base + route('split'));
    await select(evaluate, "#learn-lesson-list a[href='#lesson=buyers']");
    await settle(evaluate);
    assert.equal(await text('yl-title'), YIELD_LESSONS[1].title);
    const back = evaluate("new Promise(resolve => addEventListener('hashchange', () => requestAnimationFrame(resolve), {once:true}))");
    await evaluate('history.back()');
    await back;
    assert.equal(await text('yl-title'), YIELD_LESSONS[0].title);
    console.log('PASS: four yield lessons, different and matching feedback, explanations and applications, fixed model handoffs, progress, Home resume and Back');
    for (const width of [390, 320]) await checkPhoneLessons({ evaluate, call, navigate, base, reload, text }, width);
    console.log('PASS: yield lesson headings, readable setups, optional predictions, single scene control, native touch and reduced motion at 390/320px');
    await checkYieldLessonSliders({ evaluate, call, navigate, base });
  } finally {
    await call('Emulation.setEmulatedMedia', { features: [] });
    await call('Emulation.setTouchEmulationEnabled', { enabled: false });
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await navigate(base);
    await evaluate('localStorage.clear();sessionStorage.clear();Object.assign(localStorage,' + JSON.stringify(before.local)
      + ');Object.assign(sessionStorage,' + JSON.stringify(before.session) + ')');
  }
}
