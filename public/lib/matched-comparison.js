import { periodPointView } from './period-presentation.js';

export function collectionDayView(record, day) {
  if (!Number.isInteger(day) || day < 0 || day > 7) throw new Error('Choose a recorded day.');
  const index = record.points.findIndex(point => point.snapshot.block.number === record.dailyBlocks[day]);
  const view = periodPointView(record, index);
  const proof = record.validation.checkpoints[index];
  const earned0 = BigInt(proof.earnedRaw[0]), earned1 = BigInt(proof.earnedRaw[1]);
  const feesUSD = Number(earned0) / 1e6 + Number(earned1) / 1e18 * view.price;
  const lpUSD = view.principalUSD + feesUSD;
  return { ...view, earned0, earned1, feesUSD, lpUSD, gapUSD: lpUSD - view.holdingUSD,
    lpChangeUSD: lpUSD - view.startingUSD, feePercent: 100 * feesUSD / view.startingUSD,
    gapPercent: 100 * (lpUSD - view.holdingUSD) / view.startingUSD,
    changePercent: 100 * (lpUSD - view.startingUSD) / view.startingUSD,
    collectionCount: record.collections.filter(event => BigInt(event.blockNumber) <= BigInt(record.dailyBlocks[day])).length,
    collectedRaw: proof.collectedRaw, collectionRoundingLossRaw: proof.collectionRoundingLossRaw };
}

export function collectionDayInterval(record, day) {
  const end = collectionDayView(record, day), start = collectionDayView(record, Math.max(0, day - 1));
  const secondsInRange = end.secondsInRange - start.secondsInRange;
  const durationSeconds = end.durationSeconds - start.durationSeconds;
  const earned0 = end.earned0 - start.earned0, earned1 = end.earned1 - start.earned1;
  return { secondsInRange, durationSeconds, earned0, earned1,
    activePercent: durationSeconds ? 100 * secondsInRange / durationSeconds : 0,
    feesUSD: Number(earned0) / 1e6 + Number(earned1) / 1e18 * end.price };
}

export function matchedChartSeries(comparison) {
  return comparison.records.map(({ group, record }) => ({ group,
    points: Array.from({ length: 8 }, (_, day) => collectionDayView(record, day)) }));
}
