import { DEPOSIT, SPLIT_DEFAULTS, SPLIT_MODEL, splitAtMaturity, splitDeposit, splitInputErrors } from '../models/split-yield-v1.js';
import { readSplitDraft, readSplitHash, saveSplitDraft, splitHash } from '../data/split-yield-state.js';
import { saveExperimentLocation } from '../data/experiment-location.js';
import { fmt } from '../lib/format.js';
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

function showComparison(input) {
  const result = splitAtMaturity(input);
  setText('strategy-pt-quantity', fmt(result.ptUnits) + ' PT bought');
  setText('strategy-yt-quantity', fmt(result.ytUnits) + ' YT bought');
  for (const key of ['pt', 'yt', 'hold']) {
    const value = result[key + 'Final'];
    const change = value - input.budget;
    setText('strategy-' + key + '-value', cash(value));
    const node = $('strategy-' + key + '-change');
    const tied = Math.abs(change) < 0.005;
    node.dataset.direction = tied ? 'flat' : change > 0 ? 'gain' : 'loss';
    node.textContent = tied ? 'Even with the starting budget' : (change > 0 ? 'Gain of ' : 'Loss of ') + cash(Math.abs(change));
  }
  setText('split-recover', cash(result.recoverGross));
  setText('split-match', result.matchGross === null ? 'No finite yield' : cash(result.matchGross));
  const interpretation = result.matchGross === null
    ? 'At this entry price, holding stays ahead at every nonnegative yield.'
    : Math.abs(result.grossInterest - result.matchGross) < 1e-10 ? 'YT matches holding at maturity.'
    : result.grossInterest > result.matchGross ? 'YT recovers its cost and finishes ahead of holding.'
    : result.grossInterest >= result.recoverGross ? 'YT recovers its cost. Holding still finishes ahead.'
    : 'YT finishes below its purchase price.';
  setText('split-benchmark-note', 'The deposit earns ' + cash(result.grossInterest) + ' before fees. ' + interpretation);
}

export function initSplitYield() {
  const slider = $('split-switch');
  const stages = [...document.querySelectorAll('[data-stage]')];
  let stage = 'maturity';
  let switchFraction;
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
  function fill(input) {
    for (const [key, id] of Object.entries(fields)) $(id).value = input[key];
    slider.max = input.days;
    slider.value = input.switchDay;
    switchFraction = input.switchDay / input.days;
    setStage('maturity');
  }
  function render({ edited = false } = {}) {
    const input = {};
    for (const [key, id] of Object.entries(fields)) input[key] = $(id).valueAsNumber;
    input.switchDay = slider.valueAsNumber;
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
    const invalid = marketInvalid || Boolean(errors.budget);
    $('split-comparison-results').hidden = invalid;
    $('split-comparison-error').hidden = !invalid;
    $('split-share').disabled = invalid;
    if (marketInvalid) {
      for (const id of ['split-pt-cost', 'split-yt-cost', 'split-switch-value', 'split-rates']) setText(id, '—');
    } else showDeposit(input, stage);
    shareable = '';
    if (!invalid) {
      showComparison(input);
      shareable = splitHash(input);
    }
    if (!edited) return;
    copyRequest++;
    $('split-link-label').hidden = true;
    setText('split-action-status', '');
    if (!shareable) return;
    const saved = saveSplitDraft(shareable);
    saveExperimentLocation(SPLIT_MODEL, shareable);
    if (new URLSearchParams(location.hash.slice(1)).has('yield')) history.replaceState(null, '', shareable);
    notice(saved ? '' : 'This browser could not save your changes. Copy the setup link to keep them.');
  }

  function restore() {
    const draft = readSplitDraft();
    let inputs = draft.inputs || SPLIT_DEFAULTS;
    let message = draft.status === 'invalid' ? 'Your previous setup could not be read. Showing the original example.'
      : draft.status === 'unavailable' ? 'Local saving is unavailable. You can explore and copy a setup link.' : '';
    try {
      const shared = readSplitHash(location.hash);
      if (shared) { inputs = shared; message = 'Shared yield setup loaded.'; }
    } catch {
      message = 'This yield setup link could not be read. Showing ' + (draft.inputs ? 'your last saved setup.' : 'the original example.');
    }
    fill(inputs);
    copyRequest++;
    $('split-link-label').hidden = true;
    setText('split-action-status', '');
    notice(message);
    render();
  }
  for (const id of Object.values(fields)) $(id).addEventListener('input', () => {
    if (id === 'split-days' && $(id).validity.valid && Number.isInteger($(id).valueAsNumber)) {
      slider.max = $(id).value;
      slider.value = Math.round($(id).valueAsNumber * switchFraction);
    }
    render({ edited: true });
  });
  slider.addEventListener('input', () => {
    switchFraction = slider.valueAsNumber / Number(slider.max);
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
