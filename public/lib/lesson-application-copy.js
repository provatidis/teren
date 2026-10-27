import { scenarioHash } from './scenario-links.js';
import { lessonApplication } from '../models/lesson-application.js';
import { usd, fmt, signedUSD, percent } from './format.js';

export function lessonApplicationCopy(id, outcome) {
  const application = lessonApplication(id, outcome), s = outcome.setup;
  const base = {application, expected: application.expected};
  if (id === 'swap-impact') {
    const highImpact = application.impact > application.tolerance;
    return {...base,
      label: 'Your wallet’s warning',
      context: 'You are selling ' + fmt(s.amount, 0) + ' ETH. The wallet quotes this simulated pool, including the 0.3% swap fee. Nothing changes in the pool before the trade executes.',
      evidence: {
        title: 'The swap quote',
        rows: [['You receive', fmt(application.quote, 2) + ' USDC'],
          ['Price impact, excluding fee', fmt(application.impact, 2) + '%'], ['Slippage tolerance', '0.5%']],
      },
      question: 'What happens with this quote and a 0.5% slippage tolerance?',
      choices: [['quote-received', 'You receive the quoted USDC amount.'],
        ['spot-limit', 'You receive within 0.5% of the starting-price value.'],
        ['quote-misread', highImpact ? 'The swap fails because price impact exceeds 0.5%.'
          : 'You receive 0.5% less than the quote, even though nothing changed.']],
      hint: 'The quote already reflects the effect of your trade. Slippage tolerance sets a limit relative to that quote.',
      feedbackByChoice: {
        'spot-limit': 'The limit is measured from the quote, not the starting price. This trade changes the pool’s reserves, and its quoted proceeds already include that price impact.',
        'quote-misread': highImpact
          ? 'Price impact and slippage tolerance are different. The impact is already in this quote; the 0.5% tolerance limits how far execution may fall below the quote.'
          : 'Slippage tolerance is a maximum allowed shortfall, not an extra fee. With the pool unchanged, this swap still receives the quoted amount.',
      },
      feedback: 'The unchanged pool pays the quoted ' + fmt(application.quote, 2) + ' USDC. The 0.5% tolerance sets a minimum of about ' + fmt(application.minimumReceived, 2) + ' USDC if the pool changes before execution; it does not undo your own price impact.',
    };
  }
  if (id === 'pool-share' && outcome.variant === 1) return {...base,
    label: 'Another provider deposits',
    context: 'Another provider adds both tokens in the pool’s current proportions. No trades, fees or withdrawals occur.',
    question: 'What happens to your existing claim?',
    choices: [['diluted-same-claim', 'A smaller percentage of a larger pool, representing the same token amounts.'], ['fewer-tokens', 'A smaller percentage that also takes away some of your tokens.'], ['fixed-share', 'The same percentage, now representing more tokens.']],
    hint: 'The new provider receives new LP tokens in exchange for adding reserves.',
    feedbackByChoice: {
      'fewer-tokens': 'The smaller percentage applies to a larger pool. A proportional deposit adds enough reserves to leave the tokens behind your existing claim unchanged.',
      'fixed-share': 'The new provider receives LP tokens too. Your token count stays the same, but your fraction of all LP tokens becomes smaller.',
    },
    feedback: 'Your percentage falls as the pool grows. A proportional deposit adds reserves and ownership together, leaving the token amounts behind your existing claim unchanged.'};
  if (id === 'pool-share' && outcome.variant === 2) return {...base,
    label: 'A trader buys ETH',
    context: 'After your deposit, a trader pays USDC to buy ETH from the pool. Nobody adds or removes liquidity.',
    question: 'What changes behind your LP tokens?',
    choices: [['reverse-swap', 'The same ownership percentage now represents less ETH and more USDC.'], ['share-rises', 'Your ownership percentage rises as the trader adds USDC.'], ['claim-fixed', 'Your original ETH and USDC amounts remain reserved for you.']],
    hint: 'Follow which token enters and which leaves. A swap does not issue LP tokens.',
    feedbackByChoice: {
      'share-rises': 'A swap adds one token and removes another without issuing LP tokens. Your ownership fraction stays the same.',
      'claim-fixed': 'Your claim is on a fraction of the current reserves. The trader takes ETH and adds USDC, so the mix behind your claim changes.',
    },
    feedback: 'USDC enters and ETH leaves. Your fraction stays the same, but the token amounts it represents change with the reserves.'};
  if (id === 'pool-share') return {...base,
    label: 'A trader sells ETH',
    context: 'After your deposit, a trader swaps ETH for USDC. Nobody adds or removes liquidity.',
    question: 'What changes for your share of the pool?',
    choices: [['share-same','The ownership percentage stays the same, but it represents more ETH and less USDC.'],['share-smaller','The ownership percentage falls because the trader removes USDC.'],['claim-fixed','The ownership percentage and the token amounts it represents stay the same.']],
    hint: 'A trade changes the reserves without minting or burning LP tokens in this example.',
    feedbackByChoice: {
      'share-smaller': 'The trader exchanges tokens, not ownership shares. No LP tokens are issued or removed, so your percentage stays the same.',
      'claim-fixed': 'Your percentage stays the same, but it applies to changed reserves. ETH came in and USDC went out.',
    },
    feedback: 'Your LP tokens still represent the same fraction of the pool. ETH enters and USDC leaves, so the token amounts behind that fraction change.'};
  if (id === 'token-balances' && outcome.variant === 1) return {...base,
    label: 'After ETH falls',
    context: 'ETH falls to ' + usd(application.next.setup.futurePrice) + '. The model now shows more ETH in the LP, but a lower total dollar value. No fees are included.',
    question: 'How can it hold more ETH and still lose dollar value?',
    choices: [['more-eth-less-value', 'Swaps added ETH as its price fell; more units do not mean more dollars.'], ['earned-eth', 'The extra ETH is yield that will restore the original dollar value.'], ['withdraw-loss', 'The lower dollar value becomes a loss only after withdrawal.']],
    hint: 'Token quantity and the price of each token are different parts of value.',
    feedbackByChoice: {
      'earned-eth': 'No fees are included. The extra ETH came from traders exchanging ETH for the pool’s USDC, while each ETH became cheaper.',
      'withdraw-loss': 'The tokens are already worth less at this price. Withdrawing would move them to your wallet; it would not cause the price loss.',
    },
    feedback: 'Traders sold ETH into the pool as its price fell. The LP holds more ETH and less USDC, but the cheaper ETH leaves the position worth less in dollars.'};
  if (id === 'token-balances') return {...base,
    label: 'ETH returns to its starting price',
    context: 'ETH moves away from its starting price, then returns to ' + usd(s.initialPrice) + '. Keep the same liquidity, with no fees, deposits or withdrawals, and let swaps align the pool price again.',
    question: 'What happens to the position’s token amounts?',
    choices: [['original-mix','They return to the original ETH and USDC amounts.'],['last-mix','They keep the mix reached before the price returned.'],['extra-tokens','They end with more of both tokens because the price moved twice.']],
    hint: 'The token mix follows the price in this fee-free model, in both directions.',
    feedbackByChoice: {
      'last-mix': 'Swaps continue as price returns. With the same liquidity and no fees, the original price brings back the original mix.',
      'extra-tokens': 'Price movement is not a payment to the LP. In this fee-free case, the return journey reverses the earlier exchange of tokens.',
    },
    feedback: 'At the original price, the same liquidity holds its original token amounts in this model. Swaps reverse the earlier change in mix. This does not promise that a real price will return.'};
  if (id === 'loss-vs-profit' && application.kind === 'dashboard-benchmark') {
    const r = application.next.result;
    const comparison = Math.abs(r.difference) < 1e-8 ? 'The total matches holding.'
      : 'The total is ' + usd(Math.abs(r.difference)) + (r.difference > 0 ? ' ahead of holding.' : ' behind holding.');
    return {...base,
      label: 'Reading your dashboard',
      context: 'ETH moved from ' + usd(s.initialPrice) + ' to ' + usd(s.futurePrice) + '. This hypothetical dashboard reports return against your original deposit. Fees are supplied for this example, not estimated from the price move.',
      evidence: {
        title: 'Your position page',
        rows: [['Original deposit', usd(s.investment)], ['Position tokens, excluding fees', usd(r.lpBeforeFees)],
          ['Fees, held separately', usd(application.fees)], ['Total value, including fees', usd(r.lpValue)],
          ['Return versus deposit', signedUSD(r.lpValue - s.investment) + ' (' + percent(r.lpReturn) + ')']],
        note: 'Fees are held as USDC, worth $1 each. Costs are excluded.',
        explore: {href: 'liquidity.html' + scenarioHash(application.next.setup), text: 'Try this dashboard’s price and fees in Experiment ↗'},
      },
      question: 'To see whether providing liquidity beat holding, what should you compare the total ' + usd(r.lpValue) + ' with?',
      choices: [['holding-basket', usd(r.holdValue) + ': keeping the starting ETH and USDC.'],
        ['original-deposit', usd(s.investment) + ': the original dollar deposit.'],
        ['all-eth', usd(application.allEthValue) + ': putting the entire deposit into ETH.']],
      hint: 'Compare two choices made with the same starting tokens: supplying them to the pool or keeping them.',
      feedbackByChoice: {
        'original-deposit': 'That is the dollar return already shown by this dashboard. It combines ETH’s price move with the effect of supplying liquidity. Keeping the same starting tokens is the comparison that separates those choices.',
        'all-eth': 'An all-ETH investment starts with a different token mix. To compare supplying liquidity with keeping your deposit, use the same starting ETH and USDC.',
      },
      feedback: comparison + ' Keeping the starting ' + fmt(r.held.eth, 4) + ' ETH and ' + fmt(r.held.usdc, 2) + ' USDC would now be worth ' + usd(r.holdValue) + '. The dashboard’s dollar return alone does not show that comparison.',
    };
  }
  if (id === 'loss-vs-profit') return {...base,
    label: 'Withdrawing the position',
    context: 'ETH is now ' + usd(application.futurePrice) + '. Both strategies are ' + (application.next.result.lpReturn > 0 ? 'above' : 'below') + ' the starting budget, but the LP trails holding. The owner withdraws all the LP’s tokens. Price stays fixed, with no fees or costs.',
    question: 'What happens to the gap with holding when the tokens reach the wallet?',
    choices: [['gap-unchanged', 'The same gap remains.'], ['gap-erased', 'The gap disappears.'], ['gap-charged', 'Another loss is deducted, making the gap larger.']],
    hint: 'Follow the tokens from the position to the wallet. Does the withdrawal change their amounts or prices?',
    feedbackByChoice: {
      'gap-erased': 'Leaving the pool does not restore the starting mix. The owner receives the LP’s current tokens, which still trail the holding basket at this price.',
      'gap-charged': 'Impermanent loss is the comparison already shown, not a withdrawal fee. No extra amount is deducted in this example.',
    },
    feedback: 'The withdrawal moves the same tokens into the wallet. Their value and the gap with holding stay the same; no extra impermanent-loss charge is taken.'};
  if (id === 'fee-break-even') return {...base,
    label: 'After matching holding',
    context: (application.fees === 0
      ? 'At the unchanged starting price, the LP matches holding without fees. ETH then rises.'
      : 'Suppose the LP has earned exactly enough USDC fees to match holding. ETH then moves farther from its starting price.')
      + ' No new fees arrive, and no one adds or removes liquidity. Costs are excluded.',
    evidence: {
      title: 'The next price move',
      rows: [
        ['Starting ETH price', usd(s.initialPrice)],
        [application.fees === 0 ? 'ETH price when LP matched holding' : 'ETH price when fees covered the gap', usd(s.futurePrice)],
        ['Later ETH price', usd(application.futurePrice)],
      ],
      note: application.fees === 0 ? 'There are no fees in this example. USDC stays at $1.' : 'The earned fees stay as USDC. USDC stays at $1.',
    },
    question: application.fees === 0 ? 'After ETH rises, how does the LP compare with holding?' : 'Do those same earned fees keep the LP level with holding?',
    choices: [['gap-reopens', 'The LP falls behind holding.'], ['still-matches', 'The LP keeps matching holding.'], ['now-ahead', 'The LP moves ahead of holding.']],
    hint: 'The USDC fees have not changed. Consider what moving farther from the starting price does to the gap before fees.',
    feedbackByChoice: {
      'still-matches': 'Matching holding at one price does not lock in that result. The larger price move widens the gap before fees, while the earned USDC stays unchanged.',
      'now-ahead': 'A further price move is not extra fee income. Here it widens the shortfall against holding, and no new fees arrive to cover it.',
    },
    feedback: application.fees === 0
      ? 'The LP now trails holding. Swaps leave it with less ETH as ETH rises, so it gains less from the rise than the original holding basket. There are no fees to cover that gap.'
      : 'The gap reopens. Moving farther from the starting price widens the shortfall before fees in this model. The same USDC fee balance no longer covers it.'};
  if (id === 'range-boundaries' && outcome.variant === 2) return {...base,
    label: 'ETH falls below the range',
    context: 'ETH reaches the lower bound, ' + usd(application.futurePrice) + '. The position’s principal is now all ETH. Liquidity stays deposited; fees are excluded.',
    question: 'If ETH falls further, what happens to those tokens?',
    choices: [['eth-owned','The position keeps the same ETH amount, whose dollar value falls.'],['stop-loss','The position sells its ETH at the boundary and preserves that dollar value.'],['liquidated','The pool removes the ETH to cover a debt.']],
    hint: 'This position has no borrowing. Going outside a range changes swap activity, not ownership.',
    feedbackByChoice: {
      'stop-loss': 'At the lower edge, the position holds ETH, not cash. Going below the range does not sell it, so its dollar value can keep falling.',
      liquidated: 'There is no loan to liquidate. The owner keeps the ETH even though the position is no longer active in swaps.',
    },
    feedback: 'The same ETH remains owned outside the lower bound. Its dollar value can keep falling; a plain liquidity range is neither a stop-loss order nor a collateral loan.'};
  if (id === 'range-boundaries' && outcome.variant === 1) return {...base,
    label: 'Just inside the lower edge',
    context: 'Keep the ' + usd(outcome.result.lowerPrice) + '–' + usd(outcome.result.upperPrice) + ' range. ETH is now ' + usd(application.futurePrice) + ', just inside its lower bound.',
    question: 'What does the position hold, and what can earn it fees here?',
    choices: [['mostly-eth','Both tokens, mostly ETH by value; swaps using its liquidity can earn fees.'],['all-eth','Only ETH; it must return to the middle before swaps can use it.'],['time-income','Both tokens; time inside the range adds fees even without swaps.']],
    hint: 'Inside the lower edge, some USDC remains alongside the ETH.',
    feedbackByChoice: {
      'all-eth': 'Just inside the range, some USDC remains. The position can participate in swaps here; it need not return to the middle.',
      'time-income': 'Being in range makes the liquidity available. Fees come from swaps using it, not from the passing of time.',
    },
    feedback: 'Just inside the lower bound, both tokens remain, with most value in ETH. Being active makes swaps possible; it does not pay interest for waiting.'};
  if (id === 'range-boundaries') return {...base,
    label: 'Just inside the upper edge',
    context: 'Keep the ' + usd(outcome.result.lowerPrice) + '–' + usd(outcome.result.upperPrice) + ' range. ETH is now ' + usd(application.futurePrice) + ', just inside the upper bound.',
    question: 'What does the position hold, and can it take part in swaps here?',
    choices: [['both-inside','Both tokens, mostly USDC by value; swaps can still use its liquidity.'],['usdc-wait','Only USDC; it waits for price to reach the middle of the range.'],['both-paid','Both tokens; it earns fees simply by staying inside the range.']],
    hint: 'The last ETH is exchanged at the boundary. Inside it, swaps can still use the position.',
    feedbackByChoice: {
      'usdc-wait': 'Just inside the upper edge, some ETH remains. Swaps can use the position here without price returning to the middle.',
      'both-paid': 'Being in range makes the liquidity available. It earns fees when swaps use it, not simply because it remains there.',
    },
    feedback: 'Just inside the upper bound, a small amount of ETH remains beside the USDC. The position can earn when swaps use its liquidity; being inside does not itself create fees.'};
  return {...base,
    label: 'Match holding while losing dollars',
    context: 'Use the starting ' + fmt(outcome.result.held.eth, 4) + ' ETH and ' + fmt(outcome.result.held.usdc, 2) + ' USDC. Find a price and fee assumption where LP matches holding, but both are below the starting capital.',
    question: 'In that example, what have the fees you entered covered?',
    choices: [['relative-gap','The shortfall against holding, while a dollar loss remains in both strategies.'],['capital-restored','The entire loss from the starting capital, because LP now matches holding.'],['earned-target','A recorded fee payment that proves this position can recover its loss.']],
    hint: 'Try a price below the start, then use Match holding. The bars keep both comparisons visible.',
    feedbackByChoice: {
      'capital-restored': 'Holding itself is below the starting budget in your example. Matching it closes the relative gap but leaves that dollar loss.',
      'earned-target': 'You chose the fees in this example. Matching holding shows what that amount would cover; it does not show that any trades paid it.',
    },
    feedback: 'Matching holding closes the relative gap. Holding itself can be below the starting capital, so both can still lose dollars. The fees in this task are an assumption, not recorded earnings.'};
}
