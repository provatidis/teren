import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePositionPeriod, periodValidation } from '../public/data/position-period.js';
import { composePositionHistory, validatePositionHistory, validateRecordedCase, recordedPeriod } from '../public/data/position-history.js';
import { periodPointView, periodIntervalView } from '../public/lib/period-presentation.js';

const original = validatePositionPeriod(JSON.parse(await readFile(new URL('../public/examples/uniswap-v3-position-period.json', import.meta.url))));
function segment(points) {
  const first = BigInt(points[0].snapshot.block.number), last = BigInt(points.at(-1).snapshot.block.number);
  const eventQueries = [];
  for (let from = first + 1n; from <= last; from += 500n) {
    eventQueries.push({ provider: original.eventQueries[0].provider, fromBlock: String(from), toBlock: String(from + 499n > last ? last : from + 499n), matchingEvents: 0 });
  }
  return validatePositionPeriod({ ...original, points: structuredClone(points), eventQueries, validation: periodValidation(points) });
}
const halves = () => [segment(original.points.slice(0, 5)), segment(original.points.slice(4))];

test('composition preserves the complete record and deduplicates only shared boundaries', () => {
  const history = composePositionHistory(halves());
  const decoded = validateRecordedCase(JSON.parse(JSON.stringify(history)));
  assert.deepEqual(decoded, history);
  const period = recordedPeriod(decoded);
  assert.deepEqual(period.points, original.points);
  assert.deepEqual(period.validation, original.validation);
  assert.equal(period.eventQueries.length, 2);
  assert.deepEqual(periodPointView(period, 8), periodPointView(original, 8));
  assert.deepEqual(validateRecordedCase(original), original);
});

test('global first-checkpoint accounting carries fractions lost by summing segments', () => {
  let checked = false;
  for (let cut = 1; cut < original.points.length - 1; cut++) {
    const segments = [segment(original.points.slice(0, cut + 1)), segment(original.points.slice(cut))];
    const history = composePositionHistory(segments);
    const sum = [0, 1].map(token => segments.reduce((total, part) => total + BigInt(part.validation.earnedRaw[token]), 0n));
    if (sum.some((value, token) => value !== BigInt(history.validation.earnedRaw[token]))) {
      checked = true;
      const altered = structuredClone(history);
      altered.validation.earnedRaw = sum.map(String);
      assert.throws(() => validatePositionHistory(altered), /summary differs/);
      const period = recordedPeriod(history);
      const intervals = period.points.slice(1).map((_, index) => periodIntervalView(period, index + 1));
      assert.equal(intervals.reduce((total, item) => total + item.earned0, 0n), BigInt(history.validation.earnedRaw[0]));
      assert.equal(intervals.reduce((total, item) => total + item.earned1, 0n), BigInt(history.validation.earnedRaw[1]));
      break;
    }
  }
  assert.ok(checked, 'The real record must exercise a segment rounding carry.');
});

test('compositions reject gaps, excess overlap, reversed segments and conflicting boundary evidence', () => {
  for (const start of [3, 5]) {
    assert.throws(() => composePositionHistory([segment(original.points.slice(0, 5)), segment(original.points.slice(start))]), /identical boundary/);
  }
  assert.throws(() => composePositionHistory(halves().reverse()), /identical boundary/);
  for (const mutate of [
    point => { point.snapshot.block.hash = '0x' + '9'.repeat(64); },
    point => { point.secondsInside = String(BigInt(point.secondsInside) + 1n); },
    point => { point.simulatedCollect[0] = String(BigInt(point.simulatedCollect[0]) + 1n); },
  ]) {
    const segments = halves(); mutate(segments[1].points[0]);
    assert.throws(() => composePositionHistory(segments), /boundary|independent check|counter|duration|range|summary/);
  }
});

test('boundary comparison permits new capture metadata but retains all canonical state', () => {
  const segments = halves();
  segments[1].points[0].snapshot.provider = 'https://ethereum-rpc.publicnode.com';
  segments[1].points[0].snapshot.capturedAt = '2026-10-24T00:00:00.000Z';
  const history = composePositionHistory(segments);
  assert.equal(history.segments[1].points[0].snapshot.provider, 'https://ethereum-rpc.publicnode.com');
  assert.deepEqual(recordedPeriod(history).points, original.points);
  const changed = halves();
  for (const point of changed[1].points) {
    point.snapshot.position.tokensOwed0 = String(BigInt(point.snapshot.position.tokensOwed0) + 1n);
    point.snapshot.fees.collectable0Raw = String(BigInt(point.snapshot.fees.collectable0Raw) + 1n);
  }
  assert.throws(() => composePositionHistory(changed), /identical boundary/);
});

test('a composition retains bounded segments and complete event coverage', () => {
  assert.throws(() => composePositionHistory([]), /two to eight/);
  assert.throws(() => composePositionHistory([original]), /two to eight/);
  assert.throws(() => composePositionHistory(Array(9).fill(original)), /two to eight/);
  for (const mutate of [
    item => { item.eventQueries = []; },
    item => { item.eventQueries[0].matchingEvents = 1; },
    item => { item.eventQueries[0].fromBlock = String(BigInt(item.eventQueries[0].fromBlock) + 1n); },
    item => { item.points.at(-1).snapshot.block.number = String(BigInt(item.points[0].snapshot.block.number) + 10001n); },
  ]) {
    const segments = halves(); mutate(segments[1]);
    assert.throws(() => composePositionHistory(segments), /continuity|block span/);
  }
  const history = composePositionHistory(halves());
  history.capturedAt = '2000-01-01T00:00:00.000Z';
  assert.throws(() => validatePositionHistory(history), /capture time/);
});

test('the global check rejects accumulated collect differences that each segment accepts', () => {
  let checked = false;
  for (let cut = 1; cut < original.points.length - 2 && !checked; cut++) {
    for (const token of [0, 1]) {
      const segments = [segment(original.points.slice(0, cut + 1)), segment(original.points.slice(cut))];
      const last = segments[1].points.at(-1);
      last.simulatedCollect[token] = String(BigInt(last.simulatedCollect[token]) + 1n);
      try { segments[1].validation = periodValidation(segments[1].points); validatePositionPeriod(segments[1]); }
      catch { continue; }
      assert.throws(() => composePositionHistory(segments), /independent check/);
      checked = true; break;
    }
  }
  assert.ok(checked, 'Exercise a local pass that fails the week-to-date independent check.');
});

test('the composed checkpoint bound is enforced independently of each segment limit', () => {
  const points = Array.from({ length: 65 }, (_, index) => {
    const point = structuredClone(original.points[0]);
    point.snapshot.block.number = String(BigInt(point.snapshot.block.number) + BigInt(index));
    point.snapshot.block.timestamp += index * 12;
    point.snapshot.block.hash = '0x' + BigInt(index + 1).toString(16).padStart(64, '0');
    point.secondsInside = String((BigInt(point.secondsInside) + BigInt(index * 12)) % (1n << 32n));
    return point;
  });
  const segments = Array.from({ length: 8 }, (_, index) => segment(points.slice(index * 8, index * 8 + 9)));
  assert.throws(() => composePositionHistory(segments), /Too many composed/);
  segments[7] = segment(points.slice(56, 64));
  assert.equal(recordedPeriod(composePositionHistory(segments)).points.length, 64);
});
