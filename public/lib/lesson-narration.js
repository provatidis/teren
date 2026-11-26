import { fmt, usd, signedUSD } from './format.js';

export function lessonFinding(id, outcome) {
  const { setup: s, result: r } = outcome;
  // State both amounts and stop: the difference is already in the quote, so it
  // is not called a loss. The wallet question later depends on that.
  if (id === 'swap-impact') return 'At the starting pool price of ' + usd(s.initialPrice) + ', ' + fmt(s.amount, 0) + ' ETH is worth ' + fmt(s.amount * s.initialPrice, 0)
    + ' USDC. The pool quotes ' + fmt(outcome.out, 2) + ' USDC for the whole trade, an average price of ' + usd(outcome.out / s.amount) + ' per ETH.';
  if (id === 'pool-share') return 'The pool holds ' + fmt(s.reserveEth + s.depositEth, 0) + ' ETH after your deposit, and ' + fmt(s.depositEth, 0) + ' of them came from you. You own '
    + fmt(outcome.share, 2) + '% of the pool: the same share of its ETH and of its USDC.';
  if (id === 'token-balances') return tokenBalanceNarration(outcome).finding;
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

// Round claims read as round numbers: 1.25 ETH + 2,500 USDC, then 0.8839 ETH + 3,535.53 USDC.
const tokenAmount = (value, digits) => value.toLocaleString('en-US', { maximumFractionDigits: digits });
export const claimText = claim => tokenAmount(claim.eth, 4) + ' ETH + ' + tokenAmount(claim.usdc, 2) + ' USDC';

// "Claim" is the tokens behind the reader's share, as in lesson 2. The check
// question steps outside the scene: the market has moved and nobody has traded
// yet. It asks who changes a claim, which the scene's ideal arbitrage hides.
export function tokenBalanceNarration(outcome) {
  const { setup: s, result: r } = outcome;
  const direction = s.futurePrice > s.initialPrice ? 'up' : s.futurePrice < s.initialPrice ? 'down' : 'same';
  const start = claimText(r.held), now = claimText(r.pooled);
  const exchange = direction === 'up'
    ? 'Traders buy ETH from the pool and pay in USDC. Your claim holds less ETH and more USDC.'
    : direction === 'down'
      ? 'Traders sell ETH to the pool and take USDC out. Your claim holds more ETH and less USDC.'
      : 'The price is unchanged, so nobody has a reason to trade. Both token amounts stay the same.';
  const finding = direction === 'up'
    ? 'Less ETH. Traders bought ETH from the pool and paid in USDC, so your claim went from ' + start + ' to ' + now + '.'
    : direction === 'down'
      ? 'More ETH. Traders sold ETH to the pool and took USDC out, so your claim went from ' + start + ' to ' + now + '.'
      : 'The same ETH. The price has not moved, so nobody had a reason to trade. Your claim is still ' + start + '.';
  const correctReason = direction === 'same' ? 'With no price change, nobody has a reason to trade with the pool.'
    : 'Still ' + start + '. Only a trade changes it.';
  const reasons = direction === 'same'
    ? [['rebalance', correctReason], ['automatic', 'The pool keeps its token amounts fixed whatever the price does.'], ['drift', 'The pool needs more time before its amounts adjust.']]
    : [['rebalance', correctReason], ['automatic', 'Already ' + now + '. The pool updates with the market price.'], ['drift', 'Something in between. The pool drifts toward the market price.']];
  const waiting = 'Time alone changes nothing in a pool. Its balances move only when someone trades, deposits or withdraws.';
  const feedbackByChoice = direction === 'same' ? {
    rebalance: 'Traders act on a gap between the pool’s price and the market’s. With no gap there is nothing to trade on, so your claim stays at ' + start + '.',
    automatic: 'The pool does not hold its amounts fixed: any trade changes them. They stay the same here because the price has not moved, so nobody has a reason to trade.',
    drift: waiting + ' The price has not moved, so nobody has a reason to.',
  } : {
    rebalance: 'The pool has no price feed. Its balances change only when someone trades, deposits or withdraws, so your claim is still ' + start + '. '
      + (direction === 'up' ? 'The pool now sells ETH below the market price, and the first trader to notice buys it.' : 'The pool now pays more than the market for ETH, and the first trader to notice sells to it.'),
    automatic: 'The pool does not watch the market. Until someone trades, it holds its starting balances and still prices ETH at ' + usd(s.initialPrice) + '. '
      + (direction === 'up' ? 'A trader buying that cheap ETH' : 'A trader selling ETH to it at that price') + ' is what takes your claim to ' + now + '.',
    drift: waiting + ' A small trade would take your claim part of the way. With no trade it is still ' + start + '.',
  };
  return { direction, exchange, finding, correctReason, reasons, feedbackByChoice,
    reasoning: direction === 'same' ? 'ETH’s market price has not moved. Why do the token amounts stay the same?'
      : 'ETH’s market price ' + (direction === 'up' ? 'jumps' : 'drops') + ' to ' + usd(s.futurePrice) + ', but nobody has traded with the pool yet. What does your claim hold?',
    explanation: 'ETH moves from ' + usd(s.initialPrice) + ' to ' + usd(s.futurePrice) + '. ' + exchange + ' Your claim starts at ' + start + ' and ends at ' + now + '. Tokens move through trades; neither ETH nor USDC is created by the pool.' };
}

// The prediction names the move: "ETH rises from $2,000.00 to $4,000.00."
export function priceMovePrediction(setup) {
  const start = usd(setup.initialPrice), end = usd(setup.futurePrice);
  const move = setup.futurePrice > setup.initialPrice ? 'ETH rises from ' + start + ' to ' + end
    : setup.futurePrice < setup.initialPrice ? 'ETH falls from ' + start + ' to ' + end
      : 'ETH stays at ' + start;
  return move + '. Will your claim hold less, more, or the same ETH?';
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

// The share question in the lesson's own numbers: the deposit against the pool
// before it, or against the pool that includes it.
export function depositPrediction(setup) {
  const deposit = fmt(setup.depositEth, 0) + ' ETH';
  const percent = value => fmt(value, Number.isInteger(value) ? 0 : 2) + '%';
  return {
    question: 'After the deposit, what share of the pool will you own?',
    choices: [
      ['less', percent(setup.depositEth / (setup.reserveEth + setup.depositEth) * 100) + ', my ' + deposit + ' out of the ' + fmt(setup.reserveEth + setup.depositEth, 0) + ' ETH it will hold'],
      ['same', percent(setup.depositEth / setup.reserveEth * 100) + ', my ' + deposit + ' out of the ' + fmt(setup.reserveEth, 0) + ' ETH it holds now'],
    ],
  };
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
  if (id === 'token-balances') return tokenBalanceNarration(outcome).feedbackByChoice[reason]
    || 'Choose an answer. Ask who can change the pool’s balances.';
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
