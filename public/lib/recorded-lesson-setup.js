import { renderLessonSetup } from './lesson-setup.js';
import { sceneNode as node } from './lesson-scene.js';
import { periodPointView, periodDuration } from './period-presentation.js';
import { formatUnits } from '../models/units.js';
import { fmt, usd } from './format.js';
import { createRangeGuide } from './range-scene-guide.js';

// Only validated starting balances and the named observations are introduced.
// The preview never infers a route through the prices between recorded blocks.
export function renderRecordedLessonSetup(container, period, lesson, question) {
  const start = periodPointView(period, 0), { lowerPrice, upperPrice } = start.range;
  const setup = node('div');
  renderLessonSetup(setup, {
    title: 'The position at the start',
    facts: [
      ['WETH principal', fmt(Number(formatUnits(start.principal.amount1, 18)), 4) + ' WETH', 'eth'],
      ['USDC principal', fmt(Number(formatUnits(start.principal.amount0, 6)), 2) + ' USDC', 'usdc'],
      ['Recorded period', periodDuration(period.validation.durationSeconds)],
    ],
    actionLabel: lesson.id === 'fees-over-time' ? 'Owner activity'
      : question.contrast ? 'Checkpoint ' + (question.contrastIndex + 1) : undefined,
    action: lesson.id === 'fees-over-time' ? 'The owner leaves the position open and collects nothing.'
      : question.contrast ? 'Fees earned since the start are worth ' + usd(question.contrast.feesUSD) + ' at this checkpoint’s price.'
      : undefined,
    assumptions: 'Liquidity and range stay unchanged throughout the record. WETH is wrapped ETH; values use USDC = $1.',
  });
  const figure = node('figure', undefined, 'applied-start-figure');
  const caption = node('figcaption', 'Starting pool price: ' + usd(start.price) + ' per ETH');
  const low = Math.min(lowerPrice, start.price), high = Math.max(upperPrice, start.price);
  const pad = (high - low) * .15;
  const guide = createRangeGuide({ min: low - pad, max: high + pad, lower: lowerPrice, upper: upperPrice,
    price: start.price, recorded: true, showScaleEndpoints: false });
  const state = start.state === 'inside' ? 'Inside the range · both tokens'
    : start.state === 'above' ? 'Above the range · USDC principal' : 'Below the range · WETH principal';
  figure.append(caption, guide.element, node('p', state + '. Band = position range; marker = starting price.', 'applied-start-key'));
  const nodes = [setup, figure];
  if (lesson.id === 'between-samples') {
    const interval = node('div', undefined, 'applied-sample-preview');
    const earlier = periodPointView(period, question.index - 1);
    interval.append(node('strong', 'ETH at two later checkpoints'),
      node('p', 'Upper bound · ' + usd(upperPrice) + ' per ETH'),
      node('p', 'Block ' + earlier.point.snapshot.block.number + ' · ' + usd(earlier.price)),
      node('p', 'Block ' + question.view.point.snapshot.block.number + ' · ' + usd(question.view.price)));
    nodes.push(interval);
  }
  container.replaceChildren(...nodes);
}
