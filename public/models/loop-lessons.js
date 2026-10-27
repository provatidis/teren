import { LOOP_DEFAULTS, calculateLoop } from './borrowing-loop-v1.js';

const cases = {
  build: { swapCost: 0, supplyAPR: 0, borrowAPR: 0 },
  stress: { rounds: 3, swapCost: 0, supplyAPR: 0, borrowAPR: 0, future: 1500 },
  unwind: { rounds: 3 },
};
const answers = {
  build: ['same', 'debt', 'supplied'],
  stress: ['loop', 'exposure', 'backing-not-profit'],
  unwind: ['stages', 'backing', 'debt-remains'],
};

export function loopCase(id) {
  if (!Object.hasOwn(cases, id)) throw new RangeError('Choose a borrowing-loop lesson.');
  const input = { ...LOOP_DEFAULTS, ...cases[id] };
  return { input, result: calculateLoop(input), prediction: answers[id][0] };
}

export function checkLoopUnderstanding(id, reason, application) {
  if (!Object.hasOwn(answers, id)) throw new RangeError('Choose a borrowing-loop lesson.');
  const reasoning = reason === answers[id][1], transfer = application === answers[id][2];
  return { reasoning, application: transfer, passed: reasoning && transfer };
}

// Compare one feasible sale in the final repayment pass of this same loan.
// Construction, accrued debt, earlier actions and ETH price stay unchanged.
export function unwindSaleCostComparison(result) {
  const withdrawal = result.unwind.actions.findLast(action => action.action === 'withdraw');
  if (result.unwind.status !== 'complete' || !withdrawal) {
    throw new RangeError('The sale comparison needs a completed unwind with a withdrawal.');
  }
  const debt = withdrawal.position.debt, price = result.input.future;
  const soldETH = debt / price, costPercent = result.input.swapCost;
  if (soldETH > withdrawal.position.walletETH + Number.EPSILON * withdrawal.position.walletETH * 32) {
    throw new RangeError('The sale comparison needs enough ETH already withdrawn.');
  }
  const proceedsWithoutCost = debt;
  const proceedsWithCost = proceedsWithoutCost * (1 - costPercent / 100);
  return { debt, soldETH, price, costPercent, proceedsWithoutCost, proceedsWithCost,
    remainingDebt: debt - proceedsWithCost };
}
