import { liquidityModelForInput } from '../models/liquidity-models.js';
import { economicsCSV } from './lp-exports.js';

export function scenarioCSV(input) {
  const model = liquidityModelForInput(input, 'full');
  const MODEL = model.MODEL;
  const extra = economicsCSV(input);
  const headers = ['model', 'investment_usd', 'initial_eth_price_usd', 'future_eth_price_usd', 'assumed_position_fees_usd', 'held_eth', 'held_usdc', 'lp_eth', 'lp_usdc', 'hold_value_usd', 'lp_before_fees_usd', 'lp_with_fees_usd', 'lp_minus_hold_usd', 'lp_minus_hold_percent', 'impermanent_loss_percent', 'break_even_fees_usd'];
  const comparisons = model.compare(input);
  const rows = comparisons.map((r) => [MODEL, r.investment, r.initialPrice, r.futurePrice, (r.feeIncome ?? r.fees), r.held.eth, r.held.usdc, r.pooled.eth, r.pooled.usdc, r.holdValue, r.lpBeforeFees, r.lpValue, r.difference, r.differencePercent, r.impermanentLoss, r.breakEvenFees]);
  if (input.feeMode !== undefined) {
    for (let i = 0; i < headers.length; i++) headers[i] = headers[i].replace('_with_fees_usd', '_after_fees_and_costs_usd');
    headers.push(...extra.headers, 'lp_before_costs_usd', 'lp_costs_total_usd', 'break_even_fee_apr_percent');
    rows.forEach((row, index) => row.push(...extra.values, comparisons[index].lpGrossValue, comparisons[index].costs, comparisons[index].breakEvenAPR ?? ''));
  }
  return [headers, ...rows].map((row) => row.join(',')).join('\r\n') + '\r\n';
}
