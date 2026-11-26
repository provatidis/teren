import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonFinding, rangeBoundaryNarration, priceMovePrediction, tokenBalanceNarration, benchmarkPrediction, lossProfitReasoning } from '../public/lib/lesson-narration.js';
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
import { usd } from '../public/lib/format.js';

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

test('range explanations follow the assessed price direction and token endpoint', () => {
  for (const variant of [0, 1, 2]) {
    for (const width of [.05, .1, .5]) {
      const base = lessonSetup('range-boundaries', variant);
      for (const factor of [.5, .95, 1, 1.05, 2]) {
        const outcome = runLesson('range-boundaries', { ...base, width, futurePrice: base.initialPrice * factor }, variant);
        const copy = rangeBoundaryNarration(outcome);
        assert.match(copy, factor > 1 ? /ETH for USDC/ : factor < 1 ? /USDC for ETH/ : /unchanged price/);
        assert.match(copy, outcome.result.pooled.eth === 0 ? /all USDC/ : outcome.result.pooled.usdc === 0 ? /all ETH/ : /contains both ETH and USDC/);
        assert.match(copy, /does not tell us how much it earned earlier/);
      }
    }
  }
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
