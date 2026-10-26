import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { lessonFinding, rangeBoundaryNarration } from '../public/lib/lesson-narration.js';
import { rangePositionState, rangeSceneState } from '../public/lib/liquidity-scene-state.js';
import { managementCase } from '../public/models/range-decisions.js';
import { lendingCase, checkLendingUnderstanding } from '../public/models/lending-lessons.js';
import { loopCase, checkLoopUnderstanding } from '../public/models/loop-lessons.js';
import { calculateLoan } from '../public/models/collateral-loan-v1.js';
import { calculateLoop } from '../public/models/borrowing-loop-v1.js';
import { appliedQuestion } from '../public/lib/applied-lessons.js';
import { validatePositionPeriod } from '../public/data/position-period.js';
import { depositSceneState } from '../public/lib/foundation-scene-state.js';

test('findings track changed price directions and the average execution rather than the spot price', () => {
  const swap = runLesson('swap-impact', lessonSetup('swap-impact'));
  assert.match(lessonFinding('swap-impact', swap), /\$1,813.22 per ETH on average/);
  for (const [price, text] of [[1000, /more ETH and less USDC/], [2000, /both token quantities stay the same/], [4000, /less ETH and more USDC/]]) {
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
  const rise = calculateLoop({ ...loop.input, future: 3000 });
  assert.ok(rise.end.netAssets > rise.holdingValue);
  assert.equal(checkLoopUnderstanding('stress', 'exposure', 'loop-gain').passed, true);
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
