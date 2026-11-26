import { sceneNode as node, createActionPlayer, createSceneExplorer } from './lesson-scene.js';
import { swapSceneState, depositSceneState } from './foundation-scene-state.js';
import { fmt, usd } from './format.js';

// A named action replays the change from the previous stage, slowly enough to
// follow. Text, values and final widths are written at once; only painting is
// delayed and eased, and reduced motion skips it.
const ACTION_MS = 900;
const ACTION_EASING = 'cubic-bezier(.45, 0, .2, 1)';
// After the reveal jumps to the outcome, give the eye a moment to land first.
const REVEAL_DELAY_MS = 400;

function poolFigure(original, deposit) {
  const element = node('figure', undefined, 'foundation-pool');
  const caption = node('figcaption', 'Before the swap', 'scene-figure-title');
  caption.id = 'foundation-pool-caption';
  const flow = node('p', '', 'foundation-flow'); flow.id = 'foundation-flow';
  const rows = ['eth', 'usdc'].map(token => {
    const row = node('div', undefined, 'scene-token-row'); row.dataset.token = token;
    const heading = node('div', undefined, 'scene-token-heading');
    const value = node('span'); value.id = 'foundation-pool-' + token;
    heading.append(node('strong', token.toUpperCase()), ' ', value);
    const track = node('div', undefined, 'scene-token-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span', undefined, 'scene-token-fill');
    const owned = node('span', undefined, 'foundation-owned'); fill.append(owned);
    const start = node('span', undefined, 'scene-token-start');
    start.style.left = 100 / 1.6 + '%';
    track.append(fill, start);
    row.append(heading, '\n', track);
    return { row, value, fill, owned, token };
  });
  const balances = node('div', undefined, 'foundation-balances');
  balances.append(...rows.flatMap(({ row }) => ['\n', row]), '\n');
  const price = node('p', '', 'foundation-pool-price'); price.id = 'foundation-pool-price';
  // The average line keeps its space at every stage, so the bars stay put when
  // it appears. A deposit has no average, so it never takes space there.
  const execution = node('p', undefined, 'foundation-execution'); execution.id = 'foundation-average'; execution.hidden = true;
  const executionValue = node('span');
  execution.append(executionValue, node('span', 'Your average execution appears after the swap.', 'foundation-execution-pending'));
  const share = node('p', '', 'foundation-pool-share'); share.id = 'foundation-pool-share'; share.hidden = !deposit;
  element.append(caption, '\n', flow, '\n', execution, '\n', balances, '\n', price, '\n',
    share, '\n',
    node('p', 'Dashed = starting balances. Bars use different token units.', 'scene-key'));
  const width = (amounts, token) => amounts[token] / (original[token] * 1.6) * 100 + '%';
  return { element, show({ pool, from, title, transfer, fraction = 0, fromFraction = 0, average, averageShown = false }, animate = false, delay = 0) {
    for (const animation of element.getAnimations({ subtree: true })) animation.cancel();
    const play = animate && Boolean(from) && matchMedia('(prefers-reduced-motion: no-preference)').matches;
    // A played action owns its bars; the shared short easing (motion.css) steps aside.
    element.dataset.motion = String(play);
    caption.textContent = title; flow.textContent = transfer;
    const timing = { duration: ACTION_MS, delay, easing: ACTION_EASING, fill: 'backwards' };
    for (const { token, value, fill, owned } of rows) {
      value.textContent = fmt(pool[token], 2) + ' ' + token.toUpperCase();
      fill.style.width = width(pool, token);
      owned.style.width = fraction * 100 + '%'; owned.hidden = !deposit || !fraction;
      if (!play) continue;
      fill.animate([{ width: width(from, token) }, { width: width(pool, token) }], timing);
      if (deposit && fraction !== fromFraction) owned.animate([{ width: fromFraction * 100 + '%' }, { width: fraction * 100 + '%' }], timing);
    }
    execution.hidden = average === undefined;
    executionValue.textContent = average === undefined ? '' : 'Your average execution: ' + usd(average) + ' per ETH, including the fee.';
    execution.classList.toggle('foundation-pending', !averageShown);
    price.textContent = (averageShown ? 'Pool price after this trade: ' : 'Pool price: ') + usd(pool.usdc / pool.eth) + ' per ETH';
    share.textContent = fraction ? 'Your share: ' + fmt(fraction * 100, 2) + '% · striped'
      : 'Your share: 0% · before deposit';
    // Replaying with the bars scrolled away would play to no one.
    if (play) balances.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  } };
}

function executionComparison() {
  const element = node('section', undefined, 'foundation-outcome');
  element.id = 'foundation-comparison'; element.setAttribute('aria-labelledby', 'foundation-comparison-title');
  const title = node('h4', 'USDC received per ETH'); title.id = 'foundation-comparison-title';
  const rows = Array.from({ length: 3 }, (_, i) => {
    const row = node('div', undefined, 'foundation-comparison-row');
    const line = node('p'), label = node('span'), value = node('strong');
    value.id = 'foundation-execution-' + i;
    line.append(label, ' ', value);
    const track = node('div', undefined, 'foundation-comparison-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span'); track.append(fill); row.append(line, '\n', track);
    return { row, label, value, fill };
  });
  const explanation = node('p', '', 'scene-consequence'); explanation.id = 'foundation-comparison-copy';
  element.append(title, ...rows.flatMap(({ row }) => ['\n', row]), '\n', explanation, '\n',
    node('p', 'Both trades start from the same pool. Their average prices include the 0.3% swap fee.', 'fine-print'));
  return { element, show(frame, visible) {
    element.hidden = !visible;
    const data = [
      ['Starting pool price', frame.beforePrice],
      ['1 ETH trade · average', frame.referenceAverage],
      [fmt(frame.amount, 0) + ' ETH trade · average', frame.average],
    ];
    rows.forEach(({ label, value, fill }, i) => {
      label.textContent = data[i][0]; value.textContent = fmt(data[i][1], 2);
      fill.style.width = data[i][1] / frame.beforePrice * 100 + '%';
    });
    explanation.textContent = frame.amount === 1
      ? 'Both trade rows now show the same 1 ETH swap. Increase the size to compare.'
      : 'The larger trade receives more USDC in total, but less for each ETH. It changes the pool more.';
  } };
}

function ownershipReceipt() {
  const element = node('section', undefined, 'foundation-outcome'); element.id = 'foundation-ownership';
  element.setAttribute('aria-labelledby', 'foundation-ownership-title');
  const title = node('h4', 'Your share of the pool'); title.id = 'foundation-ownership-title';
  const percentage = node('p', '', 'foundation-share'); percentage.id = 'foundation-share';
  const claim = node('p'); claim.id = 'foundation-claim';
  const copy = node('p', '', 'scene-consequence'); copy.id = 'foundation-ownership-copy';
  element.append(title, '\n', percentage, '\n', claim, '\n', copy, '\n',
    node('p', 'The striped slice marks your claim on both balances. LP tokens represent this fraction; they do not reserve the tokens you deposited.', 'fine-print'));
  return { element, show(frame, index) {
    element.hidden = index === 0;
    percentage.textContent = fmt(frame.result.share, 2) + '% of both pool balances';
    const tokens = index === 2 ? frame.laterClaim : frame.initialClaim;
    claim.textContent = 'Your claim: ' + fmt(tokens.eth, 4) + ' ETH + ' + fmt(tokens.usdc, 2) + ' USDC';
    copy.textContent = index === 2
      ? 'Your percentage stays the same through this trade. It now represents more ETH and less USDC.'
      : 'Both tokens entered in the existing ratio, so the price stayed the same. Your share uses the enlarged pool, including your deposit.';
  } };
}

// The slider explores fresh examples. Only the controller can edit the lesson's
// assessed setup; neither the amount nor the displayed action is persisted here.
export function createFoundationScene(id, input, variant, prediction) {
  const deposit = id === 'pool-share';
  const element = node('div', undefined, 'lesson-scene foundation-scene'); element.dataset.lesson = id;
  const target = deposit ? input.depositEth : input.amount;
  const calculate = amount => deposit ? depositSceneState(input, amount, variant) : swapSceneState(input, amount, variant);
  let frame = calculate(target), index = 0, player;
  const figure = poolFigure(frame.before, deposit);
  const outcome = deposit ? ownershipReceipt() : executionComparison();
  const copy = node('p', '', 'scene-consequence'); copy.id = 'foundation-action-copy';
  const stages = deposit ? [
    { action: 'start', label: 'Starting pool', group: 'One deposit', copy: 'Your deposit contains both ETH and USDC in the pool’s current ratio.' },
    { action: 'deposit', label: 'Add both tokens', group: 'One deposit', playLabel: 'Show the deposit', copy: 'Both balances grow together. The pool price stays the same, and you receive a share of the enlarged pool.' },
    { action: 'trade', label: 'A later trade', group: 'One deposit', playLabel: 'Show a later trade', copy: 'Another trader exchanges ETH for USDC. Your percentage stays the same while the balances it represents change.' },
  ] : [
    { action: 'start', label: 'Starting pool', group: 'One swap', copy: 'The pool has a limited amount of each token. Its starting price describes the reserves before your trade.' },
    { action: 'swap', label: 'After the swap', group: 'One swap', playLabel: 'Show the swap', copy: 'ETH enters and USDC leaves. The trade changes the pool’s reserves and its exchange rate.' },
  ];
  const explorer = createSceneExplorer({
    id: 'foundation-amount', min: 1, max: input.reserveEth / 2, step: 1, start: target, target,
    labelText: deposit ? 'Explore a matching deposit' : 'Explore a trade size',
    format: amount => fmt(amount, 0) + ' ETH',
    shortcuts: [
      { label: 'Small · 1 ETH', value: 1 },
      { label: 'Lesson setup · ' + fmt(target, 0) + ' ETH', value: target },
    ],
    scopeText: amount => (amount === target ? 'Showing the lesson setup. ' : 'Exploring another amount. ')
      + 'Prediction: a ' + fmt(target, 0) + ' ETH ' + (deposit ? 'deposit, with matching USDC.' : 'swap.'),
    onChange(amount) {
      frame = calculate(amount);
      if (player) player.show(index, false, false);
      return deposit ? 'A matching deposit includes ' + fmt(frame.deposit.usdc, 0) + ' USDC.'
        : index === 0 ? 'Ready to show the swap.' : fmt(frame.out, 2) + ' USDC received.';
    },
  });
  let delay = 0;
  player = createActionPlayer({ id: 'foundation', stages, onShow(stage, animate) {
    index = stages.indexOf(stage);
    const pools = deposit ? [frame.before, frame.after, frame.traded] : [frame.before, frame.after];
    const fractions = deposit ? [0, frame.fraction, frame.fraction] : [0, 0];
    const pool = pools[index], fraction = fractions[index];
    let transfer;
    if (deposit) {
      transfer = index < 2
        ? (index === 0 ? 'Ready to add: ' : 'Added together: ') + fmt(frame.deposit.eth, 0) + ' ETH + ' + fmt(frame.deposit.usdc, 0) + ' USDC → pool'
        : 'Another trader: ' + fmt(frame.tradeETH, 0) + ' ETH in → ' + fmt(frame.tradeUSDC, 2) + ' USDC out';
      outcome.show(frame, index);
    } else {
      transfer = index === 0 ? 'Ready to swap: ' + fmt(frame.amount, 0) + ' ETH → USDC'
        : fmt(frame.amount, 0) + ' ETH in → pool → ' + fmt(frame.out, 2) + ' USDC out';
      outcome.show(frame, index > 0);
    }
    figure.show({
      pool, from: animate ? pools[index - 1] : undefined, title: stage.label, transfer, fraction, fromFraction: fractions[index - 1] ?? 0,
      average: deposit ? undefined : frame.average, averageShown: !deposit && index > 0,
    }, animate, delay);
    copy.textContent = stage.copy;
  } });
  element.append(prediction, '\n', figure.element, '\n', player.element, '\n', copy, '\n', explorer.element, '\n', outcome.element, '\n',
    node('p', deposit ? 'Each amount starts with the same pool and shows one deposit, then one separate trade. The trade pays a 0.3% fee. Claims use proportional ownership before withdrawal rounding.'
      : 'Each amount starts with the same pool and shows one ETH-to-USDC swap, including the 0.3% fee.', 'fine-print'));
  explorer.show(target);
  // animate: the learner asked to see the outcome, so play the action once the page has landed on it.
  return { element, showQuestion(animate = false) {
    explorer.show(target);
    delay = REVEAL_DELAY_MS;
    try { player.show(1, animate, false); } finally { delay = 0; }
  } };
}
