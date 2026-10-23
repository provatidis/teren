import { sceneNode as node, createPriceExplorer } from './lesson-scene.js';
import { tokenSceneState, rangeSceneState } from './liquidity-scene-state.js';
import { fmt, usd } from './format.js';

export function createTokenBalanceScene(input, prediction) {
  const element = node('div', undefined, 'lesson-scene');
  const figure = node('figure', undefined, 'scene-token-figure');
  figure.append(node('figcaption', 'Tokens in your share of the pool', 'scene-figure-title'));
  const rows = ['eth', 'usdc'].map(token => {
    const row = node('div', undefined, 'scene-token-row'); row.dataset.token = token;
    const heading = node('div', undefined, 'scene-token-heading');
    const name = node('strong', token.toUpperCase());
    const value = node('span'); value.id = 'token-scene-' + token;
    heading.append(name, ' ', value);
    const track = node('div', undefined, 'scene-token-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span', undefined, 'scene-token-fill');
    const start = node('span', undefined, 'scene-token-start');
    track.append(fill, start);
    const detail = node('p', undefined, 'scene-token-detail');
    row.append(heading, '\n', track, '\n', detail); figure.append('\n', row);
    return { token, value, fill, start, detail };
  });
  const key = node('p', 'Dashed line = starting amount. Each bar uses its own token units.', 'scene-key');
  figure.append('\n', key);
  const exchange = node('p', undefined, 'scene-consequence'); exchange.id = 'token-scene-exchange';
  const target = input.futurePrice;
  const explorer = createPriceExplorer({
    id: 'token-scene-price', min: input.initialPrice / 2, max: input.initialPrice * 2,
    step: input.initialPrice / 100, start: input.initialPrice, target, format: usd,
    shortcuts: [
      { label: 'Start · ' + usd(input.initialPrice), value: input.initialPrice },
      { label: 'Question · ' + usd(target), value: target },
    ],
    onChange(price) {
      const state = tokenSceneState(input, price), { result, direction } = state;
      figure.dataset.direction = direction;
      for (const { token, value, fill, start, detail } of rows) {
        const original = result.held[token], current = result.pooled[token];
        // Fixed independent scales avoid a changing denominator as the slider moves.
        const max = original * Math.SQRT2;
        fill.style.width = current / max * 100 + '%';
        start.style.left = original / max * 100 + '%';
        value.textContent = fmt(current, token === 'eth' ? 4 : 2) + ' ' + token.toUpperCase();
        const movement = current < original ? '← Out of pool' : current > original ? 'Into pool →' : 'Unchanged';
        detail.textContent = movement + ' · Start: ' + fmt(original, token === 'eth' ? 4 : 2);
      }
      exchange.textContent = state.exchange;
      return state.exchange;
    },
  });
  element.append(figure, '\n', prediction, '\n', explorer.element, '\n', exchange, '\n',
    node('p', 'Each price is compared with the same starting position. Swaps change the balances; this model leaves out fees.', 'fine-print'));
  explorer.show(input.initialPrice);
  return { element, show: explorer.show, showQuestion: () => explorer.show(target) };
}

export function createRangeWidthScene(outcome, prediction) {
  const element = node('div', undefined, 'lesson-scene');
  const figure = node('figure', undefined, 'scene-range-figure');
  figure.append(node('figcaption', 'One ETH price, two ranges', 'scene-figure-title'));
  const priceLabel = node('p', undefined, 'scene-range-price'); priceLabel.id = 'range-scene-price-label';
  figure.append('\n', priceLabel);
  const { narrow, wide } = outcome;
  const min = Math.round(wide.lowerPrice * .8), max = Math.round(wide.upperPrice * 1.12);
  const at = price => (price - min) / (max - min) * 100;
  const rows = [narrow, wide].map((position, index) => {
    const row = node('div', undefined, 'scene-range-row');
    const heading = node('div', undefined, 'scene-range-heading');
    const name = node('strong', index === 0 ? 'Narrow' : 'Wider');
    const status = node('span'); status.id = 'range-scene-' + (index === 0 ? 'narrow' : 'wide');
    heading.append(name, ' ', status);
    const track = node('div', undefined, 'scene-range-track'); track.setAttribute('aria-hidden', 'true');
    const band = node('span', undefined, 'scene-range-band');
    band.style.left = at(position.lowerPrice) + '%';
    band.style.width = at(position.upperPrice) - at(position.lowerPrice) + '%';
    const marker = node('span', undefined, 'scene-range-marker');
    track.append(band, marker);
    const bounds = node('div', undefined, 'scene-range-bounds');
    for (const [name, value] of [['Lower', position.lowerPrice], ['Upper', position.upperPrice]]) {
      const button = node('button', name + ' ' + usd(value), 'text-button'); button.type = 'button';
      button.setAttribute('aria-label', (index === 0 ? 'Narrow' : 'Wider') + ' ' + name.toLowerCase() + ' boundary: ' + usd(value));
      button.addEventListener('click', () => explorer.show(value, true)); bounds.append(' ', button);
    }
    const tokens = node('p', undefined, 'scene-range-tokens');
    row.append(heading, '\n', track, '\n', bounds, '\n', tokens); figure.append('\n', row);
    return { row, status, marker, tokens };
  });
  figure.append('\n', node('p', 'Vertical marker: selected price. Bands: the chosen ranges. Tap a boundary to explore it.', 'scene-key'));
  const consequence = node('p', undefined, 'scene-consequence'); consequence.id = 'range-scene-consequence';
  const explorer = createPriceExplorer({
    id: 'range-scene-price', min, max, step: 10, start: narrow.initialPrice,
    target: outcome.price, format: usd,
    shortcuts: [
      { label: 'Start · ' + usd(narrow.initialPrice), value: narrow.initialPrice },
      { label: 'Question · ' + usd(outcome.price), value: outcome.price },
      { label: 'Beyond both · ' + usd(max), value: max },
    ],
    onChange(price) {
      priceLabel.textContent = 'ETH at ' + usd(price);
      const frames = rangeSceneState(narrow, wide, price);
      rows.forEach(({ row, status, marker, tokens }, index) => {
        const frame = frames[index];
        row.dataset.state = frame.result.state;
        status.textContent = frame.status;
        marker.style.left = at(price) + '%';
        tokens.textContent = 'Principal: ' + frame.tokens;
      });
      const inside = frames.filter(frame => frame.result.state === 'inside').length;
      const edge = frames.some(frame => frame.result.state.endsWith('edge'));
      consequence.textContent = edge
        ? 'At a boundary, that position has reached a single-token endpoint. Move just inside or outside to compare.'
        : inside === 2 ? 'Both ranges include this price. The narrower position has less room before a boundary.'
          : inside === 1 ? 'Only the wider range includes this price. The narrow position still holds its tokens.'
            : 'Neither range includes this price. Both positions still hold their tokens.';
      return frames.map((frame, i) => (i === 0 ? 'Narrow: ' : 'Wider: ') + frame.status + ', ' + frame.tokens).join('. ');
    },
  });
  element.append(figure, '\n', prediction, '\n', explorer.element, '\n', consequence, '\n',
    node('p', 'Inside a range means eligible to earn from swaps. It does not tell us how much was earned.', 'scene-essential-note'));
  explorer.show(narrow.initialPrice);
  return { element, show: explorer.show };
}
