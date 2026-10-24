import { sceneNode as node, createSceneExplorer } from './lesson-scene.js';
import { loanResponseFrame } from './loan-response-state.js';
import { healthLabel } from './lending-presentation.js';
import { fmt, usd } from './format.js';

function responseFigure(input) {
  const element = node('figure', undefined, 'response-figure');
  const table = node('table', undefined, 'response-table');
  table.append(node('caption', 'Two choices from the same loan', 'scene-figure-title'));
  const head = node('thead'), headings = node('tr');
  for (const [id, label, route] of [
    ['repay', 'Repay debt', 'USDC → debt'],
    ['add', 'Add collateral', 'USDC → ETH'],
  ]) {
    const heading = node('th'); heading.scope = 'col'; heading.id = 'response-' + id;
    heading.append(node('strong', label), '\n', node('span', route, 'response-route'));
    headings.append(heading);
  }
  head.append(headings); table.append(head);
  const cells = {};
  for (const [key, label] of [
    ['backing', 'Backing counted · ' + fmt(input.threshold, 0) + '%'],
    ['debt', 'Debt owed'], ['health', 'Health factor'], ['unused', 'Cash left from the extra budget'],
  ]) {
    const body = node('tbody'), labels = node('tr'), values = node('tr');
    const heading = node('th', label); heading.colSpan = 2; heading.scope = 'rowgroup';
    heading.id = 'response-' + key + '-label'; labels.append(heading);
    for (const method of ['repay', 'add']) {
      const cell = node('td'); cell.setAttribute('headers', 'response-' + method + ' ' + heading.id);
      const value = node('strong'); value.id = 'response-' + method + '-' + key;
      cell.append(value);
      let fill, marker, detail;
      if (key === 'backing' || key === 'debt') {
        const track = node('div', undefined, 'response-track'); track.setAttribute('aria-hidden', 'true');
        track.dataset.balance = key;
        fill = node('span', undefined, 'response-fill');
        marker = node('span', undefined, 'response-reference'); track.append(fill, marker);
        cell.append('\n', track);
      }
      if (key === 'backing') {
        detail = node('span', '', 'response-detail'); detail.id = 'response-' + method + '-eth';
        cell.append('\n', detail);
      }
      values.append(cell); cells[method + key] = { value, fill, marker, detail };
    }
    body.append(labels, values); table.append(body);
  }
  element.append(table, '\n', node('p', 'Same dollar scale. Dashed marks = before either response.', 'response-key'));
  return { element, show(frame) {
    for (const method of ['repay', 'add']) {
      const position = frame[method];
      for (const key of ['backing', 'debt', 'health', 'unused']) {
        const cell = cells[method + key];
        cell.value.textContent = key === 'health' ? healthLabel(position.healthFactor) : usd(position[key]);
        if (cell.fill) {
          cell.fill.style.width = position[key] / frame.maxValue * 100 + '%';
          cell.marker.style.left = frame.reference[key] / frame.maxValue * 100 + '%';
        }
        if (cell.detail) cell.detail.textContent = fmt(position.collateralTokens, 3) + ' ETH';
      }
    }
  } };
}

export function createLoanResponseScene(input, prediction) {
  const start = loanResponseFrame(input, 0);
  const element = node('div', undefined, 'lesson-scene response-scene');
  const figure = responseFigure(input);
  const copy = node('p', '', 'scene-consequence'); copy.id = 'response-copy';
  const explorer = createSceneExplorer({
    id: 'response-budget', min: 0, max: start.maxBudget, step: 50, start: 0, target: input.budget,
    labelText: 'Budget per choice', format: usd,
    valueText: value => usd(value) + ' of additional USDC for either response',
    shortcuts: [
      { label: 'No response', value: 0 },
      { label: 'Question · ' + usd(input.budget), value: input.budget },
      { label: 'Repay all · ' + usd(start.reference.debt), value: start.reference.debt },
    ],
    scopeText: value => value === input.budget
      ? 'Showing the question budget. Both choices start from the same loan.'
      : 'Exploring another budget. The question and Experiment link still use ' + usd(input.budget) + '.',
    onChange(value) {
      const frame = loanResponseFrame(input, value);
      figure.show(frame);
      copy.textContent = value === 0
        ? 'No extra money used yet. Both columns show the original loan.'
        : frame.repay.debt === 0
          ? 'Repayment clears the debt; the ' + fmt(input.collateral, 0) + ' ETH stays supplied. There is no loan to liquidate. Adding collateral keeps the debt and buys more ETH.'
          : 'Repayment shrinks the debt. Adding collateral grows the ETH supply and leaves the debt unchanged. Repayment gives the higher health factor here.';
      return 'Repay: health factor ' + healthLabel(frame.repay.healthFactor) +
        '. Add collateral: ' + healthLabel(frame.add.healthFactor) + '.';
    },
  });
  element.append(node('p', 'The loan has ' + fmt(input.collateral, 0) + ' ETH at ' + usd(input.future) + ' and ' +
    fmt(start.reference.debt, 0) + ' USDC debt. Starting health factor: ' + healthLabel(start.result.end.healthFactor) + '.', 'loan-scene-intro'),
  '\n', figure.element, '\n', prediction, '\n', explorer.element, '\n', copy,
  '\n', node('p', 'The extra budget is fresh USDC ($1 each), separate from the borrowed cash. Each column uses it once. ETH stays supplied in both. The price is fixed; execution is immediate, with no costs or liquidation.', 'fine-print'));
  explorer.show(0);
  return { element, showQuestion() { explorer.show(input.budget); } };
}
