import assert from 'node:assert/strict';
import { dragRangeToMax } from './touch-range.js';

export async function checkVisualLessonPilots({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="${group}"][value="${value}"]').click()`);
  const key = async (id, key) => {
    await evaluate(`document.getElementById('${id}').focus()`);
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
  };
  const resetVariation = async prefix => {
    await click(prefix + '-variation');
    for (let i = 0; i < 3 && !(await text(prefix + '-variation-label')).includes('1 of 3'); i++) await click(prefix + '-variation');
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'learn.html#lesson=token-balances');
  await resetVariation('learn');
  assert.match(await evaluate("document.querySelector('.scene-prediction-question').textContent"), /\$4,000.00/);
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').checkVisibility()"), true);
  assert.equal(await evaluate("document.getElementById('learn-run').disabled"), false);
  const saved = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  const figure = await evaluate("document.querySelector('.scene-token-figure').outerHTML");
  await key('token-scene-price', 'End');
  assert.match(await text('token-scene-eth'), /0.8839 ETH/);
  assert.match(await text('token-scene-usdc'), /3,535.53 USDC/);
  assert.match(await text('token-scene-exchange'), /USDC into the pool and take ETH out/);
  await key('token-scene-price', 'Home');
  assert.match(await text('token-scene-exchange'), /ETH into the pool and take USDC out/);
  await fill('token-scene-price', '2000');
  assert.equal(await evaluate("document.querySelector('.scene-token-figure').outerHTML"), figure);
  assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), saved, 'Exploration must not edit the question or progress.');
  await click('learn-run');
  assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked')===null"), true);
  await choose('learn-reason', 'rebalance'); await choose('learn-application', 'original-mix'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  const link = await evaluate("document.getElementById('learn-explore').href");
  await fill('token-scene-price', '1000');
  assert.equal(await evaluate("document.getElementById('learn-explore').href"), link);
  assert.match(link, /future=4000/);
  assert.match(await text('token-scene-price-scope'), /checks below still use \$4,000.00/);
  await reload();
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.', 'Optional predictions must stay optional on restoration.');

  const completedTokens = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  await evaluate(`{const progress=JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1'));progress.drafts['token-balances'].inputs.futurePrice=2033.25;localStorage.setItem('degenerator-learning-liquidity-v1',JSON.stringify(progress));}`);
  await reload();
  assert.equal(await evaluate("document.getElementById('token-scene-price').value"), '2033.25', 'Restored question prices must not snap to the exploration step.');
  assert.equal(await evaluate("document.getElementById('learn-input-futurePrice').value"), '2033.25');
  assert.match(await text('token-scene-price-scope'), /Showing the question price/);
  assert.match(await evaluate("document.getElementById('learn-explore').href"), /future=2033.25/);
  await evaluate(`localStorage.setItem('degenerator-learning-liquidity-v1',${JSON.stringify(completedTokens)})`);

  await navigate(base + 'learn.html#manage=range-width');
  await resetVariation('manage');
  assert.match(await evaluate("document.querySelector('#manage-range-scene .scene-prediction-question').textContent"), /\$2,300.00/);
  assert.equal(await evaluate("document.querySelector('#manage-range-scene .scene-prediction-question').checkVisibility()"), true);
  assert.equal(await evaluate("document.getElementById('manage-reveal').disabled"), false);
  const rangeSaved = await evaluate("localStorage.getItem('passiko-range-learning-v1')");
  for (const [price, narrow, wide] of [[1400, 'Outside range', 'Outside range'], [1900, 'At boundary', 'Inside range'], [2000, 'Inside range', 'Inside range'], [2300, 'Outside range', 'Inside range'], [2500, 'Outside range', 'At boundary'], [2800, 'Outside range', 'Outside range']]) {
    await fill('range-scene-price', String(price));
    assert.equal(await text('range-scene-narrow'), narrow);
    assert.equal(await text('range-scene-wide'), wide);
  }
  assert.equal(await evaluate("localStorage.getItem('passiko-range-learning-v1')"), rangeSaved);
  await click('manage-reveal');
  assert.equal(await evaluate("document.getElementById('range-scene-price').value"), '2300');
  await choose('manage-reason', 'bounds'); await choose('manage-application', 'mix'); await click('manage-check');
  assert.equal(await text('manage-feedback-title'), 'Both answers are correct.');
  await fill('range-scene-price', '2000');
  assert.match(await text('range-scene-price-scope'), /checks below still use \$2,300.00/);
  await reload();
  assert.equal(await text('manage-feedback-title'), 'Both answers are correct.');
  assert.equal(await evaluate("document.getElementById('range-scene-price').value"), '2300');
  const completedRange = await evaluate("localStorage.getItem('passiko-range-learning-v1')");
  await evaluate(`(() => {
    const key='passiko-range-learning-v1', progress=JSON.parse(localStorage.getItem(key));
    const draft=progress.drafts['range-width']; draft.application='unknown';
    draft.questionRevisions.application=1; localStorage.setItem(key,JSON.stringify(progress));
  })()`);
  await reload();
  assert.equal(await evaluate("document.querySelector('input[name=manage-application]:checked')"),null,'A retired comparison answer cannot answer the new mechanism question.');
  assert.equal(await evaluate("document.querySelector('input[name=manage-reason]:checked').value"),'bounds','The unchanged explanation remains answered.');
  assert.equal(await evaluate("document.getElementById('manage-feedback').hidden"),true,'Retired answers must not restore success feedback.');
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('passiko-range-learning-v1')).completed.includes('range-width')"),true,'Earlier completion remains saved.');
  await evaluate(`localStorage.setItem('passiko-range-learning-v1',${JSON.stringify(completedRange)})`);
  await reload();
  assert.equal(await text('manage-feedback-title'),'Both answers are correct.','Current revision answers still restore.');

  for (const [id, reason, application] of [['build', 'debt', 'supplied'], ['unwind', 'backing', 'repay-wallet']]) {
    await navigate(base + 'lending.html#loop-lesson=' + id);
    await click('lend-reveal'); await click('lend-retry');
    assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), await text('lend-question'));
    assert.equal(await evaluate("document.querySelector('.scene-prediction-question').checkVisibility()"), true);
    assert.equal(await evaluate("document.querySelector('input[name=lend-prediction]:checked')===null"), true);
    const before = await evaluate("localStorage.getItem('teren-loop-learning-v1')");
    await click('loop-flow-next');
    const snapshot = await evaluate("document.querySelector('.loop-flow-balances').textContent");
    await click('loop-flow-replay'); await click('loop-flow-replay');
    assert.equal(await evaluate("document.querySelector('.loop-flow-balances').textContent"), snapshot);
    assert.equal(await evaluate("localStorage.getItem('teren-loop-learning-v1')"), before);
    await click('lend-reveal');
    assert.equal(await evaluate("document.querySelector('.scene-player').dataset.stage"), id === 'build' ? '3' : '7');
    await choose('lend-reason', reason); await choose('lend-application', application); await click('lend-check');
    await reload();
    assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate("document.querySelector('.scene-player').dataset.stage"), id === 'build' ? '3' : '7');
    if (id === 'unwind') assert.equal(await evaluate("document.getElementById('loop-flow-health').checkVisibility()"), true);
  }
  console.log('PASS: four visual pilots, optional predictions, fixed question scope, exact handoffs, independent exploration, replay and restored completion');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    for (let repetition = 0; repetition < 3; repetition++) {
      for (const [path, id, figure] of [['#lesson=token-balances', 'token-scene-price', '.scene-token-figure'], ['#manage=range-width', 'range-scene-price', '.scene-range-figure']]) {
        await navigate(base + 'learn.html' + path);
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
        assert.ok(await evaluate(`document.getElementById('${id}').getBoundingClientRect().bottom-document.querySelector('${figure}').getBoundingClientRect().top <= innerHeight-document.querySelector('.topbar').getBoundingClientRect().height`), 'The scene and slider must fit together on a phone.');
        await dragRangeToMax({ evaluate, call, fill }, id);
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      }
    }
  }
  console.log('PASS: repeated fresh-page touch drags: both liquidity scenes fit with their controls and support stable native touch dragging at 390px/320px');
}
