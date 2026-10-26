import { loopFlowStages } from './loop-flow-stages.js';
import { createLoopFlowDiagram } from './loop-flow-diagram.js';
import { formatTokenQuantity } from './format.js';
import { sceneNode as node } from './lesson-scene.js';

// Read the first sale and its repayment from the same ledger as Observe.
// The application has its own display state and never moves that scene.
export function unwindApplicationStages(result) {
  const { stages } = loopFlowStages(result, 'unwind');
  const saleIndex = stages.findIndex(stage => stage.action === 'sell');
  const sale = stages[saleIndex], repayment = stages[saleIndex + 1];
  if (!sale || repayment?.action !== 'repay') {
    throw new RangeError('The application needs a sale followed by repayment.');
  }
  return { sale, repayment };
}

export function createUnwindApplication(result) {
  const { sale, repayment } = unwindApplicationStages(result);
  const id = 'unwind-application';
  const element = node('figure', undefined, 'unwind-application');
  element.id = id;
  const heading = node('figcaption', 'Paused after Sell ETH', 'scene-figure-title');
  heading.id = id + '-title';
  const scope = node('p', 'First pass · same fixed price and swap costs as Observe.', 'fine-print');
  const diagram = createLoopFlowDiagram(id);
  const button = node('button', 'Show the repayment', 'button secondary');
  button.id = id + '-show'; button.type = 'button'; button.hidden = true;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', id + '-contrast');
  const contrast = node('div', undefined, 'unwind-application-contrast');
  contrast.id = id + '-contrast'; contrast.hidden = true;
  contrast.setAttribute('role', 'status');
  const balances = node('dl', undefined, 'unwind-application-changes');
  for (const [key, label] of [['cash', 'Wallet USDC'], ['debt', 'USDC owed']]) {
    const row = node('div');
    const before = formatTokenQuantity(sale.position[key], 2);
    const after = formatTokenQuantity(repayment.position[key], 2);
    const value = node('dd', before + ' → ' + after + ' USDC');
    value.id = id + '-' + key + '-contrast';
    row.append(node('dt', label), ' ', value); balances.append(row);
  }
  contrast.append(
    node('p', 'After repayment', 'learn-setup-title'),
    balances,
    node('p', 'Wallet USDC and debt fall by the same amount. The remaining ETH stays supplied; less debt now needs backing.'),
  );
  element.append(heading, scope, diagram.element, button, contrast);
  diagram.show(sale, false);
  button.addEventListener('click', () => {
    const showRepayment = contrast.hidden;
    diagram.show(showRepayment ? repayment : sale, false);
    heading.textContent = showRepayment ? 'After Repay' : 'Paused after Sell ETH';
    contrast.hidden = !showRepayment;
    button.textContent = showRepayment ? 'Back to the paused question' : 'Show the repayment';
    button.setAttribute('aria-expanded', String(showRepayment));
  });
  return {
    element,
    allowReveal() { button.hidden = false; },
    reset() {
      diagram.show(sale, false);
      heading.textContent = 'Paused after Sell ETH';
      contrast.hidden = true;
      button.hidden = true;
      button.textContent = 'Show the repayment';
      button.setAttribute('aria-expanded', 'false');
    },
  };
}
