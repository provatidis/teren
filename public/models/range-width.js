import { calculateRange } from './cl-range-v1.js';

export const WIDTH_MODEL = 'cl-width-v1';
export const DEFAULT_WIDTHS = Object.freeze({
  investment: 5000, initialPrice: 2000, futurePrice: 2400, widthA: 20, widthB: 100,
});
export const WIDTH_LIMITS = Object.freeze({
  investment: { min: 1, max: 1e9, label: 'Capital per position' },
  initialPrice: { min: 1, max: 1e6, label: 'Starting ETH price' },
  futurePrice: { min: .01, max: 1e7, label: 'Comparison ETH price' },
  widthA: { min: 1, max: 400, label: 'Range A width' },
  widthB: { min: 1, max: 400, label: 'Range B width' },
});

export function validateWidths(input) {
  const result = {};
  for (const [key, { min, max, label }] of Object.entries(WIDTH_LIMITS)) {
    if (!Number.isFinite(input?.[key]) || input[key] < min || input[key] > max) {
      throw new Error(label + ' must be between ' + min + ' and ' + max + '.');
    }
    result[key] = input[key];
  }
  return result;
}

// Width is (upper − lower) / starting price, expressed as a percentage.
// Reciprocal bounds keep lower × upper = starting price², so the existing
// continuous range model starts 50/50 by value for every supported width.
export function centeredBounds(initialPrice, width) {
  if (!Number.isFinite(initialPrice) || initialPrice <= 0 || !Number.isFinite(width) || width <= 0) {
    throw new Error('A positive starting price and width are required.');
  }
  const span = width / 100;
  const factor = (Math.hypot(span, 2) + span) / 2;
  return { lowerPrice: initialPrice / factor, upperPrice: initialPrice * factor };
}

export function calculateWidthComparison(input) {
  const scenario = validateWidths(input);
  const { investment, initialPrice, futurePrice } = scenario;
  const initial = { eth: investment / (2 * initialPrice), usdc: investment / 2 };
  const holdValue = initial.eth * futurePrice + initial.usdc;
  const ranges = ['a', 'b'].map(id => {
    const width = scenario[id === 'a' ? 'widthA' : 'widthB'];
    const result = calculateRange({ investment, initialPrice, futurePrice,
      ...centeredBounds(initialPrice, width), fees: 0, fullRangeFees: 0 });
    // Use the common basket, rather than differences between floating-point
    // reconstructions of mathematically identical 50/50 starting balances.
    const principal = futurePrice === initialPrice ? investment : result.lpBeforeFees;
    const difference = principal - holdValue;
    return { ...result, id, width, initial, holdValue, lpBeforeFees: principal, lpValue: principal,
      difference, breakEvenFees: Math.max(0, -difference),
      lpReturn: 100 * (principal / investment - 1),
      gapPercent: 100 * difference / investment };
  });
  return { ...scenario, initial, holdValue, ranges };
}

export function widthPriceDomain(input) {
  const result = calculateWidthComparison(input);
  return {
    low: Math.max(WIDTH_LIMITS.futurePrice.min, Math.min(result.initialPrice * .5, result.futurePrice,
      ...result.ranges.map(range => range.lowerPrice * .9))),
    high: Math.min(WIDTH_LIMITS.futurePrice.max, Math.max(result.initialPrice * 1.5, result.futurePrice,
      ...result.ranges.map(range => range.upperPrice * 1.1))),
  };
}
