import { lessonApplication } from '../models/lesson-application.js';
import { usd, fmt } from './format.js';

export function lessonApplicationCopy(id, outcome) {
  const application = lessonApplication(id, outcome), s = outcome.setup;
  const base = {application, expected: application.expected};
  if (id === 'swap-impact') return {...base,
    context: 'Swap the same ' + s.amount + ' ETH in a pool with twice as much ETH and twice as much USDC. Its starting price and 0.3% fee stay the same.',
    question: 'How does the trade’s price impact compare?', choices: [['deeper-more','It is larger.'],['deeper-less','It is smaller.'],['deeper-same','It is the same.']],
    hint: 'Compare the same trade with the amount of liquidity available to it.',
    feedback: 'The trade uses a smaller fraction of the deeper pool, so it moves the price less. Doubling both reserves keeps the starting price unchanged.'};
  if (id === 'pool-share') return {...base,
    context: 'After your deposit, a trader swaps ETH for USDC. Nobody adds or removes liquidity.',
    question: 'What changes for your share of the pool?',
    choices: [['share-same','The ownership percentage stays the same, but it represents more ETH and less USDC.'],['share-smaller','The ownership percentage falls because the trader removes USDC.'],['claim-fixed','The ownership percentage and the token amounts it represents stay the same.']],
    hint: 'A trade changes the reserves without minting or burning LP tokens in this example.',
    feedback: 'Your LP tokens still represent the same fraction of the pool. ETH enters and USDC leaves, so the token amounts behind that fraction change.'};
  if (id === 'token-balances') return {...base,
    context: 'ETH moves away from its starting price, then returns to ' + usd(s.initialPrice) + '. Keep the same liquidity, with no fees, deposits or withdrawals, and let swaps align the pool price again.',
    question: 'What happens to the position’s token amounts?',
    choices: [['original-mix','They return to the original ETH and USDC amounts.'],['last-mix','They keep the mix reached before the price returned.'],['extra-tokens','They end with more of both tokens because the price moved twice.']],
    hint: 'The token mix follows the price in this fee-free model, in both directions.',
    feedback: 'At the original price, the same liquidity holds its original token amounts in this model. Swaps reverse the earlier change in mix. This does not promise that a real price will return.'};
  if (id === 'loss-vs-profit') return {...base,
    context: 'Same starting basket at ' + usd(s.initialPrice) + '/ETH and zero fees. Change only the final price to ' + usd(application.futurePrice) + '/ETH.',
    question: 'How does LP principal compare with holding the starting tokens?',
    choices: [['trails','The LP trails holding.'],['matches','The LP matches holding.'],['beats','The LP beats holding.']],
    hint: 'In this fee-free endpoint model, an unchanged price leaves both starting baskets unchanged. A changed price creates a gap to holding.',
    feedback: application.expected === 'matches' ? 'At the original price, this fee-free endpoint model has no gap to holding. That does not guarantee that a real market will return to its original price.'
      : 'A falling price can reduce both strategies’ dollar values while the LP still trails holding. Dollar loss and the gap to holding are different comparisons.'};
  if (id === 'fee-break-even') return {...base,
    context: 'Keep both prices and the starting basket. Change only assumed fee income from ' + usd(s.fees) + ' to ' + usd(application.fees) + '.',
    question: 'Does the total fee target needed to match holding change?',
    choices: [['same','The total target stays the same.'],['higher','The total target becomes higher.'],['lower','The total target becomes lower.']],
    hint: 'Separate the before-fee gap from the additional fees still needed after your assumption.',
    feedback: 'The total target comes from holding minus LP principal before fees. Changing assumed fee income changes total LP value and the remaining additional hurdle, while the total target stays the same.'};
  if (id === 'range-boundaries') return {...base,
    context: 'Keep the ' + usd(outcome.result.lowerPrice) + '–' + usd(outcome.result.upperPrice) + ' range. ETH is now ' + usd(application.futurePrice) + ', just inside the upper bound.',
    question: 'What does the position hold, and can it take part in swaps here?',
    choices: [['both-inside','Both tokens, mostly USDC by value; it is eligible to earn from swaps.'],['usdc-wait','Only USDC; it waits for price to reach the middle of the range.'],['both-paid','Both tokens; it earns fees simply by staying inside the range.']],
    hint: 'The last ETH is exchanged at the boundary. Inside it, swaps can still use the position.',
    feedback: 'Just inside the upper bound, a small amount of ETH remains beside the USDC. The position can earn when swaps use its liquidity; being inside does not itself create fees.'};
  return {...base,
    context: 'Someone changes the benchmark to investing the entire ' + usd(s.investment) + ' starting budget in ETH, instead of holding the original ETH and USDC basket.',
    question: 'How should that new comparison be described?',
    choices: [['different','A comparison with a different starting investment strategy.'],['same','Impermanent loss measured against a single-token holding benchmark.'],['rally','The original impermanent-loss comparison, expressed in ETH instead.']],
    hint: 'The LP began with ' + fmt(outcome.result.held.eth, 4) + ' ETH and ' + fmt(outcome.result.held.usdc, 2) + ' USDC. Its holding benchmark keeps that basket.',
    feedback: 'An all-ETH investment has a different starting allocation. You can compare strategies, but this LP’s impermanent-loss benchmark holds its exact original ETH and USDC amounts.'};
}
