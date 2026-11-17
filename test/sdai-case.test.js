import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadSdaiCase, summarizeSdaiCase } from '../public/data/sdai-case.js';

const capture = await readFile(new URL('../public/examples/pendle-sdai-march-2024.json', import.meta.url), 'utf8');
const record = JSON.parse(capture);

test('archived swap fills reconcile with settlement, expiry and the separate flat-rate scenario', () => {
  const result = summarizeSdaiCase(record);
  const historical = record.budgets['100'].outcomes['19529386'];
  for (const [key, recordedName] of [['pt', 'PT'], ['yt', 'YT'], ['hold', 'hold']]) {
    assert.equal(result.small[key].toFixed(2), Number(historical[recordedName]).toFixed(2));
  }
  assert.equal(result.original.pt.toFixed(2), Number(record.budgets['1000'].PT).toFixed(2));
  assert.equal(result.original.hold.toFixed(2), Number(record.budgets['1000'].hold).toFixed(2));
  assert.equal(result.original.yt, null);
  assert.equal(result.maximumYtDai.toFixed(2), '201.05');
  assert.equal(result.ytUnits, 22712.613887);
  assert.equal(result.flatYtDai.toFixed(2), '88.53');
  assert.equal(result.expiryYtDai.toFixed(2), '183.38');
  assert.equal(result.settlementDelaySeconds, 5807);
  assert.deepEqual([result.entrySavingsApy, result.changedSavingsApy, result.feePercent], [5, 15, 3]);
  assert.equal(result.entryImpliedApy.toFixed(2), '5.35');
  assert.equal(result.periodYieldPercent.toFixed(4), '0.8324');
  assert.equal(result.annualizedYieldPercent.toFixed(2), '10.61');
});

test('a settlement redemption preview cannot stand in for the prompt expiry preview', () => {
  const mixed = structuredClone(record);
  mixed.reads.yt_sale_claim_100_19528924 = mixed.reads.yt_sale_claim_100_19529386;
  assert.throws(() => summarizeSdaiCase(mixed), /recorded accounting/);
});

test('the case loader accepts only the exact published capture', async context => {
  const fetch = globalThis.fetch;
  let body = capture;
  context.mock.method(globalThis, 'fetch', (url, options) => {
    assert.match(url.pathname, /\/examples\/pendle-sdai-march-2024\.json$/);
    return fetch('data:application/json;base64,' + Buffer.from(body).toString('base64'), options);
  });
  assert.equal((await loadSdaiCase()).small.yt.toFixed(2), '183.96');
  // Extra whitespace leaves both the JSON and the arithmetic valid.
  body = capture + '\n';
  await assert.rejects(loadSdaiCase());
});
