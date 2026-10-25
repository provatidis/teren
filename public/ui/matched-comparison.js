import { validateMatchedComparison } from '../data/matched-comparison.js';
import { COMPARISON_MAX_BYTES } from '../data/collection-history.js';
import { collectionDayView, collectionDayInterval, matchedChartSeries } from '../lib/matched-comparison.js';
import { positionScenario } from '../data/position-snapshot.js';
import { usd, signedUSD } from '../lib/format.js';
import { periodDuration } from '../lib/period-presentation.js';
import { formatUnits } from '../models/units.js';
import { downloadBlob } from '../lib/download.js';

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const signedUnits = (raw, decimals) => (BigInt(raw) < 0n ? '−' : '') + formatUnits(BigInt(raw) < 0n ? -BigInt(raw) : BigInt(raw), decimals);
const tokens = (a, b) => signedUnits(a, 6) + ' USDC + ' + signedUnits(b, 18) + ' WETH';
const percent = value => (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toFixed(3) + '%';

export function initMatchedComparison({ rangeLab }) {
  const $ = id => document.getElementById(id);
  let comparison, day = 7, revision = 0;
  const cards = new Map();
  const mobileRows = new Map();
  function render() {
    const series = matchedChartSeries(comparison);
    const selected = series[0].points[day];
    $('comparison-day').value = String(day);
    const time = new Date(selected.point.snapshot.block.timestamp * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
    $('comparison-current').textContent = (day ? 'Day ' + day : 'Start') + ' · ' + time + ' · ETH ' + usd(selected.price);
    $('comparison-day').setAttribute('aria-valuetext', $('comparison-current').textContent);
    for (const button of $('comparison-days').children) button.setAttribute('aria-pressed', String(Number(button.dataset.day) === day));
    const values = series.flatMap(item => item.points.map(view => view.feePercent));
    const low = Math.min(0, ...values), high = Math.max(.0001, ...values);
    const min = low - (high - low) * .08, max = high + (high - low) * .12;
    const x = index => 110 + index / 7 * 430, y = value => 184 - (value - min) / (max - min) * 152;
    $('comparison-zero').setAttribute('d', 'M110 ' + y(0) + ' H540');
    $('comparison-y-max').textContent = high.toFixed(3) + '%';
    $('comparison-y-zero').setAttribute('y', y(0) + 4);
    for (const [index, { group, points }] of series.entries()) {
      const record = comparison.records[index].record, view = points[day], card = cards.get(group);
      $('comparison-line-' + group).setAttribute('d', points.map((point, index) => (index ? 'L' : 'M') + x(index) + ' ' + y(point.feePercent)).join(' '));
      const dot = $('comparison-dot-' + group);
      dot.setAttribute('cx', x(day)); dot.setAttribute('cy', y(view.feePercent));
      card.fees.textContent = percent(view.feePercent);
      card.feeDollars.textContent = usd(view.feesUSD) + ' in new fee tokens';
      card.gap.textContent = percent(view.gapPercent);
      card.gapDollars.textContent = signedUSD(view.gapUSD) + ' versus its starting tokens';
      card.change.textContent = percent(view.changePercent);
      card.changeDollars.textContent = signedUSD(view.lpChangeUSD) + ' from ' + usd(view.startingUSD);
      for (const [key, value, detail] of [['fees', view.feePercent, usd(view.feesUSD)],
        ['gap', view.gapPercent, signedUSD(view.gapUSD)], ['change', view.changePercent, signedUSD(view.lpChangeUSD)]]) {
        const cell = mobileRows.get(key)[index];
        cell.value.textContent = percent(value); cell.detail.textContent = detail;
      }
      card.takeaway.textContent = !day ? 'Both comparisons begin with this position’s principal tokens.'
        : (view.feesUSD > 0 ? 'Fees added value. ' : 'No positive net fee income. ')
          + (view.gapUSD < -.005 ? 'The LP still trails holding. ' : view.gapUSD > .005 ? 'The LP is ahead of holding. ' : 'The LP approximately matches holding. ')
          + (view.lpChangeUSD < -.005 ? 'Its dollar value fell.' : view.lpChangeUSD > .005 ? 'Its dollar value rose.' : 'Its dollar value is approximately unchanged.');
      card.active.textContent = day ? periodDuration(view.secondsInRange) + ' in range out of ' + periodDuration(view.durationSeconds)
        : 'In range at the starting checkpoint';
      card.collected.textContent = view.collectionCount + (view.collectionCount === 1 ? ' fee collection' : ' fee collections') + ' so far; liquidity unchanged.';
      card.feeTokens.textContent = tokens(view.earned0, view.earned1);
      card.withdrawn.textContent = tokens(...view.collectedRaw);
      card.startClaims.textContent = tokens(...record.points[0].simulatedCollect);
      card.remaining.textContent = tokens(...view.point.simulatedCollect);
      card.dust.textContent = tokens(...view.collectionRoundingLossRaw);
      card.principal.textContent = tokens(view.principal.amount0, view.principal.amount1);
      card.lp.textContent = usd(view.lpUSD); card.holding.textContent = usd(view.holdingUSD);
      card.block.textContent = 'Block ' + view.point.snapshot.block.number + ' ↗';
      card.block.href = 'https://etherscan.io/block/' + view.point.snapshot.block.number;
      for (const button of card.timeline.children) button.setAttribute('aria-pressed', String(Number(button.dataset.day) === day));
    }
    $('comparison-chart').setAttribute('aria-label', 'New fees as a percentage of each position’s starting capital. Selected day ' + day
      + ': A, narrower, ' + percent(series[0].points[day].feePercent) + '; B, wider, ' + percent(series[1].points[day].feePercent) + '.');
  }
  function selectDay(next) { day = next; render(); }
  function buildCards() {
    const summary = node('table', undefined, 'matched-mobile-summary');
    summary.append(node('caption', 'At the selected checkpoint'));
    const head = node('thead'), heading = node('tr');
    for (const label of ['Outcome', 'A · Narrower', 'B · Wider']) {
      const th = node('th', label); th.scope = 'col'; heading.append(th);
    }
    head.append(heading); summary.append(head);
    const body = node('tbody');
    for (const [key, label] of [['fees', 'New fees'], ['gap', 'Versus holding'], ['change', 'From the start']]) {
      const row = node('tr'), name = node('th', label); name.scope = 'row'; row.append(name);
      const refs = [0, 1].map(() => {
        const cell = node('td'), value = node('strong'), detail = node('span');
        cell.append(value, detail); row.append(cell); return { value, detail };
      });
      mobileRows.set(key, refs); body.append(row);
    }
    summary.append(body); $('comparison-mobile-summary').replaceChildren(summary);
    const elements = comparison.records.map(({ group, record }, index) => {
      const start = collectionDayView(record, 0), refs = {};
      const card = node('article', undefined, 'matched-card'); card.dataset.group = group;
      card.append(node('h3', (index ? 'B · Wider range' : 'A · Narrower range')),
        node('p', usd(start.range.lowerPrice) + ' – ' + usd(start.range.upperPrice), 'matched-range'),
        node('p', 'Position #' + start.point.snapshot.tokenId + ' · starting capital ' + usd(start.startingUSD), 'fine-print'));
      const ethPercent = Number(start.holding.amount1) / 1e18 * start.price / start.startingUSD * 100;
      const mixBar = node('div', undefined, 'matched-mix');
      mixBar.setAttribute('role', 'img');
      mixBar.setAttribute('aria-label', 'Starting value: ' + ethPercent.toFixed(1) + '% WETH and ' + (100 - ethPercent).toFixed(1) + '% USDC');
      const eth = node('span', undefined, 'matched-mix-eth'); eth.style.width = ethPercent + '%';
      mixBar.append(eth, node('span', undefined, 'matched-mix-usdc'));
      const legend = node('p', undefined, 'matched-mix-legend');
      for (const [token, share, css] of [['WETH', ethPercent, 'eth'], ['USDC', 100 - ethPercent, 'usdc']]) {
        const label = node('span'), swatch = node('span', undefined, 'allocation-swatch allocation-swatch-' + css);
        swatch.setAttribute('aria-hidden', 'true'); label.append(swatch, ' ' + token + ' ' + share.toFixed(1) + '%'); legend.append(label);
      }
      card.append(node('p', 'Starting mix by value', 'fine-print'), mixBar, legend);
      const metrics = node('dl', undefined, 'matched-metrics');
      for (const [label, key, detail] of [['New fees earned', 'fees', 'feeDollars'], ['Compared with holding', 'gap', 'gapDollars'], ['Change from the start', 'change', 'changeDollars']]) {
        const row = node('div'); refs[key] = node('dd', '', 'matched-value'); refs[detail] = node('dd', '', 'fine-print');
        row.append(node('dt', label), refs[key], refs[detail]); metrics.append(row);
      }
      refs.takeaway = node('p', '', 'matched-takeaway'); refs.takeaway.setAttribute('data-comparison-outcome', group);
      refs.active = node('p', '', 'fine-print'); refs.collected = node('p', '', 'fine-print');
      refs.timeline = node('div', undefined, 'matched-active-days'); refs.timeline.setAttribute('role', 'group'); refs.timeline.setAttribute('aria-label', group + ' range, daily active time');
      for (let interval = 1; interval <= 7; interval++) {
        const daily = collectionDayInterval(record, interval);
        const button = node('button'); button.type = 'button'; button.dataset.day = String(interval);
        button.setAttribute('aria-label', 'Show day ' + interval + ', ' + daily.activePercent.toFixed(1) + '% time in range');
        const bar = node('span', undefined, 'matched-active-track'), fill = node('span');
        fill.style.height = daily.activePercent + '%'; bar.append(fill); bar.setAttribute('aria-hidden', 'true');
        button.append(bar, node('span', 'D' + interval), node('span', daily.activePercent.toFixed(0) + '%'));
        button.addEventListener('click', () => selectDay(interval)); refs.timeline.append(button);
      }
      const mix = node('p', 'Starting mix: ' + tokens(start.holding.amount0, start.holding.amount1), 'fine-print');
      const details = node('details', undefined, 'model-details period-details'); details.append(node('summary', 'Tokens, collections and evidence'));
      const ledger = node('dl');
      for (const [label, key] of [['Current principal', 'principal'], ['LP principal + new fees', 'lp'], ['Holding starting principal', 'holding'], ['New fee tokens, net of collection rounding', 'feeTokens'], ['Withdrawn during this window · may include older claims', 'withdrawn'], ['Collectable at start · excluded', 'startClaims'], ['Still collectable at selected block', 'remaining'], ['Manager debit minus actual pool payment', 'dust']]) {
        refs[key] = node('dd'); ledger.append(node('dt', label), refs[key]);
      }
      refs.block = node('a'); refs.block.target = '_blank'; refs.block.rel = 'noopener noreferrer';
      details.append(mix, ledger, refs.block,
        node('p', 'New fees = withdrawn tokens + still collectable − collectable at the start. The pool receipt checks actual payments. Collection rounding is retained.', 'fine-print'));
      const apply = node('button', 'Explore this range in Experiment →', 'button secondary'); apply.type = 'button'; apply.dataset.applyComparison = group;
      apply.addEventListener('click', () => {
        const view = collectionDayView(record, day), snapshot = view.point.snapshot;
        rangeLab.setScenario(positionScenario(snapshot), 'Position #' + snapshot.tokenId + ' · Ethereum block ' + snapshot.block.number
          + '. New principal-only experiment with zero assumed future fees.', { kind: 'position', snapshot });
      });
      card.append(node('p', 'Percentages use this position’s starting capital.', 'fine-print'), metrics, refs.takeaway,
        node('h4', 'Time in range each day'), refs.timeline, refs.active, refs.collected, details, apply);
      cards.set(group, refs); return card;
    });
    $('comparison-cards').replaceChildren(...elements);
  }
  async function load() {
    const current = ++revision;
    $('comparison-status').textContent = 'Opening both recorded positions…'; $('comparison-retry').hidden = true;
    $('comparison-result').hidden = true; $('comparison-export').disabled = true;
    try {
      if (!comparison) {
        const response = await fetch(new URL('../examples/uniswap-v3-matched-week.json', import.meta.url));
        if (!response.ok) throw new Error('The matched comparison could not be opened.');
        const body = await response.text();
        if (body.length > COMPARISON_MAX_BYTES) throw new Error('Comparison evidence exceeds the supported size.');
        const parsed = validateMatchedComparison(JSON.parse(body));
        if (current !== revision) return;
        comparison = parsed;
      }
      if (current !== revision) return;
      buildCards(); render();
      $('comparison-status').textContent = '12–19 October 2026 · eight daily checkpoints · checked at capture on ' + comparison.capturedAt.slice(0, 10) + '.';
      $('comparison-providers').textContent = [...new Set(comparison.records.flatMap(({ record }) => [record.points[0].snapshot.provider, record.receiptProvider, ...record.eventQueries.map(query => query.provider)]))].join(' · ');
      $('comparison-result').hidden = false; $('comparison-export').disabled = false;
      requestAnimationFrame(() => { if (current === revision && location.hash === '#fee-comparison') $('fee-comparison').scrollIntoView({ block: 'start', behavior: 'instant' }); });
    } catch (error) {
      if (current !== revision) return;
      $('comparison-status').textContent = error.message; $('comparison-retry').hidden = false;
    }
  }
  for (let value = 0; value <= 7; value++) {
    const button = node('button', value ? 'Day ' + value : 'Start', 'button secondary'); button.type = 'button'; button.dataset.day = String(value);
    button.addEventListener('click', () => selectDay(value)); $('comparison-days').append(button);
  }
  $('comparison-day').addEventListener('input', () => selectDay(Number($('comparison-day').value)));
  $('comparison-retry').addEventListener('click', load);
  $('comparison-export').addEventListener('click', () => {
    if (comparison) downloadBlob(new Blob([JSON.stringify(comparison, null, 2) + '\n'], { type: 'application/json' }), 'teren-matched-week-2026-10-12.json');
  });
  function restore() {
    const active = location.hash === '#fee-comparison';
    $('fee-comparison').hidden = !active; $('historical-case').hidden = active;
    if (active) load(); else revision++;
  }
  window.addEventListener('hashchange', restore); restore();
}
