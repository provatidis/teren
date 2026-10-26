import { sceneNode as node, createPriceExplorer } from './lesson-scene.js';
import { tokenSceneState, rangeSceneState, rangePositionState } from './liquidity-scene-state.js';
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
  element.append(prediction, '\n', figure, '\n', explorer.element, '\n', exchange, '\n',
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
    const gap = node('p', undefined, 'scene-range-gap');
    gap.id = 'range-scene-gap-' + (index === 0 ? 'narrow' : 'wide');
    row.append(heading, '\n', track, '\n', bounds, '\n', tokens, '\n', gap); figure.append('\n', row);
    return { row, status, marker, tokens, gap };
  });
  figure.append('\n', node('p', 'Vertical marker: selected price. Bands: the chosen ranges. Tap a boundary to explore it.', 'scene-key'));
  const consequence = node('p', undefined, 'scene-consequence'); consequence.id = 'range-scene-consequence';
  const explorer = createPriceExplorer({
    id: 'range-scene-price', min, max, step: 10, start: narrow.initialPrice,
    target: outcome.price, format: usd,
    shortcuts: [
      { label: 'Start · ' + usd(narrow.initialPrice), value: narrow.initialPrice },
      { label: 'Question · ' + usd(outcome.price), value: outcome.price },
      { label: 'Both inside · $2,090', value: 2090 },
      { label: 'Beyond both · ' + usd(max), value: max },
    ],
    onChange(price) {
      priceLabel.textContent = 'ETH at ' + usd(price);
      const frames = rangeSceneState(narrow, wide, price);
      rows.forEach(({ row, status, marker, tokens, gap }, index) => {
        const frame = frames[index];
        row.dataset.state = frame.result.state;
        status.textContent = frame.status;
        marker.style.left = at(price) + '%';
        tokens.textContent = 'Principal: ' + frame.tokens;
        gap.textContent = 'Shortfall against its own starting tokens: ' + usd(frame.result.breakEvenFees) + ' before fees.';
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
  element.append(prediction, '\n', figure, '\n', explorer.element, '\n', consequence, '\n',
    node('p', 'Each range is compared with holding its own starting tokens. Being inside makes it eligible to earn from swaps, but it can still trail holding. No fee income is estimated.', 'scene-essential-note'));
  explorer.show(narrow.initialPrice);
  return { element, show: explorer.show };
}

export function createRangeBoundaryScene(input, prediction) {
  const element = node('div', undefined, 'lesson-scene');
  const lowerPrice = input.initialPrice * (1 - input.width), upperPrice = input.initialPrice * (1 + input.width);
  const setup = { ...input, lowerPrice, upperPrice, fees: 0, fullRangeFees: 0 };
  const min = input.initialPrice / 2, max = input.initialPrice * 2;
  const at = price => (price - min) / (max - min) * 100;
  const figure = node('figure', undefined, 'scene-range-figure scene-boundary-figure');
  figure.append(node('figcaption', 'Where the price sits, and what you hold', 'scene-figure-title'));
  const status = node('p', '', 'scene-range-price'); status.id = 'boundary-scene-status';
  const track = node('div', undefined, 'scene-range-track'); track.setAttribute('aria-hidden', 'true');
  const band = node('span', undefined, 'scene-range-band'), marker = node('span', undefined, 'scene-range-marker');
  band.style.left = at(lowerPrice) + '%'; band.style.width = at(upperPrice) - at(lowerPrice) + '%';
  track.append(band, marker);
  const bounds = node('div', undefined, 'scene-range-bounds');
  bounds.append(node('span', 'Lower ' + usd(lowerPrice)), node('span', 'Upper ' + usd(upperPrice)));
  const mix = node('div', undefined, 'scene-boundary-mix'); mix.setAttribute('aria-hidden', 'true');
  const eth = node('span', undefined, 'scene-boundary-eth'), usdc = node('span', undefined, 'scene-boundary-usdc');
  mix.append(eth, usdc);
  const amounts = node('p', '', 'scene-token-heading'); amounts.id = 'boundary-scene-tokens';
  const labels = ['eth', 'usdc'].map(token => {
    const label = node('span'); label.dataset.token = token;
    const swatch = node('span', undefined, 'allocation-swatch allocation-swatch-' + token);
    swatch.setAttribute('aria-hidden', 'true'); const text = node('span'); label.append(swatch, ' ', text); amounts.append(label);
    return text;
  });
  figure.append(status, track, bounds, node('p', 'Marker = ETH price; band = your range.', 'scene-key'), mix, amounts,
    node('p', 'The split bar shows each token’s share of principal value.', 'scene-key'));
  const consequence = node('p', '', 'scene-consequence'); consequence.id = 'boundary-scene-copy';
  const explorer = createPriceExplorer({
    id: 'boundary-scene-price', min, max, step: input.initialPrice / 100, start: input.initialPrice, target: input.futurePrice, format: usd,
    shortcuts: [
      { label: 'Lower bound', value: lowerPrice },
      { label: 'Just inside upper', value: input.initialPrice * (1 + input.width * .9) },
      { label: 'Upper bound', value: upperPrice },
      { label: 'Question · ' + usd(input.futurePrice), value: input.futurePrice },
    ],
    onChange(price) {
      const frame = rangePositionState(setup, price), r = frame.result;
      status.textContent = usd(price) + ' · ' + frame.status;
      marker.style.left = at(price) + '%'; figure.dataset.state = r.state;
      eth.style.width = r.finalEthPercent + '%'; usdc.style.width = 100 - r.finalEthPercent + '%';
      labels[0].textContent = fmt(r.pooled.eth, 4) + ' ETH'; labels[1].textContent = fmt(r.pooled.usdc, 2) + ' USDC';
      consequence.textContent = r.state === 'inside' ? 'Both tokens remain. Inside the range, swaps can use the position’s liquidity.'
        : r.state.endsWith('edge') ? 'At this boundary, principal has reached a single-token endpoint. Move just inside to see both tokens again.'
          : 'Outside the range, principal holds ' + frame.tokens + '. The position still owns those tokens; it has not been liquidated.';
      return frame.status + '. ' + labels.map(label => label.textContent).join(' and ');
    },
  });
  element.append(prediction, figure, explorer.element, consequence,
    node('p', 'Each selection recalculates the same funded position at one price. It does not replay trades or estimate earned fees.', 'fine-print'));
  explorer.show(input.initialPrice);
  return { element, showQuestion: () => explorer.show(input.futurePrice) };
}
