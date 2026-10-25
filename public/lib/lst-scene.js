import { formatTokenQuantity } from './format.js';
import { healthLabel } from './lending-presentation.js';

const quantity = (value, token) => formatTokenQuantity(value, 4) + ' ' + token;
const descriptions = {
  start: ['Starting balances', 'The wstETH is supplied as collateral. Count the assets and every outstanding obligation.'],
  borrow: ['Borrow WETH', 'WETH enters the wallet and an equal debt appears. Borrowing itself adds no net wealth.'],
  buy: ['Buy wstETH', 'The borrowed WETH is spent. Purchased wstETH stays in the wallet until it is supplied.'],
  supply: ['Supply the purchased wstETH', 'The wstETH moves from wallet to collateral. The debt stays the same.'],
  flash: ['Take a temporary flash loan', 'The wallet receives WETH and owes the same amount to the flash lender. Both debts are counted.'],
  repay: ['Repay the original WETH debt', 'Spend the flash-borrowed WETH to repay the collateralized loan. The flash loan still has to be settled.'],
  release: ['Release the collateral', 'The original loan is cleared. The wstETH moves into the wallet; the flash obligation remains.'],
  sell: ['Sell the wstETH for WETH', 'Use the market sale price, after the assumed swap loss. The conversion rate alone does not determine these proceeds.'],
  settle: ['Settle the temporary loan and costs', 'Repay the flash principal and fee, then subtract the flat exit cost. Only the remaining WETH belongs to you.'],
};

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function createLSTScene(root, mode) {
  let current = null, index = 0, steps = [];
  const prefix = 'lst-' + mode + '-scene';
  const label = node('p', '', 'eyebrow');
  label.id = prefix + '-step'; label.setAttribute('aria-live', 'polite');
  const title = node('h3'); title.id = prefix + '-title';
  const route = node('p', '', 'lst-scene-route');
  const copy = node('p', '', 'body-copy');
  const balances = node('dl', undefined, 'lst-scene-balances');
  const net = node('p', '', 'lst-inline-result'); net.id = prefix + '-net';
  const controls = node('div', undefined, 'lst-scene-controls');
  const previous = node('button', '← Previous', 'button secondary'); previous.id = prefix + '-previous'; previous.type = 'button';
  const next = node('button', 'Next →', 'button secondary'); next.id = prefix + '-next'; next.type = 'button';
  controls.append(previous, next);
  root.replaceChildren(label, title, route, copy, balances, net, controls);

  function draw() {
    const step = steps[index], p = step.position;
    root.dataset.action = step.action;
    label.textContent = (mode === 'build' && step.round ? 'Round ' + step.round + ' · ' : '') + 'Step ' + (index + 1) + ' of ' + steps.length;
    const [heading, explanation] = descriptions[step.action];
    title.textContent = heading;
    copy.textContent = explanation;
    route.textContent = {
      start: 'Collateral · wallet · obligations', borrow: 'Lender → wallet + WETH debt',
      buy: 'WETH → wstETH', supply: 'Wallet → collateral', flash: 'Flash lender → wallet + temporary debt',
      repay: 'Wallet → original lender', release: 'Collateral → wallet', sell: 'wstETH → WETH',
      settle: 'Wallet → flash lender + costs',
    }[step.action];
    const entries = [
      ['Supplied collateral', quantity(p.collateral, 'wstETH'), 'collateral'],
      ['In the wallet', quantity(p.walletWETH, 'WETH') + ' + ' + quantity(p.walletLST, 'wstETH'), 'wallet'],
      ['WETH debt', quantity(p.debt, 'WETH'), 'debt'],
      ...(mode === 'exit' ? [['Temporary flash debt', quantity(p.flashDebt, 'WETH'), 'debt']] : []),
    ];
    balances.replaceChildren(...entries.map(([name, value, kind]) => {
      const row = node('div'); row.dataset.kind = kind;
      row.append(node('dt', name), node('dd', value)); return row;
    }));
    net.textContent = 'Assets minus all debt: ' + quantity(p.net, 'WETH') + (mode === 'build' ? ' · Health factor: ' + healthLabel(p.healthFactor) : '');
    previous.disabled = index === 0;
    next.disabled = index === steps.length - 1;
    if (mode === 'exit' && current.exit.status !== 'complete') {
      title.textContent = 'Exit not run';
      copy.textContent = 'No assets move in this preview. The collateral and WETH debt remain in place.';
    }
  }
  previous.addEventListener('click', () => { index = Math.max(0, index - 1); draw(); });
  next.addEventListener('click', () => { index = Math.min(steps.length - 1, index + 1); draw(); });
  return {
    render(result, reset = false) {
      current = result;
      steps = mode === 'build' ? result.steps : result.exit.steps.length ? result.exit.steps : [{ action: 'start', position: result.end }];
      index = reset ? 0 : Math.min(index, steps.length - 1);
      draw();
    },
  };
}
