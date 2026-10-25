import { WIDTH_MODEL, validateWidths } from '../models/range-width.js';

const keys = { investment: 'capital', initialPrice: 'start', futurePrice: 'price', widthA: 'a', widthB: 'b' };
export function isWidthHash(hash) {
  return hash === '#compare-widths' || new URLSearchParams(hash.replace(/^#/, '')).has('width');
}
export function widthHash(input) {
  const scenario = validateWidths(input);
  const parameters = new URLSearchParams({ width: WIDTH_MODEL });
  for (const [key, name] of Object.entries(keys)) parameters.set(name, String(scenario[key]));
  return '#' + parameters;
}
export function widthsFromHash(hash) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ''));
  if (!parameters.has('width')) return null;
  const allowed = new Set(['width', ...Object.values(keys)]);
  if (parameters.get('width') !== WIDTH_MODEL || parameters.getAll('width').length !== 1
    || [...parameters.keys()].some(key => !allowed.has(key))) throw new Error('This width comparison link is not supported.');
  const input = {};
  for (const [key, name] of Object.entries(keys)) {
    if (parameters.getAll(name).length !== 1 || !parameters.get(name).trim()) {
      throw new Error('This width comparison link has missing or repeated inputs.');
    }
    input[key] = Number(parameters.get(name));
  }
  return validateWidths(input);
}
