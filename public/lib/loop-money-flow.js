import { loopMoney, loopTokens } from './loop-presentation.js';
import { formatTokenQuantity } from './format.js';

// Read balances from the model's ledger, including wallet assets between actions.
export function renderLoopMoneyFlow(container, result) {
  const firstRound = result.steps.filter(step => step.round === 1);
  const stages = [
    { label: 'Start', title: 'Your original ETH is already supplied.',
      copy: 'It can back a loan. Nothing has been borrowed yet.', position: result.initial },
    { label: 'Borrow', title: 'Borrowed USDC enters your wallet.',
      copy: 'An equal debt appears. Your supplied ETH has not changed.', position: firstRound[0].position },
    { label: 'Buy ETH', title: 'Spend the USDC to buy ETH.',
      copy: 'The purchased ETH is in your wallet. It does not back the loan yet, and the debt is still owed.', position: firstRound[1].position },
    { label: 'Supply', title: 'Move the purchased ETH into collateral.',
      copy: 'It now backs the loan alongside your original ETH. Moving it does not repay any debt.', position: firstRound[2].position },
  ];
  const node = (tag, copy, className) => {
    const element = document.createElement(tag);
    if (copy !== undefined) element.textContent = copy;
    if (className) element.className = className;
    return element;
  };
  const heading = node('h4', 'Follow the money');
  const intro = node('p', 'Step through one round. ETH stays at ' + loopMoney(result.input.start) + '; this lesson leaves out interest and swap costs.', 'fine-print');
  const controls = node('div', undefined, 'loop-flow-stages');
  controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Choose a stage of the borrowing round');
  const title = node('p', undefined, 'loop-flow-title');
  const copy = node('p', undefined, 'loop-flow-copy');
  const balances = node('dl', undefined, 'loop-flow-balances');
  const values = {};
  for (const [key, label] of [['wallet', 'In your wallet'], ['supplied', 'Supplied as collateral'], ['debt', 'Debt still owed']]) {
    const row = node('div'), value = node('dd');
    value.id = 'loop-flow-' + key;
    values[key] = value;
    row.append(node('dt', label), value); balances.append(row);
  }
  const net = node('p', undefined, 'loop-flow-net');
  net.id = 'loop-flow-net';
  const note = node('p', 'Count wallet assets and supplied ETH, then subtract the debt. Borrowing adds assets and a matching obligation.', 'fine-print');
  const actions = node('div', undefined, 'loop-flow-actions');
  const previous = node('button', '← Previous', 'text-button'); previous.type = 'button'; previous.id = 'loop-flow-previous';
  const next = node('button', 'Next: Borrow →', 'text-button'); next.type = 'button'; next.id = 'loop-flow-next';
  actions.append(previous, next);
  const announcement = node('p', '', 'sr-only'); announcement.setAttribute('role', 'status');
  let index = 0;
  const buttons = stages.map((stage, i) => {
    const button = node('button', (i + 1) + '. ' + stage.label);
    button.type = 'button'; button.dataset.flowStage = String(i);
    button.addEventListener('click', () => show(i));
    controls.append(button); return button;
  });
  function show(stageIndex, announce = true) {
    index = stageIndex;
    const stage = stages[index], p = stage.position;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    title.textContent = stage.title; copy.textContent = stage.copy;
    values.wallet.replaceChildren(node('span', formatTokenQuantity(p.cash, 2) + ' USDC'), node('span', loopTokens(p.walletETH)));
    values.supplied.textContent = loopTokens(p.collateralTokens);
    values.debt.textContent = formatTokenQuantity(p.debt, 2) + ' USDC';
    net.textContent = 'Assets minus debt: ' + loopMoney(p.netAssets);
    previous.disabled = index === 0; next.disabled = index === stages.length - 1;
    next.textContent = next.disabled ? 'Round complete' : 'Next: ' + stages[index + 1].label + ' →';
    if (announce) announcement.textContent = 'Stage ' + (index + 1) + ' of 4. ' + stage.title + ' ' + stage.copy;
  }
  previous.addEventListener('click', () => { show(index - 1); if (previous.disabled) buttons[index].focus({ preventScroll: true }); });
  next.addEventListener('click', () => { show(index + 1); if (next.disabled) buttons[index].focus({ preventScroll: true }); });
  container.replaceChildren(heading, intro, controls, actions, title, copy, balances, net, note, announcement);
  show(0, false);
}
