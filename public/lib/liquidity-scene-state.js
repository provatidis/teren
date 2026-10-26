import { calculateScenario } from '../models/cp50-v1.js';
import { calculateRange } from '../models/cl-range-v1.js';
import { tokenBalanceNarration } from './lesson-narration.js';

// Every frame is a fresh endpoint from the same starting position, not a replay
// of the slider's movements. Display helpers must not invent trades or earnings.
export function tokenSceneState(input, price) {
  const result = calculateScenario({ ...input, futurePrice: price, fees: 0 });
  const narration = tokenBalanceNarration({ setup: result, result });
  return { result, ...narration };
}

export function rangeSceneState(narrow, wide, price) {
  return [narrow, wide].map(input => rangePositionState(input, price));
}

export function rangePositionState(input, price) {
  const result = calculateRange({ ...input, futurePrice: price, fees: 0, fullRangeFees: 0 });
  const status = result.state === 'inside' ? 'Inside range'
    : result.state.endsWith('edge') ? 'At boundary' : 'Outside range';
  const tokens = result.pooled.eth === 0 ? 'USDC only'
    : result.pooled.usdc === 0 ? 'ETH only' : 'ETH + USDC';
  return { result, status, tokens };
}
