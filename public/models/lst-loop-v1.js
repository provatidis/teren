import { lstBalance as balance, finishLST } from './lst-accounting.js';

// Hypothetical wstETH collateral / WETH debt. Quantities and costs use WETH.
// The conversion rate is stETH per wstETH; the model's base case values stETH at 1 WETH.
export const LST_MODEL = 'lst-loop-v1';
export const LST_DEFAULTS = Object.freeze({
  collateral: 5, rate: 1.2, rounds: 3, borrowPercent: 75, maxLTV: 90, threshold: 94,
  swapCost: 0.1, days: 365, stakingAPY: 3, lendingAPY: 0, borrowAPR: 2,
  rateChange: false, laterAPR: 8, changeDay: 90, discount: 0, oracleMode: 'rate',
  ethUSD: 2000, exitCost: 0.3, flashFee: 0.05, gas: 0.003, exitAvailable: true,
  repayPercent: 50, bonus: 3,
});
export const LST_LIMITS = Object.freeze({
  collateral: [0.001, 1000000], rate: [0.01, 100], rounds: [0, 8],
  borrowPercent: [1, 95], maxLTV: [1, 98], threshold: [1, 99], swapCost: [0, 5],
  days: [0, 1825], stakingAPY: [-50, 50], lendingAPY: [0, 50], borrowAPR: [0, 100],
  laterAPR: [0, 100], changeDay: [0, 1825], discount: [0, 50], ethUSD: [0.01, 10000000],
  exitCost: [0, 20], flashFee: [0, 5], gas: [0, 100], repayPercent: [1, 100], bonus: [0, 30],
});
export const LST_KEYS = Object.freeze([...Object.keys(LST_LIMITS), 'rateChange', 'oracleMode', 'exitAvailable']);

export function validateLST(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(LST_LIMITS)) {
    if (typeof input?.[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < min || input[key] > max) {
      errors[key] = `Enter a number from ${min} to ${max}.`;
    }
  }
  if (!errors.rounds && !Number.isInteger(input.rounds)) errors.rounds = 'Choose a whole number of rounds from 0 to 8.';
  if (!errors.maxLTV && !errors.threshold && input.maxLTV >= input.threshold) errors.threshold = 'The liquidation threshold must be above maximum LTV.';
  if (!errors.borrowPercent && !errors.maxLTV && input.borrowPercent > input.maxLTV) errors.borrowPercent = 'Keep the borrowing fraction at or below maximum LTV.';
  for (const key of ['rateChange', 'exitAvailable']) if (typeof input?.[key] !== 'boolean') errors[key] = 'Choose an option.';
  if (!['market', 'rate'].includes(input?.oracleMode)) errors.oracleMode = 'Choose a supported oracle assumption.';
  return errors;
}

export function calculateLST(input) {
  const errors = validateLST(input);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors)[0]);
  let collateral = input.collateral, latestSupply = collateral, debt = 0, buildCosts = 0;
  const state = (cash = 0, tokens = 0) => balance(collateral, debt, input.rate, input.rate, input.threshold, cash, tokens);
  const initial = state(), steps = [{ action: 'start', round: 0, position: initial }];
  for (let round = 1; round <= input.rounds; round++) {
    const borrowed = latestSupply * input.rate * input.borrowPercent / 100;
    debt += borrowed;
    steps.push({ action: 'borrow', round, amount: borrowed, position: state(borrowed) });
    const cost = borrowed * input.swapCost / 100;
    const purchased = (borrowed - cost) / input.rate;
    buildCosts += cost;
    steps.push({ action: 'buy', round, amount: purchased, cost, position: state(0, purchased) });
    collateral += purchased;
    latestSupply = purchased;
    steps.push({ action: 'supply', round, amount: purchased, position: state() });
  }
  return finishLST(input, { initial, steps, start: state(), buildCosts }, LST_MODEL);
}
