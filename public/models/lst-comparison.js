import { calculateLST, validateLST } from './lst-loop-v2.js';

// A comparison changes only the target token quantity. The original tokens,
// rates, time, oracle, costs and exit destination remain shared.
export function validateLSTComparison(input, comparison = null) {
  if (comparison == null) return null;
  if (input?.buildMode !== 'target') throw new RangeError('Target comparisons require a target-based LST setup.');
  if (typeof comparison !== 'object' || Array.isArray(comparison)
    || Object.keys(comparison).length !== 1 || !Object.hasOwn(comparison, 'targetExposure')
    || typeof comparison.targetExposure !== 'number' || !Number.isFinite(comparison.targetExposure)
    || comparison.targetExposure < 1 || comparison.targetExposure > 50) {
    throw new RangeError('Use a comparison target from 1× to 50×.');
  }
  return { targetExposure: comparison.targetExposure };
}

export function lstComparisonOutcome(result) {
  const { input, end, exit } = result;
  const retained = input.exitMode === 'wsteth';
  const complete = exit.status === 'complete';
  const holding = retained ? input.collateral : result.holdingAfterExit >= 0 ? result.holdingAfterExit : null;
  const value = complete ? retained ? exit.retained : exit.cash : null;
  return {
    vsHolding: result.vsHolding,
    healthFactor: end.healthFactor,
    firstRateBoundary: result.firstRateBoundary,
    counterfactual: result.firstRateBoundary !== null || ['eligible', 'boundary'].includes(end.status),
    headroom: {
      // This measures an additional oracle-price fall at fixed balances. It is
      // not a market-discount allowance when the oracle tracks conversion rate.
      oraclePriceDropPercent: end.healthFactor === null ? null : end.status === 'above' ? (1 - 1 / end.healthFactor) * 100 : 0,
      status: end.status,
      marketDiscountAffectsHealth: input.oracleMode === 'market',
    },
    exit: {
      status: exit.status,
      unit: retained ? 'wstETH' : 'WETH',
      value,
      holding,
      difference: value === null || holding === null ? null : value - holding,
    },
  };
}

export function calculateLSTComparison(input, comparison = null) {
  const clean = validateLSTComparison(input, comparison);
  const primary = calculateLST(input);
  const result = { primary, reference: null, comparison: clean, status: 'none', reason: null,
    primaryOutcome: lstComparisonOutcome(primary), referenceOutcome: null };
  if (!clean) return result;
  const referenceInput = { ...input, targetExposure: clean.targetExposure };
  const errors = validateLST(referenceInput);
  if (Object.keys(errors).length) return { ...result, status: 'unavailable', reason: Object.values(errors)[0] };
  const reference = calculateLST(referenceInput);
  return { ...result, reference, status: 'ready', referenceOutcome: lstComparisonOutcome(reference) };
}
