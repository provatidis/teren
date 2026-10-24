import { calculateScenario } from '../models/cp50-v1.js';

// These bounds match the essentials lesson controls. Every frame is a fresh
// endpoint; hypothetical cash fees never alter the principal token balances.
export function comparisonSceneState(input, price, fees = 0) {
  if (price < input.initialPrice / 2 || price > input.initialPrice * 2 || fees > input.investment / 2) {
    throw new Error('Comparison exploration must stay within the lesson bounds.');
  }
  const result = calculateScenario({ ...input, futurePrice: price, fees });
  const compare = value => Math.abs(value) < 1e-8 ? 'equal' : value > 0 ? 'above' : 'below';
  return {
    result,
    // At most sqrt(2) × capital in principal plus 0.5 × capital in fees.
    // A fixed scale lets a moving bar represent a change in value faithfully.
    ceiling: input.investment * 2,
    fromStart: result.lpValue - input.investment,
    versusStart: compare(result.lpValue - input.investment),
    versusHolding: compare(result.difference),
  };
}
