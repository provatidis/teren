import { saveExperimentLocation } from '../data/experiment-location.js';
import { validateExperimentDraft } from '../data/saved-experiments.js';
import { LOAN_MODEL, LOAN_DEFAULTS, LOAN_LIMITS, calculateLoan, validateLoan } from '../models/collateral-loan-v1.js';
import { readLoanDraft, saveLoanDraft, readLiquidationDraft, saveLiquidationDraft } from '../data/lending-state.js';
import { LIQUIDATION_DEFAULTS, LIQUIDATION_LIMITS, validateLiquidation, singleLiquidation, interestReference, healthPriceCurve } from '../models/loan-explanations.js';
import { loanHash, readLoanHash } from '../lib/lending-links.js';
import { healthLabel, loanStatus, boundaryDistance, loanMoney as usd } from '../lib/lending-presentation.js';
import { signedUSD, formatTokenQuantity } from '../lib/format.js';

export function initLending() {
  const $ = id => document.getElementById(id);
  const stored = readLoanDraft();
  let current;
  let firstInvalid;
  let revision = 0;
  let wasEligible = false;
  const keys = Object.keys(LOAN_LIMITS);
  const liquidationKeys = Object.keys(LIQUIDATION_LIMITS);
  const readLiquidation = () => Object.fromEntries(liquidationKeys.map(key => [key, $('liquidation-' + key).value === '' ? NaN : Number($('liquidation-' + key).value)]));
  function writeLiquidation(input) {
    for (const key of liquidationKeys) $('liquidation-' + key).value = input[key];
  }
  function renderExplanations(input, result, save) {
    const curve = healthPriceCurve(input);
    $('loan-chart-details').hidden = !curve;
    if (curve) {
      const x = price => 65 + price / curve.maxPrice * 525;
      const y = health => 200 - health / curve.maxHealth * 170;
      const boundaryY = y(1);
      const rightHealth = result.end.collateralTokens * curve.maxPrice * input.threshold / 100 / result.end.debt;
      $('loan-chart-line').setAttribute('d', 'M65 200 L590 ' + y(rightHealth));
      $('loan-chart-boundary').setAttribute('d', 'M65 ' + boundaryY + ' H590');
      $('loan-chart-danger').setAttribute('d', 'M65 ' + boundaryY + ' H590 V200 H65 Z');
      $('loan-chart-dot').setAttribute('cx', x(input.future));
      $('loan-chart-dot').setAttribute('cy', y(curve.selectedHealth));
      $('loan-chart-one').setAttribute('y', boundaryY + 5);
      $('loan-chart-top').textContent = healthLabel(curve.maxHealth);
      $('loan-chart-max').textContent = usd(curve.maxPrice) + '/ETH';
      $('loan-chart-caption').textContent = 'At ' + usd(input.future) + '/ETH, health factor is ' + healthLabel(curve.selectedHealth) + '. Interest period: ' + input.days + ' days, using simple interest. Each point is a hypothetical ETH price with the same token balances.';
      $('loan-health-chart').setAttribute('aria-label', 'Health factor versus ETH price at fixed balances. Selected price ' + usd(input.future) + ', health factor ' + healthLabel(curve.selectedHealth) + '. Liquidation boundary ' + usd(curve.boundaryPrice) + ' per ETH.');
    }
    const interest = interestReference(input);
    $('loan-simple-debt').textContent = usd(interest.simpleDebt);
    $('loan-compound-debt').textContent = usd(interest.compoundedDebt);
    $('loan-interest-difference').textContent = 'Continuous compounding adds ' + usd(interest.difference) + ' more debt over ' + input.days + ' days at this fixed APR.';
    $('loan-interest-alert').hidden = input.borrow === 0 || interest.difference < input.borrow * 0.01;

    const assumptions = readLiquidation();
    const errors = validateLiquidation(assumptions);
    for (const key of liquidationKeys) {
      $('liquidation-' + key + '-error').textContent = errors[key] || '';
      $('liquidation-' + key + '-error').hidden = !errors[key];
      $('liquidation-' + key).setAttribute('aria-invalid', String(!!errors[key]));
    }
    const invalid = Object.keys(errors).length > 0;
    if (invalid) { current = null; $('loan-share').disabled = true; $('loan-save').disabled = true; }
    if (save && !invalid) saveLiquidationDraft(assumptions);
    const eligible = result.end.status === 'eligible';
    if (eligible && !wasEligible) $('loan-liquidation').open = true;
    wasEligible = eligible;
    $('loan-liquidation-caption').textContent = eligible ? 'At this price, a liquidator could act. See what one event changes.' : 'Explore one hypothetical event at the chosen price.';
    const event = invalid ? null : singleLiquidation(input, assumptions);
    $('loan-liquidation-result').hidden = event?.status !== 'executed';
    if (invalid) {
      $('loan-liquidation-status').textContent = 'Check the highlighted liquidation inputs. The loan balances above are still valid.';
      return;
    }
    if (event.status !== 'executed') {
      $('loan-liquidation-status').textContent = result.end.status === 'no-debt' ? 'With no debt, there is no loan to liquidate.' : 'The loan is not eligible for liquidation at this price. Choose a price below the boundary to explore one event.';
      return;
    }
    $('loan-liquidation-status').textContent = event.exhausted && event.remainingDebt > 0
      ? 'All collateral is used in this example. Some debt remains unpaid; this does not model how a protocol resolves that shortfall.'
      : 'One hypothetical event at ' + usd(input.future) + '/ETH. In practice, the price and amount repaid can differ from this example.';
    $('loan-liquidation-repaid').textContent = usd(event.repaid);
    $('loan-liquidation-removed').textContent = formatTokenQuantity(event.removedTokens, 6) + ' ETH';
    $('loan-liquidation-removed-value').textContent = usd(event.removedValue) + ' at the chosen price';
    $('loan-liquidation-penalty').textContent = usd(event.penalty);
    $('loan-liquidation-collateral').textContent = formatTokenQuantity(event.remainingTokens, 6) + ' ETH';
    $('loan-liquidation-debt').textContent = usd(event.remainingDebt);
    $('loan-liquidation-net').textContent = usd(event.netAssets);
    $('loan-liquidation-loss').textContent = 'The bonus reduces assets minus debt by ' + usd(event.penalty) + ' in this event, before costs.';
    $('loan-liquidation-health').textContent = event.remainingHealth === null ? 'No debt remains after this event.'
      : event.exhausted ? 'No supplied ETH remains. There is still ' + usd(event.remainingDebt) + ' of unpaid debt in this example.'
      : 'Remaining health factor: ' + healthLabel(event.remainingHealth) + (event.remainingHealth < 1 ? '. Still below 1; another liquidation could be possible.' : '. Future price or interest changes can make it eligible again.');
  }
  function readInputs() {
    const input = Object.fromEntries(keys.map(key => [key, $('loan-' + key).value === '' ? NaN : Number($('loan-' + key).value)]));
    input.collateralEnabled = $('loan-collateralEnabled').checked;
    return input;
  }
  function writeInputs(input) {
    for (const key of keys) $('loan-' + key).value = input[key];
    $('loan-collateralEnabled').checked = input.collateralEnabled;
  }
  function render(save = false) {
    revision++;
    $('loan-save-status').textContent = '';
    const input = readInputs();
    const errors = validateLoan(input);
    for (const key of keys) {
      const error = $('loan-' + key + '-error');
      error.hidden = !errors[key];
      error.textContent = errors[key] || '';
      $('loan-' + key).setAttribute('aria-invalid', String(!!errors[key]));
    }
    const invalid = Object.keys(errors).length > 0;
    firstInvalid = Object.keys(errors).find(key => key !== 'budget');
    const invalidLoan = !!firstInvalid;
    $('loan-invalid').hidden = !invalidLoan;
    $('loan-error-summary').textContent = invalidLoan ? errors[firstInvalid] : '';
    $('loan-outcomes').hidden = invalidLoan;
    $('loan-response-results').hidden = invalid;
    $('loan-share').disabled = invalid;
    $('loan-save').disabled = invalid;
    $('loan-share-url').hidden = true;
    $('loan-share-status').textContent = '';
    const invalidSetup = ['collateral', 'start', 'borrow', 'supplyAPR', 'borrowAPR', 'maxLTV', 'threshold'].some(key => errors[key]);
    $('loan-setup-caption').textContent = invalidSetup ? 'Check the highlighted starting inputs'
      : formatTokenQuantity(input.collateral, 6) + ' ETH supplied · ' + formatTokenQuantity(input.borrow, 2) + ' USDC borrowed';
    $('loan-start-limit').textContent = ['collateral', 'start', 'maxLTV'].some(key => errors[key])
      ? 'Complete the starting collateral, price and maximum LTV to see the borrowing limit.'
      : usd(input.collateralEnabled ? input.collateral * input.start * input.maxLTV / 100 : 0) + ' maximum new borrowing at the starting price.';
    $('loan-rates').textContent = errors.supplyAPR || errors.borrowAPR ? 'Check the assumed interest rates.'
      : 'Simple APR assumptions: ' + formatTokenQuantity(input.supplyAPR, 2) + '% supply · ' + formatTokenQuantity(input.borrowAPR, 2) + '% borrow';
    $('loan-show-result').textContent = invalidLoan ? 'Check inputs ↑' : 'Full result ↓';
    current = invalid ? null : calculateLoan(input);
    if (invalidLoan) {
      $('loan-quick-health').textContent = 'Check loan inputs';
      $('loan-desktop-health').textContent = 'Check loan inputs';
      $('loan-quick-state').textContent = 'Open the highlighted field to restore the result.';
      $('loan-quick-result').dataset.state = 'invalid';
      return;
    }
    // The response budget does not change the existing loan. Keep that result
    // visible while the separate response input is incomplete or invalid.
    const result = current || calculateLoan({ ...input, budget: 0 });
    const { start, end, responses } = result;
    $('loan-state').textContent = loanStatus(end);
    $('loan-risk').dataset.state = end.status;
    $('loan-health').textContent = healthLabel(end.healthFactor);
    $('loan-quick-health').textContent = end.healthFactor === null ? 'No debt' : 'Health factor ' + healthLabel(end.healthFactor);
    $('loan-desktop-health').textContent = $('loan-quick-health').textContent;
    $('loan-quick-state').textContent = loanStatus(end);
    $('loan-quick-result').dataset.state = end.status;
    $('loan-health-note').textContent = end.status === 'no-debt'
      ? 'No debt means no loan liquidation boundary. The supply still has asset and protocol risks.'
      : end.status === 'eligible'
        ? 'A liquidator could repay debt and take collateral plus a bonus. The balances below assume this has not happened yet.'
        : end.status === 'boundary'
          ? 'Health factor is exactly 1. A further adverse change would make this loan eligible for liquidation.'
          : 'Below 1, this position becomes eligible for liquidation.';
    $('loan-boundary').textContent = end.boundaryPrice === null ? 'No boundary while debt is zero.'
      : 'At these balances, the ETH price boundary is ' + usd(end.boundaryPrice) + '. Lower prices would make the position eligible.';
    $('loan-boundary-distance').textContent = boundaryDistance(input.future, end.boundaryPrice);
    $('loan-initial-health').textContent = 'Starting health factor: ' + healthLabel(start.healthFactor);
    $('loan-collateral-value').textContent = usd(end.collateralValue);
    $('loan-collateral-tokens').textContent = formatTokenQuantity(end.collateralTokens, 6) + ' ETH, including supply interest';
    $('loan-cash-value').textContent = usd(result.borrowedCash);
    $('loan-debt-value').textContent = usd(end.debt);
    $('loan-interest-debt').textContent = 'Includes ' + usd(result.borrowInterest) + ' of assumed interest';
    $('loan-net-assets').textContent = usd(result.netAssets);
    $('loan-net-note').textContent = signedUSD(result.interestDifference) + ' versus holding the original ETH at this price, before costs and any liquidation.';
    $('loan-balances-title').textContent = end.status === 'eligible' ? 'Balances before liquidation' : 'Keep both sides in view';
    $('loan-balance-context').textContent = end.status === 'eligible'
      ? 'Liquidation is possible here. These are the balances before a liquidator acts; explore one event below.'
      : 'Borrowed cash comes with a matching debt. Interest and ETH’s price change the balance.';
    $('loan-balance-context').classList.toggle('loan-attention', end.status === 'eligible');
    $('loan-supply-interest').textContent = formatTokenQuantity(result.supplyInterestTokens, 6) + ' ETH (' + usd(result.supplyInterestTokens * input.future) + ' at this price)';
    $('loan-borrow-interest').textContent = formatTokenQuantity(result.borrowInterest, 2) + ' USDC';
    $('loan-slider').min = Math.min(input.start * 0.25, input.future);
    $('loan-slider').max = Math.max(input.start * 1.75, input.future);
    $('loan-slider').value = input.future;
    $('loan-slider').setAttribute('aria-valuetext', usd(input.future) + ' per ETH');
    for (const button of document.querySelectorAll('[data-loan-price]')) button.setAttribute('aria-pressed', String(input.future === input.start * Number(button.dataset.loanPrice)));
    for (const name of ['unchanged', 'repay', 'add']) {
      const response = responses[name];
      $('loan-response-' + name).textContent = healthLabel(response.healthFactor);
      $('loan-response-' + name + '-state').textContent = loanStatus(response);
      $('loan-response-' + name + '-debt').textContent = usd(response.debt) + ' debt';
    }
    $('loan-repay-note').textContent = usd(responses.repay.spent) + ' repaid · ' + usd(responses.repay.unused) + ' budget left';
    $('loan-add-note').textContent = formatTokenQuantity(result.input.budget / input.future, 6) + ' ETH added at this price';
    renderExplanations({ ...input, budget: result.input.budget }, result, save);
    const resumable = save && current && saveExperimentLocation(LOAN_MODEL, loanHash(current.input, readLiquidation()));
    if (save && !invalid) $('loan-storage').textContent = saveLoanDraft(input)
      ? 'Working setup kept in this tab.' + (resumable ? ' Home can resume these inputs.' : '') + ' Save a named experiment to keep alternatives.'
      : 'Tab storage is unavailable. Copy an experiment link to keep this setup.';
  }
  function restoreLocation() {
    const shared = readLoanHash(location.hash);
    $('loan-route-note').hidden = shared.status !== 'invalid';
    if (shared.status === 'ready') {
      writeInputs(shared.input);
      writeLiquidation(shared.liquidation || LIQUIDATION_DEFAULTS);
      render(true);
    }
  }
  function focusField(key) {
    const field = $('loan-' + key);
    for (let parent = field.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    requestAnimationFrame(() => {
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
  }
  writeInputs(stored.input);
  writeLiquidation(readLiquidationDraft());
  render();
  $('loan-storage').textContent = stored.status === 'unavailable'
    ? 'The previous tab draft could not be read. Default inputs are shown; copy a link to keep your work.'
    : 'Working setup kept in this tab. Copy a link to keep or share it.';
  restoreLocation();
  if (matchMedia('(max-width: 750px)').matches) $('loan-setup').open = false;
  for (const key of keys) $('loan-' + key).addEventListener('input', () => render(true));
  for (const key of liquidationKeys) $('liquidation-' + key).addEventListener('input', () => render(true));
  $('loan-collateralEnabled').addEventListener('change', () => render(true));
  $('loan-slider').addEventListener('input', () => { $('loan-future').value = $('loan-slider').value; render(true); });
  for (const button of document.querySelectorAll('[data-loan-price]')) button.addEventListener('click', () => {
    $('loan-future').value = Number($('loan-start').value) * Number(button.dataset.loanPrice); render(true);
  });
  $('loan-edit-rates').addEventListener('click', () => focusField('supplyAPR'));
  $('loan-open-compounding').addEventListener('click', () => {
    $('loan-compounding').open = true;
    $('loan-compounding').querySelector('summary').focus();
    $('loan-compounding').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  $('loan-fix-input').addEventListener('click', () => { if (firstInvalid) focusField(firstInvalid); });
  $('loan-show-result').addEventListener('click', () => {
    if (firstInvalid) { focusField(firstInvalid); return; }
    $('loan-risk').focus({ preventScroll: true });
    $('loan-risk').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  $('loan-reset').addEventListener('click', () => {
    writeInputs(LOAN_DEFAULTS);
    writeLiquidation(LIQUIDATION_DEFAULTS);
    render(true);
    $('loan-share-status').textContent = 'Default loan restored.';
  });
  $('loan-share').addEventListener('click', async () => {
    if (!current) return;
    const url = new URL(location.href); url.hash = loanHash(current.input, readLiquidation());
    const copiedRevision = revision;
    $('loan-share-url').value = url.href;
    try {
      await navigator.clipboard.writeText(url.href);
      if (revision === copiedRevision) $('loan-share-status').textContent = 'Experiment link copied.';
    }
    catch {
      if (revision !== copiedRevision) return;
      $('loan-share-url').hidden = false;
      $('loan-share-status').textContent = 'Select and copy this experiment link.';
      $('loan-share-url').focus(); $('loan-share-url').select();
    }
  });
  window.addEventListener('hashchange', restoreLocation);
  return {
    restoreLocation,
    getExperimentDraft() {
      return current ? validateExperimentDraft({ model: LOAN_MODEL, inputs: current.input, liquidation: readLiquidation() }) : null;
    },
    setExperiment(entry) {
      const draft = validateExperimentDraft(entry);
      writeInputs(draft.inputs); writeLiquidation(draft.liquidation); render(true);
      $('loan-save-status').textContent = 'Opened “' + entry.name + '” as a working copy. Save again to keep a variation.';
    },
  };
}
