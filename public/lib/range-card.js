import { liquidityModelForInput } from '../models/liquidity-models.js';
import { feeBasisText, costText } from './lp-exports.js';
import { usd, percent } from './format.js';
import { STATE_COPY, rangePriceLabels, assetAmounts } from './range-presentation.js';
import { drawBrand } from './brand.js';

export async function rangeCardBlob(input, siteURL) {
  const model = liquidityModelForInput(input, 'range');
  const MODEL = model.MODEL, result = model.calculate(input);
  const costAware = result.costs !== undefined;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = costAware ? 1000 : 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create the range card.');
  ctx.fillStyle = '#101c27'; ctx.fillRect(0, 0, 1200, canvas.height);
  const text = (content, x, y, size, color = '#f6f4ee', weight = 400, maxWidth = 1080) => {
    ctx.fillStyle = color; ctx.font = weight + ' ' + size + 'px system-ui, sans-serif'; ctx.fillText(content, x, y, maxWidth);
  };
  await drawBrand(ctx, 60, 28);
  text('UNISWAP V3-STYLE · HYPOTHETICAL PRICE RANGE', 60, 108, 16, '#c0cbd3');
  const state = STATE_COPY[result.state];
  text(state.title + '. ' + state.assets + '.', 60, 180, 44, '#f6f4ee', 600);
  const ranges = rangePriceLabels(result.lowerPrice, result.upperPrice);
  text('Your range: ' + ranges.lower + ' – ' + ranges.upper, 60, 224, 22, '#c0cbd3');
  const totals = [
    ['HOLD STARTING MIX', result.holdValue, '#a9c7f5'],
    [costAware ? '50/50 LP AFTER COSTS' : 'V2-STYLE 50/50 LP', result.fullRange.lpValue, '#b5a8eb'],
    [costAware ? 'RANGE LP AFTER COSTS' : 'YOUR RANGE LP', result.lpValue, '#b3d7c8'],
  ];
  totals.forEach(([label, value, color], i) => {
    const x = 60 + i * 368;
    ctx.fillStyle = i === 2 ? '#284c55' : '#243747'; ctx.fillRect(x, 265, 344, 135);
    text(label, x + 20, 305, 15, '#c0cbd3', 400, 304);
    text(usd(value), x + 20, 366, 37, color, 500, 304);
  });
  text('Initial investment: $' + result.investment, 60, 450, 23);
  text('ETH: $' + result.initialPrice + ' → $' + result.futurePrice, 60, 490, 23);
  text('Range: $' + result.lowerPrice + ' → $' + result.upperPrice, 60, 530, 23);
  text('Assumed fees: range $' + (result.feeIncome ?? result.fees) + ' / full-range $' + result.fullRangeFees, 60, 570, 23);
  text('Starting range tokens: ' + assetAmounts(result.initial), 60, 610, 23);
  text('Range IL before fees: ' + percent(result.impermanentLoss), 60, 650, 23);
  text('Range fees needed to match holding: ' + usd(result.breakEvenFees), 60, 690, 23);
  if (costAware) {
    text(costText(result) + ' (same for both LPs)', 60, 730, 21);
    text(feeBasisText(result), 60, 770, 21);
  }
  const shift = costAware ? 80 : 0;
  text('Holding keeps the range’s starting mix. The full-range LP starts 50/50.', 60, 751 + shift, 18, '#c0cbd3');
  text('Teren calculation ' + MODEL + (costAware ? ' · USDC = $1 · Costs additional to holding · No tick rounding or compounding' : ' · USDC = $1 · No tick rounding, gas or compounding'), 60, 783 + shift, 17, '#c0cbd3');
  text('Hypothetical endpoints and assumed fees · Not a forecast', 60, 815 + shift, 17, '#c0cbd3');
  text(siteURL, 60, canvas.height - 34, 17, '#b3d7c8');
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Your browser could not export the range card.')), 'image/png'));
}
