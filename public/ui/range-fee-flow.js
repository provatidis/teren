import { calculateFeeFlow, DEFAULT_FEE_FLOW, MAX_FEE_BATCHES, validateFeeFlow } from '../models/range-fee-flow-v2.js';
import { compactUSD, fmt, formatTokenQuantity, signedUSD, usd } from '../lib/format.js';

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const shareText = share => fmt(share * 100, share > 0 && share < .0001 ? 4 : 2) + '%';

export function initRangeFeeFlow({ rangeLab, onChange, onStartingPrice }) {
  const $ = id => document.getElementById(id);
  const fields = { volume: 'fee-flow-volume', competition: 'fee-flow-competition',
    feeTier: 'fee-flow-tier', protocolDivisor: 'fee-flow-protocol' };
  let state = validateFeeFlow(DEFAULT_FEE_FLOW), touched = false, comparison = null, result = null;
  let valid = true, shownMode = null;
  const quoteRefs = [], outcomeRefs = [];
  function nextInputs() {
    return { ...Object.fromEntries(Object.entries(fields).map(([key, id]) =>
      [key, $(id).value.trim() ? Number($(id).value) : NaN])),
      competitorWidth: $('fee-flow-full-range').checked ? null : Number($('fee-flow-other-width').value) };
  }
  function getState() {
    return touched ? validateFeeFlow({ ...state, ...nextInputs() }) : null;
  }
  function restore(input) {
    touched = Boolean(input); state = validateFeeFlow(input || DEFAULT_FEE_FLOW);
    for (const [key, id] of Object.entries(fields)) $(id).value = state[key];
    $('fee-flow-full-range').checked = state.competitorWidth === null;
    $('fee-flow-other-width').value = state.competitorWidth ?? DEFAULT_FEE_FLOW.competitorWidth;
    $('fee-flow-status').textContent = '';
  }
  function metric(list, label) {
    const row = node('div'), value = node('dd');
    row.append(node('dt', label), value); list.append(row); return value;
  }
  function makeCards() {
    for (const id of ['a', 'b']) {
      const card = node('article', undefined, 'fee-flow-column'); card.dataset.range = id;
      card.append(node('h4', 'Range ' + id.toUpperCase()));
      const status = node('p'), value = node('strong'), share = node('p');
      const split = node('div', undefined, 'fee-flow-split'); split.setAttribute('role', 'img');
      const portion = node('span'); split.append(portion);
      const others = node('p');
      card.append(status, value, share, split, others);
      $('fee-flow-quotes').append(card);
      quoteRefs.push({ status, value, share, split, portion, others });

      const outcome = node('article', undefined, 'fee-flow-column'); outcome.dataset.range = id;
      outcome.append(node('h4', 'Range ' + id.toUpperCase()));
      const tokens = node('p', undefined, 'width-token-key'), refs = {};
      for (const token of ['eth', 'usdc']) {
        const item = node('span'), swatch = node('i', undefined, 'allocation-swatch allocation-swatch-' + token);
        swatch.setAttribute('aria-hidden', 'true'); refs[token] = node('span');
        item.append(swatch, refs[token]); tokens.append(item);
      }
      const list = node('dl');
      refs.fee = metric(list, 'Fee tokens’ value now');
      refs.total = metric(list, 'Principal + kept fees');
      refs.gap = metric(list, 'Compared with holding');
      refs.change = metric(list, 'Change from the start');
      const apply = node('button', 'Open ' + id.toUpperCase() + ' with these fees →', 'button secondary');
      apply.type = 'button'; apply.dataset.feeApply = id;
      apply.addEventListener('click', () => {
        const range = result?.ranges.find(range => range.id === id);
        if (!valid || !range || range.feeValue > 1e9) return;
        rangeLab.setScenario({ ...range, fees: range.feeValue, fullRangeFees: 0 },
          'Hypothetical fee-flow batches · range ' + id.toUpperCase()
            + '. Retained fee tokens converted to fixed USD fees at this comparison price.', null, { navigate: false });
        location.hash = '#range-lab';
      });
      refs.apply = apply; outcome.append(tokens, list, apply);
      $('fee-flow-outcomes').append(outcome); outcomeRefs.push(refs);
    }
  }
  function renderLedger() {
    $('fee-flow-ledger-count').textContent = '(' + state.batches.length + ')';
    $('fee-flow-batches').replaceChildren(...result.batches.map((batch, index) => {
      const item = node('li');
      item.append(node('strong', 'Batch ' + (index + 1) + ' · ETH ' + usd(batch.price)),
        node('p', usd(batch.volume) + ' trading · ' + usd(batch.competition) + ' other starting capital · '
          + fmt(batch.feeTier / 10000, 2) + '% trader fee · protocol '
          + (batch.protocolDivisor ? '1/' + batch.protocolDivisor : 'none')),
        node('p', batch.competitorWidth === null ? 'Other LPs: full range.'
          : 'Other LPs: ' + fmt(batch.competitorWidth, 2) + '% width · '
            + usd(batch.competitors.bounds.lowerPrice) + '–' + usd(batch.competitors.bounds.upperPrice)
            + ' · ' + (batch.competitors.active ? 'active.' : 'outside their range.')));
      for (const range of batch.ranges) item.append(node('p', range.id.toUpperCase() + ': '
        + formatTokenQuantity(range.tokens.eth, 6) + ' ETH + '
        + formatTokenQuantity(range.tokens.usdc, 2, 2) + ' USDC · ' + shareText(range.share) + ' of LP fees'));
      return item;
    }));
  }
  function render() {
    if (shownMode !== state.enabled) {
      shownMode = state.enabled;
      $('compare-widths').classList.toggle('width-show-fees', state.enabled);
      $('width-title').textContent = state.enabled ? 'Follow the fees' : 'Two ranges, one starting basket';
      $('width-intro').textContent = state.enabled
        ? 'Split a hypothetical trading batch at one fixed price. Add it to keep the fees, then try another price.'
        : 'Start with the same 50/50 basket by value. Move the price and watch each range exchange ETH and USDC.';
      $('width-inputs').open = !state.enabled;
      const bands = $('width-bands').closest('figure'), controls = $('width-price-slider').parentElement;
      if (state.enabled) $('fee-flow-market').append(bands, controls);
      else {
        $('width-results').insertBefore(bands, $('width-principal-view'));
        $('width-results').insertBefore(controls, $('width-principal-view'));
      }
    }
    $('width-principal-view').hidden = state.enabled;
    $('width-fee-view').hidden = !state.enabled;
    $('width-balances-view').setAttribute('aria-pressed', String(!state.enabled));
    $('width-fees-view').setAttribute('aria-pressed', String(state.enabled));
    $('fee-flow-example').hidden = state.batches.length > 0;
    $('fee-flow-undo').disabled = $('fee-flow-clear').disabled = state.batches.length === 0;
    const next = nextInputs();
    for (const [key, min, max] of [['volume', 0, 1e9], ['competition', 1, 1e12]]) {
      const invalid = !Number.isFinite(next[key]) || next[key] < min || next[key] > max;
      $(fields[key]).setAttribute('aria-invalid', String(invalid));
      $(fields[key] + '-error').hidden = !invalid;
      $(fields[key] + '-error').textContent = invalid ? 'Enter a value from ' + usd(min) + ' to ' + usd(max) + '.' : '';
    }
    try {
      if (!comparison) throw new Error('Correct the shared starting setup to explore fees.');
      result = calculateFeeFlow(comparison, { ...state, ...next }); valid = true;
      state = { ...state, ...next };
      $('fee-flow-assumptions-summary').textContent = 'Trading ' + compactUSD(next.volume) + ' · other LPs ' + compactUSD(next.competition);
      const { quote, ranges } = result;
      const fullRange = next.competitorWidth === null;
      $('fee-flow-other-width').disabled = fullRange;
      $('fee-flow-width-value').textContent = fullRange ? 'Full range' : fmt(next.competitorWidth, 2) + '% total width';
      $('fee-flow-other-width').setAttribute('aria-valuetext', $('fee-flow-width-value').textContent);
      $('fee-flow-competitor-capital').textContent = compactUSD(next.competition) + ' of starting capital';
      $('fee-flow-competitor-capital').title = usd(next.competition);
      $('fee-flow-competitor-bounds').textContent = fullRange
        ? 'Other LPs are active at every price. Their full range extends beyond this chart.'
        : 'Other LPs: ' + usd(quote.competitors.bounds.lowerPrice) + '–' + usd(quote.competitors.bounds.upperPrice)
          + '. ' + (quote.competitors.edge ? 'Selected price is at their edge.'
            : quote.competitors.active ? 'They are active at the selected price.' : 'They are outside their range at the selected price.');
      $('fee-flow-error').textContent = quote.atEdge
        ? 'The selected price is on a range edge. Move slightly inside or outside before adding a batch.'
        : quote.unavailable ? 'At least one alternative has no active LPs. Widen a range or move the price before adding trading.' : '';
      $('fee-flow-rate-summary').textContent = fmt(next.feeTier / 10000, 2) + '% · protocol '
        + (next.protocolDivisor ? '1/' + next.protocolDivisor : 'none');
      $('fee-flow-quote').hidden = quote.atEdge;
      $('fee-flow-source').hidden = quote.unavailable;
      $('fee-flow-totals').hidden = false;
      $('fee-flow-add').disabled = quote.atEdge || quote.unavailable || next.volume === 0 || state.batches.length >= MAX_FEE_BATCHES;
      $('fee-flow-example').disabled = quote.atEdge || quote.unavailable || next.volume === 0;
      $('fee-flow-quote-price').textContent = 'Preview · new trading at ETH ' + usd(quote.price);
      for (const [id, amount] of [['fee-flow-gross', quote.traderFees], ['fee-flow-cut', quote.protocolFees], ['fee-flow-pot', quote.lpFees]]) {
        $(id).textContent = amount >= 1e4 ? compactUSD(amount) : usd(amount);
        $(id).setAttribute('aria-label', usd(amount));
        $(id).title = usd(amount);
      }
      quote.ranges.forEach((range, index) => {
        $('fee-flow-impact-' + range.id).textContent = quote.atEdge ? 'At an edge'
          : range.available ? shareText(range.share) : 'No active LPs';
        const refs = quoteRefs[index];
        refs.status.textContent = range.active ? 'Active at this price' : 'Outside this range';
        refs.value.textContent = range.available ? usd(range.value) : '—';
        refs.share.textContent = range.available ? 'Your range · ' + shareText(range.share) + ' of LP fees' : 'No active LPs in this alternative';
        refs.portion.style.width = range.share * 100 + '%';
        refs.split.hidden = !range.available;
        refs.split.setAttribute('aria-label', 'Your share ' + shareText(range.share)
          + '; other LPs ' + shareText(1 - range.share));
        refs.others.textContent = range.available ? 'Other LPs · ' + usd(range.others) : 'No trading allocated here';
      });
      const active = quote.ranges.filter(range => range.active);
      $('fee-flow-mechanism').textContent = quote.unavailable
        ? 'Trading needs active liquidity. This setup cannot allocate the batch in both alternatives.'
        : !quote.competitors.active
          ? 'The other LPs are outside their range. Each active alternative takes all LP fees in this simplified setup.'
        : active.length === 0
        ? 'Both ranges are outside. This batch’s LP fees go to the other active LPs.'
        : active.length === 1
          ? 'Only ' + active[0].id.toUpperCase() + ' is active here. The other range receives no new fees from this batch.'
          : comparison.widthA === comparison.widthB
            ? 'Equal ranges take equal shares from the same trading batch.'
            : 'Both are active. The narrower range provides more liquidity from the same capital, so it receives a larger share.';
      $('fee-flow-count').textContent = state.batches.length === 0
        ? 'No batches added yet. The preview above is not included in these totals.'
        : state.batches.length + ' of ' + MAX_FEE_BATCHES + ' batches · totals valued at ETH ' + usd(comparison.futurePrice)
          + '. Holding the starting basket: ' + usd(result.comparison.holdValue) + '.';
      ranges.forEach((range, index) => {
        const refs = outcomeRefs[index];
        refs.eth.textContent = formatTokenQuantity(range.feeTokens.eth, 6) + ' ETH fees';
        refs.usdc.textContent = formatTokenQuantity(range.feeTokens.usdc, 2, 2) + ' USDC fees';
        refs.fee.textContent = usd(range.feeValue); refs.total.textContent = usd(range.total);
        refs.gap.textContent = signedUSD(range.netVsHolding); refs.change.textContent = signedUSD(range.dollarChange);
        refs.apply.disabled = range.feeValue > 1e9;
        refs.apply.title = range.feeValue > 1e9 ? 'This fee value exceeds the range lab’s supported input.' : '';
      });
      renderLedger();
    } catch (error) {
      valid = false; result = null;
      $('fee-flow-error').textContent = error.message;
      $('fee-flow-assumptions').open = true;
      $('fee-flow-quote').hidden = $('fee-flow-totals').hidden = true;
      $('fee-flow-add').disabled = $('fee-flow-example').disabled = true;
      $('fee-flow-batches').replaceChildren();
      $('fee-flow-impact-a').textContent = $('fee-flow-impact-b').textContent = 'Check inputs';
    }
  }
  function change() { touched = true; $('fee-flow-status').textContent = ''; onChange(); }
  for (const id of Object.values(fields)) $(id).addEventListener(id.includes('tier') || id.includes('protocol') ? 'change' : 'input', change);
  $('fee-flow-other-width').addEventListener('input', change);
  $('fee-flow-full-range').addEventListener('change', change);
  $('fee-flow-start').addEventListener('click', onStartingPrice);
  for (const [id, enabled] of [['width-balances-view', false], ['width-fees-view', true]]) {
    $(id).addEventListener('click', () => { state.enabled = enabled; change(); });
  }
  function add(batches) {
    state.batches.push(...batches); change();
    $('fee-flow-status').textContent = batches.length + (batches.length === 1 ? ' batch added. ' : ' batches added. ')
      + 'Move the price to see what happens to the kept fee tokens.';
    $('fee-flow-totals').classList.remove('fee-flow-added');
    requestAnimationFrame(() => $('fee-flow-totals').classList.add('fee-flow-added'));
  }
  $('fee-flow-add').addEventListener('click', () => {
    if (!valid || !result || $('fee-flow-add').disabled) return;
    add([{ price: comparison.futurePrice, ...nextInputs() }]);
  });
  $('fee-flow-example').addEventListener('click', () => {
    if (!valid || !result || $('fee-flow-example').disabled || state.batches.length) return;
    add([comparison.initialPrice, comparison.futurePrice].map(price => ({ price, ...nextInputs() })));
    $('fee-flow-add').focus({ preventScroll: true });
  });
  $('fee-flow-undo').addEventListener('click', () => { state.batches.pop(); change(); });
  $('fee-flow-clear').addEventListener('click', () => { state.batches = []; change(); });
  makeCards();
  return { restore, getState, isValid: () => valid,
    getCompetitorWidth: () => state.enabled ? nextInputs().competitorWidth : undefined,
    update(input) { comparison = input; render(); } };
}
