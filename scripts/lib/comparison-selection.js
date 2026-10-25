import assert from 'node:assert/strict';

export function validateComparisonSelection(selection, plan, planSHA256) {
  assert.equal(selection?.kind, 'matched-week-selection');
  assert.equal(selection.version, 1);
  assert.ok(!selection.error && Number.isFinite(Date.parse(selection.startedAt)) && Number.isFinite(Date.parse(selection.completedAt)));
  assert.ok(Date.parse(selection.completedAt) >= Date.parse(selection.startedAt));
  assert.match(selection.declarationCommit, /^[0-9a-f]{40}$/);
  assert.equal(selection.planSHA256, planSHA256);
  assert.deepEqual(selection.plan, plan);
  assert.equal(plan.candidateOrder.order, 'ascending');
  assert.ok(Array.isArray(selection.checks) && selection.checks.length > 0
    && selection.checks.length <= Number(BigInt(plan.candidateOrder.lastTokenId) - BigInt(plan.candidateOrder.firstTokenId) + 1n));
  selection.checks.forEach((check, index) => {
    assert.equal(check.tokenId, String(BigInt(plan.candidateOrder.firstTokenId) + BigInt(index)), 'Qualification must preserve the declared order.');
    assert.ok(check.eligible === true || (typeof check.reason === 'string' && check.reason.length > 0));
  });
  assert.equal(Object.keys(selection.selected).length, plan.groups.length);
  assert.equal(selection.checks.filter(check => check.eligible).length, plan.groups.length);
  assert.ok(Number.isInteger(selection.startTick));
  for (const group of plan.groups) {
    const eligible = selection.checks.find(check => check.group === group.id && check.eligible);
    assert.ok(eligible && selection.selected[group.id] === eligible.tokenId, 'Keep the first eligible position in each declared group.');
    assert.ok(eligible.tickUpper - eligible.tickLower >= group.minWidthTicks && eligible.tickUpper - eligible.tickLower <= group.maxWidthTicks);
    assert.ok(eligible.tickLower <= selection.startTick && selection.startTick < eligible.tickUpper);
    assert.match(eligible.liquidity, /^[1-9]\d*$/);
  }
  assert.equal(selection.boundaries.length, 8);
  selection.boundaries.forEach((entry, index) => {
    const time = Date.parse(plan.startUTC) / 1000 + index * 86400;
    assert.equal(Date.parse(entry.requestedAt) / 1000, time);
    assert.ok(entry.previousBlock.timestamp < time && entry.block.timestamp >= time);
    assert.equal(BigInt(entry.previousBlock.number) + 1n, BigInt(entry.block.number));
  });
  assert.equal(selection.boundaries.at(-1).requestedAt, plan.endUTC);
  return selection;
}
