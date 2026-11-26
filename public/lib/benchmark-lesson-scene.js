import { comparisonSceneState } from './comparison-scene-state.js';
import { createBenchmarkFigure } from './benchmark-figure.js';
import { createFeeContext } from './fee-context.js';
import { createFeeExplorer } from './fee-explorer.js';
import { createSceneExplorer, sceneNode as node, playRevealedBars, endPlayedBars } from './lesson-scene.js';
import { fmt, usd, signedUSD } from './format.js';

const dollars = value => Number.isInteger(value) ? '$' + value.toLocaleString('en-US') : usd(value);

// A titled panel under the verdict: a sentence that follows the slider and the lesson's one explanation.
function outcomePanel(id, heading) {
  const element = node('section', undefined, 'foundation-outcome'); element.id = id + '-outcome';
  element.setAttribute('aria-labelledby', id + '-outcome-title');
  const title = node('h4', heading); title.id = id + '-outcome-title';
  const copy = node('p', undefined, 'scene-consequence'); copy.id = id + '-copy';
  const why = node('p', undefined, 'foundation-why'); why.id = id + '-why';
  element.append(title, '\n', copy, '\n', why);
  return { element, copy, why };
}

// The figure comes before its question, and the question reveals the outcome in
// place. The slider sits right under the bars it moves and appears with the
// outcome. It explores fresh endpoints: only the controller can edit the
// lesson's assessed inputs, and what is explored is never saved.
function revealingScene({ className, figure, invite, explorer, prediction, outcome, start, target }) {
  const element = node('div', undefined, 'lesson-scene benchmark-scene ' + className);
  element.append(figure.figure, '\n', invite, '\n', explorer.element, '\n', prediction, '\n', outcome.element);
  const reveal = shown => { for (const part of [invite, explorer.element, outcome.element]) part.hidden = !shown; };
  explorer.show(start); reveal(false);
  return { element, figure: figure.figure, verdictAfter: explorer.element, show: explorer.show,
    // Shows the question's own value. A played reveal moves the bars from where they were.
    showQuestion(animate = false) {
      const before = figure.bars.map(bar => bar.style.width);
      reveal(true); explorer.show(target);
      if (animate) playRevealedBars(figure.figure, figure.bars, before);
    } };
}

// Lesson 4 compares one claim with two things: what the reader started with and
// what holding the same tokens would be worth.
export function createBenchmarkScene(input, prediction, { explanation = '' } = {}) {
  const figure = createBenchmarkFigure(input, { facts: [['against-start', 'Against your start:'], ['against-gap', 'Against holding:']],
    key: 'Dashed = your ' + usd(input.investment) + ' start. No fees counted.' });
  const target = input.futurePrice, moved = target !== input.initialPrice;
  const invite = node('p', 'Now drag the price both ways. Can your claim ever beat holding?', 'foundation-invite');
  invite.id = 'benchmark-invite';
  const outcome = outcomePanel('benchmark', 'The gap to holding');
  outcome.why.textContent = explanation;
  const explorer = createSceneExplorer({
    id: 'benchmark-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
    step: input.initialPrice / 100, start: input.initialPrice, target, format: usd,
    labelText: 'ETH price', valueText: price => usd(price) + ' per ETH', scopeText: () => '',
    // The pressed shortcut marks the question's own price. Whole-dollar labels keep both on one row.
    shortcuts: [{ label: 'Start · ' + dollars(input.initialPrice), value: input.initialPrice },
      ...(moved ? [{ label: 'The question · ' + dollars(target), value: target }] : [])],
    onChange(price) {
      const { result } = comparisonSceneState(input, price);
      endPlayedBars(figure.figure);
      figure.draw(result);
      figure.values['against-start'].textContent = signedUSD(result.lpBeforeFees - input.investment);
      figure.values['against-gap'].textContent = signedUSD(result.lpBeforeFees - result.holdValue);
      outcome.copy.textContent = price === input.initialPrice ? 'At the starting price there is no gap: your claim and holding are the same tokens.'
        : 'At this price your claim is worth ' + fmt(Math.abs(result.impermanentLoss), 2) + '% less than holding.';
      return 'Holding ' + usd(result.holdValue) + ', your claim ' + usd(result.lpBeforeFees) + '. ' + outcome.copy.textContent;
    },
  });
  return revealingScene({ className: 'price-scene', figure, invite, explorer, prediction, outcome, start: input.initialPrice, target });
}

// Lesson 5 keeps the price where lesson 4 left it and adds fees to the claim.
// The reader looks for the amount that brings the claim level with holding.
export function createFeeScene(input, prediction, { explanation = '' } = {}) {
  const price = input.futurePrice, base = comparisonSceneState(input, price).result, gap = base.breakEvenFees;
  // Break-even fees stay below 8.6% of the starting value across the price range.
  const max = Math.max(input.investment / 10, input.fees);
  const figure = createBenchmarkFigure(input, { prefix: 'fee', withFees: true,
    ceiling: Math.max(input.investment, base.holdValue, base.lpBeforeFees + max) * 1.04,
    facts: [['earned', gap ? 'Gap covered:' : 'Fees earned:'], ['against-gap', 'Against holding:']],
    key: 'Dashed = your ' + usd(input.investment) + ' start. Striped = fees.' });
  // On the dollar scale above, the fees are a sliver. This bar is the gap itself,
  // so the fees that fill it can be watched.
  const covered = node('div', undefined, 'scene-token-track benchmark-gap'); covered.id = 'fee-gap'; covered.setAttribute('aria-hidden', 'true');
  const coveredFill = node('span', undefined, 'scene-token-fill benchmark-fees'); covered.append(coveredFill);
  covered.hidden = !gap;
  figure.values.earned.closest('p').after('\n', covered);
  figure.bars.push(coveredFill);
  const invite = node('p', gap ? 'Now drag the fees. How much does your claim need to match holding?' : 'Now drag the fees. What do they add to your claim?', 'foundation-invite');
  invite.id = 'fee-invite';
  const outcome = outcomePanel('fee', 'Break-even fees');
  outcome.why.textContent = (gap ? 'The fees that would bring your claim level with holding are its break-even fees: ' + usd(gap) + ' at this price, or '
    + fmt(gap / input.investment * 100, 2) + '% of what you started with. ' : 'At the starting price there is no gap, so no fees are needed to match holding. ') + explanation;
  const context = createFeeContext('comparison');
  outcome.element.append('\n', context.element);
  // Amounts below half a cent would print as $0.00 beside a claim that the values differ.
  const level = value => Math.abs(value) < .005;
  const explorer = createFeeExplorer({
    id: 'fee-amount', max, start: 0, target: input.fees, labelText: 'Fees earned', goal: () => gap,
    // The pressed shortcut marks the question's own fees.
    shortcuts: [...(input.fees ? [{ label: 'The question · ' + dollars(input.fees), value: input.fees }] : [{ label: 'No fees', value: 0 }]),
      ...(gap ? [{ label: 'Match holding', value: gap }] : [])],
    onChange(fees) {
      const { result } = comparisonSceneState(input, price, fees);
      endPlayedBars(figure.figure);
      figure.draw(result); context.update(result);
      figure.values.earned.textContent = usd(fees) + (gap ? ' of ' + usd(gap) : '');
      coveredFill.style.width = gap ? Math.min(1, fees / gap) * 100 + '%' : '0%';
      figure.values['against-gap'].textContent = level(result.difference) ? usd(0) : signedUSD(result.difference);
      outcome.copy.textContent = level(result.difference) ? 'Level with holding. ' + usd(fees) + ' in fees closes the gap at this price.'
        : result.difference < 0 ? 'Your claim needs ' + usd(-result.difference) + ' more in fees to match holding.'
          : 'Your claim is ' + usd(result.difference) + ' ahead of holding.';
      return usd(fees) + ' in fees. ' + outcome.copy.textContent;
    },
  });
  return revealingScene({ className: 'fee-scene', figure, invite, explorer, prediction, outcome, start: 0, target: input.fees });
}
