import { challengeSetup, checkLiquidityChallenge, matchChallengeHolding } from '../models/liquidity-challenge.js';
import { comparisonSceneState } from './comparison-scene-state.js';
import { createComparisonBars } from './comparison-bars.js';
import { createSceneExplorer, sceneNode as node } from './lesson-scene.js';
import { usd } from './format.js';

export function createLiquidityApplication(input, saved, onChange) {
  let current = challengeSetup(input, saved) || { price: input.initialPrice, fees: 0 };
  const element = node('section', undefined, 'lesson-scene learning-application-scene');
  element.setAttribute('aria-labelledby', 'liquidity-task-heading');
  const title = node('h4', 'Your challenge'); title.id = 'liquidity-task-heading';
  const scope = node('p', 'This task has its own controls. The worked example and its Experiment link stay as shown above.', 'scene-question-scope');
  const bars = createComparisonBars(input, { prefix: 'liquidity-task' });
  const finding = node('p', '', 'scene-consequence'); finding.id = 'liquidity-task-finding';
  const feedback = node('p', '', 'learn-answer-feedback'); feedback.id = 'liquidity-task-feedback';
  feedback.hidden = true; feedback.tabIndex = -1;
  feedback.setAttribute('aria-labelledby', title.id);
  feedback.setAttribute('aria-describedby', feedback.id + '-copy');
  const feedbackCopy = node('span'); feedbackCopy.id = feedback.id + '-copy'; feedback.append(feedbackCopy);
  const actions = node('div', undefined, 'scene-shortcuts');
  const match = node('button', 'Match holding', 'scene-shortcut'); match.type = 'button'; match.id = 'liquidity-task-match';
  const example = node('button', 'Show an example', 'scene-shortcut'); example.type = 'button'; example.id = 'liquidity-task-example';
  const reset = node('button', 'Reset task', 'scene-shortcut'); reset.type = 'button'; reset.id = 'liquidity-task-reset';
  actions.append(match, example, reset);
  function draw(notify = false) {
    const state = comparisonSceneState(input, current.price, current.fees);
    bars.draw(state);
    finding.textContent = 'LP + fees ' + (state.versusHolding === 'equal' ? 'matches holding' : 'is ' + state.versusHolding + ' holding')
      + '. Holding ' + (Math.abs(state.result.holdValue - input.investment) < 1e-8 ? 'matches the starting capital.' : 'is ' + (state.result.holdValue < input.investment ? 'below' : 'above') + ' the starting capital.');
    match.textContent = 'Match holding · ' + usd(matchChallengeHolding(input, current.price).fees) + ' fees';
    feedback.hidden = true;
    if (notify) onChange({ ...current });
    return finding.textContent;
  }
  let ready = false;
  const price = createSceneExplorer({
    id: 'liquidity-task-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
    step: input.initialPrice / 100, start: current.price, target: input.initialPrice, format: usd,
    labelText: 'Choose the task’s ETH price', valueText: value => usd(value) + ' per ETH',
    scopeText: () => 'Changing price keeps the chosen fee amount. Use Match holding again if needed.',
    shortcuts: [{ label: 'Lower price', value: input.initialPrice * .75 }, { label: 'Starting price', value: input.initialPrice }, { label: 'Higher price', value: input.initialPrice * 1.5 }],
    onChange: value => { current.price = value; return draw(ready); },
  });
  match.addEventListener('click', () => { current = matchChallengeHolding(input, current.price); price.show(current.price, true); });
  example.addEventListener('click', () => { current = matchChallengeHolding(input, input.initialPrice * .75); price.show(current.price, true); });
  reset.addEventListener('click', () => { current = { price: input.initialPrice, fees: 0 }; price.show(current.price, true); });
  element.append(title, scope, bars.figure, price.element, actions, finding,
    node('p', 'Same starting tokens, USDC = $1. Fees are hypothetical cash; gas and other costs are excluded.', 'scene-essential-note'), feedback);
  price.show(current.price); ready = true;
  return {
    element,
    value: () => ({ ...current }),
    showFeedback() {
      const result = checkLiquidityChallenge(input, current);
      feedback.dataset.state = result.passed ? 'match' : 'different';
      feedbackCopy.textContent = result.passed
        ? 'This setup meets both conditions: LP matches holding, and both are below the starting capital. Now connect it to your explanation.'
        : !result.belowStart ? 'Find a price where both end below the starting capital. Matching holding at the starting price does not meet that part of the task.'
          : 'Both are below the starting capital. Adjust the fee assumption with Match holding to close their remaining gap.';
      feedback.hidden = false;
      return feedback;
    },
  };
}
