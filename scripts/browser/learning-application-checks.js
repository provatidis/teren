import assert from 'node:assert/strict';

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
  await fill('liquidity-task-price', '1300');
  await reload();
  assert.equal(await taskPrice(), '1300', 'An unrevealed construction survives reopening the lesson.');
  await click('learn-run');
  assert.equal(await taskPrice(), '1300', 'Opening the worked example preserves the learner’s selected price.');
  await click('liquidity-task-reset');
  const original = await draft();
  const completedBefore = (await progress()).completed;
  const working = await isolated();
  const originalHandoff = await handoff();
  const originalObservation = await observed();
  assert.equal(await taskPrice(), '2000');
  assert.equal(await hidden('learn-application-task'), false);
  assert.equal(await text('learn-application-label'), 'Match holding while losing dollars');
  assert.equal(await text('learn-check'), 'Check this setup and answers →');
  assert.match(originalHandoff, /future=4000/);
  await noDuplicateIds();

  await choose('reason', 'total');
  await choose('application', 'relative-gap');
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your setup.');
  assert.equal(await evaluate('document.activeElement.id'), 'liquidity-task-feedback');
  assert.equal(await hidden('learn-continue'), true);
  assert.equal(await hidden('learn-share'), true);
  assert.deepEqual((await progress()).completed, completedBefore, 'Correct choices alone do not complete the default task.');

  await click('liquidity-task-example');
  assert.equal(await taskPrice(), '1500');
  assert.equal(await observed(), originalObservation);
  assert.equal(await handoff(), originalHandoff);
  assert.deepEqual((await draft()).inputs, original.inputs);
  await choose('application', 'capital-restored');
  await click('learn-check');
  assert.equal(await text('learn-feedback-title'), 'Review your answers.');
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
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  assert.equal(await text('liquidity-task-lp-value'), '$4,375.00');
  assert.equal(await text('liquidity-task-hold-value'), '$4,375.00');
  assert.equal(await text('liquidity-task-start-value'), '$5,000.00');
  assert.ok((await progress()).completed.includes('final-challenge'));
  const completedAfter = (await progress()).completed;
  assert.equal((await draft()).taskChecked, true);
  await reload();
  assert.equal(await hidden('learn-feedback'), false);
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
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
  assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
  assert.equal(await text('liquidity-task-lp-value'), '$3,750.00');
  assert.equal(await text('liquidity-task-hold-value'), '$3,750.00');
  assert.equal(await handoff(), originalHandoff);
  assert.deepEqual((await draft()).inputs, original.inputs);
  const taskBeforeExploration = await draft();
  const taskResult = await text('liquidity-task-finding');
  await fill('comparison-price', '3000');
  assert.equal(await text('liquidity-task-finding'), taskResult);
  assert.deepEqual(await draft(), taskBeforeExploration, 'Observe exploration does not edit the assessed task.');
  assert.equal(await handoff(), originalHandoff);
  assert.deepEqual(await isolated(), working);
  // The two goals and the solved state follow the sliders at once, before any check.
  const goals = () => evaluate("Array.from(document.querySelectorAll('#liquidity-task-goals li'), item => item.dataset.met)");
  const fee = () => text('liquidity-task-fees-value');
  await click('liquidity-task-reset');
  assert.deepEqual(await goals(), ['true', 'false'], 'At the starting price the position matches holding without a dollar loss.');
  assert.equal(await hidden('liquidity-task-solved'), true);
  await fill('liquidity-task-price', '1500');
  assert.deepEqual(await goals(), ['false', 'true']);
  assert.equal(await text('liquidity-task-finding'), 'LP + fees is $44.87 below holding. Holding is $625.00 below the starting capital.');
  await fill('liquidity-task-fees', '40');
  assert.equal(await fee(), '$40.00', 'An amount reached in one jump is used as given.');
  assert.equal(await text('liquidity-task-finding'), 'LP + fees is $4.87 below holding. Holding is $625.00 below the starting capital.');
  await key('liquidity-task-fees', 'ArrowRight');
  assert.equal(await fee(), '$44.87', 'An arrow step that crosses the matching amount stops on it.');
  assert.ok(Math.abs((await draft()).task.fees - 44.8729810778068) < 1e-9, 'The slider settles on the exact amount, not a rounded one.');
  assert.deepEqual(await goals(), ['true', 'true']);
  assert.equal(await hidden('liquidity-task-solved'), false);
  assert.match(await text('liquidity-task-solved'), /^Solved\. The pool position and holding are both worth \$4,375\.00, which is \$625\.00 less than you started with\./);
  assert.equal(await hidden('learn-feedback'), true, 'Solving the task does not check the written answers.');
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
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    try {
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
      assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.equal(await evaluate("document.querySelector('.learning-application-scene').getAnimations({subtree:true}).length"), 0);
      assert.ok(await evaluate("document.getElementById('liquidity-task-price').getBoundingClientRect().height >= 44"));
      assert.ok(await evaluate("Array.from(document.querySelectorAll('.learning-application-scene button')).every(button => button.getBoundingClientRect().height >= 44)"));
      await noDuplicateIds();
      await reload();
      assert.equal(await taskPrice(), '1000');
      assert.equal(await text('learn-feedback-title'), 'Both answers are correct.');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    } finally { await call('Emulation.setEmulatedMedia', { features: [] }); }
  }
  assert.deepEqual(await isolated(), working);
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  console.log('PASS: constructed challenge at 390px/320px, native keyboard range/button input, restored checked task, unique IDs and reduced motion');
}
