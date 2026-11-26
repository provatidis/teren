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
  const scope = node('p', 'Choose an ETH price and a fee income that meet both goals.', 'scene-question-scope');
  // Always present and one line each, so meeting a goal never moves a slider mid-drag.
  const goals = node('ul', undefined, 'learning-task-goals'); goals.id = 'liquidity-task-goals';
  const goal = copy => {
    const item = node('li'), mark = node('span'), state = node('span', '', 'sr-only');
    mark.setAttribute('aria-hidden', 'true'); item.append(mark, ' ', state, copy); goals.append(item);
    return met => { item.dataset.met = String(met); mark.textContent = met ? '✓' : '○'; state.textContent = met ? 'Met: ' : 'Not yet: '; };
  };
  const showMatches = goal('Matches holding'), showBelow = goal('Both below the start');
  const bars = createComparisonBars(input, { prefix: 'liquidity-task' });
  const finding = node('p', '', 'scene-consequence'); finding.id = 'liquidity-task-finding';
  const feedback = node('p', '', 'learn-answer-feedback'); feedback.id = 'liquidity-task-feedback';
  feedback.hidden = true; feedback.tabIndex = -1;
  feedback.setAttribute('aria-labelledby', title.id);
  feedback.setAttribute('aria-describedby', feedback.id + '-copy');
  const feedbackCopy = node('span'); feedbackCopy.id = feedback.id + '-copy'; feedback.append(feedbackCopy);
  // Shown as soon as the goal is met, before any answers are checked.
  const solved = node('p', '', 'learn-answer-feedback learning-task-solved'); solved.id = 'liquidity-task-solved';
  solved.dataset.state = 'match'; solved.hidden = true; solved.setAttribute('role', 'status');
  const solvedTitle = node('strong', 'Solved.'), solvedCopy = node('span'); solved.append(solvedTitle, ' ', solvedCopy);
  // The fee can always be set exactly without the slider.
  const actions = node('div', undefined, 'scene-shortcuts learning-task-hints');
  const match = node('button', 'Match holding for me', 'scene-shortcut'); match.type = 'button'; match.id = 'liquidity-task-match';
  const example = node('button', 'Show an example', 'scene-shortcut'); example.type = 'button'; example.id = 'liquidity-task-example';
  const reset = node('button', 'Start again', 'scene-shortcut'); reset.type = 'button'; reset.id = 'liquidity-task-reset';
  actions.append(match, example, reset);
  // Amounts below half a cent would print as $0.00 beside a claim that the values differ.
  const amount = value => Math.abs(value) < .005 ? 'less than $0.01' : usd(Math.abs(value));
  function draw(notify = false) {
    const state = comparisonSceneState(input, current.price, current.fees), r = state.result;
    bars.draw(state);
    const start = r.holdValue - input.investment;
    finding.textContent = 'LP + fees ' + (state.versusHolding === 'equal' ? 'matches holding' : 'is ' + amount(r.difference) + ' ' + state.versusHolding + ' holding')
      + '. Holding ' + (Math.abs(start) < 1e-8 ? 'matches the starting capital.' : 'is ' + amount(start) + ' ' + (start < 0 ? 'below' : 'above') + ' the starting capital.');
    const check = checkLiquidityChallenge(input, current), passed = check.passed;
    showMatches(check.matchesHolding); showBelow(check.belowStart);
    solved.hidden = !passed;
    solvedCopy.textContent = passed ? 'The pool position and holding are both worth ' + usd(r.holdValue) + ', which is ' + usd(-start)
      + ' less than you started with. Fees closed the gap with holding. They did not undo the price fall.' : '';
    feedback.hidden = true;
    if (notify) onChange({ ...current });
    return finding.textContent + (passed ? ' Solved.' : '');
  }
  let ready = false;
  // Break-even fees stay below 8.6% of the starting capital across the price range.
  const feeMax = input.investment / 10, snapRange = feeMax * .025;
  let fromSlider = false, pointer = false;
  // A hand-set fee settles on the exact matching amount: within reach of a
  // dragged thumb, or when a keyboard step crosses it. Saved and button-set
  // amounts are never adjusted.
  function chosenFee(value) {
    if (!fromSlider) return value;
    const goal = matchChallengeHolding(input, current.price).fees, last = current.fees;
    if (pointer) return Math.abs(value - goal) <= snapRange ? goal : value;
    // Home, End and page keys travel on; only a single arrow step stops here.
    const arrowStep = Math.abs(value - last) <= feeMax * .011;
    return arrowStep && ((last < goal && value >= goal) || (last > goal && value <= goal)) ? goal : value;
  }
  const fees = createSceneExplorer({
    id: 'liquidity-task-fees', min: 0, max: feeMax, step: 'any', start: current.fees, target: 0, format: value => usd(chosenFee(value)),
    labelText: 'Choose your fee income', valueText: value => usd(chosenFee(value)) + ' in fees',
    scopeText: () => 'Drag until the pool position meets holding.',
    shortcuts: [{ label: 'No fees', value: 0 }],
    onChange: value => { current.fees = chosenFee(value); fromSlider = false; return draw(ready); },
  });
  const feeSlider = fees.element.querySelector('input');
  fees.element.addEventListener('input', () => { fromSlider = true; }, true);
  feeSlider.addEventListener('pointerdown', () => { pointer = true; });
  const settle = () => { pointer = false; };
  feeSlider.addEventListener('pointerup', settle); feeSlider.addEventListener('pointercancel', settle);
  // On release, rest the thumb on the amount in use.
  feeSlider.addEventListener('change', () => { settle(); const notify = ready; ready = false; fees.show(current.fees); ready = notify; });
  function choose(next) { current = next; ready = false; fees.show(current.fees); ready = true; price.show(current.price, true); }
  const price = createSceneExplorer({
    id: 'liquidity-task-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
    step: input.initialPrice / 100, start: current.price, target: input.initialPrice, format: usd,
    labelText: 'Choose an ETH price', valueText: value => usd(value) + ' per ETH',
    scopeText: () => 'Changing the price keeps your fee amount.',
    shortcuts: [{ label: 'Lower price', value: input.initialPrice * .75 }, { label: 'Starting price', value: input.initialPrice }, { label: 'Higher price', value: input.initialPrice * 1.5 }],
    onChange: value => { current.price = value; return draw(ready); },
  });
  match.addEventListener('click', () => choose(matchChallengeHolding(input, current.price)));
  example.addEventListener('click', () => choose(matchChallengeHolding(input, input.initialPrice * .75)));
  reset.addEventListener('click', () => choose({ price: input.initialPrice, fees: 0 }));
  element.append(title, scope, bars.figure, goals, price.element, fees.element, finding, solved, actions,
    node('p', 'Same starting tokens, USDC = $1. Fees are hypothetical cash; gas and other costs are excluded.', 'scene-essential-note'), feedback);
  fees.show(current.fees); price.show(current.price); ready = true;
  return {
    element,
    value: () => ({ ...current }),
    showFeedback() {
      const result = checkLiquidityChallenge(input, current);
      feedback.dataset.state = result.passed ? 'match' : 'different';
      feedbackCopy.textContent = result.passed
        ? 'Your position and the starting tokens are worth the same amount. Both have lost dollars.'
        : !result.belowStart ? 'Find a price where both end below the starting capital. Matching holding at the starting price does not meet that part of the task.'
          : 'Both are below the starting capital. Change the fee income until the pool position meets holding.';
      feedback.hidden = false;
      return feedback;
    },
  };
}
