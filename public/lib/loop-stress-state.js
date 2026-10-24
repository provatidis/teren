import { calculateLoop } from '../models/borrowing-loop-v1.js';

export const LOOP_STRESS_TIME = Object.freeze({ days: 365, supplyAPR: 0, borrowAPR: 10, interestMode: 'compound' });

// Price and time are separate endpoint examples, each rebuilt from the same
// original capital. Exploring never executes an unwind or a liquidation.
export function loopStressFrame(input, mode, value) {
  const question = calculateLoop(input);
  if (input.rounds !== 3 || input.days !== 0 || input.swapCost !== 0 || input.supplyAPR !== 0 || input.borrowAPR !== 0) {
    throw new RangeError('Use the three-round lesson without costs or accrued interest.');
  }
  if (!['price', 'time'].includes(mode) || !Number.isFinite(value)) {
    throw new RangeError('Choose a price or time comparison.');
  }
  const min = mode === 'price' ? input.start / 2 : 0;
  const max = mode === 'price' ? input.start * 1.5 : LOOP_STRESS_TIME.days;
  if (value < min || value > max) throw new RangeError('Choose a value within the lesson comparison.');
  const result = calculateLoop(mode === 'price' ? { ...input, future: value }
    : { ...input, ...LOOP_STRESS_TIME, future: input.start, days: value });
  return {
    mode, result,
    holding: { tokens: input.collateral, value: result.holdingValue, change: result.holdingValue - result.ownCapital },
    loop: { tokens: result.end.collateralTokens, value: result.end.netAssets, change: result.end.netAssets - result.ownCapital },
    // Every gain/loss bar uses the same zero and dollar scale across both modes.
    maxChange: Math.max(question.start.collateralValue / 2, question.ownCapital / 2,
      question.start.debt * Math.expm1(LOOP_STRESS_TIME.borrowAPR / 100)) * 1.05,
  };
}
