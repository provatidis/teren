import { createFeeContext } from './fee-context.js';
import { comparisonSceneState } from './comparison-scene-state.js';
import { createComparisonBars } from './comparison-bars.js';
import { createSceneExplorer, sceneNode } from './lesson-scene.js';
import { fmt, usd } from './format.js';

// Lesson 7's optional worked example: one fixed case with a price and a fee
// amount to explore. Lessons 4 and 5 and the challenge itself use the figure in
// benchmark-figure.js.
export function createComparisonScene(input) {
  const feeContext = createFeeContext('comparison');
  let price = input.futurePrice;
  let fees = input.fees;
  const element = sceneNode('div', undefined, 'lesson-scene comparison-scene');
  const bars = createComparisonBars(input);
  const figure = bars.figure;
  const verdict = sceneNode('div', undefined, 'comparison-verdict');
  const profit = sceneNode('p'); profit.id = 'comparison-profit';
  const holding = sceneNode('p'); holding.id = 'comparison-holding';
  verdict.append(profit, '\n', holding);
  const basket = sceneNode('p', '', 'scene-key');
  const scope = sceneNode('p', '', 'scene-question-scope'); scope.id = 'comparison-scope';

  function draw() {
    const state = comparisonSceneState(input, price, fees), r = state.result;
    feeContext.update(r);
    bars.draw(state);
    const subject = 'Your claim';
    profit.textContent = subject + (state.versusStart === 'equal' ? ' matches your start.'
      : ' is ' + usd(Math.abs(state.fromStart)) + ' ' + state.versusStart + ' your start.');
    holding.textContent = subject + (state.versusHolding === 'equal' ? ' matches holding.'
      : ' is ' + usd(Math.abs(r.difference)) + (r.difference < 0 ? ' behind' : ' ahead of') + ' holding.');
    basket.textContent = 'Both start with ' + fmt(r.held.eth, 4) + ' ETH + ' + fmt(r.held.usdc, 2) + ' USDC. All bars use the same fixed dollar scale.';
    const atExample = price === input.futurePrice && fees === input.fees;
    scope.textContent = atExample ? 'Showing the worked example.' : 'You changed the worked example. It began with ETH at ' + usd(input.futurePrice) + ' and ' + usd(input.fees) + ' in fees.';
    match.textContent = 'Match holding · ' + usd(r.breakEvenFees) + ' fees';
    return profit.textContent + ' ' + holding.textContent;
  }

  const priceControl = createSceneExplorer({
    id: 'comparison-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
    step: input.initialPrice / 100, start: price, target: input.futurePrice, format: usd,
    labelText: 'Explore an ETH price', valueText: value => usd(value) + ' per ETH', scopeText: () => '',
    shortcuts: [{ label: 'Starting price', value: input.initialPrice }, { label: 'Example price', value: input.futurePrice }],
    onChange: value => { price = value; return draw(); },
  });
  const feeControl = createSceneExplorer({
    id: 'comparison-fees', min: 0, max: input.investment / 2,
    // The exact break-even amount usually falls between whole-dollar steps.
    step: 'any', start: fees, target: input.fees, format: usd,
    labelText: 'Explore the fees', scopeText: () => '',
    valueText: value => usd(value) + ' in fees',
    shortcuts: [{ label: 'No fees', value: 0 }, { label: 'Example fees', value: input.fees }],
    onChange: value => { fees = value; return draw(); },
  });
  const match = sceneNode('button', '', 'scene-shortcut'); match.type = 'button'; match.id = 'comparison-match';
  match.addEventListener('click', () => feeControl.show(comparisonSceneState(input, price).result.breakEvenFees, true));
  feeControl.element.querySelector('.scene-shortcuts').append(' ', match);
  // Keep the figure beside its active control on phones; changing modes
  // preserves both the price and the fees.
  const modes = sceneNode('div', undefined, 'scene-shortcuts comparison-modes');
  modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', 'Choose what to explore');
  const buttons = [];
  for (const [label, control] of [['ETH price', priceControl], ['Fees', feeControl]]) {
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
  element.append(modes, '\n', figure, '\n', priceControl.element, '\n', feeControl.element, '\n');
  element.append(verdict, '\n', scope, '\n', basket, '\n', sceneNode('p',
    'Fees here are an amount you choose, added to your claim after any protocol share. Matching holding is a target, not a forecast. Gas and other costs are left out.', 'scene-essential-note'));
  element.append(feeContext.element);
  for (const control of element.querySelectorAll('input[type=range]')) control.setAttribute('aria-describedby', scope.id);
  priceControl.show(price); feeControl.show(fees); draw();
  return { element, showQuestion() {
    price = input.futurePrice; fees = input.fees;
    priceControl.show(price); feeControl.show(fees); draw();
  } };
}
