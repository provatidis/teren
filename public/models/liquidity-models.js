import * as fullV1 from './cp50-v1.js';
import * as fullV2 from './cp50-v2.js';
import * as rangeV1 from './cl-range-v1.js';
import * as rangeV2 from './cl-range-v2.js';

const versions = Object.freeze(Object.fromEntries([
  [fullV1, 'full'], [fullV2, 'full'], [rangeV1, 'range'], [rangeV2, 'range'],
].map(([model, family]) => [model.MODEL, {
  ...model, family,
  validate: model.validateScenario ?? model.validateRange,
  calculate: model.calculateScenario ?? model.calculateRange,
  compare: model.comparisonScenarios ?? model.comparisonRanges,
}])));
export const liquidityModel = model => Object.hasOwn(versions, model) ? versions[model] : null;
export const isFullModel = model => liquidityModel(model)?.family === 'full';
export const isRangeModel = model => liquidityModel(model)?.family === 'range';
export const liquidityModelForInput = (input, family) => versions[
  `${family === 'full' ? 'cp50' : 'cl-range'}-v${Object.hasOwn(input ?? {}, 'feeMode') ? 2 : 1}`
];
