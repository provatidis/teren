import { LST_MODEL, LST_DEFAULTS, LST_KEYS, validateLST, calculateLST, upgradeLST, targetExposureLimit } from '../models/lst-loop-v2.js';
import { LST_VIEWS, lstHash, readLSTHash } from '../lib/lst-links.js';
import { readLSTDraft, saveLSTDraft } from '../data/lst-state.js';
import { saveExperimentLocation } from '../data/experiment-location.js';
import { createLSTScene } from '../lib/lst-scene.js';
import { healthLabel, loanStatus } from '../lib/lending-presentation.js';
import { fmt, usd, formatTokenQuantity } from '../lib/format.js';
import { lstExitCopy, lstExitFacts } from '../lib/lst-presentation.js';

const tokens = (value, token = 'WETH') => formatTokenQuantity(value, 4) + ' ' + token;
const signed = value => (value > 0 ? '+' : value < 0 ? '−' : '') + tokens(Math.abs(value));

export function initLSTLoops() {
  const $ = id => document.getElementById(id);
  const exactControls = { days: { unit: 'days', step: 1 }, discount: { unit: '% discount', step: 0.1 } };
  const inputField = key => $('lst-' + key + (Object.hasOwn(exactControls, key) ? '-input' : ''));
  const stored = readLSTDraft();
  let view = stored.view, current = null, firstInvalid = null, revision = 0;
  const buildScene = createLSTScene($('lst-build-scene'), 'build');
  const exitScene = createLSTScene($('lst-exit-scene'), 'exit');
  const active = () => location.hash === '#lst-loops' || readLSTHash(location.hash).status !== 'none';

  function write(input) {
    if (!Object.hasOwn(input, 'buildMode')) input = upgradeLST(input);
    for (const key of LST_KEYS) {
      const field = inputField(key);
      if (field.type === 'checkbox') field.checked = input[key];
      else field.value = input[key];
    }
  }
  function read() {
    return Object.fromEntries(LST_KEYS.map(key => {
      const field = inputField(key);
      return [key, field.type === 'checkbox' ? field.checked : ['oracleMode', 'buildMode', 'exitMode'].includes(key) ? field.value : field.value.trim() === '' ? NaN : Number(field.value)];
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
    $('lst-chart-caption').textContent = 'At ' + formatTokenQuantity(input.discount, 6) + '% discount, the selected oracle gives health factor ' + healthLabel(end.healthFactor) + '. Boundary oracle price: ' + tokens(result.boundaryPrice) + ' per wstETH.';
    $('lst-health-chart').setAttribute('aria-label', $('lst-chart-caption').textContent + ' Market-oracle health falls with the discount; conversion-rate-oracle health stays constant.');
  }
  function render(save = false, resetScenes = false) {
    revision++;
    $('lst-share-url').hidden = true;
    $('lst-share-status').textContent = '';
    $('lst-save-status').textContent = '';
    const input = read(), errors = validateLST(input);
    $('lst-target-settings').hidden = input.buildMode !== 'target';
    $('lst-round-settings').hidden = input.buildMode !== 'rounds';
    $('lst-build-flash-setting').hidden = input.buildMode !== 'target';
    const targetLimit = ['maxLTV', 'swapCost', 'buildFlashFee'].some(key => errors[key]) ? null : targetExposureLimit(input);
    $('lst-target-limit').textContent = targetLimit === null ? 'Check the build costs and maximum LTV to calculate the limit.'
      : 'Target limit: ' + formatTokenQuantity(Math.min(50, Math.floor((targetLimit + 1e-12) * 1000) / 1000), 3) + '× at these costs and maximum LTV.';
    $('lst-target-execution-note').hidden = input.buildMode !== 'target';
    for (const button of document.querySelectorAll('[data-lst-target]')) {
      const target = Number(button.dataset.lstTarget);
      button.disabled = targetLimit === null || target > targetLimit + 1e-12;
      button.setAttribute('aria-pressed', String(input.targetExposure === target));
    }
    for (const destination of ['weth', 'wsteth']) {
      $('lst-exit-' + destination).setAttribute('aria-pressed', String(input.exitMode === destination));
      $('lst-exit-' + destination + '-card').dataset.selected = String(input.exitMode === destination);
    }
    firstInvalid = LST_KEYS.find(key => errors[key]);
    for (const key of LST_KEYS) {
      inputField(key).setAttribute('aria-invalid', String(!!errors[key]));
      $('lst-' + key + '-error').hidden = !errors[key];
      $('lst-' + key + '-error').textContent = errors[key] || '';
    }
    $('lst-invalid').hidden = !firstInvalid;
    $('lst-save').disabled = !!firstInvalid;
    $('lst-share').disabled = !!firstInvalid;
    $('lst-rate-change-fields').hidden = !input.rateChange && !errors.changeDay && !errors.laterAPR;
    $('lst-rounds-value').textContent = Number.isFinite(input.rounds) ? fmt(input.rounds, 0) + ' rounds' : 'Check value';
    for (const [key, { unit }] of Object.entries(exactControls)) {
      const slider = $('lst-' + key);
      if (!errors[key]) slider.value = input[key];
      slider.setAttribute('aria-invalid', String(!!errors[key]));
      slider.setAttribute('aria-valuetext', errors[key] ? 'Check the entered value' : formatTokenQuantity(input[key], 6) + ' ' + unit);
    }
    displayView();
    for (const id of ['lst-build-scene', 'lst-hold-results', 'lst-accounting', 'lst-chart-details', 'lst-exit-scene', 'lst-exit-outcome']) $(id).hidden = !!firstInvalid;
    if (firstInvalid) {
      current = null;
      $('lst-build-summary').textContent = 'Check the inputs to calculate this loop.';
      $('lst-build-risk').textContent = '';
      $('lst-discount-result').textContent = 'Result unavailable until the highlighted inputs are valid.';
      $('lst-carry-value').textContent = 'Check inputs';
      $('lst-carry-health').textContent = 'Unavailable';
      $('lst-exit-status').textContent = 'Exit preview unavailable until the inputs are valid.';
      $('lst-exit-status').dataset.state = 'unavailable';
      $('lst-exit-comparison-note').textContent = 'Check the highlighted assumptions to compare the exits.';
      for (const destination of ['weth', 'wsteth']) {
        $('lst-exit-' + destination + '-value').textContent = 'Check inputs';
        $('lst-exit-' + destination + '-note').textContent = 'No outcome is shown until the assumptions are valid.';
      }
      $('lst-liquidation').hidden = !['repayPercent', 'bonus'].includes(firstInvalid);
      $('lst-liquidation-results').hidden = true;
      return;
    }
    current = calculateLST(input);
    const r = current, p = r.end;
    $('lst-build-summary').textContent = (r.start.debt === 0 ? 'No borrowing: ' : input.buildMode === 'target' ? 'Flash-assisted build: ' : 'After all rounds: ') + formatTokenQuantity(r.exposure, 3) + '× starting wstETH · ' + tokens(r.start.collateral, 'wstETH') + ' supplied · ' + tokens(r.start.debt) + ' owed.';
    $('lst-build-risk').textContent = 'Starting LTV: ' + fmt(r.start.debt / r.start.collateralValue * 100, 2) + '% · Health factor: ' + healthLabel(r.start.healthFactor) + '. Collateral / net equity after build costs: ' + fmt(r.start.collateralValue / r.start.net, 3) + '×.';
    $('lst-target-help').textContent = formatTokenQuantity(input.targetExposure, 6) + '× means ' + tokens(input.collateral * input.targetExposure, 'wstETH') + ' from your original ' + tokens(input.collateral, 'wstETH') + ', before interest. This measures staked-token holdings, not net ETH price exposure.';
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
    const balanceScale = Math.max(p.collateralValue, p.debt);
    $('lst-collateral-bar').setAttribute('width', balanceScale > 0 ? p.collateralValue / balanceScale * 500 : 0);
    const debtWidth = balanceScale > 0 ? p.debt / balanceScale * 500 : 0;
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
      ...(input.buildMode === 'target' ? [['Build flash loan fee', signed(-r.buildFlashCost)]] : []),
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
    $('lst-exit-status').textContent = lstExitCopy(r);
    $('lst-exit-status').dataset.state = r.exit.status;
    pairs('lst-exit-outcome', lstExitFacts(r));
    $('lst-exit-comparison-note').textContent = r.exit.status === 'complete'
      ? (p.debt > 0 ? 'Both routes clear the debt. ' : 'There is no debt to repay. ') + 'Keeping wstETH avoids selling the retained tokens, which still carry staking exposure and market risk. Its displayed WETH value is a valuation at this price.'
      : 'Neither exit runs under these assumptions. Review the reason below; no collateral moves and no debt is cleared in the preview.';
    for (const destination of ['weth', 'wsteth']) {
      const e = r.exits[destination], complete = e.status === 'complete';
      $('lst-exit-' + destination + '-value').textContent = !complete ? 'Exit not run'
        : destination === 'weth' ? tokens(e.cash) : tokens(e.retained, 'wstETH');
      $('lst-exit-' + destination + '-note').textContent = !complete ? 'The position and debt remain in place.'
        : destination === 'weth' ? 'After repayment and costs. No wstETH or loan remains.'
          : 'Market value now: ' + tokens(e.remaining.net) + '. No loan remains; the unsold tokens stay invested.';
    }
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
  for (const key of LST_KEYS) inputField(key).addEventListener('input', () => {
    if (key === 'buildMode') {
      // Leave an invalid, unsaved edit behind when switching construction modes.
      // Valid preferences are retained and saved, including the inactive mode.
      const inactive = $('lst-buildMode').value === 'rounds'
        ? [['targetExposure', 1, 50], ['buildFlashFee', 0, 5]] : [['rounds', 0, 8], ['borrowPercent', 1, 95]];
      for (const [name, min, max] of inactive) {
        const field = $('lst-' + name), value = Number(field.value);
        if (!field.value.trim() || !Number.isFinite(value) || value < min || value > max || name === 'rounds' && !Number.isInteger(value)) field.value = LST_DEFAULTS[name];
      }
    }
    render(true, key === 'buildMode');
  });
  for (const [key, { step }] of Object.entries(exactControls)) {
    const slider = $('lst-' + key);
    slider.addEventListener('input', () => {
      // Pointer movement uses comfortable increments; typed and restored values
      // keep the model's full supported precision.
      inputField(key).value = Math.round(Number(slider.value) / step) / (1 / step);
      render(true);
    });
    slider.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
      if (!direction && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const minimum = Number(slider.min), maximum = Number(slider.max);
      const next = event.key === 'Home' ? minimum : event.key === 'End' ? maximum
        : Number((Number(slider.value) + direction * step).toPrecision(12));
      inputField(key).value = Math.max(minimum, Math.min(maximum, next));
      render(true);
    });
  }
  for (const button of document.querySelectorAll('[data-lst-target]')) button.addEventListener('click', () => {
    $('lst-targetExposure').value = button.dataset.lstTarget; render(true);
  });
  for (const destination of ['weth', 'wsteth']) $('lst-exit-' + destination).addEventListener('click', () => {
    $('lst-exitMode').value = destination; render(true, true);
    if (current) {
      $('lst-exit-scene-title').focus({ preventScroll: true });
      $('lst-exit-scene').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });
  $('lst-fix').addEventListener('click', () => {
    const field = inputField(firstInvalid);
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
    setExperiment(entry) { write(entry.inputs); view = 'hold'; render(false, true); if (current) persist(current.input); },
  };
}
