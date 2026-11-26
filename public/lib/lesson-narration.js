import { fmt, usd, signedUSD } from './format.js';

export function lessonFinding(id, outcome) {
  const { setup: s, result: r } = outcome;
  // State both amounts and stop: the difference is already in the quote, so it
  // is not called a loss. The wallet question later depends on that.
  if (id === 'swap-impact') return 'At the starting pool price of ' + usd(s.initialPrice) + ', ' + fmt(s.amount, 0) + ' ETH is worth ' + fmt(s.amount * s.initialPrice, 0)
    + ' USDC. The pool quotes ' + fmt(outcome.out, 2) + ' USDC for the whole trade, an average price of ' + usd(outcome.out / s.amount) + ' per ETH.';
  if (id === 'pool-share') return 'Your deposit buys ' + fmt(outcome.share, 2) + '% of the enlarged pool. Ownership includes your deposit in the total and gives you a claim on both tokens.';
  if (id === 'token-balances') return tokenBalanceNarration(outcome).exchange;
  if (id === 'range-boundaries') return outcome.prediction === 'usdc'
    ? 'At or above the upper ETH-price boundary, the position’s principal is all USDC.'
    : outcome.prediction === 'eth' ? 'At or below the lower ETH-price boundary, the position’s principal is all ETH.'
      : 'Inside its price range, the position’s principal contains both ETH and USDC.';
  if (id === 'loss-vs-profit') return r.lpBeforeFees === s.investment
    ? 'At the unchanged price, LP principal matches the starting budget and holding.'
    : 'LP principal ' + (r.lpBeforeFees > s.investment ? 'grew' : 'fell') + ' in dollar value. It still trails holding the same starting tokens by ' + usd(r.breakEvenFees) + ' before fees.';
  if (id === 'fee-break-even') return 'At this ETH price, the fee target stays at ' + usd(r.breakEvenFees) + '. Counting ' + usd(s.fees) + ' in fees leaves ' + usd(Math.max(0, r.breakEvenFees - s.fees)) + ' still to earn to match holding.';
  return 'A lower ETH price makes the original ETH and USDC worth less in dollars. Matching that basket with fees can leave both strategies below the starting budget.';
}

export function tokenBalanceNarration(outcome) {
  const { setup: s, result: r } = outcome;
  const direction = s.futurePrice > s.initialPrice ? 'up' : s.futurePrice < s.initialPrice ? 'down' : 'same';
  const exchange = direction === 'up'
    ? 'Traders put USDC into the pool and take ETH out. The LP holds less ETH and more USDC.'
    : direction === 'down'
      ? 'Traders put ETH into the pool and take USDC out. The LP holds more ETH and less USDC.'
      : 'The price is unchanged. In this fee-free endpoint model, both token quantities stay the same.';
  const correctReason = direction === 'up' ? 'Arbitrage traders exchange USDC for ETH, leaving the LP with less ETH and more USDC.'
    : direction === 'down' ? 'Arbitrage traders exchange ETH for USDC, leaving the LP with more ETH and less USDC.'
      : 'There is no price change to rebalance against in this fee-free endpoint model.';
  return { direction, exchange, correctReason,
    reasoning: direction === 'same' ? 'Why do the token quantities stay the same in this setup?' : 'What explains the change in token quantities?',
    explanation: 'ETH moves from ' + usd(s.initialPrice) + ' to ' + usd(s.futurePrice) + '. ' + exchange + ' The LP starts with ' + fmt(r.held.eth, 6) + ' ETH and ' + fmt(r.held.usdc, 2) + ' USDC, and ends with ' + fmt(r.pooled.eth, 6) + ' ETH and ' + fmt(r.pooled.usdc, 2) + ' USDC. Tokens move through swaps; neither ETH nor USDC is created by the pool.' };
}

export function lossProfitReasoning(outcome) {
  const { initialPrice, futurePrice } = outcome.setup;
  const direction = futurePrice > initialPrice ? 'up' : futurePrice < initialPrice ? 'down' : 'same';
  const correct = direction === 'up'
    ? 'Swaps exchanged ETH for USDC as ETH rose, leaving the LP with less ETH to gain value.'
    : direction === 'down'
      ? 'Swaps exchanged USDC for ETH as ETH fell, increasing the LP’s ETH while holding kept its original mix.'
      : 'At the starting price, this fee-free model has the same token amounts as the original holding.';
  const exposure = direction === 'up'
    ? 'Half the original deposit was in USDC, so the LP missed part of ETH’s rise.'
    : direction === 'down'
      ? 'Half the original deposit was in ETH, so the price fall explains the gap to holding.'
      : 'A pool that starts 50/50 keeps pace with the original holding at every price.';
  return {
    direction,
    reasoning: direction === 'up' ? 'When ETH rises, why does the LP gain less than holding?'
      : direction === 'down' ? 'When ETH falls, why does the LP lose more than holding?'
        : 'Why does the LP match holding before fees at this price?',
    reasons: [['traded-mix', correct], ['same-exposure', exposure],
      ['swap-fees', direction === 'same' ? 'Swap fees earned along the way cover the gap to holding.' : 'The LP pays trading fees that reduce its return.']],
    feedback: correct + (direction === 'same' ? ' A different final price would change the mix and the comparison.' : ' Holding keeps the exact ETH and USDC that funded the position.'),
    feedbackByChoice: {
      'same-exposure': direction === 'same'
        ? 'The values match because the price is unchanged here. At a different final price, swaps leave the LP with a different mix from holding.'
        : 'Holding starts with the same 50/50 split. The difference comes from the LP exchanging tokens as the price moves, while holding keeps the original amounts.',
      'swap-fees': direction === 'same'
        ? 'No fees are included. At the starting price, the LP has the original token amounts and matches holding without fee income.'
        : 'No fees are included in this comparison. The shortfall comes from the changed token mix; it is not a trading fee charged to the LP.',
    },
  };
}

export function rangeBoundaryNarration(outcome) {
  const { setup: s } = outcome;
  const exchange = s.futurePrice > s.initialPrice
    ? 'As ETH’s price rises through the range, swaps exchange the position’s ETH for USDC.'
    : s.futurePrice < s.initialPrice
      ? 'As ETH’s price falls through the range, swaps exchange the position’s USDC for ETH.'
      : 'At the unchanged price, the position keeps its starting ETH and USDC amounts in this fee-free model.';
  return exchange + ' ' + lessonFinding('range-boundaries', outcome)
    + ' Outside the range, swaps stop changing its token amounts until price returns. This final token mix does not tell us how much it earned earlier.';
}

// The same swap in this pool and in one ten times deeper, in the lesson's own numbers.
export function deeperPoolQuestion(outcome) {
  const s = outcome.setup, amount = fmt(s.amount, 0) + ' ETH';
  const here = fmt(outcome.out, 2) + ' USDC', deeper = fmt(outcome.deeperOut, 2) + ' USDC';
  const share = value => fmt(value, Number.isInteger(value) ? 0 : 1) + '%';
  return {
    reasoning: 'A second pool starts at the same price and charges the same fee. It holds ten times as much of each token. You sell ' + amount + ' into each. Which pool gives you more USDC, and why?',
    feedbackByChoice: {
      deeper: amount + ' is ' + share(s.amount / s.reserveEth * 100) + ' of this pool’s ETH and ' + share(s.amount / s.reserveEth * 10) + ' of the deeper pool’s. This pool quotes ' + here + '; the deeper pool would quote ' + deeper + '. Pool depth matters as much as trade size.',
      equal: 'The starting pool price and the fee match, but the price moves as you trade. The same ' + amount + ' moves the deeper pool’s price much less: it would quote ' + deeper + ', against ' + here + ' here.',
      shallow: 'The swap does move this pool’s price further, and that move works against you: each ETH you sell lowers the price for the next. This pool quotes ' + here + '; the deeper pool would quote ' + deeper + '.',
    },
  };
}

export function lessonReasonFeedback(id, outcome, reason, feedbackByChoice = {}) {
  if (id === 'swap-impact') return deeperPoolQuestion(outcome).feedbackByChoice[reason]
    || 'Choose an answer. Compare the swap with how much each pool holds.';
  if (id === 'token-balances') {
    const copy = tokenBalanceNarration(outcome);
    if (reason === 'automatic') return 'Tokens change hands through trades. The pool does not move between token mixes on a timer or without a swap. ' + copy.exchange;
    if (reason === 'ownership-share') return 'Your ownership share stays fixed here: nobody adds or removes liquidity. Swaps change the tokens behind that share. ' + copy.exchange;
  }
  if (id === 'loss-vs-profit') {
    const copy = lossProfitReasoning(outcome);
    return reason === outcome.reason ? copy.feedback : copy.feedbackByChoice[reason]
      || 'Compare the LP’s changed token mix with the original tokens kept by holding.';
  }
  if (id === 'range-boundaries' && reason === 'zero') return outcome.prediction === 'both'
    ? 'This endpoint is inside the range, but that does not establish earlier earnings. Past fees require historical fee accounting, separate from the final token mix.'
    : 'This endpoint is at or outside a range boundary. That does not prove it was inactive earlier. Past fees require historical fee accounting, separate from the final token mix.';
  return feedbackByChoice[reason] || 'Choose an explanation for this setup. The result and hint explain the comparison.';
}

export function benchmarkNarration(id, outcome) {
  const { setup: s, result: r } = outcome;
  if (id === 'loss-vs-profit') return 'At ' + usd(s.futurePrice) + '/ETH, LP principal is ' + usd(r.lpBeforeFees) + ', a ' + signedUSD(r.lpBeforeFees - s.investment) + ' change from the starting budget. Holding the same starting tokens is worth ' + usd(r.holdValue) + '. The LP’s before-fee shortfall against holding is ' + usd(r.breakEvenFees) + '. Dollar profit and this relative shortfall use different benchmarks.';
  if (id === 'fee-break-even') return 'The total fee target is ' + usd(r.breakEvenFees) + '. This example includes ' + usd(s.fees) + ', leaving ' + usd(Math.max(0, r.breakEvenFees - s.fees)) + ' additional fees needed. The total target and remaining hurdle are different quantities. These endpoint inputs do not estimate how much the position will earn.';
  if (id === 'final-challenge') return 'LP principal ' + usd(r.lpBeforeFees) + ' plus ' + usd(s.fees) + ' assumed fees gives ' + usd(r.lpValue) + ', compared with ' + usd(r.holdValue) + ' from holding the same starting tokens. LP minus holding is ' + signedUSD(r.difference) + '. This is conditional on the supplied prices and cash-fee assumption; gas, incentives and the trading path are excluded.';
  return null;
}
