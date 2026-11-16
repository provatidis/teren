import { DEPOSIT, YT_FEE, grossYieldAt } from '../models/split-yield-v1.js';

export function drawYieldPath(input, day, purchaseCost) {
  const $ = id => document.getElementById(id);
  const netAt = d => DEPOSIT * (1 - YT_FEE) * grossYieldAt(input, d);
  // Keep the scale fixed as the learner moves the same rate change in time.
  const highest = Math.max(input.firstApy, input.secondApy);
  const peak = DEPOSIT * (1 - YT_FEE) * grossYieldAt({ ...input, firstApy: highest, secondApy: highest }, input.days);
  const max = Math.max(peak, purchaseCost);
  const x = d => 3 + 474 * d / input.days;
  const y = amount => 122 - 112 * amount / max;
  const days = new Set([0, input.switchDay, day, input.days]);
  for (let i = 1; i < 60; i++) days.add(Math.round(input.days * i / 60));
  const points = [...days].sort((a, b) => a - b);
  const path = ds => ds.map((d, i) => (i ? 'L' : 'M') + x(d).toFixed(2) + ',' + y(netAt(d)).toFixed(2)).join(' ');
  $('plot-full').setAttribute('d', path(points));
  $('plot-earned').setAttribute('d', path(points.filter(d => d <= day)));
  for (const end of ['x1', 'x2']) $('plot-switch').setAttribute(end, x(input.switchDay));
  for (const end of ['y1', 'y2']) $('plot-cost').setAttribute(end, y(purchaseCost));
  $('plot-cursor').setAttribute('cx', x(day));
  $('plot-cursor').setAttribute('cy', y(netAt(day)));
  return netAt(day);
}
