export const COURSE = { id: 'liquidity-essentials-v1', title: 'Liquidity essentials' };
export const LESSONS = [
  {
    id: 'swap-impact', completion: 'You connected trade size and pool depth to the price a swap receives.', protocol: 'Uniswap v2-style', title: 'Trade size and the price you receive', short: 'Swaps & price impact', concept: 'Swaps', skill: 'Explain how trade size affects the price you receive.',
    intro: 'Sell ETH to a pool for USDC. Watch its balances change, then try a larger trade.',
    // The question and its choices name the lesson's own amounts: see tradePrediction.
    prediction: 'You sell ETH to the pool. Will it pay you less, the same, or more than the starting pool price?',
    predictions: [['less', 'Less'], ['same', 'The same'], ['more', 'More']],
    explanation: 'Each ETH you sell moves the pool price down a little, so the next one sells for less. These averages include the 0.3% swap fee.',
    takeaway: 'A quote is for one trade size against one pool’s balances. The starting pool price alone cannot tell you what you will receive.',
  },
  {
    id: 'pool-share', completion: 'You separated your share of the pool from the tokens behind it.', protocol: 'Uniswap v2-style', title: 'Ownership after a liquidity deposit', short: 'Providing liquidity', concept: 'Ownership', skill: 'Explain what your share represents after a matching deposit.',
    intro: 'Add both tokens to the pool and receive a share of it. Then watch what happens to your share when someone trades.',
    // The question and its choices name the lesson's own amounts: see depositPrediction.
    prediction: 'After the deposit, what share of the pool will you own?',
    predictions: [['less', 'My deposit out of the pool after it is added'], ['same', 'My deposit out of the pool before it is added']],
    explanation: 'Your deposit becomes part of the pool, so your share is measured against the enlarged pool. Liquidity provider (LP) tokens record that share. A swap changes the tokens behind it, not the share itself.',
    takeaway: 'Your share is a fraction of whatever the pool holds. The tokens behind it change with every swap.',
  },
  {
    id: 'token-balances', completion: 'You traced how trades change the tokens behind your share.', protocol: 'Uniswap v2-style', title: 'Token balances after a price change', short: 'Changing token balances', concept: 'Allocation', skill: 'Explain what a price move does to token quantities.',
    intro: 'Watch what a price move does to your claim, the tokens behind your share.',
    // The question names the lesson's own price move: see priceMovePrediction.
    prediction: 'After the price move, will your claim hold less, more, or the same ETH?',
    predictions: [['less', 'Less ETH'], ['more', 'More ETH'], ['same', 'The same ETH']],
    explanation: 'When ETH costs more elsewhere, traders buy it from the pool until the pool’s price catches up. When it costs less, they sell it to the pool. This is called arbitrage, and it leaves your claim with more of whichever token got cheaper.',
    takeaway: 'Your share stays the same while the tokens behind it change. Traders leave you with more of whichever token got cheaper.',
  },
  {
    id: 'loss-vs-profit', completion: 'You distinguished dollar profit or loss from performance against holding.', protocol: 'Uniswap v2-style', title: 'Dollar profit and impermanent loss', short: 'Loss versus profit', concept: 'Benchmarks', skill: 'Separate dollar profit from impermanent loss.',
    intro: 'You could have left your tokens in your wallet instead. That is called holding. Compare your claim in the pool with holding, and with what you started with.',
    // The question carries the lesson's own price move and holding's value: see benchmarkPrediction.
    prediction: 'After the price move, will your claim be worth more, less, or the same as holding?',
    predictions: [['more', 'More than holding'], ['less', 'Less than holding'], ['same', 'The same as holding']],
    // The panel names the cause in both directions, so it stays true wherever the slider is.
    explanation: 'Before fees, your claim never beats holding. As ETH rises, traders buy ETH from the pool. As it falls, they sell ETH to it. Holding makes neither trade, so a gap opens when the price moves either way and closes only at the starting price. This gap is called impermanent loss. It is a comparison, not a charge: your claim can be up in dollars and still behind holding.',
    takeaway: 'Say what you compare with: your start, or holding. The gap to holding is impermanent loss.',
  },
  {
    id: 'fee-break-even', completion: 'You separated the fees a claim would need from the fees it earns.', protocol: 'Uniswap v2-style', title: 'Fees needed to match holding', short: 'Fees & break-even', concept: 'Fee income', skill: 'Distinguish a fee target from assumed and earned fees.',
    intro: 'A price move leaves your claim behind holding. See how much in trading fees it takes to catch up.',
    // The question carries the lesson's own price, gap and fees: see feePrediction.
    prediction: 'Your claim earns trading fees. Which bar grows?',
    predictions: [['toward-target', 'Only my claim'], ['both-earn', 'Both bars'], ['runner-keeps', 'Neither. The fees go to whoever runs the pool.']],
    // The scene puts the lesson's own break-even amount in front of this sentence.
    explanation: 'Whether a pool pays that much depends on how much trading it sees and for how long. The fees here are an amount you choose, not a record of earnings.',
    takeaway: 'Break-even fees say what would be needed. They do not say what you will earn.',
  },
  {
    id: 'range-boundaries', completion: 'You connected where the price sits in a range with what a claim holds and whether it can earn.', protocol: 'Uniswap v3-style', title: 'Token balances at range boundaries', short: 'Concentrated liquidity', concept: 'Ranges', skill: 'Identify the token held at either range boundary.',
    intro: 'Here your liquidity works only inside a price range you choose. See what your claim holds when ETH leaves it.',
    // The question carries the lesson's own prices and range: see rangePrediction.
    prediction: 'ETH moves against your range. What does your claim hold then?',
    predictions: [['eth', 'Only ETH'], ['both', 'ETH and USDC'], ['usdc', 'Only USDC']],
    explanation: 'Inside your range your claim trades as it would in a pool that covers every price, only faster: a rising price turns your ETH into USDC, and a falling price does the reverse. At either end of the range it runs out of one token. Outside the range your claim does not trade: its amounts stay as they are and no new fees come in.',
    takeaway: 'Where ETH ends tells you which tokens your claim holds. What it earned on the way needs records.',
  },
  {
    id: 'final-challenge', completion: 'You built an example where matching holding still leaves a dollar loss.', protocol: 'Uniswap v2-style', title: 'Can you match holding and still lose dollars?', short: 'Final challenge', concept: 'Apply what you learned', skill: 'Build your own example.',
    intro: 'Use what you know. Pick a price and a fee income so that your claim matches holding, and both are worth less than you started with.',
    // A first step with one true answer: asking which move to "try first" had none.
    prediction: 'Which price move can leave holding worth less than your start?',
    predictions: [['lower-price', 'A fall in ETH'], ['higher-price', 'A rise in ETH'], ['either', 'Either one']],
    explanation: 'Matching holding and making money are two different results. Fees can close the gap to holding. They cannot undo what a price fall does to the tokens on both sides. To judge a result, say what you compare with, what you assumed and what you left out.',
    takeaway: 'A useful conclusion names the benchmark, assumptions and missing information.',
  },
];
