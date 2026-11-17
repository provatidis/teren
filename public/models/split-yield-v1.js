// A fully backed, interest-only position, measured in USDC at maturity.
export const SPLIT_MODEL = 'pendle-split-v1';
export const DEPOSIT = 1000;
export const YT_FEE = 0.05;
export const SPLIT_DEFAULTS = Object.freeze({
  ytPrice: 0.02, days: 90, firstApy: 5, secondApy: 15, switchDay: 80, budget: 1000,
});

export function splitInputErrors(input) {
  const errors = {};
  function check(key, min, max, message, integer = false) {
    const value = input?.[key];
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
      errors[key] = message;
    }
  }
  check('ytPrice', 0.0001, 0.9999, 'Enter a price from 0.0001 to 0.9999 USDC per YT.');
  check('days', 1, 730, 'Enter a whole number of days from 1 to 730.', true);
  check('firstApy', 0, 100, 'Enter an annual yield from 0% to 100%.');
  check('secondApy', 0, 100, 'Enter an annual yield from 0% to 100%.');
  check('switchDay', 0, input?.days, 'Choose a day between purchase and maturity.', true);
  check('budget', 1, 10000000, 'Enter a budget from 1 to 10,000,000 USDC.');
  return errors;
}

// Rates are effective annual yields. Keep accrued SY until maturity, so its
// interest is valued at the same exchange rate as the unsplit holding.
export function grossYieldAt(input, day) {
  if (!Number.isInteger(day) || day < 0 || day > input.days) throw new RangeError('Day outside the term.');
  const firstDays = Math.min(day, input.switchDay);
  return Math.expm1((Math.log1p(input.firstApy / 100) * firstDays
    + Math.log1p(input.secondApy / 100) * (day - firstDays)) / 365);
}

export function splitDeposit(input) {
  const { ytPrice, days } = input;
  const retained = 1 - YT_FEE;
  const growth = grossYieldAt(input, days);
  return {
    ptCost: DEPOSIT * (1 - ytPrice), ytCost: DEPOSIT * ytPrice,
    grossInterest: DEPOSIT * growth, netInterest: DEPOSIT * growth * retained,
    // q is the price per YT and g the gross period yield per unit of principal.
    // Recover cost: retained*g = q. Match holding: retained*g/q = 1+g.
    recoverGross: DEPOSIT * ytPrice / retained,
    matchGross: ytPrice < retained ? DEPOSIT * ytPrice / (retained - ytPrice) : null,
  };
}

// Convert growth over the full term to an effective annual percentage.
// A valid short-term return can have an APY too large to represent.
export function annualizedApy(periodGrowth, days) {
  const apy = 100 * Math.expm1(Math.log1p(periodGrowth) * (365 / days));
  return Number.isFinite(apy) ? apy : null;
}

export function splitAtMaturity(input) {
  const [error] = Object.values(splitInputErrors(input));
  if (error) throw new RangeError(error);
  const deposit = splitDeposit(input);
  const ptUnits = input.budget / (1 - input.ytPrice);
  const ytUnits = input.budget / input.ytPrice;
  const fixedReturn = input.ytPrice / (1 - input.ytPrice);
  return {
    ...deposit, ptUnits, ytUnits, ptFinal: ptUnits,
    ytFinal: ytUnits * (deposit.netInterest / DEPOSIT),
    holdFinal: input.budget * (1 + deposit.grossInterest / DEPOSIT),
    ptMatchGross: DEPOSIT * fixedReturn,
    entryImpliedApy: annualizedApy(fixedReturn, input.days),
    scenarioApy: annualizedApy(deposit.grossInterest / DEPOSIT, input.days),
    recoverApy: annualizedApy(deposit.recoverGross / DEPOSIT, input.days),
    matchApy: deposit.matchGross === null ? null : annualizedApy(deposit.matchGross / DEPOSIT, input.days),
  };
}
