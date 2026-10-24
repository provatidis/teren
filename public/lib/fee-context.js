import { feeTarget, recordedFeeContext, FEE_WINDOWS } from './fee-context-state.js';
import { createAppliedRecordLoader } from '../data/applied-records.js';
import { REPLAY_CASES } from '../data/replay-cases.js';
import { periodDuration } from './period-presentation.js';
import { fmt, usd } from './format.js';

const loadRecord = createAppliedRecordLoader();
function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
}
const date = seconds => new Date(seconds * 1000).toISOString().slice(0, 16).replace('T', ' ');

export function createFeeContext(prefix) {
  const element = node('details', undefined, 'fee-context'); element.id = prefix + '-fee-context';
  const summary = node('summary');
  const headline = node('span', '', 'fee-context-headline');
  summary.append(node('strong', 'Could fees cover this?'), ' ', headline);
  const body = node('div', undefined, 'fee-context-body');
  const target = node('p', '', 'fee-context-target'); target.id = prefix + '-fee-target';
  const label = node('label', 'Suppose this price change takes'); label.htmlFor = prefix + '-fee-window';
  const select = node('select'); select.id = label.htmlFor;
  for (const days of FEE_WINDOWS) {
    const option = node('option', days + (days === 1 ? ' day' : ' days')); option.value = days;
    select.append(option);
  }
  select.value = '30';
  const window = node('div', undefined, 'fee-context-window'); window.append(label, ' ', select);
  const daily = node('p', '', 'fee-context-daily'); daily.id = prefix + '-fee-daily'; daily.setAttribute('aria-live', 'polite');
  const assumption = node('p'); assumption.id = prefix + '-fee-assumption';
  body.append(target, window, daily, assumption,
    node('p', 'Changing the time window changes the required pace, not the fee estimate. This comparison has no trading history and excludes gas and other costs.'));
  const records = node('details', undefined, 'fee-context-records');
  records.append(node('summary', 'What did two recorded positions earn?'));
  const content = node('div');
  const status = node('p', 'Open to load the recorded examples.'); status.setAttribute('role', 'status');
  const retry = node('button', 'Try loading again', 'button secondary'); retry.type = 'button'; retry.hidden = true;
  records.append(node('p', 'These are two short observations, not typical returns. Both are Ethereum Uniswap v3 WETH/USDC 0.3% positions, with different ranges and dates. They do not estimate fees for your setup.'), status, content, retry);
  let loading = false, loaded = false;
  async function showRecords() {
    if (loading || loaded) return;
    loading = true; retry.hidden = true; status.textContent = 'Loading recorded fee accounting…';
    try {
      const periods = await Promise.all(REPLAY_CASES.map(record => loadRecord(record.id)));
      const cards = periods.map((period, index) => {
        const r = recordedFeeContext(period), record = REPLAY_CASES[index];
        const card = node('article', undefined, 'fee-context-record');
        card.append(node('strong', record.title, 'fee-context-record-title'),
          node('p', usd(r.fees) + ' in new fees on ' + usd(r.capital) + ' starting principal.', 'fee-context-earned'),
          node('p', fmt(r.percent, 4) + '% of starting capital over ' + periodDuration(r.duration) + '.'),
          node('p', 'ETH range: ' + usd(r.range.lowerPrice) + '–' + usd(r.range.upperPrice) + '. Active for ' + fmt(r.activePercent, 1) + '% of the period.'),
          node('p', date(r.start) + ' → ' + date(r.end) + ' UTC.', 'fee-context-provenance'),
          node('p', 'Accounting checked at capture · ' + r.capturedAt.slice(0, 10) + '.', 'fee-context-provenance'));
        const link = node('a', 'Inspect this recorded case →'); link.href = './' + record.hash;
        card.append(link); return card;
      });
      content.replaceChildren(...cards);
      status.textContent = 'New fee tokens are valued at the final recorded price, with USDC = $1. Earlier owed tokens are excluded. The browser checks the files; it does not re-read the chain.';
      loaded = true;
    } catch {
      status.textContent = 'The recorded examples could not load. Your hypothetical comparison still works.';
      retry.hidden = false;
    } finally { loading = false; }
  }
  records.addEventListener('toggle', () => { if (records.open) showRecords(); });
  retry.addEventListener('click', showRecords);
  const next = node('p', 'To judge a fee assumption, look at swaps and competing liquidity in the same pool, range and period. Time in range gives the position a chance to earn; it does not tell you how much.');
  const source = node('a', 'How Uniswap allocates fees →');
  source.href = 'https://developers.uniswap.org/docs/liquidity/overview';
  body.append(records, next, source); element.append(summary, body);
  let current;
  function update(result) {
    current = result;
    const r = feeTarget(current, Number(select.value));
    headline.textContent = fmt(r.percent, r.percent > 0 && r.percent < .01 ? 4 : 2) + '% of starting capital needed';
    target.textContent = r.total === 0
      ? 'At these endpoint prices, the model needs no fees to match holding before costs.'
      : usd(r.total) + ' in total cash fees would match holding at your chosen final price.';
    daily.textContent = r.total === 0 ? 'No fee hurdle at this endpoint. Costs can still put the LP behind holding.'
      : 'Over ' + r.days + (r.days === 1 ? ' day' : ' days') + ', that requires an average of ' + usd(r.daily) + ' per day. Required, not predicted.';
    assumption.textContent = 'You have assumed ' + usd(r.assumed) + ' in total fees. '
      + (r.remaining > 0 ? (r.remaining < .01 ? 'Less than $0.01 more' : 'Another ' + usd(r.remaining)) + ' would be needed to match holding.' : r.total === 0 ? 'The model already matches holding before fees and costs.' : 'That covers the model’s fee target, but entering it does not establish that it could be earned.');
  }
  select.addEventListener('change', () => update(current));
  return { element, update };
}
