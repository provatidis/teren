import { loopTokens } from './loop-presentation.js';
import { formatTokenQuantity } from './format.js';

const node = (tag, copy, className) => {
  const element = document.createElement(tag);
  if (copy !== undefined) element.textContent = copy;
  if (className) element.className = className;
  return element;
};

// The arrows describe an action; the cards show its completed ledger balances.
// A debt card is an obligation, never the source of borrowed tokens.
export function createLoopFlowDiagram(id = 'loop-flow') {
  const element = node('dl', undefined, 'loop-flow-balances');
  const values = {}, cards = {}, routes = {};
  const walletCue = node('span', undefined, 'loop-flow-wallet-cue');
  walletCue.id = id + '-wallet-cue';
  for (const [key, label] of [['wallet', 'Your wallet'], ['supplied', 'ETH backing the loan'], ['debt', 'Debt']]) {
    const card = node('div'), term = node('dt', label), value = node('dd');
    card.dataset.pocket = key;
    value.id = id + '-' + key;
    if (key === 'wallet') { value.className = 'loop-flow-wallet'; term.append(' ', walletCue); }
    else {
      term.append(' ', node('small', key === 'supplied' ? 'Collateral' : 'USDC owed'));
      const route = node('span', undefined, 'loop-flow-route');
      route.id = id + '-route-' + key;
      route.setAttribute('aria-hidden', 'true');
      const label = node('span'), arrow = node('span', undefined, 'loop-flow-arrow');
      const dot = node('span', undefined, 'loop-flow-traveller');
      route.append(label, ' ', arrow, dot); term.append(route);
      routes[key] = { element: route, label, arrow };
    }
    card.append(term, ' ', value); element.append('\n', card);
    values[key] = value; cards[key] = card;
  }
  return {
    element,
    show(stage, animate) {
      element.dataset.motion = 'false';
      for (const animation of element.getAnimations({ subtree: true })) animation.cancel();
      const p = stage.position, action = stage.action;
      element.dataset.action = action;
      element.dataset.motion = String(animate);
      for (const key of Object.keys(cards)) {
        cards[key].dataset.changed = String(action !== 'start' && stage.changes[key] !== 'Unchanged');
      }
      values.wallet.replaceChildren(
        node('span', formatTokenQuantity(p.cash, 2) + ' USDC', 'loop-flow-token loop-flow-usdc'), ' ',
        node('span', loopTokens(p.walletETH), 'loop-flow-token loop-flow-eth'),
      );
      values.supplied.textContent = loopTokens(p.collateralTokens);
      values.debt.textContent = formatTokenQuantity(p.debt, 2) + ' USDC';
      const cues = {
        start: p.cash || p.walletETH ? 'Starting wallet balances' : 'No tokens in the wallet',
        borrow: 'Borrowed USDC arrives →',
        buy: 'Swap USDC → ETH',
        supply: 'ETH leaves your wallet',
        withdraw: 'ETH arrives in your wallet',
        sell: 'Swap ETH → USDC',
        repay: 'USDC leaves to repay the loan',
        release: 'The remaining ETH is yours to hold',
      };
      walletCue.textContent = cues[action];
      for (const [key, route] of Object.entries(routes)) {
        const up = action === 'withdraw' || action === 'release';
        const active = key === 'supplied' ? up || action === 'supply' : action === 'repay';
        route.element.dataset.active = String(active);
        route.element.dataset.direction = up ? 'up' : 'down';
        route.label.textContent = key === 'debt' ? 'Repay USDC' : up ? 'Withdraw ETH' : 'Supply ETH';
        route.arrow.textContent = up ? '↑' : '↓';
      }
      // Replay restarts only this action's short cue, never the financial state.
      if (animate) for (const animation of element.getAnimations({ subtree: true })) {
        animation.cancel(); animation.play();
      }
    },
  };
}
