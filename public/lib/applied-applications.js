import { usd } from './format.js';

export function appliedPriceExposure(question) {
  const { view } = question;
  const lpETHRaw = view.principal.amount1 + view.earned1;
  if (view.state !== 'above' || !(view.price > view.range.upperPrice)
      || view.principal.amount1 !== 0n || !(view.holding.amount1 > lpETHRaw)) {
    throw new Error('The price-rise question requires an above-range position with less ETH than holding.');
  }
  return {
    principalETH: Number(view.principal.amount1) / 1e18,
    feeETH: Number(view.earned1) / 1e18,
    lpETH: Number(lpETHRaw) / 1e18,
    holdingETH: Number(view.holding.amount1) / 1e18,
    principalUSDC: Number(view.principal.amount0) / 1e6,
    feeUSDC: Number(view.earned0) / 1e6,
    lpUSDC: Number(view.principal.amount0 + view.earned0) / 1e6,
    holdingUSDC: Number(view.holding.amount0) / 1e6,
    ethDifference: Number(lpETHRaw - view.holding.amount1) / 1e18,
  };
}

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
  const exposure = appliedPriceExposure(question);
  return {expected: exposure.ethDifference < 0 ? 'smaller-lead' : exposure.ethDifference > 0 ? 'larger-lead' : 'same-lead', exposure,
    context: 'ETH now rises further and stays above the range. The owner leaves the position unchanged, with no new fees or costs. USDC stays at $1.',
    question: 'What happens to the LP’s lead over holding?',
    choices: [['larger-lead','It grows.'],['smaller-lead','It shrinks.'],['same-lead','It stays the same.']],
    hint: 'Look at how much ETH each side owns, including the LP’s earned fee tokens.',
    feedback: 'Holding owns more ETH than the LP’s small ETH fee balance. Both gain value as ETH rises, but holding gains more, so the LP’s lead shrinks. A small rise need not erase the lead.'};
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
