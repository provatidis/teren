import { liquidityModelForInput } from '../models/liquidity-models.js';
import { feeBasisText, costText } from './lp-exports.js';
import { usd, percent } from './format.js';
import { drawBrand } from './brand.js';

export async function resultCardBlob(input, siteURL) {
  const model = liquidityModelForInput(input, 'full');
  const MODEL = model.MODEL, result = model.calculate(input);
  const costAware = result.costs !== undefined;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = costAware ? 820 : 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create the result card.');
  ctx.fillStyle = '#101c27'; ctx.fillRect(0, 0, 1200, canvas.height);
  const text = (content, x, y, size, color = '#f6f4ee', weight = 400) => {
    ctx.fillStyle = color; ctx.font = weight + ' ' + size + 'px system-ui, sans-serif';
    ctx.fillText(content, x, y, 1080);
  };
  await drawBrand(ctx, 60, 28);
  text('UNISWAP V2-STYLE · HYPOTHETICAL FULL RANGE', 60, 108, 16, '#c0cbd3');
  const gap = Math.abs(result.difference);
  text(gap < 0.005 ? 'Values differ by less than $0.01' : result.difference > 0 ? 'LP value is higher than holding' : 'Holding value is higher than LP', 60, 182, 46, '#f6f4ee', 600);
  ctx.fillStyle = '#243747'; ctx.fillRect(60, 220, 510, 150); ctx.fillRect(600, 220, 540, 150);
  text('KEEP THE ORIGINAL TOKENS', 84, 259, 16, '#c0cbd3');
  text(usd(result.holdValue), 84, 325, 45);
  text(costAware ? 'LP AFTER FEES & COSTS' : 'LIQUIDITY + ASSUMED FEES', 624, 259, 16, '#c0cbd3');
  text(usd(result.lpValue), 624, 325, 45, '#b3d7c8');
  text('Initial investment: ' + usd(result.investment), 60, 416, 23);
  text('ETH: ' + usd(result.initialPrice) + ' → ' + usd(result.futurePrice), 60, 454, 23);
  text('Assumed fee income: ' + usd((result.feeIncome ?? result.fees)) + ' total cash', 60, 492, 23);
  if (costAware) {
    text(costText(result), 60, 530, 21);
    text(feeBasisText(result), 60, 568, 21);
  }
  const shift = costAware ? 76 : 0;
  text('IL before fees: ' + percent(result.impermanentLoss), 60, 530 + shift, 23);
  text('Fees needed to match holding: ' + usd(result.breakEvenFees), 60, 568 + shift, 23);
  text('Full-range 50/50 ETH/USDC · USDC = $1 · Teren calculation ' + MODEL, 60, 625 + shift, 18, '#c0cbd3');
  text(costAware ? 'Costs additional to holding · No incentives or compounding · Not a forecast' : 'Hypothetical outcomes · No gas, incentives or compounding · Not a forecast', 60, 655 + shift, 17, '#c0cbd3');
  text(siteURL, 60, canvas.height - 30, 17, '#b3d7c8');
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Your browser could not export the result card.')), 'image/png'));
}
