import { runLesson } from './lesson-experiments.js';
import { checkLiquidityChallenge } from './liquidity-challenge.js';
import { calculateScenario } from './cp50-v1.js';

// Missing revisions describe the original questions. Keep completed lessons,
// but do not reuse an answer when the question it answered has changed.
export function essentialQuestionRevisions(id, variant) {
  const changed = ['loss-vs-profit', 'fee-break-even', 'final-challenge'].includes(id)
    || (['swap-impact', 'token-balances'].includes(id) && variant === 1)
    || (['pool-share', 'range-boundaries'].includes(id) && variant > 0);
  return {
    prediction: id === 'range-boundaries' && variant > 0 ? 2 : 1,
    reason: id === 'final-challenge' ? 3 : ['loss-vs-profit', 'token-balances'].includes(id) ? 2 : 1,
    application: id === 'swap-impact' ? 3 : id === 'loss-vs-profit' && variant !== 1 ? 4
      : ['loss-vs-profit', 'fee-break-even'].includes(id) ? 3 : changed ? 2 : 1,
  };
}

// Construct the changed situation using the same calculations as the lesson.
export function lessonApplication(id, outcome) {
  const s = outcome.setup;
  if (id === 'swap-impact') {
    const tolerance = 0.5;
    return {kind: 'wallet-quote', quote: outcome.out, impact: outcome.impact, tolerance,
      minimumReceived: outcome.out * (1 - tolerance / 100),
      startingValue: s.amount * s.initialPrice,
      expected: 'quote-received'};
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
  if (id === 'loss-vs-profit' && outcome.variant !== 1) {
    const fees = outcome.variant === 2 ? 200 : 180;
    const setup = {...s, fees};
    const next = {setup, result: calculateScenario(setup)};
    return {kind: 'dashboard-benchmark', fees, next,
      allEthValue: s.investment / s.initialPrice * s.futurePrice, expected: 'holding-basket'};
  }
  if (id === 'loss-vs-profit') {
    const futurePrice = s.futurePrice < s.initialPrice ? s.initialPrice * 2 : s.initialPrice / 2;
    const next = runLesson(id, {futurePrice}, outcome.variant);
    return {kind: 'withdrawal-gap', futurePrice, next, expected: 'gap-unchanged'};
  }
  if (id === 'fee-break-even') {
    const fees = outcome.result.breakEvenFees;
    const futurePrice = s.futurePrice < s.initialPrice ? s.futurePrice / 2 : s.futurePrice * 1.5;
    const setup = {...s, futurePrice, fees};
    const next = {setup, result: calculateScenario(setup)};
    return {kind: 'moving-fee-target', fees, futurePrice, next,
      expected: next.result.difference < 0 ? 'gap-reopens' : next.result.difference > 0 ? 'now-ahead' : 'still-matches'};
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
