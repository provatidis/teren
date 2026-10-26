import { runLesson } from './lesson-experiments.js';
import { checkLiquidityChallenge } from './liquidity-challenge.js';

// Missing revisions describe the original questions. Keep completed lessons,
// but do not reuse an answer when the question it answered has changed.
export function essentialQuestionRevisions(id, variant) {
  const changed = ['loss-vs-profit', 'fee-break-even', 'final-challenge'].includes(id)
    || (['swap-impact', 'token-balances'].includes(id) && variant === 1)
    || (['pool-share', 'range-boundaries'].includes(id) && variant > 0);
  return { reason: id === 'final-challenge' ? 2 : 1, application: changed ? 2 : 1 };
}

// Change one assumption. Expected answers come from the same calculations as the lesson.
export function lessonApplication(id, outcome) {
  const s = outcome.setup;
  if (id === 'swap-impact') {
    const reserveEth = s.reserveEth * (outcome.variant === 1 ? .5 : 2);
    const impact = s.amount * .997 / (reserveEth + s.amount * .997) * 100;
    return {kind: 'deeper-pool', reserveEth, impact, expected: impact < outcome.impact ? 'deeper-less' : 'deeper-more'};
  }
  if (id === 'pool-share') return {kind: outcome.variant === 1 ? 'later-deposit' : 'later-swap',
    expected: outcome.variant === 1 ? 'diluted-same-claim' : outcome.variant === 2 ? 'reverse-swap' : 'share-same'};
  if (id === 'token-balances') {
    if (outcome.variant === 1) {
      const next = runLesson(id, {futurePrice: s.initialPrice / 2}, outcome.variant);
      return {kind: 'more-tokens-less-value', next, expected: 'more-eth-less-value'};
    }
    const next = runLesson(id, {futurePrice: s.initialPrice}, outcome.variant);
    return {kind: 'price-return', next, expected: 'original-mix'};
  }
  if (id === 'loss-vs-profit') {
    const futurePrice = s.futurePrice < s.initialPrice ? s.initialPrice * 2 : s.initialPrice / 2;
    const next = runLesson(id, {futurePrice}, outcome.variant);
    return {kind: 'two-benchmarks', futurePrice, next, expected: futurePrice > s.initialPrice ? 'gain-and-gap' : 'loss-and-gap'};
  }
  if (id === 'fee-break-even') {
    const fees = s.fees === 0 ? Math.min(100, s.investment / 2) : 0;
    const next = runLesson(id, {futurePrice: s.futurePrice, fees}, outcome.variant);
    return {kind: 'fee-assumption', fees, next, expected: 'same'};
  }
  if (id === 'range-boundaries') {
    const futurePrice = s.initialPrice * (outcome.variant === 2 ? 1 - s.width : 1 + s.width * (outcome.variant === 1 ? -.9 : .9));
    const next = runLesson(id, {futurePrice, width: s.width}, outcome.variant);
    return {kind: outcome.variant === 2 ? 'lower-edge' : 'just-inside', futurePrice, next,
      expected: outcome.variant === 2 ? 'eth-owned' : outcome.variant === 1 ? 'mostly-eth' : 'both-inside'};
  }
  if (id === 'final-challenge') return {kind: 'construct-example', expected: 'relative-gap'};
  throw new Error('Choose a supported application exercise.');
}
export function checkLessonUnderstanding(id, input, variant, reason, answer, task) {
  const outcome = {...runLesson(id, input, variant), variant};
  const application = lessonApplication(id, outcome);
  const reasoning = reason === outcome.reason, applied = answer === application.expected;
  const demonstration = id !== 'final-challenge' || checkLiquidityChallenge(outcome.setup, task).passed;
  return {reasoning, application: applied, demonstration, passed: reasoning && applied && demonstration};
}
