import { LST_KEYS } from '../models/lst-loop-v1.js';
import { fmt, formatTokenQuantity } from './format.js';
import { healthLabel } from './lending-presentation.js';

const weth = value => formatTokenQuantity(value, 4) + ' WETH';
export function lstExperimentFacts(result, detailed = false) {
  const r = result, p = r.input;
  const rows = [
    ['Assets minus debt · before liquidation', weth(r.end.net)],
    ['Loop minus holding original wstETH', weth(r.vsHolding)],
    ['WETH debt', weth(r.end.debt)], ['Health factor', healthLabel(r.end.healthFactor)],
  ];
  if (!detailed) return rows;
  return [...rows,
    ['Starting wstETH / conversion rate', fmt(p.collateral, 4) + ' / ' + fmt(p.rate, 4) + ' stETH per wstETH'],
    ['Rounds / borrowing fraction', p.rounds + ' / ' + fmt(p.borrowPercent) + '%'],
    ['Staking / additional lending APY', fmt(p.stakingAPY) + '% / ' + fmt(p.lendingAPY) + '%'],
    ['Borrow APR', fmt(p.borrowAPR) + '%' + (p.rateChange ? ' → ' + fmt(p.laterAPR) + '% on day ' + p.changeDay : ' constant')],
    ['Time / market discount', fmt(p.days, 1) + ' days / ' + fmt(p.discount, 1) + '%'],
    ['Oracle assumption', p.oracleMode === 'market' ? 'Market discount' : 'Conversion rate'],
    ['Maximum LTV / liquidation threshold', fmt(p.maxLTV) + '% / ' + fmt(p.threshold) + '%'],
    ['Build / exit swap loss', fmt(p.swapCost) + '% / ' + fmt(p.exitCost) + '%'],
    ['Flash fee / flat exit cost', fmt(p.flashFee) + '% / ' + weth(p.gas)],
    ['Rate-only boundary during the period', r.firstRateBoundary === null ? 'Not reached' : 'Day ' + fmt(r.firstRateBoundary, 1)],
    ['Exit preview', r.exit.status === 'complete' ? weth(r.exit.cash) + ' after clearing debt' : 'Not run · ' + r.exit.status],
  ];
}
export function lstExperimentContext(entries) {
  const first = entries[0].inputs;
  if (!entries.every(entry => entry.inputs.collateral === first.collateral && entry.inputs.rate === first.rate)) {
    return 'Different starting wstETH or conversion rates. Each comparison keeps its own original tokens; these are not equivalent budgets.';
  }
  const shared = LST_KEYS.filter(key => !['rounds', 'borrowPercent', 'swapCost'].includes(key));
  if (!entries.every(entry => shared.every(key => entry.inputs[key] === first[key]))) {
    return 'Same starting wstETH, different conditions. Rates, discount, oracle or exit assumptions have not been synchronized; compare those assumptions before judging the outcomes.';
  }
  return 'Same starting wstETH, rates, time, discount, oracle and exit assumptions. Only construction choices may differ. The holding reference keeps the original wstETH without borrowing.';
}
