import { splitHash } from '../data/split-yield-state.js';
import { fmt } from '../lib/format.js';
import { DEPOSIT, SPLIT_DEFAULTS, splitDeposit } from '../models/split-yield-v1.js';
import { splitAtExit } from '../models/split-yield-exit-v1.js';

const academy = { title: 'Pendle Academy · How a deposit splits', url: 'https://docs.pendle.finance/pendle-academy/pendle-101/chapter-2-yield-tokenization-basics' };
const glossary = { title: 'Pendle · Principal, yield and implied APY', url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Glossary' };
const fees = { title: 'Pendle · Fees on yield and trades', url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Mechanisms/Fees' };
const claims = { title: 'Pendle · Claiming yield after maturity', url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/YieldTokenization/YT#claiming-yt-yield' };
const accounting = { title: 'Pendle · How earned interest is tracked', url: 'https://docs.pendle.finance/pendle-v2-dev/Contracts/YieldTokenization' };

const original = SPLIT_DEFAULTS;
const zero = { ...original, firstApy: 0, secondApy: 0 };
const early = { ...original, switchDay: 10 };
const lateDeposit = splitDeposit(original);
const earlyDeposit = splitDeposit(early);
const zeroDeposit = splitDeposit(zero);
const saleDay = 45;
const highExit = { exitDay: saleDay, exitApy: 15 };
const lowQuote = splitAtExit(original, { exitDay: saleDay, exitApy: 5 });
const highQuote = splitAtExit(original, highExit);
const cash = value => fmt(value, Number.isInteger(value) ? 0 : 2) + ' USDC';
const experiment = (input, exit) => 'yield.html?from=lesson' + splitHash(input, exit);

function timingStage(label, caption, input) {
  const deposit = splitDeposit(input);
  const { days, switchDay, firstApy, secondApy } = input;
  return {
    label, caption, rows: [], path: { days, switchDay, firstApy, secondApy },
    bars: { unit: 'USDC', max: earlyDeposit.netInterest, items: [
      { label: 'Cost of YT on day one', value: deposit.ytCost, role: 'cash' },
      { label: 'Interest earned after fees', value: deposit.netInterest, role: 'yt' },
    ] },
  };
}

function saleStage(label, quote) {
  return {
    label,
    caption: 'A buyer who expects more interest over the next 45 days may offer more for YT. The seller keeps the interest earned before day 45. Both sales are shown before trading costs.',
    rows: [
      ['PT buyer can sell for', cash(quote.ptSale), 'pt'],
      ['YT buyer takes home in total', cash(quote.ytTotal), 'yt'],
    ],
    bars: { unit: 'USDC', max: highQuote.ytSale, items: [
      { label: 'YT sale price', value: quote.ytSale, role: 'sale' },
      { label: 'Interest the YT seller keeps', value: quote.ytInterest, role: 'earned' },
    ] },
  };
}

export const YIELD_LESSONS = [
  {
    id: 'split', short: 'What gets split?', title: 'One deposit, two things you can own',
    intro: 'You put 1,000 USDC into a deposit that earns interest. The amount you put in is the principal. The extra it earns over time is interest. Here, 1 USDC is worth $1.',
    setup: {
      title: 'Meet your deposit',
      facts: [
        ['Your principal tokens (PT)', 'Together they let you redeem the original 1,000 USDC on day 90.'],
        ['Your yield tokens (YT)', 'Together they give you the interest that deposit earns over the 90 days.'],
      ],
      action: 'You keep all your PT. A buyer pays you 20 USDC for all your YT at the start.',
      assumptions: 'Day 90 is the maturity date. The deposit repays its principal in full in this example.',
    },
    prediction: {
      question: 'After the sale, the deposit earns interest. Who can collect it?',
      choices: [['seller', 'You, as the person who made the deposit.'], ['buyer', 'The person who bought the YT from you.'], ['both', 'You and the buyer share it.']],
      correct: 'buyer',
      feedback: {
        seller: 'You kept the PT and the buyer’s payment. You sold the right to the interest.',
        buyer: 'The buyer owns the YT while the interest is earned.',
        both: 'The two tokens carry different rights. The PT gives you the principal and the YT gives the buyer the interest.',
      },
    },
    finding: 'You keep the 20 USDC the buyer paid. They receive the interest, and you can redeem the principal on day 90.',
    scene: { title: 'Follow your deposit', origin: 'Your 1,000 USDC deposit', outcome: 2, stages: [
      { label: 'Split the deposit', caption: 'At first you own both parts of the same deposit.', rows: [
        ['You hold the PT', 'The original 1,000 USDC', 'pt'], ['You hold the YT', 'The next 90 days of interest', 'yt'],
      ] },
      { label: 'Sell the YT', caption: 'The buyer sends you money today for the interest the deposit will earn.',
        transfer: { from: 'YT buyer', to: 'Your wallet', value: cash(lateDeposit.ytCost) }, rows: [
        ['You keep', 'PT for the principal', 'pt'], ['The buyer gets', 'YT for the interest', 'yt'],
      ] },
      { label: 'Reach maturity', caption: 'The YT stops earning on day 90. By selling it, you chose 20 USDC up front over whatever interest these 90 days would bring.',
        retainedPayment: { label: 'Already in your wallet from selling YT', value: cash(lateDeposit.ytCost) }, rows: [
        ['You can redeem', cash(DEPOSIT) + ' of principal', 'pt'],
        ['Earned and ready for the buyer to claim', cash(lateDeposit.netInterest) + ' after the yield fee', 'yt'],
      ] },
    ] },
    reason: {
      question: 'You received 20 USDC today. Why can you still get the full 1,000 back on day 90?',
      choices: [['advance', 'The 20 USDC is a loan you repay on day 90.'], ['sale', 'You sold the interest and kept the right to the principal.'], ['refill', 'Future interest will refill the 20 USDC you withdrew.']],
      correct: 'sale',
      feedback: {
        advance: 'The buyer paid the price you agreed. You owe them no repayment. They own the right to the interest.',
        sale: 'The 20 USDC came from the buyer’s wallet. The whole deposit still backs your PT.',
        refill: 'You sold your YT to another person. Nothing was withdrawn from the 1,000 USDC deposit.',
      },
    },
    applicationContext: 'The day after maturity, the buyer’s wallet shows that the YT itself is worth zero. They haven’t claimed any interest yet.',
    application: {
      question: 'What can they still collect?',
      choices: [['past', 'The interest earned while they held the YT.'], ['principal', 'The original deposit now that the YT has expired.'], ['nothing', 'Nothing, because they missed the maturity date.']],
      correct: 'past',
      feedback: {
        past: 'Maturity ends the period for earning more. Interest already earned remains available to collect.',
        principal: 'The right to the principal stayed with your PT. The YT buyer can still collect the interest they earned.',
        nothing: 'The final day is a cutoff for earning interest. It is not a deadline to collect what has already accrued.',
      },
    },
    hint: 'For the first question, follow the 20 USDC from the buyer’s wallet. For the second, look at what the buyer had already earned by day 90.',
    accomplishment: 'You followed the original deposit, the buyer’s payment and the interest to their owners.',
    deeper: [
      'The split produces 1,000 PT and 1,000 YT. Each PT represents one unit of principal. You can still redeem your PT after day 90. Waiting earns you no extra interest.',
      'Each YT receives the interest on one unit until expiry. The buyer can collect it as it accrues. Here the interest stays in the earning asset. We value it in USDC after the 5% fee on YT interest.',
    ],
    sources: [academy, claims, fees], experimentHref: experiment(original),
  },
  {
    id: 'buyers', short: 'Why buy PT or YT?', title: 'Why buy either part?',
    intro: 'Look at the same kind of deposit from the other side of the sale. Mina wants a known payment on a set date. Leo thinks the interest over the next 90 days will be worth buying.',
    setup: {
      facts: [
        ['Mina buys all the PT', 'Pays 980 USDC for the right to redeem 1,000 USDC on day 90.'],
        ['Leo buys all the YT', 'Pays 20 USDC for the interest on the deposit until day 90.'],
      ],
      action: 'Both hold to maturity. Imagine the deposit earns no interest at all.',
      assumptions: 'The principal is repaid in full. There are no trading costs.',
    },
    prediction: {
      question: 'Can either buyer still finish with more USDC than they paid?',
      choices: [['neither', 'Neither buyer.'], ['leo', 'Leo, the YT buyer.'], ['mina', 'Mina, the PT buyer.']],
      correct: 'mina',
      feedback: {
        neither: 'Leo needs interest to recover his price. Mina already bought the claim for less than it redeems for.',
        leo: 'A low entry price limits the amount Leo spent. His YT still needs interest to pay him anything.',
        mina: 'Mina can redeem the full principal even in this zero-interest example.',
      },
    },
    finding: 'Mina paid 980 USDC and redeems 1,000. Leo paid 20 USDC for interest and receives none in this case.',
    scene: { title: 'Follow the two buyers', outcome: 1, stages: [
      { label: 'Buy the tokens', caption: 'Mina and Leo buy different parts of one deposit.', rows: [
        ['Mina buys PT', cash(zeroDeposit.ptCost) + ' paid', 'pt'], ['Leo buys YT', cash(zeroDeposit.ytCost) + ' paid', 'yt'],
      ] },
      { label: 'Redeem on day 90', caption: 'The deposit repays the principal. It earned no interest along the way.', rows: [
        ['Mina receives', cash(DEPOSIT) + ' in principal', 'pt'], ['Leo receives', cash(zeroDeposit.netInterest) + ' in interest', 'yt'],
      ] },
    ] },
    reason: {
      question: 'How did Mina make a gain when the deposit paid no interest?',
      choices: [['repayment', 'She bought a claim for less than its repayment amount.'], ['transfer', 'Leo’s purchase payment went to her at maturity.'], ['interest', 'Her PT earned a separate stream of interest.']],
      correct: 'repayment',
      feedback: {
        repayment: 'Her return is the difference between the 980 USDC she spent and the 1,000 she redeemed.',
        transfer: 'Leo paid the original seller when he bought the YT. Mina receives the face amount of her PT.',
        interest: 'The PT paid no separate interest. Paying less than the redemption amount gave Mina her gain.',
      },
    },
    applicationContext: 'On another deposit, Leo pays 20 USDC for YT and holds it to maturity. He collects 12 USDC in interest after fees.',
    application: {
      revision: 2,
      question: 'Who, if anyone, owes Leo the remaining 8 USDC?',
      choices: [['refund', 'The seller who received his 20 USDC.'], ['cost', 'Nobody owes him a payment.'], ['top-up', 'The PT holder who redeems the principal.']],
      correct: 'cost',
      feedback: {
        refund: 'The seller delivered the YT when Leo paid. They never promised to buy it back or cover a shortfall.',
        cost: 'The 12 USDC is real income. Leo still lost 8 USDC on the purchase.',
        'top-up': 'The PT holder redeems the principal. They owe Leo no payment if the interest falls short.',
      },
    },
    hint: 'Trace each buyer’s purchase payment first, then what their token lets them receive.',
    accomplishment: 'You explained how PT can gain with zero interest and why earning some interest can still leave a YT buyer with a loss.',
    deeper: [
      'Pendle calls the return implied by PT’s purchase price its fixed yield. A buyer who holds to maturity knows the redemption amount in the market’s accounting asset, assuming full repayment.',
      'The 980 and 20 USDC here buy all the claims from one deposit. The lab also lets two buyers spend equal budgets, in which case each buys a different quantity of tokens.',
    ],
    sources: [academy, glossary], experimentHref: experiment(zero),
  },
  {
    id: 'timing', short: 'When does the interest arrive?', title: 'The same rate rise, earlier or later',
    intro: 'A YT buyer pays 20 USDC for the interest on a 1,000 USDC deposit and leaves the interest there until day 90. Compare two ways those days could unfold.',
    setup: {
      facts: [
        ['In both cases', 'The annual percentage yield (APY) starts at 5% and finishes at 15%. These are rates for a full year.'],
        ['What the buyer pays', '20 USDC at the start in either case.'],
      ],
      action: 'Move the rise to 15% from day 80 to day 10. Maturity stays on day 90.',
    },
    prediction: {
      question: 'What does moving the rate rise earlier do to the interest the buyer collects?',
      revision: 2,
      choices: [['more', 'They earn more interest by day 90.'], ['earlier', 'They earn the same total, only sooner.']],
      correct: 'more',
      feedback: {
        more: 'The deposit earns 15% for 80 days instead of ten. That gives the buyer enough interest to cover the 20 USDC they paid.',
        earlier: 'The buyer gets 70 extra days at the higher rate. By day 90 the interest covers the 20 USDC purchase only in the earlier-rise example.',
      },
    },
    finding: 'A rise on day 80 leaves the buyer short of the 20 USDC they paid. A rise on day 10 gives the same buyer enough time to make a gain.',
    scene: { title: 'Move the rate rise', outcome: 1, stages: [
      timingStage('Rise on day 80', 'Only the last 10 days earn the higher rate. By maturity the buyer still hasn’t recovered the 20 USDC they paid.', original),
      timingStage('Rise on day 10', 'The deposit now earns the higher rate for 80 days. The buyer paid the same price on day one.', early),
    ] },
    reason: {
      revision: 2,
      question: 'Reverse the day-80 example. Ten days at 15% come first, then 80 days at 5%. The YT earns the same ' + cash(lateDeposit.netInterest) + ' either way. Why?',
      choices: [['duration', 'Each rate applies for the same number of days in both runs.'], ['price', 'The buyer paid the same 20 USDC for YT in both runs.'], ['average', 'Both deposits earn 10% APY, halfway between the two rates.']],
      correct: 'duration',
      feedback: {
        duration: 'If you hold YT to maturity and leave the interest invested, the deposit grows through both periods in either order. A day-45 seller would have earned ten days at 15% in one run and none in the other.',
        price: 'The purchase price tells you what the buyer needs to recover. The deposit would earn the same interest even if someone paid a different price for that YT.',
        average: 'A simple average gives both rates equal weight. Here the deposit spends 80 days at 5% and only ten at 15%, whichever period comes first.',
      },
    },
    applicationContext: 'You have 20 USDC. You buy YT on a 1,000 USDC deposit and receive exactly 20 USDC in interest after fees by maturity. You could also have put your 20 USDC into that interest-earning deposit.',
    application: {
      revision: 2,
      question: 'Which choice would have left you with more money on day 90?',
      choices: [['notional', 'Buying YT. It earned the interest on a much larger deposit.'], ['tie', 'They would tie. The YT earned back its whole purchase price.'], ['deposit', 'Depositing the 20 USDC. I’d still have it and the interest it earned.']],
      correct: 'deposit',
      feedback: {
        notional: 'The 1,000 USDC belongs to the principal holder. Your YT gave you its interest, which in this case just covered your purchase.',
        tie: 'You finish the YT trade with the 20 USDC you started with. A direct deposit would also have paid interest on your 20 USDC.',
        deposit: 'The YT purchase broke even. Depositing the same money would have left you with your 20 USDC plus interest.',
      },
    },
    hint: 'Look at how long each rate lasts. For the 20 USDC decision, follow what you would own at maturity in each case.',
    accomplishment: 'You explained why the time spent at each rate matters and how a YT purchase can break even while a deposit earns more.',
    deeper: [
      'The 5% and 15% are annual rates. The lab compounds each rate only for the days it actually applies and deducts a 5% fee from the interest paid to YT.',
      'A quoted rate gives you a starting point. To judge a purchase held to maturity, compare the actual after-fee interest with the price paid. To judge the alternative, track what the same budget would have earned in the unsplit asset.',
    ],
    sources: [fees, glossary], experimentHref: experiment(early),
  },
  {
    id: 'exit', short: 'Selling before maturity', title: 'What do you sell when you exit early?',
    intro: 'Each PT in this example repays 1 USDC on day 90. A buyer who pays less today earns a higher annual return if they hold until then. That return is the market’s implied APY.',
    setup: {
      facts: [
        ['At purchase', 'Two traders spend 1,000 USDC each. One buys PT. The other buys the interest on fifty 1,000 USDC deposits through YT.'],
        ['On day 45', 'You can redeem one PT and its matching YT together for 1 USDC worth of the deposit. That’s why the pair costs 1 USDC in this example.'],
      ],
      action: 'The first quote is at 5% implied APY. The second quote on the same day is at 15%, so a buyer offers less for PT.',
    },
    prediction: {
      revision: 2,
      question: 'If PT gets cheaper, what would you expect someone to offer for its matching YT?',
      choices: [['higher', 'More at 15% than at 5%.'], ['lower', 'Less, just as they offer less for PT.'], ['unchanged', 'The same until the deposit earns more interest.']],
      correct: 'higher',
      feedback: {
        higher: 'The pair still costs 1 USDC. Paying less for the principal leaves a higher price for the remaining interest.',
        lower: 'If both prices fell, the pair would cost less than 1 USDC. Here the lower PT offer goes with a higher YT offer.',
        unchanged: 'A new buyer can offer more for the remaining interest today. The market price can change before the deposit earns another cent.',
      },
    },
    finding: 'The higher implied APY raises the YT offer and lowers the PT offer. The YT seller keeps the same interest earned before day 45.',
    scene: { title: 'Compare two offers on day 45', outcome: 1, stages: [
      saleStage('5% implied APY', lowQuote), saleStage('15% implied APY', highQuote),
    ] },
    reason: {
      revision: 2,
      question: 'What does the higher YT offer buy for the new owner?',
      choices: [['fixed-rate', 'Interest at 15% APY from the sale until day 90.'], ['future-income', 'Whatever interest the deposit earns from the sale until day 90.'], ['unclaimed', 'The remaining interest plus any the seller hasn’t claimed yet.']],
      correct: 'future-income',
      feedback: {
        'fixed-rate': 'The 15% comes from the market price for PT. The interest the new YT owner receives depends on what the deposit actually earns during the remaining 45 days.',
        'future-income': 'What the buyer pays is known on day 45. How much interest those next 45 days will bring is still open.',
        unclaimed: 'Interest belongs to whoever held the YT when it was earned. Waiting to claim it leaves it with the seller.',
      },
    },
    applicationContext: 'For a different trade, your wallet shows two swaps. You paid 200 USDC for YT and later sold it for 170 USDC. Trading costs are zero in this example.',
    application: {
      revision: 2,
      question: 'Which other amount would tell you whether you lost money on the trade?',
      choices: [['full-term', 'The interest on your YT for the full 90-day term.'], ['projection', 'The interest projected when you first bought the YT.'], ['your-income', 'The interest your YT earned between your two swaps.']],
      correct: 'your-income',
      feedback: {
        'full-term': 'A full-term total can include interest earned by other owners. Add only the interest from the days the YT was yours to what you received on the sale.',
        projection: 'The original quote was an estimate. To add up the trade, use the interest you actually earned while you held the YT.',
        'your-income': 'Include that interest even if you haven’t claimed it yet. With 30 USDC after fees you broke even. Anything above 30 was a gain.',
      },
    },
    hint: 'Keep the sale day fixed. Trace what the old owner earned before day 45 and what the new owner is buying after it.',
    accomplishment: 'You accounted for both the resale value of YT and the interest earned before the sale.',
    deeper: [
      'Before maturity, redemption takes equal numbers of PT and YT from the same market. After maturity, PT alone redeems the principal. Interest earned while holding YT can be claimed separately.',
      'These are hypothetical offers before trading costs. A real sale also depends on available liquidity, the trading fee and price impact. Real YT can include rewards or points. This example follows interest alone.',
    ],
    sources: [glossary, accounting], experimentHref: experiment(original, highExit),
    experimentLabel: 'Explore the ' + highExit.exitApy + '% offer',
    experimentNote: 'The lab compares day-' + saleDay + ' prices at ' + highExit.exitApy +
      '% with what PT and YT would sell for at the original ' + fmt(highQuote.entryImpliedApy) + '% implied APY.',
  },
];
