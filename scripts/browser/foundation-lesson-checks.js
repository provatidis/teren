import { dragRangeToMax } from './touch-range.js';
import assert from 'node:assert/strict';

const progressKey = 'degenerator-learning-liquidity-v1';
const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkFoundationLessons({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="${group}"][value="${value}"]').click()`);
  const saved = () => evaluate(`localStorage.getItem('${progressKey}')`);
  const stage = () => evaluate("document.querySelector('.scene-player').dataset.stage");
  const key = async (id, key) => {
    await evaluate(`document.getElementById('${id}').focus()`);
    const input = key === 'Enter' ? { key, code: key, windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' } : { key, code: key };
    await call('Input.dispatchKeyEvent', { type: 'keyDown', ...input });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
  };
  const reset = async () => {
    await click('learn-variation');
    for (let i = 0; i < 3 && !(await text('learn-variation-label')).includes('1 of 3'); i++) await click('learn-variation');
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const sandbox = await evaluate("localStorage.getItem('defi-sandbox-v1')");
  const shown = selector => evaluate(`document.querySelector(${JSON.stringify(selector)})?.checkVisibility() ?? false`);

  // Lesson 1: the pool comes first, and its question reveals the swap in place.
  await navigate(base + 'learn.html#lesson=swap-impact');
  await reset();
  assert.equal(await stage(), '0');
  assert.equal(await evaluate("document.getElementById('learn-essential').hasAttribute('data-pool-first')"), true);
  assert.equal(await evaluate("Boolean(document.querySelector('.foundation-pool').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true, 'The pool comes before its question.');
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), await text('learn-prediction-question'));
  assert.equal(await shown('.scene-prediction input'), true);
  assert.deepEqual(await evaluate("['#learn-run', '#learn-setup', '#foundation-amount', '#foundation-invite', '#foundation-replay', '#foundation-average', '#foundation-comparison'].filter(id => document.querySelector(id)?.checkVisibility())"), [],
    'Before the swap is shown there is one thing to do: answer or skip the question.');
  assert.equal(await evaluate("document.querySelectorAll('#learn-controls input[type=range]').length"), 0, 'The scene is the only amount editor.');
  assert.equal(await text('foundation-pool-price'), 'Starting pool price: $2,000.00 per ETH');
  await key('learn-reveal', 'Enter');
  assert.equal(await stage(), '1');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'skipped');
  assert.equal(await text('foundation-pool-eth'), '110.00 ETH');
  assert.equal(await text('foundation-pool-usdc'), '181,867.78 USDC');
  assert.equal(await text('foundation-average'), 'Average price you receive: $1,813.22 per ETH');
  assert.equal(await text('foundation-pool-price'), 'Pool price after the swap: $1,653.34 per ETH');
  assert.equal(await text('foundation-execution-2'), '1,813.22');
  assert.match(await text('learn-prediction-feedback'), /starting pool price of \$2,000\.00, 10 ETH is worth 20,000 USDC\. The pool quotes 18,132\.22 USDC for the whole trade/);
  assert.doesNotMatch(await text('learn-prediction-feedback'), /\blos[est]/i, 'The difference is in the quote; it is not called a loss.');
  assert.deepEqual(await evaluate("[document.querySelector('.scene-prediction').dataset.folded, document.querySelector('.scene-prediction-recap span').textContent, document.querySelector('.scene-prediction-recap button').textContent]"),
    ['true', 'Your prediction for the 10 ETH swap', 'Change']);
  assert.equal(await shown('.scene-prediction input'), false, 'The answered question folds into one line.');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.scene-player button, .scene-player summary, .scene-step-label')).filter(element => element.checkVisibility()).map(element => element.textContent)"), ['Replay the swap ↻'],
    'A two-state scene keeps one replay control.');
  assert.equal(await text('foundation-invite'), 'Now sell more. What happens to the average price you receive?');
  assert.deepEqual(await evaluate("['learn-prediction-feedback', 'foundation-why', 'learn-pitfall'].map(id => document.getElementById(id).closest('#learn-scene') !== null && document.getElementById(id).checkVisibility())"), [true, true, true],
    'The verdict, one explanation and the pitfall sit with the pool and its comparison.');
  assert.deepEqual(await evaluate("['#learn-explanation', '#learn-results > .eyebrow', '#learn-assessment > .eyebrow'].filter(id => document.querySelector(id).checkVisibility())"), []);
  assert.deepEqual([await text('learn-results-title'), await text('learn-check-title')], ['Go further', 'Use what you saw']);
  const initial = await saved();
  await key('foundation-amount', 'End');
  assert.equal(await text('foundation-execution-2'), '1,330.66');
  assert.equal(await text('foundation-average'), 'Average price you receive: $1,330.66 per ETH', 'The average beside the pool follows the selected trade.');
  assert.match(await text('learn-prediction-feedback'), /^What happens\s*10 ETH swap:/, 'The verdict stays with the question’s own swap.');
  await key('foundation-amount', 'Home');
  assert.equal(await text('foundation-execution-2'), await text('foundation-execution-1'));
  const swapFrame = await evaluate("document.querySelector('.foundation-pool').textContent");
  await click('foundation-replay'); await click('foundation-replay');
  assert.equal(await evaluate("document.querySelector('.foundation-pool').textContent"), swapFrame);
  assert.equal(await saved(), initial, 'Playing and exploring must not alter saved answers or the assessed setup.');
  await evaluate("document.querySelector('.scene-prediction-recap button').click()");
  assert.equal(await shown('.scene-prediction input'), true, 'Change opens the choices again.');
  assert.equal(await evaluate("document.activeElement.name"), 'learn-prediction');
  await click('learn-reveal');
  assert.equal(await evaluate("document.getElementById('foundation-amount').value"), '10');
  assert.equal(await stage(), '1', 'Showing the question outcome again restores its amount.');
  assert.match(await text('learn-reason-question'), /ten times as much of each token\. You sell 10 ETH into each\./);
  await choose('learn-reason', 'shallow'); await choose('learn-application', 'quote-received'); await click('learn-check');
  assert.match(await text('learn-reasons-feedback'), /works against you[\s\S]*This pool quotes 18,132\.22 USDC; the deeper pool would quote 19,743\.16 USDC\./);
  await choose('learn-reason', 'deeper'); await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  assert.match(await text('learn-reasons-feedback'), /10% of this pool’s ETH and 1% of the deeper pool’s[\s\S]*19,743\.16 USDC/);
  {
    const checked = await saved();
    const link = await evaluate("document.getElementById('learn-explore').href");
    assert.equal(link, base + 'liquidity.html#swap-sandbox', 'Foundations retain their independent sandbox handoff.');
    const evidence = await text('learn-application-evidence');
    await fill('foundation-amount', '1');
    assert.equal(await text('learn-application-evidence'), evidence, 'The quoted wallet case stays fixed while the scene explores a different trade.');
    assert.equal(await saved(), checked);
    await reload();
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate("document.getElementById('foundation-amount').value"), '10');
    assert.equal(await evaluate("document.querySelector('.scene-prediction').dataset.folded"), 'true', 'A returning learner sees the folded question.');
    await choose('learn-prediction', 'less');
    assert.match(await text('learn-prediction-feedback'), /^Your prediction matches\./);
    assert.equal(await evaluate("document.querySelector('.scene-prediction').dataset.folded"), 'true');
    assert.equal(await evaluate("document.querySelector('.scene-prediction-recap button').textContent"), 'Change');
    assert.equal(await evaluate("document.querySelector('input[name=learn-reason]:checked').value"), 'deeper');
    assert.equal(await evaluate("document.querySelector('input[name=learn-application]:checked').value"), 'quote-received');
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.', 'Revising an expectation does not erase understanding checks.');
  }
  for (const [variant, amount, worth, quote, deeper] of [[1, 5, '7,500', '6,799.58', '7,403.69'], [2, 20, '60,000', '54,396.65', '59,229.48']]) {
    await click('learn-variation');
    assert.match(await text('learn-variation-label'), new RegExp('Variation ' + (variant + 1)));
    assert.equal(await evaluate("document.getElementById('learn-results').hidden"), true);
    assert.equal(await stage(), '0');
    assert.equal(await shown('#foundation-amount'), false);
    await choose('learn-prediction', 'more'); await click('learn-reveal');
    assert.equal(await evaluate("document.querySelector('input[name=learn-reason]:checked')"), null, 'Changing the actual question still starts fresh answers.');
    assert.match(await text('learn-prediction-feedback'), new RegExp(amount + ' ETH is worth ' + worth + ' USDC\\. The pool quotes ' + quote.replace('.', '\\.') + ' USDC'));
    assert.match(await text('learn-reason-question'), new RegExp('You sell ' + amount + ' ETH into each'));
    await choose('learn-reason', 'equal'); await click('learn-check');
    assert.ok((await text('learn-reasons-feedback')).includes('it would quote ' + deeper + ' USDC, against ' + quote + ' USDC here'));
  }

  // Lesson 2 follows the same pattern, with one more step: a later trade beside the pool.
  await navigate(base + 'learn.html#lesson=pool-share');
  await reset();
  assert.equal(await stage(), '0');
  assert.equal(await evaluate("document.getElementById('learn-essential').hasAttribute('data-pool-first')"), true);
  assert.equal(await evaluate("Boolean(document.querySelector('.foundation-pool').compareDocumentPosition(document.querySelector('.scene-prediction')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true, 'The pool comes before its question.');
  assert.equal(await evaluate("document.querySelector('.scene-prediction-question').textContent"), 'After the deposit, what share of the pool will you own?');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#learn-predictions label'), label => label.textContent.trim())"),
    ['4.76%, my 5 ETH out of the 105 ETH it will hold', '5%, my 5 ETH out of the 100 ETH it holds now'], 'The prediction is asked in the setup’s own numbers.');
  assert.deepEqual(await evaluate("['#learn-run', '#learn-setup', '#foundation-amount', '#foundation-invite', '#foundation-replay', '#foundation-later', '#foundation-claim', '#foundation-ownership'].filter(id => document.querySelector(id)?.checkVisibility())"), [],
    'Before the deposit is shown there is one thing to do: answer or skip the question.');
  assert.equal(await text('foundation-pool-share'), 'Your share: 0% · before deposit');
  await key('learn-reveal', 'Enter');
  assert.equal(await stage(), '1');
  assert.equal(await evaluate("document.getElementById('learn-prediction-feedback').dataset.state"), 'skipped');
  assert.equal(await text('foundation-pool-eth'), '105.00 ETH');
  assert.equal(await text('foundation-pool-price'), 'Pool price: $2,000.00 per ETH');
  assert.equal(await text('foundation-pool-share'), 'Your share: 4.76% · striped');
  assert.equal(await text('foundation-claim'), 'Your claim: 5 ETH + 10,000 USDC');
  assert.match(await text('learn-prediction-feedback'), /The pool holds 105 ETH after your deposit, and 5 of them came from you\. You own 4\.76% of the pool/);
  assert.deepEqual(await evaluate("[document.querySelector('.scene-prediction').dataset.folded, document.querySelector('.scene-prediction-recap span').textContent]"), ['true', 'Your prediction for the 5 ETH deposit']);
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.scene-player button, .scene-player summary, .scene-step-label')).filter(element => element.checkVisibility()).map(element => element.textContent)"), ['Replay the deposit ↻']);
  assert.deepEqual([await text('foundation-later-copy'), await text('foundation-later-show')], ['Next, another trader sells 10 ETH to this pool. Watch your share and your claim.', 'Show the trade →']);
  assert.equal(await text('foundation-invite'), 'Now try a bigger deposit. How much of the pool do you own?');
  assert.deepEqual([await text('foundation-share-before'), await text('foundation-share')], ['5.00%', '4.76%']);
  assert.deepEqual(await evaluate("['learn-prediction-feedback', 'foundation-why', 'learn-pitfall'].map(id => document.getElementById(id).closest('#learn-scene') !== null && document.getElementById(id).checkVisibility())"), [true, true, true]);
  {
    const initial = await saved();
    const share = await text('foundation-pool-share');
    await click('foundation-later-show');
    assert.equal(await stage(), '2');
    assert.equal(await text('foundation-pool-eth'), '115.00 ETH');
    assert.equal(await text('foundation-pool-usdc'), '191,789.16 USDC');
    assert.equal(await text('foundation-pool-share'), share, 'A trade leaves the share unchanged.');
    assert.equal(await text('foundation-claim'), 'Your claim: 5.4762 ETH + 9,132.82 USDC');
    assert.match(await text('foundation-flow'), /Another trader/);
    assert.deepEqual([await text('foundation-later-copy'), await text('foundation-later-show'), await text('foundation-replay')],
      ['The trade changed your claim, not your share.', '← Back to the deposit', 'Replay the trade ↻']);
    assert.deepEqual(await evaluate("['share', 'before', 'after'].map(id => document.getElementById('foundation-later-' + id).textContent)"),
      ['Your share 4.76% before and after', 'Claim before 5 ETH + 10,000 USDC', 'Claim after 5.4762 ETH + 9,132.82 USDC'],
      'the trade\'s result compares the share and the claim in numbers');
    const frame = await evaluate("document.querySelector('.foundation-pool').textContent");
    await click('foundation-replay'); await click('foundation-replay');
    assert.equal(await evaluate("document.querySelector('.foundation-pool').textContent"), frame);
    await key('foundation-amount', 'End');
    assert.deepEqual([await text('foundation-share-before'), await text('foundation-share'), await stage()], ['50.00%', '33.33%', '2']);
    assert.match(await text('foundation-ownership-copy'), /half as much as the pool held, and you own a third of it, not a half/);
    assert.equal(await text('foundation-pool-share'), 'Your share: 33.33% · striped', 'The pool follows the selected deposit.');
    await key('foundation-amount', 'Home');
    assert.equal(await text('foundation-share'), '0.99%');
    assert.equal(await saved(), initial, 'Playing and exploring must not alter saved answers or the assessed setup.');
    await click('foundation-later-show');
    assert.equal(await stage(), '1', 'Back returns to the deposit.');
    await evaluate("document.querySelector('.scene-prediction-recap button').click()");
    await click('learn-reveal');
    assert.equal(await evaluate("document.getElementById('foundation-amount').value"), '5');
    assert.equal(await stage(), '1', 'Showing the question outcome again restores its amount.');
    assert.deepEqual([await text('learn-application-label'), await text('learn-application-question')], ['Another provider deposits', 'What happens to your share and your claim?'], 'The application is a new situation, not the trade the scene already showed.');
    await choose('learn-reason', 'ownership'); await choose('learn-application', 'fixed-share'); await click('learn-check');
    assert.match(await text('learn-applications-feedback'), /your share of all LP tokens falls/);
    await choose('learn-application', 'diluted-same-claim'); await click('learn-check');
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
    const checked = await saved();
    assert.equal(await evaluate("document.getElementById('learn-explore').href"), base + 'liquidity.html#swap-sandbox', 'Foundations retain their independent sandbox handoff.');
    await fill('foundation-amount', '1');
    assert.equal(await saved(), checked);
    await reload();
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
    assert.equal(await evaluate("document.getElementById('foundation-amount').value"), '5');
    assert.equal(await evaluate("document.querySelector('.scene-prediction').dataset.folded"), 'true');
    await choose('learn-prediction', 'less');
    assert.match(await text('learn-prediction-feedback'), /^Your prediction matches\./);
    assert.equal(await evaluate("document.querySelector('input[name=learn-reason]:checked').value"), 'ownership');
    assert.equal(await evaluate("document.querySelector('input[name=learn-application]:checked').value"), 'diluted-same-claim');
    assert.equal(await text('learn-feedback-title'), 'Both answers are correct.', 'Revising an expectation does not erase understanding checks.');
  }
  for (const [variant, price, choice, label] of [[1, '$1,500.00', '16.67%, my 10 ETH out of the 60 ETH it will hold', 'Another provider withdraws'], [2, '$3,000.00', '9.09%, my 20 ETH out of the 220 ETH it will hold', 'A trader buys ETH']]) {
    await click('learn-variation');
    assert.match(await text('learn-variation-label'), new RegExp('Variation ' + (variant + 1)));
    assert.equal(await evaluate("document.getElementById('learn-results').hidden"), true);
    assert.equal(await evaluate("document.querySelector('#learn-predictions label').textContent.trim()"), choice);
    await click('learn-reveal');
    assert.equal(await evaluate("document.querySelector('input[name=learn-reason]:checked')"), null, 'Changing the actual question still starts fresh answers.');
    assert.equal(await text('foundation-pool-price'), 'Pool price: ' + price + ' per ETH');
    const share = await text('foundation-pool-share');
    await click('foundation-later-show');
    assert.equal(await text('foundation-pool-share'), share);
    assert.equal(await text('learn-application-label'), label);
  }
  assert.equal(await evaluate("localStorage.getItem('defi-sandbox-v1')"), sandbox);
  await navigate(base + 'learn.html#lesson=range-boundaries');
  // A lesson revealed earlier folds its question, so start from a fresh variation.
  await reset();
  assert.equal(await evaluate("document.getElementById('learn-prediction-field').closest('.scene-prediction')===null"), false);
  assert.ok(await evaluate("document.getElementById('learn-prediction-question').getBoundingClientRect().width") > 100, 'Other lessons retain their visible group legend.');
  for (const [variant, prediction, price, direction] of [[0, 'usdc', 2400, /bought ETH from your claim/], [1, 'eth', 1275, /sold ETH to your claim/], [2, 'both', 3150, /less ETH and more USDC/]]) {
    if (variant) await click('learn-variation');
    await choose('learn-prediction', prediction); await click('learn-reveal');
    assert.match(await text('learn-prediction-feedback'), /^Your prediction matches/);
    assert.match(await text('learn-prediction-feedback'), direction);
    assert.match(await evaluate("document.getElementById('learn-explore').href"), new RegExp('future=' + price));
    await reload();
    assert.equal(await evaluate("document.querySelector('input[name=learn-prediction]:checked').value"), prediction);
  }
  await reset();

  console.log('PASS: swap/deposit actions, exact token transfers, constant ownership through a trade, optional predictions, restoration and isolated exploration');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 740, deviceScaleFactor: 1, mobile: true });
    for (const id of ['swap-impact', 'pool-share']) {
      const swap = id === 'swap-impact';
      await navigate(base + 'learn.html#lesson=' + id); await reset();
      await click('learn-reveal');
      if (!swap) await click('foundation-later-show');
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      if (swap) {
        assert.equal(await evaluate("document.getElementById('learn-application-evidence').hidden"), false);
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      }
      const sceneHeight = await evaluate("document.getElementById('foundation-replay').getBoundingClientRect().bottom-document.querySelector('.foundation-pool').getBoundingClientRect().top");
      const available = await evaluate("innerHeight-document.querySelector('.topbar').getBoundingClientRect().height");
      assert.ok(sceneHeight > 0 && sceneHeight <= available, `${id} at ${width}px: pool state and its action need ${sceneHeight}px; available ${available}px.`);
      await dragRangeToMax({ evaluate, call, fill }, 'foundation-amount');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      try {
        await click('foundation-replay');
        assert.equal(await evaluate("document.querySelector('.foundation-pool').getAnimations({subtree:true}).length"), 0);
        assert.ok(await evaluate("Array.from(document.querySelectorAll('.scene-actions button')).filter(button=>button.checkVisibility()).every(button=>button.getBoundingClientRect().height>=44)"));
      } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
    }
  }
  console.log('PASS: foundation scenes at 390px/320px, short-screen controls, stable touch dragging, keyboard actions and reduced motion');
}
