import { calculateLoop, LOOP_LIMITS } from './borrowing-loop-v1.js';

export function validReferenceRounds(rounds) {
  return Number.isInteger(rounds) && rounds >= LOOP_LIMITS.rounds[0] && rounds <= LOOP_LIMITS.rounds[1];
}

// Compare only round count. Capital, prices, time, rates and costs must be shared.
export function calculateLoopComparison(input, referenceRounds) {
  if (!validReferenceRounds(referenceRounds)) throw new RangeError('Choose a reference from 0 to 5 rounds.');
  return {
    current: calculateLoop(input),
    reference: calculateLoop({ ...input, rounds: referenceRounds }),
  };
}
