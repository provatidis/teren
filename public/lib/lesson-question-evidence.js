import { sceneNode as node } from './lesson-scene.js';
import { usd } from './format.js';

export function appendQuestionComparison(container, comparison) {
  const figure = node('figure', undefined, 'learn-evidence-comparison');
  figure.append(node('figcaption', comparison.caption));
  const maximum = Math.max(0, ...comparison.rows.map(row => row.value));
  for (const item of comparison.rows) {
    const row = node('div', undefined, 'learn-evidence-row');
    const label = node('div', undefined, 'learn-evidence-label');
    label.append(node('span', item.label), ' ', node('strong', usd(item.value)));
    const track = node('div', undefined, 'learn-evidence-track');
    track.setAttribute('aria-hidden', 'true');
    const fill = node('span');
    fill.style.width = maximum > 0 ? Math.max(0, item.value) / maximum * 100 + '%' : '0%';
    track.append(fill);
    row.append(label, track);
    if (item.detail) row.append(node('p', item.detail, 'learn-evidence-detail'));
    figure.append(row);
  }
  figure.append(node('p', 'Both bars start at $0 and use the same scale.', 'learn-evidence-detail'));
  container.append(figure);
}

function appendPriceMargin(container, margin) {
  const figure = node('figure', undefined, 'learn-price-margin');
  figure.append(node('figcaption', margin.label));
  const labels = node('div', undefined, 'learn-evidence-label');
  labels.append(node('span', 'Liquidation boundary: ' + usd(margin.boundaryPrice)),
    ' ', node('strong', 'Starting price: ' + usd(margin.startPrice)));
  const track = node('div', undefined, 'learn-price-track');
  track.setAttribute('aria-hidden', 'true');
  const boundary = Math.min(100, Math.max(0, margin.boundaryPrice / margin.startPrice * 100));
  track.style.setProperty('--price-boundary', boundary + '%');
  track.append(node('span', undefined, 'learn-price-room'), node('span', undefined, 'learn-price-boundary'));
  const axis = node('div', undefined, 'learn-price-axis');
  axis.setAttribute('aria-hidden', 'true');
  axis.append(node('span', '$0'), node('span', usd(margin.startPrice)));
  figure.append(labels, track, axis,
    node('p', 'The shaded strip is the price room left above the boundary.', 'learn-evidence-detail'));
  container.append(figure);
}

// These are facts for the adjacent question, independent of an explored frame.
export function renderQuestionEvidence(container, evidence) {
  container.replaceChildren();
  container.hidden = !evidence;
  container.removeAttribute('aria-labelledby');
  if (!evidence) return;
  const title = node('h4', evidence.title);
  title.id = container.id + '-title';
  container.setAttribute('aria-labelledby', title.id);
  const facts = node('dl', undefined, 'learn-question-facts');
  for (const [index, [label, value]] of (evidence.rows || []).entries()) {
    const fact = node('div'), amount = node('dd', value);
    amount.id = container.id + '-value-' + index;
    fact.append(node('dt', label), ' ', amount);
    facts.append(fact);
  }
  container.append(title);
  if (facts.childElementCount) container.append(facts);
  if (evidence.comparison) appendQuestionComparison(container, evidence.comparison);
  if (evidence.priceMargin) appendPriceMargin(container, evidence.priceMargin);
  if (evidence.note) container.append(node('p', evidence.note, 'learn-question-note'));
  if (evidence.explore) {
    const link = node('a', evidence.explore.text, 'learn-explore');
    link.href = evidence.explore.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    container.append(link);
  }
}
