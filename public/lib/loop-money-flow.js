import { loopMoney, loopTokens } from './loop-presentation.js';
import { formatTokenQuantity } from './format.js';
import { healthLabel } from './lending-presentation.js';
import { loopFlowStages } from './loop-flow-stages.js';

// Read balances from the model's ledger, including wallet assets between actions.
export function renderLoopMoneyFlow(container, result, lesson = 'build') {
  const flow = loopFlowStages(result, lesson), { stages } = flow;
  const isUnwind = lesson === 'unwind';
  const node = (tag, copy, className) => {
    const element = document.createElement(tag);
    if (copy !== undefined) element.textContent = copy;
    if (className) element.className = className;
    return element;
  };
  const heading = node('h4', 'Follow the money');
  const intro = node('p', flow.intro, 'fine-print');
  const controls = node('div', undefined, 'loop-flow-timeline');
  const label = node('label', flow.sliderLabel, 'sr-only'); label.htmlFor = 'loop-flow-slider';
  const selected = node('span', undefined, 'loop-flow-selected'); selected.id = 'loop-flow-selected';
  const slider = node('input');
  slider.type = 'range'; slider.id = 'loop-flow-slider'; slider.min = '0'; slider.max = String(stages.length - 1); slider.step = '1'; slider.value = '0';
  slider.setAttribute('aria-describedby', 'loop-flow-slider-help');
  const stops = node('ol', undefined, 'loop-flow-stops'); stops.setAttribute('aria-hidden', 'true');
  if (isUnwind) stops.classList.add('loop-flow-stops-compact');
  const markers = stages.map((stage, i) => {
    const marker = node('li', isUnwind ? String(i + 1) : stage.label);
    stops.append(marker); return marker;
  });
  const help = node('p', 'Move back to revisit earlier balances. You can also use Previous and Next.', 'sr-only');
  help.id = 'loop-flow-slider-help';
  const keyboardHelp = node('span', ' Arrow keys move one stage. Home and End go to the first and last stages.', 'sr-only');
  help.append(keyboardHelp);
  controls.append(label, selected, slider, stops, help);
  const copy = node('p', undefined, 'loop-flow-copy');
  const health = node('p', undefined, 'loop-flow-health'); health.id = 'loop-flow-health'; health.hidden = !isUnwind;
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
  const costs = node('p', undefined, 'fine-print'); costs.id = 'loop-flow-costs'; costs.hidden = !isUnwind;
  const note = node('p', flow.note, 'fine-print');
  const actions = node('div', undefined, 'loop-flow-actions');
  const previous = node('button', '← Previous', 'text-button'); previous.type = 'button'; previous.id = 'loop-flow-previous';
  const next = node('button', 'Next: Borrow →', 'text-button'); next.type = 'button'; next.id = 'loop-flow-next';
  actions.append(previous, next);
  const announcement = node('p', '', 'sr-only'); announcement.setAttribute('role', 'status');
  let index = 0;
  function show(stageIndex, announce = true) {
    index = stageIndex;
    const stage = stages[index], p = stage.position;
    slider.value = String(index);
    const progress = 'Stage ' + (index + 1) + ' of ' + stages.length;
    slider.setAttribute('aria-valuetext', stage.label + ', ' + progress.toLowerCase() + '. ' + stage.title);
    selected.textContent = progress + ' · ' + stage.label;
    markers.forEach((marker, i) => { marker.dataset.current = String(i === index); });
    copy.textContent = stage.copy;
    for (const key of Object.keys(values)) {
      changes[key].textContent = stage.changes[key];
      rows[key].dataset.changed = String(index > 0 && stage.changes[key] !== 'Unchanged');
    }
    values.wallet.replaceChildren(node('span', formatTokenQuantity(p.cash, 2) + ' USDC'), node('span', loopTokens(p.walletETH)));
    values.supplied.textContent = loopTokens(p.collateralTokens);
    values.debt.textContent = formatTokenQuantity(p.debt, 2) + ' USDC';
    if (isUnwind) {
      health.textContent = p.debt === 0 ? 'No debt left to back.' : 'Health factor: ' + healthLabel(p.healthFactor) + ' · Supplied ETH backs debt.';
      costs.textContent = 'Swap losses during unwind so far: ' + loopMoney(stage.costs);
    }
    net.textContent = 'Assets minus debt: ' + loopMoney(p.netAssets);
    previous.disabled = index === 0; next.disabled = index === stages.length - 1;
    next.textContent = next.disabled ? flow.completeLabel : 'Next: ' + stages[index + 1].label + ' →';
    if (announce) announcement.textContent = progress + '. ' + stage.title + ' ' + stage.copy;
  }
  // The native range announces its own value. Buttons need a separate short update.
  slider.addEventListener('input', () => show(Number(slider.value), false));
  previous.addEventListener('click', () => { show(index - 1); if (previous.disabled) slider.focus({ preventScroll: true }); });
  next.addEventListener('click', () => { show(index + 1); if (next.disabled) slider.focus({ preventScroll: true }); });
  container.dataset.flow = lesson;
  container.replaceChildren(heading, intro, controls, actions, copy, health, balances, net, costs, note, announcement);
  show(0, false);
}
