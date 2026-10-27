import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonApplication, essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';
import { rangeBoundaryNarration } from '../public/lib/lesson-narration.js';
import { parseProgress } from '../public/data/learning-progress.js';
import { scenarioFromHash } from '../public/lib/scenario-links.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} differs from ${expected}`);

test('wallet tolerance is measured from the fee-inclusive quote, not the starting spot value', () => {
  const defaults = [18132.217877, 6799.581704, 54396.653632];
  for (let variant = 0; variant < 3; variant++) {
    const setup = lessonSetup('swap-impact', variant);
    for (const amount of [1, setup.amount, setup.reserveEth / 2]) {
      const result = runLesson('swap-impact', {amount}, variant);
      const application = lessonApplication('swap-impact', result);
      const copy = lessonApplicationCopy('swap-impact', result);
      assert.equal(result.prediction, 'less', 'The opening prediction remains qualitative.');
      assert.equal(application.quote, result.out);
      close(application.minimumReceived, application.quote * .995);
      assert.ok(application.minimumReceived < application.startingValue * .995);
      assert.equal(copy.expected, 'quote-received');
      assert.equal(copy.evidence.rows.length, 3);
      assert.match(copy.context, /Nothing changes in the pool/);
      if (application.impact <= .5) {
        assert.doesNotMatch(copy.choices.find(([key]) => key === 'quote-misread')[1], /impact exceeds/);
        assert.match(copy.feedbackByChoice['quote-misread'], /not an extra fee/);
      }
      if (amount === setup.amount) close(application.quote, defaults[variant]);
    }
  }
});

test('hypothetical dashboards separate principal, supplied fees and the original holding basket', () => {
  for (const [variant, fees, total, gap] of [[0, 180, 7251.067811865476, -248.93218813452404], [2, 200, 7548.469228349535, 48.46922834953527]]) {
    const setup = lessonSetup('loss-vs-profit', variant);
    const result = runLesson('loss-vs-profit', setup, variant);
    const application = lessonApplication('loss-vs-profit', result);
    const copy = lessonApplicationCopy('loss-vs-profit', result);
    const dashboard = application.next.result;
    assert.equal(application.fees, fees);
    close(dashboard.lpValue, total);
    close(dashboard.difference, gap);
    assert.equal(dashboard.lpBeforeFees, result.result.lpBeforeFees);
    assert.deepEqual(dashboard.held, result.result.held);
    assert.equal(copy.expected, 'holding-basket');
    assert.match(copy.context, /hypothetical[\s\S]*not estimated from the price move/);
    const link = new URL(copy.evidence.explore.href, 'https://teren.sh/learn.html');
    const parsed = scenarioFromHash(link.hash);
    assert.equal(link.pathname, '/liquidity.html');
    assert.equal(parsed.fees, fees);
    assert.equal(parsed.futurePrice, setup.futurePrice);
  }
  const retained = runLesson('loss-vs-profit', lessonSetup('loss-vs-profit', 1), 1);
  assert.equal(lessonApplication('loss-vs-profit', retained).expected, 'gap-unchanged');
  assert.match(lessonApplicationCopy('loss-vs-profit', retained).context, /withdraws/);
});

test('range variations begin above, below and inside with matching direction-aware explanations', () => {
  for (const [variant, price, expected, direction] of [[0, 2400, 'usdc', /ETH for USDC/], [1, 1275, 'eth', /USDC for ETH/], [2, 3150, 'both', /ETH for USDC/]]) {
    const setup = lessonSetup('range-boundaries', variant);
    const result = runLesson('range-boundaries', setup, variant);
    assert.equal(setup.futurePrice, price);
    assert.equal(result.prediction, expected);
    assert.match(rangeBoundaryNarration(result), direction);
    assert.match(rangeBoundaryNarration(result), expected === 'eth' ? /all ETH/ : expected === 'usdc' ? /all USDC/ : /contains both ETH and USDC/);
    assert.equal(result.reason, 'path', 'The present token mix still does not establish past fees.');
  }
});

test('question migrations retire changed answers and keep completion plus compatible custom inputs', () => {
  for (const [id, variant, oldApplication, revision] of [['swap-impact', 0, 'deeper-less', 1], ['swap-impact', 1, 'deeper-more', 2], ['loss-vs-profit', 0, 'gap-unchanged', 3], ['loss-vs-profit', 2, 'gap-unchanged', 3]]) {
    const result = runLesson(id, lessonSetup(id, variant), variant);
    const parsed = parseProgress({version: 1, completed: [id], drafts: {[id]: {variant, inputs: result.setup, prediction: result.prediction, reason: result.reason, reasonRevision: essentialQuestionRevisions(id, variant).reason, application: oldApplication, applicationRevision: revision, ran: true}}});
    assert.deepEqual(parsed.completed, [id]);
    assert.equal(parsed.drafts[id].application, '');
    assert.equal(parsed.drafts[id].prediction, result.prediction);
    assert.equal(parsed.drafts[id].reason, result.reason);
  }
  for (const variant of [1, 2]) {
    const inputs = {...lessonSetup('range-boundaries', variant), futurePrice: 1750, width: .5};
    const old = {version: 1, completed: ['range-boundaries'], drafts: {'range-boundaries': {variant, inputs, prediction: 'usdc', reason: 'path', ran: true}}};
    const parsed = parseProgress(old), draft = parsed.drafts['range-boundaries'];
    assert.equal(draft.prediction, '');
    assert.equal(draft.predictionRevision, essentialQuestionRevisions('range-boundaries', variant).prediction);
    assert.equal(draft.inputs.futurePrice, 1750);
    assert.equal(draft.inputs.width, .5);
    assert.equal(draft.reason, 'path');
    assert.deepEqual(parsed.completed, ['range-boundaries']);
    draft.prediction = 'both';
    assert.deepEqual(parseProgress(parsed), parsed);
  }
});
