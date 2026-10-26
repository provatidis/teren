import { formatTokenQuantity as fmt, usd } from './format.js';
export function economicsCSV(input) {
  return { headers: ['fee_mode', 'cash_fee_input_usd', 'assumed_average_fee_apr_percent', 'duration_days_0_unspecified',
    'opening_cost_usd', 'collection_cost_usd', 'closing_cost_usd', 'cost_scope'],
  values: [input.feeMode, input.fees, input.feeAPR, input.feeDays, input.openingCost,
    input.collectionCost, input.closingCost, 'additional_to_holding'] };
}
export function feeBasisText(result) {
  if (result.feeMode === undefined) return 'Total cash fees; duration unspecified';
  return (result.feeMode === 'apr' ? fmt(result.feeAPR, 4) + '% assumed average fee APR' : 'Total cash fee assumption')
    + (result.feeDays ? ' · ' + fmt(result.feeDays, 2) + ' days' : ' · No duration set');
}
export function costText(result) {
  return 'Costs: open ' + usd(result.openingCost) + ' / collect ' + usd(result.collectionCost) + ' / close ' + usd(result.closingCost);
}
