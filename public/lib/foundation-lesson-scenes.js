import { sceneNode as node, createActionPlayer, createSceneExplorer, ACTION_MS, ACTION_EASING, REVEAL_DELAY_MS } from './lesson-scene.js';
import { swapSceneState, depositSceneState } from './foundation-scene-state.js';
import { fmt, usd } from './format.js';

const percent = value => fmt(value, 2) + '%';
// Round claims read as round numbers: 5 ETH + 10,000 USDC, then 5.4762 ETH + 9,132.82 USDC.
const amount = (value, digits) => value.toLocaleString('en-US', { maximumFractionDigits: digits });

// A label beside a value in a column of fixed width. The label's wrapping then
// depends only on the screen, never on the value, so nothing below these lines
// moves while a slider changes their numbers.
function fact(id, label) {
  const row = node('p', undefined, 'foundation-fact'); row.id = id;
  const name = node('span', label), value = node('strong');
  row.append(name, ' ', value);
  return { row, name, value };
}

function poolFigure(original, deposit) {
  const element = node('figure', undefined, 'foundation-pool'); element.dataset.action = deposit ? 'deposit' : 'swap';
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
  // Result lines sit under the bars, so the bars keep their place when they appear.
  const execution = fact('foundation-average', 'Average price you receive:'); execution.row.hidden = true;
  const price = fact('foundation-pool-price', 'Pool price:');
  const share = fact('foundation-pool-share', 'Your share:'); share.row.hidden = !deposit;
  const claimed = fact('foundation-claim', 'Your claim:'); claimed.row.hidden = true;
  const claimedEth = node('span'), claimedUsdc = node('span'); claimed.value.append(claimedEth, ' ', claimedUsdc);
  element.append(caption, '\n', flow, '\n', balances, '\n', execution.row, '\n', price.row, '\n',
    share.row, '\n', claimed.row, '\n',
    node('p', 'Dashed = starting balances. Bars use different token units.', 'scene-key'));
  const width = (amounts, token) => amounts[token] / (original[token] * 1.6) * 100 + '%';
  return { element, show({ pool, from, title, transfer, fraction = 0, fromFraction = 0, average, claim, priceLabel = 'Pool price' }, animate = false, delay = 0) {
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
    execution.row.hidden = average === undefined;
    execution.value.textContent = average === undefined ? '' : usd(average) + ' per ETH';
    price.name.textContent = priceLabel + ':';
    price.value.textContent = usd(pool.usdc / pool.eth) + ' per ETH';
    share.value.textContent = fraction ? percent(fraction * 100) + ' · striped' : '0% · before deposit';
    claimed.row.hidden = !claim;
    claimedEth.textContent = claim ? amount(claim.eth, 4) + ' ETH' : '';
    claimedUsdc.textContent = claim ? '+ ' + amount(claim.usdc, 2) + ' USDC' : '';
    // Replaying with the bars scrolled away would play to no one.
    if (play) balances.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  } };
}

// A titled panel of bars on one scale, a sentence that follows the slider and
// the lesson's one explanation.
function comparisonPanel(id, heading, count, why) {
  const element = node('section', undefined, 'foundation-outcome');
  element.id = id; element.setAttribute('aria-labelledby', id + '-title');
  const title = node('h4', heading); title.id = id + '-title';
  const rows = Array.from({ length: count }, () => {
    const row = node('div', undefined, 'foundation-comparison-row');
    const line = node('p'), label = node('span'), value = node('strong');
    line.append(label, ' ', value);
    const track = node('div', undefined, 'foundation-comparison-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span'); track.append(fill); row.append(line, '\n', track);
    return { row, label, value, fill };
  });
  const sentence = node('p', '', 'scene-consequence'); sentence.id = id + '-copy';
  const reason = node('p', why, 'foundation-why'); reason.id = 'foundation-why';
  element.append(title, ...rows.flatMap(({ row }) => ['\n', row]), '\n', sentence, '\n', reason);
  return { element, rows, sentence };
}

function executionComparison(why) {
  const { element, rows, sentence } = comparisonPanel('foundation-comparison', 'USDC per ETH', 3, why);
  rows.forEach(({ value }, i) => { value.id = 'foundation-execution-' + i; });
  return { element, show(frame, visible) {
    element.hidden = !visible;
    const data = [
      ['Starting pool price', frame.beforePrice],
      ['1 ETH trade · average price', frame.referenceAverage],
      [fmt(frame.amount, 0) + ' ETH trade · average price', frame.average],
    ];
    rows.forEach(({ label, value, fill }, i) => {
      label.textContent = data[i][0]; value.textContent = fmt(data[i][1], 2);
      fill.style.width = data[i][1] / frame.beforePrice * 100 + '%';
    });
    sentence.textContent = frame.amount === 1
      ? 'Both trade rows now show the same 1 ETH swap. Increase the size to compare.'
      : 'The larger trade receives more USDC in total, but a lower average price. It moves the pool price further.';
  } };
}

// The tempting number, the deposit against the pool before it, beside the share
// actually owned. The slider reaches half the pool, so that sets the scale.
function ownershipComparison(why) {
  const { element, rows, sentence } = comparisonPanel('foundation-ownership', 'Your share of the pool', 2, why);
  rows[0].value.id = 'foundation-share-before'; rows[1].value.id = 'foundation-share';
  return { element, show(frame, visible) {
    element.hidden = !visible;
    const deposit = fmt(frame.deposit.eth, 0) + ' ETH of the ';
    const data = [
      [deposit + fmt(frame.before.eth, 0) + ' ETH it held', frame.deposit.eth / frame.before.eth * 100],
      [deposit + fmt(frame.after.eth, 0) + ' ETH it holds now', frame.fraction * 100],
    ];
    rows.forEach(({ label, value, fill }, i) => {
      label.textContent = data[i][0]; value.textContent = percent(data[i][1]);
      fill.style.width = data[i][1] * 2 + '%';
    });
    sentence.textContent = frame.deposit.eth * 2 === frame.before.eth
      ? 'You added half as much as the pool held, and you own a third of it, not a half.'
      // The reason is the panel's one explanation, just below; this line only says what to look at.
      : 'The second number is always the smaller one, and a bigger deposit widens the gap.';
  } };
}

// The deposit lesson's second step: one more thing to watch, beside the pool.
const tokens = claim => amount(claim.eth, 4) + ' ETH + ' + amount(claim.usdc, 2) + ' USDC';

function laterTrade(onShow, onBack) {
  const element = node('div', undefined, 'foundation-later'); element.id = 'foundation-later';
  const copy = node('p'); copy.id = 'foundation-later-copy';
  // The sentence never changes length and the numbers sit in fixed rows, because
  // this step is above the slider: text that rewrapped with the deposit size
  // would move the slider under a dragging thumb.
  const share = fact('foundation-later-share', 'Your share'), before = fact('foundation-later-before', 'Claim before'),
    after = fact('foundation-later-after', 'Claim after');
  const result = node('div', undefined, 'foundation-later-result'); result.id = 'foundation-later-result';
  result.append(share.row, '\n', before.row, '\n', after.row);
  const button = node('button'); button.type = 'button'; button.id = 'foundation-later-show';
  element.append(copy, '\n', result, '\n', button);
  let shown = false;
  button.addEventListener('click', () => shown ? onBack() : onShow());
  return { element, show(frame, index) {
    element.hidden = index === 0; shown = index === 2;
    copy.className = shown ? 'scene-consequence' : 'foundation-invite';
    copy.textContent = shown ? 'The trade changed your claim, not your share.'
      : 'Next, another trader sells ' + fmt(frame.tradeETH, 0) + ' ETH to this pool. Watch your share and your claim.';
    result.hidden = !shown;
    share.value.textContent = percent(frame.fraction * 100) + ' before and after';
    before.value.textContent = tokens(frame.initialClaim);
    after.value.textContent = tokens(frame.laterClaim);
    button.className = shown ? 'text-button' : 'button secondary';
    button.textContent = shown ? '← Back to the deposit' : 'Show the trade →';
  } };
}

// The pool comes before its question, and the question reveals the outcome in
// place. What comes next appears once that outcome has been shown. The slider
// explores fresh examples: only the controller can edit the lesson's assessed
// setup, and neither the amount nor the displayed action is persisted here.
export function createFoundationScene(id, input, variant, prediction, { explanation = '' } = {}) {
  const deposit = id === 'pool-share';
  const element = node('div', undefined, 'lesson-scene foundation-scene'); element.dataset.lesson = id;
  const target = deposit ? input.depositEth : input.amount;
  const calculate = amount => deposit ? depositSceneState(input, amount, variant) : swapSceneState(input, amount, variant);
  let frame = calculate(target), index = 0, player, delay = 0;
  const figure = poolFigure(frame.before, deposit);
  const outcome = deposit ? ownershipComparison(explanation) : executionComparison(explanation);
  const later = deposit ? laterTrade(() => player.show(2, true), () => player.show(1)) : null;
  const invite = node('p', deposit ? 'Now try a bigger deposit. How much of the pool do you own?'
    : 'Now sell more. What happens to the average price you receive?', 'foundation-invite');
  invite.id = 'foundation-invite';
  const stages = deposit ? [
    { label: 'Starting pool', copy: 'Your deposit contains both ETH and USDC in the pool’s current ratio.' },
    { label: 'After your deposit', replayLabel: 'Replay the deposit ↻', copy: 'Both balances grow together. The pool price stays the same, and you own a share of the enlarged pool.' },
    { label: 'After a later trade', replayLabel: 'Replay the trade ↻', copy: 'Another trader exchanges ETH for USDC. Your share stays the same while your claim changes.' },
  ] : [
    { label: 'Starting pool', copy: 'The pool has a limited amount of each token. The starting pool price describes its balances before your swap.' },
    { label: 'After the swap', replayLabel: 'Replay the swap ↻', copy: 'ETH enters and USDC leaves. The swap changes the pool’s balances and its price.' },
  ];
  const explorer = createSceneExplorer({
    id: 'foundation-amount', min: 1, max: input.reserveEth / 2, step: 1, start: target, target,
    labelText: deposit ? 'Deposit size' : 'Trade size',
    format: amount => fmt(amount, 0) + ' ETH',
    // The pressed shortcut marks the question's own amount.
    shortcuts: [{ label: 'Small · 1 ETH', value: 1 }, { label: 'The question · ' + fmt(target, 0) + ' ETH', value: target }],
    scopeText: () => '',
    onChange(amount) {
      frame = calculate(amount);
      if (player) player.show(index, false, false);
      return deposit ? 'A matching deposit includes ' + fmt(frame.deposit.usdc, 0) + ' USDC.'
        : index === 0 ? 'Ready to show the swap.' : fmt(frame.out, 2) + ' USDC received.';
    },
  });
  player = createActionPlayer({ id: 'foundation', stages, replayOnly: true, onShow(stage, animate) {
    index = stages.indexOf(stage);
    const pools = deposit ? [frame.before, frame.after, frame.traded] : [frame.before, frame.after];
    const fractions = deposit ? [0, frame.fraction, frame.fraction] : [0, 0];
    const transfer = deposit
      ? index < 2 ? (index === 0 ? 'Ready to add: ' : 'Added together: ') + fmt(frame.deposit.eth, 0) + ' ETH + ' + fmt(frame.deposit.usdc, 0) + ' USDC → pool'
        : 'Another trader: ' + fmt(frame.tradeETH, 0) + ' ETH in → ' + fmt(frame.tradeUSDC, 2) + ' USDC out'
      : index === 0 ? 'Ready to swap: ' + fmt(frame.amount, 0) + ' ETH → USDC'
        : fmt(frame.amount, 0) + ' ETH in → pool → ' + fmt(frame.out, 2) + ' USDC out';
    figure.show({
      pool: pools[index], from: animate ? pools[index - 1] : undefined, title: stage.label, transfer,
      fraction: fractions[index], fromFraction: fractions[index - 1] ?? 0,
      average: !deposit && index > 0 ? frame.average : undefined,
      claim: deposit && index > 0 ? (index === 2 ? frame.laterClaim : frame.initialClaim) : undefined,
      priceLabel: deposit ? 'Pool price' : index === 0 ? 'Starting pool price' : 'Pool price after the swap',
    }, animate, delay);
    outcome.show(frame, index > 0);
    later?.show(frame, index);
    // Trying other sizes comes after the question's own outcome has been shown.
    invite.hidden = explorer.element.hidden = index === 0;
  } });
  const parts = [figure.element, player.element, prediction, later?.element, invite, explorer.element, outcome.element].filter(Boolean);
  element.append(...parts.flatMap(part => [part, '\n']));
  explorer.show(target);
  // animate: the learner asked to see the outcome, so play the action once the page has landed on it.
  return { element, showQuestion(animate = false) {
    explorer.show(target);
    delay = REVEAL_DELAY_MS;
    try { player.show(1, animate, false); } finally { delay = 0; }
  } };
}
