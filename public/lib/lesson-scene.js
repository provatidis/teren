// Shared controls for lesson scenes. Financial state stays in the existing models.
export function sceneNode(tag, copy, className) {
  const element = document.createElement(tag);
  if (copy !== undefined) element.textContent = copy;
  if (className) element.className = className;
  return element;
}

export function createPredictionPrompt(fieldset, { selected, onShow, disabled = false, feedback, button }) {
  const element = sceneNode('div', undefined, 'scene-prediction');
  fieldset.querySelector('legend').classList.add('scene-prediction-question');
  const show = button || sceneNode('button');
  show.className = 'button secondary scene-prediction-show';
  show.type = 'button'; show.disabled = disabled;
  const label = hasPrediction => { show.textContent = element.dataset.revealed === 'true' ? 'Show the outcome again ↓' : hasPrediction ? 'See what happens →' : 'Not sure — show me →'; };
  label(Boolean(selected));
  element.addEventListener('change', () => label(Boolean(fieldset.querySelector('input:checked'))));
  show.onclick = onShow;
  element.append(
    sceneNode('p', 'Make a prediction', 'scene-prediction-invite'), '\n', fieldset, '\n',
    show,
  );
  if (feedback) { feedback.textContent = ''; element.append('\n', feedback); }
  return element;
}

export function markPredictionRevealed(fieldset) {
  const prompt = fieldset.closest('.scene-prediction');
  prompt.dataset.revealed = 'true';
  prompt.querySelector('button').textContent = 'Show the outcome again ↓';
}

// Keep the diagram and its controls together when a learner requests an outcome.
export function focusSceneOutcome(container) {
  const feedback = container.querySelector('.learn-prediction-feedback');
  const target = feedback?.textContent ? feedback : container.querySelector('figure, table, .loop-flow-balances');
  target.tabIndex = -1;
  target.classList.add('scene-outcome-focus');
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
}

// Exploration is ephemeral: it never edits a lesson's question, answers or draft.
export function createPriceExplorer({ id, min, max, step, start, target, format, shortcuts, onChange }) {
  return createSceneExplorer({ id, min, max, step, start, target, format, shortcuts, onChange,
    labelText: 'Explore an ETH price',
    valueText: price => format(price) + ' per ETH',
    scopeText: price => price === target
      ? 'Showing the prediction price: ' + format(target) + '.'
      : 'Exploring another price. Prediction: ETH at ' + format(target) + '.',
  });
}

export function createSceneExplorer({ id, min, max, step, start, target, format, shortcuts, onChange, labelText, valueText = format, scopeText }) {
  const element = sceneNode('div', undefined, 'scene-price-control');
  const heading = sceneNode('div', undefined, 'scene-price-heading');
  const label = sceneNode('label', labelText); label.htmlFor = id;
  const output = sceneNode('output'); output.htmlFor = id; output.id = id + '-value';
  output.setAttribute('aria-live', 'off');
  // Reserve the largest label so changing digits cannot push the slider down.
  const characters = Math.max(...[min, max, start, target, ...shortcuts.map(item => item.value)].map(value => format(value).length));
  output.style.minWidth = (characters + 1) + 'ch';
  heading.append(label, ' ', output);
  const slider = sceneNode('input');
  // Saved questions may sit between the usual steps. Keep every named value
  // exact; otherwise the browser silently rounds a shortcut's value.
  const onStep = value => step === 'any' || Math.abs((value - min) / step - Math.round((value - min) / step)) < 1e-8;
  const exactStep = [start, target, ...shortcuts.map(item => item.value)].every(onStep) ? step : 'any';
  Object.assign(slider, { type: 'range', id, min, max, step: exactStep, value: start });
  const links = sceneNode('div', undefined, 'scene-shortcuts');
  const buttons = shortcuts.map(({ label, value }) => {
    const button = sceneNode('button', label, 'scene-shortcut'); button.type = 'button';
    button.addEventListener('click', () => show(value, true));
    links.append(' ', button);
    return { button, value };
  });
  const scope = sceneNode('p', undefined, 'scene-question-scope'); scope.id = id + '-scope';
  slider.setAttribute('aria-describedby', scope.id);
  const status = sceneNode('p', '', 'sr-only'); status.setAttribute('role', 'status');
  function show(value, announce = false) {
    slider.value = String(value);
    // Some browsers shorten repeating decimals even with step="any". Preserve
    // an exact, legal named value for the model; native input uses its own value.
    const legalValue = Number.isFinite(value) && value >= min && value <= max && (exactStep === 'any' || onStep(value));
    const selected = legalValue ? value : Number(slider.value);
    output.textContent = format(selected);
    slider.setAttribute('aria-valuetext', valueText(selected));
    for (const item of buttons) item.button.setAttribute('aria-pressed', String(item.value === selected));
    scope.textContent = scopeText(selected);
    const description = onChange(selected);
    status.textContent = announce ? format(selected) + '. ' + description : '';
  }
  slider.addEventListener('input', () => show(Number(slider.value)));
  element.append(heading, '\n', slider, '\n', links, '\n', scope, '\n', status);
  return { element, show };
}

// One action per activation. There are no timers or queued transitions; the
// completed frame is available immediately, including with reduced motion.
export function createActionPlayer({ id, stages, onShow }) {
  const element = sceneNode('div', undefined, 'scene-player');
  const selected = sceneNode('p', '', 'scene-step-label'); selected.id = id + '-selected';
  const actions = sceneNode('div', undefined, 'scene-actions');
  const previous = sceneNode('button', '← Back', 'text-button');
  const replay = sceneNode('button', 'Replay action', 'text-button');
  const next = sceneNode('button', '', 'button primary');
  for (const [button, suffix] of [[previous, 'previous'], [replay, 'replay'], [next, 'next']]) {
    button.type = 'button'; button.id = id + '-' + suffix;
  }
  const jump = sceneNode('details', undefined, 'scene-jump');
  jump.append(sceneNode('summary', 'Choose any step'));
  const choices = sceneNode('div', undefined, 'scene-step-groups');
  let group, groupName;
  const stops = stages.map((stage, i) => {
    const name = stage.group || stage.pass || (stage.action === 'start' ? 'Starting position' : stage.action === 'release' ? 'Finish' : 'One round');
    if (name !== groupName) {
      groupName = name;
      group = sceneNode('div', undefined, 'scene-step-group');
      group.append(sceneNode('p', name), '\n'); choices.append('\n', group);
    }
    const button = sceneNode('button', stage.label, 'scene-shortcut'); button.type = 'button';
    button.dataset.stage = String(i);
    button.setAttribute('aria-label', name + ': ' + stage.label);
    button.addEventListener('click', () => show(i, false)); group.append(' ', button);
    return button;
  });
  jump.append(choices);
  const status = sceneNode('p', '', 'sr-only'); status.setAttribute('role', 'status');
  let index = 0;
  function show(value, animate = false, announce = true) {
    index = Math.max(0, Math.min(stages.length - 1, value));
    const stage = stages[index];
    element.dataset.stage = String(index);
    selected.textContent = (stage.pass ? stage.pass + ' · ' : '') + stage.label + ' · ' + (index + 1) + ' / ' + stages.length;
    for (const [i, stop] of stops.entries()) stop.setAttribute('aria-current', i === index ? 'step' : 'false');
    previous.disabled = index === 0;
    replay.disabled = index === 0;
    next.textContent = index === stages.length - 1 ? 'Start again ↺' : (stages[index + 1].playLabel || 'Show ' + stages[index + 1].label) + ' →';
    onShow(stage, animate && index > 0);
    if (announce) status.textContent = selected.textContent + '. ' + stage.copy;
  }
  previous.addEventListener('click', () => {
    show(index - 1);
    if (previous.disabled) next.focus({ preventScroll: true });
  });
  next.addEventListener('click', () => show(index === stages.length - 1 ? 0 : index + 1, index < stages.length - 1));
  replay.addEventListener('click', () => show(index, true));
  actions.append(previous, ' ', replay, ' ', next);
  element.append(selected, '\n', actions, '\n', jump, '\n', status);
  show(0, false, false);
  return { element, show };
}
