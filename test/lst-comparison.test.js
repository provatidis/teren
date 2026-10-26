import test from 'node:test';
import assert from 'node:assert/strict';
import { LST_DEFAULTS, LST_MODEL, calculateLST, upgradeLST } from '../public/models/lst-loop-v2.js';
import { LST_DEFAULTS as OLD_DEFAULTS } from '../public/models/lst-loop-v1.js';
import { calculateLSTComparison, validateLSTComparison } from '../public/models/lst-comparison.js';
import { lstHash, readLSTHash } from '../public/lib/lst-links.js';
import { LST_DRAFT_KEY, readLSTDraft, saveLSTDraft } from '../public/data/lst-state.js';
import { EXPERIMENTS_KEY, emptyLibrary, validateExperimentDraft, createExperiment, addExperiment, editExperiment, mergeLibraries,
  libraryJSON, parseLibrary, readLibrary } from '../public/data/saved-experiments.js';
import { experimentView, experimentFacts, experimentSummary, defaultExperimentName, comparisonContext } from '../public/lib/saved-experiments.js';
import { saveExperimentLocation, readExperimentLocation } from '../public/data/experiment-location.js';

const input = changes => ({ ...LST_DEFAULTS, ...changes });
const simple = changes => input({ collateral: 5, rate: 1, targetExposure: 2, maxLTV: 75, threshold: 80,
  days: 0, swapCost: 0, buildFlashFee: 0, exitCost: 0, flashFee: 0, gas: 0, ...changes });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-11 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };

test('target comparison changes only token exposure and does not mutate either input', () => {
  const p = Object.freeze(input({ days: 7.25, discount: .55, rateChange: true, changeDay: 2.75, laterAPR: 5, exitMode: 'wsteth' }));
  const reference = Object.freeze({ targetExposure: 2.123456789 });
  const pair = calculateLSTComparison(p, reference);
  assert.equal(pair.status, 'ready');
  assert.equal(pair.reason, null);
  assert.deepEqual(pair.primary, calculateLST(p));
  assert.deepEqual(pair.reference.input, { ...p, targetExposure: reference.targetExposure });
  assert.deepEqual(pair.comparison, reference);
  assert.notEqual(pair.comparison, reference);
  assert.deepEqual(Object.keys(pair.reference.input).filter(key => pair.reference.input[key] !== pair.primary.input[key]), ['targetExposure']);
});

test('shared-condition comparison conserves starting equity and exposes oracle-value headroom', () => {
  const pair = calculateLSTComparison(simple(), { targetExposure: 3 });
  near(pair.primary.start.collateral, 10); near(pair.primary.start.debt, 5);
  near(pair.reference.start.collateral, 15); near(pair.reference.start.debt, 10);
  near(pair.primary.end.net, 5); near(pair.reference.end.net, 5);
  near(pair.primaryOutcome.healthFactor, 1.6); near(pair.referenceOutcome.healthFactor, 1.2);
  near(pair.primaryOutcome.headroom.oraclePriceDropPercent, 37.5);
  near(pair.referenceOutcome.headroom.oraclePriceDropPercent, 100 / 6);
  for (const outcome of [pair.primaryOutcome, pair.referenceOutcome]) {
    assert.equal(outcome.headroom.status, 'above');
    assert.equal(outcome.counterfactual, false);
    assert.equal(outcome.exit.value, 5);
    assert.equal(outcome.exit.holding, 5);
    assert.equal(outcome.exit.difference, 0);
  }
});

test('equal targets agree and reversing the pair swaps results without changing shared conditions', () => {
  const p = input({ stakingAPY: 4, days: 120, discount: 2, exitMode: 'wsteth' });
  const equal = calculateLSTComparison(p, { targetExposure: p.targetExposure });
  assert.deepEqual(equal.primary, equal.reference);
  assert.deepEqual(equal.primaryOutcome, equal.referenceOutcome);
  const forward = calculateLSTComparison(p, { targetExposure: 2 });
  const reverse = calculateLSTComparison({ ...p, targetExposure: 2 }, { targetExposure: p.targetExposure });
  assert.deepEqual(forward.primary, reverse.reference);
  assert.deepEqual(forward.referenceOutcome, reverse.primaryOutcome);
});

test('a one-times comparison has no debt or oracle-price boundary', () => {
  const pair = calculateLSTComparison(simple(), { targetExposure: 1 });
  assert.equal(pair.reference.end.debt, 0);
  assert.equal(pair.referenceOutcome.vsHolding, 0);
  assert.equal(pair.referenceOutcome.healthFactor, null);
  assert.equal(pair.referenceOutcome.headroom.oraclePriceDropPercent, null);
  assert.equal(pair.referenceOutcome.headroom.status, 'no-debt');
  assert.equal(pair.referenceOutcome.firstRateBoundary, null);
});

test('a maximum-LTV failure makes only the comparison unavailable and never silently clamps it', () => {
  const p = simple();
  assert.equal(calculateLSTComparison(p, { targetExposure: 4 }).status, 'ready');
  for (const targetExposure of [4.000001, 5, 50]) {
    const pair = calculateLSTComparison(p, { targetExposure });
    assert.equal(pair.status, 'unavailable');
    assert.match(pair.reason, /maximum LTV/);
    assert.equal(pair.reference, null); assert.equal(pair.referenceOutcome, null);
    assert.equal(pair.comparison.targetExposure, targetExposure);
    assert.deepEqual(pair.primary, calculateLST(p));
  }
  const atFifty = calculateLSTComparison(simple({ maxLTV: 98, threshold: 99 }), { targetExposure: 50 });
  assert.equal(atFifty.status, 'ready'); near(atFifty.reference.start.debt / atFifty.reference.start.collateralValue, .98);
});

test('comparison metadata rejects malformed numbers, added conditions, and unsupported construction modes', () => {
  const p = simple();
  for (const bad of [{}, [], 2, '2', { targetExposure: '2' }, { targetExposure: NaN }, { targetExposure: Infinity },
    { targetExposure: 0.99 }, { targetExposure: 50.01 }, { targetExposure: 2, borrowAPR: 3 }]) {
    assert.throws(() => validateLSTComparison(p, bad), RangeError);
    assert.throws(() => calculateLSTComparison(p, bad), RangeError);
  }
  for (const unsupported of [OLD_DEFAULTS, upgradeLST(OLD_DEFAULTS)]) {
    assert.throws(() => validateLSTComparison(unsupported, { targetExposure: 2 }), /target-based/);
  }
  assert.equal(validateLSTComparison(p), null);
  assert.equal(calculateLSTComparison(p).status, 'none');
  assert.throws(() => calculateLSTComparison({ ...p, targetExposure: 5 }, { targetExposure: 2 }), /maximum LTV/);
});

test('selected exit comparisons use matching units and the correct holding transaction', () => {
  const p = simple({ exitCost: 20 });
  const sold = calculateLSTComparison(p, { targetExposure: 3 });
  assert.deepEqual(sold.primaryOutcome.exit, { status: 'complete', unit: 'WETH', value: 3, holding: 4, difference: -1 });
  assert.deepEqual(sold.referenceOutcome.exit, { status: 'complete', unit: 'WETH', value: 2, holding: 4, difference: -2 });
  const retained = calculateLSTComparison({ ...p, exitMode: 'wsteth' }, { targetExposure: 3 });
  assert.deepEqual(retained.primaryOutcome.exit, { status: 'complete', unit: 'wstETH', value: 3.75, holding: 5, difference: -1.25 });
  assert.deepEqual(retained.referenceOutcome.exit, { status: 'complete', unit: 'wstETH', value: 2.5, holding: 5, difference: -2.5 });
  assert.deepEqual(retained.primary.end, sold.primary.end);
});

test('blocked exits never publish an exit return or erase the debts', () => {
  for (const changes of [{ exitAvailable: false }, { gas: 100 }, { oracleMode: 'market', discount: 50 }]) {
    const pair = calculateLSTComparison(input(changes), { targetExposure: 2 });
    for (const [result, outcome] of [[pair.primary, pair.primaryOutcome], [pair.reference, pair.referenceOutcome]]) {
      assert.notEqual(outcome.exit.status, 'complete');
      assert.equal(outcome.exit.value, null); assert.equal(outcome.exit.difference, null);
      assert.ok(result.exit.remaining.debt > 0);
      assert.deepEqual(result.exit.steps, []);
    }
  }
});

test('an earlier rate-only breach remains counterfactual even after endpoint health recovers', () => {
  const pair = calculateLSTComparison(input({ targetExposure: 8, stakingAPY: 20, borrowAPR: 100,
    rateChange: true, laterAPR: 0, changeDay: 90 }), { targetExposure: 2 });
  assert.equal(pair.primary.end.status, 'above');
  assert.ok(pair.primaryOutcome.firstRateBoundary > 0);
  assert.equal(pair.primaryOutcome.counterfactual, true);
  assert.equal(pair.primaryOutcome.exit.status, 'boundary');
  assert.equal(pair.primaryOutcome.exit.value, null);
  assert.equal(pair.referenceOutcome.firstRateBoundary, null);
  assert.equal(pair.referenceOutcome.counterfactual, false);
  assert.equal(pair.referenceOutcome.exit.status, 'complete');
  const reverse = calculateLSTComparison({ ...pair.primary.input, targetExposure: 2 }, { targetExposure: 8 });
  assert.equal(reverse.primaryOutcome.counterfactual, false);
  assert.equal(reverse.primaryOutcome.exit.status, 'complete');
  assert.deepEqual(reverse.referenceOutcome, pair.primaryOutcome);
});

test('oracle headroom distinguishes a market discount from conversion-rate valuation', () => {
  const base = calculateLSTComparison(simple(), { targetExposure: 3 });
  const rate = calculateLSTComparison(simple({ discount: 20 }), { targetExposure: 3 });
  assert.equal(rate.primaryOutcome.headroom.marketDiscountAffectsHealth, false);
  near(rate.primaryOutcome.headroom.oraclePriceDropPercent, base.primaryOutcome.headroom.oraclePriceDropPercent);
  assert.ok(rate.primaryOutcome.vsHolding < base.primaryOutcome.vsHolding);
  const market = calculateLSTComparison(simple({ discount: 20, oracleMode: 'market' }), { targetExposure: 3 });
  assert.equal(market.primaryOutcome.headroom.marketDiscountAffectsHealth, true);
  assert.ok(market.primaryOutcome.headroom.oraclePriceDropPercent < rate.primaryOutcome.headroom.oraclePriceDropPercent);
  assert.equal(market.referenceOutcome.headroom.status, 'eligible');
  assert.equal(market.referenceOutcome.headroom.oraclePriceDropPercent, 0);
  assert.equal(market.referenceOutcome.counterfactual, true);
  const boundary = calculateLSTComparison(simple({ discount: 37.5, oracleMode: 'market' }), { targetExposure: 3 });
  assert.equal(boundary.primaryOutcome.headroom.status, 'boundary');
  near(boundary.primaryOutcome.healthFactor, 1);
  assert.equal(boundary.primaryOutcome.headroom.oraclePriceDropPercent, 0);
  assert.equal(boundary.primaryOutcome.counterfactual, true);
  assert.equal(boundary.primaryOutcome.exit.status, 'boundary');
  // The underlying model treats rounding within 1e-12 of HF=1 as the boundary.
  const almost = calculateLSTComparison(simple({ discount: 37.5 - 1e-11, oracleMode: 'market' }), { targetExposure: 3 });
  assert.ok(almost.primaryOutcome.healthFactor > 1);
  assert.equal(almost.primaryOutcome.headroom.status, 'boundary');
  assert.equal(almost.primaryOutcome.headroom.oraclePriceDropPercent, 0);
  assert.equal(almost.primaryOutcome.counterfactual, true);
});

test('a holding exit that costs more than its proceeds has no usable cash benchmark', () => {
  const pair = calculateLSTComparison(simple({ gas: 10 }), { targetExposure: 3 });
  assert.equal(pair.primaryOutcome.exit.holding, null);
  assert.equal(pair.primaryOutcome.exit.difference, null);
  const retained = calculateLSTComparison(simple({ gas: 10, exitMode: 'wsteth' }), { targetExposure: 3 });
  assert.equal(retained.primaryOutcome.exit.holding, 5);
  assert.equal(retained.primaryOutcome.exit.value, null);
});

test('comparison links round-trip exact targets, including unavailable references, without changing old links', () => {
  const p = input({ days: 7.25, discount: .55 });
  for (const targetExposure of [1, 2.123456789, 50]) for (const view of ['build', 'hold', 'exit']) {
    const comparison = { targetExposure };
    assert.deepEqual(readLSTHash(lstHash(p, view, comparison)), { status: 'ready', input: p, view, comparison });
  }
  for (const original of [p, OLD_DEFAULTS, upgradeLST(OLD_DEFAULTS)]) {
    assert.deepEqual(readLSTHash(lstHash(original)), { status: 'ready', input: original, view: 'hold' });
  }
  const hash = lstHash(p);
  for (const suffix of ['&compareTarget=', '&compareTarget=0', '&compareTarget=51', '&compareTarget=NaN', '&compareTarget=Infinity',
    '&compareTarget=2&compareTarget=3', '&compareTarget=2&unknown=3']) assert.equal(readLSTHash(hash + suffix).status, 'invalid');
  assert.equal(readLSTHash(lstHash(OLD_DEFAULTS) + '&compareTarget=2').status, 'invalid');
  assert.equal(readLSTHash(lstHash(upgradeLST(OLD_DEFAULTS)) + '&compareTarget=2').status, 'invalid');
});

test('drafts retain comparison metadata and preserve stored work on invalid edits or reads', () => {
  const store = memory(), storage = () => store, p = input(), comparison = { targetExposure: 50 };
  assert.ok(saveLSTDraft(p, 'hold', storage, comparison));
  assert.deepEqual(readLSTDraft(storage), { status: 'ready', input: p, view: 'hold', comparison });
  const raw = store.getItem(LST_DRAFT_KEY);
  assert.equal(saveLSTDraft(p, 'hold', storage, { targetExposure: NaN }), false);
  assert.equal(saveLSTDraft(upgradeLST(OLD_DEFAULTS), 'hold', storage, comparison), false);
  assert.equal(store.getItem(LST_DRAFT_KEY), raw);
  for (const invalid of [{ targetExposure: '2' }, { targetExposure: 51 }, { targetExposure: 2, oracleMode: 'market' }]) {
    const corrupted = JSON.stringify({ ...JSON.parse(raw), comparison: invalid });
    store.setItem(LST_DRAFT_KEY, corrupted);
    assert.equal(readLSTDraft(storage).status, 'invalid');
    assert.equal(store.getItem(LST_DRAFT_KEY), corrupted);
  }
  assert.ok(saveLSTDraft(p, 'exit', storage));
  assert.deepEqual(readLSTDraft(storage), { status: 'ready', input: p, view: 'exit' });
  assert.equal(Object.hasOwn(JSON.parse(store.getItem(LST_DRAFT_KEY)), 'comparison'), false);
  assert.equal(saveLSTDraft(p, 'hold', () => { throw new Error('blocked'); }, comparison), false);
});

test('named comparisons survive create, rename, duplicate, import, export and Home resumption', () => {
  const inputs = input(), comparison = { targetExposure: 2 };
  const draft = { model: LST_MODEL, inputs, comparison };
  const entry = createExperiment(draft, 'Two target exposures', 'Shared conditions');
  const duplicate = createExperiment(entry, 'A different question', entry.notes);
  let library = addExperiment(addExperiment(emptyLibrary(), entry), duplicate);
  library = editExperiment(library, entry, 'Same pair, renamed', 'Kept assumptions');
  const restored = parseLibrary(libraryJSON(library));
  assert.ok(restored.experiments.every(record => record.comparison.targetExposure === 2));
  assert.deepEqual(mergeLibraries(emptyLibrary(), restored).library, restored);
  const view = experimentView(entry);
  assert.deepEqual(readLSTHash(view.hash).comparison, comparison);
  assert.match(experimentSummary(entry), /3× setup \/ 2× reference/);
  assert.match(defaultExperimentName(draft), /3× vs 2×/);
  assert.match(experimentFacts(entry, true).flat().join(' '), /Saved reference target/);
  assert.match(comparisonContext([entry, duplicate]), /Each card shows its main setup/);
  const store = memory(), storage = () => store;
  assert.ok(saveExperimentLocation(LST_MODEL, view.hash, storage));
  assert.equal(readExperimentLocation(storage).route, 'lending.html' + view.hash);
  const unavailable = createExperiment({ ...draft, comparison: { targetExposure: 50 } }, 'Beyond the build limit', '');
  assert.deepEqual(parseLibrary(libraryJSON(addExperiment(emptyLibrary(), unavailable))).experiments[0].comparison, { targetExposure: 50 });
  assert.match(experimentFacts(unavailable, true).flat().join(' '), /Unavailable:.*maximum LTV/);
});

test('saved cards identify the main setup and keep an earlier breach visible after health recovers', () => {
  const inputs = input({ targetExposure: 8, stakingAPY: 20, borrowAPR: 100,
    rateChange: true, laterAPR: 0, changeDay: 90 });
  const entry = createExperiment({ model: LST_MODEL, inputs, comparison: { targetExposure: 2 } }, 'Rate recovery', '');
  const facts = experimentFacts(entry);
  assert.equal(facts[0][0], 'Your setup · liquidation boundary reached');
  assert.match(facts[0][1], /Later balances assume no liquidation/);
  assert.ok(facts.some(([label]) => label === 'Your setup · health factor'));
  assert.ok(facts.every(([label]) => !label.startsWith('Reference')));
  const reversed = createExperiment({ model: LST_MODEL, inputs: { ...inputs, targetExposure: 2 },
    comparison: { targetExposure: 8 } }, 'Reference reaches the boundary', '');
  assert.ok(experimentFacts(reversed).every(([label]) => !label.includes('boundary reached')));
  assert.ok(experimentFacts(reversed, true).some(([label, value]) =>
    label === 'Reference · liquidation boundary reached' && /assume no liquidation/.test(value)));
});

test('saved records reject comparisons on legacy or round-based models and retain malformed libraries', () => {
  const metadata = { targetExposure: 2 };
  for (const [model, inputs] of [['lst-loop-v1', OLD_DEFAULTS], ['lst-loop-v1', { ...OLD_DEFAULTS, buildMode: 'target' }],
    [LST_MODEL, upgradeLST(OLD_DEFAULTS)]]) {
    assert.throws(() => validateExperimentDraft({ model, inputs, comparison: metadata }), /target-based/);
  }
  const entry = createExperiment({ model: LST_MODEL, inputs: input(), comparison: metadata }, 'Valid pair', '');
  const raw = JSON.stringify({ ...emptyLibrary(), experiments: [{ ...entry, comparison: { targetExposure: '2' } }] });
  const store = memory(); store.setItem(EXPERIMENTS_KEY, raw);
  const read = readLibrary(() => store);
  assert.equal(read.status, 'invalid'); assert.equal(read.raw, raw);
  assert.equal(store.getItem(EXPERIMENTS_KEY), raw);
});
