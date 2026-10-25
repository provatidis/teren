import { calculateScenario } from '../models/cp50-v1.js';
import { formatTokenQuantity, usd } from '../lib/format.js';

// This independent teaching scene never edits the fee experiment or its ledger.
export function initFeeMechanics() {
  const $ = id => document.getElementById(id);
  const stages = [
    'ETH is $2,000 in the market and in this example pool. There is no price gap to trade here.',
    'The market price rises to $2,200. The pool has not traded yet, so it still offers ETH at a lower price.',
    'An arbitrage trader buys ETH from the pool with USDC and can sell it in the higher-priced market. The pool holds less ETH and more USDC; buying ETH also raises its pool price.',
  ];
  const buttons = [...document.querySelectorAll('[data-fee-arbitrage-stage]')];
  const inputs = { investment: 40000, initialPrice: 2000, futurePrice: 2200, fees: 0 };
  const outcome = calculateScenario(inputs);
  function render(stage) {
    $('fee-arbitrage-scene').dataset.stage = stage;
    $('fee-arbitrage-market').textContent = usd(stage === 0 ? 2000 : 2200);
    $('fee-arbitrage-pool').textContent = usd(stage === 2 ? 2200 : 2000);
    $('fee-arbitrage-eth').textContent = formatTokenQuantity(stage === 2 ? outcome.pooled.eth : 10, 4) + ' ETH';
    $('fee-arbitrage-usdc').textContent = formatTokenQuantity(stage === 2 ? outcome.pooled.usdc : 20000, 2, 2) + ' USDC';
    $('fee-arbitrage-caption').textContent = stages[stage];
    for (const button of buttons) button.setAttribute('aria-pressed', String(Number(button.dataset.feeArbitrageStage) === stage));
  }
  for (const button of buttons) button.addEventListener('click', () => render(Number(button.dataset.feeArbitrageStage)));
  function openFromLink() {
    if (location.hash === '#fee-mechanics') $('fee-mechanics').open = true;
  }
  render(0);
  window.addEventListener('hashchange', openFromLink);
  openFromLink();
}
