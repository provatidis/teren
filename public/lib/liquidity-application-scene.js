import { challengeSetup, checkLiquidityChallenge, matchChallengeHolding } from '../models/liquidity-challenge.js';
import { comparisonSceneState } from './comparison-scene-state.js';
import { createBenchmarkFigure } from './benchmark-figure.js';
import { createFeeExplorer } from './fee-explorer.js';
import { createSceneExplorer, sceneNode as node } from './lesson-scene.js';
import { usd, signedUSD } from './format.js';

// Lesson 7's challenge: the reader picks a price and a fee income on the figure
// from lessons 4 and 5. Two goals tick as they are met, and the solved state
// appears at once, before any answers are checked.
export function createLiquidityApplication(input, saved, onChange) {
  let current = challengeSetup(input, saved) || { price: input.initialPrice, fees: 0 };
  const element = node('section', undefined, 'lesson-scene learning-application-scene');
  element.setAttribute('aria-labelledby', 'liquidity-task-heading');
  // The card around the task carries this title in view.
  const title = node('h4', 'Your challenge', 'sr-only'); title.id = 'liquidity-task-heading';
  const scope = node('p', 'Choose an ETH price and a fee income that meet both goals.', 'scene-question-scope');
  // Holding reaches 1.5 × the starting value and the claim with fees just over it.
  const figure = createBenchmarkFigure(input, { prefix: 'liquidity-task', withFees: true, ceiling: input.investment * 1.6,
    key: 'Dashed = your ' + usd(input.investment) + ' start. Striped = fees.' });
  // Always present, one line each, with the amount that decides it: meeting a
  // goal never moves a slider mid-drag.
  const goals = node('ul', undefined, 'learning-task-goals'); goals.id = 'liquidity-task-goals';
  const goal = copy => {
    const item = node('li'), mark = node('span'), state = node('span', '', 'sr-only'), amount = node('strong');
    mark.setAttribute('aria-hidden', 'true'); item.append(mark, ' ', state, node('span', copy), ' ', amount); goals.append(item);
    return (met, value) => { item.dataset.met = String(met); mark.textContent = met ? '✓' : '○'; state.textContent = met ? 'Met: ' : 'Not yet: '; amount.textContent = value; };
  };
  const showMatches = goal('Your claim matches holding'), showBelow = goal('Both are below your start');
  // The goals show both amounts; the sentence is kept for announcements.
  const finding = node('p', '', 'sr-only'); finding.id = 'liquidity-task-finding';
  const feedback = node('p', '', 'learn-answer-feedback'); feedback.id = 'liquidity-task-feedback';
  feedback.hidden = true; feedback.tabIndex = -1;
  feedback.setAttribute('aria-labelledby', title.id);
  feedback.setAttribute('aria-describedby', feedback.id + '-copy');
  const feedbackCopy = node('span'); feedbackCopy.id = feedback.id + '-copy'; feedback.append(feedbackCopy);
  // Shown as soon as the goal is met, before any answers are checked.
  const solved = node('p', '', 'learn-answer-feedback learning-task-solved'); solved.id = 'liquidity-task-solved';
  solved.dataset.state = 'match'; solved.hidden = true; solved.setAttribute('role', 'status');
  const solvedTitle = node('strong', 'Solved.'), solvedCopy = node('span'); solved.append(solvedTitle, ' ', solvedCopy);
  // The fee can always be set exactly without the slider: this button sits
  // under the fee slider it moves.
  const actions = node('div', undefined, 'scene-shortcuts learning-task-hints');
  const match = node('button', 'Match holding for me', 'scene-shortcut'); match.type = 'button'; match.id = 'liquidity-task-match';
  const example = node('button', 'Show an example', 'scene-shortcut'); example.type = 'button'; example.id = 'liquidity-task-example';
  const reset = node('button', 'Start again', 'scene-shortcut'); reset.type = 'button'; reset.id = 'liquidity-task-reset';
  actions.append(example, reset);
  // Amounts below half a cent would print as $0.00 beside a claim that the values differ.
  const small = value => Math.abs(value) < .005;
  const amount = value => small(value) ? 'less than $0.01' : usd(Math.abs(value));
  function draw(notify = false) {
    const state = comparisonSceneState(input, current.price, current.fees), r = state.result;
    figure.draw(r);
    const start = r.holdValue - input.investment;
    finding.textContent = 'Your claim ' + (state.versusHolding === 'equal' ? 'matches holding' : 'is ' + amount(r.difference) + (r.difference < 0 ? ' behind' : ' ahead of') + ' holding')
      + '. Holding ' + (Math.abs(start) < 1e-8 ? 'matches your start.' : 'is ' + amount(start) + ' ' + (start < 0 ? 'below' : 'above') + ' your start.');
    const check = checkLiquidityChallenge(input, current), passed = check.passed;
    showMatches(check.matchesHolding, small(r.difference) ? usd(0) : signedUSD(r.difference));
    showBelow(check.belowStart, small(start) ? usd(0) : signedUSD(start));
    solved.hidden = !passed;
    solvedCopy.textContent = passed ? 'Your claim and holding are both worth ' + usd(r.holdValue) + ', which is ' + usd(-start)
      + ' less than you started with. Fees closed the gap to holding. They did not undo the price fall.' : '';
    feedback.hidden = true;
    if (notify) onChange({ ...current }, passed);
    return finding.textContent + (passed ? ' Solved.' : '');
  }
  let ready = false;
  // Break-even fees stay below 8.6% of the starting value across the price range.
  const fees = createFeeExplorer({
    id: 'liquidity-task-fees', max: input.investment / 10, start: current.fees, target: 0,
    labelText: 'Fee income', shortcuts: [],
    goal: () => matchChallengeHolding(input, current.price).fees,
    onChange: value => { current.fees = value; return draw(ready); },
  });
  fees.element.querySelector('.scene-shortcuts').append(match);
  function choose(next) { current = next; ready = false; fees.show(current.fees); ready = true; price.show(current.price, true); }
  const price = createSceneExplorer({
    id: 'liquidity-task-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
    step: input.initialPrice / 100, start: current.price, target: input.initialPrice, format: usd,
    labelText: 'ETH price', valueText: value => usd(value) + ' per ETH',
    scopeText: () => '',
    shortcuts: [{ label: 'Lower', value: input.initialPrice * .75 }, { label: 'Start', value: input.initialPrice }, { label: 'Higher', value: input.initialPrice * 1.5 }],
    onChange: value => { current.price = value; return draw(ready); },
  });
  match.addEventListener('click', () => choose(matchChallengeHolding(input, current.price)));
  example.addEventListener('click', () => choose(matchChallengeHolding(input, input.initialPrice * .75)));
  reset.addEventListener('click', () => choose({ price: input.initialPrice, fees: 0 }));
  element.append(title, scope, figure.figure, goals, price.element, fees.element, finding, solved, actions,
    node('p', 'Same starting tokens, USDC = $1. Fees are an amount you choose; gas and other costs are left out.', 'scene-essential-note'), feedback);
  fees.show(current.fees); price.show(current.price); ready = true;
  return {
    element, figure: figure.figure,
    value: () => ({ ...current }),
    showFeedback() {
      const result = checkLiquidityChallenge(input, current);
      feedback.dataset.state = result.passed ? 'match' : 'different';
      feedbackCopy.textContent = result.passed
        ? 'Your claim and holding are worth the same amount. Both have lost dollars.'
        : !result.belowStart ? 'Find a price where both end below your start. Matching holding at the starting price does not meet that part of the task.'
          : 'Both are below your start. Change the fee income until your claim meets holding.';
      feedback.hidden = false;
      return feedback;
    },
  };
}
