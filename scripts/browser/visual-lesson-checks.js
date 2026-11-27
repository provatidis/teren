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
  // Lesson 3 shows the claim first. Before the outcome there is one thing to do: answer or skip.
  const shownParts = "['#learn-run', '#learn-setup', '#token-scene-price', '#token-scene-invite', '#token-scene-outcome'].filter(id => document.querySelector(id)?.checkVisibility())";
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), 'ETH rises from $2,000.00 to $4,000.00, and traders bring the pool’s price up with it. Will your claim hold less, more, or the same ETH?');
  assert.equal(await evaluate("Boolean(document.querySelector('.scene-token-figure').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true, 'The claim comes before its question.');
  assert.deepEqual(await evaluate(shownParts), []);
  assert.deepEqual([await text('token-scene-at'), await text('token-scene-eth'), await text('token-scene-usdc'), await text('token-scene-eth-change')],
    ['ETH at $2,000.00', '1.2500 ETH', '2,500.00 USDC', 'Starting amount']);
  const start = await evaluate("document.querySelector('.scene-token-figure').outerHTML");
  const saved = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  await click('learn-reveal');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'skipped');
  assert.deepEqual(await evaluate(shownParts), ['#token-scene-price', '#token-scene-invite', '#token-scene-outcome']);
  assert.deepEqual([await text('token-scene-at'), await text('token-scene-eth'), await text('token-scene-usdc')], ['ETH at $4,000.00', '0.8839 ETH', '3,535.53 USDC']);
  assert.deepEqual([await text('token-scene-eth-change'), await text('token-scene-usdc-change')], ['−0.3661 ETH · Start: 1.2500', '+1,035.53 USDC · Start: 2,500.00']);
  assert.equal(await evaluate("document.getElementById('token-scene-price').value"), '4000');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.token-scene .scene-shortcut'), button => [button.textContent, button.getAttribute('aria-pressed')])"),
    [['Start · $2,000', 'false'], ['The question · $4,000', 'true']]);
  assert.match(await text('learn-prediction-feedback'), /ETH at \$4,000\.00: Less ETH\. Traders bought ETH from the pool and paid in USDC, so your claim went from 1\.25 ETH \+ 2,500 USDC to 0\.8839 ETH \+ 3,535\.53 USDC\./);
  assert.deepEqual(await evaluate("[document.querySelector('.scene-prediction').dataset.folded, document.querySelector('.scene-prediction-recap span').textContent]"), ['true', 'Your prediction for ETH at $4,000.00']);
  assert.equal(await text('token-scene-invite'), 'Now drag the price below $2,000. What happens to your ETH?');
  // The slider sits between the bars and the verdict, and the panel holds one explanation and the pitfall.
  assert.deepEqual(await evaluate(`(order => order.map((id, i) => i === 0 || Boolean(document.querySelector(order[i - 1]).compareDocumentPosition(document.querySelector(id)) & Node.DOCUMENT_POSITION_FOLLOWING)))(
    ['.scene-token-figure', '#token-scene-invite', '#token-scene-price', '#learn-prediction-feedback', '.scene-prediction-recap', '#token-scene-outcome', '.learn-about-example'])`), Array(7).fill(true));
  assert.match(await text('token-scene-exchange'), /Traders buy ETH from the pool and pay in USDC\. Your claim holds less ETH and more USDC\./);
  assert.match(await text('token-scene-why'), /This is called arbitrage/);
  assert.deepEqual(await evaluate("['token-scene-why', 'learn-pitfall'].map(id => document.getElementById(id).closest('#token-scene-outcome') !== null && document.getElementById(id).checkVisibility())"), [true, true]);
  assert.deepEqual(await evaluate("['#learn-run', '#learn-explanation', '#learn-setup'].filter(id => document.querySelector(id).checkVisibility())"), [], 'There is no separate explanation button or repeated paragraph.');
  assert.match(await text('learn-results-title'), /Look closer/);
  assert.deepEqual([await text('learn-explore-question'), await text('learn-explore')], ['Move the price away and back. What returns?', 'Open this example in the full-range lab ↗']);
  assert.notEqual(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), saved);
  const revealed = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  // Any slider input ends a played reveal, so compare frames the slider has drawn.
  await fill('token-scene-price', '4000');
  const figure = await evaluate("document.querySelector('.scene-token-figure').outerHTML");
  await key('token-scene-price', 'Home');
  assert.deepEqual([await text('token-scene-at'), await text('token-scene-eth'), await text('token-scene-eth-change')], ['ETH at $1,000.00', '1.7678 ETH', '+0.5178 ETH · Start: 1.2500']);
  assert.match(await text('token-scene-exchange'), /Traders sell ETH to the pool and take USDC out\. Your claim holds more ETH and less USDC\./);
  await fill('token-scene-price', '2000');
  assert.equal(await evaluate("document.querySelector('.scene-token-figure').outerHTML"), start, 'The starting price shows the starting claim again.');
  assert.match(await text('token-scene-exchange'), /nobody has a reason to trade/);
  await key('token-scene-price', 'End');
  assert.equal(await evaluate("document.querySelector('.scene-token-figure').outerHTML"), figure);
  await fill('token-scene-price', '1000');
  assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), revealed, 'Exploration must not edit the question or progress.');
  assert.match(await text('learn-prediction-feedback'), /ETH at \$4,000\.00/, 'The verdict stays with the question’s price.');
  assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked')===null"), true);
  // The question steps outside the scene: the market has moved and nobody has traded yet.
  assert.deepEqual([await text('learn-application-context'), await text('learn-application-question')],
    ['ETH’s market price jumps to $4,000.00, but nobody has traded with the pool yet.', 'Have your claim’s tokens changed?']);
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('input[name=learn-application]'), input => input.value).sort()"), ['automatic', 'drift', 'rebalance']);
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#learn-applications label'), label => label.textContent.trim()).sort()"),
    ['No. Still 1.25 ETH + 2,500 USDC. Nothing has moved in or out.', 'Partly. Something in between: the pool drifts toward the market price.', 'Yes. Already 0.8839 ETH + 3,535.53 USDC. The pool follows the market price.']);
  assert.equal(await evaluate("document.querySelectorAll('#learn-assessment-form fieldset').length"), 1);
  await choose('learn-application', 'drift'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your answer.');
  assert.match(await text('learn-applications-feedback'), /Time alone changes nothing in a pool[\s\S]*still 1\.25 ETH \+ 2,500 USDC/);
  await choose('learn-application', 'rebalance'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Lesson 3 done.');
  assert.match(await text('learn-applications-feedback'), /The pool has no price feed[\s\S]*still 1\.25 ETH \+ 2,500 USDC[\s\S]*first trader to notice buys it/);
  const link = await evaluate("document.getElementById('learn-explore').href");
  await fill('token-scene-price', '1000');
  assert.equal(await evaluate("document.getElementById('learn-explore').href"), link);
  assert.match(link, /future=4000/);
  await reload();
  assert.equal(await text('learn-feedback-title'), 'Lesson 3 done.', 'Optional predictions must stay optional on restoration.');
  assert.deepEqual([await evaluate("document.getElementById('token-scene-price').value"), await text('token-scene-at'), await evaluate("document.getElementById('token-scene-outcome').checkVisibility()")],
    ['4000', 'ETH at $4,000.00', true], 'A restored lesson shows its outcome and the slider at the question’s price.');

  const completedTokens = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  await evaluate(`{const progress=JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1'));progress.drafts['token-balances'].inputs.futurePrice=2033.25;localStorage.setItem('degenerator-learning-liquidity-v1',JSON.stringify(progress));}`);
  await reload();
  assert.equal(await evaluate("document.getElementById('token-scene-price').value"), '2033.25', 'Restored question prices must not snap to the exploration step.');
  assert.equal(await evaluate("document.getElementById('learn-input-futurePrice')"), null);
  assert.equal(await evaluate("document.querySelector('.token-scene .scene-shortcut[aria-pressed=true]').textContent"), 'The question · $2,033.25');
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
  assert.equal(await evaluate("document.getElementById('range-scene-price').value"), '2800', 'Explanation preserves the explored price.');
  await choose('manage-reason', 'bounds'); await choose('manage-application', 'mix'); await click('manage-check');
  assert.equal(await text('manage-feedback-title'), 'Both answers are correct.');
  await fill('range-scene-price', '2000');
  assert.match(await text('range-scene-price-scope'), /Prediction: ETH at \$2,300.00/);
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

  for (const [id, reason, application] of [['build', 'buy-eth', 'supplied'], ['unwind', 'backing', 'debt-remains']]) {
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
    assert.equal(await evaluate("document.querySelector('.scene-player').dataset.stage"), '1', 'Explanation preserves the selected action.');
    await evaluate("document.querySelector('.scene-prediction-show').click()");
    assert.equal(await evaluate("document.querySelector('.scene-player').dataset.stage"), '3');
    await choose('lend-reason', reason); await choose('lend-application', application); await click('lend-check');
    await reload();
    assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate("document.querySelector('.scene-player').dataset.stage"), '3');
    if (id === 'unwind') assert.equal(await evaluate("document.getElementById('loop-flow-health').checkVisibility()"), true);
  }
  console.log('PASS: four visual pilots, optional predictions, fixed question scope, exact handoffs, independent exploration, replay and restored completion');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    for (let repetition = 0; repetition < 3; repetition++) {
      for (const [path, id, figure] of [['#lesson=token-balances', 'token-scene-price', '.scene-token-figure'], ['#manage=range-width', 'range-scene-price', '.scene-range-figure']]) {
        await navigate(base + 'learn.html' + path);
        // Lesson 3's slider appears with the outcome.
        if (path.endsWith('token-balances') && !await evaluate(`document.getElementById('${id}').checkVisibility()`)) await click('learn-reveal');
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
        assert.ok(await evaluate(`document.getElementById('${id}').getBoundingClientRect().bottom-document.querySelector('${figure}').getBoundingClientRect().top <= innerHeight-document.querySelector('.topbar').getBoundingClientRect().height`), 'The scene and slider must fit together on a phone.');
        await dragRangeToMax({ evaluate, call, fill }, id);
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      }
    }
  }
  console.log('PASS: repeated fresh-page touch drags: both liquidity scenes fit with their controls and support stable native touch dragging at 390px/320px');
}
