import { formatTokenQuantity } from './format.js';
import { healthLabel } from './lending-presentation.js';
import { sceneNode as node } from './lesson-scene.js';

const weth = value => formatTokenQuantity(value, 4) + ' WETH';
const stageLabels = { start: 'Starting position', discount: 'Market discount', market: 'Market-price lender' };

function amountRow(key, label, value, maximum) {
  const row = node('div', undefined, 'discount-amount');
  row.dataset.metric = key;
  const heading = node('div', undefined, 'condition-heading');
  heading.append(node('span', label), ' ', node('strong', weth(value)));
  const track = node('progress');
  track.setAttribute('aria-hidden', 'true');
  track.max = maximum;
  track.value = value;
  row.append(heading, track);
  return row;
}

export function createLSTDiscountScene(stages, prediction, onStage) {
  const element = node('div', undefined, 'lesson-scene lst-discount-scene');
  element.id = 'lst-lesson-scene';
  const figure = node('figure', undefined, 'discount-figure');
  figure.id = 'lst-lesson-figure';
  const controls = node('div', undefined, 'scene-shortcuts');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Compare the same loan');
  const buttons = {};
  for (const [key, label] of Object.entries(stageLabels)) {
    const button = node('button', label, 'scene-shortcut');
    button.type = 'button';
    button.dataset.lstLessonStage = key;
    button.setAttribute('aria-controls', figure.id);
    button.addEventListener('click', () => show(key, true));
    controls.append(button);
    buttons[key] = button;
  }
  controls.hidden = true;
  buttons.market.hidden = true;
  const status = node('span', '', 'sr-only');
  status.setAttribute('role', 'status');
  element.append(prediction, controls, figure, status);

  function show(key, announce = false) {
    const stage = stages[key], balance = stage.result.end;
    element.dataset.stage = key;
    for (const [name, button] of Object.entries(buttons)) button.setAttribute('aria-pressed', String(name === key));
    const caption = node('figcaption', stageLabels[key], 'scene-figure-title');
    const prices = node('p', 'Market price ' + weth(balance.marketPrice) + ' · Lender’s price ' + weth(balance.oraclePrice) + ' per wstETH.', 'discount-prices');
    const sale = amountRow('sale', 'Sale value of all ' + formatTokenQuantity(balance.collateral, 4) + ' wstETH', balance.collateralValue, stages.start.result.end.collateralValue);
    const debt = amountRow('debt', 'WETH owed', balance.debt, stages.start.result.end.collateralValue);
    const equity = node('div', undefined, 'condition-heading');
    equity.dataset.metric = 'equity';
    equity.append(node('span', 'Market value minus debt'), ' ', node('strong', weth(balance.net)));
    const health = node('div', undefined, 'condition-health');
    health.dataset.metric = 'health';
    health.append(node('span', 'Health factor'), ' ', node('strong', healthLabel(balance.healthFactor)));
    const eligible = balance.status === 'eligible';
    figure.dataset.state = balance.status;
    const note = eligible ? 'Eligible for liquidation below 1. These balances are before any liquidation.'
      : 'Above the liquidation boundary of 1.';
    figure.replaceChildren(caption, prices, sale, debt, equity, health, node('p', note, 'discount-status'));
    onStage(stage.href, stageLabels[key]);
    if (announce) status.textContent = stageLabels[key] + '. Sale value ' + weth(balance.collateralValue) +
      '. Debt ' + weth(balance.debt) + '. Health factor ' + healthLabel(balance.healthFactor) + '.';
  }
  show('start');
  return {
    element,
    showQuestion() { controls.hidden = false; show('discount'); },
    allowMarket() { buttons.market.hidden = false; },
  };
}

export function renderLSTMarketFollowup(container, stage) {
  const balance = stage.result.end;
  const heading = node('h4', 'With the market-price lender');
  const copy = node('p', 'The sale value is still ' + weth(balance.collateralValue) + ' and the debt is still ' +
    weth(balance.debt) + '. The lender now counts ' + weth(balance.oraclePrice) + ' per wstETH. The health factor falls to ' +
    healthLabel(balance.healthFactor) + ', below the liquidation boundary.');
  const lab = node('a', 'Explore the market-price loan in Experiment ↗', 'learn-explore');
  lab.href = stage.href;
  lab.target = '_blank';
  lab.rel = 'noopener noreferrer';
  container.replaceChildren(heading, copy, lab);
  container.hidden = false;
}
