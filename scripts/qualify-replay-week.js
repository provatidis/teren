import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRpcClient } from '../public/data/rpc.js';
import { blockHeader, confirmBlock, finalizedBlock } from '../public/data/block.js';
import { abiWords, encodeUint, addressFromWord, uintFromWord } from '../public/data/abi.js';
import { V3 } from '../public/data/config.js';
import { readReplayEvents } from './lib/replay-events.js';

// Selection reads eligibility only. It never ranks positions by accrued income.
const planBytes = await readFile(new URL('./replay-week-plan.json', import.meta.url), 'utf8');
const plan = JSON.parse(planBytes);
const output = process.argv[2] || 'week-selection.json';
const stateProvider = process.env.REPLAY_RPC || 'https://eth.drpc.org';
const eventProvider = process.env.REPLAY_LOG_RPC || 'https://rpc.mevblocker.io';
const base = createRpcClient({ endpoint: stateProvider });
const eventRpc = createRpcClient({ endpoint: eventProvider });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function rpc(method, params = []) {
  await sleep(220);
  for (let attempt = 0; ; attempt++) {
    try { return await base(method, params); }
    catch (error) {
      if (!error.retryable || attempt === 3) throw error;
      await sleep(1000 * 2 ** attempt);
    }
  }
}
const report = {
  version: 1, kind: 'week-position-selection', checkedAt: new Date().toISOString(),
  stateProvider, eventProvider, plan, planSHA256: createHash('sha256').update(planBytes).digest('hex'),
  declarationCommit: '2e293cc51a1de520bb81a20d4230980eed8ebc1e',
  boundaries: [], checks: [], fallbackChecks: [], selectedTokenId: null,
};
const persist = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const tag = block => '0x' + BigInt(block.number).toString(16);
async function readPosition(tokenId, block) {
  try {
    return abiWords(await rpc('eth_call', [{ to: V3.positionManager, data: '0x99fbab88' + encodeUint(tokenId) }, tag(block)]), 12);
  } catch (error) {
    if (error.revertReason === 'Invalid token ID') return null;
    throw error;
  }
}
async function readLogs(tokenId, from, to) {
  const filter = { address: V3.positionManager, fromBlock: '0x' + from.toString(16), toBlock: '0x' + to.toString(16), topics: [null, '0x' + encodeUint(tokenId)] };
  await sleep(200);
  return readReplayEvents(eventProvider, filter);
}
async function candidate(tokenId) {
  const first = report.boundaries[0].block, last = report.boundaries.at(-1).block;
  const check = { tokenId, eligible: false };
  const start = await readPosition(tokenId, first);
  if (!start) return { ...check, reason: 'missing position at start' };
  if (addressFromWord(start[2]) !== V3.usdc || addressFromWord(start[3]) !== V3.weth || uintFromWord(start[4], 24) !== 3000n) {
    return { ...check, reason: 'different pair or fee tier' };
  }
  check.startAccountingWords = start.slice(2);
  check.startLiquidity = uintFromWord(start[7], 128).toString();
  if (check.startLiquidity === '0') return { ...check, reason: 'zero liquidity at start' };
  const end = await readPosition(tokenId, last);
  if (!end) return { ...check, reason: 'missing position at end' };
  check.endAccountingWords = end.slice(2);
  if (JSON.stringify(start.slice(2)) !== JSON.stringify(end.slice(2))) return { ...check, reason: 'changed liquidity or accounting' };
  console.log('Checking complete position-event coverage for #' + tokenId + '.');
  check.eventQueries = [];
  for (let from = BigInt(first.number) + 1n; from <= BigInt(last.number); from += 500n) {
    const to = from + 499n > BigInt(last.number) ? BigInt(last.number) : from + 499n;
    const logs = await readLogs(tokenId, from, to);
    check.eventQueries.push({ provider: eventProvider, fromBlock: String(from), toBlock: String(to), matchingEvents: logs.length });
    if (logs.length) return { ...check, reason: 'position update events' };
  }
  return { ...check, eligible: true };
}
try {
  const latest = (await finalizedBlock(rpc)).block;
  report.finalizedBlock = latest;
  const headers = new Map([[Number(latest.number), latest]]);
  async function header(number) {
    if (!headers.has(number)) headers.set(number, blockHeader(await rpc('eth_getBlockByNumber', ['0x' + number.toString(16), false])));
    return headers.get(number);
  }
  let lower = 1;
  const startTime = Date.parse(plan.startUTC), endTime = Date.parse(plan.endUTC);
  assert.equal(endTime - startTime, 7 * 86400000, 'The declared period must remain one week.');
  for (let time = startTime; time <= endTime; time += 86400000) {
    assert.ok(latest.timestamp >= time / 1000, 'The requested date is not finalized.');
    assert.ok((await header(lower)).timestamp < time / 1000, 'Invalid search lower bound.');
    let low = lower, high = Number(latest.number);
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if ((await header(middle)).timestamp >= time / 1000) high = middle;
      else low = middle;
    }
    report.boundaries.push({ requestedAt: new Date(time).toISOString(), block: await header(high), previousBlock: await header(low) });
    lower = high; await persist();
  }
  const endpoints = [report.boundaries[0].block, report.boundaries.at(-1).block];
  for (const block of endpoints) await confirmBlock(eventRpc, tag(block), block);
  for (const id of plan.initialCandidates) {
    const check = await candidate(id); report.checks.push(check);
    if (check.eligible) report.selectedTokenId = id;
    await persist();
    if (check.eligible) break;
  }
  if (!report.selectedTokenId) {
    assert.equal(plan.fallback.order, 'ascending');
    assert.equal(BigInt(plan.fallback.lastTokenId) - BigInt(plan.fallback.firstTokenId), 499n);
    for (let value = BigInt(plan.fallback.firstTokenId); value <= BigInt(plan.fallback.lastTokenId); value++) {
      const id = String(value);
      if (plan.initialCandidates.includes(id)) continue;
      const check = await candidate(id); report.fallbackChecks.push(check);
      if (check.eligible) report.selectedTokenId = id;
      await persist();
      if (check.eligible) break;
    }
  }
  for (const block of endpoints) {
    await confirmBlock(rpc, tag(block), block);
    await confirmBlock(eventRpc, tag(block), block);
  }
  report.completedAt = new Date().toISOString(); await persist();
  console.log(JSON.stringify({ selectedTokenId: report.selectedTokenId, inspected: report.checks.length + report.fallbackChecks.length, report: output }));
  if (!report.selectedTokenId) process.exitCode = 1;
} catch (error) {
  report.error = error.message; await persist(); throw error;
}
