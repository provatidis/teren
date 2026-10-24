import { calculateLoan } from '../models/collateral-loan-v1.js';

// A fresh endpoint comparison on every change, never a simulated price path.
// The fixed lesson isolates debt interest; supply interest must stay at zero.
export function loanConditionFrame(input, mode, value) {
  if (input.days !== 365 || input.future !== input.start || input.supplyAPR !== 0 ||
      input.borrowAPR <= 0 || input.borrow <= 0 || !input.collateralEnabled) {
    throw new RangeError('Use the one-year lending lesson with unchanged prices and zero supply interest.');
  }
  if (!['time', 'price'].includes(mode) || !Number.isFinite(value)) {
    throw new RangeError('Choose a time or price comparison.');
  }
  const min = mode === 'time' ? 0 : input.start / 2;
  const max = mode === 'time' ? input.days : input.start * 1.5;
  if (value < min || value > max) throw new RangeError('Choose a value within the lesson comparison.');
  const question = calculateLoan(input);
  const result = calculateLoan({ ...input,
    days: mode === 'time' ? value : input.days,
    future: mode === 'price' ? value : input.start,
  });
  const reference = mode === 'time' ? question.start : question.end;
  const counted = position => position.collateralValue * input.threshold / 100;
  return {
    mode, result, backing: counted(result.end),
    reference: { backing: counted(reference), debt: reference.debt, health: reference.healthFactor },
    // One dollar scale throughout both comparisons, including their markers.
    maxValue: Math.max(counted(question.end) * 1.5, question.end.debt) * 1.05,
    questionBoundary: question.end.boundaryPrice,
  };
}
