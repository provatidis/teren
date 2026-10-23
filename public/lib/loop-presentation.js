import { loanMoney, healthLabel } from './lending-presentation.js';
import { formatTokenQuantity } from './format.js';

export const loopTokens = value => formatTokenQuantity(value, 6) + ' ETH';
export const loopMoney = value => (value < 0 ? '−' : '') + loanMoney(Math.abs(value));

// Ignore only floating-point noise relative to the compared balances.
// A small real loss must keep its sign even when it is less than one cent.
export function loopComparison(value, holding, benchmark = 'holding') {
  const raw = value - holding;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(holding)) * 8;
  const difference = Math.abs(raw) <= tolerance ? 0 : raw;
  if (difference === 0) {
    const exact = raw === 0;
    return { difference, relation: 'equal', label: exact ? 'Matches ' + benchmark : 'Nearly the same as ' + benchmark, compact: exact ? 'Same as ' + benchmark : 'Nearly the same as ' + benchmark };
  }
  const amount = loopMoney(Math.abs(difference));
  return {
    difference,
    relation: difference > 0 ? 'ahead' : 'behind',
    label: amount + (difference > 0 ? ' more than ' : ' less than ') + benchmark,
    compact: (difference > 0 ? '+' : '−') + amount + ' vs ' + benchmark,
  };
}

export const loopRoundLabel = rounds => rounds === 0 ? 'Supply only' : rounds + (rounds === 1 ? ' round' : ' rounds');

export function loopUnwindLabels(status) {
  if (status === 'blocked') return {
    eth: 'Supplied ETH · unchanged', debt: 'Debt still owed', cost: 'Unwind swaps', net: 'Assets minus debt · before liquidation',
  };
  if (status === 'limited') return {
    eth: 'ETH still supplied', debt: 'Debt still owed', cost: 'Swap losses so far', net: 'Assets minus debt · after partial preview',
  };
  if (status === 'no-debt') return {
    eth: 'ETH kept · no sale needed', debt: 'Debt', cost: 'Swap losses during unwind', net: 'Assets minus debt · no unwind needed',
  };
  if (status !== 'complete') throw new RangeError('Choose a known unwind status.');
  return {
    eth: 'ETH freed from the loan', debt: 'Debt remaining', cost: 'Swap losses during unwind', net: 'Assets minus debt · after unwind',
  };
}

export function loopLessonMetrics(id, result) {
  if (id === 'build') return [
    ['ETH supplied after one round', loopTokens(result.start.collateralTokens)],
    ['USDC debt', loopMoney(result.start.debt), 'Borrowed cash has been spent'],
    ['Assets minus debt', loopMoney(result.start.netAssets), 'Same original capital, before costs'],
  ];
  if (id === 'stress') return [
    ['Loop · assets minus debt', loopMoney(result.end.netAssets), 'Before any liquidation'],
    ['Hold original ETH', loopMoney(result.holdingValue), 'Same original capital'],
    ['Health factor', healthLabel(result.end.healthFactor)],
  ];
  return [
    ['Debt after this preview', loopMoney(result.unwind.remaining.debt)],
    ['ETH left after repaying', loopTokens(result.unwind.remaining.collateralTokens)],
    ['Swap losses during unwind', loopMoney(result.unwind.costs), 'In addition to swap losses while building'],
  ];
}
