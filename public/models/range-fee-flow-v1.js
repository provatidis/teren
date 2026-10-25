import { calculateWidthComparison, WIDTH_LIMITS } from './range-width.js';

export const FEE_FLOW_MODEL = 'cl-width-fees-v1';
export const MAX_FEE_BATCHES = 8;
export const FEE_TIERS = Object.freeze([100, 500, 3000, 10000]);
export const PROTOCOL_DIVISORS = Object.freeze([0, 4, 5, 6, 7, 8, 9, 10]);
export const DEFAULT_FEE_FLOW = Object.freeze({
  enabled: false, volume: 1000000, competition: 1000000,
  feeTier: 3000, protocolDivisor: 6, batches: Object.freeze([]),
});

function number(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(label + ' must be between ' + min + ' and ' + max + '.');
  }
  return value;
}

export function validateFeeAssumptions(input) {
  if (!FEE_TIERS.includes(input?.feeTier) || !PROTOCOL_DIVISORS.includes(input?.protocolDivisor)) {
    throw new Error('Choose a supported trader fee and protocol share.');
  }
  return {
    volume: number(input.volume, 0, 1e9, 'Trading volume'),
    competition: number(input.competition, 1, 1e12, 'Other LPs’ starting capital'),
    feeTier: input.feeTier, protocolDivisor: input.protocolDivisor,
  };
}

export function validateFeeBatch(input) {
  return { price: number(input?.price, WIDTH_LIMITS.futurePrice.min,
    WIDTH_LIMITS.futurePrice.max, 'Batch ETH price'), ...validateFeeAssumptions(input) };
}

export function validateFeeFlow(input) {
  if (typeof input?.enabled !== 'boolean' || !Array.isArray(input.batches)
    || input.batches.length > MAX_FEE_BATCHES) throw new Error('This fee-flow experiment is not supported.');
  return { enabled: input.enabled, ...validateFeeAssumptions(input), batches: input.batches.map(validateFeeBatch) };
}

// Fixed-price allocation approximation, not a swap/path engine. Half the gross
// input notional is ETH, half USDC. Deduct the protocol share before allocating
// fees pro rata. A and B are alternatives: each competes with the same other LPs,
// never with one another. Competitors use continuous full-range v3-style liquidity.
export function allocateFeeBatch(widthInput, batchInput) {
  const comparison = calculateWidthComparison(widthInput);
  const batch = validateFeeBatch(batchInput);
  const traderFees = batch.volume * batch.feeTier / 1e6;
  const protocolFees = batch.protocolDivisor ? traderFees / batch.protocolDivisor : 0;
  const lpFees = traderFees - protocolFees;
  const otherLiquidity = batch.competition / (2 * Math.sqrt(comparison.initialPrice));
  const ranges = comparison.ranges.map(range => {
    const edge = batch.price === range.lowerPrice || batch.price === range.upperPrice;
    const active = batch.price > range.lowerPrice && batch.price < range.upperPrice;
    const share = active ? range.liquidity / (range.liquidity + otherLiquidity) : 0;
    const value = lpFees * share;
    return { id: range.id, active, edge, share, value, others: lpFees - value,
      tokens: { eth: value / (2 * batch.price), usdc: value / 2 } };
  });
  return { ...batch, traderFees, protocolFees, lpFees, otherLiquidity, ranges,
    atEdge: ranges.some(range => range.edge) };
}

export function calculateFeeFlow(widthInput, flowInput) {
  const comparison = calculateWidthComparison(widthInput);
  const flow = validateFeeFlow(flowInput);
  const batches = flow.batches.map(batch => allocateFeeBatch(widthInput, batch));
  // A batch exactly on a range edge needs directional swap reconstruction.
  // Do not assign it zero fees and silently present that as an established result.
  if (batches.some(batch => batch.atEdge)) {
    throw new Error('A saved batch is on a range edge. Adjust the width slightly or undo that batch.');
  }
  const quote = allocateFeeBatch(widthInput, { price: comparison.futurePrice, ...flow });
  const ranges = comparison.ranges.map((range, index) => {
    const tokens = batches.reduce((sum, batch) => ({
      eth: sum.eth + batch.ranges[index].tokens.eth,
      usdc: sum.usdc + batch.ranges[index].tokens.usdc,
    }), { eth: 0, usdc: 0 });
    const feeValue = tokens.eth * comparison.futurePrice + tokens.usdc;
    const total = range.lpBeforeFees + feeValue;
    return { ...range, feeTokens: tokens, feeValue, total,
      netVsHolding: total - comparison.holdValue,
      dollarChange: total - comparison.investment,
      remainingHurdle: Math.max(0, comparison.holdValue - total) };
  });
  return { comparison, flow, quote, batches, ranges };
}
