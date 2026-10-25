// Current shared links from the original single-page liquidity entry stay usable.
// Home's own anchors never become lab routes, and malformed scenarios are still
// handled by the lab's existing validators.
export function isLiquidityEntry(hash) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ''));
  return ['#experiment', '#inspect', '#lp-lab', '#range-lab', '#pool-lab',
    '#position-lab', '#swap-sandbox', '#example-library', '#saved-experiments',
    '#historical-case', '#fee-comparison', '#compare-widths'].includes(hash)
    || ['scenario', 'example', 'historical-case', 'width'].some(key => parameters.has(key));
}

export const LEARNING_ROUTES = Object.freeze({
  'learn.html#lesson=swap-impact': 'Swaps & price impact',
  'learn.html#lesson=pool-share': 'Providing liquidity',
  'learn.html#lesson=token-balances': 'Changing token balances',
  'learn.html#lesson=loss-vs-profit': 'Loss versus profit',
  'learn.html#lesson=fee-break-even': 'Fees & break-even',
  'learn.html#lesson=range-boundaries': 'Concentrated liquidity',
  'learn.html#lesson=final-challenge': 'Final challenge',
  'learn.html#manage=range-width': 'Narrow and wide ranges',
  'learn.html#manage=fee-tiers': 'Fee tiers and APR',
  'learn.html#manage=range-management': 'Exits, returns and costs',
  'learn.html#applied=fees-over-time': 'Fees over time',
  'learn.html#applied=between-samples': 'Exits and returns',
  'learn.html#applied=period-vs-holding': 'Compare with holding',
  'lending.html#lesson=supply': 'Supply and collateral',
  'lending.html#lesson=borrow': 'Borrow without counting it as profit',
  'lending.html#lesson=conditions': 'Prices, interest and time',
  'lending.html#lesson=respond': 'Repay or add collateral',
  'lending.html#loop-lesson=build': 'Build one loop',
  'lending.html#loop-lesson=stress': 'Repeat and change conditions',
  'lending.html#loop-lesson=unwind': 'Explore unwinding',
});
