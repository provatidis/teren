import { calculateScenario } from './cp50-v1.js';

// A separate hypothetical task. It never changes the worked question or its link.
export function challengeSetup(input, value) {
  const price = value?.price, fees = value?.fees;
  if (!Number.isFinite(price) || price < input.initialPrice / 2 || price > input.initialPrice * 2
    || !Number.isFinite(fees) || fees < 0 || fees > input.investment / 2) return null;
  return { price, fees };
}

export function checkLiquidityChallenge(input, value) {
  const setup = challengeSetup(input, value);
  if (!setup) return { valid: false, matchesHolding: false, belowStart: false, passed: false };
  const result = calculateScenario({ ...input, futurePrice: setup.price, fees: setup.fees });
  const matchesHolding = Math.abs(result.difference) < 1e-8;
  const belowStart = result.holdValue < input.investment - .01 && result.lpValue < input.investment - .01;
  return { valid: true, matchesHolding, belowStart, passed: matchesHolding && belowStart, result };
}

export function matchChallengeHolding(input, price) {
  const result = calculateScenario({ ...input, futurePrice: price, fees: 0 });
  return { price, fees: result.breakEvenFees };
}
