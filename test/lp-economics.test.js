import test from 'node:test';
import assert from 'node:assert/strict';
import * as full from '../public/models/cp50-v2.js';
import * as range from '../public/models/cl-range-v2.js';
import * as fullOld from '../public/models/cp50-v1.js';
import * as rangeOld from '../public/models/cl-range-v1.js';
import { liquidityModel } from '../public/models/liquidity-models.js';
import { scenarioHash, scenarioFromHash } from '../public/lib/scenario-links.js';
import { rangeHash, rangeFromHash } from '../public/lib/range-links.js';
import { readSharedScenario } from '../public/lib/link-router.js';
import { scenarioCSV } from '../public/lib/scenario-csv.js';
import { rangeCSV } from '../public/lib/range-csv.js';
import { feeTarget } from '../public/lib/fee-context-state.js';
import { validateExperimentDraft, createExperiment, libraryJSON, parseLibrary } from '../public/data/saved-experiments.js';
import { experimentView, experimentFacts, comparisonContext } from '../public/lib/saved-experiments.js';
import { validateLearnReturn } from '../public/data/learn-return-drafts.js';
import { saveExperimentLocation, readExperimentLocation } from '../public/data/experiment-location.js';

const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const fullCase = patch => full.calculateScenario({ ...full.DEFAULT_SCENARIO, ...patch });
const rangeCase = patch => range.calculateRange({ ...range.DEFAULT_RANGE, ...patch });

test('fees and costs reconcile to the original token basket, with a hand-worked full-range outcome', () => {
  const r = fullCase({ investment: 10000, initialPrice: 2000, futurePrice: 8000,
    feeMode: 'apr', feeAPR: 36.5, feeDays: 100, openingCost: 40, collectionCost: 10, closingCost: 50 });
  assert.equal(r.holdValue, 25000); assert.equal(r.lpBeforeFees, 20000);
  close(r.feeIncome, 1000); close(r.lpGrossValue, 21000); close(r.lpValue, 20900);
  close(r.difference, -4100); close(r.breakEvenFees, 5100); close(r.breakEvenAPR, 186.15);
  assert.equal(r.fees, 100, 'The inactive cash input remains a draft, not the resolved APR income.');
  close(full.calculateScenario(full.experimentScenario(r, 'break-even')).difference, 0);
  assert.deepEqual(r.held, { eth: 2.5, usdc: 5000 });
});

test('unchanged prices can lose solely to costs; no principal or losses are silently clipped', () => {
  const r = fullCase({ futurePrice: 2000, fees: 50, openingCost: 100, closingCost: 6000 });
  assert.equal(r.lpValue, -1050); assert.equal(r.difference, -6050);
  assert.equal(r.breakEvenFees, 6100); assert.equal(r.impermanentLoss, 0);
  assert.deepEqual(r.held, r.pooled);
});

test('APR scales once with time and capital, not price, concentration or endpoint status', () => {
  const input = { feeMode: 'apr', feeAPR: 12, feeDays: 365, fees: 987 };
  const a = rangeCase(input);
  assert.equal(a.feeIncome, 600);
  for (const futurePrice of [500, 1800, 2000, 2200, 10000]) {
    const r = rangeCase({ ...input, futurePrice, lowerPrice: 1999, upperPrice: 2001 });
    assert.equal(r.feeIncome, 600);
    assert.equal(r.holdValue, r.initial.eth * futurePrice + r.initial.usdc);
  }
  close(rangeCase({ ...input, feeDays: 182.5 }).feeIncome, 300);
  close(rangeCase({ ...input, investment: 10000 }).feeIncome, 1200);
  close(rangeCase({ ...input, feeDays: 730 }).feeIncome, 1200);
});

test('a range uses its own basket, and the 50/50 reference shares only the explicit cost budget', () => {
  const r = rangeCase({ futurePrice: 4000, feeMode: 'apr', feeAPR: 24, feeDays: 365,
    fullRangeFees: 50, openingCost: 20, collectionCost: 5, closingCost: 25 });
  close(r.lpValue, r.lpBeforeFees + 1200 - 50);
  close(r.fullRange.lpValue, 5000 * Math.sqrt(2));
  assert.equal(r.fullRange.feeIncome, 50); assert.equal(r.fullRange.holdValue, 7500);
  assert.notEqual(r.holdValue, r.fullRange.holdValue);
  close(range.calculateRange(range.matchHoldingFees(r)).difference, 0);
  for (const changed of [range.rangePreset(r, .05), range.futurePricePreset(r, 'below')]) {
    assert.equal(changed.feeAPR, 24); assert.equal(changed.closingCost, 25); assert.equal(changed.feeMode, 'apr');
  }
});

test('legacy models, upgrades, URLs and saved views retain all original accounting', () => {
  for (const [old, current, defaults, calc, upgrade, hash, parse] of [
    [fullOld, full, 'DEFAULT_SCENARIO', 'calculateScenario', 'upgradeScenario', scenarioHash, scenarioFromHash],
    [rangeOld, range, 'DEFAULT_RANGE', 'calculateRange', 'upgradeRange', rangeHash, rangeFromHash],
  ]) {
    for (const futurePrice of [100, 1800, 2000, 2100, 2200, 50000]) {
      const input = { ...old[defaults], futurePrice }, expected = old[calc](input), converted = current[upgrade](input), actual = current[calc](converted);
      for (const key of ['lpValue', 'holdValue', 'lpBeforeFees', 'difference', 'impermanentLoss', 'breakEvenFees']) close(actual[key], expected[key]);
      assert.equal(actual.feeDays, 0); assert.equal(actual.costs, 0); assert.equal(actual.breakEvenAPR, null);
      assert.deepEqual(parse(hash(input)), input);
      assert.equal(readSharedScenario(hash(input)).model, old.MODEL);
      assert.deepEqual(experimentView({ model: old.MODEL, inputs: input }).result, expected);
    }
  }
});

test('v2 assumptions round-trip through links, libraries, return drafts, Home resume, facts and CSV', () => {
  const memory = new Map(), storage = { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) };
  const drafts = [];
  for (const [module, defaults, hash, parse, csv] of [
    [full, 'DEFAULT_SCENARIO', scenarioHash, scenarioFromHash, scenarioCSV],
    [range, 'DEFAULT_RANGE', rangeHash, rangeFromHash, rangeCSV],
  ]) {
    const inputs = { ...module[defaults], feeMode: 'apr', feeAPR: 17.25, feeDays: 45.5,
      fees: 123, openingCost: 11, collectionCost: 7, closingCost: 13 };
    const draft = validateExperimentDraft({ model: module.MODEL, inputs }); drafts.push(draft);
    assert.deepEqual(parse(hash(inputs)), inputs);
    assert.deepEqual(readSharedScenario(hash(inputs)), { model: module.MODEL, scenario: inputs });
    assert.equal(saveExperimentLocation(module.MODEL, hash(inputs), () => storage), true);
    assert.equal(readExperimentLocation(() => storage).route, 'liquidity.html' + hash(inputs));
    const entry = createExperiment(draft, 'Fees and costs', 'Period-average assumption');
    const library = { version: 1, kind: 'degenerator-experiments', experiments: [entry] };
    assert.deepEqual(parseLibrary(libraryJSON(library)), library);
    assert.match(experimentFacts(entry, true).flat().join(' '), /17.2500% average APR/);
    const [headers, row] = csv(inputs).trim().split('\r\n').map(line => line.split(','));
    const values = Object.fromEntries(headers.map((name, index) => [name, row[index]]));
    assert.equal(values.model, module.MODEL); assert.equal(values.cash_fee_input_usd, '123');
    assert.equal(values.assumed_average_fee_apr_percent, '17.25'); assert.equal(values.duration_days_0_unspecified, '45.5');
    assert.equal(values.opening_cost_usd, '11'); assert.equal(values.cost_scope, 'additional_to_holding');
    const netKey = module === full ? 'lp_after_fees_and_costs_usd' : 'range_lp_after_fees_and_costs_usd';
    const expected = liquidityModel(module.MODEL).calculate({ ...inputs, futurePrice: Number(values.future_eth_price_usd) });
    close(Number(values[netKey]), expected.lpValue);
    assert.match(comparisonContext([entry, { ...entry, inputs: { ...inputs, feeDays: 90 } }]), /not been synchronized/);
  }
  assert.deepEqual(validateLearnReturn({ version: 1, activeModel: range.MODEL, drafts }).drafts, drafts);
});

test('invalid modes, missing APR duration, hostile links and unsupported model versions are rejected', () => {
  for (const patch of [{ feeMode: 'forecast' }, { feeMode: 'apr', feeDays: 0 }, { feeAPR: Infinity },
    { feeDays: -1 }, { openingCost: -1 }, { collectionCost: NaN }, { closingCost: 1e9 + 1 }]) {
    assert.throws(() => fullCase(patch)); assert.throws(() => rangeCase(patch));
  }
  assert.throws(() => scenarioFromHash(scenarioHash(full.DEFAULT_SCENARIO) + '&days=60'));
  assert.throws(() => rangeFromHash(rangeHash(range.DEFAULT_RANGE).replace('feeMode=cash', 'feeMode=')));
  assert.equal(liquidityModel('__proto__'), null);
  assert.throws(() => readSharedScenario('#scenario=cp50-v3'));
});

test('fee target uses saved duration and costs; cash without a period never invents an annual rate', () => {
  const r = fullCase({ futurePrice: 2000, fees: 30, openingCost: 100, feeDays: 10 });
  const target = feeTarget(r, 90);
  assert.equal(target.days, 10); assert.equal(target.daily, 10); assert.equal(target.remaining, 70);
  const noTime = fullCase({ feeDays: 0 });
  assert.equal(feeTarget(noTime).daily, null); assert.equal(noTime.breakEvenAPR, null);
  const extreme = rangeCase({ investment: 1e9, feeMode: 'apr', feeAPR: 10000, feeDays: 3650 });
  assert.equal(extreme.feeIncome, 1e12); assert.ok(Number.isFinite(extreme.lpValue));
});
