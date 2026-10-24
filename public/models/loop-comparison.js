import { calculateLoop, LOOP_LIMITS } from './borrowing-loop-v1.js';

export function validReferenceRounds(rounds) {
  return Number.isInteger(rounds) && rounds >= LOOP_LIMITS.rounds[0] && rounds <= LOOP_LIMITS.rounds[1];
}

export function validReferenceBorrowPercent(value, maxLTV = 95) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= maxLTV;
}

// Change the construction choices; capital and market conditions stay shared.
export function calculateLoopComparison(input, referenceRounds, referenceBorrowPercent = input.borrowPercent) {
  if (!validReferenceRounds(referenceRounds)) throw new RangeError('Choose a reference from 0 to 5 rounds.');
  if (!validReferenceBorrowPercent(referenceBorrowPercent, input.maxLTV)) throw new RangeError('Use a reference borrowing fraction from 1% to maximum LTV.');
  return {
    current: calculateLoop(input),
    reference: calculateLoop({ ...input, rounds: referenceRounds, borrowPercent: referenceBorrowPercent }),
  };
}
