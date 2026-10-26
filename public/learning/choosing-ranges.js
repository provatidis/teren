import { fmt, usd } from '../lib/format.js';

export const MANAGEMENT_CHAPTER = 'Choosing and managing a range';
const ranges={title:'Uniswap: active liquidity and ranges',url:'https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity'};
const fees={title:'Uniswap: swap fees and fee tiers',url:'https://developers.uniswap.org/docs/get-started/concepts/fees'};
const change={title:'Uniswap: changing a position’s range',url:'https://support.uniswap.org/hc/en-us/articles/20915975893645-How-to-change-the-price-range-of-a-liquidity-position'};
export const MANAGEMENT_LESSONS = Object.freeze([
  {id:'range-width',short:'Narrow and wide ranges',title:'Does a tighter range always win?',adds:'Start by changing only the range width.',
    intro:'Keep the starting budget and price the same. Change the range, then see where each position can take part in swaps.',
    reasoning:'Why can a wider range remain active after a narrower range stops?',
    reasons:[['bounds','The wider boundaries include more possible prices.'],['budget','The wider position uses more capital to stay active.'],['protection','The wider position follows a different pool price.']],
    hint:'Look at the shown price and each pair of bounds. Active means eligible to earn from swaps.',
    takeaway:'A tighter range concentrates capital and brings the boundaries closer. It does not guarantee better profit.',
    accomplishment:'You separated being active from being ahead of holding.',
    explanation:'The same price move can leave a narrow position inactive while a wider one still supplies liquidity. A narrow position may earn more while active, but actual fees depend on trades and competing liquidity. Being active is eligibility to earn, not a payment for waiting.',
    pitfall:'A narrow range is not automatically the better investment. You also need earned fees, token values and management costs.',
    reasonFeedback:{budget:'Both positions start with the same dollar budget. Their price bounds differ; the starting budget does not.',protection:'Both positions use the same pool price. Wider bounds include more of its possible prices.'},
    deeper:['Each range starts with its own required token mix. Equal budgets do not make their holding benchmarks identical. Compare each position with its own starting tokens.', 'These are calculated endpoint examples, not a price history or backtest. The model omits ticks and earned fees. Range width alone cannot tell us how much either position would earn.'],sources:[ranges,fees]},
  {id:'fee-tiers',short:'Fee tiers and APR',title:'A higher fee rate is not a higher return',adds:'Add fee rates, trade activity and a past APR figure.',
    intro:'Two hypothetical WETH/USDC pools use different swap fee tiers. A tier is the charge on each trade, not the interest rate on your deposit. In v3, different fee tiers belong to separate pools.',
    reasoning:'What determines the position’s swap fee income?',
    reasons:[['trades','Trade activity, fee rate and its share of active liquidity.'],['rate','The swap fee tier and the position’s starting deposit.'],['clock','The swap fee tier and the time the position stays active.']],
    hint:'A larger fee per trade is only useful when trades use your active liquidity.',
    takeaway:'Read the fee rate, trade activity and your active share separately. Fee income is only part of profit.',
    accomplishment:'You explained how trading activity and competing liquidity change fee income.',
    explanation:'A larger charge per swap does not establish larger earnings. The pools can receive different trade activity and have different competing liquidity. Any supplied fee totals here are made-up teaching facts after any protocol share; they are not earnings estimates or verified records.',
    pitfall:'Fee APR expresses fee income as a yearly rate. Check its observation period and what it excludes; it is not a promise of future profit.',
    reasonFeedback:{rate:'The rate and deposit matter, but trades must use the position’s active liquidity. Competing liquidity also affects its share.',clock:'Time alone creates no swap fees. Trades must use the position’s active liquidity.'},
    deeper:['Swap fees, protocol fees, network costs and external rewards are different items. An LP’s fee income is the part actually earned by that position, after any protocol share.', 'In native Uniswap v3, earned fee tokens stay separate from principal until collected or reinvested. An automatic manager may add its own behavior and costs. A high historical fee rate does not establish that those actions are worthwhile.'],sources:[fees,{title:'Teren: explore arbitrage and changing fee competition',url:'https://teren.sh/liquidity.html#fee-mechanics'},{title:'Revert: performance comparisons and omitted gas',url:'https://docs.revert.finance/revert/open-positions'}]},
  {id:'range-management',short:'Exits, returns and costs',title:'What happens after a range exit?',adds:'Add continued price exposure, a return and management costs.',
    intro:'Keep one hypothetical position’s liquidity and bounds unchanged. After ETH leaves its range, compare a further price move. The position still owns one token; going out of range does not liquidate a plain Uniswap position.',
    reasoning:'Why does the principal value behave this way outside the range?',
    reasons:[['asset','It still owns one token, whose dollar price matters.'],['locked','It keeps the dollar value reached at the range boundary.'],['liquidated','It sells its tokens and waits outside the pool.']],
    hint:'Below this ETH-price range the position holds ETH; above it, USDC. The example assumes USDC stays at $1.',
    takeaway:'Inactive is not closed. Price exposure remains, and managing a range can add costs.',
    accomplishment:'You distinguished a range exit from removing liquidity, and explained what happens on a return.',
    explanation:'Outside its range, the position stops earning new swap fees. Its token quantities stay fixed until price returns. Holding ETH still exposes it to ETH price moves; holding USDC keeps its value fixed only under this example’s $1 assumption. Earlier fee tokens are not erased by the exit.',
    pitfall:'Changing a real v3 range requires removing liquidity and creating a position with new bounds. It can add network costs and require swaps for a new token mix. It does not refund earlier losses.',
    reasonFeedback:{locked:'Fixed token quantities do not guarantee a fixed dollar value. If the position holds ETH, its value follows ETH’s price.',liquidated:'Going out of range does not close or liquidate a plain Uniswap position. It keeps its tokens and can become active again.'},
    deeper:['Returning price can reactivate an unchanged position automatically. Moving the bounds is a different action: the owner removes liquidity and funds a new position, possibly swapping tokens and paying network costs.', 'A range is not a stop-loss. Below an ETH-price range the position holds ETH and can keep losing dollar value as ETH falls. A range order can also reverse its token conversion if price recrosses before liquidity is removed.'],sources:[change,ranges,{title:'Uniswap: range orders and stop-loss limitations',url:'https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/range-orders'}]},
]);
export function managementPresentation(result) {
  const {id,variant}=result;
  if(id==='range-width')return {
    finding: result.prediction === 'both' ? 'That price sits inside both ranges. The narrower range has less room before a boundary.' : 'Only the wider range includes this price. The narrow position still owns its tokens, but cannot take part in swaps here.',
    reasoning:variant===2?'Both are active here. What still differs between these positions?':null,
    prediction:'At that price, which position will be inside its range?', predictions:[['wide','Only the wider position'],['both','Both positions'],['none','Neither position']],
    metrics:[['Narrow range',result.narrow.state==='inside'?'Active':'Inactive','$1,900–$2,100'],['Wider range',result.wide.state==='inside'?'Active':'Inactive','$1,500–$2,500'],['Earned fees','Unknown','No fee income is estimated']],
    links:[{label:'Explore the narrow setup in Experiment ↗',scenario:result.narrow},{label:'Explore the wider setup in Experiment ↗',scenario:result.wide}],
    note:'Calculated hypothetical endpoints, with zero assumed fees. The links keep each range’s original funding and shown final price.'};
  if(id==='fee-tiers')return {
    finding: 'The fee tiers do not establish which position earns more. Now add a fictional day’s fee totals below and see how the result can differ from the tier ranking.',
    prediction:'From these fee tiers alone, which position will earn more swap fees?',
    predictions:[['unknown','The fee tiers alone cannot tell us'],['a','Position A'],['b','Position B']],
    metrics:[['Position A fees',usd(result.fees[0]),fmt(result.rates[0],2)+'% tier · supplied example day'],['Position B fees',usd(result.fees[1]),fmt(result.rates[1],2)+'% tier · supplied example day'],['Whole-period profit','Unknown','Fee income alone does not establish profit']],links:[],
    note:'The fee totals are supplied teaching facts. They are not calculated from the fee rate, imported data or a forecast.'};
  const held=result.first.pooled.eth===0?'USDC':'ETH';
  return {
    finding: held === 'ETH' ? 'Outside the lower bound, principal remains in ETH. Its dollar value follows ETH’s price even though the token amount stays fixed.' : 'Outside the upper bound, principal remains in USDC. Its value stays fixed here because USDC is assumed to stay at $1.',
    prediction:'After the further price move, what happens to the position’s principal value?',predictions:[['falls','It falls'],['same','It stays the same'],['rises','It rises']],
    metrics:[['After the range exit',usd(result.first.lpBeforeFees),'ETH price '+usd(result.prices[0])],['After the further move',usd(result.second.lpBeforeFees),'ETH price '+usd(result.prices[1])],['Token held',held,'Same token quantity at both outside points']],
    links:[{label:'Explore this setup in Experiment ↗',scenario:result.second}],note:'Hypothetical principal before fees, with unchanged liquidity and USDC = $1. No range changes or earned fees are simulated.'};
}

// Follow-ups change one condition or ask which evidence supports a comparison.
// The learner explains consequences; no arithmetic is required.
export function managementApplication(result) {
  if (result.id === 'range-width') {
    if (result.variant === 0) return {
      context: 'Move ETH to $2,090, inside both ranges. Before fees, each position is worth less than holding its own starting tokens.',
      question: 'How can a position be active and still trail holding?',
      choices: [
        ['mix', 'Swaps have changed its token mix while it remains active.'],
        ['capital', 'Being active has reduced the amount originally deposited.'],
        ['uncollected', 'Uncollected fees have been deducted from its token value.'],
      ],
      hint: 'Active describes whether swaps can use the liquidity. Compare the tokens now held with the starting basket.',
      feedback: 'Swaps change the position’s token mix even inside the range. Being active makes it eligible for fees; it does not make its principal worth as much as holding.',
    };
    if (result.variant === 1) return {
      context: 'The narrower position is now outside its range. It earned more fees during an earlier active spell than the wider position.',
      question: 'What evidence would let you compare their final values?',
      accomplishment: 'You identified the whole-period evidence needed to compare two ranges.',
      choices: [
        ['whole-period', 'Final token values, all period fees and each position’s costs.'],
        ['active-time', 'The time each position spent active during this period.'],
        ['early-fees', 'The fee amounts from the earlier active spell.'],
      ],
      hint: 'Earlier fees and current activity describe only parts of the result.',
      feedback: 'Compare final token values plus all period fees, minus costs. A position can finish ahead despite being inactive at the endpoint; the earlier fee ranking is not enough.',
    };
    return {
      context: 'Both ranges started with $5,000, but they required different amounts of ETH and USDC. You want to know what providing liquidity added compared with keeping those tokens.',
      question: 'Which holding benchmark is fair for each position?',
      accomplishment: 'You matched each position with its own starting-token benchmark.',
      choices: [
        ['own-basket', 'The ETH and USDC amounts that funded that position.'],
        ['same-mix', 'The same half-ETH, half-USDC basket for both positions.'],
        ['start-dollars', 'The original $5,000 dollar amount for both positions.'],
      ],
      hint: 'Holding keeps the tokens you would otherwise have deposited.',
      feedback: 'Each position is compared with its own starting tokens. Equal dollar budgets can contain different token amounts, so their holding values can differ when ETH moves.',
    };
  }
  if (result.id === 'fee-tiers') {
    if (result.variant === 0) return {
      context: 'A dashboard turns yesterday’s fees into a yearly fee APR. Today the trades, fee tier and your liquidity stay the same, but more liquidity competes at every traded price.',
      question: 'What happens to your fee income from those trades?',
      accomplishment: 'You explained why more competition can lower fee income despite an unchanged fee tier.',
      choices: [
        ['smaller-share', 'It falls because your share of active liquidity is smaller.'],
        ['fixed-apr', 'It stays the same because yesterday’s APR sets the payment.'],
        ['larger-pool', 'It rises because the pool now contains more liquidity.'],
      ],
      hint: 'The APR describes earlier fee income. Today’s fees are shared among today’s active liquidity.',
      feedback: 'The same trades produce the same fee pool, but your smaller share earns less. Yesterday’s annualized fee income is not a rate credited to your deposit.',
    };
    if (result.variant === 1) return {
      context: 'Keep the fee tier and your share of active liquidity unchanged. More trading volume now uses your position while it is active.',
      question: 'What changes because of that extra trading?',
      accomplishment: 'You linked increased trading activity to fee income without changing the fee tier.',
      choices: [
        ['more-income', 'Your position earns more swap fees from that activity.'],
        ['same-income', 'Your fee income stays fixed until the fee tier changes.'],
        ['higher-tier', 'Your position moves into a higher fee tier automatically.'],
      ],
      hint: 'The fee tier charges a percentage of each swap. Your share is unchanged here.',
      feedback: 'More volume using the same active share at the same tier produces more fee income. The pool’s fee tier has not changed.',
    };
    return {
      context: 'Between two checkpoints, no new fee tokens accrue. The existing fees keep the same dollar value, costs stay unchanged, and the principal falls further behind holding.',
      question: 'What happens to the LP’s result compared with holding?',
      accomplishment: 'You traced a worsening comparison to principal value even when fee income stays the same.',
      choices: [
        ['smaller-advantage', 'It worsens because the principal shortfall has grown.'],
        ['same-result', 'It stays the same because the fee income is unchanged.'],
        ['higher-apr', 'It improves because the earned fees remain collectable.'],
      ],
      hint: 'Fee income is one part of the comparison; principal value matters too.',
      feedback: 'With fee value and costs unchanged, a larger principal shortfall makes the LP’s comparison worse. Collectable fees are assets, but their existence does not determine the whole result.',
    };
  }
  return {
    context: result.variant === 1
      ? 'Before price returns, you remove all liquidity and withdraw its tokens. ETH then returns to $2,000, inside the old $1,800–$2,200 bounds.'
      : result.variant === 2
        ? 'You collect only earned fee tokens, leaving liquidity and bounds unchanged. ETH then returns to $2,000, inside the original $1,800–$2,200 range. Gas is excluded.'
        : 'Change only the price: ETH returns to $2,000, inside the original $1,800–$2,200 range. Liquidity and bounds are unchanged.',
    question: 'What happens when price returns inside those bounds?',
    choices: [
      ['automatic', 'The existing liquidity becomes active inside its original bounds.'],
      ['removed', 'A new deposit is needed to supply liquidity again.'],
      ['fees', 'The position earns the swap fees missed while it was outside.'],
    ],
    hint: 'Check whether the owner removed liquidity or only collected fees. Those actions are different.',
    feedback: result.variant === 1
      ? 'All liquidity was removed. The old bounds cannot supply liquidity by themselves; a new deposit is needed.'
      : 'The liquidity remains, so it becomes active again inside its bounds. Collecting only fee tokens does not remove principal. Activity does not recover fees missed outside the range.',
  };
}
