import { sceneNode as node } from './lesson-scene.js';
import { usd, signedUSD } from './format.js';

// Display two actual checkpoints against the same initial holding basket.
// The connecting price chart and optional costs remain separate comparisons.
export function renderRecordedComparison(container, question, showCheckpoint) {
  container.hidden = !question.contrast;
  if (!question.contrast) { container.replaceChildren(); return; }
  const points = [question.contrast, question.view];
  const scale = Math.max(...points.map(point => Math.abs(point.gapUSD)));
  const cards = points.map((view, i) => {
    const index = i ? question.index : question.contrastIndex;
    const card = node('div', undefined, 'recorded-comparison-card');
    const title = node('h4', i ? 'At the final checkpoint' : 'Earlier: fees, yet behind');
    const block = node('p', 'Checkpoint ' + (index + 1) + ' · block ' + view.point.snapshot.block.number, 'scene-key');
    const facts = node('p', 'Principal shortfall ' + usd(-view.principalGapUSD) + ' · period fees ' + usd(view.feesUSD));
    const gap = node('strong', 'LP minus holding: ' + signedUSD(view.gapUSD));
    const track = node('div', undefined, 'recorded-comparison-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span');
    const width = Math.abs(view.gapUSD) / scale * 50;
    fill.style.width = width + '%'; fill.style.left = (view.gapUSD < 0 ? 50 - width : 50) + '%';
    fill.dataset.sign = view.gapUSD < 0 ? 'negative' : 'positive'; track.append(fill);
    const button = node('button', 'Show this checkpoint ↓', 'scene-shortcut'); button.type = 'button';
    button.setAttribute('aria-label', 'Show checkpoint ' + (index + 1));
    button.addEventListener('click', () => showCheckpoint(index));
    card.append(title, '\n', block, '\n', facts, '\n', gap, '\n', track, '\n', button); return card;
  });
  const grid = node('div', undefined, 'recorded-comparison-grid'); grid.append(...cards.flatMap(card => [card, '\n']));
  container.replaceChildren(node('h4', 'Fees do not tell the whole story'), '\n', grid, '\n',
    node('p', 'Bars share a zero at the centre: behind holding to the left, ahead to the right. Both use the same starting tokens, before costs. Figures are rounded; differences use full precision. These observations illustrate the mechanism, not typical returns.', 'scene-key'));
}
