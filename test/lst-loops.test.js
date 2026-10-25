import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLST, validateLST, LST_DEFAULTS, LST_MODEL, LST_KEYS } from '../public/models/lst-loop-v1.js';
import { lstHash, readLSTHash } from '../public/lib/lst-links.js';
import { readLSTDraft, saveLSTDraft, LST_DRAFT_KEY } from '../public/data/lst-state.js';
import { createExperiment, emptyLibrary, addExperiment, libraryJSON, parseLibrary } from '../public/data/saved-experiments.js';
import { experimentView, experimentFacts, comparisonContext } from '../public/lib/saved-experiments.js';
import { saveExperimentLocation, readExperimentLocation } from '../public/data/experiment-location.js';

const input = changes => ({ ...LST_DEFAULTS, ...changes });
const near = (actual, expected, scale = 1e-11) => assert.ok(Math.abs(actual - expected) <= scale * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const memory = () => {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
};

test('LST construction matches a geometric series and conserves net value through every action', () => {
  for (const rounds of [0, 1, 3, 8]) {
    const p = input({ rounds, swapCost: 0.3, days: 0 }), r = calculateLST(p);
    const a = p.borrowPercent / 100 * (1 - p.swapCost / 100);
    const supplied = p.collateral * (1 - a ** (rounds + 1)) / (1 - a);
    const borrowed = rounds === 0 ? 0 : p.collateral * p.rate * p.borrowPercent / 100 * (1 - a ** rounds) / (1 - a);
    near(r.start.collateral, supplied); near(r.start.debt, borrowed);
    near(r.start.net, p.collateral * p.rate - borrowed * p.swapCost / 100);
    for (let index = 1; index < r.steps.length; index++) {
      const before = r.steps[index - 1].position, step = r.steps[index];
      near(step.position.net, before.net - (step.cost ?? 0));
      if (step.action === 'borrow') {
        near(step.position.walletWETH, step.amount);
        assert.ok(step.position.debt <= step.position.collateral * p.rate * p.maxLTV / 100 + 1e-10);
      }
      if (step.action === 'buy') { assert.equal(step.position.walletWETH, 0); near(step.position.walletLST, step.amount); }
      if (step.action === 'supply') assert.equal(step.position.walletLST, 0);
    }
  }
});

test('staking grows the conversion rate, while additional lending yield grows token quantity once', () => {
  const p = input({ days: 365, stakingAPY: 3, lendingAPY: 5 }), r = calculateLST(p);
  near(r.rate, p.rate * 1.03);
  near(r.end.collateral, r.start.collateral * 1.05);
  near(r.stakingGain + r.lendingGain, r.end.collateral * r.rate - r.start.collateral * p.rate);
  near(r.holding, p.collateral * p.rate * 1.03);
  const noLending = calculateLST(input({ lendingAPY: 0 }));
  near(noLending.end.collateral, noLending.start.collateral);
  near(noLending.lendingGain, 0);
});

test('piecewise borrow APR integrates the actual days on each side of the change', () => {
  const p = input({ rateChange: true, borrowAPR: 2, laterAPR: 8, changeDay: 90, days: 365 });
  const r = calculateLST(p);
  near(r.end.debt, r.start.debt * Math.exp((0.02 * 90 + 0.08 * 275) / 365));
  near(r.averageBorrowAPR, (2 * 90 + 8 * 275) / 365);
  for (const changeDay of [0, 365, 900]) {
    const alternative = calculateLST({ ...p, changeDay });
    near(alternative.end.debt, alternative.start.debt * Math.exp((changeDay === 0 ? 8 : 2) / 100));
  }
});

test('the value bridge reconciles construction, two kinds of yield, interest and market discount', () => {
  for (const stakingAPY of [-20, 0, 3, 20]) for (const lendingAPY of [0, 5]) for (const discount of [0, 10, 50]) {
    const r = calculateLST(input({ stakingAPY, lendingAPY, discount, rateChange: true, days: 540 }));
    near(r.end.net, r.initialValue - r.buildCosts + r.stakingGain + r.lendingGain - r.borrowInterest - r.discountLoss);
    near(r.vsHolding, r.end.net - r.holding);
  }
});

test('zero rounds and zero additional lending yield match holding the exact original wstETH', () => {
  const r = calculateLST(input({ rounds: 0, discount: 20, days: 730, gas: 0.01 }));
  near(r.vsHolding, 0); assert.equal(r.end.healthFactor, null); assert.equal(r.firstRateBoundary, null);
  near(r.exit.cash, r.holdingAfterExit);
  assert.equal(r.exit.flashCost, 0);
});

test('ETH dollar price cannot change ETH-denominated balances, health factor or liquidation', () => {
  const first = calculateLST(input({ ethUSD: 100, discount: 30 }));
  const second = calculateLST(input({ ethUSD: 100000, discount: 30 }));
  assert.deepEqual(first.end, second.end);
  assert.deepEqual(first.liquidation, second.liquidation);
  assert.deepEqual(first.exit, second.exit);
});

test('sale price and oracle price are independent assumptions', () => {
  const base = calculateLST(input({ discount: 0 }));
  const market = calculateLST(input({ discount: 20, oracleMode: 'market' }));
  const rate = calculateLST(input({ discount: 20, oracleMode: 'rate' }));
  near(market.end.net, rate.end.net);
  near(market.end.healthFactor, base.end.healthFactor * 0.8);
  near(rate.end.healthFactor, base.end.healthFactor);
  assert.ok(rate.end.marketPrice < rate.end.oraclePrice);
});

test('an earlier rate-only liquidation boundary is not erased by a later recovery', () => {
  const r = calculateLST(input({ rounds: 8, borrowPercent: 95, maxLTV: 97, threshold: 98,
    swapCost: 0, stakingAPY: 20, borrowAPR: 100, rateChange: true, laterAPR: 0, changeDay: 90 }));
  assert.ok(r.firstRateBoundary > 0 && r.firstRateBoundary < 90);
  assert.ok(r.end.healthFactor > 1);
  assert.equal(r.exit.status, 'boundary');
  near(r.firstRateBoundary, Math.log(r.start.healthFactor) * 365 / (1 - Math.log(1.2)));
  assert.deepEqual(r.exit.remaining, r.end);
});

test('an exact endpoint boundary is flagged, and liquidation keeps unpaid debt', () => {
  const base = calculateLST(input({ days: 0 }));
  const discount = 100 * (1 - 1 / base.end.healthFactor);
  const r = calculateLST(input({ days: 0, discount }));
  assert.equal(r.end.status, 'boundary');
  assert.equal(r.exit.status, 'boundary');
  near(r.liquidation.repay, r.end.debt * 0.5);
  near(r.liquidation.remaining.debt, r.end.debt * 0.5);
  near(r.liquidation.netChange, -r.liquidation.bonusAtOracle);
});

test('liquidation cannot seize more collateral or silently erase bad debt', () => {
  const r = calculateLST(input({ days: 1825, borrowAPR: 100, discount: 50, repayPercent: 100 }));
  assert.ok(r.liquidation.remaining.debt > 0);
  near(r.liquidation.seized, r.end.collateral);
  near(r.liquidation.remaining.collateral, 0);
  near(r.end.debt, r.liquidation.repay + r.liquidation.remaining.debt);
});

test('atomic exit carries both debts until repayment and subtracts each cost once', () => {
  const r = calculateLST(input()), e = r.exit;
  assert.equal(e.status, 'complete');
  const states = Object.fromEntries(e.steps.map(step => [step.action, step.position]));
  near(states.flash.net, r.end.net);
  near(states.flash.debt, r.end.debt); near(states.flash.flashDebt, r.end.debt);
  assert.equal(states.repay.debt, 0); assert.equal(states.repay.walletWETH, 0);
  near(states.repay.net, r.end.net); near(states.release.net, r.end.net);
  near(states.sell.net, r.end.net - e.swapLoss);
  near(e.cash, r.end.net - e.swapLoss - e.flashCost - e.gas);
  assert.equal(e.remaining.debt, 0); assert.equal(e.remaining.flashDebt, 0);
  near(e.remaining.net, e.cash);
});

test('unavailable or underfunded exits retain the original balances and do not invent a flash loan', () => {
  for (const changes of [{ exitAvailable: false }, { gas: 100 }, { discount: 50, oracleMode: 'rate', rounds: 8, borrowPercent: 95, maxLTV: 97, threshold: 98 }]) {
    const r = calculateLST(input(changes));
    assert.notEqual(r.exit.status, 'complete');
    assert.equal(r.exit.cash, null); assert.deepEqual(r.exit.steps, []);
    assert.deepEqual(r.exit.remaining, r.end);
  }
});

test('calculated break-even APR reproduces the exact unlooped benchmark', () => {
  for (const days of [1, 30, 365, 1000]) {
    const p = input({ days, swapCost: 0 }), r = calculateLST(p);
    assert.ok(r.breakEvenAPR >= 0);
    const breakEven = calculateLST({ ...p, borrowAPR: r.breakEvenAPR, rateChange: false });
    near(breakEven.vsHolding, 0);
  }
  assert.equal(calculateLST(input({ days: 0 })).breakEvenAPR, null);
});

test('inputs reject missing, nonfinite, unsafe and fractional construction assumptions', () => {
  for (const changes of [{ rounds: 1.5 }, { rate: 0 }, { days: Infinity }, { discount: NaN }, { stakingAPY: -100 },
    { threshold: 90, maxLTV: 90 }, { borrowPercent: 95, maxLTV: 90 }, { oracleMode: 'aave' }, { rateChange: 'false' }, { exitAvailable: null }]) {
    assert.ok(Object.keys(validateLST(input(changes))).length);
    assert.throws(() => calculateLST(input(changes)), RangeError);
  }
  for (const key of LST_KEYS) { const p = input(); delete p[key]; assert.ok(Object.keys(validateLST(p)).length); }
});

test('links retain every assumption and view, reject ambiguous data, and remain separate from legacy loops', () => {
  const p = input({ rateChange: true, oracleMode: 'rate', exitAvailable: false });
  for (const view of ['build', 'hold', 'exit']) assert.deepEqual(readLSTHash(lstHash(p, view)), { status: 'ready', input: p, view });
  const good = lstHash(p);
  for (const invalid of [good + '&days=4', good + '&unexpected=true', good.replace('rateChange=true', 'rateChange=1'), good.replace('lst-loop-v1', 'lst-loop-v2'), good.replace('collateral=5', 'collateral=')]) {
    assert.equal(readLSTHash(invalid).status, 'invalid');
  }
  assert.equal(readLSTHash('#loop=borrowing-loop-v1').status, 'none');
});

test('drafts, named experiments and Home resumption keep the new model independent', () => {
  const store = memory(), storage = () => store, p = input();
  assert.equal(readLSTDraft(storage).status, 'empty');
  assert.ok(saveLSTDraft(p, 'exit', storage));
  assert.deepEqual(readLSTDraft(storage), { input: p, view: 'exit', status: 'ready' });
  assert.equal(saveLSTDraft(input({ rate: 0 }), 'exit', storage), false);
  assert.deepEqual(readLSTDraft(storage).input, p);
  const entry = createExperiment({ model: LST_MODEL, inputs: p, origin: null }, 'LST carry', 'My assumptions');
  const library = parseLibrary(libraryJSON(addExperiment(emptyLibrary(), entry)));
  assert.deepEqual(library.experiments[0], entry);
  const view = experimentView(entry);
  assert.equal(view.family, 'correlated'); assert.equal(view.page, 'lending.html');
  assert.match(experimentFacts(entry)[0][1], /WETH/);
  assert.match(comparisonContext([entry, { ...entry, inputs: input({ borrowAPR: 6 }) }]), /different conditions/);
  assert.ok(saveExperimentLocation(LST_MODEL, view.hash, storage));
  assert.equal(readExperimentLocation(storage).route, 'lending.html' + view.hash);
  store.setItem(LST_DRAFT_KEY, '{bad data');
  assert.equal(readLSTDraft(storage).status, 'invalid');
  assert.equal(store.getItem(LST_DRAFT_KEY), '{bad data');
  assert.equal(readLSTDraft(() => { throw new Error('Blocked storage'); }).status, 'unavailable');
});
