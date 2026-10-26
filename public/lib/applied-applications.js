import { usd } from './format.js';

export function appliedApplication(id, question) {
  if (id === 'fees-over-time') return {
    expected: 'same', context: 'Imagine collecting only the newly earned fee tokens at the question checkpoint. Liquidity, bounds and prices stay unchanged; gas is excluded.',
    question: 'What does that collection itself do to position principal?',
    choices: [['same','Principal stays the same; fee tokens move to the owner.'],['less','Principal shrinks by the value of the collected fees.'],['more','Collected fees automatically increase position liquidity.']],
    hint: 'Collecting fees and removing liquidity are separate operations.',
    feedback: 'Collecting those fee tokens transfers earned assets to the owner. With liquidity unchanged, it does not remove or reinvest the principal.'};
  if (id === 'between-samples') return {
    expected: 'fee-records', context: 'Imagine two intervals with the same recorded number of seconds in range. Their trades and competing liquidity may differ.',
    question: 'What would establish whether the intervals earned the same fee tokens?',
    choices: [['fee-records','The new fee tokens recorded separately for each interval.'],['equal-time','The matching time in range already establishes that result.'],['final-price','The pool price at each interval’s final checkpoint.']],
    hint: 'Recorded active time and recorded fee earnings answer different questions.',
    feedback: 'Equal active time does not imply equal fees. Compare the new fee tokens for each interval; trades and the position’s share of active liquidity can differ.'};
  if (id !== 'period-vs-holding') throw new Error('Choose an applied exercise.');
  return {expected: 'current-values',
    context: 'Imagine a later checkpoint where more fee tokens have been earned. You want to know whether the LP’s advantage over holding has grown.',
    question: 'What else do you need to compare?',
    choices: [['current-values','Updated principal, fee and holding values, with costs counted consistently.'],['active-time','The time the position spent in range since this checkpoint.'],['collection','Whether the owner collected the fee tokens during that time.']],
    hint: 'More fee tokens do not tell you how the rest of the position or the holding basket changed.',
    feedback: 'Value principal and all new period fees at the later checkpoint, then compare with the same starting tokens held until then, including each strategy’s costs. More fee tokens alone do not establish a larger advantage.'};
}
// A hypothetical cost applied to the final observation, not a change to the record.
export function appliedCostExample(question) {
  const costUSD = 1, lpUSD = question.view.lpUSD - costUSD, gapUSD = lpUSD - question.view.holdingUSD;
  return {costUSD, lpUSD, gapUSD,
    text: 'Worked example: add a hypothetical ' + usd(costUSD) + ' LP-only cost at the final checkpoint, with no added holding cost. LP: ' + usd(lpUSD) + '; holding: ' + usd(question.view.holdingUSD) + '. '
      + (gapUSD < 0 ? 'That cost exceeds the small before-cost advantage, leaving holding ahead.' : gapUSD > 0 ? 'The LP remains ahead after that cost.' : 'The cost exactly closes the difference.')
      + ' The historical record is unchanged.'};
}
export function checkAppliedUnderstanding(question, application, reason, answer) {
  const reasoning = reason === question.reason, applied = answer === application.expected;
  return {reasoning, application: applied, passed: reasoning && applied};
}
