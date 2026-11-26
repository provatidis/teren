import { claimText } from './lesson-narration.js';
import { sceneNode as node } from './lesson-scene.js';
import { usd } from './format.js';

// Holding and the claim on one dollar scale, each with the tokens behind it and a
// dashed line at the starting value. With fees, the claim's bar gains a striped
// segment. Lines under the bars pair a label with a value in fixed columns, so
// nothing in the figure rewraps while a slider changes its numbers.
export function createBenchmarkFigure(input, { prefix = 'benchmark', ceiling = input.investment * 1.5, withFees = false, facts = [], key }) {
  const figure = node('figure', undefined, 'benchmark-figure');
  // Two fixed parts, so the caption cannot rewrap above a slider as the price changes.
  const caption = node('figcaption', undefined, 'scene-figure-title token-scene-title');
  const at = node('span'); at.id = prefix + '-at';
  caption.append(node('span', 'Value'), node('span', ' with ', 'sr-only'), at);
  figure.append(caption);
  // Where each one sits is said beside its name. The narrowest phones show the name alone.
  const rows = [['hold', 'Holding', ' in your wallet'], ['claim', 'Your claim', ' in the pool']].map(([name, label, place]) => {
    const row = node('div', undefined, 'scene-token-row'); row.dataset.benchmark = name;
    const heading = node('div', undefined, 'scene-token-heading');
    const value = node('span'); value.id = prefix + '-' + name;
    const title = node('span', undefined, 'benchmark-name'); title.append(node('strong', label), node('span', place, 'benchmark-place'));
    heading.append(title, ' ', value);
    const track = node('div', undefined, 'scene-token-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span', undefined, 'scene-token-fill');
    const fees = name === 'claim' && withFees ? node('span', undefined, 'scene-token-fill benchmark-fees') : null;
    const start = node('span', undefined, 'scene-token-start');
    start.style.left = input.investment / ceiling * 100 + '%';
    track.append(fill, ...(fees ? [fees] : []), start);
    const tokens = node('p', undefined, 'scene-token-detail'); tokens.id = prefix + '-' + name + '-tokens';
    // The claim's value includes its fees, so the line under the bar names them too.
    // The amount is beside the fee slider; there is no room for it on this line.
    const mix = node('span'), feeNote = fees ? node('span', '', 'benchmark-fee-note') : null;
    tokens.append(mix, ...(fees ? [feeNote] : []));
    row.append(heading, '\n', track, '\n', tokens); figure.append('\n', row);
    return { value, fill, fees, tokens: mix, feeNote };
  });
  const values = {};
  for (const [name, label] of facts) {
    const row = node('p', undefined, 'foundation-fact'); row.id = prefix + '-' + name;
    values[name] = node('strong'); row.append(node('span', label), ' ', values[name]);
    figure.append('\n', row);
  }
  figure.append('\n', node('p', key, 'scene-key'));
  const [hold, claim] = rows;
  return { figure, values, bars: [hold.fill, claim.fill, ...(claim.fees ? [claim.fees] : [])],
    // One fixed dollar scale, so a moving bar shows a change in value faithfully.
    draw(result) {
      at.textContent = 'ETH at ' + usd(result.futurePrice);
      hold.fill.style.width = result.holdValue / ceiling * 100 + '%';
      claim.fill.style.width = result.lpBeforeFees / ceiling * 100 + '%';
      if (claim.fees) claim.fees.style.width = result.fees / ceiling * 100 + '%';
      hold.value.textContent = usd(result.holdValue);
      claim.value.textContent = usd(withFees ? result.lpValue : result.lpBeforeFees);
      hold.tokens.textContent = claimText(result.held);
      claim.tokens.textContent = claimText(result.pooled);
      if (claim.feeNote) claim.feeNote.textContent = result.fees > 0 ? ' + fees' : '';
    } };
}
