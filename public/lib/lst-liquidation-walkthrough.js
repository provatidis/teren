import { formatTokenQuantity } from './format.js';
import { learningChoices, renderPredictionFeedback } from './learning-elements.js';
import { focusSceneOutcome, sceneNode as node } from './lesson-scene.js';

const weth = value => formatTokenQuantity(value, 5) + ' WETH';
const predictions = [['less', 'Less than before.'], ['same', 'The same as before.'], ['more', 'More than before.']];

function positionTable(id, scenario) {
  const table = node('table', undefined, 'liquidation-ledger');
  table.id = id;
  table.append(node('caption', 'Your balances with a ' + scenario.input.bonus + '% liquidation bonus', 'sr-only'));
  const header = table.createTHead().insertRow();
  for (const label of ['Your position', 'Before', 'After']) {
    const cell = node('th', label);
    cell.scope = 'col';
    header.append(cell);
  }
  const body = table.createTBody();
  const before = scenario.result.end, after = scenario.result.liquidation.remaining;
  for (const [id, label, unit, key] of [
    ['collateral', 'Collateral', 'wstETH', 'collateral'],
    ['debt', 'Debt', 'WETH', 'debt'],
    ['equity', 'Value minus debt', 'WETH', 'net'],
  ]) {
    const row = body.insertRow();
    row.dataset.balance = id;
    const heading = node('th', label);
    heading.scope = 'row';
    heading.append(' ', node('small', unit));
    row.append(heading);
    const digits = key === 'collateral' ? 4 : 5;
    for (const balance of [before, after]) row.insertCell().textContent = formatTokenQuantity(balance[key], digits);
  }
  return table;
}

function liquidationLink(id, scenario) {
  const link = node('a', 'Try a ' + scenario.input.bonus + '% bonus in the lab ↗', 'learn-explore');
  Object.assign(link, { id, href: scenario.href, target: '_blank', rel: 'noopener noreferrer' });
  return link;
}

export function liquidationWalkthrough({ withBonus, zeroBonus }) {
  const details = node('details', undefined, 'liquidation-walk');
  details.id = 'lst-liquidation-walkthrough';
  details.append(node('summary', 'What if a liquidator acts?'));
  const { end, liquidation } = withBonus.result;
  details.append(node('p', 'The liquidator repays ' + withBonus.input.repayPercent + '% of your debt for a ' +
    withBonus.input.bonus + '% bonus. The market and the lender still value each wstETH at ' + weth(end.marketPrice) + '.'));

  const transfers = node('dl', undefined, 'liquidation-transfers');
  for (const [label, amount] of [
    ['The liquidator pays the lender', weth(liquidation.repay)],
    ['The liquidator takes from your collateral', formatTokenQuantity(liquidation.seized, 4) + ' wstETH'],
  ]) {
    const row = node('div');
    row.append(node('dt', label), node('dd', amount));
    transfers.append(row);
  }
  details.append(transfers, positionTable('lst-liquidation-ledger', withBonus),
    node('p', 'The collateral taken is worth ' + weth(liquidation.marketValueTaken) + '. Of that, ' + weth(liquidation.repay) +
      ' clears debt. The extra ' + weth(liquidation.bonusAtOracle) + ' goes to the liquidator as a bonus.'),
    liquidationLink('lst-liquidation-lab', withBonus));

  const question = node('fieldset', undefined, 'learn-fieldset');
  question.append(node('legend', 'Start again with the same loan. The price stays fixed and the bonus is zero. You end up with fewer wstETH. Compared with just before liquidation, what is your position worth after debt?'));
  const choices = node('div', undefined, 'learn-choices');
  question.append(choices);
  const reveal = node('button', 'See what happens with no bonus →', 'button secondary');
  Object.assign(reveal, { id: 'lst-zero-reveal', type: 'button' });
  reveal.setAttribute('aria-controls', 'lst-zero-outcome');
  reveal.setAttribute('aria-expanded', 'false');
  const outcome = node('div');
  outcome.id = 'lst-zero-outcome';
  outcome.hidden = true;
  const feedback = node('div', undefined, 'learn-prediction-feedback');
  feedback.id = 'lst-zero-feedback';
  outcome.append(feedback, positionTable('lst-zero-ledger', zeroBonus), liquidationLink('lst-zero-lab', zeroBonus));
  learningChoices(choices, {
    name: 'lst-zero-prediction', values: predictions, shuffle: false,
    onChange() {
      outcome.hidden = true;
      reveal.setAttribute('aria-expanded', 'false');
    },
  });
  reveal.addEventListener('click', () => {
    const event = zeroBonus.result.liquidation;
    const selected = choices.querySelector('input:checked')?.value;
    renderPredictionFeedback(feedback, predictions, selected, 'same', 'Collateral worth ' + weth(event.marketValueTaken) +
      ' leaves your position, and ' + weth(event.repay) + ' of debt is repaid. Your position is still worth ' +
      weth(event.remaining.net) + ' after debt.');
    outcome.hidden = false;
    reveal.setAttribute('aria-expanded', 'true');
    focusSceneOutcome(outcome);
  });
  details.append(question, reveal, outcome);
  return details;
}
