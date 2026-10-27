import { createFeeContext } from './fee-context.js';
import { comparisonSceneState } from './comparison-scene-state.js';
import { createComparisonBars } from './comparison-bars.js';
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
  const feeContext = withFees ? createFeeContext('comparison') : null;
  const withPrice = id !== 'fee-break-even';
  let price = id === 'loss-vs-profit' ? input.initialPrice : input.futurePrice;
  let fees = id === 'final-challenge' ? input.fees : 0;
  const element = sceneNode('div', undefined, 'lesson-scene comparison-scene');
  element.append(prediction, '\n');
  const bars = createComparisonBars(input, { withFees });
  const figure = bars.figure;
  const verdict = sceneNode('div', undefined, 'comparison-verdict');
  const profit = sceneNode('p'); profit.id = 'comparison-profit';
  const holding = sceneNode('p'); holding.id = 'comparison-holding';
  verdict.append(profit, '\n', holding);
  const basket = sceneNode('p', '', 'scene-key');
  const scope = sceneNode('p', '', 'scene-question-scope'); scope.id = 'comparison-scope';

  function draw() {
    const state = comparisonSceneState(input, price, fees), r = state.result;
    feeContext?.update(r);
    bars.draw(state);
    const subject = withFees ? 'LP + fees' : 'LP';
    profit.textContent = subject + (state.versusStart === 'equal' ? ' matches the starting capital.'
      : ' is ' + usd(Math.abs(state.fromStart)) + ' ' + state.versusStart + ' the starting capital.');
    holding.textContent = subject + (state.versusHolding === 'equal' ? ' matches holding.'
      : ' is ' + usd(Math.abs(r.difference)) + ' ' + state.versusHolding + ' holding.');
    basket.textContent = 'Both start with ' + fmt(r.held.eth, 4) + ' ETH + ' + fmt(r.held.usdc, 2) + ' USDC. All bars use the same fixed dollar scale.';
    scope.textContent = (price === input.futurePrice && fees === input.fees ? 'Showing the prediction setup. ' : 'Exploring another setup. ')
      + 'Prediction: ETH at ' + usd(input.futurePrice) + (withFees ? ' and ' + usd(input.fees) + ' assumed fees.' : ', before fees.');
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
  element.append(verdict, '\n', scope, '\n', basket, '\n', sceneNode('p', withFees
    ? 'Fees here are hypothetical cash added to the LP, after any protocol share. Matching holding is a target, not a forecast. Gas and other costs are excluded.'
    : 'Each price is a separate hypothetical outcome. Dollar profit and performance against holding answer different questions.', 'scene-essential-note'));
  if (feeContext) element.append(feeContext.element);
  for (const control of element.querySelectorAll('input[type=range]')) control.setAttribute('aria-describedby', scope.id);
  priceControl?.show(price); feeControl?.show(fees); draw();
  return { element, showQuestion() {
    price = input.futurePrice; fees = input.fees;
    priceControl?.show(price); feeControl?.show(fees); draw();
  } };
}
