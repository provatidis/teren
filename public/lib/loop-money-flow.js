import { loopMoney } from './loop-presentation.js';
import { healthLabel } from './lending-presentation.js';
import { loopFlowStages } from './loop-flow-stages.js';
import { createLoopFlowDiagram } from './loop-flow-diagram.js';
import { sceneNode as node, createActionPlayer } from './lesson-scene.js';

// Read balances from the model's ledger, including wallet assets between actions.
export function renderLoopMoneyFlow(container, result, lesson = 'build', prediction, options = {}) {
  const id = options.id || 'loop-flow';
  const flow = loopFlowStages(result, lesson, options), { stages } = flow;
  const isUnwind = lesson === 'unwind';
  const intro = node('p', flow.intro, 'fine-print');
  const copy = node('p', undefined, 'loop-flow-copy'); copy.id = id + '-copy';
  const diagram = createLoopFlowDiagram(id);
  const health = node('p', undefined, 'loop-flow-health'); health.id = id + '-health'; health.hidden = !isUnwind && !options.allRounds;
  const details = node('details', undefined, 'loop-flow-details');
  details.append(node('summary', 'Balance details and assumptions'));
  const changes = {}, balanceChanges = node('dl', undefined, 'loop-flow-changes');
  for (const [key, label] of [['wallet', 'In your wallet'], ['supplied', 'Supplied as collateral'], ['debt', 'Debt still owed']]) {
    const row = node('div'), change = node('dd');
    change.id = id + '-' + key + '-change';
    changes[key] = change;
    row.append(node('dt', label), ' ', change); balanceChanges.append('\n', row);
  }
  const net = node('p', undefined, 'loop-flow-net');
  net.id = id + '-net';
  const costs = node('p', undefined, 'fine-print'); costs.id = id + '-costs'; costs.hidden = !isUnwind;
  const note = node('p', flow.note, 'fine-print');
  details.append(balanceChanges, costs, note);
  const limit = node('p', isUnwind
    ? 'Teaching example. Real withdrawals also depend on protocol rules and available funds.'
    : 'The price stays fixed here. More ETH would mean a bigger gain or loss if its price moved.', 'fine-print');
  const player = createActionPlayer({ id, stages, onShow(stage, animate) {
    const p = stage.position;
    copy.textContent = stage.copy;
    for (const key of Object.keys(changes)) changes[key].textContent = stage.changes[key];
    diagram.show(stage, animate);
    if (isUnwind || options.allRounds) {
      health.textContent = p.debt === 0 ? 'No debt left to back.' : 'Health factor: ' + healthLabel(p.healthFactor) + ' · Supplied ETH backs debt.';
      costs.textContent = 'Swap losses during unwind so far: ' + loopMoney(stage.costs);
    }
    net.textContent = 'Assets minus debt: ' + loopMoney(p.netAssets);
  } });
  if (stages.length === 1) player.element.hidden = true;
  container.dataset.flow = lesson;
  container.replaceChildren(intro, '\n', ...(prediction ? [prediction, '\n'] : []), diagram.element, '\n', player.element, '\n', copy, '\n', health, '\n', net, '\n', limit, '\n', details);
  return { showQuestion() { player.show(stages.length - 1, false, false); } };
}
