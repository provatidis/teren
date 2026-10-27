import { formatTokenQuantity, usd } from '../lib/format.js';
import { unwindSaleCostComparison } from '../models/loop-lessons.js';

const borrowing = { title: 'Aave: borrowing and debt', url: 'https://aave.com/help/borrowing/borrow-tokens' };
const health = { title: 'Aave: health factor and liquidations', url: 'https://aave.com/help/borrowing/liquidations' };
const repayment = { title: 'Aave: repaying a loan', url: 'https://aave.com/help/borrowing/repay-tokens' };
const withdrawal = { title: 'Aave: withdrawing supplied tokens', url: 'https://aave.com/help/supplying/withdraw-tokens' };

export const LOOP_LESSONS = [
  {
    id: 'build', short: 'Build one loop', title: 'More ETH, with more debt beside it',
    adds: 'Borrow once, buy ETH, then supply it.',
    intro: 'Use a loan to buy more ETH, then supply that ETH to back the loan. Follow one round below.',
    question: 'After borrowing, buying ETH and supplying it, what happens to what you own minus what you owe?',
    finding: 'The supplied balance rises from 5 to 7.5 ETH, with 5,000 USDC debt beside it. At $2,000 per ETH and no costs, assets minus debt remains $10,000.',
    predictions: [['same', 'It stays the same.'], ['more', 'It increases with the additional ETH.'], ['less', 'It decreases by the full amount borrowed.']],
    takeaway: 'The extra ETH is financed by debt. This is leverage: more price exposure from the same starting money.',
    accomplishment: 'You traced borrowed cash into ETH and distinguished wallet assets from collateral backing the loan.',
    explanation: 'You end with more ETH and a matching USDC debt. At this unchanged price, with no costs, what you own minus what you owe stays the same.',
    pitfall: 'The USDC was spent on ETH. Counting both would count the same money twice.',
    reasoning: 'Why does owning more ETH leave net assets unchanged here?',
    reasons: [['debt', 'The purchased ETH comes with an equal debt.'], ['cash', 'The borrowed USDC remains available beside the purchased ETH.'], ['exclude-eth', 'ETH bought with a loan is left out of your assets until that loan is repaid.']],
    reasonFeedback: {
      debt: 'Count the new ETH and the debt that paid for it.',
      cash: 'The USDC was spent to buy ETH. It cannot also remain in the wallet.',
      'exclude-eth': 'The purchased ETH is an asset, even while the loan is outstanding. Count both the ETH you own and the debt you owe.',
    },
    applicationLabel: 'After buying, before supplying',
    applicationContext: 'Pause after buying the new ETH, before supplying it as collateral.',
    applicationEvidence: ({ result }) => {
      const bought = result.steps.find(step => step.action === 'swap').position;
      return {
        title: 'Where the ETH is now',
        rows: [
          ['Supplied as collateral', formatTokenQuantity(bought.collateralTokens, 4) + ' ETH'],
          ['In the wallet', formatTokenQuantity(bought.walletETH, 4) + ' ETH'],
          ['Debt still owed', formatTokenQuantity(bought.debt, 2) + ' USDC'],
        ],
      };
    },
    applicationQuestion: 'Which ETH backs the loan at that moment?',
    applications: [['supplied', 'Only the ETH already supplied as collateral.'], ['wallet', 'The newly purchased ETH still in the wallet.'], ['both', 'Both balances, because they belong to the same person.']],
    applicationFeedback: 'Buying ETH does not supply it. Until it is supplied and enabled, wallet ETH is outside the loan’s collateral balance.',
    applicationFeedbackByChoice: {
      supplied: 'The original ETH is already supplied as collateral. The newly bought ETH is yours too, but it does not back this loan while it remains in the wallet.',
      wallet: 'The purchased ETH is still in the wallet. Buying it did not move the original collateral out of the pool or supply the new ETH.',
      both: 'Ownership is not enough for collateral. Wallet ETH can change your total wealth, but it must be supplied and enabled before it backs the loan.',
    },
    hint: 'Separate what you own from what you have actually supplied to back the loan.',
    deeper: ['Each round borrows a chosen fraction of the value supplied in the preceding step, at the unchanged starting price. Later rounds use the ETH bought and supplied by the preceding round.', 'The ledger separates borrowing, swapping and supplying. Health factor can fall when debt is borrowed and improve when purchased ETH is supplied, while price exposure has still increased.'],
    sources: [borrowing, health],
  },
  {
    id: 'stress', short: 'Repeat and change conditions', title: 'The same starting money can carry more price exposure',
    adds: 'Repeat the loop, then lower ETH’s price.',
    intro: 'Compare a loop with holding the original ETH. Both start with the same money. The loop owns more ETH and owes USDC.',
    question: 'If ETH falls to $1,500, which loses more value?',
    finding: 'The loop loses $4,687.50 of net value; holding loses $2,500. The loop exposes more ETH to the same price fall, while its USDC debt stays fixed.',
    predictions: [['loop', 'The borrowing loop.'], ['hold', 'Holding the original ETH.'], ['same', 'Both lose the same net value.']],
    takeaway: 'More ETH exposure amplifies a price move. The USDC debt does not shrink when ETH falls.',
    accomplishment: 'You distinguished a loan that still meets its collateral rule from a strategy that has preserved its value.',
    explanation: 'Every ETH loses value in the price fall, including the ETH bought with loans. The USDC debt stays unchanged. Both choices started with the same original funds.',
    pitfall: 'Borrow interest can push the loan toward liquidation even if ETH’s price stays flat.',
    reasoning: 'What makes the loop’s price loss larger?',
    reasons: [['exposure', 'It holds more ETH against the same starting money, while debt stays in USDC.'], ['debt-falls', 'The USDC debt falls in value together with the ETH collateral.'], ['borrowed-only', 'Only the ETH bought with loans is exposed to the price fall.']],
    reasonFeedback: {
      exposure: 'More ETH changes value, and the USDC debt remains owed.',
      'debt-falls': 'USDC stays at $1 here. Its debt does not shrink with ETH’s price, so it does not offset the loss in ETH value.',
      'borrowed-only': 'Every ETH in the position changes value, whether it came from your starting funds or a loan.',
    },
    applicationLabel: 'A loan above its boundary, with a loss',
    applicationContext: 'At $1,500 per ETH, the loop is still above its liquidation boundary, but it has lost more than holding the original ETH.',
    applicationQuestion: 'How can both results be true?',
    applications: [['backing-not-profit', 'The collateral still backs the debt, while the extra ETH made the price loss larger.'], ['protected-value', 'Staying above the liquidation boundary means the starting value is protected.'], ['no-liquidation-loss', 'The position has lost no value until it is liquidated.']],
    applicationFeedback: 'Health factor checks the collateral backing against debt. It does not measure profit. The loan still meets its collateral rule here, even though the extra ETH has made its price loss larger.',
    applicationFeedbackByChoice: {
      'backing-not-profit': 'Both results can hold: enough collateral remains to back the debt, while more ETH has lost value than in the holding strategy.',
      'protected-value': 'The boundary concerns debt repayment, not preservation of your starting money. More ETH can lose more value while still leaving enough collateral to back the debt.',
      'no-liquidation-loss': 'At today’s price, the ETH is worth less while the USDC debt is unchanged. Assets minus debt has already fallen, even though no sale or liquidation has taken place.',
    },
    hint: 'Check the amount of ETH exposed to the price, and the currency in which debt is owed.',
    deeper: ['All rounds are built at one starting price before the selected interest period. The price example has zero interest. The separate Time example holds ETH at $2,000, with 0% supply APR and 10% borrow APR using continuous compounding for up to one year. These chosen rates illustrate the changed situation; they are not live rates.', 'The lab can compare fixed simple interest with continuous compounding at the same entered APRs. Neither reproduces changing protocol rates or Aave’s reserve-index accounting.', 'A final price cannot establish that a position survived earlier prices. Eligible endpoints retain pre-liquidation balances rather than inventing a liquidation path. Holding means keeping the original ETH without supplying or borrowing; it earns no supply interest.'],
    sources: [borrowing, health],
  },
  {
    id: 'unwind', short: 'Explore unwinding', title: 'Collateral is not all available to sell at once',
    adds: 'Withdraw some ETH, sell it, then repay debt.',
    intro: 'To close the loop, move ETH back to your wallet and use some of it to repay the loan. The order matters.',
    question: 'How does this sequence release the supplied ETH?',
    finding: 'It withdraws some ETH, sells it and repays debt, then repeats. It releases the remaining collateral after the debt is cleared.',
    predictions: [['stages', 'It withdraws and repays in stages, then releases the remainder.'], ['all', 'It withdraws all ETH first, then repays from the sale.'], ['cancel', 'Withdrawing the ETH cancels the matching debt.']],
    takeaway: 'Repaying debt frees collateral. Selling collateral also has a cost.',
    accomplishment: 'You followed repayment through the loan and explained why sale costs leave less USDC to clear the debt.',
    explanation: 'Withdraw some ETH, sell it for USDC, then repay. Less debt lets you withdraw more ETH. After the debt is cleared, one final withdrawal brings the rest to your wallet.',
    pitfall: 'A price fall can block these steps. At or below health factor 1, this illustration stops with debt still owed.',
    reasoning: 'Why can’t you withdraw all collateral first in this sequence?',
    reasons: [['backing', 'The unpaid debt still needs collateral backing.'], ['pending-sale', 'A planned future sale counts as repayment before it happens.'], ['loan-bought', 'ETH bought with a loan stays freely withdrawable even after it backs the debt.']],
    reasonFeedback: {
      backing: 'The collateral must still back the debt during withdrawal, before sale proceeds can repay it.',
      'pending-sale': 'The debt remains until it is repaid. Planning a sale does not repay the debt before the withdrawal.',
      'loan-bought': 'Once supplied as collateral, that ETH helps back the outstanding debt too. Its source does not exempt it from withdrawal limits.',
    },
    applicationLabel: 'The same sale, with a cost',
    applicationContext: 'In the last repayment pass, ETH has been withdrawn into the wallet. Consider selling just enough to clear the remaining debt if the sale had no cost.',
    applicationEvidence: ({ result }) => {
      const sale = unwindSaleCostComparison(result);
      return {
        title: 'Before this sale',
        rows: [
          ['USDC still owed', formatTokenQuantity(sale.debt, 2) + ' USDC'],
          ['Sale proceeds without a cost', formatTokenQuantity(sale.proceedsWithoutCost, 2) + ' USDC'],
          ['ETH price', usd(sale.price)],
          ['Cost added to the sale', sale.costPercent + '%'],
        ],
        note: 'Keep the same loan, ETH price and amount of ETH sold. Change only the cost of this sale.',
      };
    },
    applicationQuestion: 'With this cost, what happens when you use all the sale proceeds to repay?',
    applications: [['debt-remains', 'Some debt remains because the sale raises less USDC.'], ['same-repayment', 'The debt is cleared because the ETH price is unchanged.'], ['retained-eth', 'The debt is cleared; the cost comes out of the ETH you keep.']],
    applicationFeedback: 'The same ETH raises less USDC after a sale cost. Repaying all those proceeds still leaves some debt. Clearing it needs more sale proceeds or other USDC.',
    applicationFeedbackByChoice: {
      'debt-remains': 'The cost reduces the USDC available to repay. Using all the proceeds leaves some debt, so clearing it needs more sale proceeds or other USDC.',
      'same-repayment': 'The price is unchanged, but the cost reduces how much USDC reaches your wallet. Repayment can use only those proceeds, leaving some debt unpaid.',
      'retained-eth': 'Here the cost reduces the USDC received for the ETH sold. It is not taken separately from the ETH you keep, so fewer proceeds reach the loan and some debt remains.',
    },
    hint: 'Separate the value of the ETH sold from the USDC available after paying the sale cost.',
    deeper: ['The preview withdraws at most 95% of the value available above health factor 1. It keeps the intermediate health factor above 1, sells at the selected price less the assumed swap loss, then repays. This 95% is a numerical teaching convention, not an Aave withdrawal parameter or a safety recommendation.', 'Some tools use a flash loan to repay first, release collateral, sell it and repay the flash loan in one transaction. The whole transaction must succeed or revert. This preview separates the actions so you can follow the balances; it does not simulate atomic execution.', 'It uses no flash loan or outside funds. It caps the illustration at 64 steps and never silently writes off unpaid debt. Gas, oracle changes, caps, liquidity limits, collateral-specific restrictions and competing liquidations are excluded.'],
    sources: [withdrawal, repayment, health, { title: 'Aave: atomic repayment with collateral', url: 'https://www.aave.com/docs/aave-v3/smart-contracts/swap-features' }],
  },
];
