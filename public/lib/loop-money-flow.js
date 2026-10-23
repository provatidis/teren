import { loopMoney, loopTokens } from './loop-presentation.js';
import { formatTokenQuantity } from './format.js';

// Read balances from the model's ledger, including wallet assets between actions.
export function renderLoopMoneyFlow(container, result) {
  const firstRound = result.steps.filter(step => step.round === 1);
  const stages = [
    { label: 'Start', title: 'Your original ETH is already supplied.',
      copy: 'Your original ETH is supplied. The wallet is empty, and there is no debt.', position: result.initial },
    { label: 'Borrow', title: 'Borrowed USDC enters your wallet.',
      copy: 'Borrowed USDC enters the wallet. An equal debt appears; the supplied ETH is unchanged.', position: firstRound[0].position },
    { label: 'Buy ETH', title: 'Spend the USDC to buy ETH.',
      copy: 'The USDC is spent on ETH. This ETH is in your wallet and does not back the loan yet.', position: firstRound[1].position },
    { label: 'Supply', title: 'Move the purchased ETH into collateral.',
      copy: 'The new ETH moves into collateral. The debt stays unchanged.', position: firstRound[2].position },
  ];
  const node = (tag, copy, className) => {
    const element = document.createElement(tag);
    if (copy !== undefined) element.textContent = copy;
    if (className) element.className = className;
    return element;
  };
  const heading = node('h4', 'Follow the money');
  const intro = node('p', 'One round at ' + loopMoney(result.input.start) + '/ETH, without interest or swap costs.', 'fine-print');
  const controls = node('div', undefined, 'loop-flow-timeline');
  const label = node('label', 'Move through the round', 'sr-only'); label.htmlFor = 'loop-flow-slider';
  const selected = node('span', undefined, 'loop-flow-selected'); selected.id = 'loop-flow-selected';
  const slider = node('input');
  slider.type = 'range'; slider.id = 'loop-flow-slider'; slider.min = '0'; slider.max = '3'; slider.step = '1'; slider.value = '0';
  slider.setAttribute('aria-describedby', 'loop-flow-slider-help');
  const stops = node('ol', undefined, 'loop-flow-stops'); stops.setAttribute('aria-hidden', 'true');
  const markers = stages.map(stage => { const marker = node('li', stage.label); stops.append(marker); return marker; });
  const help = node('p', 'Move back to revisit earlier balances. You can also use Previous and Next.', 'sr-only');
  help.id = 'loop-flow-slider-help';
  const keyboardHelp = node('span', ' Arrow keys move one stage. Home and End go to the first and last stages.', 'sr-only');
  help.append(keyboardHelp);
  controls.append(label, selected, slider, stops, help);
  const copy = node('p', undefined, 'loop-flow-copy');
  const balances = node('dl', undefined, 'loop-flow-balances');
  const values = {}, changes = {}, rows = {};
  for (const [key, label] of [['wallet', 'In your wallet'], ['supplied', 'Supplied as collateral'], ['debt', 'Debt still owed']]) {
    const row = node('div'), value = node('dd'), change = node('small', undefined, 'loop-flow-change');
    value.id = 'loop-flow-' + key;
    change.id = 'loop-flow-' + key + '-change';
    values[key] = value; changes[key] = change; rows[key] = row;
    const term = node('dt', label); term.append(change);
    row.append(term, value); balances.append(row);
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
  const usdc = value => formatTokenQuantity(value, 2) + ' USDC';
  const actionChanges = [
    { wallet: 'Starting balance', supplied: 'Starting balance', debt: 'Starting balance' },
    { wallet: '+' + usdc(firstRound[0].amount) + ' borrowed', supplied: 'Unchanged', debt: '+' + usdc(firstRound[0].amount) + ' owed' },
    { wallet: usdc(firstRound[0].amount) + ' → ' + loopTokens(firstRound[1].amount), supplied: 'Unchanged', debt: 'Unchanged' },
    { wallet: '−' + loopTokens(firstRound[2].amount) + ' moved out', supplied: '+' + loopTokens(firstRound[2].amount) + ' moved in', debt: 'Unchanged' },
  ];
  function show(stageIndex, announce = true) {
    index = stageIndex;
    const stage = stages[index], p = stage.position;
    slider.value = String(index);
    slider.setAttribute('aria-valuetext', stage.label + ', stage ' + (index + 1) + ' of 4. ' + stage.title);
    selected.textContent = 'Stage ' + (index + 1) + ' of 4 · ' + stage.label;
    markers.forEach((marker, i) => { marker.dataset.current = String(i === index); });
    copy.textContent = stage.copy;
    for (const key of Object.keys(values)) {
      changes[key].textContent = actionChanges[index][key];
      rows[key].dataset.changed = String(index > 0 && actionChanges[index][key] !== 'Unchanged');
    }
    values.wallet.replaceChildren(node('span', formatTokenQuantity(p.cash, 2) + ' USDC'), node('span', loopTokens(p.walletETH)));
    values.supplied.textContent = loopTokens(p.collateralTokens);
    values.debt.textContent = formatTokenQuantity(p.debt, 2) + ' USDC';
    net.textContent = 'Assets minus debt: ' + loopMoney(p.netAssets);
    previous.disabled = index === 0; next.disabled = index === stages.length - 1;
    next.textContent = next.disabled ? 'Round complete' : 'Next: ' + stages[index + 1].label + ' →';
    if (announce) announcement.textContent = 'Stage ' + (index + 1) + ' of 4. ' + stage.title + ' ' + stage.copy;
  }
  // The native range announces its own value. Buttons need a separate short update.
  slider.addEventListener('input', () => show(Number(slider.value), false));
  previous.addEventListener('click', () => { show(index - 1); if (previous.disabled) slider.focus({ preventScroll: true }); });
  next.addEventListener('click', () => { show(index + 1); if (next.disabled) slider.focus({ preventScroll: true }); });
  container.replaceChildren(heading, intro, controls, actions, copy, balances, net, note, announcement);
  show(0, false);
}
