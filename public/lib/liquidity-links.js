import { liquidityModel, liquidityModelForInput } from '../models/liquidity-models.js';

const baseKeys = { investment: 'investment', initialPrice: 'start', futurePrice: 'future', fees: 'fees' };
const rangeKeys = { lowerPrice: 'lower', upperPrice: 'upper', fullRangeFees: 'fullfees' };
const economicsKeys = { feeMode: 'feeMode', feeAPR: 'feeAPR', feeDays: 'days', openingCost: 'openCost', collectionCost: 'collectCost', closingCost: 'closeCost' };
function keysFor(model) {
  return { ...baseKeys, ...(model.family === 'range' ? rangeKeys : {}),
    ...(model.MODEL.endsWith('-v2') ? economicsKeys : {}) };
}
export function liquidityHash(input, family) {
  const model = liquidityModelForInput(input, family), scenario = model.validate(input);
  const params = new URLSearchParams({ scenario: model.MODEL });
  for (const [key, param] of Object.entries(keysFor(model))) params.set(param, String(scenario[key]));
  return '#' + params;
}
export function liquidityFromHash(hash, family) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!params.has('scenario')) return null;
  const model = liquidityModel(params.get('scenario'));
  if (!model || model.family !== family) throw new Error('This link uses an unsupported scenario model.');
  const keys = keysFor(model), allowed = new Set(['scenario', ...Object.values(keys)]);
  if ([...params.keys()].some(key => !allowed.has(key)) || params.getAll('scenario').length !== 1) {
    throw new Error('This scenario link contains unexpected or repeated inputs.');
  }
  const input = {};
  for (const [key, param] of Object.entries(keys)) {
    if (params.getAll(param).length !== 1 || !params.get(param).trim()) throw new Error('This scenario link is missing a required input.');
    input[key] = key === 'feeMode' ? params.get(param) : Number(params.get(param));
  }
  return model.validate(input);
}
