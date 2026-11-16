import { splitHash } from '../data/split-yield-state.js';
import { fmt } from '../lib/format.js';
import { DEPOSIT, SPLIT_DEFAULTS, splitDeposit } from '../models/split-yield-v1.js';
import { splitAtExit } from '../models/split-yield-exit-v1.js';

const academy = { title: 'Pendle Academy · How a deposit splits', url: 'https://docs.pendle.finance/pendle-academy/pendle-101/chapter-2-yield-tokenization-basics' };
const glossary = { title: 'Pendle · Principal, yield and implied APY', url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Glossary' };
const fees = { title: 'Pendle · Fees on yield and trades', url: 'https://docs.pendle.finance/pendle-v2/ProtocolMechanics/Mechanisms/Fees' };
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
    caption: 'The YT buyer can sell the remaining 45 days of interest. Their total also includes the interest they have already earned. Both sales are shown before trading costs.',
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
      { label: 'Reach maturity', caption: 'Day 90 arrives. The YT stops earning new interest.',
        retainedPayment: { label: 'Already in your wallet from selling YT', value: cash(lateDeposit.ytCost) }, rows: [
        ['You can redeem', cash(DEPOSIT) + ' of principal', 'pt'],
        ['The buyer has earned', cash(lateDeposit.netInterest) + ' after the yield fee', 'yt'],
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
    applicationContext: 'Your YT buyer holds it through day 90 and forgets to collect the interest. They open their wallet the next day.',
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
    hint: 'Follow the two transfers on the first day. Who sent the 20 USDC, and which token did they receive?',
    accomplishment: 'You followed the original deposit, the buyer’s payment and the interest to their owners.',
    deeper: [
      'The two boxes represent all the tokens from this deposit. In this USDC example the split produces 1,000 PT and 1,000 YT. Each PT represents one unit of principal, and each YT receives the interest on one unit until expiry.',
      'The buyer can collect interest as it accrues. We leave it in the earning asset, value it in USDC and deduct the 5% fee on YT interest. The original deposit and the buyer’s upfront payment are separate.',
    ],
    sources: [academy, fees], experimentHref: experiment(original),
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
    applicationContext: 'In another deposit, Leo pays the same 20 USDC for the YT. This time he collects 12 USDC of interest over the term and holds the YT through maturity.',
    application: {
      question: 'What happens to the 20 USDC Leo paid?',
      choices: [['refund', 'It is refunded when the YT matures.'], ['cost', 'It was the purchase price, so he ends with a loss.'], ['top-up', 'The PT holder covers the part his interest didn’t earn.']],
      correct: 'cost',
      feedback: {
        refund: 'The purchase payment went to the seller. YT pays Leo the earned interest, with no separate refund at maturity.',
        cost: 'He bought the right to an uncertain amount. Receiving 12 USDC leaves him 8 USDC short of what he spent.',
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
    intro: 'A YT buyer pays 20 USDC for the interest on a 1,000 USDC deposit. Compare two ways those 90 days could unfold.',
    setup: {
      facts: [
        ['In both cases', 'The annual percentage yield (APY) starts at 5% and finishes at 15%. These are rates for a full year.'],
        ['What the buyer pays', '20 USDC at the start in either case.'],
      ],
      action: 'Move the rise to 15% from day 80 to day 10. Maturity stays on day 90.',
    },
    prediction: {
      question: 'What does moving the rate rise earlier do to the interest the buyer collects?',
      choices: [['same', 'It stays the same because both deposits finish at 15%.'], ['more', 'It grows because the deposit spends longer at 15%.'], ['earlier', 'The buyer receives the same amount sooner.']],
      correct: 'more',
      feedback: {
        same: 'The closing rate describes the last day. Much more of the term earns the higher rate when it rises on day 10.',
        more: 'With an earlier rise, the higher rate applies to 80 days of the deposit’s life.',
        earlier: 'Moving the rise changes the rate applied to many days. That changes the total the buyer earns by maturity.',
      },
    },
    finding: 'A rise on day 80 leaves the buyer short of the 20 USDC they paid. A rise on day 10 gives the same buyer enough time to make a gain.',
    scene: { title: 'Move the rate rise', outcome: 1, stages: [
      timingStage('Rise on day 80', 'Only the last 10 days earn the higher rate. By maturity the buyer still hasn’t recovered the 20 USDC they paid.', original),
      timingStage('Rise on day 10', 'The deposit now earns the higher rate for 80 days. The buyer paid the same price on day one.', early),
    ] },
    reason: {
      question: 'Why can’t the 15% rate at maturity tell you whether the YT paid for itself?',
      choices: [['annual', 'You also need the interest rate on the day the buyer bought YT.'], ['principal', 'The answer also depends on what PT sold for at maturity.'], ['path', 'You need the interest earned over the whole term and the price paid for YT.']],
      correct: 'path',
      feedback: {
        annual: 'Both deposits started at 5%. Even knowing both rates leaves out how long each applied.',
        principal: 'The YT buyer purchased the interest. They can compare what it paid with their purchase price without selling PT.',
        path: 'Identical final rates can come after very different months. Compare the full period’s net interest with the buyer’s upfront cost.',
      },
    },
    applicationContext: 'A trader paid 20 USDC for the yield on a 1,000 USDC deposit. The interest covered the price of the YT. Now they want to know if they did better than keeping their money deposited.',
    application: {
      question: 'Which comparison would answer the trader’s question?',
      choices: [['whole', 'Compare with keeping the full 1,000 USDC deposited for those 90 days.'], ['cash', 'Compare with leaving 20 USDC unspent in their wallet for those 90 days.'], ['equal', 'Compare with keeping their 20 USDC deposited for those same 90 days.']],
      correct: 'equal',
      feedback: {
        whole: 'The 1,000 USDC was the deposit behind the YT. This trader had 20 USDC to put to work.',
        cash: 'Idle cash can tell the trader whether they recovered their cost. It leaves out the interest they could have earned on a deposit.',
        equal: 'Both choices start with the same money on the same day. Covering the YT price can still leave the trader behind a deposit that earned interest.',
      },
    },
    hint: 'Compare the time each deposit spent earning 15%. Then ask what the same starting money could have earned elsewhere.',
    accomplishment: 'You distinguished earning interest, recovering the price of YT and keeping up with the original deposit.',
    deeper: [
      'The 5% and 15% are annual rates. The lab compounds each rate only for the days it actually applies and deducts a 5% fee from the interest paid to YT.',
      'A quoted rate gives you a starting point. To judge a purchase held to maturity, compare the actual after-fee interest with the price paid. To judge the alternative, track what the same budget would have earned in the unsplit asset.',
    ],
    sources: [fees, glossary], experimentHref: experiment(early),
  },
  {
    id: 'exit', short: 'Selling before maturity', title: 'What do you sell when you exit early?',
    intro: 'You can sell PT or YT before day 90. The market’s implied APY is the annual return a new PT buyer would get by paying today’s price and holding to maturity, assuming full repayment.',
    setup: {
      facts: [
        ['At purchase', 'Two buyers each spend 1,000 USDC. The YT buyer can afford the interest from many deposits.'],
        ['On day 45', 'Compare two offers on that same day. Both have 45 days left until maturity.'],
      ],
      action: 'Change the market’s implied APY from 5% to 15%. The deposit has earned the same interest up to the sale.',
    },
    prediction: {
      question: 'At the higher implied APY, which part of the YT seller’s money changes?',
      choices: [['earned', 'The interest already earned increases.'], ['remaining', 'The offer for the remaining 45 days of interest increases.'], ['both', 'The sale offer and the interest already earned both increase.']],
      correct: 'remaining',
      feedback: {
        earned: 'Both offers are on the same day, after the same interest has accrued. It is the sale price that changes.',
        remaining: 'A buyer pays more for the remaining yield. Everything earned before the sale still belongs to the seller.',
        both: 'The offer changes immediately. The deposit has had no extra time or higher past rate to earn more interest.',
      },
    },
    finding: 'The higher implied APY raises the YT offer and lowers the PT offer. The YT seller keeps the same interest earned before day 45.',
    scene: { title: 'Compare two offers on day 45', outcome: 1, stages: [
      saleStage('5% implied APY', lowQuote), saleStage('15% implied APY', highQuote),
    ] },
    reason: {
      question: 'Why does a new buyer pay less for PT in the 15% offer?',
      choices: [['discount', 'A lower price gives a higher return on the same day-90 repayment.'], ['smaller', 'The higher rate reduces how much principal PT repays on day 90.'], ['term', 'The higher rate moves the repayment further into the future.']],
      correct: 'discount',
      feedback: {
        discount: 'The repayment and its date stay fixed. Paying less today increases the return between purchase and redemption.',
        smaller: 'In both offers the PT redeems for the same principal. The change is in what a buyer pays on day 45.',
        term: 'Both offers have the same 45 days left. The price changes when the buyer requires a different annual return.',
      },
    },
    applicationContext: 'For a different trade, your wallet shows two swaps. You paid 200 USDC for YT and later sold it for 170 USDC. Trading costs are zero in this example.',
    application: {
      question: 'Which other amount would tell you whether you lost money on the trade?',
      choices: [['new-owner', 'The interest the next owner received after your sale.'], ['pt-value', 'The amount the matching PT redeemed for at maturity.'], ['your-income', 'The interest you earned while the YT was yours.']],
      correct: 'your-income',
      feedback: {
        'new-owner': 'Your buyer paid for the yield that came after the sale. That belongs on their side of the trade.',
        'pt-value': 'Your wallet held YT. The principal payment belongs to whoever held PT at maturity.',
        'your-income': 'The sale brought in 30 USDC less than you spent. More than 30 USDC in interest during your ownership would turn that into a gain.',
      },
    },
    hint: 'Keep the sale day fixed. Trace what the old owner earned before day 45 and what the new owner is buying after it.',
    accomplishment: 'You accounted for both the resale value of YT and the interest earned before the sale.',
    deeper: [
      'In this fully backed example, one PT and its matching YT together are priced at one USDC. With the maturity date fixed, a higher implied APY lowers the PT price. More of the pair’s value then goes to the remaining YT claim.',
      'These are hypothetical offers before trading costs. A real sale also depends on available liquidity, the trading fee and price impact. Real YT can include rewards or points. This example follows interest alone.',
    ],
    sources: [glossary, accounting], experimentHref: experiment(original, highExit),
  },
];
