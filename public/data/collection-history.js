import { validatePositionSnapshot } from './position-snapshot.js';
import { periodModelPoint, canonicalPeriodPoint } from './position-period.js';
import { validateProvider } from './provenance.js';
import { abiWords, addressFromWord, uintFromWord, encodeUint, encodeWord, encodeInt } from './abi.js';
import { V3 } from './config.js';
import { calculateCollectionPeriod } from '../models/collection-period.js';

export const MANAGER_COLLECT = '0x40d0efd1a53d60ecbf40971b9daf7dc90178c3aadc7aab1765632738fa8b8f01';
export const POOL_COLLECT = '0x70935338e69775456a85ddef226c395fb668b63fa0115f5f20610b388e6ca9c0';
export const COMPARISON_MAX_BYTES = 2097152;
const fail = message => { throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function raw(value, bits) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,77})$/.test(value) || BigInt(value) >= 1n << BigInt(bits)) fail('Invalid historical integer.');
  return value;
}
function hex(value, bytes) {
  if (typeof value !== 'string' || !(bytes ? new RegExp('^0x[0-9a-f]{' + bytes * 2 + '}$') : /^0x(?:0|[1-9a-f][0-9a-f]*)$/).test(value)) fail('Invalid receipt field.');
  return value;
}
function log(input) {
  if (!input || input.removed !== false || !Array.isArray(input.topics) || input.topics.length > 4
    || typeof input.data !== 'string' || !/^0x(?:[0-9a-f]{2})*$/.test(input.data) || input.data.length > 131074) fail('Invalid receipt log.');
  return { address: hex(input.address, 20), topics: input.topics.map(value => hex(value, 32)), data: input.data,
    blockNumber: hex(input.blockNumber), blockHash: hex(input.blockHash, 32), transactionHash: hex(input.transactionHash, 32),
    transactionIndex: hex(input.transactionIndex), logIndex: hex(input.logIndex), removed: false };
}
export function collectionModelPoint(point) {
  return { ...periodModelPoint(point),
    claim0: BigInt(point.snapshot.fees.collectable0Raw), claim1: BigInt(point.snapshot.fees.collectable1Raw),
    available0: BigInt(point.simulatedCollect[0]), available1: BigInt(point.simulatedCollect[1]) };
}
export function decodeCollection(manager, pool, first) {
  const position = first.snapshot.position;
  if (manager.address !== V3.positionManager || !same(manager.topics, [MANAGER_COLLECT, '0x' + encodeUint(first.snapshot.tokenId)])
    || pool.address !== first.snapshot.poolAddress || !same(pool.topics, [POOL_COLLECT, '0x' + encodeWord(V3.positionManager), '0x' + encodeInt(position.tickLower), '0x' + encodeInt(position.tickUpper)])
    || pool.transactionHash !== manager.transactionHash || pool.blockHash !== manager.blockHash
    || BigInt(pool.logIndex) + 1n !== BigInt(manager.logIndex)) fail('A collection cannot be attributed to this NFT and pool.');
  const debit = abiWords(manager.data, 3), paid = abiWords(pool.data, 3);
  if (addressFromWord(debit[0]) !== addressFromWord(paid[0])) fail('Collection recipients differ.');
  return { blockNumber: BigInt(manager.blockNumber),
    debit0: uintFromWord(debit[1], 128), debit1: uintFromWord(debit[2], 128),
    paid0: uintFromWord(paid[1], 128), paid1: uintFromWord(paid[2], 128) };
}
export function collectionResult(points, collections, index) {
  const block = BigInt(points[index].snapshot.block.number);
  return calculateCollectionPeriod(collectionModelPoint(points[0]), collectionModelPoint(points[index]),
    collections.filter(item => item.blockNumber <= block));
}
export function collectionValidation(points, collections) {
  let previous;
  const results = points.map((point, index) => {
    const result = collectionResult(points, collections, index);
    if (previous) {
      const events = collections.filter(item => item.blockNumber > BigInt(previous.snapshot.block.number)
        && item.blockNumber <= BigInt(point.snapshot.block.number));
      if (!events.length && !same(point.snapshot.position, previous.snapshot.position)) fail('Accounting changed without a collection event.');
      calculateCollectionPeriod(collectionModelPoint(previous), collectionModelPoint(point), events);
    }
    previous = point;
    return { blockNumber: point.snapshot.block.number,
      earnedRaw: [result.earned0, result.earned1].map(String),
      creditedRaw: [result.credited0, result.credited1].map(String),
      growthRaw: [result.growthEarned0, result.growthEarned1].map(String),
      collectedRaw: [result.collected0, result.collected1].map(String),
      collectionRoundingLossRaw: [result.collectionRoundingLoss0, result.collectionRoundingLoss1].map(String),
      secondsInRange: result.secondsInRange, durationSeconds: result.durationSeconds };
  });
  return { method: 'fixed-liquidity-collect-receipts-and-growth', checkpoints: results };
}

export function validateCollectionHistory(input, { buildSummary = false } = {}) {
  if (input?.version !== 1 || input.kind !== 'collected-position-history' || input.chainId !== 1) fail('Unsupported collection history.');
  if (!Array.isArray(input.points) || input.points.length < 8 || input.points.length > 40) fail('Unsupported collection checkpoint count.');
  const points = input.points.map(point => {
    const snapshot = validatePositionSnapshot(point.snapshot);
    if (snapshot.version !== 2 || BigInt(snapshot.position.liquidity) === 0n || snapshot.fees.overflow) fail('Positive, unoverflowed fee accounting is required.');
    if (!Array.isArray(point.simulatedCollect) || point.simulatedCollect.length !== 2) fail('Missing collection simulation.');
    return { snapshot, secondsInside: raw(point.secondsInside, 32), simulatedCollect: point.simulatedCollect.map(value => raw(value, 128)) };
  });
  const first = points[0], last = points.at(-1), identity = ['fee', 'tickLower', 'tickUpper', 'liquidity'];
  if (input.id !== 'position-' + first.snapshot.tokenId) fail('Historical position ID differs.');
  for (const [index, point] of points.entries()) {
    if (point.snapshot.tokenId !== first.snapshot.tokenId || point.snapshot.poolAddress !== first.snapshot.poolAddress
      || identity.some(key => point.snapshot.position[key] !== first.snapshot.position[key])) fail('Liquidity or bounds changed.');
    if (index && (BigInt(point.snapshot.block.number) <= BigInt(points[index - 1].snapshot.block.number)
      || point.snapshot.block.timestamp <= points[index - 1].snapshot.block.timestamp)) fail('Historical checkpoints must be ordered.');
  }
  const start = BigInt(first.snapshot.block.number), end = BigInt(last.snapshot.block.number);
  if (end - start > 60000n) fail('Collection history exceeds its bounded span.');
  const byBlock = new Map(points.map(point => [point.snapshot.block.number, point]));
  if (!Array.isArray(input.dailyBlocks) || input.dailyBlocks.length !== 8 || input.dailyBlocks[0] !== String(start) || input.dailyBlocks.at(-1) !== String(end)) fail('Missing complete daily checkpoints.');
  const dailyBlocks = input.dailyBlocks.map((value, index) => {
    raw(value, 53);
    if (!byBlock.has(value) || (index && BigInt(value) <= BigInt(input.dailyBlocks[index - 1]))) fail('Invalid daily checkpoints.');
    const timestamp = byBlock.get(value).snapshot.block.timestamp;
    const expected = Math.floor(first.snapshot.block.timestamp / 86400) * 86400 + index * 86400;
    if (timestamp < expected || timestamp >= expected + 60) fail('Daily checkpoints do not match UTC boundaries.');
    return value;
  });
  if (!Array.isArray(input.collections) || input.collections.length > 32 || !Array.isArray(input.receipts) || input.receipts.length > 32) fail('Unsupported collection evidence.');
  const receipts = input.receipts.map(receipt => {
    if (receipt.status !== '0x1' || !Array.isArray(receipt.logs) || receipt.logs.length > 2000) fail('Invalid successful collection receipt.');
    const blockNumber = hex(receipt.blockNumber), blockHash = hex(receipt.blockHash, 32), transactionHash = hex(receipt.transactionHash, 32);
    const point = byBlock.get(BigInt(blockNumber).toString());
    if (!point || point.snapshot.block.hash !== blockHash) fail('Collection receipt block is not pinned.');
    const logs = receipt.logs.map(log);
    logs.forEach((item, index) => {
      if (item.blockNumber !== blockNumber || item.blockHash !== blockHash || item.transactionHash !== transactionHash
        || (index && BigInt(item.logIndex) !== BigInt(logs[index - 1].logIndex) + 1n)) fail('Inconsistent receipt logs.');
    });
    return { status: '0x1', blockNumber, blockHash, transactionHash, logs };
  });
  if (new Set(receipts.map(item => item.transactionHash)).size !== receipts.length) fail('Duplicate collection receipt.');
  const collections = input.collections.map(log);
  const decoded = collections.map((item, index) => {
    const number = BigInt(item.blockNumber);
    const prior = collections[index - 1];
    if (number <= start || number > end || (prior && (number < BigInt(prior.blockNumber)
      || (number === BigInt(prior.blockNumber) && BigInt(item.logIndex) <= BigInt(prior.logIndex))))) fail('Duplicate or unordered collection event.');
    const receipt = receipts.find(receipt => receipt.transactionHash === item.transactionHash);
    const at = receipt?.logs.findIndex(entry => same(entry, item));
    if (!(at > 0)) fail('Collection event missing from its receipt.');
    return decodeCollection(item, receipt.logs[at - 1], first);
  });
  for (const receipt of receipts) {
    if (receipt.logs.some(item => item.address === V3.positionManager
      && item.topics[1] === '0x' + encodeUint(first.snapshot.tokenId) && item.topics[0] !== MANAGER_COLLECT)) {
      fail('A receipt contains a liquidity update for this position.');
    }
    const matched = receipt.logs.filter(item => item.address === V3.positionManager
      && same(item.topics, [MANAGER_COLLECT, '0x' + encodeUint(first.snapshot.tokenId)]));
    if (!matched.length || matched.some(item => !collections.some(entry => same(entry, item)))) fail('Incomplete collection receipt coverage.');
  }
  if (!Array.isArray(input.eventQueries) || input.eventQueries.length < 1 || input.eventQueries.length > 120) fail('Missing continuity evidence.');
  let next = start + 1n;
  const eventQueries = input.eventQueries.map(query => {
    const from = BigInt(raw(query.fromBlock, 53)), to = BigInt(raw(query.toBlock, 53));
    const count = decoded.filter(item => item.blockNumber >= from && item.blockNumber <= to).length;
    if (from !== next || to < from || to > end || to - from >= 500n || query.matchingEvents !== count) fail('Event coverage has a gap or unaccounted update.');
    next = to + 1n;
    return { provider: validateProvider(query.provider), fromBlock: String(from), toBlock: String(to), matchingEvents: count };
  });
  if (next !== end + 1n) fail('Event coverage is incomplete.');
  const validation = collectionValidation(points, decoded);
  if (!buildSummary && !same(validation, input.validation)) fail('Collection validation summary differs.');
  if (typeof input.capturedAt !== 'string' || !Number.isFinite(Date.parse(input.capturedAt))) fail('Invalid capture time.');
  return { version: 1, kind: input.kind, chainId: 1, id: input.id, points, dailyBlocks, collections, receipts,
    receiptProvider: validateProvider(input.receiptProvider), eventQueries, validation, capturedAt: input.capturedAt };
}

export function canonicalCollectionHistory(record) {
  return { points: record.points.map(canonicalPeriodPoint), collections: record.collections, receipts: record.receipts,
    dailyBlocks: record.dailyBlocks, validation: record.validation };
}
