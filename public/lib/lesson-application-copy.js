import { lessonApplication } from '../models/lesson-application.js';
import { usd, fmt } from './format.js';

export function lessonApplicationCopy(id, outcome) {
  const application = lessonApplication(id, outcome), s = outcome.setup;
  const base = {application, expected: application.expected};
  if (id === 'swap-impact') return {...base,
    context: 'Swap the same ' + s.amount + ' ETH in a pool with ' + (outcome.variant === 1 ? 'half as much' : 'twice as much') + ' of each token. Its starting price and 0.3% fee stay the same.',
    question: 'How does the trade’s price impact compare?', choices: [['deeper-more','It is larger.'],['deeper-less','It is smaller.'],['deeper-same','It is the same.']],
    hint: 'Compare the same trade with the amount of liquidity available to it.',
    feedback: outcome.variant === 1 ? 'The same trade uses a larger fraction of the shallower pool, so it moves the price more. Halving both reserves keeps the starting price unchanged.'
      : 'The trade uses a smaller fraction of the deeper pool, so it moves the price less. Doubling both reserves keeps the starting price unchanged.'};
  if (id === 'pool-share' && outcome.variant === 1) return {...base,
    context: 'Another provider adds both tokens in the pool’s current proportions. No trades, fees or withdrawals occur.',
    question: 'What happens to your existing claim?',
    choices: [['diluted-same-claim', 'A smaller percentage of a larger pool, representing the same token amounts.'], ['fewer-tokens', 'A smaller percentage that also takes away some of your tokens.'], ['fixed-share', 'The same percentage, now representing more tokens.']],
    hint: 'The new provider receives new LP tokens in exchange for adding reserves.',
    feedback: 'Your percentage falls as the pool grows. A proportional deposit adds reserves and ownership together, leaving the token amounts behind your existing claim unchanged.'};
  if (id === 'pool-share' && outcome.variant === 2) return {...base,
    context: 'After your deposit, a trader pays USDC to buy ETH from the pool. Nobody adds or removes liquidity.',
    question: 'What changes behind your LP tokens?',
    choices: [['reverse-swap', 'The same ownership percentage now represents less ETH and more USDC.'], ['share-rises', 'Your ownership percentage rises as the trader adds USDC.'], ['claim-fixed', 'Your original ETH and USDC amounts remain reserved for you.']],
    hint: 'Follow which token enters and which leaves. A swap does not issue LP tokens.',
    feedback: 'USDC enters and ETH leaves. Your fraction stays the same, but the token amounts it represents change with the reserves.'};
  if (id === 'pool-share') return {...base,
    context: 'After your deposit, a trader swaps ETH for USDC. Nobody adds or removes liquidity.',
    question: 'What changes for your share of the pool?',
    choices: [['share-same','The ownership percentage stays the same, but it represents more ETH and less USDC.'],['share-smaller','The ownership percentage falls because the trader removes USDC.'],['claim-fixed','The ownership percentage and the token amounts it represents stay the same.']],
    hint: 'A trade changes the reserves without minting or burning LP tokens in this example.',
    feedback: 'Your LP tokens still represent the same fraction of the pool. ETH enters and USDC leaves, so the token amounts behind that fraction change.'};
  if (id === 'token-balances' && outcome.variant === 1) return {...base,
    context: 'ETH falls to ' + usd(application.next.setup.futurePrice) + '. The model now shows more ETH in the LP, but a lower total dollar value. No fees are included.',
    question: 'How can it hold more ETH and still lose dollar value?',
    choices: [['more-eth-less-value', 'Swaps added ETH as its price fell; more units do not mean more dollars.'], ['earned-eth', 'The extra ETH is yield that will restore the original dollar value.'], ['withdraw-loss', 'The lower dollar value becomes a loss only after withdrawal.']],
    hint: 'Token quantity and the price of each token are different parts of value.',
    feedback: 'Traders sold ETH into the pool as its price fell. The LP holds more ETH and less USDC, but the cheaper ETH leaves the position worth less in dollars.'};
  if (id === 'token-balances') return {...base,
    context: 'ETH moves away from its starting price, then returns to ' + usd(s.initialPrice) + '. Keep the same liquidity, with no fees, deposits or withdrawals, and let swaps align the pool price again.',
    question: 'What happens to the position’s token amounts?',
    choices: [['original-mix','They return to the original ETH and USDC amounts.'],['last-mix','They keep the mix reached before the price returned.'],['extra-tokens','They end with more of both tokens because the price moved twice.']],
    hint: 'The token mix follows the price in this fee-free model, in both directions.',
    feedback: 'At the original price, the same liquidity holds its original token amounts in this model. Swaps reverse the earlier change in mix. This does not promise that a real price will return.'};
  if (id === 'loss-vs-profit') return {...base,
    context: 'Keep the starting tokens and zero fees. ETH now ' + (application.futurePrice > s.initialPrice ? 'rises' : 'falls') + ' to ' + usd(application.futurePrice) + '. Starting capital: ' + usd(s.investment) + '. LP: ' + usd(application.next.result.lpValue) + '. Holding: ' + usd(application.next.result.holdValue) + '.',
    question: 'Which explanation keeps the two comparisons separate?',
    choices: [['loss-and-gap', 'Both lost dollars; the LP also fell behind holding the original tokens.'], ['gain-and-gap', 'Both gained dollars; the LP still fell behind holding the original tokens.'], ['one-loss', 'The holding shortfall is a fee charged on top of the displayed LP value.']],
    hint: 'Compare with the starting capital for dollar profit or loss. Compare with the unchanged token basket for the holding gap.',
    feedback: (application.expected === 'gain-and-gap' ? 'A dollar gain and a shortfall against holding can coexist.' : 'Both strategies lost dollars, and the LP lost more than holding.') + ' The holding shortfall is a comparison, not another charge to subtract.'};
  if (id === 'fee-break-even') return {...base,
    context: 'Keep both prices and the starting basket. Change only assumed fee income from ' + usd(s.fees) + ' to ' + usd(application.fees) + '.',
    question: 'What changes when you edit that assumption?',
    choices: [['same','The displayed LP total changes; its token balances and before-fee gap stay the same.'],['higher','The larger fee assumption makes the pool trade more and earn those fees.'],['lower','The fee assumption changes how much ETH and USDC the position holds.']],
    hint: 'The fee control adds hypothetical cash. It does not simulate trades.',
    feedback: 'Editing assumed fees changes the displayed total, not token balances or actual earnings. The amount needed to cover the before-fee gap still comes from the same prices and starting tokens.'};
  if (id === 'range-boundaries' && outcome.variant === 2) return {...base,
    context: 'ETH reaches the lower bound, ' + usd(application.futurePrice) + '. The position’s principal is now all ETH. Liquidity stays deposited; fees are excluded.',
    question: 'If ETH falls further, what happens to those tokens?',
    choices: [['eth-owned','The position keeps the same ETH amount, whose dollar value falls.'],['stop-loss','The position sells its ETH at the boundary and preserves that dollar value.'],['liquidated','The pool removes the ETH to cover a debt.']],
    hint: 'This position has no borrowing. Going outside a range changes swap activity, not ownership.',
    feedback: 'The same ETH remains owned outside the lower bound. Its dollar value can keep falling; a plain liquidity range is neither a stop-loss order nor a collateral loan.'};
  if (id === 'range-boundaries' && outcome.variant === 1) return {...base,
    context: 'Keep the same range. ETH is now ' + usd(application.futurePrice) + ', just inside its lower bound.',
    question: 'What does the position hold, and what can earn it fees here?',
    choices: [['mostly-eth','Both tokens, mostly ETH by value; swaps using its liquidity can earn fees.'],['all-eth','Only ETH; it must return to the middle before swaps can use it.'],['time-income','Both tokens; time inside the range adds fees even without swaps.']],
    hint: 'Inside the lower edge, some USDC remains alongside the ETH.',
    feedback: 'Just inside the lower bound, both tokens remain, with most value in ETH. Being active makes swaps possible; it does not pay interest for waiting.'};
  if (id === 'range-boundaries') return {...base,
    context: 'Keep the ' + usd(outcome.result.lowerPrice) + '–' + usd(outcome.result.upperPrice) + ' range. ETH is now ' + usd(application.futurePrice) + ', just inside the upper bound.',
    question: 'What does the position hold, and can it take part in swaps here?',
    choices: [['both-inside','Both tokens, mostly USDC by value; it is eligible to earn from swaps.'],['usdc-wait','Only USDC; it waits for price to reach the middle of the range.'],['both-paid','Both tokens; it earns fees simply by staying inside the range.']],
    hint: 'The last ETH is exchanged at the boundary. Inside it, swaps can still use the position.',
    feedback: 'Just inside the upper bound, a small amount of ETH remains beside the USDC. The position can earn when swaps use its liquidity; being inside does not itself create fees.'};
  return {...base,
    context: 'Build a separate example using the same starting ' + fmt(outcome.result.held.eth, 4) + ' ETH and ' + fmt(outcome.result.held.usdc, 2) + ' USDC. Find a price and fee assumption where LP matches holding, but both are below the starting capital.',
    question: 'In that example, what have the assumed fees covered?',
    choices: [['relative-gap','The shortfall against holding, while a dollar loss remains in both strategies.'],['capital-restored','The entire loss from the starting capital, because LP now matches holding.'],['earned-target','A recorded fee payment that proves this position can recover its loss.']],
    hint: 'Try a price below the start, then use Match holding. The bars keep both comparisons visible.',
    feedback: 'Matching holding closes the relative gap. Holding itself can be below the starting capital, so both can still lose dollars. The fees in this task are an assumption, not recorded earnings.'};
}
