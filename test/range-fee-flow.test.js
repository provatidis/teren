import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateFeeBatch, calculateFeeFlow, DEFAULT_FEE_FLOW, FEE_FLOW_MODEL, validateFeeFlow, MAX_FEE_BATCHES } from '../public/models/range-fee-flow-v2.js';
import { DEFAULT_WIDTHS, calculateWidthComparison } from '../public/models/range-width.js';
import { widthFlowHash, widthFlowFromHash } from '../public/lib/width-flow-links.js';
import { widthHash } from '../public/lib/width-links.js';
import { readWidthDraft, saveWidthDraft, WIDTH_DRAFT_KEY } from '../public/data/width-draft.js';
import { readExperimentLocation, saveExperimentLocation } from '../public/data/experiment-location.js';

const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(a), Math.abs(b)), a + ' ≠ ' + b);
const batch = (price = 2000, extra = {}) => ({ price, ...DEFAULT_FEE_FLOW, competitorWidth: null, ...extra });
const flow = (batches = [], extra = {}) => ({ ...DEFAULT_FEE_FLOW, enabled: true, batches, ...extra });

test('fee allocation agrees with an independent 1000–4000 range calculation', () => {
  const input = { ...DEFAULT_WIDTHS, investment: 4000, widthA: 150, widthB: 150 };
  const result = allocateFeeBatch(input, batch(2000, { volume: 120000, competition: 50000 }));
  const liquidity = 2000 / (Math.sqrt(2000) - Math.sqrt(1000));
  const other = 50000 / (2 * Math.sqrt(2000));
  const fraction = liquidity / (liquidity + other);
  assert.equal(result.traderFees, 360); assert.equal(result.protocolFees, 60); assert.equal(result.lpFees, 300);
  for (const range of result.ranges) {
    close(range.share, fraction);
    close(range.tokens.eth, 300 * fraction / 4000);
    close(range.tokens.usdc, 150 * fraction);
    close(range.value + range.others + result.protocolFees, result.traderFees);
  }
});
test('alternative B does not compete with A; more competing liquidity lowers fees', () => {
  const first = allocateFeeBatch(DEFAULT_WIDTHS, batch());
  const changedB = allocateFeeBatch({ ...DEFAULT_WIDTHS, widthB: 1 }, batch());
  assert.equal(first.ranges[0].value, changedB.ranges[0].value);
  assert.ok(first.ranges[0].share > first.ranges[1].share);
  const crowded = allocateFeeBatch(DEFAULT_WIDTHS, batch(2000, { competition: 2000000 }));
  first.ranges.forEach((range, index) => assert.ok(crowded.ranges[index].value < range.value));
});
test('fees conserve both tokens separately, including protocol and other LP allocations', () => {
  for (const price of [1, 2000, 2400, 10000000]) for (const protocolDivisor of [0, 4, 6, 10]) {
    const result = allocateFeeBatch(DEFAULT_WIDTHS, batch(price, { protocolDivisor }));
    for (const range of result.ranges) {
      close(range.tokens.eth + (range.others + result.protocolFees) / (2 * price), result.traderFees / (2 * price));
      close(range.tokens.usdc + (range.others + result.protocolFees) / 2, result.traderFees / 2);
      assert.ok(range.share >= 0 && range.share <= 1);
    }
  }
});
test('volume changes fees linearly, zero volume earns nothing, and protocol share is deducted first', () => {
  const zero = allocateFeeBatch(DEFAULT_WIDTHS, batch(2000, { volume: 0 }));
  assert.ok(zero.ranges.every(range => range.value === 0));
  const base = allocateFeeBatch(DEFAULT_WIDTHS, batch());
  const double = allocateFeeBatch(DEFAULT_WIDTHS, batch(2000, { volume: 2000000 }));
  const noProtocol = allocateFeeBatch(DEFAULT_WIDTHS, batch(2000, { protocolDivisor: 0 }));
  base.ranges.forEach((range, i) => {
    close(range.value * 2, double.ranges[i].value);
    close(range.value * 6 / 5, noProtocol.ranges[i].value);
  });
});
test('leaving a range stops new fees but preserves previously earned tokens', () => {
  const first = calculateFeeFlow(DEFAULT_WIDTHS, flow([batch()]));
  const second = calculateFeeFlow(DEFAULT_WIDTHS, flow([batch(), batch(2400)]));
  assert.deepEqual(first.ranges[0].feeTokens, second.ranges[0].feeTokens);
  assert.ok(second.ranges[1].feeTokens.eth > first.ranges[1].feeTokens.eth);
  const outside = calculateFeeFlow({ ...DEFAULT_WIDTHS, futurePrice: 5000 }, flow([batch(), batch(2400), batch(5000)]));
  outside.ranges.forEach((range, i) => {
    assert.deepEqual(range.feeTokens, second.ranges[i].feeTokens);
    close(range.feeValue - second.ranges[i].feeValue, range.feeTokens.eth * 2600);
  });
});
test('a return to the starting price does not invent fee tokens or compound prior earnings', () => {
  const result = calculateFeeFlow({ ...DEFAULT_WIDTHS, futurePrice: 2000 }, flow([batch(), batch()]));
  const one = allocateFeeBatch(DEFAULT_WIDTHS, batch());
  result.ranges.forEach((range, i) => {
    close(range.feeValue, one.ranges[i].value * 2);
    close(range.total, 5000 + range.feeValue);
    close(range.netVsHolding, range.feeValue);
  });
});
test('each batch keeps its own competition, fee and protocol assumptions', () => {
  const entries = [batch(), batch(2400, { volume: 123456, competition: 500000, feeTier: 500, protocolDivisor: 0 })];
  const original = calculateFeeFlow(DEFAULT_WIDTHS, flow(entries));
  const changedPreview = calculateFeeFlow(DEFAULT_WIDTHS, flow(entries, { volume: 1, competition: 1, feeTier: 10000 }));
  assert.deepEqual(original.ranges, changedPreview.ranges);
  assert.notEqual(original.quote.ranges[1].value, changedPreview.quote.ranges[1].value);
});
test('equal/reversed ranges and scaled capital retain the correct comparisons', () => {
  for (let i = 1; i <= 40; i++) {
    const input = { ...DEFAULT_WIDTHS, widthA: i + 1, widthB: 100 + i, futurePrice: 500 + 100 * i };
    const entries = [batch(1000 + 13 * i), batch(2100 + 17 * i)];
    const original = calculateFeeFlow(input, flow(entries));
    const reverse = calculateFeeFlow({ ...input, widthA: input.widthB, widthB: input.widthA }, flow(entries));
    const scaled = calculateFeeFlow({ ...input, investment: input.investment * 3 }, flow(entries.map(entry => ({ ...entry, volume: entry.volume * 3, competition: entry.competition * 3 }))));
    original.ranges.forEach((range, index) => {
      assert.deepEqual(range.feeTokens, reverse.ranges[1 - index].feeTokens);
      close(range.feeValue * 3, scaled.ranges[index].feeValue);
      close(range.total - original.comparison.holdValue, range.netVsHolding);
      close(range.total - input.investment, range.dollarChange);
    });
  }
});
test('boundary quotes are identified; saved batches at exact edges are rejected', () => {
  for (const range of calculateWidthComparison(DEFAULT_WIDTHS).ranges) {
    for (const price of [range.lowerPrice, range.upperPrice]) {
      assert.equal(allocateFeeBatch(DEFAULT_WIDTHS, batch(price)).atEdge, true);
      assert.throws(() => calculateFeeFlow(DEFAULT_WIDTHS, flow([batch(price)])), /range edge/);
    }
  }
});
test('strict bounded fee inputs reject malformed state and retain finite extreme outputs', () => {
  for (const extra of [{ volume: NaN }, { volume: -1 }, { competition: 0 }, { feeTier: 42 }, { protocolDivisor: 1 }, { enabled: 'yes' }, { batches: Array(9).fill(batch()) }]) {
    assert.throws(() => validateFeeFlow(flow([], extra)));
  }
  const result = calculateFeeFlow({ ...DEFAULT_WIDTHS, futurePrice: 1e7 }, flow([batch(.01, { volume: 1e9, competition: 1 })]));
  assert.ok(result.ranges.every(range => Number.isFinite(range.total)));
});
test('versioned links round-trip every batch and keep old width links compatible', () => {
  const state = flow([batch(), batch(2400.123, { competition: 12345.678 })]);
  const link = widthFlowHash(DEFAULT_WIDTHS, state);
  assert.deepEqual(widthFlowFromHash(link), { inputs: DEFAULT_WIDTHS, flow: validateFeeFlow(state) });
  assert.deepEqual(widthFlowFromHash(widthHash(DEFAULT_WIDTHS)), { inputs: DEFAULT_WIDTHS, flow: null });
  const maximum = widthFlowHash(DEFAULT_WIDTHS, flow(Array(MAX_FEE_BATCHES).fill(batch(2345.123456789))));
  assert.ok(maximum.length < 2400);
  for (const bad of [link + '&a=30', link + '&flow=[]', link + '&unknown=1', link.replace('flow=', 'data='), link.replace(FEE_FLOW_MODEL, 'cl-width-fees-v9')]) {
    assert.throws(() => widthFlowFromHash(bad));
  }
});
test('drafts migrate on edit, preserve corrupt records, and Home resumes the complete fee link', () => {
  const values = new Map(), getStorage = () => ({ getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) });
  saveWidthDraft(DEFAULT_WIDTHS, getStorage);
  assert.equal(JSON.parse(values.get(WIDTH_DRAFT_KEY)).version, 1);
  const state = flow([batch()]); saveWidthDraft(DEFAULT_WIDTHS, getStorage, state);
  assert.equal(JSON.parse(values.get(WIDTH_DRAFT_KEY)).version, 3);
  assert.deepEqual(readWidthDraft(getStorage).flow, validateFeeFlow(state));
  const hash = widthFlowHash(DEFAULT_WIDTHS, state);
  saveExperimentLocation(FEE_FLOW_MODEL, hash, getStorage);
  assert.equal(readExperimentLocation(getStorage).route, 'liquidity.html' + hash);
  values.set(WIDTH_DRAFT_KEY, JSON.stringify({ version: 2, inputs: DEFAULT_WIDTHS, flow: { enabled: true } }));
  assert.equal(readWidthDraft(getStorage).status, 'invalid');
  assert.ok(values.get(WIDTH_DRAFT_KEY).includes('enabled'));
});

test('equal ranges divide fees by capital; concentrating the same competitor capital dilutes our share', () => {
  const matched = allocateFeeBatch(DEFAULT_WIDTHS, batch(2000, { competitorWidth: 20 }));
  close(matched.ranges[0].share, 5000 / 1005000);
  const full = allocateFeeBatch(DEFAULT_WIDTHS, batch());
  close(full.ranges[0].share, 0.09312433650459242);
  let previous = full.ranges[0].share;
  for (const competitorWidth of [400, 100, 20, 1]) {
    const quote = allocateFeeBatch(DEFAULT_WIDTHS, batch(2000, { competitorWidth }));
    assert.ok(quote.ranges[0].share < previous);
    assert.equal(quote.competition, full.competition);
    previous = quote.ranges[0].share;
  }
});

test('concentrated competitors agree with independently funded liquidity and conserve both input tokens', () => {
  const input = { ...DEFAULT_WIDTHS, investment: 4000, widthA: 150, widthB: 100 };
  for (const protocolDivisor of [0, 4, 6, 10]) {
    const quote = allocateFeeBatch(input, batch(2000, { competitorWidth: 150, competition: 50000, volume: 120000, protocolDivisor }));
    const liquidity = 25000 / (Math.sqrt(2000) - Math.sqrt(1000));
    close(quote.otherLiquidity, liquidity);
    close(quote.ranges[0].share, 4000 / 54000);
    for (const range of quote.ranges) {
      close(range.value + range.others + quote.protocolFees, quote.traderFees);
      close(range.tokens.eth + (range.others + quote.protocolFees) / 4000, quote.traderFees / 4000);
      close(range.tokens.usdc + (range.others + quote.protocolFees) / 2, quote.traderFees / 2);
    }
  }
});

test('an inactive competitor earns nothing, but a pool with no active LPs cannot receive a batch', () => {
  const bothActive = { ...DEFAULT_WIDTHS, widthA: 100, widthB: 200 };
  const quote = allocateFeeBatch(bothActive, batch(2400, { competitorWidth: 20 }));
  assert.equal(quote.competitors.active, false);
  assert.equal(quote.otherLiquidity, 0);
  assert.equal(quote.unavailable, false);
  for (const range of quote.ranges) {
    assert.equal(range.share, 1);
    assert.equal(range.others, 0);
  }
  const missingA = allocateFeeBatch(DEFAULT_WIDTHS, batch(2400, { competitorWidth: 20 }));
  assert.equal(missingA.unavailable, true);
  assert.equal(missingA.ranges[0].available, false);
  assert.equal(missingA.ranges[0].others, 0);
  assert.throws(() => calculateFeeFlow(DEFAULT_WIDTHS, flow([batch(2400, { competitorWidth: 20 })])), /no active LPs/);
  assert.throws(() => calculateFeeFlow(DEFAULT_WIDTHS, flow([batch(5000, { competitorWidth: 100 })])), /no active LPs/);
});

test('competitor boundaries are fixed around the starting price and reject exact-edge batches', () => {
  const entries = [1900, 2000, 2100].map(price => allocateFeeBatch(DEFAULT_WIDTHS, batch(price, { competitorWidth: 70 })));
  for (const entry of entries) assert.deepEqual(entry.competitors.bounds, entries[0].competitors.bounds);
  for (const price of Object.values(entries[0].competitors.bounds)) {
    assert.equal(allocateFeeBatch(DEFAULT_WIDTHS, batch(price, { competitorWidth: 70 })).atEdge, true);
    assert.throws(() => calculateFeeFlow(DEFAULT_WIDTHS, flow([batch(price, { competitorWidth: 70 })])), /range edge/);
  }
});

test('batches retain their own competitor width; a preview change does not rewrite accrued fees', () => {
  const batches = [batch(2000, { competitorWidth: null }), batch(2000, { competitorWidth: 20 })];
  const first = calculateFeeFlow(DEFAULT_WIDTHS, flow(batches, { competitorWidth: 100 }));
  const preview = calculateFeeFlow(DEFAULT_WIDTHS, flow(batches, { competitorWidth: 20 }));
  assert.deepEqual(first.ranges, preview.ranges);
  assert.ok(first.batches[0].ranges[0].value > first.batches[1].ranges[0].value);
  assert.equal(preview.quote.unavailable, true);
});

test('legacy fee links and drafts preserve full-range assumptions and the same fee quantities', () => {
  const parameters = new URLSearchParams(widthHash(DEFAULT_WIDTHS).slice(1));
  parameters.set('width', 'cl-width-fees-v1');
  parameters.set('flow', JSON.stringify([true, 1000000, 1000000, 3000, 6, [[2000, 1000000, 1000000, 3000, 6]]]));
  const parsed = widthFlowFromHash('#' + parameters);
  assert.equal(parsed.flow.competitorWidth, null);
  assert.equal(parsed.flow.batches[0].competitorWidth, null);
  const reference = calculateFeeFlow(DEFAULT_WIDTHS, flow([batch()], { competitorWidth: null }));
  assert.deepEqual(calculateFeeFlow(parsed.inputs, parsed.flow).ranges, reference.ranges);
  const oldFlow = { ...parsed.flow, batches: parsed.flow.batches.map(({ competitorWidth, ...old }) => old) };
  delete oldFlow.competitorWidth;
  const getStorage = () => ({ getItem: () => JSON.stringify({ version: 2, inputs: DEFAULT_WIDTHS, flow: oldFlow }) });
  assert.deepEqual(readWidthDraft(getStorage).flow, parsed.flow);
  const upgraded = widthFlowFromHash(widthFlowHash(parsed.inputs, parsed.flow));
  assert.deepEqual(upgraded, parsed);
});

test('new links retain independent competitor widths and reject malformed versioned tuples', () => {
  const state = flow([batch(), batch(2000, { competitorWidth: 1.23456789 })], { competitorWidth: 50.123456789 });
  const link = widthFlowHash(DEFAULT_WIDTHS, state);
  assert.deepEqual(widthFlowFromHash(link).flow, validateFeeFlow(state));
  for (const value of [0, 401, NaN, Infinity, '20']) assert.throws(() => validateFeeFlow(flow([], { competitorWidth: value })));
  const parameters = new URLSearchParams(link.slice(1));
  const values = JSON.parse(parameters.get('flow'));
  values[5][0].pop(); parameters.set('flow', JSON.stringify(values));
  assert.throws(() => widthFlowFromHash('#' + parameters), /not supported/);
});
