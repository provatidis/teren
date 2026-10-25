import { FEE_FLOW_MODEL, validateFeeFlow } from '../models/range-fee-flow-v1.js';
import { WIDTH_MODEL } from '../models/range-width.js';
import { widthHash, widthsFromHash } from './width-links.js';

// Compact tuples keep a complete eight-batch link within Home's route limit.
const tuple = batch => [batch.price, batch.volume, batch.competition, batch.feeTier, batch.protocolDivisor];
function fromTuple(values) {
  if (!Array.isArray(values) || values.length !== 5) throw new Error('This fee batch link is not supported.');
  const [price, volume, competition, feeTier, protocolDivisor] = values;
  return { price, volume, competition, feeTier, protocolDivisor };
}
export function widthFlowHash(input, state) {
  if (!state) return widthHash(input);
  const flow = validateFeeFlow(state);
  const parameters = new URLSearchParams(widthHash(input).slice(1));
  parameters.set('width', FEE_FLOW_MODEL);
  parameters.set('flow', JSON.stringify([flow.enabled, flow.volume, flow.competition,
    flow.feeTier, flow.protocolDivisor, flow.batches.map(tuple)]));
  return '#' + parameters;
}
export function widthFlowFromHash(hash) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ''));
  if (parameters.get('width') !== FEE_FLOW_MODEL) return { inputs: widthsFromHash(hash), flow: null };
  if (hash.length > 2400 || parameters.getAll('flow').length !== 1 || parameters.getAll('width').length !== 1) {
    throw new Error('This fee-flow link has missing or repeated inputs.');
  }
  let values;
  try { values = JSON.parse(parameters.get('flow')); }
  catch { throw new Error('This fee-flow link could not be read.'); }
  if (!Array.isArray(values) || values.length !== 6 || !Array.isArray(values[5])) {
    throw new Error('This fee-flow link is not supported.');
  }
  parameters.delete('flow'); parameters.set('width', WIDTH_MODEL);
  const [enabled, volume, competition, feeTier, protocolDivisor, batches] = values;
  return { inputs: widthsFromHash('#' + parameters),
    flow: validateFeeFlow({ enabled, volume, competition, feeTier, protocolDivisor, batches: batches.map(fromTuple) }) };
}
