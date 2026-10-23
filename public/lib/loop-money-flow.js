import { loopMoney } from './loop-presentation.js';
import { healthLabel } from './lending-presentation.js';
import { loopFlowStages } from './loop-flow-stages.js';
import { createLoopFlowDiagram } from './loop-flow-diagram.js';
import { sceneNode as node, createActionPlayer } from './lesson-scene.js';

// Read balances from the model's ledger, including wallet assets between actions.
export function renderLoopMoneyFlow(container, result, lesson = 'build', prediction) {
  const flow = loopFlowStages(result, lesson), { stages } = flow;
  const isUnwind = lesson === 'unwind';
  const intro = node('p', flow.intro, 'fine-print');
  const copy = node('p', undefined, 'loop-flow-copy'); copy.id = 'loop-flow-copy';
  const diagram = createLoopFlowDiagram();
  const health = node('p', undefined, 'loop-flow-health'); health.id = 'loop-flow-health'; health.hidden = !isUnwind;
  const details = node('details', undefined, 'loop-flow-details');
  details.append(node('summary', 'Balance details and assumptions'));
  const changes = {}, balanceChanges = node('dl', undefined, 'loop-flow-changes');
  for (const [key, label] of [['wallet', 'In your wallet'], ['supplied', 'Supplied as collateral'], ['debt', 'Debt still owed']]) {
    const row = node('div'), change = node('dd');
    change.id = 'loop-flow-' + key + '-change';
    changes[key] = change;
    row.append(node('dt', label), ' ', change); balanceChanges.append('\n', row);
  }
  const net = node('p', undefined, 'loop-flow-net');
  net.id = 'loop-flow-net';
  const costs = node('p', undefined, 'fine-print'); costs.id = 'loop-flow-costs'; costs.hidden = !isUnwind;
  const note = node('p', flow.note, 'fine-print');
  details.append(balanceChanges, costs, note);
  const limit = node('p', isUnwind
    ? 'Teaching example. Real withdrawals also depend on protocol rules and available funds.'
    : 'The price stays fixed here. More ETH would mean a bigger gain or loss if its price moved.', 'fine-print');
  const player = createActionPlayer({ id: 'loop-flow', stages, onShow(stage, animate) {
    const p = stage.position;
    copy.textContent = stage.copy;
    for (const key of Object.keys(changes)) changes[key].textContent = stage.changes[key];
    diagram.show(stage, animate);
    if (isUnwind) {
      health.textContent = p.debt === 0 ? 'No debt left to back.' : 'Health factor: ' + healthLabel(p.healthFactor) + ' · Supplied ETH backs debt.';
      costs.textContent = 'Swap losses during unwind so far: ' + loopMoney(stage.costs);
    }
    net.textContent = 'Assets minus debt: ' + loopMoney(p.netAssets);
  } });
  container.dataset.flow = lesson;
  container.replaceChildren(intro, '\n', diagram.element, '\n', ...(prediction ? [prediction, '\n'] : []), player, '\n', copy, '\n', health, '\n', net, '\n', limit, '\n', details);
}
