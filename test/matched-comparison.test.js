import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateMatchedComparison } from '../public/data/matched-comparison.js';
import { collectionDayView, collectionDayInterval } from '../public/lib/matched-comparison.js';
import { validateComparisonSelection } from '../scripts/lib/comparison-selection.js';
import { workspaceFromHash } from '../public/lib/workspace-links.js';
import { isLiquidityEntry } from '../public/lib/entry-links.js';

const raw = JSON.parse(await readFile(new URL('../public/examples/uniswap-v3-matched-week.json', import.meta.url), 'utf8'));
const comparison = validateMatchedComparison(raw);
const planBytes = await readFile(new URL('../scripts/replay-comparison-plan.json', import.meta.url), 'utf8');
const plan = JSON.parse(planBytes), planHash = createHash('sha256').update(planBytes).digest('hex');
const selection = JSON.parse(await readFile(new URL('../docs/evidence/comparison-selection.json', import.meta.url), 'utf8'));

test('published comparison keeps the predeclared pair and full receipt evidence', () => {
  assert.deepEqual(comparison, raw);
  assert.deepEqual(comparison.records.map(item => item.record.id), ['position-1377928', 'position-1375047']);
  assert.equal(comparison.records[1].record.receipts.length, 1);
  assert.equal(comparison.records[1].record.receipts[0].logs.length, 7);
  assert.equal(comparison.records[0].record.collections.length, 0);
  assert.equal(workspaceFromHash('#fee-comparison'), 'replay');
  assert.equal(isLiquidityEntry('#fee-comparison'), true);
});
test('actual cash-flow income agrees with the captured accounting', () => {
  const [a, b] = comparison.records.map(item => collectionDayView(item.record, 7));
  assert.deepEqual([a.earned0, a.earned1], [18857244n, 8577209355539933n]);
  assert.deepEqual([b.earned0, b.earned1], [8917228n, 4125861114329493n]);
  assert.equal(a.secondsInRange, 144024);
  assert.equal(b.secondsInRange, 604800);
  assert.ok(a.feesUSD > b.feesUSD && a.feePercent < b.feePercent);
  assert.ok(a.gapUSD < 0 && b.gapUSD > 0 && a.lpChangeUSD < 0 && b.lpChangeUSD < 0);
});
test('each range keeps its own starting basket and cumulative daily credits', () => {
  for (const { record } of comparison.records) {
    const start = collectionDayView(record, 0), end = collectionDayView(record, 7);
    assert.equal(start.gapUSD, 0); assert.equal(start.lpChangeUSD, 0); assert.equal(start.feesUSD, 0);
    const days = Array.from({ length: 7 }, (_, index) => collectionDayInterval(record, index + 1));
    assert.equal(days.reduce((sum, item) => sum + item.earned0, 0n), end.earned0);
    assert.equal(days.reduce((sum, item) => sum + item.earned1, 0n), end.earned1);
    assert.equal(days.reduce((sum, item) => sum + item.secondsInRange, 0), end.secondsInRange);
  }
  assert.notDeepEqual(collectionDayView(comparison.records[0].record, 0).holding, collectionDayView(comparison.records[1].record, 0).holding);
});
test('comparison rejects changed dates, groups and incomplete pairs', () => {
  for (const mutate of [r => r.records.pop(), r => r.records.reverse(), r => { r.records[0].group = 'wider'; },
    r => { r.plan.startUTC = '2026-10-11T00:00:00.000Z'; }, r => { r.records[1] = r.records[0]; }]) {
    const input = structuredClone(raw); mutate(input); assert.throws(() => validateMatchedComparison(input));
  }
});
test('selection audit keeps all 2,929 decisions in declared order', () => {
  assert.equal(validateComparisonSelection(selection, plan, planHash).checks.length, 2929);
  for (const mutate of [r => r.checks.splice(2, 1), r => { r.selected.narrower = '1375047'; },
    r => { r.planSHA256 = '0'.repeat(64); }, r => { r.error = 'provider unavailable'; },
    r => { r.startTick = 0; }, r => { r.boundaries[2].previousBlock.number = '1'; }]) {
    const input = structuredClone(selection); mutate(input);
    assert.throws(() => validateComparisonSelection(input, plan, planHash));
  }
  assert.equal(createHash('sha256').update(JSON.stringify(selection)).digest('hex'), comparison.selectionSHA256);
});
test('original local declaration precedes reads and preserves the published plan tree', async () => {
  const declaration = await readFile(new URL('../docs/evidence/comparison-declaration.txt', import.meta.url), 'utf8');
  const hash = createHash('sha1').update('commit ' + Buffer.byteLength(declaration) + '\0' + declaration).digest('hex');
  assert.equal(hash, selection.declarationCommit);
  const committed = Number(declaration.match(/^committer .+ (\d+) [+-]\d+$/m)[1]) * 1000;
  assert.ok(committed < Date.parse(selection.startedAt));
  assert.match(declaration, /^tree 1ca95c0488de9e109ce54ac1990d74da03c03901$/m);
});
