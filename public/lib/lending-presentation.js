import { fmt, usd, compactUSD } from './format.js';

export function loanMoney(value) {
  if (value > 0 && value < 0.01) return '<$0.01';
  if (Math.abs(value) >= 1e9) return compactUSD(value);
  return usd(value);
}

export function healthLabel(value) {
  if (value === null) return 'No debt';
  if (value >= 1000) return '≥ 1,000';
  if (value < 1 && value >= 0.995) return '< 1.00';
  if (value > 1 && value < 1.005) return '> 1.00';
  return fmt(value);
}

export function loanStatus(position) {
  return { 'no-debt': 'No loan to liquidate', above: 'Above the liquidation boundary', boundary: 'At the liquidation boundary', eligible: 'Eligible for liquidation' }[position.status];
}

export function lendingMetrics(id, result) {
  if (id === 'supply') return [
    ['Supplied after one year', fmt(result.end.collateralTokens, 2) + ' ETH', 'Interest stays in the supplied asset'],
    ['Borrowing limit', usd(result.startingLimit), 'Collateral is disabled'],
    ['Debt', usd(result.end.debt), 'No loan has been taken'],
  ];
  if (id === 'borrow') return [
    ['Supplied ETH', usd(result.end.collateralValue), '5 ETH at the same price'],
    ['Borrowed cash / debt', usd(result.borrowedCash) + ' / ' + usd(result.end.debt), 'Count both sides'],
    ['Assets minus debt', usd(result.netAssets), 'Includes the borrowed cash in the wallet'],
  ];
  if (id === 'conditions') return [
    ['Debt after one year', usd(result.end.debt), 'Includes assumed borrow interest'],
    ['Starting health factor', healthLabel(result.start.healthFactor), 'Before interest'],
    ['Health factor after one year', healthLabel(result.end.healthFactor), 'ETH price unchanged'],
  ];
  return [
    ['Leave unchanged', healthLabel(result.end.healthFactor), 'Health factor'],
    ['Repay debt', healthLabel(result.responses.repay.healthFactor), 'Same $1,000 additional budget'],
    ['Add collateral', healthLabel(result.responses.add.healthFactor), 'Same $1,000 additional budget'],
  ];
}
