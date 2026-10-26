import { runLesson } from './lesson-experiments.js';

// Change one assumption. Expected answers come from the same calculations as the lesson.
export function lessonApplication(id, outcome) {
  const s = outcome.setup;
  if (id === 'swap-impact') {
    const reserveEth = s.reserveEth * 2;
    const impact = s.amount * .997 / (reserveEth + s.amount * .997) * 100;
    return {kind: 'deeper-pool', reserveEth, impact, expected: impact < outcome.impact ? 'deeper-less' : 'deeper-more'};
  }
  if (id === 'pool-share') return {kind: 'later-swap', expected: 'share-same'};
  if (id === 'token-balances') {
    const next = runLesson(id, {futurePrice: s.initialPrice}, outcome.variant);
    return {kind: 'price-return', next, expected: 'original-mix'};
  }
  if (id === 'loss-vs-profit') {
    const futurePrice = s.futurePrice === s.initialPrice ? s.initialPrice / 2 : s.initialPrice;
    const next = runLesson(id, {futurePrice}, outcome.variant);
    return {kind: 'holding-gap', futurePrice, next, expected: next.result.breakEvenFees > 1e-8 ? 'trails' : 'matches'};
  }
  if (id === 'fee-break-even') {
    const fees = s.fees === 0 ? Math.min(100, s.investment / 2) : 0;
    const next = runLesson(id, {futurePrice: s.futurePrice, fees}, outcome.variant);
    return {kind: 'fee-assumption', fees, next, expected: 'same'};
  }
  if (id === 'range-boundaries') {
    const futurePrice = s.initialPrice * (1 + s.width * .9);
    const next = runLesson(id, {futurePrice, width: s.width}, outcome.variant);
    return {kind: 'just-inside', futurePrice, next, expected: 'both-inside'};
  }
  if (id === 'final-challenge') return {kind: 'other-benchmark', expected: 'different'};
  throw new Error('Choose a supported application exercise.');
}
export function checkLessonUnderstanding(id, input, variant, reason, answer) {
  const outcome = {...runLesson(id, input, variant), variant};
  const application = lessonApplication(id, outcome);
  const reasoning = reason === outcome.reason, applied = answer === application.expected;
  return {reasoning, application: applied, passed: reasoning && applied};
}
