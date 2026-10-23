import { LOOP_DEFAULTS, LOOP_LIMITS, calculateLoop, validateLoop, loopAtPrice } from '../models/borrowing-loop-v1.js';
import { readLoopDraft, saveLoopDraft } from '../data/loop-state.js';
import { loopHash, readLoopHash } from '../lib/loop-links.js';
import { healthLabel, loanStatus } from '../lib/lending-presentation.js';
import { loopTokens, loopMoney, loopComparison, loopUnwindLabels } from '../lib/loop-presentation.js';
import { fmt, compactUSD, formatTokenQuantity } from '../lib/format.js';

const money = loopMoney;
const usdc = value => formatTokenQuantity(value, 2) + ' USDC';

export function initBorrowingLoops() {
  const $ = id => document.getElementById(id);
  const keys = [...Object.keys(LOOP_LIMITS), 'interestMode'];
  const stored = readLoopDraft();
  let current = null, firstInvalid, revision = 0;

  function node(tag, copy, className) {
    const element = document.createElement(tag);
    if (copy !== undefined) element.textContent = copy;
    if (className) element.className = className;
    return element;
  }
  function write(input) { for (const key of keys) $('loop-' + key).value = input[key]; }
  function read() {
    return Object.fromEntries(keys.map(key => {
      const value = $('loop-' + key).value;
      return [key, key === 'interestMode' ? value : value.trim() === '' ? NaN : Number(value)];
    }));
  }
  function facts(entries, className = 'loop-step-facts') {
    const list = node('dl', undefined, className);
    for (const [label, value] of entries) {
      const group = node('div'); group.append(node('dt', label), node('dd', value)); list.append(group);
    }
    return list;
  }
  function renderLedger(result) {
    const opened = new Set([...$('loop-ledger').querySelectorAll('details[open]')].map(item => item.dataset.loopRound));
    if (!result.rounds.length) {
      $('loop-ledger').replaceChildren(node('p', 'Only your original ETH is supplied. No USDC was borrowed or spent.', 'body-copy'));
      return;
    }
    $('loop-ledger').replaceChildren(...result.rounds.map(round => {
      const details = node('details', undefined, 'loop-round');
      details.dataset.loopRound = String(round.round);
      details.open = opened.has(String(round.round));
      const summary = node('summary');
      const action = node('span', details.open ? 'Hide the three actions' : 'Show the three actions', 'loop-round-action');
      summary.append(node('strong', 'Round ' + round.round + ' · Borrow ' + usdc(round.borrowed)),
        node('span', 'After supplying: ' + loopTokens(round.position.collateralTokens) + ' · ' + usdc(round.position.debt) + ' debt', 'loop-round-caption'), action);
      details.addEventListener('toggle', () => { action.textContent = details.open ? 'Hide the three actions' : 'Show the three actions'; });
      details.append(summary);
      const list = node('ol', undefined, 'loop-step-list');
      for (const step of result.steps.filter(item => item.round === round.round)) {
        const item = node('li');
        const titles = { borrow: 'Borrow USDC', swap: 'Buy ETH', supply: 'Supply the purchased ETH' };
        const descriptions = {
          borrow: 'USDC enters the wallet and an equal debt appears.',
          swap: 'The USDC is spent. ' + loopTokens(step.amount) + ' enters the wallet after ' + money(step.cost || 0) + ' of swap loss.',
          supply: 'The purchased ETH leaves the wallet and becomes collateral.',
        };
        const p = step.position;
        item.append(node('h3', titles[step.action]), node('p', descriptions[step.action]), facts([
          ['Supplied', loopTokens(p.collateralTokens)],
          ['Wallet', p.walletETH > 0 ? loopTokens(p.walletETH) : usdc(p.cash)],
          ['Debt', usdc(p.debt)], ['Health factor', healthLabel(p.healthFactor)],
          ['Assets minus debt', money(p.netAssets)],
        ]));
        list.append(item);
      }
      details.append(list);
      return details;
    }));
  }
  function renderChart(result) {
    const input = result.input, left = 94, right = 600, top = 28, bottom = 246;
    const minPrice = Math.max(0.01, Math.min(input.start * 0.5, input.future * 0.8));
    const maxPrice = Math.max(input.start * 1.5, input.future * 1.2);
    const low = loopAtPrice(result, minPrice).netAssets, high = loopAtPrice(result, maxPrice).netAssets;
    const minValue = Math.min(0, low), maxValue = Math.max(1, high, input.collateral * maxPrice);
    const x = price => left + (price - minPrice) / (maxPrice - minPrice) * (right - left);
    const y = value => bottom - (value - minValue) / (maxValue - minValue) * (bottom - top);
    const path = (a, b) => 'M' + left + ' ' + y(a) + 'L' + right + ' ' + y(b);
    $('loop-chart-value').setAttribute('d', path(low, high));
    $('loop-chart-hold').setAttribute('d', path(input.collateral * minPrice, input.collateral * maxPrice));
    $('loop-chart-grid').setAttribute('d', 'M94 28H600M94 137H600M94 246H600');
    $('loop-chart-zero').setAttribute('d', 'M94 ' + y(0) + 'H600');
    $('loop-chart-point').setAttribute('cx', x(input.future));
    $('loop-chart-point').setAttribute('cy', y(result.end.netAssets));
    const boundary = result.end.boundaryPrice;
    const visibleBoundary = boundary !== null && boundary >= minPrice && boundary <= maxPrice;
    $('loop-chart-boundary').setAttribute('d', visibleBoundary ? 'M' + x(boundary) + ' ' + top + 'V' + bottom : '');
    $('loop-chart-limit').textContent = boundary === null ? 'No debt, so there is no loan liquidation boundary.'
      : (visibleBoundary ? 'Vertical dotted line: ' : 'Liquidation boundary outside this chart: ') + money(boundary) + '/ETH. Below this price, values still show balances before liquidation; actual liquidation would change them.';
    $('loop-chart-top').textContent = compactUSD(maxValue);
    $('loop-chart-bottom').textContent = compactUSD(minValue);
    $('loop-chart-left').textContent = compactUSD(minPrice) + '/ETH';
    $('loop-chart-right').textContent = compactUSD(maxPrice) + '/ETH';
    $('loop-chart-current').textContent = 'Dot: your selected price, ' + money(input.future) + '/ETH. Assets minus debt: ' + money(result.end.netAssets) + '.';
    $('loop-price-chart').setAttribute('aria-label', 'Possible ETH prices at fixed accrued balances. At ' + money(input.future) + ' per ETH, setup net assets are ' + money(result.end.netAssets) + ', versus ' + money(result.holdingValue) + ' holding original ETH. Before liquidation and unwinding.');
  }
  function renderUnwind(result) {
    const preview = result.unwind;
    const messages = {
      'no-debt': 'There is no debt to repay. No ETH needs to be sold to close a loan.',
      blocked: 'At or below the liquidation boundary, this withdrawal-first preview stops. Debt remains owed. These are pre-liquidation balances, not an actual liquidation outcome.',
      complete: 'The assumed sequence repays all debt. The remaining ETH is no longer backing a loan. No outside money was added.',
      limited: 'The preview stopped before clearing all debt. Remaining debt is still shown; no amount has been written off.',
    };
    if ($('loop-unwind-status').textContent !== messages[preview.status]) $('loop-unwind-status').textContent = messages[preview.status];
    const labels = loopUnwindLabels(preview.status);
    for (const [key, label] of Object.entries(labels)) $('loop-unwind-' + key + '-label').textContent = label;
    $('loop-unwind-result').dataset.state = preview.status;
    $('loop-unwind-eth').textContent = loopTokens(preview.remaining.collateralTokens);
    $('loop-unwind-debt').textContent = money(preview.remaining.debt);
    $('loop-unwind-cost').textContent = preview.status === 'blocked' ? 'Not run' : money(preview.costs);
    $('loop-unwind-net').textContent = money(preview.remaining.netAssets);
    $('loop-unwind-details').hidden = preview.steps.length === 0;
    $('loop-unwind-caption').textContent = preview.steps.length === 1 ? 'Show the unwind step' : 'Show the ' + preview.steps.length + ' unwind steps';
    $('loop-unwind-cost-note').hidden = preview.steps.length === 0;
    $('loop-unwind-cost-note').textContent = 'Swap losses: ' + money(result.buildCosts) + ' while building, plus ' + money(preview.costs) + (preview.status === 'limited' ? ' in this partial unwind' : ' while unwinding') + '. Gas is excluded.';
    $('loop-unwind-steps').replaceChildren(...preview.steps.map(step => {
      const item = node('li');
      item.append(node('p', 'Withdraw and sell ' + loopTokens(step.soldTokens) + ', then repay ' + usdc(step.repaid) + '.'),
        node('p', 'Health factor after withdrawal, before repayment: ' + healthLabel(step.withdrawalHealth) + '. Debt left: ' + usdc(step.remaining.debt) + '.', 'fine-print'));
      return item;
    }));
  }
  function render(save = false) {
    revision++;
    $('loop-share-url').hidden = true;
    $('loop-share-status').textContent = '';
    const input = read(), errors = validateLoop(input);
    if (errors.borrowPercent && Number.isFinite(input.borrowPercent) && Number.isFinite(input.maxLTV) && input.borrowPercent > input.maxLTV) {
      errors.borrowPercent = 'Use ' + formatTokenQuantity(input.maxLTV, 4) + '% or less. Edit maximum LTV in Original capital and assumptions to change that limit.';
    }
    firstInvalid = keys.find(key => errors[key]);
    for (const key of keys) {
      $('loop-' + key).setAttribute('aria-invalid', String(!!errors[key]));
      $('loop-' + key + '-error').textContent = errors[key] || '';
      $('loop-' + key + '-error').hidden = !errors[key];
    }
    $('loop-invalid').hidden = !firstInvalid;
    $('loop-results').hidden = !!firstInvalid;
    $('loop-share').disabled = !!firstInvalid;
    const roundsValid = Number.isInteger(input.rounds) && !errors.rounds;
    $('loop-round-down').disabled = !roundsValid || input.rounds === 0;
    $('loop-round-up').disabled = !roundsValid || input.rounds === 5;
    $('loop-quick-result').dataset.state = firstInvalid ? 'invalid' : 'above';
    if (firstInvalid) {
      current = null;
      $('loop-quick-value').textContent = 'Check loop inputs';
      $('loop-quick-state').textContent = errors[firstInvalid];
      if (errors.collateral || errors.start || errors.borrowPercent || errors.rounds) $('loop-borrowPercent-help').textContent = 'Complete the highlighted inputs to calculate the first round’s borrowing.';
      if (errors.collateral || errors.start) $('loop-setup-caption').textContent = 'Check original capital inputs';
      return;
    }
    current = calculateLoop(input);
    const result = current, end = result.end, comparison = loopComparison(end.netAssets, result.holdingValue);
    $('loop-quick-result').dataset.state = end.status;
    $('loop-quick-value').textContent = comparison.compact;
    $('loop-quick-state').textContent = 'Health factor: ' + healthLabel(end.healthFactor);
    $('loop-outcome-title').textContent = input.rounds ? 'Your loop compared with holding' : 'Supply only compared with holding';
    $('loop-capital-note').textContent = 'Both start with ' + loopTokens(input.collateral) + ' worth ' + money(result.ownCapital) + '. No outside capital is added.';
    $('loop-result-context').textContent = 'At ' + money(input.future) + '/ETH' + (input.days === 0 ? ', with no time elapsed.' : ', after ' + formatTokenQuantity(input.days, 2) + (input.days === 1 ? ' day.' : ' days.'));
    $('loop-ledger-title').textContent = input.rounds ? 'Follow each round' : 'Starting supply';
    $('loop-ledger-context').textContent = input.rounds ? 'All rounds use the starting price of ' + money(input.start) + '/ETH and happen before time passes.'
      : 'Your original ETH is supplied at the starting price of ' + money(input.start) + '/ETH.';
    $('loop-ledger-help').hidden = input.rounds === 0;
    $('loop-tokens').textContent = loopTokens(end.collateralTokens);
    $('loop-exposure').textContent = input.rounds ? 'About ' + fmt(result.startingExposure) + '× the original ETH before interest' : 'Your original supply, including any assumed interest';
    $('loop-debt').textContent = money(end.debt);
    $('loop-cash-note').textContent = input.rounds ? 'Borrowed cash was spent buying ETH' : 'No USDC was borrowed';
    $('loop-net').textContent = money(end.netAssets);
    $('loop-net-note').textContent = 'ETH value ' + money(end.collateralValue) + ' minus debt; no borrowed cash remains';
    $('loop-hold').textContent = money(result.holdingValue);
    $('loop-difference').textContent = comparison.label;
    $('loop-difference').dataset.relation = comparison.relation;
    $('loop-borrowPercent-help').textContent = input.rounds === 0 ? 'No borrowing is applied at zero rounds. This fraction is used when you add a round.'
      : 'Round 1 borrows ' + usdc(input.collateral * input.start * input.borrowPercent / 100) + '. Later rounds borrow the same fraction of the preceding purchase’s value.';
    $('loop-setup-caption').textContent = loopTokens(input.collateral) + ' at ' + money(input.start) + '/ETH';
    $('loop-health').textContent = 'Health factor: ' + healthLabel(end.healthFactor);
    $('loop-risk-copy').textContent = loanStatus(end) + '. Health factor measures backing, not profit or price exposure.';
    $('loop-risk-boundary').textContent = end.boundaryPrice === null ? 'With no debt, there is no loan liquidation boundary.'
      : 'At these balances, the price boundary is ' + money(end.boundaryPrice) + '/ETH. Below it, liquidation is possible.';
    $('loop-risk').dataset.state = end.status;
    $('loop-liquidation-warning').hidden = end.status !== 'eligible' && end.status !== 'boundary';
    $('loop-accounting').replaceChildren(...facts([
      ['Swap losses while building', money(result.buildCosts)],
      ['Supply interest', loopTokens(result.supplyInterestTokens)],
      ['Borrow interest', money(result.borrowInterest)],
      ['Supply original ETH without borrowing', money(result.supplyOnlyValue)],
    ], 'loop-accounting').children);
    $('loop-rate-summary').textContent = fmt(input.supplyAPR) + '% supply · ' + fmt(input.borrowAPR) + '% borrow APR · ' + (input.interestMode === 'compound' ? 'continuous compounding' : 'simple interest') + ' · fixed rates';
    for (const button of document.querySelectorAll('[data-loop-rounds]')) button.setAttribute('aria-pressed', String(Number(button.dataset.loopRounds) === input.rounds));
    for (const button of document.querySelectorAll('[data-loop-price]')) button.setAttribute('aria-pressed', String(input.future === input.start * Number(button.dataset.loopPrice)));
    renderLedger(result); renderChart(result); renderUnwind(result);
    if (save) $('loop-storage').textContent = saveLoopDraft(input)
      ? 'Working loop kept in this tab, separately from your single loan. Copy a link to keep or share it.'
      : 'Tab storage is unavailable. Copy a loop link to keep your setup.';
  }
  function focus(id) {
    const target = $(id);
    for (let parent = target.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
    requestAnimationFrame(() => { target.focus({ preventScroll: true }); target.scrollIntoView({ block: id === 'loop-outcome' ? 'start' : 'center', behavior: 'instant' }); });
  }
  function restore() {
    const shared = readLoopHash(location.hash);
    $('loop-route-note').hidden = shared.status !== 'invalid';
    if (shared.status === 'ready') { write(shared.input); render(true); }
  }
  write(stored.input); render();
  $('loop-storage').textContent = stored.status === 'unavailable'
    ? 'The previous loop draft could not be read. Defaults are shown; copy a link to keep your setup.'
    : 'Working loop kept in this tab, separately from your single loan. Copy a link to keep or share it.';
  restore();
  for (const key of keys) $('loop-' + key).addEventListener(key === 'interestMode' ? 'change' : 'input', () => render(true));
  for (const [id, delta] of [['loop-round-down', -1], ['loop-round-up', 1]]) $(id).addEventListener('click', () => {
    const count = Number($('loop-rounds').value);
    if (!Number.isInteger(count) || count + delta < 0 || count + delta > 5) return;
    $('loop-rounds').value = count + delta;
    render(true);
    if ($(id).disabled) $('loop-rounds').focus({ preventScroll: true });
  });
  for (const button of document.querySelectorAll('[data-loop-rounds]')) button.addEventListener('click', () => { $('loop-rounds').value = button.dataset.loopRounds; render(true); });
  for (const button of document.querySelectorAll('[data-loop-price]')) button.addEventListener('click', () => { $('loop-future').value = Number($('loop-start').value) * Number(button.dataset.loopPrice); render(true); });
  $('loop-fix-input').addEventListener('click', () => { if (firstInvalid) focus('loop-' + firstInvalid); });
  $('loop-show-result').addEventListener('click', () => focus(firstInvalid ? 'loop-' + firstInvalid : 'loop-outcome'));
  $('loop-reset').addEventListener('click', () => { write(LOOP_DEFAULTS); render(true); $('loop-share-status').textContent = 'Default loop restored.'; });
  $('loop-share').addEventListener('click', async () => {
    if (!current) return;
    const url = new URL(location.href); url.hash = loopHash(current.input);
    const copiedRevision = revision;
    $('loop-share-url').value = url.href;
    try {
      await navigator.clipboard.writeText(url.href);
      if (revision === copiedRevision) $('loop-share-status').textContent = 'Loop link copied.';
    } catch {
      if (revision !== copiedRevision) return;
      $('loop-share-url').hidden = false;
      $('loop-share-status').textContent = 'Select and copy this loop link.';
      $('loop-share-url').focus(); $('loop-share-url').select();
    }
  });
  window.addEventListener('hashchange', restore);
}
