import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { blockHeader, confirmBlock, finalizedBlock } from '../public/data/block.js';
import { createRpcClient } from '../public/data/rpc.js';
import { abiWords, encodeUint, addressFromWord, uintFromWord, intFromWord } from '../public/data/abi.js';
import { V3, V3_POOLS } from '../public/data/config.js';
import { readReplayEvents } from './lib/replay-events.js';
import { blockTag, captureClient, sleep } from './lib/history-capture.js';

const planBytes = await readFile(new URL('./replay-comparison-plan.json', import.meta.url), 'utf8');
const plan = JSON.parse(planBytes);
const output = process.argv[2] || '/tmp/teren-comparison-selection.json';
const stateProvider = process.env.REPLAY_RPC || 'https://eth.drpc.org';
const eventProvider = process.env.REPLAY_LOG_RPC || 'https://rpc.mevblocker.io';
const rpc = captureClient(stateProvider), eventRpc = captureClient(eventProvider);
const collectTopic = '0x40d0efd1a53d60ecbf40971b9daf7dc90178c3aadc7aab1765632738fa8b8f01';
let report = { version: 1, kind: 'matched-week-selection', startedAt: new Date().toISOString(),
  declarationCommit: execFileSync('git', ['log', '-1', '--format=%H', '--', 'scripts/replay-comparison-plan.json'], { encoding: 'utf8' }).trim(),
  plan, planSHA256: createHash('sha256').update(planBytes).digest('hex'),
  stateProvider, eventProvider, boundaries: [], checks: [], selected: {} };
try {
  const saved = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(saved.planSHA256, report.planSHA256, 'Cannot resume another selection plan.');
  assert.deepEqual(saved.plan, plan);
  assert.ok(!saved.error && !saved.completedAt, 'Use a new output file for a fresh or failed selection.');
  saved.checks.forEach((check, index) => assert.equal(check.tokenId, String(BigInt(plan.candidateOrder.firstTokenId) + BigInt(index))));
  report = { ...saved, boundaries: [], resumedAt: new Date().toISOString() };
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const persist = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const direct = createRpcClient({ endpoint: stateProvider });
async function metadataRead(method, params) {
  for (let attempt = 0; ; attempt++) {
    try { return await direct(method, params); }
    catch (error) { if (!error.retryable || attempt === 3) throw error; await sleep(1000 * 2 ** attempt); }
  }
}
async function position(id, block, read = rpc) {
  try { return abiWords(await read('eth_call', [{ to: V3.positionManager, data: '0x99fbab88' + encodeUint(id) }, blockTag(block)]), 12); }
  catch (error) { if (error.revertReason === 'Invalid token ID') return null; throw error; }
}
try {
  const prior = JSON.parse(await readFile(new URL('../docs/evidence/week-selection.json', import.meta.url), 'utf8'));
  const latest = (await finalizedBlock(rpc)).block;
  for (const [index, entry] of prior.boundaries.entries()) {
    const requested = Date.parse(plan.startUTC) / 1000 + index * 86400;
    assert.equal(Date.parse(entry.requestedAt) / 1000, requested);
    assert.ok(entry.previousBlock.timestamp < requested && entry.block.timestamp >= requested);
    assert.equal(BigInt(entry.block.number), BigInt(entry.previousBlock.number) + 1n);
    assert.ok(BigInt(entry.block.number) <= BigInt(latest.number));
    for (const header of [entry.previousBlock, entry.block]) await confirmBlock(rpc, blockTag(header), header);
    await confirmBlock(eventRpc, blockTag(entry.block), entry.block);
    report.boundaries.push(entry);
  }
  assert.equal(report.boundaries.length, 8);
  assert.equal(report.boundaries.at(-1).requestedAt, plan.endUTC);
  const start = report.boundaries[0].block, end = report.boundaries.at(-1).block;
  report.startTick = intFromWord(abiWords(await rpc('eth_call', [{ to: V3_POOLS[3000], data: '0x3850c7bd' }, blockTag(start)]), 7)[1], 24);
  await persist();
  let prefetched = [];
  for (let id = BigInt(plan.candidateOrder.firstTokenId) + BigInt(report.checks.length); id <= BigInt(plan.candidateOrder.lastTokenId); id++) {
    const check = { tokenId: String(id) };
    const reject = reason => { check.reason = reason; report.checks.push(check); };
    if (!prefetched.length) {
      const ids = Array.from({ length: 3 }, (_, offset) => id + BigInt(offset)).filter(value => value <= BigInt(plan.candidateOrder.lastTokenId));
      // Read at most three starting metadata records concurrently. Decisions and
      // audits remain strictly ascending; any provider failure stops the batch.
      await sleep(180);
      prefetched = await Promise.all(ids.map(value => position(value, start, metadataRead)));
    }
    const a = prefetched.shift();
    if (!a) reject('missing position');
    else if (addressFromWord(a[2]) !== V3.usdc || addressFromWord(a[3]) !== V3.weth || uintFromWord(a[4], 24) !== 3000n) reject('different pair or fee tier');
    else {
      const lower = intFromWord(a[5], 24), upper = intFromWord(a[6], 24);
      const group = plan.groups.find(item => upper - lower >= item.minWidthTicks && upper - lower <= item.maxWidthTicks);
      Object.assign(check, { tickLower: lower, tickUpper: upper, liquidity: uintFromWord(a[7], 128).toString(), group: group.id });
      if (report.selected[group.id]) reject('group already selected');
      else if (check.liquidity === '0') reject('zero liquidity');
      else if (report.startTick < lower || report.startTick >= upper) reject('outside range at start');
      else {
        const b = await position(id, end);
        if (!b || a.slice(2, 8).join() !== b.slice(2, 8).join()) reject('changed liquidity or bounds');
        else {
          console.log('Checking ' + group.id + ' candidate #' + id);
          check.eventQueries = []; check.collections = [];
          let changed = false;
          for (let from = BigInt(start.number) + 1n; from <= BigInt(end.number); from += 500n) {
            const to = from + 499n > BigInt(end.number) ? BigInt(end.number) : from + 499n;
            await sleep(180);
            const logs = await readReplayEvents(eventProvider, { address: V3.positionManager, fromBlock: blockTag(from), toBlock: blockTag(to), topics: [null, '0x' + encodeUint(id)] });
            check.eventQueries.push({ provider: eventProvider, fromBlock: String(from), toBlock: String(to), matchingEvents: logs.length });
            if (logs.some(log => log.topics[0] !== collectTopic)) { changed = true; break; }
            check.collections.push(...logs);
          }
          if (changed) reject('liquidity addition or removal during the week');
          else if (check.collections.length > 32) reject('more than 32 fee collections');
          else { check.eligible = true; report.checks.push(check); report.selected[group.id] = String(id); console.log('Selected ' + group.id + ' #' + id + ', collections: ' + check.collections.length); }
        }
      }
    }
    await persist();
    if (Object.keys(report.selected).length === 2) break;
    if (id % 50n === 0n) console.log('Inspected through #' + id);
  }
  for (const block of [start, end]) {
    await confirmBlock(rpc, blockTag(block), block);
    await confirmBlock(eventRpc, blockTag(block), block);
  }
  report.completedAt = new Date().toISOString(); await persist();
  console.log(JSON.stringify({ selected: report.selected, inspected: report.checks.length }));
  if (Object.keys(report.selected).length !== 2) process.exitCode = 1;
} catch (error) { report.error = error.message; await persist(); throw error; }
