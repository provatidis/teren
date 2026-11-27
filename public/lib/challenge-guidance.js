import { checkLiquidityChallenge } from '../models/liquidity-challenge.js';
import { usd, signedUSD } from './format.js';

// Amounts below half a cent would print as $0.00 beside a claim that the values differ.
const small = value => Math.abs(value) < .005;
const signed = value => small(value) ? usd(0) : signedUSD(value);

// Lesson 7's two goals, each with the amount that decides it. Both are below
// the start only when the higher of the two is, so that is the amount shown:
// holding's change alone can read as met while fees keep the claim above.
export function challengeGoals(input, value) {
  const check = checkLiquidityChallenge(input, value), r = check.result;
  const higher = Math.max(r.holdValue, r.lpValue) - input.investment;
  return {
    matches: { met: check.matchesHolding, amount: signed(r.difference) },
    below: { met: check.belowStart, amount: signed(higher) },
  };
}

// After Check: say which condition failed and which control changes it. A
// price below the start puts holding below it; the fees then decide where the
// claim sits, so a claim above the start is fixed with the fees, not the price.
export function challengeFeedback(input, value) {
  const check = checkLiquidityChallenge(input, value), start = input.investment;
  if (check.passed) return { state: 'match', copy: 'Your claim and holding are worth the same amount. Both have lost dollars.' };
  const r = check.result, hold = r.holdValue - start, claim = r.lpValue - start;
  if (hold >= -.01) return { state: 'different', copy: 'At this price holding is ' + (hold > .01 ? usd(hold) + ' above' : 'at')
    + ' your start. Choose a lower ETH price.' };
  if (claim >= -.01) return { state: 'different', copy: 'Holding is already ' + usd(-hold) + ' below your start. Your fees put your claim '
    + (claim > .01 ? usd(claim) + ' above it' : 'at your start') + '. Lower the fees until your claim meets holding.' };
  return { state: 'different', copy: 'Both are below your start. ' + (r.difference < 0 ? 'Raise' : 'Lower') + ' the fees until your claim meets holding.' };
}
