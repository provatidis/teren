import { comparisonSceneState } from './comparison-scene-state.js';
import { claimText } from './lesson-narration.js';
import { createSceneExplorer, sceneNode as node, playRevealedBars, endPlayedBars } from './lesson-scene.js';
import { fmt, usd, signedUSD } from './format.js';

// Lesson 4 compares one claim with two things: what the reader started with and
// what holding the same tokens would be worth. The figure comes before its
// question, and the question reveals the price move in place. The slider sits
// right under the bars it moves and appears with the outcome. It explores fresh
// endpoints: only the controller can edit the lesson's assessed price.
export function createBenchmarkScene(input, prediction, { explanation = '' } = {}) {
  const element = node('div', undefined, 'lesson-scene benchmark-scene');
  const figure = node('figure', undefined, 'benchmark-figure');
  // Two fixed parts, so the caption cannot rewrap above the slider as the price changes.
  const caption = node('figcaption', undefined, 'scene-figure-title token-scene-title');
  const at = node('span'); at.id = 'benchmark-at';
  caption.append(node('span', 'Value'), node('span', ' with ', 'sr-only'), at);
  figure.append(caption);
  // Where each one sits is said beside its name. The narrowest phones show the name alone.
  const rows = [['hold', 'Holding', ' in your wallet'], ['claim', 'Your claim', ' in the pool']].map(([key, label, place]) => {
    const row = node('div', undefined, 'scene-token-row'); row.dataset.benchmark = key;
    const heading = node('div', undefined, 'scene-token-heading');
    const value = node('span'); value.id = 'benchmark-' + key;
    const name = node('span', undefined, 'benchmark-name'); name.append(node('strong', label), node('span', place, 'benchmark-place'));
    heading.append(name, ' ', value);
    const track = node('div', undefined, 'scene-token-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span', undefined, 'scene-token-fill');
    const start = node('span', undefined, 'scene-token-start');
    // Holding reaches 1.5 × the starting value at the top of the price range.
    start.style.left = 100 / 1.5 + '%';
    track.append(fill, start);
    const tokens = node('p', undefined, 'scene-token-detail'); tokens.id = 'benchmark-' + key + '-tokens';
    row.append(heading, '\n', track, '\n', tokens); figure.append('\n', row);
    return { key, value, fill, tokens };
  });
  // A label beside a value in fixed columns: the lines cannot rewrap above the slider.
  const facts = [['start', 'Against your start:'], ['gap', 'Against holding:']].map(([key, label]) => {
    const row = node('p', undefined, 'foundation-fact'); row.id = 'benchmark-against-' + key;
    const value = node('strong'); row.append(node('span', label), ' ', value);
    figure.append('\n', row);
    return value;
  });
  figure.append('\n', node('p', 'Dashed = your ' + usd(input.investment) + ' start. No fees counted.', 'scene-key'));
  const target = input.futurePrice, moved = target !== input.initialPrice;
  const dollars = value => Number.isInteger(value) ? '$' + value.toLocaleString('en-US') : usd(value);
  const invite = node('p', 'Now drag the price both ways. Can your claim ever beat holding?', 'foundation-invite');
  invite.id = 'benchmark-invite';
  const outcome = node('section', undefined, 'foundation-outcome'); outcome.id = 'benchmark-outcome';
  outcome.setAttribute('aria-labelledby', 'benchmark-outcome-title');
  const title = node('h4', 'The gap to holding'); title.id = 'benchmark-outcome-title';
  const gap = node('p', undefined, 'scene-consequence'); gap.id = 'benchmark-copy';
  const why = node('p', explanation, 'foundation-why'); why.id = 'benchmark-why';
  outcome.append(title, '\n', gap, '\n', why);
  const explorer = createSceneExplorer({
    id: 'benchmark-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
    step: input.initialPrice / 100, start: input.initialPrice, target, format: usd,
    labelText: 'ETH price', valueText: price => usd(price) + ' per ETH', scopeText: () => '',
    // The pressed shortcut marks the question's own price. Whole-dollar labels keep both on one row.
    shortcuts: [{ label: 'Start · ' + dollars(input.initialPrice), value: input.initialPrice },
      ...(moved ? [{ label: 'The question · ' + dollars(target), value: target }] : [])],
    onChange(price) {
      const { result } = comparisonSceneState(input, price), same = price === input.initialPrice;
      endPlayedBars(figure);
      at.textContent = 'ETH at ' + usd(price);
      for (const { key, value, fill, tokens } of rows) {
        const worth = key === 'hold' ? result.holdValue : result.lpBeforeFees;
        // One fixed dollar scale, so a moving bar shows a change in value faithfully.
        fill.style.width = worth / (input.investment * 1.5) * 100 + '%';
        value.textContent = usd(worth);
        tokens.textContent = claimText(key === 'hold' ? result.held : result.pooled);
      }
      facts[0].textContent = signedUSD(result.lpBeforeFees - input.investment);
      facts[1].textContent = signedUSD(result.lpBeforeFees - result.holdValue);
      gap.textContent = same ? 'At the starting price there is no gap: your claim and holding are the same tokens.'
        : 'At this price your claim is worth ' + fmt(Math.abs(result.impermanentLoss), 2) + '% less than holding.';
      return 'Holding ' + usd(result.holdValue) + ', your claim ' + usd(result.lpBeforeFees) + '. ' + gap.textContent;
    },
  });
  element.append(figure, '\n', invite, '\n', explorer.element, '\n', prediction, '\n', outcome);
  const reveal = shown => { for (const part of [invite, explorer.element, outcome]) part.hidden = !shown; };
  explorer.show(input.initialPrice); reveal(false);
  return { element, figure, verdictAfter: explorer.element, show: explorer.show,
    // Shows the question's price. A played reveal moves the bars from where they were.
    showQuestion(animate = false) {
      const before = rows.map(({ fill }) => fill.style.width);
      reveal(true); explorer.show(target);
      if (animate) playRevealedBars(figure, rows.map(({ fill }) => fill), before);
    } };
}
