import { LOAN_DEFAULTS, calculateLoan } from './collateral-loan-v1.js';

const cases = {
  supply: { borrow: 0, days: 365, collateralEnabled: false },
  borrow: {},
  conditions: { days: 365, supplyAPR: 0, borrowAPR: 10 },
  respond: { future: 1500, budget: 1000 },
};
const answers = {
  supply: ['earn', 'separate', 'enable'],
  borrow: ['same', 'liability', 'boundary'],
  conditions: ['lower', 'interest', 'backing-faster'],
  respond: ['repay', 'tradeoff', 'none'],
};

export function lendingCase(id) {
  if (!Object.hasOwn(cases, id)) throw new RangeError('Choose a lending lesson.');
  const input = { ...LOAN_DEFAULTS, ...cases[id] };
  return { input, result: calculateLoan(input), prediction: answers[id][0] };
}

export function checkLendingUnderstanding(id, reason, application) {
  if (!Object.hasOwn(answers, id)) throw new RangeError('Choose a lending lesson.');
  const reasoning = reason === answers[id][1];
  const transfer = application === answers[id][2];
  return { reasoning, application: transfer, passed: reasoning && transfer };
}
