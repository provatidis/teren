import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWidthComparison, centeredBounds, DEFAULT_WIDTHS, WIDTH_LIMITS, validateWidths, widthPriceDomain } from '../public/models/range-width.js';
import { widthHash, widthsFromHash, isWidthHash } from '../public/lib/width-links.js';
import { WIDTH_DRAFT_KEY, readWidthDraft, saveWidthDraft } from '../public/data/width-draft.js';

const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(a), Math.abs(b)), a + ' ≠ ' + b);
test('reciprocal bounds preserve the declared span and the same 50/50 starting basket', () => {
  for (const price of [1, 2000, 1e6]) for (const width of [1, 12.345, 20, 100, 400]) {
    const bounds = centeredBounds(price, width);
    close(bounds.lowerPrice * bounds.upperPrice, price ** 2);
    close((bounds.upperPrice - bounds.lowerPrice) / price * 100, width);
    const result = calculateWidthComparison({ ...DEFAULT_WIDTHS, initialPrice: price, futurePrice: price, widthA: width });
    for (const range of result.ranges) {
      close(range.initialEthPercent, 50);
      assert.deepEqual(range.initial, result.initial);
      assert.equal(range.lpValue, result.investment);
      assert.equal(range.breakEvenFees, 0);
    }
  }
});
test('an independently worked 1000–4000 range has the expected lower-edge inventory', () => {
  const result = calculateWidthComparison({ investment: 4000, initialPrice: 2000, futurePrice: 1000, widthA: 150, widthB: 150 });
  const liquidity = 2000 / (Math.sqrt(2000) - Math.sqrt(1000));
  const eth = liquidity * (1 / Math.sqrt(1000) - 1 / Math.sqrt(4000));
  close(result.ranges[0].pooled.eth, eth);
  assert.equal(result.ranges[0].pooled.usdc, 0);
  assert.equal(result.holdValue, 3000);
  close(result.ranges[0].breakEvenFees, 3000 - eth * 1000);
});
test('width changes depletion and the fee hurdle without changing capital or holding', () => {
  const result = calculateWidthComparison(DEFAULT_WIDTHS);
  const [a, b] = result.ranges;
  assert.equal(a.state, 'above'); assert.equal(b.state, 'inside');
  assert.equal(a.pooled.eth, 0); assert.ok(b.pooled.eth > 0);
  assert.ok(a.breakEvenFees > b.breakEvenFees);
  for (const range of result.ranges) {
    assert.equal(range.fees, 0);
    assert.ok(range.lpReturn > 0 && range.difference < 0, 'Dollar gains can still trail holding.');
    close(range.lpValue + range.breakEvenFees, result.holdValue);
  }
});
test('equal widths match; reversing A and B only exchanges outcomes', () => {
  for (const futurePrice of [100, 1800, 2000, 5000, 1e7]) {
    const equal = calculateWidthComparison({ ...DEFAULT_WIDTHS, futurePrice, widthB: DEFAULT_WIDTHS.widthA });
    assert.equal(equal.ranges[0].lpValue, equal.ranges[1].lpValue);
    const normal = calculateWidthComparison({ ...DEFAULT_WIDTHS, futurePrice });
    const reversed = calculateWidthComparison({ ...DEFAULT_WIDTHS, futurePrice, widthA: DEFAULT_WIDTHS.widthB, widthB: DEFAULT_WIDTHS.widthA });
    assert.equal(normal.ranges[0].lpValue, reversed.ranges[1].lpValue);
    assert.equal(normal.ranges[1].breakEvenFees, reversed.ranges[0].breakEvenFees);
  }
});
test('shared-capital comparisons conserve value at the start, scale, and cover both boundaries', () => {
  for (let index = 1; index <= 80; index++) {
    const input = { investment: 25 * index, initialPrice: 1000, futurePrice: 50 + index * 80, widthA: 1 + index, widthB: 100 + index * 3 };
    const result = calculateWidthComparison(input);
    const scaled = calculateWidthComparison({ ...input, investment: input.investment * 7 });
    const domain = widthPriceDomain(input);
    result.ranges.forEach((range, i) => {
      close(range.lpValue * 7, scaled.ranges[i].lpValue);
      close(range.breakEvenFees * 7, scaled.ranges[i].breakEvenFees);
      assert.ok(range.difference <= 1e-8 && range.pooled.eth >= 0 && range.pooled.usdc >= 0);
      assert.ok(domain.low < range.lowerPrice && domain.high > range.upperPrice);
    });
    assert.ok(domain.low <= input.futurePrice && domain.high >= input.futurePrice);
  }
});
test('shared links preserve fractional inputs and reject invalid or extra parameters', () => {
  const input = { ...DEFAULT_WIDTHS, futurePrice: 2345.6789, widthA: 12.345 };
  const hash = widthHash(input);
  assert.deepEqual(widthsFromHash(hash), input);
  assert.equal(widthsFromHash('#compare-widths'), null);
  assert.ok(isWidthHash('#compare-widths') && isWidthHash(hash));
  for (const invalid of [hash + '&a=20', hash + '&fees=500', hash.replace('cl-width-v1', 'cl-width-v2'), hash.replace('capital=5000', 'capital=')]) {
    assert.throws(() => widthsFromHash(invalid));
  }
  for (const [key, limit] of Object.entries(WIDTH_LIMITS)) for (const value of [NaN, Infinity, limit.min - 1, limit.max + 1]) {
    assert.throws(() => validateWidths({ ...input, [key]: value }));
  }
});
test('local drafts are isolated, validated and tolerate unavailable or corrupt storage', () => {
  const data = new Map([['unrelated', 'keep']]);
  const storage = () => ({ getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) });
  assert.equal(readWidthDraft(storage).status, 'empty');
  assert.equal(saveWidthDraft(DEFAULT_WIDTHS, storage), true);
  assert.deepEqual(readWidthDraft(storage).inputs, DEFAULT_WIDTHS);
  data.set(WIDTH_DRAFT_KEY, '{broken');
  assert.equal(readWidthDraft(storage).status, 'invalid');
  assert.equal(data.get(WIDTH_DRAFT_KEY), '{broken');
  assert.equal(data.get('unrelated'), 'keep');
  const blocked = () => { throw new Error('Blocked'); };
  assert.equal(readWidthDraft(blocked).status, 'unavailable');
  assert.equal(saveWidthDraft(DEFAULT_WIDTHS, blocked), false);
});
