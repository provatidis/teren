import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { confirmBlock, finalizedBlock } from '../public/data/block.js';
import { encodeUint } from '../public/data/abi.js';
import { V3 } from '../public/data/config.js';
import { validateCollectionHistory, MANAGER_COLLECT } from '../public/data/collection-history.js';
import { validateMatchedComparison } from '../public/data/matched-comparison.js';
import { readReplayEvents } from './lib/replay-events.js';
import { captureClient, capturePoint, blockTag, sleep } from './lib/history-capture.js';
import { validateComparisonSelection } from './lib/comparison-selection.js';

const planBytes = await readFile(new URL('./replay-comparison-plan.json', import.meta.url), 'utf8');
const plan = JSON.parse(planBytes);
const selection = JSON.parse(await readFile(process.argv[2] || new URL('../docs/evidence/comparison-selection.json', import.meta.url), 'utf8'));
const output = process.argv[3] || '/tmp/teren-matched-week.json';
const cache = process.argv[4] || '/tmp/teren-comparison-cache';
validateComparisonSelection(selection, plan, createHash('sha256').update(planBytes).digest('hex'));
const state = captureClient(process.env.REPLAY_RPC || 'https://eth.drpc.org');
const eventProvider = process.env.REPLAY_LOG_RPC || 'https://rpc.mevblocker.io';
const events = captureClient(eventProvider);
const latest = (await finalizedBlock(state)).block;
assert.ok(BigInt(selection.boundaries.at(-1).block.number) <= BigInt(latest.number));
for (const [index, entry] of selection.boundaries.entries()) {
  const time = Date.parse(plan.startUTC) / 1000 + index * 86400;
  assert.equal(Date.parse(entry.requestedAt) / 1000, time);
  assert.ok(entry.previousBlock.timestamp < time && entry.block.timestamp >= time);
  assert.equal(BigInt(entry.previousBlock.number) + 1n, BigInt(entry.block.number));
  await confirmBlock(state, blockTag(entry.previousBlock), entry.previousBlock);
  await confirmBlock(state, blockTag(entry.block), entry.block);
  await confirmBlock(events, blockTag(entry.block), entry.block);
}
await mkdir(cache, { recursive: true });
const dailyBlocks = selection.boundaries.map(entry => entry.block.number);
const start = BigInt(dailyBlocks[0]), end = BigInt(dailyBlocks.at(-1));
async function receipt(hash) {
  // Development-only read. Do not expand the browser RPC allowlist.
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(eventProvider, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [hash] }) });
    const body = await response.text();
    assert.ok(body.length <= 1500000, 'Receipt is too large.');
    const reply = JSON.parse(body);
    if (response.ok && reply.jsonrpc === '2.0' && reply.id === 1 && reply.result) return reply.result;
    if (attempt === 3 || !(response.status === 429 || response.status >= 500 || reply.error?.code === -32005)) throw new Error('Receipt read failed; capture is incomplete.');
    await sleep(1000 * 2 ** attempt);
  }
}
const records = [];
for (const group of plan.groups) {
  const tokenId = selection.selected[group.id];
  console.log('Capturing ' + group.id + ' #' + tokenId);
  const collections = [], eventQueries = [];
  for (let from = start + 1n; from <= end; from += 500n) {
    const to = from + 499n > end ? end : from + 499n;
    await sleep(180);
    const logs = await readReplayEvents(eventProvider, { address: V3.positionManager, fromBlock: blockTag(from), toBlock: blockTag(to), topics: [null, '0x' + encodeUint(tokenId)] });
    assert.ok(logs.every(log => log.topics[0] === MANAGER_COLLECT), 'Liquidity changed during the selected week.');
    collections.push(...logs);
    eventQueries.push({ provider: eventProvider, fromBlock: String(from), toBlock: String(to), matchingEvents: logs.length });
  }
  assert.ok(collections.length <= 32);
  collections.sort((a, b) => Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)) || Number(BigInt(a.logIndex) - BigInt(b.logIndex)));
  const receipts = [];
  for (const hash of new Set(collections.map(log => log.transactionHash))) receipts.push(await receipt(hash));
  const numbers = [...new Set([...dailyBlocks, ...collections.map(log => BigInt(log.blockNumber).toString())])]
    .sort((a, b) => Number(BigInt(a) - BigInt(b)));
  const points = [];
  for (const number of numbers) {
    const file = join(cache, tokenId + '-' + number + '.json');
    let point;
    try { point = JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!point) {
      point = await capturePoint(tokenId, number, state);
      await writeFile(file + '.tmp', JSON.stringify(point)); await rename(file + '.tmp', file);
    }
    assert.equal(point.snapshot.tokenId, tokenId);
    assert.equal(point.snapshot.block.number, number);
    await confirmBlock(state, blockTag(number), point.snapshot.block);
    await confirmBlock(events, blockTag(number), point.snapshot.block);
    points.push(point);
    console.log('Captured #' + tokenId + ' block ' + number);
  }
  const record = validateCollectionHistory({ version: 1, kind: 'collected-position-history', chainId: 1, id: 'position-' + tokenId,
    points, dailyBlocks, collections, receipts, receiptProvider: eventProvider, eventQueries, capturedAt: new Date().toISOString() }, { buildSummary: true });
  const selected = selection.checks.find(check => check.tokenId === tokenId);
  assert.equal(record.points[0].snapshot.position.tickLower, selected.tickLower);
  assert.equal(record.points[0].snapshot.position.tickUpper, selected.tickUpper);
  assert.equal(record.points[0].snapshot.position.liquidity, selected.liquidity);
  assert.equal(record.points[0].snapshot.pool.tick, selection.startTick);
  records.push({ group: group.id, record });
  await writeFile(join(cache, group.id + '-validated.json'), JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record.validation.checkpoints.at(-1)));
}
const result = validateMatchedComparison({ version: 1, kind: 'matched-position-comparison', id: plan.id, chainId: 1,
  plan, selectionSHA256: createHash('sha256').update(JSON.stringify(selection)).digest('hex'),
  declarationCommit: selection.declarationCommit, records, capturedAt: new Date().toISOString() });
await writeFile(output + '.tmp', JSON.stringify(result, null, 2) + '\n');
await rename(output + '.tmp', output);
console.log('Saved complete comparison: ' + output);
