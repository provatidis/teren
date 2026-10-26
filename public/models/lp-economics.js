// Hypothetical USD cash flows. APR is an assumed period average on starting
// deployed capital, including any time outside the range; it is not a forecast.
export const ECONOMICS_DEFAULTS = Object.freeze({
  feeMode: 'cash', feeAPR: 0, feeDays: 0,
  openingCost: 0, collectionCost: 0, closingCost: 0,
});

export const ECONOMICS_LIMITS = Object.freeze({
  feeAPR: { min: 0, max: 10000, label: 'Assumed fee APR', unit: '%' },
  feeDays: { min: 0, max: 3650, label: 'Duration', unit: 'days' },
  openingCost: { min: 0, max: 1e9, label: 'Opening cost' },
  collectionCost: { min: 0, max: 1e9, label: 'Collection cost' },
  closingCost: { min: 0, max: 1e9, label: 'Closing cost' },
});

export function validateEconomics(input) {
  if (!['cash', 'apr'].includes(input?.feeMode)) throw new Error('Choose a cash fee amount or an assumed fee APR.');
  const result = { feeMode: input.feeMode };
  for (const [key, { min, max, label, unit }] of Object.entries(ECONOMICS_LIMITS)) {
    const value = input[key];
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new Error(`${label} must be between ${min} and ${max}${unit ? ' ' + unit : ' USD'}.`);
    }
    result[key] = value;
  }
  if (result.feeMode === 'apr' && result.feeDays <= 0) throw new Error('Enter a duration greater than zero to use fee APR.');
  return result;
}

export function withEconomics(principal, input) {
  const economics = validateEconomics(input);
  const feeIncome = economics.feeMode === 'apr'
    ? input.investment * economics.feeAPR / 100 * economics.feeDays / 365
    : input.fees;
  const costs = economics.openingCost + economics.collectionCost + economics.closingCost;
  const lpGrossValue = principal.lpBeforeFees + feeIncome;
  const lpValue = lpGrossValue - costs;
  const difference = lpValue - principal.holdValue;
  const breakEvenFees = Math.max(0, principal.holdValue - principal.lpBeforeFees + costs);
  return {
    ...principal, ...input, feeIncome, costs, lpGrossValue, lpValue, difference,
    differencePercent: difference / principal.holdValue * 100,
    lpReturn: (lpValue / input.investment - 1) * 100,
    breakEvenFees,
    breakEvenAPR: economics.feeDays > 0 ? breakEvenFees / input.investment * 365 / economics.feeDays * 100 : null,
  };
}

export function breakEvenInput(result) {
  return result.feeMode === 'apr'
    ? { ...result, feeAPR: result.breakEvenAPR }
    : { ...result, fees: result.breakEvenFees };
}
