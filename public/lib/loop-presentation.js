import { loanMoney, healthLabel } from './lending-presentation.js';
import { formatTokenQuantity } from './format.js';

export const loopTokens = value => formatTokenQuantity(value, 6) + ' ETH';
export const loopMoney = value => (value < 0 ? '−' : '') + loanMoney(Math.abs(value));

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
