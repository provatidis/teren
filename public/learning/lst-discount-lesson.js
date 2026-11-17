import { lstHash } from '../lib/lst-links.js';
import { fmt, formatTokenQuantity } from '../lib/format.js';
import { LST_DEFAULTS, calculateLST } from '../models/lst-loop-v2.js';

const startingInput = {
  ...LST_DEFAULTS,
  collateral: 1, rate: 1.25, buildMode: 'target', targetExposure: 4,
  maxLTV: 80, threshold: 82.5, oracleMode: 'rate', discount: 0,
  days: 0, stakingAPY: 0, lendingAPY: 0, borrowAPR: 0, laterAPR: 0,
  swapCost: 0, buildFlashFee: 0, exitCost: 0, flashFee: 0, gas: 0,
  exitAvailable: true, exitMode: 'weth', repayPercent: 50, bonus: 3,
};

const labPath = 'lending.html?from=lesson';
function stage(input) {
  return { input, result: calculateLST(input), href: labPath + lstHash(input, 'hold') };
}

function liquidationView(scenario) {
  return { ...scenario, href: labPath + '&show=liquidation' + lstHash(scenario.input, 'hold') };
}

const start = stage(startingInput);
const discount = stage({ ...startingInput, discount: 10 });
const market = stage({ ...discount.input, oracleMode: 'market' });
const liquidations = {
  withBonus: liquidationView(market),
  zeroBonus: liquidationView(stage({ ...market.input, bonus: 0 })),
};
const weth = value => formatTokenQuantity(value, 4) + ' WETH';

export function lstDiscountCase(id = 'discount') {
  if (id !== 'discount') throw new RangeError('Choose the wstETH discount lesson.');
  return { input: discount.input, result: discount.result, prediction: 'sale-only', stages: { start, discount, market }, liquidations };
}

export function checkLSTDiscountUnderstanding(id, reason, application) {
  if (id !== 'discount') throw new RangeError('Choose the wstETH discount lesson.');
  const reasoning = reason === 'debt-fixed', transfer = application === 'health-only';
  return { reasoning, application: transfer, passed: reasoning && transfer };
}

export const LST_DISCOUNT_LESSON = {
  id: 'discount', short: 'A discount on wstETH', title: 'What is your wstETH worth when you close the loop?',
  adds: 'Compare two prices for the same collateral.',
  intro: 'You started with 1 wstETH and borrowed WETH to buy more. You’re thinking of closing the loop. Your lender shows a health factor of ' + fmt(start.result.end.healthFactor) + '. What would a buyer pay for your wstETH?',
  setup: {
    title: 'Your open position',
    facts: [
      ['Supplied to the lender', start.result.end.collateral + ' wstETH'],
      ['WETH you owe', weth(start.result.end.debt)],
      ['Starting market price', weth(start.result.end.marketPrice) + ' per wstETH'],
    ],
    action: 'Buyers now offer ' + discount.input.discount + '% less. Your lender keeps valuing each wstETH at its staking conversion value of ' + weth(start.result.end.oraclePrice) + '.',
    assumptions: 'No time passes. The token balances stay fixed. Assume zero trading costs, flash-loan fees and gas.',
  },
  question: 'When buyers offer 10% less for wstETH, which number falls?',
  predictions: [
    ['sale-only', 'Only the amount of WETH you could sell the collateral for.'],
    ['both', 'Both the sale proceeds and the health factor.'],
    ['health-only', 'Only the health factor shown by the lender.'],
  ],
  finding: `The sale quote drops from ${weth(start.result.end.collateralValue)} to ${weth(discount.result.end.collateralValue)}. With the same lender price and debt, health factor stays at ${fmt(discount.result.end.healthFactor)}.`,
  takeaway: 'The market sets what a sale brings in. The lender uses its own price source to decide when the loan can be liquidated.',
  explanation: `If you close at the discounted price, ${weth(discount.result.end.debt)} still goes to repay the loan. You would keep ${weth(discount.result.exit.cash)}, down from ${weth(start.result.exit.cash)} at the original price.`,
  pitfall: 'Unwrapping wstETH gives you stETH. To repay this loan you still need WETH.',
  reasoning: 'The market price falls 10%. Why does the WETH you would keep after repayment fall by more than 10%?',
  reasons: [
    ['debt-fixed', 'All four wstETH sell for less, and you still owe the same WETH.'],
    ['debt-grows', 'The lender adds WETH to your debt to cover the drop in the collateral price.'],
    ['second-discount', 'The discount applies again when you repay the WETH you borrowed.'],
  ],
  reasonFeedback: {
    'debt-fixed': 'All four wstETH sell for less. You absorb that whole drop in the smaller amount left over after repaying the loan.',
    'debt-grows': 'You borrowed WETH and still owe ' + weth(discount.result.end.debt) + '. The drop comes from what the four wstETH would sell for.',
    'second-discount': 'Repayment is in WETH. Once the collateral sale gives you WETH, paying back the loan requires no second swap.',
  },
  applicationLabel: 'The lender changes its price source',
  applicationContext: 'Keep the discounted market quote. Imagine the lender now uses that quote to value your collateral. Its health factor reads ' + fmt(market.result.end.healthFactor) + '. No tokens have moved.',
  applicationQuestion: 'What changes as soon as the lender uses the market price?',
  applications: [
    ['health-only', 'The loan becomes eligible for liquidation. The market still offers the same WETH.'],
    ['quote-falls', 'The loan becomes eligible for liquidation and the sale quote drops again.'],
    ['balance-covers', 'The loan stays above its boundary because the sale quote still covers the debt.'],
  ],
  applicationFeedback: 'The lender’s new price puts health factor below 1. The market already reflected the discount.',
  applicationFeedbackByChoice: {
    'health-only': 'The same four wstETH are still quoted at ' + weth(market.result.end.collateralValue) + '. The lender now allows liquidation. Seizing collateral would take a separate transaction.',
    'quote-falls': 'Buyers were already offering the discounted price. Changing which price the lender reads changes the loan’s eligibility and leaves that offer in place.',
    'balance-covers': 'The lender requires a cushion above the debt. Here its liquidation threshold is ' + market.input.threshold + '%, so even collateral worth more than the debt can cross the boundary.',
  },
  hint: 'First follow what the buyer pays and what the lender is owed. Then check which price the lender uses for its health factor.',
  accomplishment: 'You explained why a market discount can shrink your exit proceeds before the lender’s health factor moves.',
  deeper: [
    'The conversion rate tells you how much stETH each wstETH represents. This example values each unit of that stETH at one WETH for the lender’s conversion-based price.',
    'This hypothetical lender uses an ' + market.input.threshold + '% liquidation threshold. With the market price its health factor falls below 1. The lab stops the exit preview there. The sale quote still shows what the collateral is worth before any liquidation.',
  ],
  sources: [
    { title: 'Lido · What wstETH unwraps into', url: 'https://docs.lido.fi/contracts/wsteth/' },
    { title: 'Aave · Health factor and liquidation eligibility', url: 'https://aave.com/help/borrowing/liquidations' },
  ],
};
