// One hypothetical event on already accrued balances. This does not replay a
// price path or implement a protocol's close-factor, bonus or shortfall rules.
export const LIQUIDATION_MODEL = 'single-liquidation-v1';
export const LIQUIDATION_DEFAULTS = Object.freeze({ repayPercent: 50, bonusPercent: 5 });
export const LIQUIDATION_LIMITS = Object.freeze({ repayPercent: [1, 100], bonusPercent: [0, 30] });

export function validateLiquidation(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(LIQUIDATION_LIMITS)) {
    if (!Number.isFinite(input?.[key]) || input[key] < min || input[key] > max) {
      errors[key] = 'Enter a number from ' + min + ' to ' + max + '.';
    }
  }
  return errors;
}

// `end` comes from the validated loan/loop model. Cash is held outside collateral:
// the single loan keeps the borrowed cash; a completed loop has spent it.
export function liquidateBalances(end, price, threshold, cash, assumptions = LIQUIDATION_DEFAULTS) {
  if (Object.keys(validateLiquidation(assumptions)).length) throw new RangeError('Use valid liquidation assumptions.');
  if (end.status !== 'eligible') return { model: LIQUIDATION_MODEL, status: 'ineligible' };
  const bonus = assumptions.bonusPercent / 100;
  const requested = end.debt * (assumptions.repayPercent / 100);
  const capacity = end.collateralValue / (1 + bonus);
  const exhausted = capacity <= requested;
  const repaid = Math.min(end.debt, requested, capacity);
  // Avoid a tiny negative floating-point tail when all collateral is removed.
  const removedTokens = exhausted ? end.collateralTokens : Math.min(end.collateralTokens, repaid * (1 + bonus) / price);
  const remainingTokens = exhausted ? 0 : end.collateralTokens - removedTokens;
  const remainingDebt = end.debt - repaid;
  const remainingValue = remainingTokens * price;
  const penalty = repaid * bonus;
  return {
    model: LIQUIDATION_MODEL, status: 'executed', assumptions: { ...assumptions },
    requested, repaid, removedTokens, removedValue: repaid + penalty, penalty,
    remainingTokens, remainingDebt, exhausted,
    remainingHealth: remainingDebt === 0 ? null : remainingValue * threshold / 100 / remainingDebt,
    netAssets: remainingValue + cash - remainingDebt,
    beforeNetAssets: end.collateralValue + cash - end.debt,
  };
}
