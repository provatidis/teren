import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOP_DEFAULTS, calculateLoop } from '../public/models/borrowing-loop-v1.js';
import { LOAN_DEFAULTS } from '../public/models/collateral-loan-v1.js';
import { calculateLoopComparison } from '../public/models/loop-comparison.js';
import { loopHash, readLoopHash } from '../public/lib/loop-links.js';
import { loanHash, readLoanHash } from '../public/lib/lending-links.js';
import { readLoopDraft, saveLoopDraft } from '../public/data/loop-state.js';
import { emptyLibrary, createExperiment, addExperiment, parseLibrary, libraryJSON, validateExperimentDraft, mergeLibraries } from '../public/data/saved-experiments.js';
import { experimentView, experimentFacts, comparisonContext } from '../public/lib/saved-experiments.js';
import { loopFlowStages } from '../public/lib/loop-flow-stages.js';
import { readExperimentLocation, saveExperimentLocation, EXPERIMENT_LOCATION_KEY } from '../public/data/experiment-location.js';

const id = n => '10000000-0000-4000-8000-' + String(n).padStart(12, '0');
const make = (n, draft) => createExperiment(draft, 'Alternative ' + n, 'Why this assumption?', { id: id(n), now: '2026-10-25T12:00:00Z' });
const loan = { model: 'collateral-loan-v1', inputs: { ...LOAN_DEFAULTS, days: 90 }, liquidation: { repayPercent: 40, bonusPercent: 7 } };
const loop = { model: 'borrowing-loop-v1', inputs: { ...LOOP_DEFAULTS, rounds: 3, future: 1500, days: 90 }, comparison: { rounds: 1, borrowPercent: 30 } };
const memory = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('changing construction choices preserves shared capital, conditions and exact benchmarks', () => {
  const pair = calculateLoopComparison({ ...LOOP_DEFAULTS, rounds: 3, swapCost: 0, future: 1500, days: 0 }, 1, 30);
  assert.equal(pair.reference.end.debt, 3000);
  assert.equal(pair.reference.end.collateralTokens, 6.5);
  assert.equal(pair.reference.end.netAssets, 6750);
  assert.equal(pair.current.holdingValue, pair.reference.holdingValue);
  for (const key of Object.keys(LOOP_DEFAULTS).filter(key => !['rounds', 'borrowPercent'].includes(key))) {
    assert.equal(pair.current.input[key], pair.reference.input[key], key);
  }
  for (const value of [0, 76, NaN, Infinity, '30']) assert.throws(() => calculateLoopComparison(LOOP_DEFAULTS, 1, value));
});

test('comparison links and drafts preserve custom fractions without changing old link behavior', () => {
  const hash = loopHash(loop.inputs, 1, 30);
  assert.deepEqual(readLoopHash(hash), { status: 'ready', input: loop.inputs, comparisonRounds: 1, comparisonBorrowPercent: 30 });
  const ordinary = loopHash(loop.inputs);
  for (const suffix of ['&compareBorrow=30', '&compare=1&compareBorrow=', '&compare=1&compareBorrow=76', '&compare=1&compareBorrow=30&compareBorrow=40']) {
    assert.equal(readLoopHash(ordinary + suffix).status, 'invalid');
  }
  const storage = memory();
  assert.equal(saveLoopDraft(loop.inputs, () => storage, 1, 30), true);
  assert.equal(readLoopDraft(() => storage).comparisonBorrowPercent, 30);
  assert.equal(saveLoopDraft(loop.inputs, () => storage, 1, 90), false);
  assert.equal(readLoopDraft(() => storage).comparisonBorrowPercent, 30);
  assert.equal(saveLoopDraft(loop.inputs, () => storage, 1), true);
  assert.equal(readLoopDraft(() => storage).comparisonBorrowPercent, undefined);
});

test('a mixed library round-trips loan, liquidation and loop comparison assumptions', () => {
  const entries = [make(1, loan), make(2, loop)];
  const library = entries.reduce(addExperiment, emptyLibrary());
  assert.deepEqual(parseLibrary(libraryJSON(library)), library);
  const clean = validateExperimentDraft({ ...loop, inputs: { ...loop.inputs, netAssets: 999 } });
  assert.equal(clean.inputs.netAssets, undefined);
  assert.deepEqual(clean.comparison, loop.comparison);
  assert.deepEqual(readLoanHash(experimentView(entries[0]).hash).liquidation, loan.liquidation);
  assert.equal(readLoopHash(experimentView(entries[1]).hash).comparisonBorrowPercent, 30);
  assert.ok(experimentFacts(entries[0], true).some(([label, value]) => label === 'Liquidation illustration' && value === '40% repayment · 7% bonus'));
  assert.ok(experimentFacts(entries[1], true).some(([label, value]) => label === 'Saved reference' && value.includes('30.00%')));
});

test('invalid financial assumptions and fictional lending provenance are rejected atomically', () => {
  for (const draft of [
    { ...loan, inputs: { ...loan.inputs, borrow: 1000000 } },
    { ...loan, liquidation: { repayPercent: 40, bonusPercent: 31 } },
    { ...loop, comparison: { rounds: 2, borrowPercent: 90 } },
    { ...loop, comparison: { rounds: 2.5, borrowPercent: null } },
    { ...loop, origin: { kind: 'position', snapshot: {} } },
  ]) assert.throws(() => validateExperimentDraft(draft));
  const library = addExperiment(emptyLibrary(), make(1, loan));
  const before = libraryJSON(library);
  assert.throws(() => mergeLibraries(library, { ...emptyLibrary(), experiments: [{ ...make(2, loop), inputs: { ...loop.inputs, days: NaN } }] }));
  assert.equal(libraryJSON(library), before);
});

test('duplicating creates an independent record while import conflicts preserve both versions', () => {
  const first = make(1, loop), copy = make(2, { ...first, inputs: { ...first.inputs, rounds: 1 } });
  const library = addExperiment(addExperiment(emptyLibrary(), first), copy);
  assert.equal(library.experiments.find(item => item.id === first.id).inputs.rounds, 3);
  const changed = { ...copy, name: 'Different name' };
  const merged = mergeLibraries(library, { ...emptyLibrary(), experiments: [changed] }, () => id(3));
  assert.equal(merged.copies, 1);
  assert.equal(merged.library.experiments.length, 3);
});

test('saved comparison context exposes different conditions instead of implying a fair ranking', () => {
  const a = make(1, loop), b = make(2, { ...loop, inputs: { ...loop.inputs, rounds: 1 } });
  assert.match(comparisonContext([a, b]), /Same original ETH/);
  for (const patch of [{ days: 30 }, { borrowAPR: 20 }, { interestMode: 'simple' }, { future: 2000 }, { threshold: 90 }]) {
    assert.match(comparisonContext([a, make(3, { ...loop, inputs: { ...loop.inputs, ...patch } })]), /different conditions/);
  }
  assert.match(comparisonContext([a, make(3, { ...loop, inputs: { ...loop.inputs, collateral: 8 } })]), /Different starting capital/);
});

test('personal money-flow scenes use every real ledger action including swap costs', () => {
  for (const rounds of [0, 1, 3, 5]) {
    const result = calculateLoop({ ...LOOP_DEFAULTS, rounds, swapCost: 1 });
    const flow = loopFlowStages(result, 'build', { allRounds: true });
    assert.equal(flow.stages.length, 1 + rounds * 3);
    assert.deepEqual(flow.stages.at(-1).position, result.start);
    assert.match(flow.intro, /each purchase costs 1%/);
    for (let i = 1; i < flow.stages.length; i++) assert.deepEqual(flow.stages[i].position, result.steps[i - 1].position);
  }
});

test('unwind visuals retain blocked and partial debt without inventing a final withdrawal', () => {
  const blocked = calculateLoop({ ...LOOP_DEFAULTS, rounds: 3, future: 100 });
  const flow = loopFlowStages(blocked, 'unwind', { allowIncomplete: true });
  assert.equal(flow.stages.length, 1);
  assert.equal(flow.stages[0].position.debt, blocked.end.debt);
  assert.match(flow.stages[0].copy, /blocked/);
  const result = calculateLoop(LOOP_DEFAULTS);
  const partial = calculateLoop({ ...LOOP_DEFAULTS, future: result.end.boundaryPrice * (1 + 1e-14) });
  assert.equal(partial.unwind.status, 'limited');
  assert.ok(partial.unwind.remaining.debt > 0);
  const partialFlow = loopFlowStages(partial, 'unwind', { allowIncomplete: true });
  assert.equal(partialFlow.stages.length, partial.unwind.actions.length + 1);
  assert.equal(partialFlow.stages.some(stage => stage.action === 'release'), false);
  assert.match(partialFlow.note, /partial preview/);
  assert.throws(() => loopFlowStages(blocked, 'unwind'), /completed/);
});

test('Home resumes internal experiment inputs and tolerates blocked or damaged storage', () => {
  const storage = memory(), get = () => storage;
  assert.equal(readExperimentLocation(get), null);
  const hash = loopHash(loop.inputs, 1, 30);
  assert.equal(saveExperimentLocation(loop.model, hash, get), true);
  assert.equal(readExperimentLocation(get).route, 'lending.html' + hash);
  assert.equal(saveExperimentLocation(loan.model, loanHash(loan.inputs, loan.liquidation), get), true);
  for (const hash of ['https://example.com/', '#loan=collateral-loan-v1&x=<script>', '#loop=borrowing-loop-v1&rounds=3']) {
    assert.equal(saveExperimentLocation(loan.model, hash, get), false);
  }
  storage.setItem(EXPERIMENT_LOCATION_KEY, '{broken');
  assert.equal(readExperimentLocation(get), null);
  const blocked = () => { throw new Error('Blocked'); };
  assert.equal(saveExperimentLocation(loop.model, hash, blocked), false);
  assert.equal(readExperimentLocation(blocked), null);
});
