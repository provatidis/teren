import { LST_KEYS } from '../models/lst-loop-v1.js';
import { fmt, formatTokenQuantity } from './format.js';
import { healthLabel } from './lending-presentation.js';

const weth = value => formatTokenQuantity(value, 4) + ' WETH';
const wsteth = value => formatTokenQuantity(value, 4) + ' wstETH';
const signed = (value, unit = weth) => (value > 0 ? '+' : value < 0 ? '−' : '') + unit(Math.abs(value));

export function lstExitCopy(result) {
  const e = result.exit;
  return {
    complete: (result.end.debt > 0 ? 'The assumed exit clears both debts and ' : 'The assumed exit releases the collateral and ')
      + (e.mode === 'wsteth' ? 'leaves the unsold wstETH in your wallet.' : 'converts the remaining value to WETH.'),
    boundary: 'Exit preview stopped: the current position is at the boundary, below it, or would already have reached it under the assumed rates. Actual liquidation would change these balances.',
    unavailable: 'Exit unavailable under your assumptions. Collateral stays supplied and all debt remains owed.',
    shortfall: 'The sale cannot cover repayment and the assumed costs. ' + weth(e.shortfall) + ' of additional funding would be needed; the preview does not add it.',
  }[e.status];
}

export function lstExitFacts(result) {
  const r = result, e = r.exit;
  if (e.status !== 'complete') return [
    ['Collateral still supplied', wsteth(r.end.collateral)], ['WETH debt still owed', weth(r.end.debt)],
    ['Market assets minus debt · before liquidation', weth(r.end.net)],
  ];
  const destination = e.mode === 'wsteth' ? [
    ['wstETH kept in the wallet', wsteth(e.retained)], ['wstETH sold for repayment and costs', wsteth(e.sold)],
    ['Holding original wstETH · no exit transaction', wsteth(r.input.collateral)],
    ['Retained tokens minus original tokens', signed(e.retained - r.input.collateral, wsteth)],
  ] : [
    ['WETH after the complete exit', weth(e.cash)],
    ['Holding, sold with the same swap and flat costs', r.holdingAfterExit < 0 ? 'Costs exceed proceeds' : weth(r.holdingAfterExit)],
    ['Loop minus holding after these exits', r.holdingAfterExit < 0 ? 'Comparison unavailable' : signed(e.cash - r.holdingAfterExit)],
  ];
  return [...destination, ['WETH debt remaining', weth(0)], ['Exit swap loss', weth(e.swapLoss)],
    ['Flash loan fee', weth(e.flashCost)], ['Flat exit cost', weth(e.gas)]];
}
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
    ['Construction', p.buildMode === 'target' ? fmt(p.targetExposure, 3) + '× starting wstETH · flash-assisted target' : p.rounds + ' rounds · ' + fmt(p.borrowPercent) + '% borrowing fraction'],
    ['Build flash fee', p.buildMode === 'target' ? fmt(p.buildFlashFee, 3) + '% · ' + weth(r.buildFlashCost) : 'None in round-by-round construction'],
    ['Staking / additional lending APY', fmt(p.stakingAPY) + '% / ' + fmt(p.lendingAPY) + '%'],
    ['Borrow APR', fmt(p.borrowAPR) + '%' + (p.rateChange ? ' → ' + fmt(p.laterAPR) + '% on day ' + p.changeDay : ' constant')],
    ['Time / market discount', fmt(p.days, 1) + ' days / ' + fmt(p.discount, 1) + '%'],
    ['Oracle assumption', p.oracleMode === 'market' ? 'Market discount' : 'Conversion rate'],
    ['Maximum LTV / liquidation threshold', fmt(p.maxLTV) + '% / ' + fmt(p.threshold) + '%'],
    ['Build / exit swap loss', fmt(p.swapCost) + '% / ' + fmt(p.exitCost) + '%'],
    ['Flash fee / flat exit cost', fmt(p.flashFee) + '% / ' + weth(p.gas)],
    ['Rate-only boundary during the period', r.firstRateBoundary === null ? 'Not reached' : 'Day ' + fmt(r.firstRateBoundary, 1)],
    ['Exit destination', p.exitMode === 'wsteth' ? 'Keep unsold wstETH' : 'Sell all to WETH'],
    ['Exit preview', r.exit.status === 'complete' ? (p.exitMode === 'wsteth' ? wsteth(r.exit.retained) : weth(r.exit.cash)) + ' after clearing debt' : 'Not run · ' + r.exit.status],
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
  if (!entries.every(entry => (entry.inputs.exitMode ?? 'weth') === (first.exitMode ?? 'weth'))) {
    return 'Same market conditions, different exit destinations. Before-exit balances are comparable; WETH proceeds and retained wstETH have different ongoing exposure.';
  }
  return 'Same starting wstETH, rates, time, discount, oracle and exit assumptions. Only construction choices may differ. The holding reference keeps the original wstETH without borrowing.';
}
