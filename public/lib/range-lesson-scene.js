import { sceneNode as node, createSceneExplorer, playRevealedPath, endPlayedBars, ACTION_MS } from './lesson-scene.js';
import { rangePositionState } from './liquidity-scene-state.js';
import { fmt, usd } from './format.js';
import { createRangeGuide } from './range-scene-guide.js';

// The prices the figure and its slider share. The range takes about a third of
// the track, so the marker visibly crosses it; a saved question with a wider
// range or a farther price still fits. Whole steps keep every named price exact.
export function rangeLessonDomain(input) {
  const step = input.initialPrice / 100, at = input.futurePrice / input.initialPrice;
  const low = Math.max(20, Math.floor(Math.min(.7, 1 - input.width * 1.5, at * .9) * 20 + 1e-9) * 5);
  const high = Math.ceil(Math.max(1.3, 1 + input.width * 1.5, at * 1.1) * 20 - 1e-9) * 5;
  return { min: step * low, max: step * high, step };
}

const WHERE = {
  inside: 'Inside your range', above: 'Above your range', below: 'Below your range',
  'upper-edge': 'At the upper end', 'lower-edge': 'At the lower end',
};

// Lesson 6: the claim and its range come before the question, and the question
// plays the price move in place. The marker crosses the range while the two
// bars change only inside it, which is the lesson. The slider sits under the
// figure and appears with the outcome. It explores fresh endpoints: only the
// controller can edit the lesson's assessed price, and the explored price is
// never saved.
export function createRangeBoundaryScene(input, prediction, { explanation = '' } = {}) {
  const element = node('div', undefined, 'lesson-scene boundary-scene');
  const lower = input.initialPrice * (1 - input.width), upper = input.initialPrice * (1 + input.width);
  const setup = { ...input, lowerPrice: lower, upperPrice: upper, fees: 0, fullRangeFees: 0 };
  const { min, max, step } = rangeLessonDomain(input), target = input.futurePrice;
  const figure = node('figure', undefined, 'scene-token-figure boundary-figure');
  // Two fixed parts, so the caption cannot rewrap above the slider as the price changes.
  const caption = node('figcaption', undefined, 'scene-figure-title token-scene-title');
  const at = node('span'); at.id = 'boundary-at';
  caption.append(node('span', 'Your claim'), node('span', ' with ', 'sr-only'), at);
  const guide = createRangeGuide({ min, max, lower, upper, price: input.initialPrice });
  const marker = guide.element.querySelector('.scene-range-marker');
  const where = node('p', undefined, 'boundary-where'); where.id = 'boundary-where';
  figure.append(caption, '\n', guide.element, '\n', where);
  // Each bar is full where the claim holds only that token: ETH at the lower
  // end of the range, USDC at the upper end.
  const full = { eth: rangePositionState(setup, lower).result.pooled.eth, usdc: rangePositionState(setup, upper).result.pooled.usdc };
  const started = rangePositionState(setup, input.initialPrice).result.pooled;
  const unit = token => token.toUpperCase(), amount = (token, value) => fmt(value, token === 'eth' ? 4 : 2) + ' ' + unit(token);
  const rows = ['eth', 'usdc'].map(token => {
    const row = node('div', undefined, 'scene-token-row'); row.dataset.token = token;
    const heading = node('div', undefined, 'scene-token-heading');
    const value = node('span'); value.id = 'boundary-' + token;
    heading.append(node('strong', unit(token)), ' ', value);
    const track = node('div', undefined, 'scene-token-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span', undefined, 'scene-token-fill');
    const start = node('span', undefined, 'scene-token-start'); start.style.left = started[token] / full[token] * 100 + '%';
    track.append(fill, start);
    row.append(heading, '\n', track); figure.append('\n', row);
    return { token, value, fill };
  });
  figure.append('\n', node('p', 'Band = your range. Dashed = start.', 'scene-key'));
  const inside = target > lower && target < upper;
  const invite = node('p', 'Now drag the price ' + (inside ? 'out of' : 'back through') + ' your range. Where do the bars stop?', 'foundation-invite');
  invite.id = 'boundary-invite';
  const outcome = node('section', undefined, 'foundation-outcome'); outcome.id = 'boundary-outcome';
  outcome.setAttribute('aria-labelledby', 'boundary-outcome-title');
  const title = node('h4', 'Inside and outside your range'); title.id = 'boundary-outcome-title';
  const copy = node('p', undefined, 'scene-consequence'); copy.id = 'boundary-copy';
  const why = node('p', explanation, 'foundation-why'); why.id = 'boundary-why';
  outcome.append(title, '\n', copy, '\n', why);
  const dollars = value => Number.isInteger(value) ? '$' + value.toLocaleString('en-US') : usd(value);
  let shown = input.initialPrice;
  const explorer = createSceneExplorer({
    id: 'boundary-price', min, max, step, start: input.initialPrice, target, format: usd,
    labelText: 'ETH price', valueText: price => usd(price) + ' per ETH', scopeText: () => '',
    // The same words as the labels on the range above.
    shortcuts: [{ label: 'Lower', value: lower }, { label: 'Upper', value: upper },
      ...(target === lower || target === upper ? [] : [{ label: 'The question · ' + dollars(target), value: target }])],
    onChange(price) {
      const { result } = rangePositionState(setup, price), state = result.state, held = result.pooled;
      endPlayedBars(figure);
      shown = price; figure.dataset.state = state;
      at.textContent = 'ETH at ' + usd(price);
      guide.showPrice(price);
      where.textContent = WHERE[state];
      for (const { token, value, fill } of rows) {
        fill.style.width = held[token] / full[token] * 100 + '%';
        value.textContent = amount(token, held[token]);
      }
      const only = held.eth === 0 ? 'usdc' : 'eth';
      copy.textContent = state === 'inside' ? 'Traders are swapping against your claim here. It holds both tokens and can earn fees.'
        : state === 'upper-edge' ? 'At the upper end the last ETH is sold. One step back inside, your claim holds both tokens again.'
          : state === 'lower-edge' ? 'At the lower end the last USDC is gone. One step back inside, your claim holds both tokens again.'
            : (state === 'above' ? 'Above' : 'Below') + ' your range no one trades against your claim. It stays at ' + amount(only, held[only])
              + ' and earns no new fees until ETH comes back ' + (state === 'above' ? 'below ' + usd(upper) : 'above ' + usd(lower)) + '.';
      return WHERE[state] + '. ' + rows.map(row => row.value.textContent).join(' and ');
    },
  });
  element.append(figure, '\n', invite, '\n', explorer.element, '\n', prediction, '\n', outcome);
  const reveal = visible => { for (const part of [invite, explorer.element, outcome]) part.hidden = !visible; };
  explorer.show(input.initialPrice); reveal(false);
  return { element, figure, verdictAfter: explorer.element, show: explorer.show,
    // Shows the question's price. A played reveal moves the marker from where it
    // was, and the bars only while the marker is inside the range.
    showQuestion(animate = false) {
      const from = shown, before = { marker: marker.style.left, fills: rows.map(({ fill }) => fill.style.width) };
      reveal(true); explorer.show(target);
      if (!animate || from === target) return;
      const along = price => (price - from) / (target - from);
      const between = target > from ? [along(Math.max(from, lower)), along(Math.min(target, upper))]
        : [along(Math.min(from, upper)), along(Math.max(target, lower))];
      // Two phases to follow, the crossing and the stop, so this one takes longer.
      playRevealedPath(figure, [{ element: marker, property: 'left', from: before.marker },
        ...rows.map(({ fill }, i) => ({ element: fill, from: before.fills[i], between }))], ACTION_MS * 1.5);
    } };
}
