import { usd } from './format.js';
import { scenarioHash } from './scenario-links.js';
import { rangeHash } from './range-links.js';

// A price times a width leaves float noise (1650.0000000000002). The link
// carries clean prices; the lesson's own maths keeps the exact ones.
const tidy = value => Number(value.toPrecision(12));

// "Look closer": one question to take into a lab, and a link that names the
// lab it opens. Each instruction is one the reader can carry out from the
// example the link opens, in every variation. Every reader gets the same link
// whatever they predicted.
export function lessonHandoff(id, outcome, task) {
  const s = outcome.setup, r = outcome.result;
  // The challenge opens the reader's own example. Its result card keeps the worked one.
  const own = id === 'final-challenge' && task ? { ...s, futurePrice: task.price, fees: task.fees } : s;
  const hash = id === 'range-boundaries'
    ? rangeHash({ ...r, initialPrice: tidy(r.initialPrice), futurePrice: tidy(r.futurePrice), lowerPrice: tidy(r.lowerPrice), upperPrice: tidy(r.upperPrice) })
    : r ? scenarioHash(own) : '#swap-sandbox';
  const [question, link, note] = {
    'swap-impact': () => ['How big is my trade against the pool?', 'Open the swap sandbox ↗', 'Compare two trade sizes there before executing either. It opens in a new tab and keeps its own balances.'],
    'pool-share': () => ['What do I own now?', 'Open the swap sandbox ↗', 'Add liquidity there, make a trade, then compare what you could withdraw with what you put in. It opens in a new tab.'],
    'token-balances': () => ['Move the price away and back. What returns?', 'Open this example in the full-range lab ↗', 'Opens ETH at ' + usd(s.futurePrice) + ' with your starting tokens, in a new tab.'],
    // After a rise the claim is up on its start and behind holding, and fees
    // below the gap keep it there. After a fall no fee amount can do that, so
    // the instruction asks for the mirror image: ahead of holding, still down.
    'loss-vs-profit': () => ['Compared with what?', 'Open this example in the full-range lab ↗',
      (s.futurePrice < s.initialPrice ? 'Keep ETH at ' + usd(s.futurePrice) + '. Can fees put your claim ahead of holding while you’re still down on your start?'
        : s.futurePrice > s.initialPrice ? 'Add fees there and find a gain on your start that still trails holding.'
          : 'Move the price there, add fees, and compare your claim with your start and with holding.') + ' It opens in a new tab.'],
    'fee-break-even': () => ['Match holding, then move the price. Does the match hold?', 'Open this example in the full-range lab ↗', 'Opens ETH at ' + usd(s.futurePrice) + ' with ' + usd(s.fees) + ' in fees, in a new tab.'],
    'range-boundaries': () => ['What happens past the edge?', 'Open this range in the range lab ↗', 'Move its ends and the price there, and see where it runs out of a token. It opens in a new tab.'],
    'final-challenge': () => ['Does your example still match holding once costs are counted?', 'Open your example in the full-range lab ↗', 'Opens ETH at ' + usd(own.futurePrice) + ' with ' + usd(own.fees) + ' in fees, in a new tab. Add the costs there.'],
  }[id]();
  return { question, link, note, hash };
}
