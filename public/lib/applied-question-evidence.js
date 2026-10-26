import { sceneNode as node } from './lesson-scene.js';
import { usd, formatTokenQuantity } from './format.js';

// The question brings its evidence with it; the explorer remains independent.
export function renderAppliedQuestionEvidence(collection, price, question, application) {
  const visible = Boolean(question.contrast && application.exposure);
  for (const panel of [collection, price]) { panel.hidden = !visible; panel.replaceChildren(); }
  if (!visible) return;
  const heading = (id, text) => { const element = node('h4', text); element.id = id; return element; };
  const earlier = question.contrast, end = question.view, exposure = application.exposure;
  const pair = node('dl', undefined, 'applied-value-pair');
  for (const [key, label, value, detail] of [
    ['lp', 'LP, including earned fees', earlier.lpUSD, 'Principal ' + usd(earlier.principalUSD) + ' + fees ' + usd(earlier.feesUSD)],
    ['hold', 'Holding the starting tokens', earlier.holdingUSD, 'The original ETH and USDC'],
  ]) {
    const row = node('div'), amount = node('dd', usd(value));
    amount.id = 'applied-collection-' + key + '-value';
    row.append(node('dt', label), ' ', amount, ' ', node('dd', detail, 'applied-evidence-detail'));
    pair.append(row);
  }
  collection.append(heading('applied-collection-heading', 'Collecting the fees'),
    node('p', 'Earlier in the record · the LP trails holding by ' + usd(-earlier.gapUSD) + '.', 'applied-evidence-moment'), pair);

  const figure = node('figure', undefined, 'applied-eth-comparison');
  figure.append(node('figcaption', 'ETH held by each strategy'));
  for (const [key, label, amount, detail] of [
    ['lp', 'LP + earned fees', exposure.lpETH, 'Principal: USDC only. Earned fees: ETH + USDC.'],
    ['hold', 'Holding starting tokens', exposure.holdingETH, 'The original ETH + USDC.'],
  ]) {
    const row = node('div', undefined, 'applied-eth-row');
    const labelRow = node('div', undefined, 'applied-eth-label');
    const value = node('strong', formatTokenQuantity(amount, 6) + ' ETH');
    value.id = 'applied-price-' + key + '-eth';
    labelRow.append(node('span', label), ' ', value);
    const track = node('div', undefined, 'applied-eth-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span'); fill.style.width = amount / exposure.holdingETH * 100 + '%'; track.append(fill);
    row.append(labelRow, track, node('p', detail, 'applied-evidence-detail')); figure.append(row);
  }
  figure.append(node('p', 'Both ETH bars use the same scale. ETH here is WETH, its wrapped form.', 'applied-evidence-detail'));
  price.append(heading('applied-price-heading', 'If ETH keeps rising'),
    node('p', 'At the end of the record · above range · the LP leads by ' + usd(end.gapUSD) + ' before costs.', 'applied-evidence-moment'), figure);
}
