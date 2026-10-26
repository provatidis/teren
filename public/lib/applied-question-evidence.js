import { sceneNode as node } from './lesson-scene.js';
import { usd, formatTokenQuantity } from './format.js';
import { appendQuestionComparison } from './lesson-question-evidence.js';

// The question brings its evidence with it; the explorer remains independent.
export function renderAppliedQuestionEvidence(collection, price, question, application) {
  const visible = Boolean(question.contrast && application.exposure);
  for (const panel of [collection, price]) { panel.hidden = !visible; panel.replaceChildren(); }
  if (!visible) return;
  const heading = (id, text) => { const element = node('h4', text); element.id = id; return element; };
  const earlier = question.contrast, end = question.view, exposure = application.exposure;
  collection.append(heading('applied-collection-heading', 'Why the comparison improved'),
    node('p', 'Checkpoint '+(question.contrastIndex+1)+' → the end: ETH falls from '+usd(earlier.price)+' to '+usd(end.price)+'. Both are above the '+usd(end.range.upperPrice)+' upper bound.', 'applied-evidence-moment'));
  appendQuestionComparison(collection,{
    caption:'Two contributions to the recovery',format:'usd',rows:[
      {label:'Smaller principal shortfall',value:question.recovery.principalImprovement,detail:usd(-earlier.principalGapUSD)+' behind holding → '+usd(-end.principalGapUSD)+' behind'},
      {label:'Increase in period fee value',value:question.recovery.feeValueChange,detail:usd(earlier.feesUSD)+' → '+usd(end.feesUSD)},
    ],
  });
  collection.append(node('p','Together, these move the LP from '+usd(-earlier.gapUSD)+' behind holding to '+usd(end.gapUSD)+' ahead, before costs. The liquidity and bounds stay unchanged.','applied-evidence-detail'));

  const figure = node('figure', undefined, 'applied-eth-comparison');
  figure.append(node('figcaption', 'ETH held by each strategy'));
  for (const [key, label, amount, detail] of [
    ['lp', 'LP + earned fees', exposure.lpETH, 'Principal: USDC only. Earned fees: ETH + USDC.'],
    ['hold', 'Holding starting tokens', exposure.holdingETH, 'The original ETH + USDC.'],
  ]) {
    const row = node('div', undefined, 'applied-eth-row');
    const labelRow = node('div', undefined, 'applied-eth-label');
    const value = node('strong', formatTokenQuantity(amount, 6) + ' ETH');
    value.id = 'applied-price-' + key + '-eth';
    labelRow.append(node('span', label), ' ', value);
    const track = node('div', undefined, 'applied-eth-track'); track.setAttribute('aria-hidden', 'true');
    const fill = node('span'); fill.style.width = amount / exposure.holdingETH * 100 + '%'; track.append(fill);
    row.append(labelRow, track, node('p', detail, 'applied-evidence-detail')); figure.append(row);
  }
  figure.append(node('p', 'Both ETH bars use the same scale. ETH here is WETH, its wrapped form.', 'applied-evidence-detail'));
  price.append(heading('applied-price-heading', 'If ETH rises from here'),
    node('p', 'At the end of the record · above range · the LP leads by ' + usd(end.gapUSD) + ' before costs.', 'applied-evidence-moment'), figure);
}
