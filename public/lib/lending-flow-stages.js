import { calculateLoan, LOAN_MODEL } from '../models/collateral-loan-v1.js';
import { fmt, usd } from './format.js';

// These are completed hypothetical balances, not transactions or a price path.
// Supplied ETH is a claim on pool assets, separate from spendable wallet tokens.
function position(result) {
  const { input, end } = result;
  const borrowLimit = input.collateralEnabled ? end.collateralValue * input.maxLTV / 100 : 0;
  return {
    walletETH: 0, cash: result.borrowedCash, suppliedETH: end.collateralTokens,
    debt: end.debt, collateralEnabled: input.collateralEnabled,
    borrowLimit, available: Math.max(0, borrowLimit - end.debt),
    netAssets: result.netAssets, healthFactor: end.healthFactor,
  };
}

function supplyFlow(result) {
  const { input } = result;
  if (input.days !== 365 || input.borrow !== 0 || input.collateralEnabled || input.future !== input.start) {
    throw new RangeError('The supply scene needs one fixed-price year with collateral off and no debt.');
  }
  const supplied = position(calculateLoan({ ...input, days: 0 }));
  const wallet = { ...supplied, walletETH: input.collateral, suppliedETH: 0 };
  const accrued = position(result);
  // Enable the already accrued supply. Rebasing at day zero avoids paying the
  // same year's interest again when the collateral setting changes.
  const enabled = position(calculateLoan({ ...input, collateral: accrued.suppliedETH,
    start: input.future, days: 0, collateralEnabled: true }));
  return {
    questionIndex: 2,
    intro: 'Start with ' + fmt(input.collateral, 2) + ' ETH. ETH stays at ' + usd(input.start) + '. Supply earns an assumed ' + fmt(input.supplyAPR, 0) + '% simple annual interest.',
    scope: 'The question and Experiment link use one year with collateral off. Enabling it is a separate change to explore.',
    note: 'Supplied ETH is your claim on the lending pool. The example leaves out costs and assumes a constant rate. When enabled, borrowing is limited to ' + fmt(input.maxLTV, 0) + '% of the supply’s value.',
    stages: [
      { action: 'start', label: 'In your wallet', group: 'Supply and interest', position: wallet, changed: [],
        cue: 'The ETH is still in your wallet.',
        copy: 'Holding ETH in a wallet does not earn the supply interest shown in this example.' },
      { action: 'supply', label: 'Supplied · collateral off', group: 'Supply and interest', playLabel: 'Show supplying ETH', position: supplied, changed: ['wallet', 'supply'],
        cue: 'Wallet → lending pool: ' + fmt(input.collateral, 2) + ' ETH.',
        copy: 'ETH moves out of your wallet into the lending pool. It can earn supply interest while its collateral setting is off.' },
      { action: 'interest', label: 'One year later', group: 'Supply and interest', playLabel: 'Show one year later', position: accrued, changed: ['supply'],
        cue: 'Interest adds ' + fmt(result.supplyInterestTokens, 2) + ' ETH to your supply.',
        copy: 'Interest stays in the supplied balance. Collateral is still off, so borrowing capacity stays at zero. No debt appears.' },
      { action: 'enable', label: 'Collateral enabled', group: 'Try a change', playLabel: 'Show collateral enabled', position: enabled, changed: ['capacity'],
        cue: 'No tokens move. The collateral setting changes.',
        copy: 'The same supplied ETH can now back a loan. Borrowing capacity appears, but you have not borrowed any USDC.' },
    ],
  };
}

function borrowFlow(result) {
  const { input } = result;
  if (input.days !== 0 || input.future !== input.start || !input.collateralEnabled || input.borrow <= 0) {
    throw new RangeError('The borrowing scene needs a new loan before time or prices change.');
  }
  const before = position(calculateLoan({ ...input, borrow: 0 }));
  const after = position(result);
  return {
    questionIndex: 1,
    intro: 'Start with ' + fmt(input.collateral, 2) + ' ETH already supplied as collateral at ' + usd(input.start) + ' per ETH. No time passes; costs are excluded.',
    scope: 'The question and Experiment link use the ' + fmt(input.borrow, 0) + ' USDC loan. The borrowed cash stays in the wallet.',
    note: 'USDC = $1. The ' + fmt(input.maxLTV, 0) + '% limit controls new borrowing; the separate ' + fmt(input.threshold, 0) + '% liquidation threshold applies to existing debt. Both are teaching assumptions.',
    stages: [
      { action: 'start', label: 'Before borrowing', group: 'One loan', position: before, changed: [],
        cue: 'The supplied ETH can back a loan. No debt yet.',
        copy: 'Borrowing capacity is permission to borrow under the assumed rules. It is not money already in your wallet.' },
      { action: 'borrow', label: 'After borrowing', group: 'One loan', playLabel: 'Show borrowing USDC', position: after, changed: ['wallet', 'debt', 'capacity'],
        cue: 'Pool → wallet: ' + fmt(input.borrow, 0) + ' USDC. Matching debt is recorded.',
        copy: 'Cash and debt increase together. Your supplied ETH stays put, and assets minus debt stay the same before costs.' },
    ],
  };
}

export function lendingFlowStages(result, lesson) {
  if (result?.model !== LOAN_MODEL) throw new RangeError('Use a supported lending example.');
  if (lesson === 'supply') return supplyFlow(result);
  if (lesson === 'borrow') return borrowFlow(result);
  throw new RangeError('Choose a supply or borrowing scene.');
}
