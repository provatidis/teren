import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOP_DEFAULTS, calculateLoop } from '../public/models/borrowing-loop-v1.js';
import { loopLiquidation, loopPriceDomain } from '../public/models/loop-risk.js';
import { loopHash, readLoopHash } from '../public/lib/loop-links.js';
import { readLoopDraft, saveLoopDraft } from '../public/data/loop-state.js';
import { validateExperimentDraft, createExperiment, addExperiment, emptyLibrary, libraryJSON, parseLibrary } from '../public/data/saved-experiments.js';
import { experimentView } from '../public/lib/saved-experiments.js';
import { boundaryDistance } from '../public/lib/lending-presentation.js';
import { LST_DEFAULTS, calculateLST } from '../public/models/lst-loop-v1.js';
import { lstHash, readLSTHash } from '../public/lib/lst-links.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), actual + ' ≠ ' + expected);
const input = { ...LOOP_DEFAULTS, future: 800 };
const assumptions = { repayPercent: 50, bonusPercent: 5 };

test('loop liquidation uses accrued collateral and debt without inventing wallet cash', () => {
  const result = calculateLoop(input);
  const unchanged = structuredClone(result);
  const event = loopLiquidation(result, assumptions);
  close(event.beforeNetAssets, 994);
  assert.equal(event.repaid, 2500);
  assert.equal(event.removedTokens, 3.28125);
  close(event.remainingTokens, 4.21125);
  assert.equal(event.remainingDebt, 2500);
  assert.equal(event.penalty, 125);
  close(event.netAssets, 869);
  close(event.remainingHealth, 1.07808);
  assert.deepEqual(result, unchanged);
});

test('loop event caps repayment, keeps exhausted debt and separates the bonus from repayment', () => {
  for (const changes of [{ future: 300 }, { future: 700, days: 365 }, { future: .01, days: 1825, borrowAPR: 100 }]) {
    const result = calculateLoop({ ...input, ...changes });
    for (const eventInput of [assumptions, { repayPercent: 100, bonusPercent: 0 }, { repayPercent: 1, bonusPercent: 30 }]) {
      const event = loopLiquidation(result, eventInput);
      assert.equal(event.status, 'executed');
      close(event.beforeNetAssets - event.netAssets, event.penalty);
      close(event.remainingDebt + event.repaid, result.end.debt);
      close(event.removedTokens + event.remainingTokens, result.end.collateralTokens);
      close(event.removedValue, event.repaid + event.penalty);
      assert.ok(event.remainingDebt >= 0 && event.remainingTokens >= 0);
      if (event.exhausted) {
        assert.equal(event.remainingTokens, 0);
        close(event.netAssets, -event.remainingDebt);
      }
    }
  }
});

test('no debt, an exact boundary and an above-boundary loop never execute a liquidation', () => {
  const zeroCost = { ...LOOP_DEFAULTS, swapCost: 0 };
  const boundary = calculateLoop(zeroCost).end.boundaryPrice;
  for (const scenario of [LOOP_DEFAULTS, { ...zeroCost, future: boundary }, { ...input, rounds: 0 }]) {
    assert.equal(loopLiquidation(calculateLoop(scenario)).status, 'ineligible');
  }
  assert.throws(() => loopLiquidation(calculateLoop(input), { ...assumptions, bonusPercent: NaN }));
});

test('loop chart domain includes selected prices and both accrued boundaries, including extreme rates', () => {
  for (const changes of [{}, { future: .01 }, { future: 1e7 }, { days: 1825, borrowAPR: 100 }, { rounds: 0 }]) {
    const result = calculateLoop({ ...LOOP_DEFAULTS, ...changes });
    const reference = calculateLoop({ ...result.input, rounds: 5, borrowPercent: 75 });
    const domain = loopPriceDomain(result, reference);
    for (const price of [result.input.start, result.input.future, result.end.boundaryPrice, reference.end.boundaryPrice].filter(x => x !== null)) {
      assert.ok(price > domain.low && price < domain.high);
    }
    assert.ok(Number.isFinite(domain.low) && Number.isFinite(domain.high));
  }
});

test('distance descriptions identify the selected price and avoid rounding tiny distances to zero', () => {
  assert.equal(boundaryDistance(2000, 1250), '37.50% below the selected price, at these balances.');
  assert.equal(boundaryDistance(1000, 1250), '25.00% above the selected price, at these balances.');
  assert.match(boundaryDistance(1250.0001, 1250), /Less than 0.01% below/);
  assert.match(boundaryDistance(1250, 1250), /^At the boundary/);
  assert.equal(boundaryDistance(2000, null), '');
});

test('loop event links preserve legacy inputs, comparison metadata and explicit event assumptions', () => {
  const legacy = loopHash(input, 3, 60);
  const hash = loopHash(input, 3, 60, assumptions);
  assert.deepEqual(readLoopHash(legacy), { status: 'ready', input, comparisonRounds: 3, comparisonBorrowPercent: 60 });
  assert.deepEqual(readLoopHash(hash), { ...readLoopHash(legacy), liquidation: assumptions });
  for (const bad of [legacy + '&bonusPercent=5', hash + '&repayPercent=40', hash.replace('single-liquidation-v1', 'unknown'), hash.replace('bonusPercent=5', 'bonusPercent='), hash.replace('repayPercent=50', 'repayPercent=101')]) {
    assert.equal(readLoopHash(bad).status, 'invalid');
  }
});

test('drafts and named experiment backups retain event assumptions without corrupting valid records', () => {
  const data = new Map();
  const storage = () => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) });
  assert.equal(saveLoopDraft(input, storage, 3, 60, assumptions), true);
  assert.deepEqual(readLoopDraft(storage).liquidation, assumptions);
  assert.equal(saveLoopDraft(input, storage, 3, 60, { ...assumptions, bonusPercent: -1 }), false);
  assert.deepEqual(readLoopDraft(storage).liquidation, assumptions);
  const draft = validateExperimentDraft({ model: 'borrowing-loop-v1', inputs: input, liquidation: assumptions, comparison: { rounds: 3, borrowPercent: 60 } });
  const entry = createExperiment(draft, 'Liquidation case', '', { id: '10000000-0000-4000-8000-000000000001', now: '2026-10-26T12:00:00Z' });
  const restored = parseLibrary(libraryJSON(addExperiment(emptyLibrary(), entry))).experiments[0];
  assert.deepEqual(restored.liquidation, assumptions);
  assert.deepEqual(restored.comparison, draft.comparison);
  assert.deepEqual(readLoopHash(experimentView(restored).hash).liquidation, assumptions);
  assert.equal(validateExperimentDraft({ model: 'borrowing-loop-v1', inputs: input }).liquidation, undefined);
});

test('new LST setups use conversion valuation while market-oracle links retain their original results', () => {
  assert.equal(LST_DEFAULTS.oracleMode, 'rate');
  const legacy = { ...LST_DEFAULTS, oracleMode: 'market', discount: 20 };
  const restored = readLSTHash(lstHash(legacy, 'hold'));
  assert.equal(restored.input.oracleMode, 'market');
  close(calculateLST(restored.input).end.healthFactor, calculateLST({ ...legacy, discount: 0 }).end.healthFactor * .8);
  close(calculateLST({ ...LST_DEFAULTS, discount: 20 }).end.healthFactor, calculateLST(LST_DEFAULTS).end.healthFactor);
});
