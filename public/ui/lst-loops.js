import { LST_MODEL, LST_DEFAULTS, LST_KEYS, validateLST, calculateLST } from '../models/lst-loop-v1.js';
import { LST_VIEWS, lstHash, readLSTHash } from '../lib/lst-links.js';
import { readLSTDraft, saveLSTDraft } from '../data/lst-state.js';
import { saveExperimentLocation } from '../data/experiment-location.js';
import { createLSTScene } from '../lib/lst-scene.js';
import { healthLabel, loanStatus } from '../lib/lending-presentation.js';
import { fmt, usd, formatTokenQuantity } from '../lib/format.js';

const tokens = (value, token = 'WETH') => formatTokenQuantity(value, 4) + ' ' + token;
const signed = value => (value > 0 ? '+' : value < 0 ? '−' : '') + tokens(Math.abs(value));

export function initLSTLoops() {
  const $ = id => document.getElementById(id);
  const stored = readLSTDraft();
  let view = stored.view, current = null, firstInvalid = null, revision = 0;
  const buildScene = createLSTScene($('lst-build-scene'), 'build');
  const exitScene = createLSTScene($('lst-exit-scene'), 'exit');
  const active = () => location.hash === '#lst-loops' || readLSTHash(location.hash).status !== 'none';

  function write(input) {
    for (const key of LST_KEYS) {
      const field = $('lst-' + key);
      if (field.type === 'checkbox') field.checked = input[key];
      else field.value = input[key];
    }
  }
  function read() {
    return Object.fromEntries(LST_KEYS.map(key => {
      const field = $('lst-' + key);
      return [key, field.type === 'checkbox' ? field.checked : key === 'oracleMode' ? field.value : field.value.trim() === '' ? NaN : Number(field.value)];
    }));
  }
  function pairs(id, entries) {
    $(id).replaceChildren(...entries.map(([label, value]) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; row.append(dt, dd); return row;
    }));
  }
  function displayView() {
    for (const name of LST_VIEWS) {
      $('lst-' + name).hidden = name !== view;
      $('lst-view-' + name).setAttribute('aria-pressed', String(name === view));
    }
  }
  function persist(input) {
    const saved = saveLSTDraft(input, view);
    $('lst-storage').textContent = saved ? 'Working setup kept in this browser. Save a named experiment or copy its link to keep a variation.' : 'Browser saving is unavailable. Copy the link to keep this setup.';
    if (active()) {
      const hash = lstHash(input, view);
      history.replaceState(null, '', location.pathname + location.search + hash);
      saveExperimentLocation(LST_MODEL, hash);
    }
  }
  function chart(result) {
    const { input, end } = result;
    if (end.debt === 0) {
      $('lst-health-chart').hidden = true;
      $('lst-chart-caption').textContent = 'No WETH debt, so there is no loan liquidation boundary.';
      return;
    }
    $('lst-health-chart').hidden = false;
    const atRate = end.collateral * result.rate * input.threshold / 100 / end.debt;
    const ceiling = Math.max(1.2, atRate * 1.1), left = 65, right = 590, top = 20, bottom = 195;
    const y = health => bottom - health / ceiling * (bottom - top);
    $('lst-chart-market').setAttribute('d', `M${left} ${y(atRate)}L${right} ${y(atRate * 0.5)}`);
    $('lst-chart-rate').setAttribute('d', `M${left} ${y(atRate)}H${right}`);
    $('lst-chart-boundary').setAttribute('d', `M${left} ${y(1)}H${right}`);
    $('lst-chart-dot').setAttribute('cx', left + input.discount / 50 * (right - left));
    $('lst-chart-dot').setAttribute('cy', y(end.healthFactor));
    $('lst-chart-top').textContent = fmt(ceiling, 1);
    $('lst-chart-caption').textContent = 'At ' + fmt(input.discount, 1) + '% discount, the selected oracle gives health factor ' + healthLabel(end.healthFactor) + '. Boundary oracle price: ' + tokens(result.boundaryPrice) + ' per wstETH.';
    $('lst-health-chart').setAttribute('aria-label', $('lst-chart-caption').textContent + ' Market-oracle health falls with the discount; conversion-rate-oracle health stays constant.');
  }
  function render(save = false, resetScenes = false) {
    revision++;
    $('lst-share-url').hidden = true;
    $('lst-share-status').textContent = '';
    $('lst-save-status').textContent = '';
    const input = read(), errors = validateLST(input);
    firstInvalid = LST_KEYS.find(key => errors[key]);
    for (const key of LST_KEYS) {
      $('lst-' + key).setAttribute('aria-invalid', String(!!errors[key]));
      $('lst-' + key + '-error').hidden = !errors[key];
      $('lst-' + key + '-error').textContent = errors[key] || '';
    }
    $('lst-invalid').hidden = !firstInvalid;
    $('lst-save').disabled = !!firstInvalid;
    $('lst-share').disabled = !!firstInvalid;
    $('lst-rate-change-fields').hidden = !input.rateChange && !errors.changeDay && !errors.laterAPR;
    for (const [key, suffix] of [['rounds', ' rounds'], ['days', ' days'], ['discount', '%']]) {
      $('lst-' + key + '-value').textContent = Number.isFinite(input[key]) ? fmt(input[key], key === 'discount' ? 1 : 0) + suffix : 'Check value';
    }
    displayView();
    for (const id of ['lst-build-scene', 'lst-hold-results', 'lst-accounting', 'lst-chart-details', 'lst-exit-scene', 'lst-exit-outcome']) $(id).hidden = !!firstInvalid;
    if (firstInvalid) {
      current = null;
      $('lst-build-summary').textContent = 'Check the inputs to calculate this loop.';
      $('lst-discount-result').textContent = 'Result unavailable until the highlighted inputs are valid.';
      $('lst-carry-value').textContent = 'Check inputs';
      $('lst-carry-health').textContent = 'Unavailable';
      $('lst-exit-status').textContent = 'Exit preview unavailable until the inputs are valid.';
      $('lst-liquidation').hidden = !['repayPercent', 'bonus'].includes(firstInvalid);
      $('lst-liquidation-results').hidden = true;
      return;
    }
    current = calculateLST(input);
    const r = current, p = r.end;
    $('lst-build-summary').textContent = fmt(r.exposure, 2) + '× starting wstETH · ' + tokens(r.start.collateral, 'wstETH') + ' supplied · ' + tokens(r.start.debt) + ' owed after all rounds.';
    buildScene.render(r, resetScenes);
    exitScene.render(r, resetScenes);
    $('lst-net').textContent = tokens(p.net);
    $('lst-usd').textContent = usd(p.net * input.ethUSD) + ' at ' + usd(input.ethUSD) + '/ETH';
    $('lst-holding').textContent = tokens(r.holding);
    $('lst-difference').textContent = signed(r.vsHolding);
    $('lst-carry-value').textContent = Math.abs(r.vsHolding) >= 1e6
      ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(r.vsHolding) + ' WETH'
      : signed(r.vsHolding);
    $('lst-carry-value').title = signed(r.vsHolding);
    $('lst-carry-health').textContent = healthLabel(p.healthFactor);
    $('lst-health').textContent = healthLabel(p.healthFactor);
    $('lst-debt').textContent = tokens(p.debt);
    const debtWidth = p.collateralValue > 0 ? Math.min(500, p.debt / p.collateralValue * 500) : 500;
    for (const id of ['lst-debt-bar', 'lst-debt-pattern']) $(id).setAttribute('width', debtWidth);
    $('lst-balance-label').textContent = tokens(p.collateral, 'wstETH') + ' collateral = ' + tokens(p.collateralValue) + ' at the market price. Hatched: ' + tokens(p.debt) + ' debt.' + (p.debt > p.collateralValue ? ' Debt exceeds the collateral’s sale value.' : '');
    $('lst-balance-chart').setAttribute('aria-label', $('lst-balance-label').textContent);
    $('lst-health-note').textContent = loanStatus(p) + (input.oracleMode === 'rate' && input.discount > 0 ? '. The oracle ignores this market discount, but an exit still uses the lower sale price.' : '.');
    $('lst-health-note').dataset.state = p.status;
    $('lst-oracle-summary').textContent = input.oracleMode === 'rate'
      ? 'Oracle: conversion rate. This market discount affects the sale price, not the lender’s valuation.'
      : 'Oracle: market price. This market discount reduces both sale value and the lender’s valuation.';
    $('lst-path-note').hidden = r.firstRateBoundary === null;
    $('lst-path-note').textContent = r.firstRateBoundary === null ? '' : 'The assumed rates reach the liquidation boundary around day ' + fmt(r.firstRateBoundary, 1) + ', even before applying the endpoint discount. Later balances are a no-liquidation thought experiment; an actual position may already have changed.';
    $('lst-conversion').textContent = tokens(r.rate, 'stETH / wstETH');
    $('lst-market').textContent = tokens(p.marketPrice, 'WETH / wstETH');
    $('lst-oracle').textContent = tokens(p.oraclePrice, 'WETH / wstETH');
    $('lst-discount-result').textContent = 'Sale price: ' + tokens(p.marketPrice) + ' per wstETH · Health factor: ' + healthLabel(p.healthFactor);
    $('lst-rate-summary').textContent = 'Borrow APR compounds continuously: ' + fmt((Math.exp(input.borrowAPR / 100) - 1) * 100) + '% equivalent APY at the initial rate.' + (input.rateChange ? ' The rate changes on day ' + input.changeDay + '.' : ' It stays fixed in this scenario.');
    pairs('lst-ledger', [
      ['Starting wstETH value', tokens(r.initialValue)], ['Build swap losses', signed(-r.buildCosts)],
      ['Staking growth · through conversion rate', signed(r.stakingGain)],
      ['Additional collateral lending growth', signed(r.lendingGain)],
      ['WETH borrowing interest', signed(-r.borrowInterest)], ['Market discount on all collateral', signed(-r.discountLoss)],
      ['Assets minus debt', tokens(p.net)],
    ]);
    $('lst-break-even').textContent = r.breakEvenAPR === null ? 'A break-even borrow rate needs a nonzero loan and holding period.'
      : 'Average borrow APR that would match holding in this setup: ' + fmt(r.breakEvenAPR) + '%.' + (r.breakEvenAPR < 0 ? ' Matching holding would require a borrowing subsidy at these assumptions.' : '') + ' Your time-weighted borrow APR: ' + fmt(r.averageBorrowAPR) + '%. This compares value, not liquidation safety.';
    chart(r);
    $('lst-liquidation').hidden = !r.liquidation;
    $('lst-liquidation-results').hidden = false;
    if (r.liquidation) {
      const l = r.liquidation;
      pairs('lst-liquidation-results', [
        ['WETH repaid by the liquidator', tokens(l.repay)], ['wstETH removed', tokens(l.seized, 'wstETH')],
        ['Bonus at oracle valuation', tokens(l.bonusAtOracle)], ['Market value of all removed collateral', tokens(l.marketValueTaken)],
        ['wstETH remaining', tokens(l.remaining.collateral, 'wstETH')], ['WETH debt remaining', tokens(l.remaining.debt)],
        ['Net market value after this event', tokens(l.remaining.net)],
      ]);
    }
    const exitCopy = {
      complete: 'The assumed exit clears both debts and converts the remaining value to WETH.',
      boundary: 'Exit preview stopped: the current position is at the boundary, below it, or would already have reached it under the assumed rates. Actual liquidation would change these balances.',
      unavailable: 'Exit unavailable under your assumptions. Collateral stays supplied and all debt remains owed.',
      shortfall: 'The sale cannot cover both debts and the assumed costs. ' + tokens(r.exit.shortfall) + ' of additional funding would be needed; the preview does not add it.',
    };
    $('lst-exit-status').textContent = exitCopy[r.exit.status];
    $('lst-exit-status').dataset.state = r.exit.status;
    pairs('lst-exit-outcome', r.exit.status === 'complete' ? [
      ['WETH after the complete exit', tokens(r.exit.cash)], ['WETH debt remaining', tokens(0)],
      ['Exit swap loss', tokens(r.exit.swapLoss)], ['Flash loan fee', tokens(r.exit.flashCost)], ['Flat exit cost', tokens(r.exit.gas)],
      ['Holding, sold with the same swap and flat costs', r.holdingAfterExit < 0 ? 'Costs exceed proceeds' : tokens(r.holdingAfterExit)],
      ['Loop minus holding after these exits', r.holdingAfterExit < 0 ? 'Comparison unavailable' : signed(r.exit.cash - r.holdingAfterExit)],
    ] : [['Collateral still supplied', tokens(p.collateral, 'wstETH')], ['WETH debt still owed', tokens(p.debt)], ['Market assets minus debt · before liquidation', tokens(p.net)]]);
    if (save) persist(input);
  }
  function changeView(next) {
    view = next;
    displayView();
    if (current) persist(current.input);
  }
  for (const name of LST_VIEWS) $('lst-view-' + name).addEventListener('click', () => changeView(name));
  for (const [id, target] of [['lst-to-hold', 'hold'], ['lst-to-exit', 'exit']]) $(id).addEventListener('click', () => {
    changeView(target);
    $('lst-view-' + target).focus();
    $('lending-lst').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  for (const key of LST_KEYS) $('lst-' + key).addEventListener('input', () => render(true));
  $('lst-fix').addEventListener('click', () => {
    const field = $('lst-' + firstInvalid);
    if (!field) return;
    const panel = field.closest('.lst-panel');
    changeView(panel.id.replace('lst-', ''));
    for (let parent = field.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
    field.focus();
  });
  $('lst-reset').addEventListener('click', () => {
    view = 'build'; write(LST_DEFAULTS); render(true, true);
    $('lst-view-build').focus({ preventScroll: true });
    $('lending-lst').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  $('lst-share').addEventListener('click', async () => {
    if (!current) return;
    const currentRevision = revision, url = new URL(location.href);
    url.hash = lstHash(current.input, view);
    try {
      await navigator.clipboard.writeText(url.href);
      if (currentRevision === revision) $('lst-share-status').textContent = 'LST loop link copied with all assumptions.';
    } catch {
      if (currentRevision !== revision) return;
      $('lst-share-url').value = url.href; $('lst-share-url').hidden = false;
      $('lst-share-url').focus(); $('lst-share-url').select();
      $('lst-share-status').textContent = 'Copy the selected link.';
    }
  });
  function loadRoute() {
    const link = readLSTHash(location.hash);
    $('lst-route-note').hidden = link.status !== 'invalid';
    if (link.status === 'ready') { write(link.input); view = link.view; render(true, true); }
  }
  write(stored.input);
  render();
  if (stored.status === 'invalid') $('lst-storage').textContent = 'The saved working copy could not be read. Defaults are shown; the stored copy is unchanged until you edit.';
  else if (stored.status === 'unavailable') $('lst-storage').textContent = 'Browser saving is unavailable. Copy a link to keep your setup.';
  loadRoute();
  window.addEventListener('hashchange', loadRoute);
  return {
    getExperimentDraft: () => current ? { model: LST_MODEL, inputs: { ...current.input }, origin: null } : null,
    setExperiment(entry) { write(entry.inputs); view = 'hold'; render(false, true); persist(entry.inputs); },
  };
}
