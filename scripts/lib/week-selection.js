import assert from 'node:assert/strict';
import { blockHeader } from '../../public/data/block.js';
import { abiWords, addressFromWord, uintFromWord } from '../../public/data/abi.js';
import { V3 } from '../../public/data/config.js';
import { validatePositionPeriod } from '../../public/data/position-period.js';

function header(input) {
  assert.ok(input && typeof input.number === 'string' && /^[1-9]\d*$/.test(input.number), 'Invalid selected block.');
  assert.ok(Number.isSafeInteger(input.timestamp), 'Invalid selected timestamp.');
  return blockHeader({ number: '0x' + BigInt(input.number).toString(16), timestamp: '0x' + input.timestamp.toString(16), hash: input.hash });
}

export function validateWeekSelection(report, plan, planSHA256) {
  assert.ok(report?.version === 1 && report.kind === 'week-position-selection' && !report.error, 'Selection is incomplete or unsupported.');
  assert.equal(report.planSHA256, planSHA256, 'The declared selection plan differs.');
  assert.deepEqual(report.plan, plan, 'Selection used another candidate plan.');
  assert.ok(Number.isFinite(Date.parse(report.completedAt)), 'Selection has not completed.');
  assert.equal(report.boundaries?.length, 8, 'Select eight daily boundaries.');
  const start = Date.parse(plan.startUTC);
  assert.equal(Date.parse(plan.endUTC) - start, 7 * 86400000, 'Use the fixed one-week period.');
  const blocks = report.boundaries.map((entry, index) => {
    const requested = start + index * 86400000;
    assert.equal(entry.requestedAt, new Date(requested).toISOString(), 'Daily dates changed.');
    const block = header(entry.block), previous = header(entry.previousBlock);
    assert.equal(BigInt(block.number) - BigInt(previous.number), 1n, 'Boundary proof must use the immediately preceding block.');
    assert.ok(previous.timestamp < requested / 1000 && block.timestamp >= requested / 1000, 'This is not the first block at the requested time.');
    if (index) {
      const prior = report.boundaries[index - 1].block;
      assert.ok(BigInt(block.number) > BigInt(prior.number) && BigInt(block.number) - BigInt(prior.number) <= 10000n, 'Daily segment exceeds the supported block span.');
      assert.ok(block.timestamp > prior.timestamp, 'Daily checkpoints are not ordered.');
    }
    return block;
  });
  assert.ok(Array.isArray(report.checks) && report.checks.length > 0, 'Missing original candidate decisions.');
  const fallback = report.fallbackChecks || [];
  const checks = [...report.checks, ...fallback];
  for (let index = 0; index < report.checks.length; index++) assert.equal(report.checks[index].tokenId, plan.initialCandidates[index], 'Original candidate order changed.');
  if (fallback.length) {
    assert.equal(report.checks.length, plan.initialCandidates.length, 'Fallback started before checking the original candidates.');
    assert.equal(plan.fallback.order, 'ascending');
    const ids = [];
    for (let value = BigInt(plan.fallback.firstTokenId); value <= BigInt(plan.fallback.lastTokenId); value++) {
      if (!plan.initialCandidates.includes(String(value))) ids.push(String(value));
    }
    assert.ok(fallback.length <= ids.length, 'Fallback exceeds its declared candidate list.');
    fallback.forEach((check, index) => assert.equal(check.tokenId, ids[index], 'Fallback skipped or reordered a candidate.'));
  }
  assert.ok(checks.slice(0, -1).every(check => check.eligible === false && typeof check.reason === 'string' && check.reason), 'Earlier candidate decisions are incomplete.');
  const selected = checks.at(-1);
  assert.ok(selected.eligible === true && !selected.reason, 'No candidate qualified.');
  assert.equal(selected.tokenId, report.selectedTokenId, 'Selected position differs.');
  assert.deepEqual(selected.startAccountingWords, selected.endAccountingWords, 'Endpoint accounting changed.');
  assert.equal(selected.startAccountingWords?.length, 10, 'Missing selected position accounting.');
  const words = abiWords('0x' + selected.startAccountingWords.join(''), 10);
  assert.equal(addressFromWord(words[0]), V3.usdc);
  assert.equal(addressFromWord(words[1]), V3.weth);
  assert.equal(uintFromWord(words[2], 24), 3000n);
  assert.ok(uintFromWord(words[5], 128) > 0n, 'Selected position has no liquidity.');
  assert.ok(Array.isArray(selected.eventQueries) && selected.eventQueries.length > 0, 'Missing selected continuity evidence.');
  let next = BigInt(blocks[0].number) + 1n;
  for (const query of selected.eventQueries) {
    const from = BigInt(query.fromBlock), to = BigInt(query.toBlock);
    assert.ok(from === next && to >= from && to - from < 500n && to <= BigInt(blocks.at(-1).number) && query.matchingEvents === 0, 'Selection event coverage has a gap or update.');
    next = to + 1n;
  }
  assert.equal(next, BigInt(blocks.at(-1).number) + 1n, 'Selection event coverage is incomplete.');
  return { tokenId: selected.tokenId, blocks };
}

export function validateWeekSegment(input, tokenId, start, end) {
  const segment = validatePositionPeriod(input);
  assert.equal(segment.id, 'position-' + tokenId, 'Cached position differs.');
  assert.equal(segment.points.length, 2, 'A daily segment must retain its two declared checkpoints.');
  assert.deepEqual(segment.points[0].snapshot.block, start, 'Cached starting boundary differs.');
  assert.deepEqual(segment.points[1].snapshot.block, end, 'Cached ending boundary differs.');
  return segment;
}
