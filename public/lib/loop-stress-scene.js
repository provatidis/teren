import { sceneNode as node, createSceneExplorer } from './lesson-scene.js';
import { loopStressFrame, LOOP_STRESS_TIME } from './loop-stress-state.js';
import { healthLabel, loanStatus } from './lending-presentation.js';
import { fmt, usd } from './format.js';

const changeText = value => value === 0 ? 'No change' : (value < 0 ? 'Loss: ' : 'Gain: ') + usd(Math.abs(value));

function stressFigure() {
  const element = node('figure', undefined, 'stress-figure');
  element.append(node('figcaption', 'Gain or loss from the start', 'scene-figure-title'),
    node('p', 'Totals are after debt, before any liquidation.', 'stress-before'));
  const rows = {};
  for (const [id, label] of [['holding', 'Hold'], ['loop', 'Loop']]) {
    const row = node('div', undefined, 'stress-row'); row.dataset.strategy = id;
    const heading = node('div', undefined, 'stress-heading');
    const name = node('span'), value = node('strong'); value.id = 'stress-' + id + '-value';
    heading.append(name, ' ', value);
    const track = node('div', undefined, 'stress-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span', undefined, 'stress-fill'), zero = node('span', undefined, 'stress-zero');
    track.append(fill, zero);
    const change = node('p', '', 'stress-change'); change.id = 'stress-' + id + '-change';
    row.append(heading, '\n', track, '\n', change); element.append('\n', row);
    rows[id] = { label, name, value, fill, change };
  }
  const key = node('p', undefined, 'stress-key');
  key.append(node('span', '← Loss'), node('span', 'No change'), node('span', 'Gain →'));
  key.setAttribute('aria-label', 'Bars show change from the same starting capital: loss to the left, gain to the right.');
  const loan = node('div', undefined, 'stress-loan');
  const debt = node('strong'); debt.id = 'stress-debt';
  const health = node('strong'); health.id = 'stress-health';
  for (const [label, value] of [['Loop debt · USDC', debt], ['Loop health factor', health]]) {
    const field = node('div'); field.append(node('span', label), '\n', value); loan.append(field);
  }
  const status = node('p', '', 'stress-status'); status.id = 'stress-status';
  const boundary = node('p', '', 'stress-boundary'); boundary.id = 'stress-boundary';
  element.append('\n', key, '\n', loan, '\n', status, '\n', boundary);
  return { element, show(frame) {
    for (const [id, row] of Object.entries(rows)) {
      const position = frame[id];
      row.name.textContent = row.label + ' · ' + fmt(position.tokens, id === 'holding' ? 0 : 3) + ' ETH';
      row.value.textContent = usd(position.value);
      const width = Math.abs(position.change) / frame.maxChange * 50;
      row.fill.style.width = width + '%';
      row.fill.style.left = (position.change < 0 ? 50 - width : 50) + '%';
      row.change.textContent = changeText(position.change);
    }
    debt.textContent = fmt(frame.result.end.debt);
    health.textContent = healthLabel(frame.result.end.healthFactor);
    status.textContent = loanStatus(frame.result.end) + '.';
    boundary.textContent = 'ETH liquidation price: ' + usd(frame.result.end.boundaryPrice);
    element.dataset.state = frame.result.end.status;
  } };
}

export function createLoopStressScene(input, prediction) {
  const initial = loopStressFrame(input, 'price', input.start);
  const element = node('div', undefined, 'lesson-scene stress-scene');
  const figure = stressFigure();
  const assumptions = node('p', '', 'stress-assumptions'); assumptions.id = 'stress-assumptions';
  const interest = node('p', '', 'stress-interest'); interest.id = 'stress-interest';
  const copy = node('p', '', 'scene-consequence'); copy.id = 'stress-copy';
  const modes = node('div', undefined, 'stress-modes'); modes.setAttribute('role', 'group');
  modes.setAttribute('aria-label', 'Change one condition');
  const buttons = {};
  for (const [mode, label] of [['price', 'ETH price'], ['time', 'Time']]) {
    const button = node('button', label, 'scene-shortcut'); button.type = 'button';
    button.id = 'stress-mode-' + mode; button.addEventListener('click', () => select(mode));
    modes.append(button); buttons[mode] = button;
  }
  function show(mode, value) {
    const frame = loopStressFrame(input, mode, value);
    figure.show(frame); element.dataset.mode = mode;
    assumptions.textContent = mode === 'price' ? 'Price example: no interest or swap costs.'
      : 'Time example: 0% supply APR; 10% borrow APR, continuously compounded. ETH stays at ' + usd(input.start) + '.';
    interest.hidden = mode !== 'time';
    interest.textContent = 'Interest added to the loop: ' + fmt(frame.result.supplyInterestTokens, 3) + ' ETH supplied; ' +
      fmt(frame.result.borrowInterest) + ' USDC debt. Holding earns no supply interest.';
    copy.textContent = mode === 'price'
      ? value === input.start ? 'Both still have the same value after debt. The loop holds more ETH, paid for with borrowed USDC.'
        : value < input.start ? 'The loop loses more value because more ETH is exposed to the fall. Its USDC debt stays unchanged.'
          : 'The loop gains more value because more ETH is exposed to the rise. Its USDC debt stays unchanged.'
      : value === 0 ? 'Start again at the original price. No interest has accrued yet.'
        : 'Only debt grows in this example. The loop’s value after debt and its health factor both fall, even though ETH’s price stays still.';
    return 'Holding: ' + changeText(frame.holding.change) + '. Loop: ' + changeText(frame.loop.change) +
      '. Loop health factor ' + healthLabel(frame.result.end.healthFactor) + '. ' + loanStatus(frame.result.end) + '.';
  }
  const price = createSceneExplorer({
    id: 'stress-price', min: input.start / 2, max: input.start * 1.5, step: input.start / 400,
    start: input.start, target: input.future, labelText: 'ETH price', format: usd,
    valueText: value => usd(value) + ' per ETH; no interest',
    shortcuts: [
      { label: 'Start', value: input.start }, { label: 'Question · ' + usd(input.future), value: input.future },
      { label: 'Price rises · ' + usd(input.start * 1.5), value: input.start * 1.5 },
      { label: 'Boundary', value: initial.result.end.boundaryPrice },
    ],
    scopeText: value => value === input.future ? 'Showing the question: ETH at ' + usd(input.future) + ', with no interest.'
      : 'Exploring another price. The question and Experiment link keep ETH at ' + usd(input.future) + ', with no interest.',
    onChange: value => show('price', value),
  });
  const time = createSceneExplorer({
    id: 'stress-time', min: 0, max: LOOP_STRESS_TIME.days, step: 1, start: 0, target: 0,
    labelText: 'Time · fixed price', format: days => days === 365 ? 'One year' : fmt(days, 0) + ' days',
    valueText: days => fmt(days, 0) + ' days at the original ETH price',
    shortcuts: [{ label: 'Start', value: 0 }, { label: 'One year', value: LOOP_STRESS_TIME.days }],
    scopeText: () => 'A separate interest example. The question and Experiment link keep the original price-fall setup.',
    onChange: value => show('time', value),
  });
  let selected;
  function select(mode) {
    if (mode === selected) return;
    selected = mode;
    for (const [name, button] of Object.entries(buttons)) button.setAttribute('aria-pressed', String(name === mode));
    price.element.hidden = mode !== 'price'; time.element.hidden = mode !== 'time';
    if (mode === 'price') price.show(input.start);
    else time.show(0);
  }
  element.append(prediction, '\n', figure.element, '\n', assumptions, '\n', modes,
  '\n', price.element, '\n', time.element, '\n', interest, '\n', copy,
  '\n', node('p', 'Balances are before any liquidation. Each selection is a separate endpoint, not a price history. USDC = $1; the liquidation threshold stays at ' + fmt(input.threshold, 0) + '%. Holding has no debt or loan liquidation boundary.', 'fine-print'));
  select('price');
  return { element, showQuestion() { select('price'); price.show(input.future); } };
}
