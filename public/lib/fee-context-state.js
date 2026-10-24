import { periodPointView } from './period-presentation.js';

export const FEE_WINDOWS = [1, 7, 30, 90];

// A required average over a chosen window, never an estimate of earnings.
export function feeTarget({ investment, breakEvenFees, fees }, days = 30) {
  if (![investment, breakEvenFees, fees].every(Number.isFinite) || investment <= 0 || breakEvenFees < 0 || fees < 0 || !FEE_WINDOWS.includes(days)) {
    throw new Error('Use a valid fee target and time window.');
  }
  return { total: breakEvenFees, percent: breakEvenFees / investment * 100,
    assumed: fees, remaining: Math.max(0, breakEvenFees - fees), daily: breakEvenFees / days, days };
}

// Values refer to the recorded position only. Do not rescale to a model deposit.
export function recordedFeeContext(period) {
  const start = periodPointView(period, 0);
  const end = periodPointView(period, period.points.length - 1);
  return { capital: start.principalUSD, fees: end.feesUSD,
    percent: end.feesUSD / start.principalUSD * 100,
    duration: end.durationSeconds, activePercent: end.secondsInRange / end.durationSeconds * 100,
    range: start.range, start: start.point.snapshot.block.timestamp,
    end: end.point.snapshot.block.timestamp, capturedAt: period.capturedAt };
}
