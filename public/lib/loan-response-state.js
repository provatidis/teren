import { calculateLoan } from '../models/collateral-loan-v1.js';

// Both alternatives begin with the same loan and fresh outside cash.
// Moving the slider recomputes endpoints; it never accumulates repayments.
export function loanResponseFrame(input, budget) {
  const question = calculateLoan(input);
  if (!input.collateralEnabled || input.borrow <= 0 || input.days !== 0 || question.end.healthFactor <= 1) {
    throw new RangeError('Use an immediate response comparison above the liquidation boundary.');
  }
  const maxBudget = Math.max(input.budget, question.end.debt * 1.2);
  if (!Number.isFinite(budget) || budget < 0 || budget > maxBudget) {
    throw new RangeError('Choose a budget within the lesson comparison.');
  }
  const result = calculateLoan({ ...input, budget });
  const backing = position => position.collateralValue * input.threshold / 100;
  return {
    result, budget, maxBudget,
    reference: { backing: backing(question.end), debt: question.end.debt },
    maxValue: Math.max(backing(question.end) + maxBudget * input.threshold / 100, question.end.debt) * 1.05,
    repay: { ...result.responses.repay, backing: backing(result.responses.repay) },
    add: { ...result.responses.add, backing: backing(result.responses.add) },
  };
}
