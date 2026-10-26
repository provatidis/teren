import { LOOP_DEFAULTS, calculateLoop } from './borrowing-loop-v1.js';

const cases = {
  build: { swapCost: 0, supplyAPR: 0, borrowAPR: 0 },
  stress: { rounds: 3, swapCost: 0, supplyAPR: 0, borrowAPR: 0, future: 1500 },
  unwind: { rounds: 3 },
};
const answers = {
  build: ['same', 'debt', 'supplied'],
  stress: ['loop', 'exposure', 'backing-not-profit'],
  unwind: ['stages', 'backing', 'repay-wallet'],
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
