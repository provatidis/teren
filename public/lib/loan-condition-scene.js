import { sceneNode as node, createSceneExplorer } from './lesson-scene.js';
import { loanConditionFrame } from './loan-condition-state.js';
import { healthLabel, loanStatus } from './lending-presentation.js';
import { fmt, usd } from './format.js';

function comparisonFigure(input) {
  const element = node('figure', undefined, 'condition-figure');
  element.append(node('figcaption', 'Backing compared with debt', 'scene-figure-title'));
  const rows = {};
  for (const [id, label] of [['backing', 'Backing counted · ' + fmt(input.threshold, 0) + '%'], ['debt', 'Debt owed']]) {
    const row = node('div', undefined, 'condition-row'); row.dataset.balance = id;
    const heading = node('div', undefined, 'condition-heading');
    const value = node('strong'); value.id = 'condition-' + id;
    heading.append(node('span', label), ' ', value);
    const track = node('div', undefined, 'condition-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span', undefined, 'condition-fill');
    const marker = node('span', undefined, 'condition-reference');
    track.append(fill, marker);
    const detail = node('p', '', 'condition-detail'); detail.id = 'condition-' + id + '-detail';
    row.append(heading, '\n', track, '\n', detail); element.append('\n', row);
    rows[id] = { value, fill, marker, detail };
  }
  const health = node('div', undefined, 'condition-health');
  const value = node('strong'); value.id = 'condition-health';
  health.append(node('span', 'Health factor'), ' ', value);
  const status = node('p', '', 'condition-status'); status.id = 'condition-status';
  const key = node('p', '', 'condition-key'); key.id = 'condition-key';
  element.append('\n', health, '\n', status, '\n', key);
  return { element, show(frame) {
    const { result, reference } = frame;
    for (const [id, amount] of [['backing', frame.backing], ['debt', result.end.debt]]) {
      rows[id].value.textContent = usd(amount);
      rows[id].fill.style.width = amount / frame.maxValue * 100 + '%';
      rows[id].marker.style.left = reference[id] / frame.maxValue * 100 + '%';
    }
    rows.backing.detail.textContent = fmt(result.end.collateralTokens, 0) + ' ETH worth ' + usd(result.end.collateralValue);
    rows.debt.detail.textContent = 'Interest added: ' + usd(result.borrowInterest);
    value.textContent = healthLabel(result.end.healthFactor);
    status.textContent = loanStatus(result.end) + '. Balances before any liquidation.';
    element.dataset.state = result.end.status;
    key.textContent = 'Equal bars = health factor 1. Dashed marks = comparison start.';
  } };
}

// The single active slider changes either elapsed time or the later price.
// Mode changes start a fresh comparison. Nothing here can persist a draft.
export function createLoanConditionScene(input, prediction) {
  const initial = loanConditionFrame(input, 'time', 0);
  const element = node('div', undefined, 'lesson-scene condition-scene');
  const figure = comparisonFigure(input);
  const copy = node('p', '', 'scene-consequence'); copy.id = 'condition-copy';
  const modes = node('div', undefined, 'condition-modes'); modes.setAttribute('role', 'group');
  modes.setAttribute('aria-label', 'Change one condition');
  const buttons = {};
  for (const [mode, label] of [['time', 'Time'], ['price', 'ETH price']]) {
    const button = node('button', label, 'scene-shortcut'); button.type = 'button';
    button.id = 'condition-mode-' + mode; button.addEventListener('click', () => select(mode));
    modes.append(button); buttons[mode] = button;
  }
  function show(mode, value) {
    const frame = loanConditionFrame(input, mode, value);
    figure.show(frame);
    element.dataset.mode = mode;
    const direction = value < input.start ? 'less' : value > input.start ? 'more' : 'the same';
    copy.textContent = mode === 'time'
      ? value === 0 ? 'The loan has just started. No interest has been added yet.'
        : 'Debt grows while the supplied ETH and its price stay unchanged. The health factor falls.'
      : value === input.start ? 'This is the one-year result again. Move the price to compare the same token balances.'
        : 'The same ETH is worth ' + direction + '. Debt stays unchanged, so the health factor ' + (value < input.start ? 'falls.' : 'rises.');
    return 'Health factor ' + healthLabel(frame.result.end.healthFactor) + '. ' + loanStatus(frame.result.end) + '.';
  }
  const time = createSceneExplorer({
    id: 'condition-time', min: 0, max: input.days, step: 1, start: 0, target: input.days,
    labelText: 'Time · ETH at ' + usd(input.start),
    format: days => days === input.days ? 'One year' : fmt(days, 0) + ' days',
    valueText: days => fmt(days, 0) + ' days; ETH price held at ' + usd(input.start),
    shortcuts: [{ label: 'Start', value: 0 }, { label: 'One year · question', value: input.days }],
    scopeText: days => days === input.days
      ? 'Showing the question: one year at the same ETH price.'
      : 'Exploring elapsed time. The question and Experiment link use one full year.',
    onChange: value => show('time', value),
  });
  const price = createSceneExplorer({
    id: 'condition-price', min: input.start / 2, max: input.start * 1.5, step: input.start / 400,
    start: input.start, target: input.start, format: usd,
    labelText: 'ETH · after one year', valueText: value => usd(value) + ' per ETH after one year',
    shortcuts: [{ label: 'Unchanged', value: input.start }, { label: 'Boundary · ' + usd(initial.questionBoundary), value: initial.questionBoundary }],
    scopeText: () => 'Time is fixed at one year. The question and Experiment link keep ETH at ' + usd(input.start) + '.',
    onChange: value => show('price', value),
  });
  let selectedMode;
  function select(mode) {
    if (mode === selectedMode) return;
    selectedMode = mode;
    for (const [name, button] of Object.entries(buttons)) button.setAttribute('aria-pressed', String(mode === name));
    time.element.hidden = mode !== 'time'; price.element.hidden = mode !== 'price';
    if (mode === 'time') time.show(0);
    else price.show(input.start);
  }
  element.append(prediction, '\n', figure.element, '\n', modes, '\n', time.element, '\n', price.element,
  '\n', copy, '\n', node('p', 'Wallet cash stays at ' + fmt(input.borrow, 0) + ' USDC; interest adds to debt. USDC = $1. Rates and the ' + fmt(input.threshold, 0) + '% liquidation threshold are fixed teaching assumptions. Each price is a separate comparison, not a history of this loan.', 'fine-print'));
  select('time');
  return { element, showQuestion() { select('time'); time.show(input.days); } };
}
