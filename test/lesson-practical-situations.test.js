import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSON_IDS, lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { essentialQuestionRevisions } from '../public/models/lesson-application.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';
import { lessonFinding } from '../public/lib/lesson-narration.js';
import { parseProgress } from '../public/data/learning-progress.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} differs from ${expected}`);

test('each variation’s default quote is the one its questions name', () => {
  const defaults = [18132.217877, 6799.581704, 54396.653632];
  for (let variant = 0; variant < 3; variant++) {
    const setup = lessonSetup('swap-impact', variant), result = runLesson('swap-impact', setup, variant);
    close(result.out, defaults[variant]);
    assert.equal(result.prediction, 'less');
    const copy = lessonApplicationCopy('swap-impact', result);
    assert.equal(copy.expected, 'deeper');
    // The slippage question left the lesson: it belongs beside the sandbox's own control.
    assert.doesNotMatch(JSON.stringify(copy), /slippage|tolerance|wallet/i);
  }
});

test('two views of one claim are worded for each variation’s direction, in its own values', () => {
  const expected = [
    ['Your dashboard says you are up 41.42% on what you started with. Another view says you are 5.72% behind holding.',
      'No. A claim that is up 41.42% cannot be behind.', 'No. A claim that is behind holding has lost money.'],
    ['Your dashboard says you are down 29.29% on what you started with. Another view says you are 5.72% behind holding.',
      'No. A claim that is down 29.29% is 29.29% behind holding.', 'No. A claim that is 5.72% behind holding has lost only 5.72%.'],
    ['Your dashboard says you are up 22.47% on what you started with. Another view says you are 2.02% behind holding.',
      'No. A claim that is up 22.47% cannot be behind.', 'No. A claim that is behind holding has lost money.'],
  ];
  for (let variant = 0; variant < 3; variant++) {
    const result = runLesson('loss-vs-profit', lessonSetup('loss-vs-profit', variant), variant);
    const copy = lessonApplicationCopy('loss-vs-profit', result), text = Object.fromEntries(copy.choices);
    assert.equal(copy.expected, 'both-right');
    assert.deepEqual([copy.context, text['profit-only'], text['gap-only']], expected[variant]);
    // The verdict above the question gives the same two comparisons in dollars.
    const finding = lessonFinding('loss-vs-profit', result);
    assert.match(finding, variant === 1 ? /less than holding and \$878\.68 less than the \$3,000\.00 you started with\.$/ : /less than holding\. It is still \$[\d,.]+ more than the \$[\d,.]+ you started with\.$/);
    assert.doesNotMatch(JSON.stringify(copy), /deposit\b/, 'The lessons call it what you started with.');
  }
});

test('range variations begin above, below and inside with matching direction-aware explanations', () => {
  for (const [variant, price, expected, direction] of [[0, 2400, 'usdc', /bought ETH from your claim/], [1, 1275, 'eth', /sold ETH to your claim/], [2, 3150, 'both', /less ETH and more USDC/]]) {
    const setup = lessonSetup('range-boundaries', variant);
    const result = runLesson('range-boundaries', setup, variant);
    assert.equal(setup.futurePrice, price);
    assert.equal(result.prediction, expected);
    assert.match(lessonFinding('range-boundaries', result), direction);
    assert.match(lessonFinding('range-boundaries', result), expected === 'eth' ? /^Only ETH\./ : expected === 'usdc' ? /^Only USDC\./ : /^ETH and USDC\./);
    // The present token mix does not establish past fees: that is the question in every variation.
    assert.equal(lessonApplicationCopy('range-boundaries', result).expected, 'path');
  }
});

test('question migrations retire changed answers and keep completion plus compatible custom inputs', () => {
  for (const [id, variant, oldApplication, revision] of [['swap-impact', 0, 'quote-received', 3], ['pool-share', 1, 'larger-same-claim', 3], ['token-balances', 0, 'original-mix', 1],
    ['loss-vs-profit', 0, 'holding-basket', 4], ['loss-vs-profit', 1, 'gap-unchanged', 3], ['fee-break-even', 2, 'gap-reopens', 3],
    ['range-boundaries', 0, 'narrow-out', 2], ['range-boundaries', 2, 'eth-owned', 2]]) {
    const result = runLesson(id, lessonSetup(id, variant), variant);
    const parsed = parseProgress({version: 1, completed: [id], drafts: {[id]: {variant, inputs: result.setup, prediction: result.prediction, predictionRevision: essentialQuestionRevisions(id, variant).prediction, application: oldApplication, applicationRevision: revision, ran: true}}});
    assert.deepEqual(parsed.completed, [id]);
    assert.equal(parsed.drafts[id].application, '');
    assert.equal(parsed.drafts[id].prediction, result.prediction);
  }
  for (const variant of [1, 2]) {
    const inputs = {...lessonSetup('range-boundaries', variant), futurePrice: 1750, width: .5};
    const old = {version: 1, completed: ['range-boundaries'], drafts: {'range-boundaries': {variant, inputs, prediction: 'usdc', ran: true}}};
    const parsed = parseProgress(old), draft = parsed.drafts['range-boundaries'];
    assert.equal(draft.prediction, '');
    assert.equal(draft.predictionRevision, essentialQuestionRevisions('range-boundaries', variant).prediction);
    assert.equal(draft.inputs.futurePrice, 1750);
    assert.equal(draft.inputs.width, .5);
    assert.deepEqual(parsed.completed, ['range-boundaries']);
    draft.prediction = 'both';
    assert.deepEqual(parseProgress(parsed), parsed);
  }
});

test('no answer is given away by its length, and each question with its answers fits a phone', () => {
  for (const id of LESSON_IDS) for (let variant = 0; variant < 3; variant++) {
    const copy = lessonApplicationCopy(id, runLesson(id, lessonSetup(id, variant), variant));
    const words = text => text.split(/\s+/).length, counts = copy.choices.map(([, text]) => words(text));
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 5, id + ' ' + variant + ': ' + counts);
    const right = words(Object.fromEntries(copy.choices)[copy.expected]);
    assert.ok(right - Math.max(...counts.filter((_, index) => copy.choices[index][0] !== copy.expected)) <= 2, id + ': the right answer is not the long one');
    // A guideline, not a limit: the case, the question and its answers together.
    const total = words(copy.context) + words(copy.question) + counts.reduce((sum, count) => sum + count, 0);
    assert.ok(total <= 80, id + ' ' + variant + ': ' + total + ' words');
  }
});
