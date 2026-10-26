import { sceneNode as node } from './lesson-scene.js';
import { usd } from './format.js';

// Price markers, band edges and labelled ticks share one linear scale.
// Stagger the boundary labels so even a narrow range is readable on a phone.
export function createRangeGuide({ min, max, lower, upper, price, name = '', onBoundary, recorded = false }) {
  const element = node('div', undefined, 'scene-range-guide');
  const at = value => (value - min) / (max - min) * 100;
  function boundary(edge, value) {
    const row = node('div', undefined, 'scene-range-boundary scene-range-' + edge);
    const position = at(value) + '%';
    const label = node(onBoundary ? 'button' : 'span', (edge === 'lower' ? 'Lower ' : 'Upper ') + usd(value),
      (onBoundary ? 'text-button ' : '') + 'scene-range-bound-label');
    label.style.left = position;
    // At either end keep the whole label on the scale; between them the tick
    // stays underneath the label without needing viewport-specific offsets.
    label.style.transform = 'translateX(-' + position + ')';
    if (onBoundary) {
      label.type = 'button';
      label.setAttribute('aria-label', name + ' ' + edge + ' boundary: ' + usd(value));
      label.addEventListener('click', () => onBoundary(value));
    }
    const tick = node('span', undefined, 'scene-range-tick');
    tick.style.left = position; tick.setAttribute('aria-hidden', 'true');
    row.append(label, tick);
    return row;
  }
  const track = node('div', undefined, 'scene-range-track' + (recorded ? ' applied-start-track' : ''));
  track.setAttribute('aria-hidden', 'true');
  const band = node('span', undefined, 'scene-range-band' + (recorded ? ' applied-start-band' : ''));
  band.style.left = at(lower) + '%'; band.style.width = at(upper) - at(lower) + '%';
  const marker = node('span', undefined, 'scene-range-marker');
  track.append(band, marker);
  const scale = node('div', undefined, 'scene-range-scale');
  scale.append(node('span', usd(min)), node('span', 'ETH price'), node('span', usd(max)));
  element.append(boundary('lower', lower), track, boundary('upper', upper), scale);
  const showPrice = value => { marker.style.left = at(value) + '%'; };
  showPrice(price);
  return { element, showPrice };
}
