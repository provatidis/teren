import { comparisonSceneState } from './comparison-scene-state.js';
import { createSceneExplorer, sceneNode } from './lesson-scene.js';
import { fmt, usd } from './format.js';

export function comparisonQuestion(id, input) {
  const price = 'At ' + usd(input.futurePrice) + ' per ETH';
  if (id === 'loss-vs-profit') return price + ', is the LP before fees worth at least the original ' + usd(input.investment) + '?';
  if (id === 'fee-break-even') return price + ', do ' + usd(input.fees) + ' in assumed fees cover the gap to holding?';
  return price + ' with ' + usd(input.fees) + ' in assumed fees, which has the higher final value?';
}

export function createComparisonScene(id, input, prediction) {
  const withFees = id !== 'loss-vs-profit';
  const withPrice = id !== 'fee-break-even';
  let price = id === 'loss-vs-profit' ? input.initialPrice : input.futurePrice;
  let fees = id === 'final-challenge' ? input.fees : 0;
  const element = sceneNode('div', undefined, 'lesson-scene comparison-scene');
  const figure = sceneNode('figure', undefined, 'comparison-figure');
  const title = sceneNode('figcaption', '', 'scene-figure-title'); title.id = 'comparison-title';
  const rows = {};
  for (const [key, label] of [['start', 'Starting capital'], ['hold', 'Holding starting tokens'], ['lp', withFees ? 'LP + assumed fees' : 'LP before fees']]) {
    const row = sceneNode('div', undefined, 'comparison-row'); row.dataset.comparison = key;
    const heading = sceneNode('div', undefined, 'comparison-heading');
    const value = sceneNode('strong'); value.id = 'comparison-' + key + '-value';
    heading.append(sceneNode('span', label), ' ', value);
    const track = sceneNode('div', undefined, 'comparison-track'); track.setAttribute('aria-hidden', 'true');
    const principal = sceneNode('span', undefined, 'comparison-principal');
    const fee = sceneNode('span', undefined, 'comparison-fees');
    track.append(principal, fee); row.append(heading, '\n', track);
    rows[key] = { row, value, principal, fee };
  }
  const parts = sceneNode('p', '', 'comparison-parts'); parts.id = 'comparison-parts'; parts.hidden = !withFees;
  const verdict = sceneNode('div', undefined, 'comparison-verdict');
  const profit = sceneNode('p'); profit.id = 'comparison-profit';
  const holding = sceneNode('p'); holding.id = 'comparison-holding';
  verdict.append(profit, '\n', holding);
  const basket = sceneNode('p', '', 'scene-key');
  const scope = sceneNode('p', '', 'scene-question-scope'); scope.id = 'comparison-scope';
  figure.append(title, '\n', rows.start.row, '\n', rows.hold.row, '\n', rows.lp.row, '\n', parts, '\n', verdict);

  function draw() {
    const state = comparisonSceneState(input, price, fees), r = state.result;
    title.textContent = 'Value at ' + usd(price) + ' per ETH';
    for (const [key, value] of [['start', input.investment], ['hold', r.holdValue], ['lp', r.lpValue]]) {
      const row = rows[key];
      row.value.textContent = usd(value);
      row.principal.style.width = (key === 'lp' ? r.lpBeforeFees : value) / state.ceiling * 100 + '%';
      row.fee.style.width = (key === 'lp' ? fees : 0) / state.ceiling * 100 + '%';
    }
    parts.textContent = 'Solid: ' + usd(r.lpBeforeFees) + ' principal · Striped: ' + usd(fees) + ' assumed fees';
    const subject = withFees ? 'LP + fees' : 'LP';
    profit.textContent = subject + (state.versusStart === 'equal' ? ' matches the starting capital.'
      : ' is ' + usd(Math.abs(state.fromStart)) + ' ' + state.versusStart + ' the starting capital.');
    holding.textContent = subject + (state.versusHolding === 'equal' ? ' matches holding.'
      : ' is ' + usd(Math.abs(r.difference)) + ' ' + state.versusHolding + ' holding.');
    basket.textContent = 'Both start with ' + fmt(r.held.eth, 4) + ' ETH + ' + fmt(r.held.usdc, 2) + ' USDC. All bars use the same fixed dollar scale.';
    scope.textContent = (price === input.futurePrice && fees === input.fees ? 'Showing the question setup. ' : 'Exploring another setup. ')
      + 'The checks use ETH at ' + usd(input.futurePrice) + (withFees ? ' and ' + usd(input.fees) + ' assumed fees.' : ', before fees.');
    if (match) match.textContent = 'Match holding · ' + usd(r.breakEvenFees) + ' fees';
    return profit.textContent + ' ' + holding.textContent;
  }

  let match, priceControl, feeControl;
  if (withPrice) {
    priceControl = createSceneExplorer({
      id: 'comparison-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
      step: input.initialPrice / 100, start: price, target: input.futurePrice, format: usd,
      labelText: 'Explore an ETH price', valueText: value => usd(value) + ' per ETH', scopeText: () => '',
      shortcuts: [{ label: 'Starting price', value: input.initialPrice }, { label: 'Question price', value: input.futurePrice }],
      onChange: value => { price = value; return draw(); },
    });
  }
  if (withFees) {
    feeControl = createSceneExplorer({
      id: 'comparison-fees', min: 0, max: input.investment / 2,
      // The exact break-even amount usually falls between whole-dollar steps.
      step: 'any', start: fees, target: input.fees, format: usd,
      labelText: 'Explore assumed total fees', scopeText: () => '',
      valueText: value => usd(value) + ' assumed cash fees',
      shortcuts: [{ label: 'No fees', value: 0 }, { label: 'Question fees', value: input.fees }],
      onChange: value => { fees = value; return draw(); },
    });
    match = sceneNode('button', '', 'scene-shortcut'); match.type = 'button'; match.id = 'comparison-match';
    match.addEventListener('click', () => feeControl.show(comparisonSceneState(input, price).result.breakEvenFees, true));
    feeControl.element.querySelector('.scene-shortcuts').append(' ', match);
  }
  // A visible, optional question precedes exploration. Keep the figure beside
  // its active control on phones; changing modes preserves both assumptions.
  element.append(prediction, '\n');
  if (priceControl && feeControl) {
    const modes = sceneNode('div', undefined, 'scene-shortcuts comparison-modes');
    modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', 'Choose what to explore');
    const buttons = [];
    for (const [label, control] of [['ETH price', priceControl], ['Assumed fees', feeControl]]) {
      const button = sceneNode('button', label, 'scene-shortcut'); button.type = 'button';
      button.setAttribute('aria-pressed', String(control === priceControl));
      button.addEventListener('click', () => {
        priceControl.element.hidden = control !== priceControl;
        feeControl.element.hidden = control !== feeControl;
        for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
      });
      buttons.push(button); modes.append(' ', button);
    }
    feeControl.element.hidden = true;
    element.append(modes, '\n');
  }
  element.append(figure, '\n');
  if (priceControl) element.append(priceControl.element, '\n');
  if (feeControl) element.append(feeControl.element, '\n');
  element.append(scope, '\n', basket, '\n', sceneNode('p', withFees
    ? 'Fees here are hypothetical cash added to the LP. Matching holding is a target, not a forecast. Gas and other costs are excluded.'
    : 'Each price is a separate hypothetical outcome. Dollar profit and performance against holding answer different questions.', 'scene-essential-note'));
  for (const control of element.querySelectorAll('input[type=range]')) control.setAttribute('aria-describedby', scope.id);
  priceControl?.show(price); feeControl?.show(fees); draw();
  return { element, showQuestion() {
    price = input.futurePrice; fees = input.fees;
    priceControl?.show(price); feeControl?.show(fees); draw();
  } };
}
