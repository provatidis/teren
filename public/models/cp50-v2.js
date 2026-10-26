import * as legacy from './cp50-v1.js';
import { ECONOMICS_DEFAULTS, ECONOMICS_LIMITS, validateEconomics, withEconomics, breakEvenInput } from './lp-economics.js';

export const MODEL = 'cp50-v2';
export const DEFAULT_SCENARIO = Object.freeze({ ...legacy.DEFAULT_SCENARIO, ...ECONOMICS_DEFAULTS, feeDays: 30 });
export const LIMITS = Object.freeze({ ...legacy.LIMITS, ...ECONOMICS_LIMITS });
export const upgradeScenario = input => ({ ...ECONOMICS_DEFAULTS, ...input });
export function validateScenario(input) {
  return { ...legacy.validateScenario(input), ...validateEconomics(input) };
}
export function calculateScenario(input) {
  const scenario = validateScenario(input);
  return withEconomics(legacy.calculateScenario({ ...scenario, fees: 0 }), scenario);
}
export function comparisonScenarios(input) {
  const scenario = validateScenario(input);
  return legacy.comparisonScenarios(scenario).map(({ futurePrice }) => calculateScenario({ ...scenario, futurePrice }));
}
export function experimentScenario(input, experiment) {
  const scenario = validateScenario(input);
  if (experiment === 'break-even') return validateScenario(breakEvenInput(calculateScenario(scenario)));
  const multiple = { double: 2, half: 0.5 }[experiment];
  if (!multiple) throw new Error('Choose a supported experiment.');
  return validateScenario({ ...scenario, futurePrice: scenario.initialPrice * multiple, fees: 0, feeAPR: 0 });
}
