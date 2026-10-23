import { LOAN_DEFAULTS, LOAN_LIMITS, calculateLoan, validateLoan } from '../models/collateral-loan-v1.js?v=1.17.1';
import { readLoanDraft, saveLoanDraft } from '../data/lending-state.js?v=1.17.1';
import { loanHash, readLoanHash } from '../lib/lending-links.js?v=1.17.1';
import { healthLabel, loanStatus, loanMoney as usd } from '../lib/lending-presentation.js?v=1.17.1';
import { signedUSD, formatTokenQuantity } from '../lib/format.js';

export function initLending() {
  const $ = id => document.getElementById(id);
  const stored = readLoanDraft();
  let current;
  let firstInvalid;
  let revision = 0;
  const keys = Object.keys(LOAN_LIMITS);
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
    $('loan-share-url').hidden = true;
    $('loan-share-status').textContent = '';
    const invalidSetup = ['collateral', 'start', 'borrow', 'supplyAPR', 'borrowAPR', 'maxLTV', 'threshold'].some(key => errors[key]);
    $('loan-setup-caption').textContent = invalidSetup ? 'Check the highlighted starting inputs'
      : formatTokenQuantity(input.collateral, 6) + ' ETH supplied · ' + formatTokenQuantity(input.borrow, 2) + ' USDC borrowed';
    $('loan-start-limit').textContent = ['collateral', 'start', 'maxLTV'].some(key => errors[key])
      ? 'Complete the starting collateral, price and maximum LTV to see the borrowing limit.'
      : usd(input.collateralEnabled ? input.collateral * input.start * input.maxLTV / 100 : 0) + ' maximum new borrowing at the starting price.';
    $('loan-rates').textContent = errors.supplyAPR || errors.borrowAPR ? 'Check the assumed interest rates.'
      : 'Assumed APRs: ' + formatTokenQuantity(input.supplyAPR, 2) + '% supply · ' + formatTokenQuantity(input.borrowAPR, 2) + '% borrow';
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
        ? 'Health factor is below 1. This shows eligibility before any liquidation; it does not simulate what a liquidator takes.'
        : end.status === 'boundary'
          ? 'Health factor is exactly 1. A further adverse change would make this loan eligible for liquidation.'
          : 'Below 1, this position becomes eligible for liquidation.';
    $('loan-boundary').textContent = end.boundaryPrice === null ? 'No boundary while debt is zero.'
      : 'At these balances, the ETH price boundary is ' + usd(end.boundaryPrice) + '. Lower prices would make the position eligible.';
    $('loan-initial-health').textContent = 'Starting health factor: ' + healthLabel(start.healthFactor);
    $('loan-collateral-value').textContent = usd(end.collateralValue);
    $('loan-collateral-tokens').textContent = formatTokenQuantity(end.collateralTokens, 6) + ' ETH, including supply interest';
    $('loan-cash-value').textContent = usd(result.borrowedCash);
    $('loan-debt-value').textContent = usd(end.debt);
    $('loan-interest-debt').textContent = 'Includes ' + usd(result.borrowInterest) + ' of assumed interest';
    $('loan-net-assets').textContent = usd(result.netAssets);
    $('loan-net-note').textContent = signedUSD(result.interestDifference) + ' versus holding the original ETH at this price, before costs and any liquidation.';
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
    if (save && !invalid) $('loan-storage').textContent = saveLoanDraft(input)
      ? 'Working setup kept in this tab. Copy a link to keep or share it.'
      : 'Tab storage is unavailable. Copy an experiment link to keep this setup.';
  }
  function restoreLocation() {
    const shared = readLoanHash(location.hash);
    $('loan-route-note').hidden = shared.status !== 'invalid';
    if (shared.status === 'ready') { writeInputs(shared.input); render(true); }
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
  render();
  $('loan-storage').textContent = stored.status === 'unavailable'
    ? 'The previous tab draft could not be read. Default inputs are shown; copy a link to keep your work.'
    : 'Working setup kept in this tab. Copy a link to keep or share it.';
  restoreLocation();
  if (matchMedia('(max-width: 750px)').matches) $('loan-setup').open = false;
  for (const key of keys) $('loan-' + key).addEventListener('input', () => render(true));
  $('loan-collateralEnabled').addEventListener('change', () => render(true));
  $('loan-slider').addEventListener('input', () => { $('loan-future').value = $('loan-slider').value; render(true); });
  for (const button of document.querySelectorAll('[data-loan-price]')) button.addEventListener('click', () => {
    $('loan-future').value = Number($('loan-start').value) * Number(button.dataset.loanPrice); render(true);
  });
  $('loan-edit-rates').addEventListener('click', () => focusField('supplyAPR'));
  $('loan-fix-input').addEventListener('click', () => { if (firstInvalid) focusField(firstInvalid); });
  $('loan-show-result').addEventListener('click', () => {
    if (firstInvalid) { focusField(firstInvalid); return; }
    $('loan-risk').focus({ preventScroll: true });
    $('loan-risk').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  $('loan-reset').addEventListener('click', () => {
    writeInputs(LOAN_DEFAULTS);
    render(true);
    $('loan-share-status').textContent = 'Default loan restored.';
  });
  $('loan-share').addEventListener('click', async () => {
    if (!current) return;
    const url = new URL(location.href); url.hash = loanHash(current.input);
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
  return { restoreLocation };
}
