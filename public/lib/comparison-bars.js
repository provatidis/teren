import { sceneNode as node } from './lesson-scene.js';
import { usd } from './format.js';

// Shared by the worked observation and the separately assessed application.
export function createComparisonBars(input, { prefix = 'comparison', withFees = true } = {}) {
  const figure = node('figure', undefined, 'comparison-figure');
  const title = node('figcaption', '', 'scene-figure-title'); title.id = prefix + '-title';
  const rows = {};
  figure.append(title);
  for (const [key, label] of [['start', 'Starting capital'], ['hold', 'Holding starting tokens'], ['lp', withFees ? 'LP + assumed fees' : 'LP before fees']]) {
    const row = node('div', undefined, 'comparison-row'); row.dataset.comparison = key;
    const heading = node('div', undefined, 'comparison-heading');
    const value = node('strong'); value.id = prefix + '-' + key + '-value';
    heading.append(node('span', label), ' ', value);
    const track = node('div', undefined, 'comparison-track'); track.setAttribute('aria-hidden', 'true');
    const principal = node('span', undefined, 'comparison-principal');
    const fee = node('span', undefined, 'comparison-fees');
    track.append(principal, fee); row.append(heading, '\n', track);
    rows[key] = { value, principal, fee }; figure.append('\n', row);
  }
  const parts = node('p', '', 'comparison-parts'); parts.id = prefix + '-parts'; parts.hidden = !withFees;
  figure.append('\n', parts);
  function draw(state) {
    const r = state.result;
    title.textContent = 'Value at ' + usd(r.futurePrice) + ' per ETH';
    for (const [key, value] of [['start', input.investment], ['hold', r.holdValue], ['lp', r.lpValue]]) {
      const row = rows[key]; row.value.textContent = usd(value);
      row.principal.style.width = (key === 'lp' ? r.lpBeforeFees : value) / state.ceiling * 100 + '%';
      row.fee.style.width = (key === 'lp' ? r.fees : 0) / state.ceiling * 100 + '%';
    }
    parts.textContent = 'Solid: ' + usd(r.lpBeforeFees) + ' principal · Striped: ' + usd(r.fees) + ' assumed fees';
  }
  return { figure, draw };
}
