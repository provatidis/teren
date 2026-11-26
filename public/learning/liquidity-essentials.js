export const COURSE = { id: 'liquidity-essentials-v1', title: 'Liquidity essentials' };
export const LESSONS = [
  {
    id: 'swap-impact', completion: 'You connected trade size and pool depth to the price a swap receives.', protocol: 'Uniswap v2-style', title: 'Trade size and the price you receive', short: 'Swaps & price impact', concept: 'Swaps', skill: 'Explain how trade size affects the price you receive.',
    intro: 'Trade ETH for USDC. Watch the pool’s balances change, then compare a small trade with a larger one.',
    prediction: 'How will the average price you receive compare with the starting pool price?',
    predictions: [['less', 'Lower than the starting pool price'], ['same', 'The same as the starting pool price'], ['more', 'Higher than the starting pool price']],
    // The question and its feedback name the lesson's own amounts: see deeperPoolQuestion.
    reasoning: 'A second pool starts at the same price and charges the same fee. It holds ten times as much of each token. You make the same swap in each. Which pool gives you more USDC, and why?',
    reasons: [['deeper', 'The deeper pool. The swap is a smaller share of it, so its price moves less.'], ['equal', 'Neither. The same starting price and the same fee give the same amount.'], ['shallow', 'This pool. The swap moves its price further, and a bigger move pays more.']],
    explanation: 'Each ETH you sell moves the pool price down a little, so the next one sells for less. A larger trade moves it further, and the average price you receive falls. These averages include the 0.3% swap fee.',
    takeaway: 'A quote is for one trade size against one pool’s balances. The starting pool price alone cannot tell you what you will receive.',
  },
  {
    id: 'pool-share', completion: 'You separated your share of the pool from the tokens behind it.', protocol: 'Uniswap v2-style', title: 'Ownership after a liquidity deposit', short: 'Providing liquidity', concept: 'Ownership', skill: 'Explain what your share represents after a matching deposit.',
    intro: 'Add both tokens to the pool and receive a share of it. Then watch what happens to your share when someone trades.',
    // The question and its choices name the lesson's own amounts: see depositPrediction.
    prediction: 'After the deposit, what share of the pool will you own?',
    predictions: [['less', 'My deposit out of the pool after it is added'], ['same', 'My deposit out of the pool before it is added']],
    reasoning: 'What does your share entitle you to when you withdraw?',
    reasons: [['ownership', 'My share of whatever the pool holds when I withdraw.'], ['dollars', 'My deposited dollar value plus my share of swap fees.'], ['eth', 'My deposited token amounts plus my share of swap fees.']],
    reasonFeedbackByChoice: {
      dollars: 'Your LP tokens represent a share of the pool’s tokens, not a promise to repay your original dollar deposit. Those tokens can change in amount and value.',
      eth: 'The pool does not set aside your original tokens. Swaps change both balances, so your claim can be a different mix when you withdraw.',
    },
    explanation: 'Your deposit becomes part of the pool, so your share is measured against the enlarged pool. Liquidity provider (LP) tokens record that share. A swap changes the tokens behind it, not the share itself.',
    takeaway: 'Your share is a fraction of whatever the pool holds. The tokens behind it change with every swap.',
  },
  {
    id: 'token-balances', completion: 'You traced how trades change the tokens behind your share.', protocol: 'Uniswap v2-style', title: 'Token balances after a price change', short: 'Changing token balances', concept: 'Allocation', skill: 'Explain what a price move does to token quantities.',
    intro: 'When ETH’s market price moves, traders trade with the pool until its price catches up. Watch what that does to your claim, the tokens behind your share.',
    // The question names the lesson's own price move: see priceMovePrediction.
    prediction: 'After the price move, will your claim hold less, more, or the same ETH?',
    predictions: [['less', 'Less ETH'], ['more', 'More ETH'], ['same', 'The same ETH']],
    // The question and its answers carry the lesson's own amounts: see tokenBalanceNarration.
    reasoning: 'The market price moves, but nobody has traded with the pool yet. What does your claim hold?',
    reasons: [['rebalance', 'The starting amounts. Only a trade changes them.'], ['automatic', 'The new amounts. The pool updates with the market price.'], ['drift', 'Something in between. The pool drifts toward the market price.']],
    explanation: 'When ETH costs more elsewhere, traders buy it from the pool until the pool’s price catches up. When it costs less, they sell it to the pool. This is called arbitrage, and it leaves your claim with more of whichever token got cheaper.',
    takeaway: 'Your share stays the same while the tokens behind it change. Traders leave you with more of whichever token got cheaper.',
  },
  {
    id: 'loss-vs-profit', completion: 'You distinguished dollar profit or loss from performance against holding.', protocol: 'Uniswap v2-style', title: 'Dollar profit and impermanent loss', short: 'Loss versus profit', concept: 'Benchmarks', skill: 'Separate dollar profit from impermanent loss.',
    intro: 'You could have left your tokens in your wallet instead. That is called holding. Compare your claim in the pool with holding, and with what you started with.',
    // The question carries the lesson's own price move and holding's value: see benchmarkPrediction.
    prediction: 'After the price move, will your claim be worth more, less, or the same as holding?',
    predictions: [['more', 'More than holding'], ['less', 'Less than holding'], ['same', 'The same as holding']],
    reasoning: 'Why does your claim finish differently from holding?',
    reasons: [['traded-mix', 'Trades change your claim’s tokens while holding keeps its amounts.'], ['same-exposure', 'The half-and-half split of your deposit explains the difference.'], ['swap-fees', 'Your claim pays trading fees, and they reduce its return.']],
    // The cause of the gap is left to the check question: the tokens under each bar are its evidence.
    explanation: 'Before fees, your claim never beats holding. The gap opens when the price moves either way and closes only at the starting price. This gap is called impermanent loss. It is a comparison, not a charge: your claim can be up in dollars and still behind holding. The tokens under each bar show why.',
    takeaway: 'Say what you compare with: your start, or holding. The gap to holding is impermanent loss.',
  },
  {
    id: 'fee-break-even', completion: 'You separated the fees a claim would need from the fees it earns.', protocol: 'Uniswap v2-style', title: 'Fees needed to match holding', short: 'Fees & break-even', concept: 'Fee income', skill: 'Distinguish a fee target from assumed and earned fees.',
    intro: 'A price move leaves your claim behind holding. Trading fees are what you earn in return. See how much it would take to catch up.',
    // The question carries the lesson's own price, gap and fees: see feePrediction.
    prediction: 'Your claim earns trading fees. Which bar grows?',
    predictions: [['toward-target', 'Only my claim'], ['both-earn', 'Both bars'], ['already-counted', 'Neither. Fees are already in my claim’s value.']],
    reasoning: 'What do the break-even fees tell you?',
    reasons: [['assumption', 'How much fee income would match holding at this price.'], ['guarantee', 'How much fee income this price move produced.'], ['compound', 'How much fee income is waiting to be collected.']],
    reasonFeedbackByChoice: {
      guarantee: 'A price move sets the gap to holding, not how many fee-paying trades happened. Break-even fees say what would be needed, not what was earned.',
      compound: 'Break-even fees are not a balance you can collect. What a claim actually earns depends on the trading the pool saw and its share of the liquidity.',
    },
    // The scene puts the lesson's own break-even amount in front of this sentence.
    explanation: 'Whether a pool pays that much depends on how much trading it sees and for how long. The fees here are an amount you choose, not a record of earnings.',
    takeaway: 'Break-even fees say what would be needed. They do not say what you will earn.',
  },
  {
    id: 'range-boundaries', completion: 'You connected range position, token ownership and eligibility to earn fees.', protocol: 'Uniswap v3-style', title: 'Token balances at range boundaries', short: 'Concentrated liquidity', concept: 'Ranges', skill: 'Identify the token held at either range boundary.',
    intro: 'A concentrated position supplies liquidity within a chosen price range. Follow the token mix as ETH moves through its boundaries.',
    prediction: 'At the selected future price, what will the position hold?',
    predictions: [['eth', 'Only ETH'], ['both', 'ETH and USDC'], ['usdc', 'Only USDC']],
    reasoning: 'What does the final range status tell us about swap fees?',
    reasons: [['path', 'Whether it is active now; past fee income needs records.'], ['zero', 'Whether it earned fees throughout the whole observed period.'], ['fixed', 'The fee income earned from the position’s chosen range width.']],
    reasonFeedbackByChoice: {
      fixed: 'Width affects where the position can trade. It does not tell you how much trading happened or the position’s share of those fees.',
    },
    explanation: 'Swaps change the token mix while price is inside the range. Above the range, principal is all USDC; below it, all ETH. Outside the range, token amounts stay fixed until price returns. Past fee income needs separate records.',
    takeaway: 'The final price tells you which tokens remain. Past fees need records of earlier activity.',
  },
  {
    id: 'final-challenge', completion: 'You built an example where matching holding still leaves a dollar loss.', protocol: 'Uniswap v2-style', title: 'Can you match holding and still lose dollars?', short: 'Final challenge', concept: 'Apply what you learned', skill: 'Build your own example.',
    intro: 'Start with the same ETH and USDC in the pool and in your wallet. Find a price and fee amount that leave the two strategies tied, each worth less than you started with.',
    prediction: 'Which change in the ETH price would you try first?',
    predictions: [['lower-price', 'A fall in ETH.'], ['higher-price', 'A rise in ETH.'], ['same-price', 'Leave ETH at its starting price.']],
    reasoning: 'How do fees affect this comparison with holding?',
    reasons: [['total', 'Compare the fee contribution with the principal shortfall against holding.'], ['fees', 'Any fee income puts the LP ahead of its original holding basket.'], ['deposit-loss', 'Compare fees with the LP’s dollar loss from the original deposit.']],
    reasonFeedbackByChoice: {
      fees: 'Fees can close some of the gap without closing all of it. Their contribution must be compared with the shortfall before fees.',
      'deposit-loss': 'The original dollar deposit is a different benchmark. To match holding, fees must cover the gap to the value of the starting ETH and USDC at the selected price.',
    },
    explanation: 'The result depends on the price and fees you enter. Swaps change the token mix; fees add to its value. The entered fees are hypothetical, not a record of earnings. Gas, protocol-specific execution and the trading path are excluded.',
    takeaway: 'A useful conclusion names the benchmark, assumptions and missing information.',
  },
];
