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
        ['spot-limit', 'You receive within 0.5% of the value at the starting pool price.'],
        ['quote-misread', highImpact ? 'The swap fails because price impact exceeds 0.5%.'
          : 'You receive 0.5% less than the quote, even though nothing changed.']],
      hint: 'For the two pools, compare the swap with how much each pool holds. For the wallet, the quote already reflects the effect of your trade. Slippage tolerance sets a limit relative to that quote.',
      feedbackByChoice: {
        'spot-limit': 'The limit is measured from the quote, not from the starting pool price. This trade changes the pool’s balances, and the quote already includes that price impact.',
        'quote-misread': highImpact
          ? 'Price impact and slippage tolerance are different. The impact is already in this quote; the 0.5% tolerance limits how far execution may fall below the quote.'
          : 'Slippage tolerance is a maximum allowed shortfall, not an extra fee. With the pool unchanged, this swap still receives the quoted amount.',
      },
      feedback: 'The unchanged pool pays the quoted ' + fmt(application.quote, 2) + ' USDC. The 0.5% tolerance sets a minimum of about ' + fmt(application.minimumReceived, 2) + ' USDC if the pool changes before execution; it does not undo your own price impact.',
    };
  }
  // "Share" is the percentage; "claim" is the tokens behind it.
  if (id === 'pool-share' && application.kind === 'later-deposit') return {...base,
    label: 'Another provider deposits',
    context: 'After your deposit, another provider adds both tokens in the pool’s current ratio. No trades, fees or withdrawals occur.',
    question: 'What happens to your share and your claim?',
    choices: [['diluted-same-claim', 'A smaller share of a larger pool. My claim stays the same.'], ['fewer-tokens', 'A smaller share, and my claim shrinks with it.'], ['fixed-share', 'The same share of a larger pool. My claim grows.']],
    hint: 'The new provider receives new LP tokens for the tokens they add.',
    feedbackByChoice: {
      'fewer-tokens': 'Your smaller share applies to a larger pool. A proportional deposit adds tokens and LP tokens together, so the tokens behind your claim stay the same.',
      'fixed-share': 'The new provider receives LP tokens too, so your share of all LP tokens falls. Their tokens back their claim, not yours.',
    },
    feedback: 'Your share falls as the pool grows. A proportional deposit adds tokens and ownership together, so your claim is unchanged.'};
  if (id === 'pool-share' && application.kind === 'later-withdrawal') return {...base,
    label: 'Another provider withdraws',
    context: 'After your deposit, another provider withdraws their share of both tokens. No trades or fees occur.',
    question: 'What happens to your share and your claim?',
    choices: [['larger-same-claim', 'A larger share of a smaller pool. My claim stays the same.'], ['more-tokens', 'A larger share, and my claim grows with it.'], ['fixed-share', 'The same share of a smaller pool. My claim shrinks.']],
    hint: 'The leaving provider returns LP tokens and takes the tokens behind them.',
    feedbackByChoice: {
      'more-tokens': 'Your larger share applies to a smaller pool. The leaving provider takes only the tokens behind their own claim, so yours stays the same.',
      'fixed-share': 'The leaving provider’s LP tokens are removed, so your share of the remaining LP tokens rises. They take only their own tokens.',
    },
    feedback: 'Your share rises as the pool shrinks. A withdrawal removes tokens and ownership together, so your claim is unchanged.'};
  if (id === 'pool-share') return {...base,
    label: 'A trader buys ETH',
    context: 'After your deposit, a trader pays USDC to buy ETH from the pool. Nobody adds or removes liquidity.',
    question: 'What happens to your share and your claim?',
    choices: [['reverse-swap', 'The same share. My claim is now less ETH and more USDC.'], ['share-rises', 'A larger share, because the trader added USDC to the pool.'], ['claim-fixed', 'The same share and the same claim. My tokens are set aside.']],
    hint: 'Follow which token enters and which leaves. A swap does not issue LP tokens.',
    feedbackByChoice: {
      'share-rises': 'A swap adds one token and removes another without issuing LP tokens. Your share stays the same.',
      'claim-fixed': 'Your claim is a share of the pool’s current balances. The trader takes ETH and adds USDC, so the mix behind your claim changes.',
    },
    feedback: 'USDC enters and ETH leaves. Your share stays the same, and your claim changes with the pool’s balances.'};
  if (id === 'token-balances' && outcome.variant === 1) return {...base,
    label: 'After ETH falls',
    context: 'ETH falls to ' + usd(application.next.setup.futurePrice) + '. Your claim now holds more ETH, but it is worth fewer dollars than at the start. No fees are included.',
    question: 'How can your claim hold more ETH and be worth less?',
    choices: [['more-eth-less-value', 'Traders sold it ETH as the price fell. More ETH is not more dollars.'], ['earned-eth', 'The extra ETH is yield that will restore the starting dollar value.'], ['withdraw-loss', 'The lower dollar value becomes a loss only after withdrawal.']],
    hint: 'Token quantity and the price of each token are different parts of value.',
    feedbackByChoice: {
      'earned-eth': 'No fees are included. The extra ETH came from traders selling ETH to the pool for its USDC, while each ETH became cheaper.',
      'withdraw-loss': 'The tokens are already worth less at this price. Withdrawing would move them to your wallet; it would not cause the price loss.',
    },
    feedback: 'Traders sold ETH to the pool as its price fell. Your claim holds more ETH and less USDC, and each ETH is now cheaper, so the claim is worth fewer dollars.'};
  if (id === 'token-balances') return {...base,
    label: 'ETH returns to its starting price',
    context: 'ETH moves away from its starting price, then returns to ' + usd(s.initialPrice) + '. Nobody deposits or withdraws, no fees are counted, and traders bring the pool’s price back to the market’s.',
    question: 'What happens to your claim?',
    choices: [['original-mix','It returns to its starting ETH and USDC amounts.'],['last-mix','It keeps the mix it reached before the price returned.'],['extra-tokens','It ends with more of both tokens, because the price moved twice.']],
    hint: 'Your claim follows the price in this fee-free model, in both directions.',
    feedbackByChoice: {
      'last-mix': 'Traders keep trading as the price returns. With the same share and no fees, the starting price brings back the starting amounts.',
      'extra-tokens': 'A price move is not a payment to you. In this fee-free case, the return journey reverses the earlier exchange of tokens.',
    },
    feedback: 'At the starting price, your claim holds its starting amounts again in this model. Trades reverse the earlier change. This does not promise that a real price will return.'};
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
    context: 'ETH is now ' + usd(application.futurePrice) + '. Your claim and holding are both ' + (application.next.result.lpReturn > 0 ? 'above' : 'below') + ' what you started with, and your claim trails holding. You withdraw all of your claim’s tokens. The price stays fixed, with no fees or costs.',
    question: 'What happens to the gap to holding when the tokens reach your wallet?',
    choices: [['gap-unchanged', 'The same gap remains.'], ['gap-erased', 'The gap disappears.'], ['gap-charged', 'Another loss is deducted, making the gap larger.']],
    hint: 'Follow the tokens from the position to the wallet. Does the withdrawal change their amounts or prices?',
    feedbackByChoice: {
      'gap-erased': 'Leaving the pool does not bring back your starting tokens. You receive your claim’s current tokens, which are still worth less than holding at this price.',
      'gap-charged': 'Impermanent loss is the comparison already shown, not a withdrawal fee. No extra amount is deducted in this example.',
    },
    feedback: 'The withdrawal moves the same tokens into your wallet. Their value and the gap to holding stay the same; no extra impermanent-loss charge is taken.'};
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
    context: 'Think back to the price and fees you chose for your own position.',
    question: 'When your position matches holding below the starting budget, what have its fees covered?',
    choices: [['relative-gap','The shortfall against holding, while a dollar loss remains in both strategies.'],['capital-restored','The entire loss from the starting capital, because LP now matches holding.'],['earned-target','A recorded fee payment that proves this position can recover its loss.']],
    hint: 'Try a price below the start, then use Match holding. The bars keep both comparisons visible.',
    feedbackByChoice: {
      'capital-restored': 'Holding itself is below the starting budget in your example. Matching it closes the relative gap but leaves that dollar loss.',
      'earned-target': 'You chose the fees in this example. Matching holding shows what that amount would cover; it does not show that any trades paid it.',
    },
    feedback: 'Matching holding closes the relative gap. Holding itself can be below the starting capital, so both can still lose dollars. The fees in this task are an assumption, not recorded earnings.'};
}
