import { validateCollectionHistory } from './collection-history.js';

export function validateMatchedComparison(input) {
  if (input?.version !== 1 || input.kind !== 'matched-position-comparison' || input.chainId !== 1
    || input.id !== 'weth-usdc-matched-week-2026-10-12' || !Array.isArray(input.records) || input.records.length !== 2) {
    throw new Error('Unsupported matched historical comparison.');
  }
  if (!/^[0-9a-f]{40}$/.test(input.declarationCommit) || !/^[0-9a-f]{64}$/.test(input.selectionSHA256)
    || typeof input.capturedAt !== 'string' || !Number.isFinite(Date.parse(input.capturedAt))) throw new Error('Missing comparison provenance.');
  const records = input.records.map((item, index) => {
    if (item.group !== ['narrower', 'wider'][index]) throw new Error('Comparison groups differ.');
    const record = validateCollectionHistory(item.record);
    const first = record.points[0].snapshot, width = first.position.tickUpper - first.position.tickLower;
    if (first.position.fee !== 3000 || (index === 0 ? width > 2000 : width <= 2000)
      || first.pool.tick < first.position.tickLower || first.pool.tick >= first.position.tickUpper) {
      throw new Error('Position does not meet the declared starting eligibility.');
    }
    if (Date.parse(record.capturedAt) > Date.parse(input.capturedAt)) throw new Error('Comparison predates its records.');
    return { group: item.group, record };
  });
  const [a, b] = records.map(item => item.record);
  if (a.id === b.id || JSON.stringify(a.dailyBlocks) !== JSON.stringify(b.dailyBlocks)) throw new Error('Compare distinct positions over identical blocks.');
  for (const block of a.dailyBlocks) {
    const left = a.points.find(point => point.snapshot.block.number === block).snapshot;
    const right = b.points.find(point => point.snapshot.block.number === block).snapshot;
    if (left.poolAddress !== right.poolAddress || JSON.stringify(left.block) !== JSON.stringify(right.block)
      || JSON.stringify(left.pool) !== JSON.stringify(right.pool)
      || left.feeGrowth.global0X128 !== right.feeGrowth.global0X128 || left.feeGrowth.global1X128 !== right.feeGrowth.global1X128) {
      throw new Error('The two positions do not share the same recorded market.');
    }
  }
  const start = new Date(a.points[0].snapshot.block.timestamp * 1000).toISOString().slice(0, 10);
  const end = new Date(a.points.at(-1).snapshot.block.timestamp * 1000).toISOString().slice(0, 10);
  if (start !== '2026-10-12' || end !== '2026-10-19' || input.plan?.id !== input.id
    || input.plan.startUTC !== start + 'T00:00:00.000Z' || input.plan.endUTC !== end + 'T00:00:00.000Z') {
    throw new Error('The declared comparison dates differ.');
  }
  return { version: 1, kind: input.kind, id: input.id, chainId: 1, plan: input.plan,
    selectionSHA256: input.selectionSHA256, declarationCommit: input.declarationCommit, records, capturedAt: input.capturedAt };
}
