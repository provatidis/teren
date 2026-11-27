import assert from 'node:assert/strict';
import { reduceMotion } from './motion-settled.js';

export async function checkLearningApplications({ evaluate, click, fill, text, navigate, reload, base, call }) {
  const choose = (group, value) => evaluate(`document.querySelector('input[name="learn-${group}"][value="${value}"]').click()`);
  const progress = () => evaluate("JSON.parse(localStorage.getItem('degenerator-learning-liquidity-v1'))");
  const draft = async () => (await progress()).drafts['final-challenge'];
  const hidden = id => evaluate(`document.getElementById('${id}').hidden`);
  const taskPrice = () => evaluate("document.getElementById('liquidity-task-price').value");
  const handoff = () => evaluate("document.getElementById('learn-explore').href");
  const observed = () => evaluate("document.getElementById('learn-worked-scene').textContent");
  const isolated = () => evaluate(`[
    localStorage.getItem('defi-sandbox-v1'),
    localStorage.getItem('degenerator-pool-snapshot-v1'),
    localStorage.getItem('degenerator-v3-position-snapshot-v1'),
    sessionStorage.getItem('teren-lending-draft-v1'),
    sessionStorage.getItem('teren-loop-draft-v1'),
    sessionStorage.getItem('teren-lst-loop-draft-v1')
  ]`);
  const noDuplicateIds = async () => {
    const duplicates = await evaluate(`(() => {
      const ids = Array.from(document.querySelectorAll('[id]'), element => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })()`);
    assert.deepEqual(duplicates, [], 'The task and Observe must have distinct element IDs.');
  };
  const key = async (id, name) => {
    await evaluate(`document.getElementById('${id}').focus()`);
    const code = { Home: 36, End: 35, ArrowLeft: 37, ArrowRight: 39, Enter: 13 }[name];
    await call('Input.dispatchKeyEvent', {
      type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: code,
      ...(name === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}),
    });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
  };

  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'learn.html#lesson=final-challenge');
  // Reset this exercise through its UI without removing any earlier completion.
  await click('learn-variation');
  for (let i = 0; i < 3 && !(await text('learn-variation-label')).includes('1 of 3'); i++) await click('learn-variation');
  assert.equal(await evaluate("document.getElementById('liquidity-task-price').checkVisibility()"), true, 'Start with the construction task.');
  assert.equal(await evaluate("document.getElementById('comparison-profit').checkVisibility()"), false, 'The worked verdict does not answer the opening prediction.');
  // The challenge comes first, on the figure from lessons 4 and 5. Its question,
  // the panel and the one question after it wait below it.
  const visible = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).checkVisibility()`);
  const order = (first, second) => evaluate(`Boolean(document.querySelector(${JSON.stringify(first)}).compareDocumentPosition(document.querySelector(${JSON.stringify(second)})) & Node.DOCUMENT_POSITION_FOLLOWING)`);
  assert.equal(await evaluate("document.getElementById('learn-essential').hasAttribute('data-pool-first')"), true);
  assert.equal(await order('.learning-application-scene .benchmark-figure', '#liquidity-task-price'), true, 'The figure comes before its sliders.');
  assert.equal(await order('#liquidity-task-fees', '.scene-prediction-question'), true, 'The question follows the challenge as a first step.');
  assert.equal(await evaluate("document.querySelector('.challenge-scene .scene-prediction-invite').textContent"), 'Need a first step?');
  assert.equal(await text('learn-prediction-question'), 'Which price move can leave holding worth less than your start?');
  for (const id of ['learn-run', 'learn-setup', 'learn-explanation']) assert.equal(await visible('#' + id), false, id + ' is not part of the pool-first layout.');
  assert.equal(await visible('#challenge-outcome'), false);
  assert.equal(await hidden('learn-results'), true);
  assert.equal(await hidden('learn-assessment'), true);
  assert.deepEqual(await evaluate("['liquidity-task-at', 'liquidity-task-hold', 'liquidity-task-hold-tokens', 'liquidity-task-claim', 'liquidity-task-claim-tokens'].map(id => document.getElementById(id).textContent)"),
    ['ETH at $2,000.00', '$5,000.00', '1.25 ETH + 2,500 USDC', '$5,000.00', '1.25 ETH + 2,500 USDC']);
  assert.equal(await evaluate("document.querySelector('.learning-application-scene .scene-key').textContent"), 'Dashed = your $5,000.00 start. Striped = fees.');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.learning-application-scene .scene-shortcut'), button => button.textContent)"),
    ['Lower', 'Start', 'Higher', 'Match holding for me', 'Show an example', 'Start again']);
  assert.equal(await evaluate("document.getElementById('liquidity-task-fees').closest('.scene-price-control').contains(document.getElementById('liquidity-task-match'))"), true, 'The match button sits with the fee slider it moves.');
  await fill('liquidity-task-price', '1300');
  await reload();
  assert.equal(await taskPrice(), '1300', 'An unrevealed construction survives reopening the lesson.');
  assert.equal(await hidden('learn-results'), true);
  // Solving the challenge is its outcome: the rest opens under it without moving
  // the sliders or taking focus.
  const sliderTops = () => evaluate("['liquidity-task-price', 'liquidity-task-fees'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY))");
  const beforeSolving = await sliderTops();
  await evaluate("document.getElementById('liquidity-task-match').focus()");
  await click('liquidity-task-match');
  assert.equal(await hidden('liquidity-task-solved'), false);
  assert.deepEqual(await sliderTops(), beforeSolving, 'Solving the challenge moves neither slider.');
  assert.equal(await evaluate('document.activeElement.id'), 'liquidity-task-match', 'Solving keeps focus where the reader is working.');
  assert.equal(await hidden('learn-results'), false);
  assert.equal(await hidden('learn-assessment'), false);
  assert.equal(await visible('#challenge-outcome'), true);
  assert.equal(await text('learn-results-title'), 'Look closer');
  assert.match(await text('learn-prediction-feedback'), /^What happens\s*A fall in ETH\. Only a lower price takes holding below your \$5,000\.00 start\./);
  assert.equal(await text('challenge-outcome-title'), 'Two results, not one');
  assert.match(await text('challenge-why'), /^Matching holding and making money are two different results\./);
  assert.equal(await evaluate("document.getElementById('challenge-outcome').contains(document.querySelector('#learn-scene .learn-pitfall'))"), true, 'The pitfall sits in the panel it warns about.');
  assert.equal(await order('#liquidity-task-fees', '#learn-prediction-feedback'), true);
  assert.equal(await order('#learn-prediction-feedback', '#challenge-outcome'), true);
  assert.equal(await evaluate("document.getElementById('learn-worked-comparison').open"), false, 'The worked example stays an optional extra.');
  assert.equal(await evaluate("document.querySelector('#learn-worked-comparison > summary').textContent"), 'See a worked example');
  // The lab link opens the reader's own example, with the price and fees on the sliders.
  assert.equal(await text('learn-explore'), 'Open your example in the full-range lab ↗');
  assert.match(await handoff(), /future=1300/);
  assert.equal(await taskPrice(), '1300', 'The outcome preserves the learner’s selected price.');
  assert.equal((await draft()).ran, true);
  await reload();
  assert.equal(await hidden('learn-results'), false, 'A solved challenge reopens with its outcome.');
  assert.equal(await hidden('liquidity-task-solved'), false);
  await click('liquidity-task-reset');
  assert.equal(await hidden('learn-results'), false, 'Starting again keeps what has been opened.');
  const original = await draft();
  const completedBefore = (await progress()).completed;
  const working = await isolated();
  const originalShare = await evaluate("document.getElementById('learn-share-url').value");
  const originalObservation = await observed();
  assert.equal(await taskPrice(), '2000');
  assert.equal(await hidden('learn-application-task'), false);
  assert.deepEqual(await evaluate("(context => [context.textContent, context.parentElement.checkVisibility()])(document.getElementById('learn-application-context'))"), ['', false], 'The example on screen is the case: no line sets one up.');
  assert.equal(await text('learn-check'), 'Check this setup and answer →');
  // After Start again the link is back at the starting price with no fees; the result card keeps the worked example.
  assert.match(await handoff(), /future=2000.*fees=0(&|$)/);
  assert.match(originalShare, /future=4000.*fees=100/);
  await noDuplicateIds();

  await choose('application', 'relative-gap');
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your setup.');
  assert.equal(await evaluate('document.activeElement.id'), 'liquidity-task-feedback');
  assert.equal(await hidden('learn-continue'), true);
  assert.equal(await hidden('learn-share'), true);
  assert.deepEqual((await progress()).completed, completedBefore, 'A correct answer alone does not complete the default task.');

  await click('liquidity-task-example');
  assert.equal(await taskPrice(), '1500');
  assert.equal(await observed(), originalObservation);
  assert.match(await handoff(), /future=1500/, 'The lab link follows the example on the sliders.');
  assert.equal(await evaluate("document.getElementById('learn-share-url').value"), originalShare);
  assert.deepEqual((await draft()).inputs, original.inputs);
  await choose('application', 'capital-restored');
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your answer.');
  assert.match(await text('learn-applications-feedback'), /both worth \$4,375\.00, which is \$625\.00 less than you started with/);
  // With no case box above it, the question itself is scrolled into view with its feedback.
  assert.ok(await evaluate("(box => box.top >= 0 && box.top < innerHeight - 100)(document.querySelector('#learn-assessment-form fieldset').getBoundingClientRect())"), 'The question stays in view after a wrong answer.');
  assert.equal(await evaluate("document.getElementById('liquidity-task-feedback').dataset.state"), 'match');
  assert.equal(await hidden('learn-continue'), true, 'Showing an example does not replace explaining it.');
  assert.deepEqual((await progress()).completed, completedBefore);

  await choose('application', 'relative-gap');
  assert.equal((await draft()).taskChecked, false);
  await reload();
  assert.equal(await taskPrice(), '1500');
  assert.equal(await hidden('learn-feedback'), true, 'An edited answer is not automatically checked on reload.');
  assert.equal(await hidden('learn-continue'), true);
  assert.equal((await draft()).taskChecked, false);
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Challenge done.');
  assert.equal(await text('liquidity-task-claim'), '$4,375.00');
  assert.equal(await text('liquidity-task-hold'), '$4,375.00');
  assert.equal(await text('liquidity-task-claim-tokens'), '1.4434 ETH + 2,165.06 USDC + fees', 'The claim’s value includes its fees, and the line under its bar says so.');
  assert.ok((await progress()).completed.includes('final-challenge'));
  const completedAfter = (await progress()).completed;
  assert.equal((await draft()).taskChecked, true);
  await reload();
  assert.equal(await hidden('learn-feedback'), false);
  assert.equal(await text('learn-feedback-title'), 'Challenge done.');
  assert.equal(await hidden('learn-continue'), false);
  assert.equal(await taskPrice(), '1500');
  assert.deepEqual((await draft()).inputs, original.inputs);
  await noDuplicateIds();

  // A task edit invalidates the current check, but retains the learner's history.
  await fill('liquidity-task-price', '1000');
  assert.equal(await hidden('learn-feedback'), true);
  assert.equal(await hidden('learn-continue'), true);
  assert.equal(await hidden('learn-share'), true);
  assert.equal((await draft()).taskChecked, false);
  assert.deepEqual((await progress()).completed, completedAfter);
  const edited = (await draft()).task;
  await reload();
  assert.deepEqual((await draft()).task, edited);
  assert.equal(await taskPrice(), '1000');
  assert.equal(await hidden('learn-feedback'), true);
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your setup.', 'The prior fee amount does not automatically match a new price.');
  await click('liquidity-task-match');
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Challenge done.');
  assert.equal(await text('liquidity-task-claim'), '$3,750.00');
  assert.equal(await text('liquidity-task-hold'), '$3,750.00');
  assert.match(await handoff(), /future=1000/);
  const ownHandoff = await handoff();
  assert.deepEqual((await draft()).inputs, original.inputs);
  const taskBeforeExploration = await draft();
  const taskResult = await text('liquidity-task-finding');
  await fill('comparison-price', '3000');
  assert.equal(await text('liquidity-task-finding'), taskResult);
  assert.deepEqual(await draft(), taskBeforeExploration, 'Observe exploration does not edit the assessed task.');
  assert.equal(await handoff(), ownHandoff, 'Exploring the worked example does not move the link to the reader’s own example.');
  assert.equal(await evaluate("document.getElementById('learn-share-url').value"), originalShare);
  assert.deepEqual(await isolated(), working);
  // The two goals and the solved state follow the sliders at once, before any check.
  const goals = () => evaluate("Array.from(document.querySelectorAll('#liquidity-task-goals li'), item => item.dataset.met)");
  const fee = () => text('liquidity-task-fees-value');
  await click('liquidity-task-reset');
  assert.deepEqual(await goals(), ['true', 'false'], 'At the starting price the position matches holding without a dollar loss.');
  assert.equal(await hidden('liquidity-task-solved'), true);
  await fill('liquidity-task-price', '1500');
  assert.deepEqual(await goals(), ['false', 'true']);
  assert.equal(await text('liquidity-task-finding'), 'Your claim is $44.87 behind holding. Holding is $625.00 below your start.');
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#liquidity-task-goals li'), item => item.textContent.replace(/\\s+/g, ' ').trim())"),
    ['○ Not yet: Your claim matches holding −$44.87', '✓ Met: Both are below your start −$625.00'], 'Each goal shows the amount that decides it.');
  await fill('liquidity-task-fees', '40');
  assert.equal(await fee(), '$40.00', 'An amount reached in one jump is used as given.');
  assert.equal(await text('liquidity-task-finding'), 'Your claim is $4.87 behind holding. Holding is $625.00 below your start.');
  await key('liquidity-task-fees', 'ArrowRight');
  assert.equal(await fee(), '$44.87', 'An arrow step that crosses the matching amount stops on it.');
  assert.ok(Math.abs((await draft()).task.fees - 44.8729810778068) < 1e-9, 'The slider settles on the exact amount, not a rounded one.');
  assert.deepEqual(await goals(), ['true', 'true']);
  assert.equal(await hidden('liquidity-task-solved'), false);
  assert.match(await text('liquidity-task-solved'), /^Solved\. Your claim and holding are both worth \$4,375\.00, which is \$625\.00 less than you started with\. Fees closed the gap to holding\. They did not undo the price fall\.$/);
  assert.equal(await hidden('learn-feedback'), true, 'Solving the task does not check the answer.');
  await key('liquidity-task-fees', 'ArrowRight');
  assert.equal(await fee(), '$49.87', 'The next step moves on from the matching amount.');
  assert.equal(await hidden('liquidity-task-solved'), true);
  await key('liquidity-task-fees', 'Home');
  assert.equal(await fee(), '$0.00', 'Home travels past the matching amount.');
  assert.equal(await text('liquidity-task-match'), 'Match holding for me');
  await click('liquidity-task-match');
  assert.equal(await fee(), '$44.87');
  assert.equal(await hidden('liquidity-task-solved'), false, 'The hint reaches the same solved state.');
  await fill('liquidity-task-price', '2400');
  assert.deepEqual(await goals(), ['false', 'false']);
  assert.equal(await hidden('liquidity-task-solved'), true, 'A new price needs its own fee amount.');
  console.log('PASS: independent constructed challenge, default-task failure, explained example, explicit checks, live goals and solved state, preserved completion and isolated Observe/handoff');

  for (const width of [390, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'learn.html#lesson=final-challenge');
    await click('liquidity-task-reset');
    await reduceMotion({ call, evaluate });
    try {
      // Nothing above either slider changes height while they move: the goals tick
      // in place, and the solved message opens below the fee slider.
      const tops = () => evaluate("['liquidity-task-price', 'liquidity-task-fees'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY))");
      const resting = await tops();
      for (const [price, fees] of [['1000', '0'], ['1000', '250'], ['1500', '44.8729810778068'], ['4000', '500'], ['2000', '0']]) {
        await fill('liquidity-task-price', price); await fill('liquidity-task-fees', fees);
        assert.deepEqual(await tops(), resting, `At ${width}px, ETH at ${price} with ${fees} in fees moves neither slider.`);
      }
      assert.equal(await evaluate("Array.from(document.querySelectorAll('#liquidity-task-goals li')).every(item => item.scrollWidth <= item.clientWidth + 1 && Array.from(item.children).every(part => part.getBoundingClientRect().right <= item.getBoundingClientRect().right + 1))"), true, 'Each goal fits its row.');
      // The tokens always fit on their one line; the note about fees shows only where it fits beside them.
      assert.equal(await evaluate("(() => { const line = document.getElementById('liquidity-task-claim-tokens'), box = line.getBoundingClientRect(); return line.firstElementChild.getBoundingClientRect().right <= box.right + .5 && box.height < 30; })()"), true, 'The line under the claim fits.');
      await key('liquidity-task-price', 'End');
      assert.equal(await taskPrice(), '4000');
      await key('liquidity-task-price', 'Home');
      assert.equal(await taskPrice(), '1000');
      await key('liquidity-task-price', 'ArrowRight');
      assert.equal(await taskPrice(), '1020');
      await key('liquidity-task-price', 'ArrowLeft');
      assert.equal(await taskPrice(), '1000');
      await key('liquidity-task-match', 'Enter');
      await click('learn-check');
      assert.equal(await text('learn-feedback-title'), 'Challenge done.');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.equal(await evaluate("document.querySelector('.learning-application-scene').getAnimations({subtree:true}).length"), 0);
      assert.ok(await evaluate("document.getElementById('liquidity-task-price').getBoundingClientRect().height >= 44"));
      assert.ok(await evaluate("Array.from(document.querySelectorAll('.learning-application-scene button')).every(button => button.getBoundingClientRect().height >= 44)"));
      await noDuplicateIds();
      await reload();
      assert.equal(await taskPrice(), '1000');
      assert.equal(await text('learn-feedback-title'), 'Challenge done.');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
  }
  assert.deepEqual(await isolated(), working);
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  console.log('PASS: constructed challenge at 390px/320px, native keyboard range/button input, restored checked task, unique IDs and reduced motion');
}
