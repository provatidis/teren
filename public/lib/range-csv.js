import { liquidityModelForInput } from '../models/liquidity-models.js';
import { economicsCSV } from './lp-exports.js';

export function rangeCSV(input) {
  const model = liquidityModelForInput(input, 'range');
  const MODEL = model.MODEL;
  const extra = economicsCSV(input);
  const headers = ['model', 'investment_usd', 'initial_eth_price_usd', 'future_eth_price_usd', 'lower_eth_price_usd', 'upper_eth_price_usd', 'assumed_range_fees_usd', 'assumed_full_range_fees_usd', 'range_state', 'initial_range_eth', 'initial_range_usdc', 'final_range_eth', 'final_range_usdc', 'hold_range_initial_tokens_usd', 'range_lp_before_fees_usd', 'range_lp_with_fees_usd', 'range_lp_minus_own_hold_usd', 'range_il_before_fees_percent', 'range_break_even_fees_usd', 'full_range_lp_with_fees_usd', 'full_range_own_50_50_hold_usd'];
  const comparisons = model.compare(input);
  const rows = comparisons.map((r) => [
    MODEL, r.investment, r.initialPrice, r.futurePrice, r.lowerPrice, r.upperPrice, (r.feeIncome ?? r.fees), r.fullRangeFees, r.state,
    r.initial.eth, r.initial.usdc, r.pooled.eth, r.pooled.usdc, r.holdValue, r.lpBeforeFees, r.lpValue,
    r.difference, r.impermanentLoss, r.breakEvenFees, r.fullRange.lpValue, r.fullRange.holdValue,
  ]);
  if (input.feeMode !== undefined) {
    for (let i = 0; i < headers.length; i++) headers[i] = headers[i].replace('_with_fees_usd', '_after_fees_and_costs_usd');
    headers.push(...extra.headers, 'lp_before_costs_usd', 'lp_costs_total_usd', 'break_even_fee_apr_percent');
    rows.forEach((row, index) => row.push(...extra.values, comparisons[index].lpGrossValue, comparisons[index].costs, comparisons[index].breakEvenAPR ?? ''));
  }
  return [headers, ...rows].map((row) => row.join(',')).join('\r\n') + '\r\n';
}
