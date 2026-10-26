import { liquidityModel, isFullModel, isRangeModel } from '../models/liquidity-models.js';
import { scenarioHash } from './scenario-links.js';
import { rangeHash } from './range-links.js';
import { loanModel } from '../models/loan-models.js';
import { calculateLoop } from '../models/borrowing-loop-v1.js';
import { lstModel } from '../models/lst-models.js';
import { lstHash } from './lst-links.js';
import { lstExperimentFacts, lstExperimentContext } from './lst-presentation.js';
import { loanHash } from './lending-links.js';
import { loopHash } from './loop-links.js';
import { healthLabel, loanStatus } from './lending-presentation.js';
import { fmt, usd, signedUSD, percent, formatTokenQuantity } from './format.js';
import { STATE_COPY } from './range-presentation.js';

const names = { 'cp50-v2': 'V2-style full range', 'cl-range-v2': 'V3-style price range', 'cp50-v1': 'V2-style full range', 'cl-range-v1': 'V3-style price range', 'collateral-loan-v1': 'Single loan', 'collateral-loan-v2': 'Single loan', 'borrowing-loop-v1': 'Borrowing loop', 'lst-loop-v1': 'Correlated-asset loop', 'lst-loop-v2': 'Correlated-asset loop' };
export const experimentModelName = model => names[model];
export const experimentFamily = model => lstModel(model) ? 'correlated' : loanModel(model) || model === 'borrowing-loop-v1' ? 'lending' : 'liquidity';
export function experimentView(entry) {
  const family = experimentFamily(entry.model), modelName = experimentModelName(entry.model);
  if (family === 'correlated') {
    const result = lstModel(entry.model).calculateLST(entry.inputs);
    return { result, family, modelName, hash: lstHash(entry.inputs, 'hold', entry.comparison), page: 'lending.html', net: result.end.net };
  }
  if (family === 'lending') {
    const loop = entry.model === 'borrowing-loop-v1';
    const result = loop ? calculateLoop(entry.inputs) : loanModel(entry.model).calculateLoan(entry.inputs);
    const hash = loop ? loopHash(entry.inputs, entry.comparison?.rounds ?? null, entry.comparison?.borrowPercent ?? null, entry.liquidation ?? null)
      : loanHash(entry.inputs, entry.liquidation);
    return { result, family, modelName, hash, page: 'lending.html', net: loop ? result.end.netAssets : result.netAssets };
  }
  const result = liquidityModel(entry.model).calculate(entry.inputs);
  return { result, family, page: 'liquidity.html', initial: result.held ?? result.initial,
    hash: isFullModel(entry.model) ? scenarioHash(entry.inputs) : rangeHash(entry.inputs),
    modelName };
}
export function defaultExperimentName(draft) {
  const { result } = experimentView(draft);
  if (experimentFamily(draft.model) === 'correlated') return 'wstETH/WETH · ' + (draft.inputs.buildMode === 'target'
    ? formatTokenQuantity(draft.inputs.targetExposure, 3) + '×' + (draft.comparison ? ' vs ' + formatTokenQuantity(draft.comparison.targetExposure, 3) + '×' : ' starting tokens')
    : draft.inputs.rounds + ' rounds') + ' · ' + formatTokenQuantity(draft.inputs.discount, 6) + '% discount';
  if (experimentFamily(draft.model) === 'lending') {
    return draft.model === 'borrowing-loop-v1'
      ? draft.inputs.rounds + ' rounds · borrow ' + fmt(draft.inputs.borrowPercent) + '% · ETH → ' + usd(draft.inputs.future)
      : 'Loan · ' + fmt(draft.inputs.collateral, 4) + ' ETH · ' + usd(draft.inputs.borrow) + ' borrowed';
  }
  if (draft.origin?.kind === 'position') {
    const id = draft.origin.snapshot.tokenId;
    return 'Position #' + (id.length > 24 ? id.slice(0,18) + '…' + id.slice(-6) : id) + ' · range experiment';
  }
  if (isFullModel(draft.model)) return 'ETH ' + usd(result.initialPrice) + ' → ' + usd(result.futurePrice) + ' · fees ' + usd(result.feeIncome ?? result.fees);
  return 'Range ' + usd(result.lowerPrice) + '–' + usd(result.upperPrice) + ' · ETH → ' + usd(result.futurePrice);
}
export function experimentOriginLabel(origin, model) {
  if (!origin) return '';
  const snapshot = origin.snapshot;
  if (origin.kind === 'position') return 'Starting principal and range from Uniswap v3 position #' + snapshot.tokenId + ' at Ethereum block ' + snapshot.block.number + '. Already collectable tokens stay outside both strategies; future prices use the continuous range model. This saved source has not been refreshed.';
  return 'Starting price from a saved Uniswap v2 WETH/USDC snapshot at Ethereum block ' + snapshot.block.number + '. USDC = $1; this pool ratio seeds ' + (isFullModel(model) ? 'a hypothetical full-range position' : 'a hypothetical range position') + '. This saved source has not been refreshed.';
}
export const startingAssets = initial => fmt(initial.eth, 6) + ' ETH + ' + fmt(initial.usdc) + ' USDC';
export function comparisonContext(entries) {
  if (entries.length < 2) return '';
  if (entries.some(entry => experimentFamily(entry.model) !== experimentFamily(entries[0].model))) return 'Select experiments from one topic to compare their outcomes.';
  if (experimentFamily(entries[0].model) === 'correlated') return lstExperimentContext(entries);
  if (experimentFamily(entries[0].model) === 'lending') {
    const first = entries[0].inputs;
    const shared = keys => entries.every(entry => keys.every(key => entry.inputs[key] === first[key]));
    if (!shared(['collateral', 'start'])) return 'Different starting capital or prices. Each outcome uses its own original ETH; these saved snapshots are not a ranking of equivalent investments.';
    if (!shared(['future', 'days', 'supplyAPR', 'borrowAPR', 'maxLTV', 'threshold']) ||
      !entries.every(entry => (entry.inputs.interestMode ?? 'simple') === (first.interestMode ?? 'simple'))) {
      return 'Same original capital, different conditions or interest rules. These are saved scenarios; their market assumptions have not been synchronized. Use the loop lab to compare construction choices under shared conditions.';
    }
    return 'Same original ETH, prices, time, rates and collateral rules. Single loans keep borrowed cash; loops spend it on ETH. Outcomes are before liquidation and unwinding. Differences in construction and swap costs remain part of each saved setup.';
  }
  const views = entries.map(experimentView), first = views[0];
  const close = (a, b) => Math.abs(a - b) <= Math.max(1, Math.abs(a), Math.abs(b)) * 1e-12;
  const sameStart = views.every(view => view.result.investment === first.result.investment
    && view.result.initialPrice === first.result.initialPrice
    && close(view.initial.eth, first.initial.eth) && close(view.initial.usdc, first.initial.usdc));
  const sameFuture = views.every(view => view.result.futurePrice === first.result.futurePrice);
  if (!sameStart) return 'These experiments start with different budgets, prices or token mixes. Each LP outcome is compared with holding its own starting tokens; this is not a ranking of equivalent investments.';
  if (!sameFuture) return 'These experiments start with the same token basket but assume different future prices. Read them as different price scenarios, rather than a ranking at one market price.';
  return 'These experiments share the same starting token basket and future ETH price (' + usd(first.result.futurePrice) + '). Differences in LP outcomes follow from the saved models, ranges, durations, assumed fees and costs. These assumptions have not been synchronized.';
}

export function experimentSummary(entry) {
  const { result, family } = experimentView(entry);
  if (family === 'correlated') return fmt(entry.inputs.collateral, 4) + ' wstETH · ' + (entry.inputs.buildMode === 'target'
    ? formatTokenQuantity(entry.inputs.targetExposure, 3) + '×' + (entry.comparison ? ' setup / ' + formatTokenQuantity(entry.comparison.targetExposure, 3) + '× reference' : ' target')
    : entry.inputs.rounds + ' rounds') + ' · ' + formatTokenQuantity(entry.inputs.days, 6) + ' days · ' + formatTokenQuantity(entry.inputs.discount, 6) + '% market discount';
  if (family === 'lending') {
    const p = entry.inputs;
    return formatTokenQuantity(p.collateral, 4) + ' ETH · ETH ' + usd(p.start) + ' → ' + usd(p.future) + ' · ' + formatTokenQuantity(p.days, 2) + ' days';
  }
  return usd(result.investment) + ' · ETH ' + usd(result.initialPrice) + ' → ' + usd(result.futurePrice);
}

export function experimentFacts(entry, detailed = false) {
  const { result: r, family, initial, net } = experimentView(entry);
  if (family === 'correlated') return lstExperimentFacts(r, detailed, entry.comparison);
  if (family === 'lending') {
    const p = entry.inputs, loop = entry.model === 'borrowing-loop-v1';
    const rows = [
      ['Assets minus debt · before liquidation', usd(net)],
      ['Versus holding original ETH', signedUSD(net - r.holdingValue)],
      ['USDC debt', usd(r.end.debt)], ['Health factor', healthLabel(r.end.healthFactor)],
    ];
    if (!detailed) return rows;
    return [...rows, ['Loan status', loanStatus(r.end)],
      ['Liquidation boundary', r.end.boundaryPrice === null ? 'No debt' : usd(r.end.boundaryPrice) + '/ETH'],
      ['Original ETH', fmt(p.collateral, 6) + ' ETH'], ['Starting ETH price', usd(p.start)],
      ['Later ETH price', usd(p.future)], ['Time', formatTokenQuantity(p.days, 2) + ' days'],
      ['Supply / borrow APR', fmt(p.supplyAPR) + '% / ' + fmt(p.borrowAPR) + '%'],
      ['Interest', p.interestMode === 'compound' ? 'Continuous compounding' : 'Simple interest'],
      ['Maximum LTV / liquidation threshold', fmt(p.maxLTV) + '% / ' + fmt(p.threshold) + '%'],
      ...(loop ? [['Round count / borrowing fraction', p.rounds + ' / ' + fmt(p.borrowPercent) + '%'],
        ['Swap loss per swap', fmt(p.swapCost) + '%'],
        ['Saved reference', entry.comparison ? entry.comparison.rounds + ' rounds · ' + (entry.comparison.borrowPercent === null ? 'same borrowing fraction' : fmt(entry.comparison.borrowPercent) + '%') : 'None'],
        ['Unwind preview', r.unwind.status], ['Debt after preview', usd(r.unwind.remaining.debt)],
        ['Liquidation illustration', (entry.liquidation?.repayPercent ?? 50) + '% repayment · ' + (entry.liquidation?.bonusPercent ?? 5) + '% bonus']]
        : [['Borrowed cash in wallet', usd(r.borrowedCash)], ['Supply used as collateral', p.collateralEnabled ? 'Yes' : 'No'],
          ['Response budget', usd(p.budget)], ['Liquidation illustration', (entry.liquidation?.repayPercent ?? 50) + '% repayment · ' + (entry.liquidation?.bonusPercent ?? 5) + '% bonus']]),
    ];
  }
  const rows = [[r.costs === undefined ? 'LP + assumed cash fees' : 'LP after fees and costs', usd(r.lpValue)], ['Hold starting tokens', usd(r.holdValue)], ['LP minus holding', signedUSD(r.difference)]];
  if (!detailed) return rows;
  return [...rows, ['Starting investment', usd(r.investment)], ['Starting ETH price', usd(r.initialPrice)],
    ['Future ETH price', usd(r.futurePrice)], ['Starting tokens', startingAssets(initial)],
    ...(isRangeModel(entry.model) ? [['Price range', usd(r.lowerPrice) + ' – ' + usd(r.upperPrice)]] : []),
    ['Assumed LP cash fees', usd(r.feeIncome ?? r.fees)],
    ...(r.costs !== undefined ? [
      ['Fee assumption', r.feeMode === 'apr' ? fmt(r.feeAPR, 4) + '% average APR' : 'Total cash amount'],
      ['Duration', r.feeDays ? fmt(r.feeDays, 2) + ' days' : 'Not set'],
      ['Opening / collecting / closing', [r.openingCost, r.collectionCost, r.closingCost].map(usd).join(' / ')],
      ['LP costs total', usd(r.costs)], ['LP before costs', usd(r.lpGrossValue)],
      ['Required average fee APR', r.breakEvenAPR === null ? 'No duration set' : fmt(r.breakEvenAPR, 4) + '%'],
    ] : []), ['LP before fees', usd(r.lpBeforeFees)],
    ['IL before fees vs. holding', percent(r.impermanentLoss)], ['Total fees needed to match holding', usd(r.breakEvenFees)],
    ...(isRangeModel(entry.model) ? [['Endpoint range status', STATE_COPY[r.state].title], ['Separate 50/50 LP reference', usd(r.fullRange.lpValue)], ['Assumed 50/50 reference fees', usd(r.fullRangeFees)]] : []),
  ];
}
