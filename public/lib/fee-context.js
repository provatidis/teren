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
    node('p', 'More time lowers the daily hurdle. Actual fees still depend on swaps and competing liquidity.', 'fee-context-takeaway'));
  const records = node('details', undefined, 'fee-context-records');
  records.append(node('summary', 'What did two recorded positions earn?'));
  const content = node('div');
  const status = node('p', 'Open to load the recorded examples.'); status.setAttribute('role', 'status');
  const retry = node('button', 'Try loading again', 'button secondary'); retry.type = 'button'; retry.hidden = true;
  const method = node('details', undefined, 'fee-context-method');
  method.append(node('summary', 'How to read these records'),
    node('p', 'These are new fee tokens earned during each period. Earlier owed tokens are excluded; fees have not been compounded or reduced by gas costs.'),
    node('p', 'Accounting was checked at capture. The browser checks the files; it does not re-read the chain. Open Inspect for the providers, checkpoints and verification evidence.'));
  method.hidden = true;
  records.append(node('p', 'Ethereum · Uniswap v3 · WETH/USDC 0.3%', 'fee-context-provenance'),
    node('p', 'Two short observations with different ranges and dates. These are not typical returns or forecasts for this setup.'),
    node('p', 'Fee tokens valued at the final recorded price · USDC = $1.', 'fee-context-provenance'), status, content, retry, method);
  let loading = false, loaded = false;
  async function showRecords() {
    if (loading || loaded) return;
    loading = true; retry.hidden = true; status.textContent = 'Loading recorded fee accounting…';
    try {
      const periods = await Promise.all(REPLAY_CASES.map(record => loadRecord(record.id)));
      const cards = periods.map((period, index) => {
        const r = recordedFeeContext(period), record = REPLAY_CASES[index];
        const card = node('article', undefined, 'fee-context-record');
        const flow = node('dl', undefined, 'fee-record-flow');
        for (const [label, value, detail] of [
          ['Starting capital', usd(r.capital), 'Position principal'],
          ['Recorded time', periodDuration(r.duration), fmt(r.activePercent, 1) + '% in range'],
          ['New fees earned', usd(r.fees), fmt(r.percent, 4) + '% of starting capital'],
        ]) {
          const step = node('div');
          step.append(node('dt', label), node('dd', value), node('dd', detail, 'fee-record-detail'));
          flow.append(step);
        }
        const evidence = node('details', undefined, 'fee-context-method');
        evidence.append(node('summary', 'Period and capture details'),
          node('p', date(r.start) + ' → ' + date(r.end) + ' UTC.'),
          node('p', 'Accounting checked at capture · ' + r.capturedAt.slice(0, 10) + '.'));
        card.append(node('strong', record.title, 'fee-context-record-title'), flow,
          node('p', 'ETH range: ' + usd(r.range.lowerPrice) + '–' + usd(r.range.upperPrice) + '.'), evidence);
        const link = node('a', 'Inspect this recorded case →'); link.href = 'liquidity.html' + record.hash;
        card.append(link); return card;
      });
      content.replaceChildren(...cards);
      status.textContent = '';
      method.hidden = false;
      loaded = true;
    } catch {
      status.textContent = 'The recorded examples could not load. Your hypothetical comparison still works.';
      retry.hidden = false;
    } finally { loading = false; }
  }
  records.addEventListener('toggle', () => { if (records.open) showRecords(); });
  retry.addEventListener('click', showRecords);
  const next = node('p', 'For a useful comparison, match the pool, range and period. Time in range alone does not establish fee income.');
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
      : usd(r.total) + ' in total cash fees would match holding at your chosen final price, before gas and other costs.';
    daily.textContent = r.total === 0 ? 'No fee hurdle at this endpoint. Costs can still put the LP behind holding.'
      : 'Over ' + r.days + (r.days === 1 ? ' day' : ' days') + ', that requires an average of ' + usd(r.daily) + ' per day. Required, not predicted.';
    const gap = r.remaining < .01 ? 'Less than $0.01' : usd(r.remaining);
    assumption.textContent = 'Assumed fees: ' + usd(r.assumed) + '. '
      + (r.remaining > 0 ? 'Gap still to cover: ' + gap + '.'
        : r.total === 0 ? 'No fee hurdle at this endpoint.'
          : 'Covers the model’s fee target; earning it is still untested.');
  }
  select.addEventListener('change', () => update(current));
  return { element, update };
}
