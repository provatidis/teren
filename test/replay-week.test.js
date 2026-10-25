import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateRecordedCase, recordedPeriod } from '../public/data/position-history.js';
import { periodPointView, periodIntervalView, periodDuration } from '../public/lib/period-presentation.js';
import { positionScenario } from '../public/data/position-snapshot.js';
import { validateWeekSelection, validateWeekSegment } from '../scripts/lib/week-selection.js';
import { readReplayEvents } from '../scripts/lib/replay-events.js';

const planBytes = await readFile(new URL('../scripts/replay-week-plan.json', import.meta.url), 'utf8');
const plan = JSON.parse(planBytes), planHash = createHash('sha256').update(planBytes).digest('hex');
const selection = JSON.parse(await readFile(new URL('../docs/evidence/week-selection.json', import.meta.url), 'utf8'));
const record = validateRecordedCase(JSON.parse(await readFile(new URL('../public/examples/uniswap-v3-position-week.json', import.meta.url), 'utf8')));

test('the recorded week retains its fixed dates, complete daily evidence and exact zero fees', () => {
  const period = recordedPeriod(record);
  assert.equal(record.segments.length, 7);
  assert.equal(period.points.length, 8);
  assert.equal(period.eventQueries.length, 105);
  assert.deepEqual(period.validation.earnedRaw, ['0', '0']);
  assert.deepEqual(period.validation.collectDeltaRaw, ['0', '0']);
  assert.equal(period.validation.durationSeconds, 604800);
  assert.equal(period.validation.secondsInRange, 0);
  const blocks = ['26172658', '26179842', '26187015', '26194189', '26201365', '26208547', '26215722', '26222896'];
  assert.deepEqual(period.points.map(point => point.snapshot.block.number), blocks);
  for (let index = 0; index < 8; index++) {
    const view = periodPointView(period, index);
    assert.equal(view.durationSeconds, index * 86400);
    assert.equal(view.state, 'below');
    assert.deepEqual(view.principal, { amount0: 0n, amount1: 55672026415822610n });
    assert.deepEqual(view.principal, view.holding);
    assert.equal(view.gapUSD, 0);
    if (index) {
      const interval = periodIntervalView(period, index);
      assert.equal(interval.durationSeconds, 86400);
      assert.equal(interval.secondsInRange, 0);
      assert.equal(interval.earned0 + interval.earned1, 0n);
    }
  }
  assert.equal(periodDuration(604800), '7d');
  assert.equal(periodDuration(120468), '33h 27m 48s', 'Keep earlier case duration labels compatible.');
});

test('matching holding can coexist with a dollar loss and the checkpoint handoff adds no past fees', () => {
  const period = recordedPeriod(record), last = periodPointView(period, 7);
  assert.ok(Math.abs(last.startingUSD - 140.75177475082478) < 1e-10);
  assert.ok(Math.abs(last.lpUSD - 133.79576237112227) < 1e-10);
  assert.ok(Math.abs(last.lpChangeUSD + 6.956012379702514) < 1e-10);
  assert.equal(last.lpChangeUSD, last.holdingChangeUSD);
  assert.equal(last.gapUSD, 0);
  const handoff = positionScenario(last.point.snapshot);
  assert.equal(handoff.fees, 0);
  assert.equal(handoff.fullRangeFees, 0);
  assert.equal(handoff.initialPrice, handoff.futurePrice);
  assert.ok(Math.abs(handoff.investment - last.principalUSD) < 1e-10);
});

test('selection proves the declared order and first blocks at each UTC boundary', () => {
  const selected = validateWeekSelection(selection, plan, planHash);
  assert.equal(selected.tokenId, '1375090');
  assert.equal(selection.fallbackChecks.length, 90);
  assert.equal(selection.checks.length, 2);
  assert.equal(selection.checks[0].endpointAccountingMatches, false);
  assert.deepEqual(selection.checks[1].endpointLiquidity, ['0', '0']);
  for (const entry of selection.boundaries) {
    assert.equal(entry.block.timestamp * 1000 - Date.parse(entry.requestedAt), 11000);
    assert.ok(entry.previousBlock.timestamp * 1000 < Date.parse(entry.requestedAt));
  }
  for (const mutate of [
    r => { r.planSHA256 = '0'.repeat(64); },
    r => { r.error = 'provider unavailable'; },
    r => { r.boundaries[1].requestedAt = r.boundaries[0].requestedAt; },
    r => { r.boundaries[0].previousBlock.number = String(BigInt(r.boundaries[0].block.number) - 2n); },
    r => { r.boundaries[0].previousBlock.timestamp = r.boundaries[0].block.timestamp; },
    r => { r.fallbackChecks.splice(2, 1); },
    r => { r.fallbackChecks[0].eligible = true; },
    r => { r.fallbackChecks.at(-1).eventQueries.pop(); },
    r => { r.fallbackChecks.at(-1).eventQueries[0].matchingEvents = 1; },
    r => { r.selectedTokenId = '37'; },
  ]) {
    const changed = structuredClone(selection); mutate(changed);
    assert.throws(() => validateWeekSelection(changed, plan, planHash));
  }
});

test('resuming capture accepts only validated segments with the declared identity and boundaries', () => {
  const { tokenId, blocks } = validateWeekSelection(selection, plan, planHash);
  const segment = record.segments[0];
  assert.deepEqual(validateWeekSegment(segment, tokenId, blocks[0], blocks[1]), segment);
  assert.throws(() => validateWeekSegment(segment, '37', blocks[0], blocks[1]), /position differs/);
  assert.throws(() => validateWeekSegment(segment, tokenId, blocks[1], blocks[2]), /starting boundary/);
  const changed = structuredClone(segment); changed.points[1].snapshot.block.hash = '0x' + 'f'.repeat(64);
  assert.throws(() => validateWeekSegment(changed, tokenId, blocks[0], blocks[1]), /ending boundary/);
  changed.eventQueries.pop();
  assert.throws(() => validateWeekSegment(changed, tokenId, blocks[0], blocks[1]), /continuity/);
});

const reply = result => new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }));
test('historical event reads retry temporary failures without changing query coverage', async () => {
  const filter = { fromBlock: '0x1', toBlock: '0x2' }, requests = [], retries = [];
  const result = await readReplayEvents('https://rpc.mevblocker.io', filter, {
    retryDelayMs: 0, onRetry: attempt => retries.push(attempt),
    fetchImpl: async (_, request) => {
      requests.push(JSON.parse(request.body));
      assert.equal(request.credentials, 'omit');
      if (requests.length === 1) throw new DOMException('Timeout', 'TimeoutError');
      if (requests.length === 2) return new Response('', { status: 429 });
      if (requests.length === 3) return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32005, message: 'Rate limit' } }));
      return reply([]);
    },
  });
  assert.deepEqual(result, []);
  assert.deepEqual(retries, [1, 2, 3]);
  assert.ok(requests.every(request => request.method === 'eth_getLogs' && JSON.stringify(request.params) === JSON.stringify([filter])));
});

test('invalid evidence is not retried and persistent data failures stay failures', async () => {
  for (const value of [
    { jsonrpc: '2.0', id: 2, result: [] },
    { jsonrpc: '2.0', id: 1, result: null },
    { jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'History unavailable' } },
  ]) {
    let calls = 0;
    await assert.rejects(readReplayEvents('https://rpc.mevblocker.io', {}, { retryDelayMs: 0, fetchImpl: async () => { calls++; return new Response(JSON.stringify(value)); } }));
    assert.equal(calls, 1);
  }
  let calls = 0;
  await assert.rejects(readReplayEvents('https://rpc.mevblocker.io', {}, { retryDelayMs: 0, fetchImpl: async () => { calls++; throw new TypeError('Network unavailable'); } }));
  assert.equal(calls, 4);
  assert.deepEqual(await readReplayEvents('https://rpc.mevblocker.io', {}, { fetchImpl: async () => reply([{ blockNumber: '0x2' }]) }), [{ blockNumber: '0x2' }], 'Never discard an update event to make a candidate eligible.');
});
