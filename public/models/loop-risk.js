import { liquidateBalances, LIQUIDATION_DEFAULTS } from './single-liquidation-v1.js';

export function loopLiquidation(result, assumptions = LIQUIDATION_DEFAULTS) {
  return liquidateBalances(result.end, result.input.future, result.input.threshold, 0, assumptions);
}

export function loopPriceDomain(result, reference = null) {
  const { start, future } = result.input;
  const boundaries = [result.end.boundaryPrice, reference?.end.boundaryPrice]
    .filter(price => price != null && Number.isFinite(price));
  return {
    // Include even a very low boundary; endpoints are valuations, not editable
    // input bounds. Keep a little room on both sides of each liquidation line.
    low: Math.max(0, Math.min(start * .5, future * .8, ...boundaries.map(price => price * .8))),
    high: Math.max(start * 1.5, future * 1.2, ...boundaries.map(price => price * 1.2)),
  };
}
