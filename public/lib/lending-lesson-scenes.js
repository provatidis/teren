import { sceneNode as node, createActionPlayer } from './lesson-scene.js';
import { lendingFlowStages } from './lending-flow-stages.js';
import { fmt, usd } from './format.js';

function balances() {
  const element = node('figure', undefined, 'loan-scene-figure');
  const title = node('figcaption', 'Wallet, supply and debt', 'scene-figure-title');
  const cue = node('p', '', 'loan-scene-cue'); cue.id = 'loan-scene-cue';
  const list = node('dl', undefined, 'loan-scene-balances');
  const values = {}, rows = {};
  for (const [key, label] of [['wallet', 'Your wallet'], ['supply', 'Supplied ETH'], ['debt', 'Debt owed']]) {
    const row = node('div'), heading = node('dt', label), value = node('dd');
    row.dataset.pocket = key; value.id = 'loan-scene-' + key;
    row.append(heading, ' ', value); list.append('\n', row);
    rows[key] = row; values[key] = value;
  }
  const collateral = node('span', '', 'loan-scene-collateral'); collateral.id = 'loan-scene-collateral';
  rows.supply.querySelector('dt').append('\n', collateral);
  const totals = node('dl', undefined, 'loan-scene-totals');
  for (const [key, label] of [['capacity', 'Available to borrow'], ['net', 'Assets minus debt']]) {
    const row = node('div'), heading = node('dt', label), value = node('dd');
    value.id = 'loan-scene-' + key; row.append(heading, ' ', value); totals.append('\n', row);
    values[key] = value; rows[key] = row;
  }
  const cash = node('span', '', 'loan-scene-token loan-scene-usdc'); cash.id = 'loan-scene-cash';
  const eth = node('span', '', 'loan-scene-token loan-scene-eth'); eth.id = 'loan-scene-eth';
  values.wallet.append(eth, ' ', cash);
  element.append(title, '\n', cue, '\n', list, '\n', totals);
  return { element, show(stage, animate) {
    element.dataset.motion = 'false';
    for (const animation of element.getAnimations({ subtree: true })) animation.cancel();
    const p = stage.position;
    cue.textContent = stage.cue;
    eth.textContent = fmt(p.walletETH, 2) + ' ETH';
    cash.textContent = fmt(p.cash, 2) + ' USDC';
    values.supply.textContent = fmt(p.suppliedETH, 2) + ' ETH';
    values.debt.textContent = fmt(p.debt, 2) + ' USDC';
    collateral.textContent = 'Collateral ' + (p.collateralEnabled ? 'on' : 'off');
    collateral.dataset.enabled = String(p.collateralEnabled);
    values.capacity.textContent = usd(p.available);
    values.net.textContent = usd(p.netAssets);
    element.dataset.action = stage.action;
    for (const [key, row] of Object.entries(rows)) row.dataset.changed = String(stage.changed.includes(key));
    element.dataset.motion = String(animate);
    if (animate) for (const animation of element.getAnimations({ subtree: true })) {
      animation.cancel(); animation.play();
    }
  } };
}

// Scene selection is temporary. The controller owns answers, progress and the
// exact Experiment link; enabling collateral here cannot change any of them.
export function createLendingScene(result, lesson, prediction) {
  const flow = lendingFlowStages(result, lesson);
  const element = node('div', undefined, 'lesson-scene loan-scene'); element.dataset.lesson = lesson;
  const figure = balances();
  const copy = node('p', '', 'scene-consequence'); copy.id = 'loan-scene-copy';
  const scope = node('p', flow.scope, 'scene-question-scope'); scope.id = 'loan-scene-scope';
  const player = createActionPlayer({ id: 'loan-scene', stages: flow.stages, onShow(stage, animate) {
    figure.show(stage, animate); copy.textContent = stage.copy;
  } });
  element.append(node('p', flow.intro, 'loan-scene-intro'), '\n', figure.element, '\n', prediction, '\n',
    player.element, '\n', copy, '\n', scope, '\n', node('p', flow.note, 'fine-print'));
  return { element, showQuestion() { player.show(flow.questionIndex, false, false); } };
}
