import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

export async function checkLending({ evaluate, click, fill, text, navigate, base, call, nextEvent }) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'lending.html#experiment');
  assert.equal(await text('loan-health'), '1.60');
  assert.equal(await text('loan-net-assets'), '$10,000.00');
  await fill('loan-future', '1250');
  assert.equal(await text('loan-state'), 'At the liquidation boundary');
  await fill('loan-future', '1249.999');
  assert.equal(await text('loan-health'), '< 1.00');
  assert.equal(await text('loan-state'), 'Eligible for liquidation');
  await fill('loan-future', '1500'); await fill('loan-budget', '1000');
  assert.equal(await text('loan-response-repay'), '1.50');
  assert.equal(await text('loan-response-add'), '1.36');
  await fill('loan-borrow', '9000');
  assert.match(await text('loan-borrow-error'), /starting borrowing limit/);
  assert.equal(await evaluate("document.getElementById('loan-outcomes').hidden"), true);
  assert.equal(await text('loan-quick-health'), 'Check loan inputs');
  await click('loan-fix-input'); await settle(evaluate);
  assert.equal(await evaluate('document.activeElement.id'), 'loan-borrow');
  await fill('loan-borrow', '5000');
  await fill('loan-budget', '');
  assert.equal(await evaluate("document.getElementById('loan-budget').getBoundingClientRect().height>0"), true, 'An invalid response budget stays editable.');
  assert.equal(await evaluate("document.getElementById('loan-response-results').hidden"), true);
  assert.equal(await evaluate("document.getElementById('loan-outcomes').hidden"), false, 'An incomplete response must not hide the current loan.');
  assert.equal(await text('loan-health'), '1.20');
  assert.equal(await text('loan-net-assets'), '$7,500.00');
  assert.equal(await evaluate("document.getElementById('loan-share').disabled"), true);
  await fill('loan-budget', '6000');
  assert.equal(await text('loan-response-repay'), 'No debt');
  assert.match(await text('loan-repay-note'), /\$1,000.00 budget left/);
  await fill('loan-start', '1000');
  assert.match(await text('loan-start-limit'), /^\$3,750.00/);
  await fill('loan-start', '2000');
  await fill('loan-interestMode', 'simple');
  await fill('loan-days', '365');
  assert.equal(await text('loan-debt-value'), '$5,250.00');
  await click('loan-collateralEnabled');
  assert.match(await text('loan-borrow-error'), /Enable collateral/);
  await fill('loan-borrow', '0');
  assert.equal(await text('loan-health'), 'No debt');
  assert.match(await text('loan-start-limit'), /^\$0.00/);
  await click('loan-reset');
  await fill('loan-future', '1500'); await fill('loan-days', '30');
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}})");
  await click('loan-share');
  const shared = await evaluate("document.getElementById('loan-share-url').value");
  assert.match(shared, /loan=collateral-loan-v2/);
  assert.equal(await evaluate('document.activeElement.id'), 'loan-share-url');
  await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise((resolve,reject)=>{window.rejectLoanCopy=reject})}})");
  await click('loan-share');
  await fill('loan-days', '31');
  await evaluate("window.rejectLoanCopy(new Error('Delayed clipboard failure'))");
  await settle(evaluate);
  assert.equal(await evaluate("document.getElementById('loan-share-url').hidden"), true, 'A stale clipboard result must not restore an old link or steal focus.');
  await navigate(shared);
  assert.equal(await evaluate("document.getElementById('loan-days').value"), '30');
  await navigate(base + 'lending.html#loan=unsupported');
  assert.equal(await evaluate("document.getElementById('loan-route-note').hidden"), false);
  assert.equal(await evaluate("document.getElementById('loan-future').value"), '1500');
  console.log('PASS: lending balances, exact boundaries, interest, response budgets, validation, share links and draft restoration');

  const choose = (name, value) => evaluate(`document.querySelector('input[name="lend-${name}"][value="${value}"]').click()`);
  const cases = [
    ['supply', 'neither', 'separate', 'withdraw', '5.10 ETH'],
    ['borrow', 'more', 'liability', 'opening-limit', '$10,000.00'],
    ['conditions', 'same', 'interest', 'backing-faster', '$5,500.00'],
    ['respond', 'same', 'tradeoff', 'remaining-backing', '1.36'],
  ];
  const oldLiquidity = await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')");
  for (const [index, [id, prediction, reason, application, metric]] of cases.entries()) {
    await navigate(base + 'lending.html#lesson=' + id);
    assert.equal(await evaluate("document.getElementById('lending-experiment').hidden"), true);
    assert.equal(await evaluate("document.querySelectorAll('#lending-learn input[type=number]').length"), 0);
    await choose('prediction', prediction); await click('lend-reveal');
    assert.match(await text('lend-prediction-feedback'), /^The result differs from your prediction\./);
    assert.ok((await text('lend-metrics')).includes(metric));
    await click('lend-check');
    assert.equal(await text('lend-feedback-title'), 'Review your answers.');
    await choose('reason', reason); await choose('application', application); await click('lend-check');
    assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
    assert.equal(await text('lend-progress'), (index + 1) + ' of 4 checked');
    assert.equal(await evaluate('document.activeElement.id'), 'lend-feedback');
    assert.match(await evaluate("document.getElementById('lend-explore').href"), /loan=collateral-loan-v1/);
    assert.equal(await evaluate("document.getElementById('lend-explore').target"), '_blank');
  }
  await navigate(base + 'lending.html#lesson=respond');
  assert.equal(await text('lend-progress'), '4 of 4 checked');
  assert.equal(await evaluate("document.getElementById('lend-continue').hidden"), false);
  await click('lending-nav-experiment'); await settle(evaluate);
  assert.equal(await evaluate("document.getElementById('loan-future').value"), '1500');
  assert.equal(await evaluate("document.getElementById('loan-days').value"), '30');
  assert.equal(await evaluate("localStorage.getItem('degenerator-learning-liquidity-v1')"), oldLiquidity);
  await click('lending-nav-learn'); await settle(evaluate);
  assert.equal(await text('lend-number'), 'LENDING 4 OF 4', 'Learn resumes the lesson that was open.');
  await navigate(base + 'lending.html#learn');
  assert.equal(await text('lend-number'), 'LENDING 4 OF 4', 'The current lesson also survives a reload.');
  assert.equal(await evaluate("document.querySelector('.topic-current').tagName"), 'SPAN', 'The selected topic cannot silently change mode.');
  await navigate(base + 'lending.html#lesson=conditions');
  let loaded = nextEvent('Page.loadEventFired');
  await click('topic-liquidity'); await loaded;
  assert.ok(await evaluate("location.pathname.endsWith('/learn.html')"));
  loaded = nextEvent('Page.loadEventFired');
  await evaluate("document.querySelector('.topic-nav a[href=\"lending.html#learn\"]').click()");
  await loaded;
  assert.equal(await text('lend-number'), 'LENDING 3 OF 4', 'Switching learning topics preserves the lending lesson.');
  await navigate(base + 'liquidity.html#range-lab'); await fill('cl-future', '2350');
  loaded = nextEvent('Page.loadEventFired');
  await evaluate("document.querySelector('.topic-nav a[href^=\"lending.html\"]').click()");
  await loaded;
  loaded = nextEvent('Page.loadEventFired');
  await click('topic-liquidity');
  await loaded;
  assert.equal(await evaluate("document.getElementById('cl-future').value"), '2350');
  console.log('PASS: four conceptual lending lessons, ungraded predictions, completion, exact handoffs and topic draft isolation');

  for (const [width, height] of [[390, 844], [320, 740]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await navigate(base + 'lending.html#experiment');
    assert.equal(await evaluate("document.getElementById('loan-setup').open"), false);
    await click('loan-reset');
    assert.ok(await evaluate("document.getElementById('loan-future').getBoundingClientRect().bottom < innerHeight"), 'The first editable condition fits on the initial mobile screen.');
    await fill('loan-future', '1200');
    assert.equal(await text('loan-state'), 'Eligible for liquidation');
    await fill('loan-budget', ''); await fill('loan-budget', '1000');
    await click('loan-edit-rates'); await settle(evaluate);
    assert.equal(await evaluate('document.activeElement.id'), 'loan-supplyAPR');
    assert.equal(await evaluate("document.getElementById('loan-setup').open && document.getElementById('loan-assumptions').open"), true);
    await fill('loan-borrowAPR', '10');
    assert.match(await text('loan-rates'), /10% borrow/);
    await fill('loan-threshold', '70');
    await evaluate("document.getElementById('loan-assumptions').open=false;document.getElementById('loan-setup').open=false");
    await click('loan-show-result'); await settle(evaluate);
    assert.equal(await evaluate('document.activeElement.id'), 'loan-threshold');
    assert.equal(await evaluate("document.getElementById('loan-setup').open && document.getElementById('loan-assumptions').open"), true);
    assert.ok(await evaluate("document.activeElement.getBoundingClientRect().top >= document.getElementById('loan-quick-result').getBoundingClientRect().bottom"), 'Error recovery keeps the field below sticky feedback.');
    await fill('loan-threshold', '80');
    await fill('loan-collateral', '6');
    await click('loan-show-result'); await settle(evaluate);
    assert.equal(await evaluate('document.activeElement.id'), 'loan-risk');
    assert.ok(await evaluate("document.getElementById('loan-risk').getBoundingClientRect().top >= document.getElementById('loan-quick-result').getBoundingClientRect().bottom"), 'The full result opens below the sticky feedback.');
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
    await navigate(base + 'lending.html#lesson=respond');
    assert.equal(await evaluate("document.getElementById('lend-course').open"), false);
    await click('lend-retry'); await choose('prediction', 'same'); await click('lend-reveal');
    await choose('reason', 'tradeoff'); await choose('application', 'remaining-backing'); await click('lend-check'); await settle(evaluate);
    assert.equal(await evaluate('document.activeElement.id'), 'lend-feedback');
    assert.ok(await evaluate("document.getElementById('lend-next').getBoundingClientRect().bottom <= innerHeight"), 'The next step stays with the takeaway on mobile.');
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
    await click('lend-topics');
    assert.equal(await evaluate("document.getElementById('lend-course').open"), true);
    await click('lending-nav-experiment'); await settle(evaluate);
    assert.equal(await evaluate("document.getElementById('loan-collateral').value"), '6');
  }
  console.log('PASS: lending editing feedback, rate and error shortcuts, lesson resumption, current-topic identity and preserved inputs at 390px/320px');
}
