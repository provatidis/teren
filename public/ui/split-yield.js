import { DEPOSIT, SPLIT_DEFAULTS, SPLIT_MODEL, splitDeposit, splitInputErrors } from '../models/split-yield-v1.js';
import { readSplitDraft, readSplitSetup, saveSplitDraft, splitHash } from '../data/split-yield-state.js';
import { saveExperimentLocation } from '../data/experiment-location.js';
import { fmt } from '../lib/format.js';
import { defaultYieldExit, yieldExitErrors } from '../models/split-yield-exit-v1.js';
import { showMaturity, showExit } from '../lib/split-yield-results.js';
import { drawYieldPath } from '../lib/split-yield-chart.js';

const fields = { ytPrice: 'split-price', days: 'split-days', firstApy: 'split-first', secondApy: 'split-second', budget: 'split-budget' };
const cash = value => fmt(value) + ' USDC';
const plain = value => value.toLocaleString('en-US', { maximumFractionDigits: 6 });
const dayCount = count => count + (count === 1 ? ' day' : ' days');
const $ = id => document.getElementById(id);
const setText = (id, value) => { $(id).textContent = value; };

function showDeposit(input, stage) {
  const deposit = splitDeposit(input);
  const day = { purchase: 0, change: input.switchDay, maturity: input.days }[stage];
  const earned = drawYieldPath(input, day, deposit.ytCost);
  const difference = earned - deposit.ytCost;
  const rates = plain(input.firstApy) + '% APY for ' + dayCount(input.switchDay) + ', then '
    + plain(input.secondApy) + '% for ' + dayCount(input.days - input.switchDay) + '.';
  setText('split-pt-cost', cash(deposit.ptCost));
  setText('split-yt-cost', cash(deposit.ytCost));
  setText('split-cost-label', 'YT cost · ' + cash(deposit.ytCost));
  setText('split-switch-value', 'Day ' + input.switchDay);
  $('split-switch').setAttribute('aria-valuetext', 'Day ' + input.switchDay + ' of ' + input.days);
  setText('split-rates', rates);
  setText('split-end-label', 'Day ' + input.days + ' · maturity');
  const finalNote = day < input.days ? ' The path reaches ' + cash(deposit.netInterest) + ' at maturity.' : '';
  setText('yield-chart-description', rates + ' The YT cost ' + cash(deposit.ytCost) + '. Net interest earned by day '
    + day + ' is ' + cash(earned) + '.' + finalNote);
  let reading;
  if (stage === 'purchase') {
    reading = 'The YT buyer pays ' + cash(deposit.ytCost) + ' up front. Interest starts accruing on the whole ' + plain(DEPOSIT) + ' USDC deposit.';
  } else {
    const moment = day === input.days ? 'At maturity' : 'By day ' + day;
    const gap = Math.abs(difference) < 0.005 ? 'matching the purchase price to the nearest cent.'
      : difference > 0 ? cash(difference) + ' above the purchase price.'
      : cash(-difference) + ' short of the purchase price.';
    reading = moment + ', YT has earned ' + cash(earned) + ' after fees, ' + gap;
    if (day === input.days) reading += ' PT can now redeem the 1,000 USDC principal.';
  }
  setText('split-reading', reading);
}

export function initSplitYield() {
  const slider = $('split-switch');
  const exitDay = $('split-exit-day');
  const exitApy = $('split-exit-apy');
  const stages = [...document.querySelectorAll('[data-stage]')];
  let stage = 'maturity';
  let switchFraction;
  let exitFraction;
  let selling = false;
  let shareable = '';
  let copyRequest = 0;

  function notice(message) {
    setText('yield-notice', message);
    $('yield-notice').hidden = !message;
  }
  function setStage(next) {
    stage = next;
    for (const button of stages) button.setAttribute('aria-pressed', String(button.dataset.stage === stage));
  }
  function setSelling(selected) {
    selling = selected;
    $('split-mode-exit').setAttribute('aria-pressed', String(selling));
    $('split-mode-maturity').setAttribute('aria-pressed', String(!selling));
    $('split-exit-controls').hidden = !selling;
  }
  function fill(input, exit = null) {
    for (const [key, id] of Object.entries(fields)) $(id).value = input[key];
    slider.max = input.days;
    slider.value = input.switchDay;
    switchFraction = input.switchDay / input.days;
    const setup = exit ?? defaultYieldExit(input.days);
    exitDay.max = input.days;
    exitDay.value = setup.exitDay;
    exitApy.value = setup.exitApy;
    exitFraction = setup.exitDay / input.days;
    setSelling(Boolean(exit));
    setStage('maturity');
  }
  function render({ edited = false } = {}) {
    const input = {};
    for (const [key, id] of Object.entries(fields)) input[key] = $(id).valueAsNumber;
    input.switchDay = slider.valueAsNumber;
    const exit = selling ? { exitDay: exitDay.valueAsNumber, exitApy: exitApy.valueAsNumber } : null;
    const errors = splitInputErrors(input);
    const marketInvalid = Object.keys(errors).some(key => key !== 'budget');
    for (const [key, id] of Object.entries(fields)) {
      $(id).setAttribute('aria-invalid', String(Boolean(errors[key])));
      setText(id + '-error', errors[key] || '');
      $(id + '-error').hidden = !errors[key];
    }
    slider.disabled = marketInvalid;
    $('yield-plot-panel').hidden = marketInvalid;
    $('yield-path-error').hidden = !marketInvalid;
    const exitErrors = selling ? yieldExitErrors(input, exit) : {};
    exitDay.disabled = Boolean(errors.days);
    exitApy.setAttribute('aria-invalid', String(Boolean(exitErrors.exitApy)));
    setText('split-exit-apy-error', exitErrors.exitApy || '');
    $('split-exit-apy-error').hidden = !exitErrors.exitApy;
    if (selling) {
      setText('exit-day-label', errors.days ? '—' : 'Day ' + exit.exitDay);
      setText('exit-time-left', errors.days ? 'Check the term above.' : dayCount(input.days - exit.exitDay) + ' until maturity.');
      exitDay.setAttribute('aria-valuetext', 'Day ' + exit.exitDay + ' of ' + exitDay.max);
    }
    const invalid = marketInvalid || Boolean(errors.budget) || Object.keys(exitErrors).length > 0;
    $('split-comparison-results').hidden = invalid || selling;
    $('split-exit-results').hidden = invalid || !selling;
    $('split-comparison-error').hidden = !invalid;
    $('split-share').disabled = invalid;
    if (marketInvalid) {
      for (const id of ['split-pt-cost', 'split-yt-cost', 'split-switch-value', 'split-rates']) setText(id, '—');
    } else showDeposit(input, stage);
    shareable = '';
    if (!invalid) {
      if (selling) showExit(input, exit);
      else showMaturity(input);
      shareable = splitHash(input, exit);
    }
    if (!edited) return;
    copyRequest++;
    $('split-link-label').hidden = true;
    setText('split-action-status', '');
    if (!shareable) return;
    const saved = saveSplitDraft(shareable);
    saveExperimentLocation(SPLIT_MODEL, shareable);
    if (location.hash === '#early-exit' || new URLSearchParams(location.hash.slice(1)).has('yield')) {
      history.replaceState(null, '', shareable);
    }
    notice(saved ? '' : 'This browser could not save your changes. Copy the setup link to keep them.');
  }

  function restore() {
    const draft = readSplitDraft();
    let inputs = draft.inputs || SPLIT_DEFAULTS;
    let exit = draft.exit ?? null;
    let jumpToExit = location.hash === '#early-exit';
    if (jumpToExit) exit ??= defaultYieldExit(inputs.days);
    let message = draft.status === 'invalid' ? 'Your previous setup could not be read. Showing the original example.'
      : draft.status === 'unavailable' ? 'Local saving is unavailable. You can explore and copy a setup link.' : '';
    try {
      const shared = readSplitSetup(location.hash);
      if (shared) {
        inputs = shared.inputs;
        exit = shared.exit;
        jumpToExit = Boolean(exit);
        message = 'Shared yield setup loaded.';
      }
    } catch {
      message = 'This yield setup link could not be read. Showing ' + (draft.inputs ? 'your last saved setup.' : 'the original example.');
    }
    fill(inputs, exit);
    copyRequest++;
    $('split-link-label').hidden = true;
    setText('split-action-status', '');
    notice(message);
    render();
    if (jumpToExit) requestAnimationFrame(() => $('comparison').scrollIntoView({ block: 'start' }));
  }
  for (const id of Object.values(fields)) $(id).addEventListener('input', () => {
    if (id === 'split-days' && $(id).validity.valid && Number.isInteger($(id).valueAsNumber)) {
      slider.max = $(id).value;
      slider.value = Math.round($(id).valueAsNumber * switchFraction);
      exitDay.max = $(id).value;
      exitDay.value = Math.round($(id).valueAsNumber * exitFraction);
    }
    render({ edited: true });
  });
  slider.addEventListener('input', () => {
    switchFraction = slider.valueAsNumber / Number(slider.max);
    render({ edited: true });
  });
  exitDay.addEventListener('input', () => {
    exitFraction = exitDay.valueAsNumber / Number(exitDay.max);
    render({ edited: true });
  });
  exitApy.addEventListener('input', () => render({ edited: true }));
  for (const button of document.querySelectorAll('[data-exit-rate]')) button.addEventListener('click', () => {
    exitApy.value = button.dataset.exitRate;
    render({ edited: true });
  });
  for (const mode of ['maturity', 'exit']) $('split-mode-' + mode).addEventListener('click', () => {
    setSelling(mode === 'exit');
    render({ edited: true });
  });
  for (const button of stages) button.addEventListener('click', () => {
    setStage(button.dataset.stage);
    render();
  });
  $('yield-compare-link').addEventListener('click', event => {
    event.preventDefault();
    $('comparison-title').focus({ preventScroll: true });
    $('comparison').scrollIntoView({ block: 'start' });
  });
  $('split-share').addEventListener('click', async () => {
    if (!shareable) return;
    const request = ++copyRequest;
    const link = new URL(location.pathname, location.origin);
    link.hash = shareable;
    $('split-link').value = link.href;
    try {
      await navigator.clipboard.writeText(link.href);
      if (copyRequest === request) setText('split-action-status', 'Setup link copied.');
    } catch {
      if (copyRequest !== request) return;
      $('split-link-label').hidden = false;
      setText('split-action-status', 'Copy this link to reopen the same assumptions.');
      $('split-link').focus();
      $('split-link').select();
    }
  });
  $('split-reset').addEventListener('click', () => {
    fill(SPLIT_DEFAULTS);
    render({ edited: true });
    setText('split-action-status', 'Original 90-day example restored.');
  });
  window.addEventListener('hashchange', restore);
  restore();
}
