import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSON_IDS, VARIANTS, lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { LESSONS } from '../public/learning/liquidity-essentials.js';
import { predictionNote, tradePrediction, depositPrediction } from '../public/lib/lesson-narration.js';
import { predictionFeedback } from '../public/lib/learning-choices.js';
import { scenarioHash, scenarioFromHash } from '../public/lib/scenario-links.js';
import { fmt, usd } from '../public/lib/format.js';

test('a note stands in place of “You expected” only for a prediction that differs', () => {
  const choices = [['more', 'More ETH'], ['less', 'Less ETH']];
  assert.equal(predictionFeedback(choices, 'more', 'less', 'Less ETH.', '“More ETH” would be true if ETH had fallen.'),
    'The result differs from your prediction. Less ETH. “More ETH” would be true if ETH had fallen.');
  assert.equal(predictionFeedback(choices, 'more', 'less', 'Less ETH.'), 'The result differs from your prediction. Less ETH. You expected: More ETH.');
  assert.equal(predictionFeedback(choices, 'less', 'less', 'Less ETH.', 'unused'), 'Your prediction matches. Less ETH.');
  assert.equal(predictionFeedback(choices, '', 'less', 'Less ETH.', 'unused'), 'Less ETH.');
});

test('every prediction that differs has a one-sentence note, and a right or skipped one has none', () => {
  for (const lesson of LESSONS) for (let variant = 0; variant < VARIANTS; variant++) {
    const outcome = runLesson(lesson.id, lessonSetup(lesson.id, variant), variant);
    assert.equal(predictionNote(lesson.id, outcome, outcome.prediction), '');
    assert.equal(predictionNote(lesson.id, outcome, ''), '');
    assert.equal(predictionNote(lesson.id, outcome, 'unknown'), '');
    for (const [choice] of lesson.predictions) if (choice !== outcome.prediction) {
      const note = predictionNote(lesson.id, outcome, choice);
      assert.ok(note.length > 30 && /\.$/.test(note), lesson.id + ' ' + choice);
      // It names a condition. It does not say what the reader assumed.
      assert.doesNotMatch(note, /That assumes|You assumed|you thought|You expected/i, note);
      assert.doesNotMatch(note, /NaN|undefined/);
      if (lesson.id !== 'final-challenge') assert.match(note, /^“[^”]+” would be true /, note);
      // The verdict beside it says what holds here, so the note stays short.
      assert.ok(note.split(/\s+/).length <= 16, note);
    }
  }
});

test('each note’s condition is one where that answer is the right one', () => {
  for (let variant = 0; variant < VARIANTS; variant++) {
    // Lesson 1 names the amount at the starting pool price, which needs a fixed price and no fee.
    const swap = runLesson('swap-impact', lessonSetup('swap-impact', variant), variant), worth = fmt(swap.setup.amount * swap.setup.initialPrice, 0) + ' USDC';
    assert.equal(predictionNote('swap-impact', swap, 'same'), '“Exactly ' + worth + '” would be true at one fixed price with no fee.');
    // "More" is a claim about the average price received, with the fee in it. It does not invent another pool.
    assert.equal(predictionNote('swap-impact', swap, 'more'), '“More than ' + worth + '” would be true at an average above ' + usd(swap.setup.initialPrice) + ' per ETH, fee included.');
    assert.ok(swap.out / swap.setup.amount < swap.setup.initialPrice);
    assert.deepEqual(tradePrediction(swap.setup).choices.map(([, label]) => label), ['Less than ' + worth, 'Exactly ' + worth, 'More than ' + worth]);
    // Lesson 2 quotes the share against the pool as it stood.
    const share = runLesson('pool-share', lessonSetup('pool-share', variant), variant), naive = share.setup.depositEth / share.setup.reserveEth * 100;
    assert.equal(predictionNote('pool-share', share, 'same'), '“' + naive + '%” would be true if the pool stayed the size it was.');
    assert.ok(depositPrediction(share.setup).choices[1][1].startsWith(naive + '%,'));
    // Lesson 3: the other direction is where the other answer holds.
    const base = lessonSetup('token-balances', variant);
    for (const factor of [.5, 1, 2]) {
      const outcome = runLesson('token-balances', { futurePrice: base.initialPrice * factor }, variant);
      const at = other => runLesson('token-balances', { futurePrice: base.initialPrice * other }, variant).prediction;
      const still = factor === 1 ? ' Here the price has not moved.' : '';
      if (outcome.prediction !== 'more') { assert.equal(predictionNote('token-balances', outcome, 'more'), '“More ETH” would be true if ETH had fallen.' + still); assert.equal(at(.5), 'more'); }
      if (outcome.prediction !== 'less') { assert.equal(predictionNote('token-balances', outcome, 'less'), '“Less ETH” would be true if ETH had risen.' + still); assert.equal(at(2), 'less'); }
      // "The same ETH" must not hand over the question that follows, about a pool nobody has traded with.
      if (factor !== 1) assert.doesNotMatch(predictionNote('token-balances', outcome, 'same'), /nobody|traded/);
      // Lesson 4: the same as holding at the start, more than holding only with fees.
      const loss = runLesson('loss-vs-profit', { futurePrice: base.initialPrice * factor }, variant);
      if (factor === 1) assert.equal(predictionNote('loss-vs-profit', loss, 'less'), '“Less than holding” would be true at any other price.');
      else {
        assert.equal(predictionNote('loss-vs-profit', loss, 'same'), '“The same as holding” would be true at the starting price.');
        assert.equal(runLesson('loss-vs-profit', { futurePrice: base.initialPrice }, variant).prediction, 'same');
        const paid = runLesson('fee-break-even', { futurePrice: base.initialPrice * factor, fees: loss.result.breakEvenFees + 1 }, variant).result;
        assert.ok(paid.lpValue > paid.holdValue, 'With enough fees the claim is worth more than holding.');
      }
      assert.equal(predictionNote('loss-vs-profit', loss, 'more'), '“More than holding” would be true with enough fees. None are counted here.');
    }
    // Lesson 6: each answer is right somewhere on the track, and the note says where.
    const range = lessonSetup('range-boundaries', variant);
    const notes = { eth: '“Only ETH” would be true at or below the lower end of your range.', both: '“ETH and USDC” would be true inside your range.', usdc: '“Only USDC” would be true at or above the upper end of your range.' };
    for (const factor of [.5, .9, 1, 1.05, 1.1, 2]) {
      const outcome = runLesson('range-boundaries', { ...range, futurePrice: range.initialPrice * factor }, variant);
      for (const choice of ['eth', 'both', 'usdc']) if (choice !== outcome.prediction) assert.equal(predictionNote('range-boundaries', outcome, choice), notes[choice]);
      // The edges belong with the outside: the claim is one token at either end.
      assert.equal(outcome.prediction, factor <= .9 ? 'eth' : factor >= 1.1 ? 'usdc' : 'both');
    }
  }
});

test('the challenge’s lab link can carry any example the sliders allow', () => {
  for (let variant = 0; variant < VARIANTS; variant++) {
    const base = lessonSetup('final-challenge', variant);
    for (const [price, fees] of [[base.initialPrice / 2, 0], [base.initialPrice * 2, base.investment / 10], [base.initialPrice * .75, 44.8729810778068], [base.initialPrice, 0]]) {
      const opened = scenarioFromHash(scenarioHash({ ...base, futurePrice: price, fees }));
      assert.deepEqual([opened.futurePrice, opened.fees, opened.investment, opened.initialPrice], [price, fees, base.investment, base.initialPrice]);
    }
  }
  assert.deepEqual(LESSON_IDS.length, 7);
});
