import test from 'node:test';
import assert from 'node:assert/strict';
import { usd, signedUSD, compactUSD } from '../public/lib/format.js';

test('currency totals and differences place the same minus before the currency symbol', () => {
  assert.equal(usd(-912.27), '−$912.27');
  assert.equal(signedUSD(-912.27), '−$912.27');
  assert.equal(usd(1234.56), '$1,234.56');
  assert.equal(signedUSD(1234.56), '+$1,234.56');
});

test('currency signs reflect the displayed cents, including rounding boundaries', () => {
  for (const value of [-0, 0, -0.0049, 0.0049]) {
    assert.equal(usd(value), '$0.00');
    assert.equal(signedUSD(value), '$0.00');
  }
  assert.equal(usd(-0.005), '−$0.01');
  assert.equal(signedUSD(-0.005), '−$0.01');
  assert.equal(signedUSD(0.005), '+$0.01');
  assert.equal(usd(-1.005), '−$1.01');
});

test('compact currency uses the same minus without showing negative zero', () => {
  assert.equal(compactUSD(-912.27), '−$912.3');
  assert.equal(compactUSD(-1_250_000), '−$1.3M');
  assert.match(compactUSD(35_000_000_000_000), /^\$35(?:\.0)?T$/);
  assert.equal(compactUSD(-35_000_000_000_000), '−' + compactUSD(35_000_000_000_000));
  for (const value of [-0, 0, -0.049, 0.049]) assert.equal(compactUSD(value), '$0');
  assert.equal(compactUSD(-0.05), '−$0.1');
});
