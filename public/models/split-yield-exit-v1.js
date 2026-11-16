import { YT_FEE, grossYieldAt, splitInputErrors } from './split-yield-v1.js';

export function defaultYieldExit(days) {
  return { exitDay: Math.floor(days / 2), exitApy: 10 };
}

export function yieldExitErrors(input, exit) {
  const errors = {};
  if (!Number.isInteger(exit?.exitDay) || exit.exitDay < 0 || exit.exitDay > input?.days) {
    errors.exitDay = 'Choose a whole day between purchase and maturity.';
  }
  if (!Number.isFinite(exit?.exitApy) || exit.exitApy < 0) {
    errors.exitApy = 'Enter an implied annual yield of 0% or more.';
  }
  return errors;
}

// A matched PT and YT can redeem for one accounting unit before expiry.
// Implied APY discounts the PT over the *remaining* term. The residual is
// the buyer's future YT claim; interest already earned belongs to the seller.
function marks(logDiscount) {
  return { ptPrice: Math.exp(-logDiscount), ytPrice: logDiscount === 0 ? 0 : -Math.expm1(-logDiscount) };
}

export function splitAtExit(input, exit) {
  const [error] = Object.values({ ...splitInputErrors(input), ...yieldExitErrors(input, exit) });
  if (error) throw new RangeError(error);
  const { ytPrice: entryYtPrice, days, budget } = input;
  const { exitDay, exitApy } = exit;
  const remainingDays = days - exitDay;
  const entryDiscount = -Math.log1p(-entryYtPrice);
  // Work directly from the purchase discount, even when annualizing a
  // deep discount over one day would exceed the largest representable rate.
  const unchanged = exitDay === 0
    ? { ptPrice: 1 - entryYtPrice, ytPrice: entryYtPrice }
    : marks(entryDiscount * (remainingDays / days));
  const { ptPrice, ytPrice } = marks(Math.log1p(exitApy / 100) * (remainingDays / 365));
  const annualized = Math.expm1(entryDiscount * (365 / days)) * 100;
  const ptUnits = budget / (1 - entryYtPrice);
  const ytUnits = budget / entryYtPrice;
  const growth = grossYieldAt(input, exitDay);
  // Accrued SY is retained and valued in the accounting asset on the sale day.
  const ytInterest = ytUnits * growth * (1 - YT_FEE);
  const ytSale = ytUnits * ytPrice;
  return {
    remainingDays, entryImpliedApy: Number.isFinite(annualized) ? annualized : null,
    ptPrice, ytPrice, ptUnits, ytUnits,
    ptSale: ptUnits * ptPrice, ytSale, ytInterest, ytTotal: ytSale + ytInterest,
    holdValue: budget * (1 + growth),
    unchangedPtPrice: unchanged.ptPrice, unchangedYtPrice: unchanged.ytPrice,
    unchangedPtSale: ptUnits * unchanged.ptPrice, unchangedYtTotal: ytUnits * unchanged.ytPrice + ytInterest,
  };
}
