import { splitAtMaturity } from '../models/split-yield-v1.js';
import { splitAtExit } from '../models/split-yield-exit-v1.js';
import { fmt, formatTokenQuantity } from './format.js';

const cash = amount => fmt(amount) + ' USDC';
const element = id => document.getElementById(id);
const setText = (id, text) => { element(id).textContent = text; };

function showStrategy(prefix, value, budget) {
  setText(prefix + '-value', cash(value));
  const change = value - budget;
  const node = element(prefix + '-change');
  const tied = Math.abs(change) < 0.005;
  node.dataset.direction = tied ? 'flat' : change > 0 ? 'gain' : 'loss';
  node.textContent = tied ? 'Even with the starting budget' : (change > 0 ? 'Gain of ' : 'Loss of ') + cash(Math.abs(change));
}

export function showMaturity(input) {
  const result = splitAtMaturity(input);
  setText('strategy-pt-quantity', fmt(result.ptUnits) + ' PT bought');
  setText('strategy-pt-rate', 'Fixed APY at entry · ' + rateLabel(result.entryImpliedApy));
  setText('strategy-yt-quantity', fmt(result.ytUnits) + ' YT bought');
  for (const key of ['pt', 'yt', 'hold']) {
    showStrategy('strategy-' + key, result[key + 'Final'], input.budget);
  }
  setText('split-scenario-gross', cash(result.grossInterest));
  setText('split-scenario-apy', rateLabel(result.scenarioApy));
  setText('split-pt-target', cash(result.ptMatchGross));
  setText('split-pt-apy', rateLabel(result.entryImpliedApy));
  setText('split-recover', cash(result.recoverGross));
  setText('split-recover-apy', rateLabel(result.recoverApy));
  setText('split-match', result.matchGross === null ? 'No finite yield' : cash(result.matchGross));
  setText('split-match-apy', result.matchGross === null ? '—' : rateLabel(result.matchApy));
  const interpretation = result.matchGross === null
    ? 'At this entry price, holding stays ahead at every nonnegative yield.'
    : Math.abs(result.grossInterest - result.matchGross) < 1e-10 ? 'YT matches holding at maturity.'
    : result.grossInterest > result.matchGross ? 'YT recovers its cost and finishes ahead of holding.'
    : result.grossInterest >= result.recoverGross ? 'YT recovers its cost. Holding still finishes ahead.'
    : 'YT finishes below its purchase price.';
  setText('split-benchmark-note', interpretation);
}

function rateLabel(apy) {
  if (apy === null) return 'Too large to display';
  if (apy > 0 && apy < 0.005) return '<0.01%';
  if (apy >= 1e6) return apy.toExponential(2) + '%';
  return apy.toLocaleString('en-US', { maximumFractionDigits: 2 }) + '%';
}

export function showExit(input, exit) {
  const result = splitAtExit(input, exit);
  showStrategy('exit-pt', result.ptSale, input.budget);
  showStrategy('exit-yt', result.ytTotal, input.budget);
  showStrategy('exit-hold', result.holdValue, input.budget);
  setText('exit-pt-action', result.remainingDays ? 'Sell the principal claim' : 'Redeem the principal');
  setText('exit-yt-sale', cash(result.ytSale));
  setText('exit-yt-earned', cash(result.ytInterest));
  const saleShare = result.ytTotal > 0 ? result.ytSale / result.ytTotal * 100 : 0;
  element('exit-sale-bar').setAttribute('width', saleShare);
  element('exit-earned-bar').setAttribute('x', saleShare);
  element('exit-earned-bar').setAttribute('width', result.ytTotal > 0 ? 100 - saleShare : 0);

  setText('exit-price-caption', 'Same day, same time left. Prices per token in USDC on day ' + exit.exitDay + ', before trading costs.');
  setText('exit-entry-rate', result.entryImpliedApy === null ? 'Original entry rate' : 'Entry rate · ' + rateLabel(result.entryImpliedApy));
  setText('exit-scenario-rate', 'Exit rate · ' + rateLabel(exit.exitApy));
  for (const [id, price] of [['flat-pt', result.unchangedPtPrice], ['flat-yt', result.unchangedYtPrice],
    ['mark-pt', result.ptPrice], ['mark-yt', result.ytPrice]]) {
    setText('exit-' + id, formatTokenQuantity(price, 6, 2));
  }

  let reading;
  if (result.remainingDays === 0) {
    reading = 'At maturity, each PT redeems for 1 USDC. YT has no future interest left to sell. Its owner can still collect the interest already earned.';
  } else {
    const difference = result.ytTotal - result.unchangedYtTotal;
    if (Math.abs(difference) < 0.005) {
      reading = 'At these rates your YT position sells for the same amount to the nearest cent. The interest you keep depends on what the underlying earned by day ' + exit.exitDay + '.';
    } else {
      const higher = difference > 0;
      reading = 'At the ' + (higher ? 'higher' : 'lower') + ' exit rate, your YT sells for ' + cash(Math.abs(difference))
        + (higher ? ' more' : ' less') + ' than it would at the entry rate on this same day. PT moves '
        + (higher ? 'down' : 'up') + '. Your earned interest stays the same.';
    }
  }
  setText('exit-reading', reading);
}
