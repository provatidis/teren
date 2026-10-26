import { formatTokenQuantity, fmt } from './format.js';
import { healthLabel } from './lending-presentation.js';

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const amount = (value, unit, signed = false) => {
  const sign = signed ? value > 0 ? '+' : value < 0 ? '−' : '' : value < 0 ? '−' : '';
  const digits = Math.abs(value) > 0 && Math.abs(value) < .0001 ? 6 : 4;
  return sign + formatTokenQuantity(Math.abs(value), digits) + ' ' + unit;
};

function metric(list, label, value, field) {
  const row = node('div'), term = node('dt', label), number = node('dd', value);
  number.dataset.comparisonField = field;
  row.append(term, number); list.append(row);
  return number;
}

function differenceBar(value, extent, kind) {
  const track = node('div', undefined, 'lst-comparison-bar');
  track.setAttribute('aria-hidden', 'true');
  const bar = node('span', undefined, 'lst-comparison-bar-fill');
  const width = Math.abs(value) / extent * 50;
  bar.style.width = width + '%';
  bar.style.left = (value < 0 ? 50 - width : 50) + '%';
  track.dataset.kind = kind;
  track.append(bar);
  return track;
}

function boundaryMessage(outcome) {
  if (outcome.firstRateBoundary !== null) {
    return 'Rate-only boundary reached around day ' + fmt(outcome.firstRateBoundary, 1)
      + '. Later values assume no liquidation.';
  }
  return outcome.headroom.status === 'boundary'
    ? 'At the liquidation boundary. These values assume no liquidation.'
    : 'Below the liquidation boundary. These values assume no liquidation.';
}

function exitMessage(outcome) {
  if (outcome.exit.status === 'boundary') return 'The boundary was reached. A liquidation would change these balances.';
  if (outcome.exit.status === 'shortfall') return 'The assumed sale cannot cover repayment and costs.';
  return 'Execution is unavailable under the selected assumptions. Collateral and debt remain.';
}

function resultCard(kind, target, outcome, extent) {
  const card = node('article', undefined, 'lst-comparison-card');
  card.dataset.lstComparison = kind;
  card.dataset.state = 'ready';
  card.dataset.counterfactual = String(outcome.counterfactual);
  card.dataset.exitStatus = outcome.exit.status;
  const heading = node('h3', (kind === 'primary' ? 'Your setup' : 'Reference') + ' · ' + formatTokenQuantity(target, 6) + '×');
  heading.id = 'lst-comparison-' + kind + '-heading';
  card.setAttribute('aria-labelledby', heading.id);
  card.append(heading);
  if (outcome.counterfactual) {
    const warning = node('p', boundaryMessage(outcome), 'lst-comparison-warning');
    warning.dataset.comparisonField = 'earlier-boundary';
    card.append(warning);
  }
  const result = node('dl', undefined, 'lst-comparison-return');
  metric(result, 'Compared with holding · before exit costs', amount(outcome.vsHolding, 'WETH', true), 'before-exit');
  card.append(result, differenceBar(outcome.vsHolding, extent, kind));
  const risk = node('dl', undefined, 'lst-comparison-risk');
  metric(risk, 'Health factor', healthLabel(outcome.healthFactor), 'health');
  const headroom = outcome.headroom.oraclePriceDropPercent;
  metric(risk, 'Oracle-price headroom', headroom === null ? 'No debt'
    : headroom > 0 && headroom < .01 ? '<0.01%' : fmt(headroom, 2) + '%', 'headroom');
  card.append(risk);
  const exit = node('section', undefined, 'lst-comparison-exit');
  const retained = outcome.exit.unit === 'wstETH';
  const exitHeading = node('h4', retained ? 'Keep unsold wstETH' : 'Sell all to WETH');
  exit.append(exitHeading);
  const facts = node('dl', undefined, 'lst-comparison-exit-facts');
  const complete = outcome.exit.status === 'complete';
  metric(facts, retained ? 'Tokens kept after repayment and costs' : 'Proceeds after repayment and costs',
    complete ? amount(outcome.exit.value, outcome.exit.unit) : 'Exit not run', 'exit-value');
  metric(facts, retained ? 'Versus keeping the original wstETH' : 'Versus selling the original holding',
    complete && outcome.exit.difference !== null ? amount(outcome.exit.difference, outcome.exit.unit, true) : 'Unavailable', 'exit-difference');
  exit.append(facts);
  if (!complete) exit.append(node('p', exitMessage(outcome), 'lst-comparison-exit-note'));
  else if (outcome.exit.holding === null) exit.append(node('p', 'The holding sale cannot cover its assumed costs, so that comparison is unavailable.', 'lst-comparison-exit-note'));
  else exit.append(node('p', 'Holding: ' + amount(outcome.exit.holding, outcome.exit.unit)
    + (retained ? ', with no exit transaction.' : ', after the same swap and flat costs.'), 'lst-comparison-exit-note'));
  card.append(exit);
  return card;
}

export function createLSTComparisonView(container) {
  function clear() {
    container.replaceChildren();
    container.hidden = true;
  }
  function render(pair) {
    if (!pair || pair.status === 'none') { clear(); return; }
    const scope = node('p', 'Same starting tokens and conditions. Only the target changes.', 'lst-comparison-scope');
    scope.id = 'lst-comparison-scope';
    const cards = node('div', undefined, 'lst-comparison-cards');
    const extent = Math.max(Math.abs(pair.primaryOutcome.vsHolding), Math.abs(pair.referenceOutcome?.vsHolding ?? 0), .000001);
    cards.append(resultCard('primary', pair.primary.input.targetExposure, pair.primaryOutcome, extent));
    if (pair.referenceOutcome) cards.append(resultCard('reference', pair.comparison.targetExposure, pair.referenceOutcome, extent));
    else {
      const unavailable = node('article', undefined, 'lst-comparison-card');
      unavailable.dataset.lstComparison = 'reference';
      unavailable.dataset.state = 'unavailable';
      const heading = node('h3', 'Reference · ' + formatTokenQuantity(pair.comparison.targetExposure, 6) + '×');
      heading.id = 'lst-comparison-reference-heading';
      unavailable.setAttribute('aria-labelledby', heading.id);
      unavailable.append(heading);
      const explanation = node('p', pair.reason || 'Check the reference target to compare outcomes.', 'lst-comparison-warning');
      explanation.dataset.comparisonField = 'unavailable';
      unavailable.append(explanation);
      cards.append(unavailable);
    }
    const scale = node('p', 'Before-exit bars share one scale. The middle line is zero.', 'lst-comparison-note');
    const oracle = node('p', 'Headroom is an additional oracle-price fall at fixed balances. '
      + (pair.primaryOutcome.headroom.marketDiscountAffectsHealth
        ? 'The selected oracle also follows the market discount.'
        : 'The selected conversion-rate oracle ignores the market discount.'), 'lst-comparison-note');
    oracle.id = 'lst-comparison-headroom-note';
    container.replaceChildren(scope, cards, scale, oracle);
    container.hidden = false;
  }
  return { render, clear };
}
