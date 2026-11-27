import { fmt, usd, signedUSD } from './format.js';

export function lessonFinding(id, outcome) {
  const { setup: s, result: r } = outcome;
  // Answer the question, give both amounts and stop: the difference is already
  // in the quote, so it is not called a loss. It stays short enough to sit on
  // a phone screen with the pool, with or without a note on the prediction.
  if (id === 'swap-impact') return 'Less. The pool pays ' + fmt(outcome.out, 2) + ' USDC, not ' + fmt(s.amount * s.initialPrice, 0)
    + ': an average price of ' + usd(outcome.out / s.amount) + ' per ETH.';
  if (id === 'pool-share') return 'The pool holds ' + fmt(s.reserveEth + s.depositEth, 0) + ' ETH after your deposit, and ' + fmt(s.depositEth, 0) + ' of them came from you. You own '
    + fmt(outcome.share, 2) + '% of the pool: the same share of its ETH and of its USDC.';
  if (id === 'token-balances') return tokenBalanceNarration(outcome).finding;
  // Lesson 6's verdict answers what the claim holds, then says where the trading stopped.
  // In range means swaps can use the claim. It does not say any are happening.
  if (id === 'range-boundaries') {
    if (outcome.prediction === 'both') return 'ETH and USDC. ' + usd(s.futurePrice) + ' is inside your range, so swaps at this price can still use your claim. It holds ' + fmt(r.pooled.eth, 4) + ' ETH + ' + fmt(r.pooled.usdc, 2) + ' USDC'
      + (s.futurePrice === s.initialPrice ? ', its starting tokens.' : ': ' + (s.futurePrice > s.initialPrice ? 'less ETH and more USDC' : 'more ETH and less USDC') + ' than at the start.');
    const up = outcome.prediction === 'usdc', end = usd(up ? r.upperPrice : r.lowerPrice), past = r.state === 'above' || r.state === 'below';
    return (up ? 'Only USDC. On the way up, traders bought ETH from your claim and paid in USDC. The last ETH went at '
      : 'Only ETH. On the way down, traders sold ETH to your claim and took USDC. The last USDC went at ')
      + end + ', the ' + (up ? 'upper' : 'lower') + ' end of your range. '
      + (past ? (up ? 'Above' : 'Below') + ' it your claim does not trade, so it stays at ' : 'Your claim now holds ')
      + (up ? fmt(r.pooled.usdc, 2) + ' USDC.' : fmt(r.pooled.eth, 4) + ' ETH.');
  }
  // Lesson 4's verdict answers the question, then gives both comparisons.
  if (id === 'loss-vs-profit') return r.lpBeforeFees === r.holdValue
    ? 'The same. At the starting price your claim and holding are the same tokens, worth ' + usd(s.investment) + '.'
    : 'Less. Your claim is worth ' + usd(r.lpBeforeFees) + ', which is ' + usd(r.breakEvenFees) + ' less than holding'
      + (r.lpBeforeFees > s.investment ? '. It is still ' + usd(r.lpBeforeFees - s.investment) + ' more than the ' + usd(s.investment) + ' you started with.'
        : ' and ' + usd(s.investment - r.lpBeforeFees) + ' less than the ' + usd(s.investment) + ' you started with.');
  // Lesson 5's verdict answers which bar grew, then says where the fees leave the claim.
  if (id === 'fee-break-even') {
    const after = r.breakEvenFees - s.fees, level = Math.abs(after) < .005;
    // Fees are not paid out beside the claim: they land in the pool the claim is a share of.
    return 'Only your claim. Traders pay fees into the pool, so your share of them is part of your claim. ' + usd(s.fees) + ' takes it from ' + (r.breakEvenFees ? usd(r.breakEvenFees) + ' behind holding' : 'level with holding')
      + ' to ' + (level ? 'level with it' : usd(Math.abs(after)) + (after > 0 ? ' behind' : ' ahead')) + '. Holding is tokens in a wallet: it earns no fees.';
  }
  return 'A fall in ETH. Only a lower price takes holding below your ' + usd(s.investment) + ' start. Fees can then bring your claim level with holding, and both are still worth less than you started with.';
}

// Round claims read as round numbers: 1.25 ETH + 2,500 USDC, then 0.8839 ETH + 3,535.53 USDC.
const tokenAmount = (value, digits) => value.toLocaleString('en-US', { maximumFractionDigits: digits });
export const claimText = claim => tokenAmount(claim.eth, 4) + ' ETH + ' + tokenAmount(claim.usdc, 2) + ' USDC';

// "Claim" is the tokens behind the reader's share, as in lesson 2.
export function tokenBalanceNarration(outcome) {
  const { setup: s, result: r } = outcome;
  const direction = s.futurePrice > s.initialPrice ? 'up' : s.futurePrice < s.initialPrice ? 'down' : 'same';
  const start = claimText(r.held), now = claimText(r.pooled);
  const exchange = direction === 'up'
    ? 'Traders buy ETH from the pool and pay in USDC. Your claim holds less ETH and more USDC.'
    : direction === 'down'
      ? 'Traders sell ETH to the pool and take USDC out. Your claim holds more ETH and less USDC.'
      : 'The pool’s price already matches the market’s, so no trade is needed to bring them together. Both token amounts stay the same.';
  const finding = direction === 'up'
    ? 'Less ETH. Traders bought ETH from the pool and paid in USDC, so your claim went from ' + start + ' to ' + now + '.'
    : direction === 'down'
      ? 'More ETH. Traders sold ETH to the pool and took USDC out, so your claim went from ' + start + ' to ' + now + '.'
      : 'The same ETH. The pool’s price already matches the market’s, so no trade was needed to bring them together. Your claim is still ' + start + '.';
  return { direction, exchange, finding,
    explanation: 'ETH moves from ' + usd(s.initialPrice) + ' to ' + usd(s.futurePrice) + '. ' + exchange + ' Your claim starts at ' + start + ' and ends at ' + now + '. Tokens move through trades; neither ETH nor USDC is created by the pool.' };
}

// Lesson 3's question steps outside the scene: the market has moved and nobody
// has traded yet. It asks what changes a claim, which the scene's ideal
// arbitrage hides. The right answer says only what is true of this case:
// deposits and fees change a pool too.
export function untradedMarketQuestion(outcome) {
  const { setup: s, result: r } = outcome;
  const direction = s.futurePrice > s.initialPrice ? 'up' : s.futurePrice < s.initialPrice ? 'down' : 'same';
  const start = claimText(r.held), now = claimText(r.pooled);
  const waiting = 'Time alone changes nothing in a pool. Its balances move only when someone trades, deposits or withdraws.';
  if (direction === 'same') return {
    context: 'ETH’s market price has not moved.', question: 'Why do the token amounts stay the same?',
    choices: [['rebalance', 'The pool’s price already matches the market’s, so no trade is needed.'], ['automatic', 'The pool keeps its token amounts fixed whatever the price does.'], ['drift', 'The pool needs more time before its amounts adjust.']],
    hint: 'Ask what the trades in this lesson were for.',
    feedbackByChoice: {
      rebalance: 'The trades in this lesson close a gap between the pool’s price and the market’s. With no gap none is needed, so your claim stays at ' + start + '.',
      automatic: 'The pool does not hold its amounts fixed: any trade changes them. They stay the same here because the pool’s price already matches the market’s, so no trade is needed to bring them together.',
      drift: waiting + ' Here no trade is needed: the pool’s price already matches the market’s.',
    } };
  return {
    context: 'ETH’s market price ' + (direction === 'up' ? 'jumps' : 'drops') + ' to ' + usd(s.futurePrice) + ', but nobody has traded with the pool yet.',
    question: 'Have your claim’s tokens changed?',
    choices: [['rebalance', 'No. Still ' + start + '. Nothing has moved in or out.'], ['automatic', 'Yes. Already ' + now + '. The pool follows the market price.'], ['drift', 'Partly. Something in between: the pool drifts toward the market price.']],
    hint: 'Ask what can move tokens in or out of a pool.',
    feedbackByChoice: {
      rebalance: 'The pool has no price feed. Its balances change only when someone trades, deposits or withdraws, so your claim is still ' + start + '. '
        + (direction === 'up' ? 'The pool now sells ETH below the market price, and the first trader to notice buys it.' : 'The pool now pays more than the market for ETH, and the first trader to notice sells to it.'),
      automatic: 'The pool does not watch the market. Until someone trades, it holds its starting balances and still prices ETH at ' + usd(s.initialPrice) + '. '
        + (direction === 'up' ? 'A trader buying that cheap ETH' : 'A trader selling ETH to it at that price') + ' is what takes your claim to ' + now + '.',
      drift: waiting + ' A small trade would take your claim part of the way. With no trade it is still ' + start + '.',
    } };
}

// The prediction names the move and its condition: traders have brought the
// pool's price to the market's. Without it "the same ETH" would be a fair answer.
export function priceMovePrediction(setup) {
  const start = usd(setup.initialPrice), end = usd(setup.futurePrice);
  const move = setup.futurePrice > setup.initialPrice ? 'ETH rises from ' + start + ' to ' + end + ', and traders bring the pool’s price up with it'
    : setup.futurePrice < setup.initialPrice ? 'ETH falls from ' + start + ' to ' + end + ', and traders bring the pool’s price down with it'
      : 'ETH stays at ' + start;
  return move + '. Will your claim hold less, more, or the same ETH?';
}

// Lesson 5 starts where lesson 4 ended: the price has moved and the claim trails holding.
// The question says its starting point has no fees in it yet. A claim includes
// every fee the pool has taken in, so without that the reader cannot tell whether
// the fees are new. Each wrong answer is a belief that is false, not a true
// statement about pools attached to the wrong bar.
export function feePrediction(setup, result) {
  const gap = result.breakEvenFees;
  return {
    question: 'ETH is at ' + usd(setup.futurePrice) + '. Before any fees, your claim is ' + (gap ? usd(gap) + ' behind holding' : 'level with holding') + '. Then it earns '
      + (setup.fees ? usd(setup.fees) + ' in ' : '') + 'trading fees. Which bar grows?',
    choices: [['toward-target', 'Only my claim'], ['both-earn', 'Both bars'], ['runner-keeps', 'Neither. The fees go to whoever runs the pool.']],
  };
}

// The question gives holding's value at the new price and asks about the claim.
export function benchmarkPrediction(setup) {
  const start = usd(setup.initialPrice), end = usd(setup.futurePrice);
  // A 50/50 start: half the starting value is ETH and follows its price.
  const holding = usd(setup.investment / 2 * (1 + setup.futurePrice / setup.initialPrice));
  const move = setup.futurePrice > setup.initialPrice ? 'ETH rises from ' + start + ' to ' + end + '. Holding would then be worth ' + holding
    : setup.futurePrice < setup.initialPrice ? 'ETH falls from ' + start + ' to ' + end + '. Holding would then be worth ' + holding
      : 'ETH stays at ' + start + '. Holding is still worth ' + holding;
  return {
    question: move + '. Will your claim be worth more, less, or the same?',
    choices: [['more', 'More than holding'], ['less', 'Less than holding'], ['same', 'The same as holding']],
  };
}

// Lesson 6's question names the move and where it ends against the range.
export function rangePrediction(setup, result) {
  const { initialPrice: start, futurePrice: price } = setup;
  const move = price === start ? 'ETH stays at ' + usd(start) : 'ETH ' + (price > start ? 'rises' : 'falls') + ' from ' + usd(start) + ' to ' + usd(price);
  const where = { above: 'above your range', below: 'below your range', 'upper-edge': 'the upper end of your range', 'lower-edge': 'the lower end of your range',
    inside: price === start ? 'inside your range' : 'still inside your range' }[result.state];
  return move + ', ' + where + '. What does your claim hold then?';
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

// Lesson 1's prediction in the pool's own numbers: what the trade is worth at
// the starting pool price, and whether the pool pays that.
export function tradePrediction(setup) {
  const worth = fmt(setup.amount * setup.initialPrice, 0) + ' USDC';
  return {
    question: 'You sell ' + fmt(setup.amount, 0) + ' ETH. At the starting pool price that is worth ' + worth + '. Will the pool pay you less, the same, or more?',
    choices: [['less', 'Less than ' + worth], ['same', 'Exactly ' + worth], ['more', 'More than ' + worth]],
  };
}

// The same swap in this pool and in one ten times deeper, in the lesson's own numbers.
export function deeperPoolQuestion(outcome) {
  const s = outcome.setup, amount = fmt(s.amount, 0) + ' ETH';
  const here = fmt(outcome.out, 2) + ' USDC', deeper = fmt(outcome.deeperOut, 2) + ' USDC';
  const share = value => fmt(value, Number.isInteger(value) ? 0 : 1) + '%';
  return {
    context: 'A second pool starts at the same price and charges the same fee. It holds ten times as much of each token. You sell ' + amount + ' into each.',
    question: 'Which pool gives you more USDC, and why?',
    choices: [['deeper', 'The deeper pool. The swap is a smaller share of it, so its price moves less.'], ['equal', 'Neither. The same starting price and the same fee give the same amount.'], ['shallow', 'This pool. The swap moves its price further, and a bigger move pays more.']],
    hint: 'Compare the swap with how much each pool holds.',
    feedbackByChoice: {
      deeper: amount + ' is ' + share(s.amount / s.reserveEth * 100) + ' of this pool’s ETH and ' + share(s.amount / s.reserveEth * 10) + ' of the deeper pool’s. This pool quotes ' + here + '; the deeper pool would quote ' + deeper + '. Pool depth matters as much as trade size.',
      equal: 'The starting pool price and the fee match, but the price moves as you trade. The same ' + amount + ' moves the deeper pool’s price much less: it would quote ' + deeper + ', against ' + here + ' here.',
      shallow: 'The swap does move this pool’s price further, and that move works against you: each ETH you sell lowers the price for the next. This pool quotes ' + here + '; the deeper pool would quote ' + deeper + '.',
    },
  };
}

// What a prediction that differs would need to be true: one sentence naming
// the condition under which that answer holds. The verdict beside it already
// says what holds here. It does not claim to know why the reader chose it.
export function predictionNote(id, outcome, selected) {
  if (!selected || selected === outcome.prediction) return '';
  const s = outcome.setup;
  if (id === 'swap-impact') {
    const worth = fmt(s.amount * s.initialPrice, 0) + ' USDC';
    return selected === 'same' ? '“Exactly ' + worth + '” would be true at one fixed price with no fee.'
      : selected === 'more' ? '“More than ' + worth + '” would be true at an average above ' + usd(s.initialPrice) + ' per ETH, fee included.' : '';
  }
  if (id === 'pool-share') {
    const naive = s.depositEth / s.reserveEth * 100;
    return selected === 'same' ? '“' + fmt(naive, Number.isInteger(naive) ? 0 : 2) + '%” would be true if the pool stayed the size it was.' : '';
  }
  if (id === 'token-balances') {
    const still = s.futurePrice === s.initialPrice ? ' Here the price has not moved.' : '';
    if (selected === 'more') return '“More ETH” would be true if ETH had fallen.' + still;
    if (selected === 'less') return '“Less ETH” would be true if ETH had risen.' + still;
    // Not "if nobody had traded": that is the case the question after the figure asks about.
    return selected === 'same' ? '“The same ETH” would be true if your claim were a fixed set of tokens.' : '';
  }
  if (id === 'loss-vs-profit') {
    if (selected === 'more') return '“More than holding” would be true with enough fees. None are counted here.';
    if (selected === 'same') return '“The same as holding” would be true at the starting price.';
    return selected === 'less' ? '“Less than holding” would be true at any other price.' : '';
  }
  if (id === 'fee-break-even') return selected === 'both-earn' ? '“Both bars” would be true if holding earned fees too.'
    : selected === 'runner-keeps' ? '“Neither” would be true if the pool kept its fees for whoever runs it.' : '';
  if (id === 'range-boundaries') return { eth: '“Only ETH” would be true at or below the lower end of your range.', usdc: '“Only USDC” would be true at or above the upper end of your range.',
    both: '“ETH and USDC” would be true inside your range.' }[selected] || '';
  if (id === 'final-challenge') return selected === 'higher-price' ? 'A rise in ETH takes holding above your start, not below it.'
    : selected === 'either' ? 'Only a fall does. A rise takes holding above your start.' : '';
  return '';
}

export function benchmarkNarration(id, outcome) {
  const { setup: s, result: r } = outcome;
  if (id === 'loss-vs-profit') return 'At ' + usd(s.futurePrice) + '/ETH, LP principal is ' + usd(r.lpBeforeFees) + ', a ' + signedUSD(r.lpBeforeFees - s.investment) + ' change from the starting budget. Holding the same starting tokens is worth ' + usd(r.holdValue) + '. The LP’s before-fee shortfall against holding is ' + usd(r.breakEvenFees) + '. Dollar profit and this relative shortfall use different benchmarks.';
  if (id === 'fee-break-even') return 'The total fee target is ' + usd(r.breakEvenFees) + '. This example includes ' + usd(s.fees) + ', leaving ' + usd(Math.max(0, r.breakEvenFees - s.fees)) + ' additional fees needed. The total target and remaining hurdle are different quantities. These endpoint inputs do not estimate how much the position will earn.';
  if (id === 'final-challenge') return 'LP principal ' + usd(r.lpBeforeFees) + ' plus ' + usd(s.fees) + ' assumed fees gives ' + usd(r.lpValue) + ', compared with ' + usd(r.holdValue) + ' from holding the same starting tokens. LP minus holding is ' + signedUSD(r.difference) + '. This is conditional on the supplied prices and cash-fee assumption; gas, incentives and the trading path are excluded.';
  return null;
}
