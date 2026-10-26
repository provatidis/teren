import test from 'node:test';
import assert from 'node:assert/strict';
import { LOAN_DEFAULTS, calculateLoan, validateLoan, upgradeLoan } from '../public/models/collateral-loan-v2.js';
import { LOAN_DEFAULTS as OLD_DEFAULTS, calculateLoan as legacyLoan } from '../public/models/collateral-loan-v1.js';
import { loanModel, calculateLoanForInput } from '../public/models/loan-models.js';
import { interestReference, healthPriceCurve, singleLiquidation } from '../public/models/loan-explanations.js';
import { loanInterestBreakdown } from '../public/lib/loan-interest-scene.js';
import { loanHash, readLoanHash } from '../public/lib/lending-links.js';
import { readLoanDraft, saveLoanDraft, LOAN_DRAFT_KEY } from '../public/data/lending-state.js';
import { createExperiment, emptyLibrary, libraryJSON, parseLibrary, validateExperimentDraft } from '../public/data/saved-experiments.js';
import { experimentView, comparisonContext } from '../public/lib/saved-experiments.js';
import { saveExperimentLocation, readExperimentLocation } from '../public/data/experiment-location.js';
import { lendingCase } from '../public/models/lending-lessons.js';

const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(b)), a + ' ≠ ' + b);
const loan = patch => calculateLoan({ ...LOAN_DEFAULTS, ...patch });
const memory = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; };

test('one year can independently grow supplied ETH by half and double debt without growing wallet cash', () => {
  const r = loan({ days: 365, supplyAPR: 100 * Math.log(1.5), borrowAPR: 100 * Math.log(2) });
  close(r.end.collateralTokens, 7.5); close(r.supplyInterestTokens, 2.5);
  close(r.end.debt, 10000); close(r.borrowInterest, 5000);
  assert.equal(r.borrowedCash, 5000); close(r.netAssets, 10000);
  close(r.end.healthFactor, 1.2); close(r.end.boundaryPrice, 10000 / 6);
  close(r.responses.repay.debt, 9500); close(r.responses.add.collateralTokens, 7.75);
});

test('upgraded simple-interest loans reproduce all original accounting and boundary results', () => {
  for (const patch of [{}, { days: 365 }, { days: 1825, supplyAPR: 50, borrowAPR: 100 },
    { future: 1250 }, { future: 1249.999 }, { borrow: 0, collateralEnabled: false }, { budget: 10000 }]) {
    const old = { ...OLD_DEFAULTS, ...patch }, upgraded = upgradeLoan(old);
    const actual = calculateLoan(upgraded), expected = legacyLoan(old);
    assert.deepEqual(actual, { ...expected, model: 'collateral-loan-v2', input: upgraded });
    assert.deepEqual(calculateLoanForInput(old), expected);
  }
});

test('zero time and rates add nothing; supply-only loans have no debt or liquidation boundary', () => {
  for (const patch of [{ days: 0 }, { days: 1825, supplyAPR: 0, borrowAPR: 0 }]) {
    const r = loan(patch); assert.equal(r.supplyInterestTokens, 0); assert.equal(r.borrowInterest, 0);
  }
  const r = loan({ borrow: 0, days: 365, collateralEnabled: false });
  assert.ok(r.end.collateralTokens > 5); assert.equal(r.end.debt, 0);
  assert.equal(r.end.status, 'no-debt'); assert.equal(r.end.boundaryPrice, null);
});

test('maximum allowed accrual stays finite, with 100% APR over five years distinct from simple interest', () => {
  const r = loan({ days: 1825, borrowAPR: 100, supplyAPR: 50 });
  close(r.end.debt / 5000, 148.4131591025766);
  close(loan({ ...r.input, interestMode: 'simple' }).end.debt / 5000, 6);
  for (const value of [r.end.collateralValue, r.netAssets, r.end.healthFactor, r.end.boundaryPrice]) assert.ok(Number.isFinite(value));
  assert.ok(loan({ days: 1e-12, supplyAPR: 1e-12, borrowAPR: 1e-12 }).borrowInterest > 0);
});

test('time changes health by the difference between growth rates, including equal-rate and price effects', () => {
  for (const [supplyAPR, borrowAPR] of [[2, 5], [10, 10], [30, 5]]) {
    const r = loan({ days: 730, supplyAPR, borrowAPR });
    close(r.end.healthFactor, r.start.healthFactor * Math.exp((supplyAPR - borrowAPR) / 100 * 2));
    close(r.end.boundaryPrice, r.start.boundaryPrice * Math.exp((borrowAPR - supplyAPR) / 100 * 2));
    close(loan({ ...r.input, future: 1000 }).end.healthFactor, r.end.healthFactor / 2);
  }
});

test('responses, health curves and liquidation all use compounded balances', () => {
  const input = { ...LOAN_DEFAULTS, days: 365, supplyAPR: 0, borrowAPR: Math.log(2) * 100, future: 2000, budget: 12000 };
  const r = calculateLoan(input), curve = healthPriceCurve(input);
  close(r.end.healthFactor, 0.8); close(curve.selectedHealth, 0.8); close(curve.boundaryPrice, 2500);
  assert.equal(r.responses.repay.status, 'no-debt'); close(r.responses.repay.unused, 2000);
  close(r.responses.add.healthFactor, 1.76);
  const event = singleLiquidation(input, { repayPercent: 50, bonusPercent: 5 });
  assert.equal(event.status, 'executed'); close(event.repaid, 5000); close(event.penalty, 250);
  close(event.remainingDebt, 5000); close(event.remainingTokens, 2.375);
  close(event.netAssets, r.netAssets - 250);
  const boundary = { ...input, future: curve.boundaryPrice };
  assert.equal(calculateLoan(boundary).end.status, 'boundary');
  assert.equal(calculateLoan(boundary).end.healthFactor, 1);
  assert.equal(calculateLoan({ ...boundary, future: curve.boundaryPrice * (1 - 1e-13) }).end.status, 'eligible');
  assert.equal(calculateLoan({ ...boundary, future: curve.boundaryPrice * (1 + 1e-13) }).end.status, 'above');
  assert.notEqual(singleLiquidation(boundary, { repayPercent: 50, bonusPercent: 5 }).status, 'executed');
});

test('the debt reference compares both rules independently of which rule drives the loan', () => {
  const p = { ...LOAN_DEFAULTS, days: 365, borrowAPR: 100 };
  const r = interestReference(p);
  close(r.simpleDebt, 10000); close(r.compoundedDebt, 13591.409142295225);
  close(r.difference, r.compoundedDebt - r.simpleDebt);
  assert.deepEqual(interestReference({ ...p, interestMode: 'simple' }), r);
});

test('interest bars conserve both token balances and use one USD scale without wallet cash', () => {
  for (const future of [300, 2000, 10000]) {
    const r = loan({ days: 365, future }), bars = loanInterestBreakdown(r);
    for (const bar of bars) {
      close(bar.original + bar.added, bar.total);
      close(bar.originalWidth + bar.interestWidth, bar.total * bar.price / Math.max(r.end.collateralValue, r.end.debt) * 100);
      assert.ok(bar.originalWidth >= 0 && bar.interestWidth >= 0);
    }
    close(Math.max(...bars.map(b => b.originalWidth + b.interestWidth)), 100);
    close(bars[0].added, 5 * Math.expm1(0.02)); close(bars[1].added, 5000 * Math.expm1(0.05));
  }
  assert.equal(loanInterestBreakdown(loan({ borrow: 0 }))[1].originalWidth, 0);
});

test('v2 requires a known interest choice and links reject ambiguous model assumptions', () => {
  for (const interestMode of [undefined, null, '', 'Compound', 'daily']) assert.ok(validateLoan({ ...LOAN_DEFAULTS, interestMode }).interestMode);
  assert.equal(loanModel('toString'), null);
  for (const interestMode of ['simple', 'compound']) {
    const input = { ...LOAN_DEFAULTS, interestMode, days: 12.345 }, liquidation = { repayPercent: 20, bonusPercent: 8 };
    assert.deepEqual(readLoanHash(loanHash(input, liquidation)), { status: 'ready', input, liquidation });
  }
  const hash = loanHash(LOAN_DEFAULTS);
  for (const invalid of [hash.replace('&interestMode=compound', ''), hash + '&interestMode=simple',
    hash.replace('collateral-loan-v2', 'collateral-loan-v1'), hash.replace('compound', 'daily'), hash.replace('collateral-loan-v2', 'collateral-loan-v3')]) {
    assert.equal(readLoanHash(invalid).status, 'invalid');
  }
});

test('old and new tab drafts retain their version, with invalid edits preserving the valid draft', () => {
  const storage = memory(), get = () => storage;
  assert.equal(readLoanDraft(get).input.interestMode, 'compound');
  for (const input of [OLD_DEFAULTS, { ...LOAN_DEFAULTS, days: 12.345 }]) {
    assert.ok(saveLoanDraft(input, get)); assert.deepEqual(readLoanDraft(get).input, input);
    const before = storage.getItem(LOAN_DRAFT_KEY);
    assert.equal(saveLoanDraft({ ...input, interestMode: 'unknown' }, get), false);
    assert.equal(storage.getItem(LOAN_DRAFT_KEY), before);
  }
  storage.setItem(LOAN_DRAFT_KEY, JSON.stringify({ version: 1, input: LOAN_DEFAULTS }));
  assert.equal(readLoanDraft(get).status, 'unavailable');
});

test('libraries preserve legacy and current loan rules through export and comparison, and Home can resume v2', () => {
  const entries = [OLD_DEFAULTS, LOAN_DEFAULTS].map((inputs, i) => createExperiment({ model: i ? 'collateral-loan-v2' : 'collateral-loan-v1', inputs },
    'Loan ' + i, '', { id: '00000000-0000-4000-8000-00000000000' + i, now: '2026-10-26T12:00:00.000Z' }));
  const library = { ...emptyLibrary(), experiments: entries };
  assert.deepEqual(parseLibrary(libraryJSON(library)), library);
  assert.match(comparisonContext(entries), /different conditions or interest rules/);
  assert.equal(experimentView(entries[0]).result.model, 'collateral-loan-v1');
  assert.equal(experimentView(entries[1]).result.model, 'collateral-loan-v2');
  assert.throws(() => validateExperimentDraft({ model: 'collateral-loan-v2', inputs: OLD_DEFAULTS }));
  const storage = memory();
  assert.ok(saveExperimentLocation('collateral-loan-v2', loanHash(LOAN_DEFAULTS), () => storage));
  assert.equal(readExperimentLocation(() => storage).route, 'lending.html' + loanHash(LOAN_DEFAULTS));
});

test('existing teaching scenarios still hand off the simple-interest model', () => {
  for (const id of ['supply', 'borrow', 'conditions', 'respond']) {
    const { result } = lendingCase(id);
    assert.equal(result.model, 'collateral-loan-v1');
    assert.equal(Object.hasOwn(result.input, 'interestMode'), false);
    assert.match(loanHash(result.input), /^#loan=collateral-loan-v1&/);
    assert.deepEqual(calculateLoan(upgradeLoan(result.input)), { ...result, model: 'collateral-loan-v2', input: upgradeLoan(result.input) });
  }
});
