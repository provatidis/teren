import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { feeTarget, recordedFeeContext, FEE_WINDOWS } from '../public/lib/fee-context-state.js';
import { calculateScenario } from '../public/models/cp50-v1.js';
import { calculateRange, DEFAULT_RANGE } from '../public/models/cl-range-v1.js';
import { validatePositionPeriod } from '../public/data/position-period.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('fee context distinguishes total target from the gap after assumed fees', () => {
  const result = Object.freeze(calculateScenario({ investment: 5000, initialPrice: 2000, futurePrice: 4000, fees: 100 }));
  const target = feeTarget(result);
  near(target.total, 428.9321881345245);
  near(target.percent, 8.57864376269049);
  near(target.remaining, 328.9321881345245);
  assert.equal(target.assumed, 100);
  near(target.daily * 30, target.total);
  assert.equal(result.fees, 100);
});

test('changing the chosen duration changes only the required average, never the fee assumption or target', () => {
  const input = Object.freeze(calculateRange(DEFAULT_RANGE));
  for (const days of FEE_WINDOWS) {
    const result = feeTarget(input, days);
    assert.equal(result.total, input.breakEvenFees);
    assert.equal(result.assumed, input.fees);
    near(result.daily * days, input.breakEvenFees);
    assert.equal(result.percent, input.breakEvenFees / input.investment * 100);
  }
});

test('zero target and fees above target do not produce a negative remaining hurdle', () => {
  for (const fees of [0, 25, 1000]) {
    const result = feeTarget({ investment: 5000, breakEvenFees: 0, fees });
    assert.equal(result.total, 0); assert.equal(result.remaining, 0); assert.equal(result.daily, 0);
  }
  assert.equal(feeTarget({ investment: 5000, breakEvenFees: 100, fees: 101 }).remaining, 0);
});

test('fee context rejects invalid financial values and unsupported windows', () => {
  const valid = { investment: 5000, breakEvenFees: 100, fees: 0 };
  for (const key of Object.keys(valid)) for (const value of [-1, NaN, Infinity, '100']) {
    assert.throws(() => feeTarget({ ...valid, [key]: value }));
  }
  assert.throws(() => feeTarget({ ...valid, investment: 0 }));
  for (const days of [0, -1, 365, NaN, '30']) assert.throws(() => feeTarget(valid, days));
});

for (const [file, capital, fees, duration, active] of [
  ['uniswap-v3-position-period.json', 47793.96961890788, 2.3572428756221475, 4992, 100],
  ['uniswap-v3-position-range-return.json', 5022.4394854013835, .4513697534261286, 120468, 50256 / 120468 * 100],
]) test('recorded fee context uses new fees over original principal: ' + file, async () => {
  const period = validatePositionPeriod(JSON.parse(await readFile(new URL('../public/examples/' + file, import.meta.url), 'utf8')));
  const result = recordedFeeContext(period);
  near(result.capital, capital); near(result.fees, fees); near(result.percent, fees / capital * 100);
  assert.equal(result.duration, duration); near(result.activePercent, active);
  assert.equal(result.end - result.start, duration);
  assert.equal(result.capturedAt, period.capturedAt);
  assert.ok(result.range.lowerPrice < result.range.upperPrice);
  // A previous owed balance is not income generated during this period.
  const withPriorOwed = structuredClone(period);
  for (const point of withPriorOwed.points) {
    point.snapshot.position.tokensOwed0 = '999999999999';
    point.snapshot.position.tokensOwed1 = '999999999999999999999';
  }
  assert.deepEqual(recordedFeeContext(withPriorOwed), result);
});
