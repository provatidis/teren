import { sceneNode, createSceneExplorer } from './lesson-scene.js';
import { fmt } from './format.js';

function claimCard([label, value, role], animate) {
  const card = sceneNode('div', undefined, animate ? 'yl-claim yl-changed' : 'yl-claim');
  card.dataset.role = role;
  card.append(sceneNode('dt', label), ' ', sceneNode('dd', value));
  return card;
}

function drawBars({ items, max, unit }, previous) {
  const list = sceneNode('dl', undefined, 'yl-bars');
  for (const { label, role, value } of items) {
    const row = sceneNode('div', undefined, 'yl-bar');
    row.dataset.role = role;
    const amount = sceneNode('dd', fmt(value) + ' ' + unit);
    const fill = document.createElement('progress');
    fill.setAttribute('aria-hidden', 'true');
    fill.max = max;
    fill.value = value;
    if (previous && !previous.items.some(item => item.label === label && item.value === value)) amount.classList.add('yl-changed');
    const track = sceneNode('dd', undefined, 'yl-bar-track');
    track.setAttribute('aria-hidden', 'true');
    track.append(fill);
    row.append(sceneNode('dt', label), ' ', amount, ' ', track);
    list.append(row);
  }
  return list;
}

function paymentReceipt({ from, to, value }, animate) {
  const receipt = sceneNode('div', undefined, animate ? 'yl-transfer yl-changed' : 'yl-transfer');
  const label = sceneNode('span', 'Payment for YT');
  const arrow = sceneNode('span', ' → ');
  arrow.setAttribute('aria-hidden', 'true');
  const direction = sceneNode('strong', from);
  direction.append(arrow, sceneNode('span', ' to ', 'sr-only'), to);
  receipt.append(label, ' ', direction, ' ', sceneNode('span', value));
  return receipt;
}

function drawRatePath({ days, switchDay, firstApy, secondApy }) {
  const group = sceneNode('div', undefined, 'yl-time-path');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 ' + days + ' 1');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const key = sceneNode('div', undefined, 'yl-time-labels');
  for (const [name, start, length, rate] of [['first', 0, switchDay, firstApy], ['later', switchDay, days - switchDay, secondApy]]) {
    const segment = document.createElementNS(svg.namespaceURI, 'rect');
    segment.setAttribute('x', start);
    segment.setAttribute('width', length);
    segment.setAttribute('height', 1);
    segment.setAttribute('class', 'yl-time-' + name);
    svg.append(segment);
    key.append(sceneNode('span', (length === 1 ? '1 day' : length + ' days') + ' at ' + rate + '%', 'yl-time-' + name));
  }
  const axis = sceneNode('div', undefined, 'yl-time-axis');
  axis.append(sceneNode('span', 'Day 0'), ' ', sceneNode('span', 'Day ' + days));
  group.append(key, svg, axis);
  return group;
}

// The diagram can be explored in any order; the question always refers to its named outcome.
// A scene with `explore` also gets a slider under the drawing. The named cases
// stay as buttons above it, pressed whenever the slider sits on their value.
export function createYieldLessonScene(scene, controls, drawing, caption, explorerHome) {
  let current, explorer, played = false;
  const { explore } = scene;
  const stageAt = value => {
    const index = explore.values.indexOf(value);
    return index < 0 ? explore.stage(value) : scene.stages[index];
  };
  const buttons = scene.stages.map((stage, index) => {
    const button = sceneNode('button', stage.label, 'scene-shortcut');
    button.type = 'button';
    button.setAttribute('aria-controls', drawing.id);
    button.addEventListener('click', () => {
      show(index);
      const amounts = [
        ...stage.rows.map(([label, value]) => label + ', ' + value),
        ...(stage.bars?.items || []).map(item => item.label + ', ' + fmt(item.value) + ' ' + stage.bars.unit),
      ];
      if (stage.transfer) amounts.push(stage.transfer.value + ' from ' + stage.transfer.from + ' to ' + stage.transfer.to);
      announcement.textContent = stage.label + '. ' + stage.caption + ' ' + amounts.join('. ');
    });
    return button;
  });
  const announcement = sceneNode('span', '', 'sr-only');
  announcement.setAttribute('role', 'status');
  controls.replaceChildren(...buttons, announcement);
  caption.style.minHeight = '';
  if (explore) {
    // Exploring never changes the question or the saved answers.
    explorer = createSceneExplorer({
      id: 'yl-scene-slider', min: explore.min, max: explore.max, step: explore.step,
      start: explore.values[0], target: explore.values[scene.outcome ?? explore.values.length - 1],
      format: explore.format, valueText: explore.valueText, scopeText: explore.scope, labelText: explore.label, shortcuts: [],
      onChange(value) {
        // A named case highlights what changed; a drag redraws without the cue.
        render(stageAt(value), explore.values.indexOf(value), played);
        played = false;
        return '';
      },
    });
    explorerHome.replaceChildren(explorer.element);
  } else explorerHome.replaceChildren();
  explorerHome.hidden = !explore;

  function render(stage, index, animate) {
    const prior = animate ? current : null;
    current = stage;
    for (const [i, button] of buttons.entries()) button.setAttribute('aria-pressed', String(i === index));
    const content = document.createDocumentFragment();
    if (scene.origin) content.append(sceneNode('p', scene.origin, 'yl-origin'));
    const claims = sceneNode('dl', undefined, scene.origin ? 'yl-claims yl-branches' : 'yl-claims');
    for (const row of stage.rows) {
      const changed = prior && !prior.rows.some(([label, value]) => label === row[0] && value === row[1]);
      claims.append(claimCard(row, changed));
    }
    if (stage.rows.length) content.append(claims);
    if (stage.transfer) content.append(paymentReceipt(stage.transfer, prior && !prior.transfer));
    if (stage.retainedPayment) {
      const balance = sceneNode('p', undefined, 'yl-retained');
      balance.append(stage.retainedPayment.label + ' · ', sceneNode('strong', stage.retainedPayment.value));
      content.append(balance);
    }
    if (stage.path) content.append(drawRatePath(stage.path));
    if (stage.bars) content.append(drawBars(stage.bars, prior?.bars));
    drawing.replaceChildren(content);
    caption.textContent = stage.caption;
    // Near the end of the page, a shorter caption would shrink the page and
    // scroll the slider out from under a dragging thumb. Let it only grow.
    if (explorer) caption.style.minHeight = caption.getBoundingClientRect().height + 'px';
  }
  function show(index, animate = true) {
    if (!explorer) return render(scene.stages[index], index, animate);
    played = animate;
    explorer.show(explore.values[index]);
  }
  return { show, showOutcome: () => show(scene.outcome ?? scene.stages.length - 1) };
}
