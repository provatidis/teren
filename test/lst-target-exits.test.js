import test from 'node:test';
import assert from 'node:assert/strict';
import { LST_DEFAULTS, LST_KEYS, LST_MODEL, calculateLST, validateLST, targetExposureLimit, upgradeLST } from '../public/models/lst-loop-v2.js';
import { LST_DEFAULTS as OLD_DEFAULTS, calculateLST as calculateOld } from '../public/models/lst-loop-v1.js';
import { lstHash, readLSTHash } from '../public/lib/lst-links.js';
import { LST_DRAFT_KEY, readLSTDraft, saveLSTDraft } from '../public/data/lst-state.js';
import { createExperiment, addExperiment, emptyLibrary, libraryJSON, parseLibrary } from '../public/data/saved-experiments.js';
import { experimentView, comparisonContext, experimentFacts, experimentSummary, defaultExperimentName } from '../public/lib/saved-experiments.js';
import { saveExperimentLocation, readExperimentLocation } from '../public/data/experiment-location.js';

const input = changes => ({ ...LST_DEFAULTS, ...changes });
const near = (actual, expected, tolerance = 1e-11) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };

test('target exposure purchases the exact token quantity and finances each build cost once', () => {
  const r = calculateLST(input({ targetExposure: 3, days: 0, swapCost: 1, buildFlashFee: 1 }));
  // 5 original wstETH at 1.2 WETH. Buying 10 more after 1% loss needs
  // 12 / .99 WETH; long-term borrowing also finances the 1% flash fee.
  near(r.start.collateral, 15);
  near(r.start.debt, 12 / .99 * 1.01);
  near(r.buildCosts, 12 / .99 * .01);
  near(r.buildFlashCost, 12 / .99 * .01);
  near(r.start.net, 6 - r.buildCosts - r.buildFlashCost);
  assert.equal(r.exposure, 3);
  for (let i = 1; i < r.steps.length; i++) {
    const step = r.steps[i], before = r.steps[i - 1].position;
    near(step.position.net, before.net - (step.cost ?? 0));
  }
  const states = Object.fromEntries(r.steps.map(step => [step.action, step.position]));
  near(states['build-flash'].walletWETH, states['build-flash'].flashDebt);
  assert.equal(states['build-flash'].debt, 0);
  assert.equal(states.buy.walletWETH, 0);
  assert.equal(states.supply.walletLST, 0);
  near(states.finance.walletWETH, r.start.debt);
  near(states.finance.flashDebt, 12 / .99);
  assert.ok(states.finance.debt <= states.finance.collateralValue * .9);
  assert.equal(r.start.walletWETH, 0); assert.equal(r.start.flashDebt, 0);
});

test('1x target has no purchase, loan or flash fee and matches unlooped holding', () => {
  const r = calculateLST(input({ targetExposure: 1, discount: 20, lendingAPY: 0, days: 730 }));
  assert.equal(r.steps.length, 1); assert.equal(r.start.debt, 0);
  assert.equal(r.buildCosts, 0); assert.equal(r.buildFlashCost, 0);
  near(r.vsHolding, 0); assert.equal(r.end.healthFactor, null);
});

test('the target limit includes swap loss and financed flash fees and never clamps a requested position', () => {
  for (const swapCost of [0, .1, 5]) for (const buildFlashFee of [0, .05, 5]) for (const maxLTV of [10, 75, 90, 98]) {
    const p = input({ swapCost, buildFlashFee, maxLTV, threshold: 99, days: 0 });
    const limit = targetExposureLimit(p), at = calculateLST({ ...p, targetExposure: limit });
    near(at.start.debt / at.start.collateralValue, maxLTV / 100);
    assert.ok(at.start.healthFactor > 1);
    assert.ok(validateLST({ ...p, targetExposure: limit * 1.00001 }).targetExposure);
  }
  assert.throws(() => calculateLST(input({ targetExposure: 10 })), RangeError);
  assert.equal(validateLST(input({ maxLTV: 40, targetExposure: 1.5 })).borrowPercent, undefined);
  assert.ok(validateLST(input({ buildMode: 'rounds', maxLTV: 40 })).borrowPercent);
});

test('all new assumptions are required and malformed or nonfinite targets are rejected', () => {
  for (const key of LST_KEYS) { const p = input(); delete p[key]; assert.ok(Object.keys(validateLST(p)).length, key); }
  for (const changes of [{ targetExposure: .99 }, { targetExposure: Infinity }, { targetExposure: '3' },
    { buildMode: 'flash-on-aave' }, { exitMode: 'ETH' }, { buildFlashFee: -1 }, { buildFlashFee: NaN }]) {
    assert.throws(() => calculateLST(input(changes)), RangeError);
  }
});

test('round-mode upgrade preserves legacy construction, accrual, liquidation and full-WETH exit', () => {
  for (const rounds of [0, 1, 8]) for (const oracleMode of ['rate', 'market']) {
    const p = { ...OLD_DEFAULTS, rounds, oracleMode, days: 730, discount: 25, rateChange: true };
    const old = calculateOld(p), now = calculateLST(upgradeLST(p));
    for (const key of ['initial', 'steps', 'start', 'end', 'rate', 'exposure', 'firstRateBoundary', 'liquidation', 'vsHolding']) {
      assert.deepEqual(now[key], old[key], key);
    }
    for (const [key, value] of Object.entries(old.exit)) assert.deepEqual(now.exit[key], value, key);
    assert.equal(now.input.exitMode, 'weth'); assert.equal(now.input.buildMode, 'rounds');
    assert.equal(now.input.oracleMode, oracleMode);
  }
});

test('the value bridge and break-even rate include target-construction costs before interest', () => {
  for (const targetExposure of [1.1, 3, 8]) for (const stakingAPY of [-20, 0, 3, 20]) for (const discount of [0, 25, 50]) {
    const r = calculateLST(input({ targetExposure, stakingAPY, discount, lendingAPY: 2, rateChange: true }));
    near(r.end.net, r.initialValue - r.buildCosts - r.buildFlashCost + r.stakingGain + r.lendingGain - r.borrowInterest - r.discountLoss);
  }
  const r = calculateLST(input());
  const matched = calculateLST(input({ borrowAPR: r.breakEvenAPR }));
  near(matched.vsHolding, 0);
});

test('keep-wstETH exit sells only enough to clear principal, fee and flat cost', () => {
  const r = calculateLST(input({ collateral: 10, rate: 1, targetExposure: 2, swapCost: 0, buildFlashFee: 0,
    days: 0, exitCost: 20, flashFee: 5, gas: 1.5, exitMode: 'wsteth' }));
  const e = r.exit;
  // 20 wstETH and 10 WETH debt. Sell 15 tokens for 12 WETH after 20%
  // loss: 10 principal + .5 flash fee + 1.5 flat cost. Keep 5 tokens.
  assert.equal(e.status, 'complete'); near(e.sold, 15); near(e.retained, 5);
  near(e.swapLoss, 3); near(e.flashCost, .5); near(e.remaining.net, 5);
  assert.equal(e.cash, 0); assert.equal(e.remaining.debt, 0); assert.equal(e.remaining.flashDebt, 0);
  assert.equal(e.remaining.collateral, 0); near(e.remaining.walletLST, 5);
  near(r.exits.weth.cash, 4);
  near(e.remaining.net, r.end.net - e.swapLoss - e.flashCost - e.gas);
  const sale = e.steps.find(step => step.action === 'sell-part');
  near(sale.position.walletWETH, 12); near(sale.position.walletLST, 5);
  near(sale.position.flashDebt, 10);
});

test('retained exit uses the discounted sale price even when the oracle follows conversion', () => {
  const base = input({ days: 0, targetExposure: 2, exitMode: 'wsteth' });
  const plain = calculateLST(base), discounted = calculateLST({ ...base, discount: 20 });
  near(plain.end.healthFactor, discounted.end.healthFactor);
  assert.ok(discounted.exit.sold > plain.exit.sold);
  assert.ok(discounted.exit.retained < plain.exit.retained);
  near(discounted.exit.sold * discounted.end.marketPrice * (1 - base.exitCost / 100), discounted.end.debt + discounted.exit.flashCost + base.gas);
});

test('switching exit destination preserves the position and accounts for the different amount sold', () => {
  const p = input(), sell = calculateLST(p), keep = calculateLST({ ...p, exitMode: 'wsteth' });
  assert.deepEqual(sell.end, keep.end);
  assert.deepEqual(sell.exits, keep.exits);
  near(keep.exit.remaining.net - sell.exit.cash, keep.exit.retained * keep.end.marketPrice * p.exitCost / 100);
  for (const exit of Object.values(keep.exits)) {
    assert.equal(exit.remaining.debt, 0); assert.equal(exit.remaining.flashDebt, 0);
    assert.ok(exit.remaining.net <= keep.end.net);
  }
});

test('without debt a retained exit skips flash borrowing, but funds a nonzero withdrawal cost', () => {
  const free = calculateLST(input({ targetExposure: 1, days: 0, gas: 0, exitMode: 'wsteth' })).exit;
  assert.equal(free.retained, 5); assert.equal(free.sold, 0);
  assert.deepEqual(free.steps.map(step => step.action), ['start', 'release', 'keep']);
  const paid = calculateLST(input({ targetExposure: 1, days: 0, gas: .01, exitMode: 'wsteth' })).exit;
  assert.ok(paid.sold > 0); assert.equal(paid.flashCost, 0);
  assert.ok(!paid.steps.some(step => step.action === 'flash'));
});

test('blocked exits move nothing and retain debt for unavailability, shortfall and current/earlier boundaries', () => {
  const cases = [{ exitAvailable: false }, { gas: 100 }, { discount: 50, targetExposure: 8, days: 0 },
    { oracleMode: 'market', discount: 50 },
    { targetExposure: 8, stakingAPY: 20, borrowAPR: 100, rateChange: true, laterAPR: 0, changeDay: 90 }];
  for (const changes of cases) {
    const r = calculateLST(input(changes));
    for (const e of Object.values(r.exits)) {
      assert.notEqual(e.status, 'complete'); assert.equal(e.cash, null); assert.equal(e.retained, null);
      assert.deepEqual(e.steps, []); assert.deepEqual(e.remaining, r.end);
    }
  }
});

test('complete new links retain target, fees and exit destination; old links remain unchanged', () => {
  const p = input({ targetExposure: 3.456789, buildFlashFee: .123, exitMode: 'wsteth' });
  for (const view of ['build', 'hold', 'exit']) assert.deepEqual(readLSTHash(lstHash(p, view)), { status: 'ready', input: p, view });
  const hash = lstHash(p);
  for (const broken of [hash + '&exitMode=weth', hash.replace('&targetExposure=3.456789', ''), hash.replace('lst-loop-v2', 'lst-loop-v3'), hash.replace('exitMode=wsteth', 'exitMode=eth')]) {
    assert.equal(readLSTHash(broken).status, 'invalid');
  }
  assert.deepEqual(readLSTHash(lstHash(OLD_DEFAULTS)).input, OLD_DEFAULTS);
});

test('both model versions survive drafts, mixed saved libraries, exports and Home resumption', () => {
  const store = memory(), storage = () => store, p = input({ exitMode: 'wsteth' });
  assert.equal(readLSTDraft(storage).input.buildMode, 'target');
  assert.ok(saveLSTDraft(OLD_DEFAULTS, 'exit', storage));
  assert.deepEqual(readLSTDraft(storage).input, OLD_DEFAULTS);
  assert.ok(saveLSTDraft(p, 'exit', storage));
  assert.equal(JSON.parse(store.getItem(LST_DRAFT_KEY)).version, 2);
  assert.deepEqual(readLSTDraft(storage), { input: p, view: 'exit', status: 'ready' });
  assert.equal(saveLSTDraft({ ...p, targetExposure: 50 }, 'exit', storage), false);
  assert.deepEqual(readLSTDraft(storage).input, p);
  const old = createExperiment({ model: 'lst-loop-v1', inputs: OLD_DEFAULTS }, 'Original rounds', '');
  const fresh = createExperiment({ model: LST_MODEL, inputs: p }, 'Keep staked ETH', '');
  const restored = parseLibrary(libraryJSON(addExperiment(addExperiment(emptyLibrary(), old), fresh)));
  assert.deepEqual(restored.experiments, [fresh, old]);
  const view = experimentView(fresh);
  assert.equal(view.result.exit.mode, 'wsteth');
  assert.match(experimentFacts(fresh, true).map(row => row.join(' ')).join('\n'), /target|Target/);
  assert.match(comparisonContext([fresh, old]), /different exit destinations/);
  assert.ok(saveExperimentLocation(LST_MODEL, view.hash, storage));
  assert.equal(readExperimentLocation(storage).route, 'lending.html' + view.hash);
});

test('saved LST descriptions retain fractional time and discount assumptions', () => {
  for (const [model, defaults] of [['lst-loop-v1', OLD_DEFAULTS], [LST_MODEL, LST_DEFAULTS]]) {
    for (const [days, discount] of [[7.25, .55], [7.123456, .123456]]) {
      const entry = { model, inputs: { ...defaults, days, discount } };
      assert.equal(experimentFacts(entry, true).find(([label]) => label === 'Time / market discount')[1], `${days} days / ${discount}%`);
      assert.ok(experimentSummary(entry).includes(`${days} days · ${discount}% market discount`));
      assert.ok(defaultExperimentName(entry).endsWith(`${discount}% discount`));
    }
  }
});
