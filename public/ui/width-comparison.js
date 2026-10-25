import { calculateWidthComparison, DEFAULT_WIDTHS, WIDTH_LIMITS, WIDTH_MODEL, widthPriceDomain } from '../models/range-width.js';
import { isWidthHash, widthHash, widthsFromHash } from '../lib/width-links.js';
import { readWidthDraft, saveWidthDraft } from '../data/width-draft.js';
import { saveExperimentLocation } from '../data/experiment-location.js';
import { assetAmounts, rangePriceLabels, STATE_COPY } from '../lib/range-presentation.js';
import { compactUSD, fmt, percent, signedUSD, usd, formatTokenQuantity } from '../lib/format.js';

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

export function initWidthComparison({ rangeLab }) {
  const $ = id => document.getElementById(id);
  const fields = { investment: 'width-capital', initialPrice: 'width-start', futurePrice: 'width-price', widthA: 'width-a', widthB: 'width-b' };
  const saved = readWidthDraft();
  const references = new Map();
  let current = null, domain = null;
  function fill(input) {
    for (const [key, id] of Object.entries(fields)) $(id).value = input[key];
  }
  function read() {
    return Object.fromEntries(Object.entries(fields).map(([key, id]) => [key, $(id).value.trim() ? Number($(id).value) : NaN]));
  }
  function validateFields(input) {
    for (const [key, id] of Object.entries(fields)) {
      const { min, max, label } = WIDTH_LIMITS[key];
      const invalid = !Number.isFinite(input[key]) || input[key] < min || input[key] > max;
      $(id).setAttribute('aria-invalid', String(invalid));
      $(id + '-error').hidden = !invalid;
      $(id + '-error').textContent = invalid ? label + ' must be between ' + fmt(min, min < 1 ? 2 : 0) + ' and ' + fmt(max, 0) + '.' : '';
    }
  }
  function makeCards() {
    const cards = ['a', 'b'].map(id => {
      const card = node('article', undefined, 'width-result'); card.dataset.range = id;
      const refs = {};
      card.append(node('h3', 'Range ' + id.toUpperCase()));
      refs.bounds = node('p', '', 'width-result-bounds'); refs.state = node('p', '', 'width-result-state');
      const mix = node('div', undefined, 'width-mix'); mix.setAttribute('role', 'img'); refs.mix = mix;
      refs.ethBar = node('span', undefined, 'width-eth'); mix.append(refs.ethBar, node('span', undefined, 'width-usdc'));
      const tokens = node('p', undefined, 'width-token-key');
      for (const token of ['eth', 'usdc']) {
        const label = node('span'), swatch = node('i', undefined, 'allocation-swatch allocation-swatch-' + token);
        swatch.setAttribute('aria-hidden', 'true'); refs[token] = node('span'); label.append(swatch, refs[token]); tokens.append(label);
      }
      const metrics = node('dl');
      for (const [key, label] of [['principal', 'Principal now'], ['change', 'Change from the start'], ['fees', 'Fees to match holding']]) {
        const row = node('div'); refs[key] = node('dd'); row.append(node('dt', label), refs[key]);
        if (key === 'fees') { refs.feeNote = node('dd', '', 'fine-print'); row.append(refs.feeNote); }
        metrics.append(row);
      }
      const apply = node('button', 'Open ' + id.toUpperCase() + ' in range lab →', 'button secondary'); apply.type = 'button'; apply.dataset.widthApply = id;
      apply.addEventListener('click', () => {
        if (!current) return;
        const range = current.ranges.find(range => range.id === id);
        rangeLab.setScenario(range, 'Controlled width comparison · range ' + id.toUpperCase() + '. Shared 50/50 starting basket; zero assumed fees.', null, { navigate: false });
        location.hash = '#range-lab';
      });
      card.append(refs.bounds, refs.state, mix, tokens, metrics, apply);
      references.set(id, refs); return card;
    });
    $('width-cards').replaceChildren(...cards);
  }
  function renderBands() {
    const x = price => 70 + (price - domain.low) / (domain.high - domain.low) * 500;
    for (const range of current.ranges) {
      const band = $('width-band-' + range.id);
      band.setAttribute('x', x(range.lowerPrice));
      band.setAttribute('width', Math.max(1, x(range.upperPrice) - x(range.lowerPrice)));
    }
    for (const [id, price] of [['start', current.initialPrice], ['price', current.futurePrice]]) {
      $('width-' + id + '-marker').setAttribute('d', 'M' + x(price) + ' 12V114');
    }
    $('width-scale-low').textContent = compactUSD(domain.low); $('width-scale-high').textContent = compactUSD(domain.high);
    $('width-bands-title').textContent = 'At ETH ' + usd(current.futurePrice) + ': A is ' + STATE_COPY[current.ranges[0].state].title.toLowerCase()
      + '; B is ' + STATE_COPY[current.ranges[1].state].title.toLowerCase() + '. Both ranges use the same price scale.';
  }
  function renderGapChart() {
    if (!current || !$('width-chart-details').open) return;
    const prices = [...new Set([...Array.from({ length: 90 }, (_, index) => domain.low + (domain.high - domain.low) * index / 89),
      current.initialPrice, current.futurePrice, ...current.ranges.flatMap(range => [range.lowerPrice, range.upperPrice])])].sort((a, b) => a - b);
    const samples = prices.map(futurePrice => calculateWidthComparison({ ...current, futurePrice }));
    const low = Math.min(-.01, ...samples.flatMap(sample => sample.ranges.map(range => range.difference))) * 1.1;
    const x = price => 105 + (price - domain.low) / (domain.high - domain.low) * 465;
    const y = value => 28 + value / low * 152;
    current.ranges.forEach((range, index) => {
      $('width-gap-' + range.id).setAttribute('d', samples.map((sample, i) => (i ? 'L' : 'M') + x(sample.futurePrice) + ' ' + y(sample.ranges[index].difference)).join(' '));
      $('width-gap-dot-' + range.id).setAttribute('cx', x(current.futurePrice));
      $('width-gap-dot-' + range.id).setAttribute('cy', y(range.difference));
    });
    $('width-gap-min').textContent = compactUSD(low);
    $('width-gap-low').textContent = compactUSD(domain.low); $('width-gap-high').textContent = compactUSD(domain.high);
    $('width-gap-title').textContent = 'At ETH ' + usd(current.futurePrice) + ', principal minus holding: A ' + signedUSD(current.ranges[0].difference)
      + '; B ' + signedUSD(current.ranges[1].difference) + '. Each point is a separate hypothetical endpoint before fees.';
  }
  function render({ persist = false, updateDomain = true } = {}) {
    const input = read(); validateFields(input);
    $('width-share-result').hidden = true;
    try {
      current = calculateWidthComparison(input);
      if (!domain || updateDomain) domain = widthPriceDomain(input);
      $('width-error').textContent = ''; $('width-results').hidden = false;
      $('width-share').disabled = false;
      $('width-setup-label').textContent = usd(current.investment) + ' each · ETH ' + usd(current.initialPrice);
      $('width-starting-tokens').textContent = 'Both start with ' + assetAmounts(current.initial) + '.';
      $('width-current').textContent = 'ETH ' + usd(current.futurePrice) + ' · ' + percent((current.futurePrice / current.initialPrice - 1) * 100) + ' from the start';
      const slider = $('width-price-slider');
      slider.value = 1000 * (current.futurePrice - domain.low) / (domain.high - domain.low);
      slider.setAttribute('aria-valuetext', $('width-current').textContent);
      const shortcuts = { start: current.initialPrice };
      for (const range of current.ranges) {
        shortcuts[range.id + '-lower'] = range.lowerPrice; shortcuts[range.id + '-upper'] = range.upperPrice;
        const refs = references.get(range.id), labels = rangePriceLabels(range.lowerPrice, range.upperPrice);
        refs.bounds.textContent = labels.lower + ' – ' + labels.upper;
        refs.state.textContent = STATE_COPY[range.state].title;
        const share = Math.min(100, Math.max(0, range.finalEthPercent));
        refs.ethBar.style.width = share + '%';
        refs.mix.setAttribute('aria-label', 'Current principal value: ' + fmt(share, 1) + '% ETH and ' + fmt(100 - share, 1) + '% USDC');
        refs.eth.textContent = formatTokenQuantity(range.pooled.eth, 5) + ' ETH';
        refs.usdc.textContent = formatTokenQuantity(range.pooled.usdc, 2, 2) + ' USDC';
        refs.principal.textContent = usd(range.lpValue);
        refs.change.textContent = signedUSD(range.lpValue - current.investment);
        refs.fees.textContent = usd(range.breakEvenFees);
        refs.feeNote.textContent = fmt(100 * range.breakEvenFees / current.investment, 2) + '% of starting capital';
      }
      for (const button of $('width-price-shortcuts').children) {
        button.dataset.price = shortcuts[button.dataset.widthPrice];
        button.setAttribute('aria-pressed', String(current.futurePrice === shortcuts[button.dataset.widthPrice]));
      }
      $('width-holding').textContent = 'Holding the shared starting tokens: ' + usd(current.holdValue) + '. Both LP results below exclude fees.';
      const [a, b] = current.ranges;
      const gap = Math.abs(a.breakEvenFees - b.breakEvenFees);
      $('width-takeaway').textContent = current.widthA === current.widthB
        ? 'The widths are equal, so the two positions have the same tokens and outcome.'
        : current.futurePrice === current.initialPrice
          ? 'Both begin with the same value. Move the price to see how width changes their token balances.'
          : 'Range ' + (a.width < b.width ? 'A' : 'B') + ' is narrower and exchanges its starting tokens over a smaller price span. '
            + (gap < .005 ? 'Their fee targets are less than half a cent apart at this price.'
              : 'It needs ' + usd(gap) + ' more fees to match holding at this price.');
      renderBands(); renderGapChart();
      if (persist) {
        const savedOK = saveWidthDraft(current);
        saved.inputs = input; saved.status = savedOK ? 'saved' : 'unavailable';
        $('width-save-status').textContent = savedOK ? 'Comparison kept in this browser. Share the link to reopen it elsewhere.' : 'This browser could not save the comparison. Use the share link to keep it.';
        $('width-notice').textContent = '';
        if (isWidthHash(location.hash)) {
          const hash = widthHash(current);
          history.replaceState(null, '', location.pathname + location.search + hash);
          saveExperimentLocation(WIDTH_MODEL, hash);
        }
      }
    } catch (error) {
      current = null; $('width-error').textContent = error.message;
      $('width-results').hidden = true; $('width-share').disabled = true;
      $('width-starting-tokens').textContent = 'Correct the highlighted inputs to compare the positions.';
      if (['width-capital', 'width-start'].some(id => $(id).getAttribute('aria-invalid') === 'true')) $('width-setup').open = true;
    }
  }
  $('width-form').addEventListener('submit', event => event.preventDefault());
  for (const id of Object.values(fields)) $(id).addEventListener('input', () => render({ persist: true }));
  $('width-price-slider').addEventListener('input', () => {
    $('width-price').value = domain.low + Number($('width-price-slider').value) / 1000 * (domain.high - domain.low);
    render({ persist: true, updateDomain: false });
  });
  $('width-price-shortcuts').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) { $('width-price').value = button.dataset.price; render({ persist: true, updateDomain: false }); }
  });
  $('width-chart-details').addEventListener('toggle', renderGapChart);
  $('width-reset').addEventListener('click', () => { fill(DEFAULT_WIDTHS); render({ persist: true }); });
  $('width-share').addEventListener('click', async () => {
    if (!current) return;
    const url = new URL(location.pathname, location.origin); url.hash = widthHash(current);
    $('width-share-url').value = url.href; $('width-share-result').hidden = false;
    try { await navigator.clipboard.writeText(url.href); $('width-share-status').textContent = 'Comparison link copied.'; }
    catch { $('width-share-status').textContent = 'Copy this link to keep both widths and the shared assumptions.'; $('width-share-url').focus(); $('width-share-url').select(); }
  });
  function restore() {
    if (!isWidthHash(location.hash)) return;
    try {
      const shared = widthsFromHash(location.hash);
      fill(shared || current || saved.inputs || DEFAULT_WIDTHS); render();
      $('width-notice').textContent = shared ? 'Shared hypothetical comparison loaded.'
        : saved.status === 'invalid' ? 'The previous local comparison could not be read. Showing the default setup; editing it will replace that local copy.'
          : saved.status === 'unavailable' ? 'Local storage is unavailable. You can still explore and share a link.' : '';
    } catch (error) {
      fill(DEFAULT_WIDTHS); render(); $('width-notice').textContent = error.message + ' Showing the default setup.';
    }
  }
  makeCards(); fill(saved.inputs || DEFAULT_WIDTHS); render();
  window.addEventListener('hashchange', restore); restore();
}
