import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const keys = ['degenerator-learning-liquidity-v1', 'passiko-range-learning-v1', 'passiko-applied-liquidity-v1',
  'teren-lending-learning-v1', 'teren-loop-learning-v1', 'teren-lst-learning-v1', 'teren-yield-learning-v1', 'teren-learning-location-v1'];
const record = completed => JSON.stringify({ version: 1, completed, drafts: {} });

// Home shows where a returning learner stands and what comes next, from saved
// completion alone. It never changes a course's own record.
export async function checkHomeProgress({ evaluate, navigate, base, call }) {
  await navigate(base);
  const before = await evaluate(`${JSON.stringify(keys)}.map(key => [key, localStorage.getItem(key)])`);
  const save = state => evaluate(`for (const key of ${JSON.stringify(keys)}) localStorage.removeItem(key);
    for (const [key, value] of ${JSON.stringify(Object.entries(state))}) localStorage.setItem(key, value)`);
  const home = () => evaluate(`({
    next: (link => link.hidden ? null : [link.querySelector('span').textContent, link.querySelector('strong').textContent, link.getAttribute('href')])(document.getElementById('home-continue')),
    topics: Array.from(document.querySelectorAll('.home-progress'), row => {
      const link = row.closest('.home-topic').querySelector('.home-learn-link'), meter = row.querySelector('progress');
      return { shown: row.checkVisibility(), count: row.querySelector('.home-progress-count').textContent, hint: row.querySelector('.home-progress-next').textContent,
        meter: [meter.value, meter.max, meter.getAttribute('aria-label')], button: link.querySelector('.home-learn-label').textContent, href: link.getAttribute('href'), label: link.getAttribute('aria-label') };
    }),
  })`);
  try {
    await call('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await save({}); await navigate(base);
    let view = await home();
    assert.equal(view.next, null);
    assert.deepEqual(view.topics.map(topic => [topic.shown, topic.button, topic.href, topic.label]), [
      [false, 'Learn step by step', 'learn.html#lesson=swap-impact', 'Learn liquidity step by step'],
      [false, 'Learn step by step', 'lending.html#lesson=supply', 'Learn lending step by step'],
      [false, 'Learn step by step', 'yield-learn.html#lesson=split', 'Learn yield trading step by step'],
    ], 'A first visit keeps the plain topic cards.');

    // One finished lesson: every topic shows its count, and the finished bookmark points forward.
    await save({ 'degenerator-learning-liquidity-v1': record(['swap-impact']), 'teren-learning-location-v1': 'learn.html#lesson=swap-impact' });
    const saved = await evaluate(`${JSON.stringify(keys)}.map(key => localStorage.getItem(key))`);
    await navigate(base);
    view = await home();
    assert.deepEqual(view.next, ['Next lesson', 'Providing liquidity', 'learn.html#lesson=pool-share']);
    assert.deepEqual(view.topics.map(topic => [topic.shown, topic.count, topic.hint, topic.button, topic.href]), [
      [true, '1 of 13', 'Next: Providing liquidity', 'Continue learning', 'learn.html#lesson=pool-share'],
      [true, '0 of 8', '', 'Learn step by step', 'lending.html#lesson=supply'],
      [true, '0 of 4', '', 'Learn step by step', 'yield-learn.html#lesson=split'],
    ]);
    assert.deepEqual(view.topics[0].meter, [1, 13, 'Liquidity: 1 of 13 lessons done']);
    assert.equal(view.topics[0].label, 'Continue liquidity lessons: Providing liquidity');
    assert.deepEqual(await evaluate(`${JSON.stringify(keys)}.map(key => localStorage.getItem(key))`), saved, 'Home reads lesson progress without changing it.');

    // An unfinished bookmark resumes in place, whatever else is done.
    await save({ 'degenerator-learning-liquidity-v1': record(['swap-impact']), 'teren-learning-location-v1': 'lending.html#loop-lesson=unwind' });
    await navigate(base);
    assert.deepEqual((await home()).next, ['Continue learning', 'Explore unwinding', 'lending.html#loop-lesson=unwind']);

    // A finished topic offers a review; its bookmark leads to the next unfinished lesson elsewhere.
    await save({ 'teren-yield-learning-v1': record(['split', 'buyers', 'timing', 'exit']), 'teren-lending-learning-v1': record(['supply']),
      'teren-learning-location-v1': 'yield-learn.html#lesson=exit' });
    await navigate(base);
    view = await home();
    assert.deepEqual(view.next, ['Next lesson', 'Swaps & price impact', 'learn.html#lesson=swap-impact']);
    assert.deepEqual(view.topics.map(topic => [topic.count, topic.hint, topic.button, topic.href]), [
      ['0 of 13', '', 'Learn step by step', 'learn.html#lesson=swap-impact'],
      ['1 of 8', 'Next: Borrow without counting it as profit', 'Continue learning', 'lending.html#lesson=borrow'],
      ['All 4 lessons done', '', 'Review the lessons', 'yield-learn.html#lesson=split'],
    ]);
    assert.equal(view.topics[2].label, 'Review the yield trading lessons');
    assert.deepEqual(view.topics[2].meter, [4, 4, 'Yield trading: all 4 lessons done']);

    for (const [width, height] of [[1366, 768], [390, 844], [320, 740]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 750 });
      await navigate(base); await settle(evaluate);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true, 'Home progress fits at ' + width + 'px.');
      const rows = await evaluate(`Array.from(document.querySelectorAll('.home-progress'), row => {
        const box = row.getBoundingClientRect(), hint = row.querySelector('.home-progress-next').getBoundingClientRect();
        return { height: box.height, inside: hint.right <= box.right + 1, visual: row.closest('.home-topic').querySelector('.home-visual').getBoundingClientRect().top };
      })`);
      assert.ok(rows.every(row => row.inside), 'A long next-lesson title is shortened inside its card.');
      assert.ok(rows.every(row => Math.abs(row.height - rows[0].height) < 1), 'Progress rows share one height, with or without a next lesson.');
      if (width >= 960) {
        assert.ok(rows.every(row => Math.abs(row.visual - rows[0].visual) < 1), 'The three cards stay aligned.');
        assert.ok(await evaluate("[...document.querySelectorAll('.home-topic-actions .button')].every(a=>a.getBoundingClientRect().bottom<innerHeight)"), 'Lab and lesson buttons stay on the first laptop screen.');
      }
    }
    console.log('PASS: Home progress per topic, next and resumed lessons, finished-topic review, read-only storage and 1366px/390px/320px layouts');
  } finally {
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate(`for (const [key, value] of ${JSON.stringify(before)}) value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value)`);
  }
}
