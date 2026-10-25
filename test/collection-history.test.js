import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recordedPeriod, validatePositionHistory } from '../public/data/position-history.js';
import { validateCollectionHistory, MANAGER_COLLECT, POOL_COLLECT } from '../public/data/collection-history.js';
import { positionFeeAccounting, feeSnapshotFields } from '../public/data/position-snapshot.js';
import { V3 } from '../public/data/config.js';
import { encodeInt, encodeUint, encodeWord } from '../public/data/abi.js';
import { collectionDayView, collectionDayInterval } from '../public/lib/matched-comparison.js';

const week = recordedPeriod(validatePositionHistory(JSON.parse(await readFile(new URL('../public/examples/uniswap-v3-position-week.json', import.meta.url), 'utf8'))));
function fixture({ debit = 40n, paid = 40n } = {}) {
  const points = structuredClone(week.points);
  for (const [index, point] of points.entries()) {
    point.snapshot.position.tokensOwed0 = String(index >= 3 ? 100n - debit : 100n);
    point.snapshot.position.tokensOwed1 = String(index >= 3 ? 100n - debit : 100n);
    point.snapshot.fees = feeSnapshotFields(positionFeeAccounting(point.snapshot.position, point.snapshot.pool, point.snapshot.feeGrowth));
    point.simulatedCollect = [point.snapshot.fees.collectable0Raw, point.snapshot.fees.collectable1Raw];
  }
  const block = points[3].snapshot.block, position = points[0].snapshot.position;
  const metadata = { blockNumber: '0x' + BigInt(block.number).toString(16), blockHash: block.hash,
    transactionHash: '0x' + '12'.repeat(32), transactionIndex: '0x0', removed: false };
  const recipient = '0x' + '34'.repeat(20);
  const pool = { ...metadata, logIndex: '0x0', address: points[0].snapshot.poolAddress,
    topics: [POOL_COLLECT, '0x' + encodeWord(V3.positionManager), '0x' + encodeInt(position.tickLower), '0x' + encodeInt(position.tickUpper)],
    data: '0x' + encodeWord(recipient) + encodeUint(paid) + encodeUint(paid) };
  const manager = { ...metadata, logIndex: '0x1', address: V3.positionManager,
    topics: [MANAGER_COLLECT, '0x' + encodeUint(points[0].snapshot.tokenId)],
    data: '0x' + encodeWord(recipient) + encodeUint(debit) + encodeUint(debit) };
  const receipt = { status: '0x1', blockNumber: metadata.blockNumber, blockHash: block.hash,
    transactionHash: metadata.transactionHash, logs: [pool, manager] };
  const queries = structuredClone(week.eventQueries);
  queries.find(item => BigInt(item.fromBlock) <= BigInt(block.number) && BigInt(item.toBlock) >= BigInt(block.number)).matchingEvents = 1;
  return validateCollectionHistory({ version: 1, kind: 'collected-position-history', chainId: 1, id: week.id,
    points, dailyBlocks: points.map(point => point.snapshot.block.number), collections: [manager], receipts: [receipt],
    receiptProvider: 'https://rpc.mevblocker.io', eventQueries: queries, capturedAt: '2026-10-25T00:00:00.000Z' }, { buildSummary: true });
}
test('collection ledger excludes old claims and preserves the exact starting basket', () => {
  const record = fixture();
  assert.deepEqual(validateCollectionHistory(record), record);
  const result = collectionDayView(record, 7);
  assert.equal(result.earned0, 0n);
  assert.equal(result.earned1, 0n);
  assert.equal(result.collectionCount, 1);
  assert.equal(result.gapUSD, 0);
  assert.ok(result.lpChangeUSD < 0);
  assert.equal(collectionDayView(record, 2).collectionCount, 0);
});
test('actual-payment rounding stays visible, including a signed dust loss', () => {
  const record = fixture({ paid: 39n });
  assert.deepEqual(record.validation.checkpoints[3].earnedRaw, ['-1', '-1']);
  assert.deepEqual(record.validation.checkpoints[3].collectionRoundingLossRaw, ['1', '1']);
  assert.equal(collectionDayInterval(record, 3).earned0, -1n);
  assert.equal(collectionDayInterval(record, 4).earned0, 0n);
});
test('rejects wrong recipients, ranges, pool identities and receipt status', () => {
  for (const mutate of [
    r => { r.receipts[0].logs[0].data = '0x' + encodeWord('0x' + '56'.repeat(20)) + encodeUint(40) + encodeUint(40); },
    r => { r.receipts[0].logs[0].topics[2] = '0x' + encodeInt(0); },
    r => { r.receipts[0].logs[0].address = V3.positionManager; },
    r => { r.receipts[0].status = '0x0'; },
    r => { r.receipts[0].blockHash = '0x' + 'ab'.repeat(32); },
  ]) {
    const record = fixture(); mutate(record);
    assert.throws(() => validateCollectionHistory(record));
  }
});
test('rejects duplicate and missing events, receipts and continuity chunks', () => {
  for (const mutate of [
    r => r.collections.push(structuredClone(r.collections[0])),
    r => r.collections.pop(),
    r => r.receipts.pop(),
    r => r.receipts.push(structuredClone(r.receipts[0])),
    r => r.eventQueries.splice(2, 1),
    r => { r.eventQueries.find(q => q.matchingEvents).matchingEvents = 0; },
    r => r.points.splice(3, 1),
    r => { r.points.reverse(); },
    r => { r.dailyBlocks[2] = r.dailyBlocks[1]; },
  ]) {
    const record = fixture(); mutate(record);
    assert.throws(() => validateCollectionHistory(record));
  }
});
test('rechecks cash-flow summaries instead of trusting exported figures', () => {
  const record = fixture(); record.validation.checkpoints[7].earnedRaw[0] = '10';
  assert.throws(() => validateCollectionHistory(record), /summary differs/);
});
test('rejects unreported accounting changes and impossible pool payments', () => {
  const record = fixture();
  const point = record.points[2];
  point.snapshot.position.tokensOwed0 = '99';
  point.snapshot.fees = feeSnapshotFields(positionFeeAccounting(point.snapshot.position, point.snapshot.pool, point.snapshot.feeGrowth));
  point.simulatedCollect[0] = point.snapshot.fees.collectable0Raw;
  assert.throws(() => validateCollectionHistory(record), /disagrees|without a collection/);
  assert.throws(() => fixture({ paid: 41n }), /Invalid collected/);
});
