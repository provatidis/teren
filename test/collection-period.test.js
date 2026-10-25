import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCollectionPeriod } from '../public/models/collection-period.js';
import { Q128 } from '../public/models/v3-fees.js';
import { sqrtRatioAtTick } from '../public/models/tick-math.js';

const point = (time, growth, claim = growth, available = claim) => ({
  liquidity: 1n, tickLower: -60, tickUpper: 60, tick: 0, sqrtPriceX96: sqrtRatioAtTick(0),
  timestamp: 1000 + time, secondsInside: BigInt(time),
  growth: { global0: growth * Q128, global1: growth * Q128, lower0: 0n, lower1: 0n, upper0: 0n, upper1: 0n },
  claim0: claim, claim1: claim, available0: available, available1: available,
});
const collection = (debit, paid = debit) => ({ debit0: debit, debit1: debit, paid0: paid, paid1: paid });

test('subtracts old claims, including old removed principal, from collected income', () => {
  const result = calculateCollectionPeriod(point(0, 10n, 110n), point(10, 30n, 5n), [collection(125n)]);
  assert.equal(result.earned0, 20n);
  assert.equal(result.collected0, 125n);
  assert.equal(result.credited0, 20n);
});
test('partial and repeated collections retain the same income and principal', () => {
  const start = point(0, 10n, 110n);
  const complete = calculateCollectionPeriod(start, point(10, 30n, 0n), [collection(130n)]);
  const partial = calculateCollectionPeriod(start, point(10, 30n, 80n), [collection(20n), collection(30n)]);
  assert.equal(partial.earned0, complete.earned0);
  assert.deepEqual(partial.principal, complete.principal);
});
test('actual pool payments retain collection rounding losses', () => {
  const result = calculateCollectionPeriod(point(0, 0n), point(10, 10n, 0n), [collection(10n, 8n)]);
  assert.equal(result.earned0, 8n);
  assert.equal(result.collectionRoundingLoss0, 2n);
  assert.equal(result.growthEarned0, 10n);
});
test('simulation shortfalls at both endpoints stay in the cash-flow balance', () => {
  const result = calculateCollectionPeriod(point(0, 10n, 10n, 9n), point(10, 20n, 5n, 3n), [collection(15n, 14n)]);
  assert.equal(result.earned0, 8n);
});
test('zero growth can retain a signed dust loss; it is not silently clamped', () => {
  const result = calculateCollectionPeriod(point(0, 10n), point(10, 10n, 0n), [collection(10n, 9n)]);
  assert.equal(result.earned0, -1n);
});
test('rounding allowance grows only with actual accounting updates', () => {
  const start = point(0, 0n), end = point(10, 10n, 8n);
  assert.throws(() => calculateCollectionPeriod(start, end, []), /disagrees/);
  assert.throws(() => calculateCollectionPeriod(start, end, [collection(0n)]), /disagrees/);
  assert.equal(calculateCollectionPeriod(start, end, [collection(0n), collection(0n)]).earned0, 8n);
});
test('rejects impossible payments, claims, changed liquidity and range time', () => {
  assert.throws(() => calculateCollectionPeriod(point(0, 0n), point(10, 10n), [collection(1n, 2n)]), /Invalid collected/);
  assert.throws(() => calculateCollectionPeriod(point(0, 0n), point(10, 10n, 10n, 11n), []), /entitlement/);
  assert.throws(() => calculateCollectionPeriod(point(0, 0n), { ...point(10, 10n), liquidity: 2n }, []), /unchanged/);
  assert.throws(() => calculateCollectionPeriod(point(0, 0n), { ...point(10, 10n), secondsInside: 11n }, []), /Range time/);
});
test('fee growth wrapping preserves collected income', () => {
  const start = point(0, 0n, 20n), end = point(10, 0n, 23n);
  start.growth.global0 = (1n << 256n) - 2n * Q128;
  end.growth.global0 = Q128;
  start.growth.global1 = 0n; end.growth.global1 = 3n * Q128;
  assert.equal(calculateCollectionPeriod(start, end, []).earned0, 3n);
});
