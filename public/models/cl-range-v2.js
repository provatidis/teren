import * as legacy from './cl-range-v1.js';
import { calculateScenario } from './cp50-v2.js';
import { ECONOMICS_DEFAULTS, ECONOMICS_LIMITS, validateEconomics, withEconomics, breakEvenInput } from './lp-economics.js';

export const MODEL = 'cl-range-v2';
export const DEFAULT_RANGE = Object.freeze({ ...legacy.DEFAULT_RANGE, ...ECONOMICS_DEFAULTS, feeDays: 30 });
export const LIMITS = Object.freeze({ ...legacy.LIMITS, ...ECONOMICS_LIMITS });
export const upgradeRange = input => ({ ...ECONOMICS_DEFAULTS, ...input });
export function validateRange(input) {
  return { ...legacy.validateRange(input), ...validateEconomics(input) };
}
export function calculateRange(input) {
  const scenario = validateRange(input);
  const result = withEconomics(legacy.calculateRange({ ...scenario, fees: 0 }), scenario);
  // This optional 50/50 reference uses its own cash fee input and the same cost
  // budget. Its original token basket differs from the range's holding baseline.
  result.fullRange = calculateScenario({ ...scenario, fees: scenario.fullRangeFees, feeMode: 'cash' });
  return result;
}
export function rangePreset(input, width) {
  const scenario = validateRange(input);
  return validateRange({ ...scenario, ...legacy.rangePreset(scenario, width) });
}
export function futurePricePreset(input, preset) {
  const scenario = validateRange(input);
  return validateRange({ ...scenario, ...legacy.futurePricePreset(scenario, preset) });
}
export const matchHoldingFees = input => validateRange(breakEvenInput(calculateRange(input)));
export function comparisonRanges(input) {
  const scenario = validateRange(input);
  return legacy.comparisonRanges(scenario).map(({ futurePrice }) => calculateRange({ ...scenario, futurePrice }));
}
export const explorerDomain = legacy.explorerDomain;
