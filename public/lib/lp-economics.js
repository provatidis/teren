import { formatTokenQuantity as fmt, usd } from './format.js';

const numericKeys = {
  feeAPR: 'fee-apr', feeDays: 'fee-days', openingCost: 'opening-cost',
  collectionCost: 'collection-cost', closingCost: 'closing-cost',
};
export const economicsFields = prefix => Object.fromEntries(Object.entries(numericKeys).map(([key, suffix]) => [key, `${prefix}-${suffix}`]));
export const optionalEconomics = Object.keys(numericKeys);

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
const svgNode = tag => document.createElementNS('http://www.w3.org/2000/svg', tag);

export function initEconomics(prefix) {
  const $ = suffix => document.getElementById(`${prefix}-${suffix}`);
  const cash = $('cash-field'), apr = $('fee-apr-field');
  apr.before(cash);
  const mode = $('fee-mode');
  function sync() {
    const useAPR = mode.value === 'apr';
    cash.hidden = useAPR; apr.hidden = !useAPR;
    $('fee-days').required = useAPR;
    // A hidden, inactive draft must not trap the user behind an invisible error.
    const inactive = $(useAPR ? 'fees' : 'fee-apr');
    if (!inactive.validity.valid) inactive.value = '0';
  }
  mode.addEventListener('change', sync);
  const element = $('economics');
  const heading = node('h3', 'Where the result comes from');
  const basis = node('p', '', 'fine-print'); basis.id = prefix + '-fee-basis';
  const list = node('dl', undefined, 'lp-flow');
  const rows = ['LP tokens at the future price', '+ Assumed fees', '− LP costs', 'LP after fees & costs', 'Hold the starting tokens'].map((label, index) => {
    const row = node('div', undefined, 'lp-flow-row lp-flow-' + index);
    const term = node('dt', label), amount = node('dd');
    const bar = svgNode('svg'); bar.setAttribute('viewBox', '0 0 400 18');
    bar.setAttribute('preserveAspectRatio', 'none'); bar.setAttribute('aria-hidden', 'true');
    const zero = svgNode('line'); zero.setAttribute('y1', '0'); zero.setAttribute('y2', '18');
    const rect = svgNode('rect'); rect.setAttribute('y', '3'); rect.setAttribute('height', '12'); rect.setAttribute('rx', '2');
    bar.append(zero, rect); row.append(term, amount, bar); list.append(row);
    return { amount, rect, zero };
  });
  element.append(heading, basis, list);
  function update(result) {
    const { lpBeforeFees, feeIncome, costs, lpGrossValue, lpValue, holdValue } = result;
    const starts = [0, lpBeforeFees, lpValue, 0, 0];
    const ends = [lpBeforeFees, lpGrossValue, lpGrossValue, lpValue, holdValue];
    const amounts = [lpBeforeFees, feeIncome, costs, lpValue, holdValue];
    const low = Math.min(0, lpValue), high = Math.max(lpGrossValue, holdValue, 1);
    const x = value => (value - low) / (high - low) * 400;
    rows.forEach(({ amount, rect, zero }, index) => {
      amount.textContent = usd(amounts[index]);
      rect.setAttribute('x', Math.min(x(starts[index]), x(ends[index])));
      rect.setAttribute('width', Math.abs(x(ends[index]) - x(starts[index])));
      zero.setAttribute('x1', x(0)); zero.setAttribute('x2', x(0));
    });
    basis.textContent = result.feeMode === 'apr'
      ? `${fmt(result.feeAPR, 4)}% assumed average APR × ${fmt(result.feeDays, 2)} / 365 days × ${usd(result.investment)} starting capital.`
      : `Assumed cash fees${result.feeDays ? ' over ' + fmt(result.feeDays, 2) + ' days' : '; no duration set'}. Costs are additional to holding.`;
    $('break-even-apr').textContent = result.breakEvenAPR === null
      ? 'Add a duration to see the required average APR.'
      : `${fmt(result.breakEvenAPR, 2)}% average fee APR over ${fmt(result.feeDays, 2)} days to cover the gap and costs.`;
  }
  sync();
  return { sync, update, mode };
}
