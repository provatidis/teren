import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonFinding, lessonReasonFeedback, rangePrediction, priceMovePrediction, tokenBalanceNarration, benchmarkPrediction, lossProfitReasoning, feePrediction } from '../public/lib/lesson-narration.js';
import { lessonApplicationCopy } from '../public/lib/lesson-application-copy.js';
import { rangePositionState, rangeSceneState } from '../public/lib/liquidity-scene-state.js';
import { managementCase } from '../public/models/range-decisions.js';
import { lendingCase, checkLendingUnderstanding } from '../public/models/lending-lessons.js';
import { loopCase, checkLoopUnderstanding } from '../public/models/loop-lessons.js';
import { calculateLoan } from '../public/models/collateral-loan-v1.js';
import { calculateLoop } from '../public/models/borrowing-loop-v1.js';
import { appliedQuestion } from '../public/lib/applied-lessons.js';
import { validatePositionPeriod } from '../public/data/position-period.js';
import { depositSceneState } from '../public/lib/foundation-scene-state.js';
import { LESSONS } from '../public/learning/liquidity-essentials.js';
import { fmt, usd } from '../public/lib/format.js';

test('findings track changed price directions and the average price rather than the starting pool price', () => {
  const swap = runLesson('swap-impact', lessonSetup('swap-impact'));
  const finding = lessonFinding('swap-impact', swap);
  assert.match(finding, /starting pool price of \$2,000\.00, 10 ETH is worth 20,000 USDC/);
  assert.match(finding, /quotes 18,132\.22 USDC for the whole trade, an average price of \$1,813\.22 per ETH/);
  // The difference is already in the quote. Calling it a loss would teach the
  // confusion the wallet question clears up.
  assert.doesNotMatch(finding, /\blos[est]/i);
  // Lesson 3's verdict answers the question first, then shows the claim before and after.
  for (const [price, text] of [[1000, /^More ETH\. Traders sold ETH to the pool.*from 1\.25 ETH \+ 2,500 USDC to 1\.7678 ETH \+ 1,767\.77 USDC\.$/],
    [2000, /^The same ETH\..*nobody had a reason to trade\. Your claim is still 1\.25 ETH \+ 2,500 USDC\.$/],
    [4000, /^Less ETH\. Traders bought ETH from the pool.*from 1\.25 ETH \+ 2,500 USDC to 0\.8839 ETH \+ 3,535\.53 USDC\.$/]]) {
    assert.match(lessonFinding('token-balances', runLesson('token-balances', { futurePrice: price })), text);
  }
  for (const variant of [0, 1, 2]) {
    const setup = lessonSetup('pool-share', variant), frame = depositSceneState(setup, setup.depositEth, variant);
    assert.ok(frame.laterClaim.eth > frame.initialClaim.eth && frame.laterClaim.usdc < frame.initialClaim.usdc);
    assert.ok(Math.abs(frame.laterClaim.eth / frame.traded.eth - frame.fraction) < 1e-12);
  }
});

test('range scenes show token endpoints and the different gaps to each original basket', () => {
  const { narrow, wide } = managementCase('range-width');
  const frames = rangeSceneState(narrow, wide, 2090);
  assert.equal(frames[0].status, 'Inside range'); assert.equal(frames[1].status, 'Inside range');
  assert.ok(Math.abs(frames[0].result.breakEvenFees - 50.09763644) < 1e-7);
  assert.ok(Math.abs(frames[1].result.breakEvenFees - 10.33553199) < 1e-7);
  assert.notEqual(frames[0].result.holdValue, frames[1].result.holdValue);
  assert.equal(rangePositionState(narrow, 2100).result.pooled.eth, 0);
  assert.ok(rangePositionState(narrow, 2090).result.pooled.eth > 0);
  assert.equal(rangePositionState(narrow, 1900).result.pooled.usdc, 0);
});

test('lesson 6 names the move against the range, and its verdict says what the claim holds and where the trading stopped', () => {
  const where = { above: /, above your range\. /, below: /, below your range\. /, 'upper-edge': /, the upper end of your range\. /, 'lower-edge': /, the lower end of your range\. /, inside: /inside your range\. / };
  for (const variant of [0, 1, 2]) {
    for (const width of [.05, .1, .5]) {
      const base = lessonSetup('range-boundaries', variant);
      for (const factor of [.5, .95, 1, 1.05, 2]) {
        const outcome = runLesson('range-boundaries', { ...base, width, futurePrice: base.initialPrice * factor }, variant), { setup, result } = outcome;
        const question = rangePrediction(setup, result), finding = lessonFinding('range-boundaries', outcome);
        assert.match(question, factor > 1 ? /^ETH rises from / : factor < 1 ? /^ETH falls from / : /^ETH stays at /);
        assert.match(question, where[result.state]);
        assert.match(question, /What does your claim hold then\?$/);
        if (result.pooled.eth === 0) {
          assert.ok(finding.startsWith('Only USDC. On the way up, traders bought ETH from your claim and paid in USDC. The last ETH went at ' + usd(result.upperPrice) + ', the upper end of your range. '), finding);
          assert.ok(finding.endsWith(fmt(result.pooled.usdc, 2) + ' USDC.'), finding);
        } else if (result.pooled.usdc === 0) {
          assert.ok(finding.startsWith('Only ETH. On the way down, traders sold ETH to your claim and took USDC. The last USDC went at ' + usd(result.lowerPrice) + ', the lower end of your range. '), finding);
          assert.ok(finding.endsWith(fmt(result.pooled.eth, 4) + ' ETH.'), finding);
        } else {
          assert.ok(finding.startsWith('ETH and USDC. ' + usd(setup.futurePrice) + ' is inside your range, so traders are still swapping against your claim.'), finding);
          assert.match(finding, factor > 1 ? /less ETH and more USDC than at the start\.$/ : factor < 1 ? /more ETH and less USDC than at the start\.$/ : /its starting tokens\.$/);
        }
        // Past the range nothing trades; at its very end the claim has only just run out.
        assert.equal(/nothing trades, so your claim stays at/.test(finding), ['above', 'below'].includes(result.state), finding);
      }
    }
  }
  // The three variations end above, below and inside the range, so no answer can be guessed from the last one.
  assert.deepEqual([0, 1, 2].map(variant => runLesson('range-boundaries', lessonSetup('range-boundaries', variant), variant).prediction), ['usdc', 'eth', 'both']);
});

test('lesson 6 uses the names of lessons 3 to 5, and its check questions cannot be read off the figure', () => {
  const lesson = LESSONS.find(item => item.id === 'range-boundaries');
  assert.equal(lesson.intro, 'Here your liquidity works only inside a price range you choose. See what your claim holds when ETH leaves it.');
  const texts = [lesson.intro, lesson.prediction, lesson.reasoning, lesson.explanation, lesson.takeaway, lesson.completion, ...lesson.reasons.map(([, copy]) => copy), ...Object.values(lesson.reasonFeedbackByChoice)];
  for (const variant of [0, 1, 2]) {
    const outcome = { ...runLesson('range-boundaries', lessonSetup('range-boundaries', variant), variant), variant }, copy = lessonApplicationCopy('range-boundaries', outcome);
    texts.push(rangePrediction(outcome.setup, outcome.result), lessonFinding('range-boundaries', outcome), copy.label, copy.context, copy.question, copy.hint, copy.feedback,
      ...copy.choices.map(([, text]) => text), ...Object.values(copy.feedbackByChoice), lessonReasonFeedback('range-boundaries', outcome, 'zero'));
    assert.equal(copy.choices[0][0], copy.expected);
    if (variant < 2) {
      // A second, narrower range at a price between the two ranges' ends.
      const { application } = copy, { setup } = outcome, up = variant === 0;
      assert.equal(application.kind, 'narrower-range');
      assert.equal(application.next.result.state, 'inside');
      assert.equal(application.narrow.state, up ? 'above' : 'below');
      assert.equal(application.narrow.pooled[up ? 'eth' : 'usdc'], 0);
      assert.ok(Math.abs(application.narrow.upperPrice - application.narrow.lowerPrice - setup.initialPrice * setup.width) < 1e-9, 'Half as wide as the reader’s range.');
      assert.ok(copy.context.includes(usd(application.narrow.lowerPrice) + '–' + usd(application.narrow.upperPrice)) && copy.context.includes('inside your range, ' + (up ? 'above' : 'below') + ' theirs'), copy.context);
      assert.equal(copy.choices[0][1], 'Yours holds both tokens. Theirs is all ' + (up ? 'USDC' : 'ETH') + ' and has stopped trading.');
    } else assert.match(copy.feedback, /not a stop-loss order and not a loan/);
  }
  const copy = texts.join(' ');
  assert.doesNotMatch(copy, /position|principal|boundary|bound\b|liquidity stays|LP\b/i);
  assert.match(copy, /your claim/i); assert.match(copy, /your range/);
});

test('new lending and leverage follow-ups follow the existing financial models', () => {
  const original = lendingCase('conditions').input;
  const start = calculateLoan({ ...original, days: 0, supplyAPR: 3, borrowAPR: 2 });
  const changed = calculateLoan({ ...original, days: 365, supplyAPR: 3, borrowAPR: 2 });
  assert.ok(changed.end.healthFactor > start.end.healthFactor);
  assert.equal(checkLendingUnderstanding('conditions', 'interest', 'backing-faster').passed, true);
  assert.equal(checkLendingUnderstanding('conditions', 'interest', 'lower').passed, false, 'An old answer cannot grade the new situation.');
  const loop = loopCase('stress');
  assert.ok(loop.result.end.healthFactor > 1);
  assert.ok(loop.result.end.netAssets < loop.result.holdingValue);
  assert.equal(checkLoopUnderstanding('stress', 'exposure', 'backing-not-profit').passed, true);
  assert.equal(checkLoopUnderstanding('stress', 'exposure', 'loop-gain').passed, false);
  assert.equal(checkLoopUnderstanding('stress', 'exposure', 'falls').passed, false);
});

test('the historical contrast preserves the full record and its final assessed endpoint', async () => {
  const raw = JSON.parse(await readFile(new URL('../public/examples/uniswap-v3-position-range-return.json', import.meta.url), 'utf8'));
  const period = validatePositionPeriod(raw), before = JSON.stringify(period);
  const question = appliedQuestion(period, 'period-vs-holding');
  assert.equal(question.contrastIndex, 6);
  assert.equal(question.index, period.points.length - 1);
  assert.ok(question.contrast.feesUSD > 0 && question.contrast.gapUSD < 0);
  assert.ok(question.view.gapUSD > 0);
  assert.ok(Math.abs(question.contrast.gapUSD + .5119849579) < 1e-8);
  assert.equal(JSON.stringify(period), before);
});

test('lesson 3 names its price move in the question and checks an idea its scene cannot show', () => {
  const questions = [0, 1, 2].map(variant => priceMovePrediction(lessonSetup('token-balances', variant)));
  assert.deepEqual(questions, [
    'ETH rises from $2,000.00 to $4,000.00. Will your claim hold less, more, or the same ETH?',
    'ETH falls from $1,500.00 to $750.00. Will your claim hold less, more, or the same ETH?',
    'ETH rises from $3,000.00 to $4,500.00. Will your claim hold less, more, or the same ETH?',
  ]);
  assert.match(priceMovePrediction({ initialPrice: 2000, futurePrice: 2000 }), /^ETH stays at \$2,000\.00\./);
  for (const variant of [0, 1, 2]) {
    const copy = tokenBalanceNarration(runLesson('token-balances', lessonSetup('token-balances', variant), variant));
    // The slider always shows a pool that traders have already brought to the
    // market price, so a pool nobody has traded with yet is a new situation.
    assert.match(copy.reasoning, /nobody has traded with the pool yet/);
    // The lesson's one explanation must not hand over the answer word for word.
    const lesson = LESSONS.find(item => item.id === 'token-balances');
    for (const [, answer] of copy.reasons) assert.ok(!lesson.explanation.includes(answer.split('. ')[1]), answer);
    const words = copy.reasons.map(([, answer]) => answer.split(' ').length);
    assert.ok(Math.max(...words) - Math.min(...words) <= 3, 'answers are of similar length: ' + words);
  }
});

test('lesson 4 asks about holding in the lesson’s own numbers and leaves the cause to its check question', () => {
  const lesson = LESSONS.find(item => item.id === 'loss-vs-profit');
  for (const variant of [0, 1, 2]) for (const factor of [.5, 1, 1.5, 2]) {
    const base = lessonSetup('loss-vs-profit', variant);
    const outcome = runLesson('loss-vs-profit', { futurePrice: base.initialPrice * factor }, variant), { result, setup } = outcome;
    const { question, choices } = benchmarkPrediction(setup);
    // The question's holding value is the model's own.
    assert.ok(question.includes(usd(result.holdValue)), question);
    assert.match(question, factor > 1 ? /^ETH rises from / : factor < 1 ? /^ETH falls from / : /^ETH stays at /);
    assert.deepEqual(choices.map(([id]) => id), ['more', 'less', 'same']);
    assert.deepEqual(choices, lesson.predictions);
    assert.equal(outcome.prediction, factor === 1 ? 'same' : 'less');
    const finding = lessonFinding('loss-vs-profit', outcome);
    if (factor === 1) assert.match(finding, /^The same\. At the starting price your claim and holding are the same tokens/);
    else {
      assert.ok(finding.startsWith('Less. Your claim is worth ' + usd(result.lpBeforeFees) + ', which is ' + usd(result.breakEvenFees) + ' less than holding'), finding);
      assert.match(finding, factor > 1 ? /It is still \$[\d,.]+ more than the \$[\d,.]+ you started with\.$/ : / and \$[\d,.]+ less than the \$[\d,.]+ you started with\.$/);
    }
    // The explanation names the gap and leaves its cause to the check question.
    const correct = lossProfitReasoning(outcome).reasons[0][1];
    assert.ok(!lesson.explanation.includes(correct));
    assert.doesNotMatch(lesson.explanation, /bought ETH|sold ETH|holds less ETH|holds more ETH/);
    const words = lossProfitReasoning(outcome).reasons.map(([, answer]) => answer.split(' ').length);
    assert.ok(Math.max(...words) - Math.min(...words) <= 5, 'answers are of similar length: ' + words);
  }
  assert.match(lesson.explanation, /never beats holding[\s\S]*impermanent loss[\s\S]*a comparison, not a charge/);
  assert.doesNotMatch(lesson.intro, /fall behind|behind holding|trails/);
});

test('lesson 5 asks which bar fees grow, in the lesson’s own numbers, and says where they leave the claim', () => {
  const lesson = LESSONS.find(item => item.id === 'fee-break-even');
  for (const variant of [0, 1, 2]) {
    const outcome = runLesson('fee-break-even', lessonSetup('fee-break-even', variant), variant), { result, setup } = outcome;
    const { question, choices } = feePrediction(setup, result);
    assert.ok(question.startsWith('ETH is at ' + usd(setup.futurePrice) + '. Before any fees, your claim is ' + usd(result.breakEvenFees) + ' behind holding. Then it earns ' + usd(setup.fees) + ' in trading fees.'), question);
    assert.deepEqual(choices, lesson.predictions);
    assert.equal(outcome.prediction, 'toward-target');
    assert.equal(choices[0][0], outcome.prediction);
    const finding = lessonFinding('fee-break-even', outcome), after = result.breakEvenFees - setup.fees;
    assert.ok(finding.startsWith('Only your claim. Traders pay fees into the pool, so your share of them is part of your claim. ' + usd(setup.fees) + ' takes it from ' + usd(result.breakEvenFees) + ' behind holding to ' + usd(Math.abs(after)) + (after > 0 ? ' behind.' : ' ahead.')), finding);
    assert.match(finding, /Holding is tokens in a wallet: it earns no fees\.$/);
  }
  // Variations cover fees that fall short of the gap and fees that pass it.
  const sides = [0, 1, 2].map(variant => { const { result, setup } = runLesson('fee-break-even', lessonSetup('fee-break-even', variant), variant); return Math.sign(result.breakEvenFees - setup.fees); });
  assert.ok(sides.includes(1) && sides.includes(-1), String(sides));
  // Fees that exactly close the gap read as level, and a setup without a gap or fees still reads plainly.
  const base = lessonSetup('fee-break-even'), gap = runLesson('fee-break-even', base).result.breakEvenFees;
  assert.match(lessonFinding('fee-break-even', runLesson('fee-break-even', { ...base, fees: gap })), /to level with it\./);
  const flat = runLesson('fee-break-even', { ...base, futurePrice: base.initialPrice, fees: 0 });
  assert.match(feePrediction(flat.setup, flat.result).question, /Before any fees, your claim is level with holding\. Then it earns trading fees\. Which bar grows\?$/);
  // A claim includes the fees its pool has taken in, so no answer may mark that true statement wrong.
  assert.doesNotMatch(JSON.stringify(lesson.predictions), /already in my claim/);
  assert.deepEqual(lesson.predictions.map(([, label]) => label), ['Only my claim', 'Both bars', 'Neither. The fees go to whoever runs the pool.']);
});

test('lesson 7 is a challenge in the lesson’s names: the question is a first step and the verdict says why a fall is needed', async () => {
  const lesson = LESSONS.find(item => item.id === 'final-challenge');
  assert.equal(lesson.prediction, 'Which change in the ETH price would you try first?');
  assert.deepEqual(lesson.predictions.map(([id]) => id), ['lower-price', 'higher-price', 'same-price']);
  assert.match(lesson.intro, /^Use what you know\. Pick a price and a fee income so that your claim matches holding, and both are worth less than you started with\.$/);
  assert.match(lesson.explanation, /^Matching holding and making money are two different results\./);
  for (const variant of [0, 1, 2]) {
    const outcome = runLesson('final-challenge', lessonSetup('final-challenge', variant), variant);
    assert.equal(outcome.prediction, 'lower-price');
    assert.equal(outcome.reason, 'total');
    assert.equal(lessonFinding('final-challenge', outcome), 'A fall in ETH. Only a lower price takes holding below your ' + usd(outcome.setup.investment)
      + ' start. Fees can then bring your claim level with holding, and both are still worth less than you started with.');
  }
  // One set of names from lessons 3 to 5: your claim, holding, your start.
  const copy = JSON.stringify([lesson.intro, lesson.reasoning, lesson.reasons, lesson.reasonFeedbackByChoice, lesson.explanation])
    + await readFile(new URL('../public/lib/liquidity-application-scene.js', import.meta.url), 'utf8')
    + await readFile(new URL('../public/lib/comparison-lesson-scene.js', import.meta.url), 'utf8')
    + await readFile(new URL('../public/lib/comparison-bars.js', import.meta.url), 'utf8');
  assert.doesNotMatch(copy, /starting capital|starting budget|LP \+ fees|LP \+ assumed|pool position|principal shortfall|hypothetical/i);
  assert.match(copy, /Your claim/);
});
