import { periodPointView, periodIntervalView, periodMilestones } from './period-presentation.js';

export const APPLIED_IDS = Object.freeze(['fees-over-time', 'between-samples', 'period-vs-holding']);
export function appliedLessonFromHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const id = params.get('applied');
  return APPLIED_IDS.includes(id) && params.getAll('applied').length === 1 && [...params.keys()].every(key => key === 'applied') ? id : null;
}
export function appliedQuestion(period, id) {
  if (!APPLIED_IDS.includes(id)) throw new Error('Choose an applied exercise.');
  const expected = id === 'fees-over-time' ? 'position-1382030' : 'position-1375047';
  if (period.id !== expected) throw new Error('This exercise requires its recorded position.');
  const index = id === 'between-samples'
    ? periodMilestones(period).find(item => item.label === 'Between samples')?.index
    : period.points.length - 1;
  if (!Number.isInteger(index)) throw new Error('The recorded between-samples interval is missing.');
  const view = periodPointView(period, index), interval = periodIntervalView(period, index);
  if (id === 'fees-over-time') return { index, view, interval, prediction: 'earned', reason: 'growth' };
  if (id === 'between-samples') {
    const start=periodPointView(period,0),end=periodPointView(period,period.points.length-1);
    const placement={startPrice:start.price,range:start.range,
      upwardRoomPercent:100*(start.range.upperPrice-start.price)/start.price,
      durationSeconds:end.durationSeconds,secondsInRange:end.secondsInRange};
    return { index, view, interval, placement, prediction: 'possible', reason: 'returned' };
  }
  // A named teaching checkpoint in this fixed record, not a search for its worst
  // return. Keep the final period endpoint as the assessed result and handoff.
  const contrastIndex = 6, contrast = periodPointView(period, contrastIndex);
  if (!(contrast.feesUSD > 0 && contrast.gapUSD < 0 && view.gapUSD > 0)) throw new Error('The recorded comparison checkpoints no longer match this lesson.');
  if (contrast.state!=='above'||view.state!=='above'||contrast.principal.amount1!==0n||view.principal.amount1!==0n
      ||contrast.principal.amount0!==view.principal.amount0||!(contrast.price>view.price)) {
    throw new Error('The recovery question requires unchanged USDC principal at two above-range checkpoints.');
  }
  const recovery={principalImprovement:view.principalGapUSD-contrast.principalGapUSD,
    feeValueChange:view.feesUSD-contrast.feesUSD,gapChange:view.gapUSD-contrast.gapUSD};
  return { index, view, interval, contrastIndex, contrast, recovery, prediction: 'can-trail', reason: 'price-returned' };
}
export function appliedReasonFeedback(id, reason) {
  const feedback = {
    'fees-over-time': {
      owed: 'The final collectable balance can include earlier fees and recorded owed amounts. The period result includes only new fee tokens since its starting checkpoint.',
      principal: 'Price changes alter principal value. New fee tokens are accounted for separately through fee growth; a principal value change is not fee income.',
    },
    'between-samples': {
      'stayed-out': 'This position supplies active liquidity only inside its range. Its recorded active time therefore rules out staying above the range for the whole interval.',
      'moved-bounds': 'The recorded bounds never change. Price crossed back inside them and then left again; the position did not move its range.',
    },
    'period-vs-holding': {
      'reinvested': 'Earned fees remain separate from principal in this record. They were not reinvested. At both compared checkpoints, principal is the same USDC amount; the gap shrinks because the holding basket’s ETH loses value.',
      'reentered': 'Price did return inside between these checkpoints, but the final price is above the upper bound. At both compared checkpoints, principal is the same USDC amount. The final principal holds no ETH; holding still does.',
    },
  };
  return feedback[id]?.[reason] || (id === 'period-vs-holding'
    ? 'Compare the tokens in principal with the original holding basket as ETH falls.'
    : 'Choose what the recorded balances or active time tell you.');
}
