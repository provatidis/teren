import { runLesson, lessonSetup } from './lesson-experiments.js';
import { checkLiquidityChallenge } from './liquidity-challenge.js';

// Missing revisions describe the original questions. Keep completed lessons,
// but do not reuse an answer when the question it answered has changed.
// Since 1.68.0 one question follows each figure. Lessons 1 to 6 ask a new or
// reworded one in every variation. The challenge keeps its question, so a
// saved answer and the reader's own example stay.
export function essentialQuestionRevisions(id, variant) {
  return {
    prediction: id === 'fee-break-even' ? 4 : id === 'final-challenge' ? 3 : id === 'range-boundaries' && variant === 0 ? 1 : 2,
    application: id === 'final-challenge' ? 2 : 5,
  };
}

// The question after the figure takes the lesson's idea to a case the figure
// does not show, built with the same calculations as the lesson.
export function lessonApplication(id, outcome) {
  const variant = outcome.variant ?? 0;
  if (id === 'swap-impact') return {kind: 'deeper-pool', deeperOut: outcome.deeperOut, expected: 'deeper'};
  // The scene already shows a trade changing the tokens behind a fixed share.
  // Here another provider changes the share and the tokens stay.
  if (id === 'pool-share') return {kind: variant === 1 ? 'later-withdrawal' : 'later-deposit', expected: 'same-tokens'};
  if (id === 'token-balances') return {kind: 'untraded-market', expected: 'rebalance'};
  if (id === 'loss-vs-profit') {
    // Two true readings of one claim: against the deposit and against holding.
    // A saved setup at the starting price has neither to show, so it borrows
    // the variation's own price move.
    const gapShare = result => result.breakEvenFees / result.holdValue;
    const moved = gapShare(outcome.result) >= 5e-5 ? outcome : runLesson(id, {futurePrice: lessonSetup(id, variant).futurePrice}, variant);
    return {kind: 'two-views', setup: moved.setup, result: moved.result,
      returnPercent: (moved.result.lpBeforeFees / moved.setup.investment - 1) * 100,
      behindPercent: gapShare(moved.result) * 100, expected: 'both-right'};
  }
  if (id === 'fee-break-even') return {kind: 'fee-evidence', gap: outcome.result.breakEvenFees, expected: 'record'};
  if (id === 'range-boundaries') return {kind: 'path-fees', state: outcome.result.state, expected: 'path'};
  if (id === 'final-challenge') return {kind: 'construct-example', expected: 'relative-gap'};
  throw new Error('Choose a supported application exercise.');
}
export function checkLessonUnderstanding(id, input, variant, answer, task) {
  const outcome = {...runLesson(id, input, variant), variant};
  const applied = answer === lessonApplication(id, outcome).expected;
  const demonstration = id !== 'final-challenge' || checkLiquidityChallenge(outcome.setup, task).passed;
  return {application: applied, demonstration, passed: applied && demonstration};
}
