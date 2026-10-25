// Lightweight navigation metadata. The destination validates the model inputs.
export const EXPERIMENT_LOCATION_KEY = 'teren-experiment-location-v1';
const destinations = {
  'cp50-v1': { page: 'liquidity.html', prefix: '#scenario=cp50-v1&', title: 'Liquidity · full range' },
  'cl-range-v1': { page: 'liquidity.html', prefix: '#scenario=cl-range-v1&', title: 'Liquidity · price range' },
  'cl-width-v1': { page: 'liquidity.html', prefix: '#width=cl-width-v1&', title: 'Liquidity · compare widths' },
  'collateral-loan-v1': { page: 'lending.html', prefix: '#loan=collateral-loan-v1&', title: 'Lending · single loan' },
  'borrowing-loop-v1': { page: 'lending.html', prefix: '#loop=borrowing-loop-v1&', title: 'Lending · borrowing loops' },
};

function locationView(value) {
  const target = Object.hasOwn(destinations, value?.model) ? destinations[value.model] : null;
  if (value?.version !== 1 || !target || typeof value.hash !== 'string' ||
    value.hash.length > 2500 || !value.hash.startsWith(target.prefix) || /[\s<>"'\\]/.test(value.hash)) return null;
  return { route: target.page + value.hash, title: target.title };
}

export function readExperimentLocation(getStorage = () => globalThis.localStorage) {
  try { return locationView(JSON.parse(getStorage().getItem(EXPERIMENT_LOCATION_KEY))); }
  catch { return null; }
}

export function saveExperimentLocation(model, hash, getStorage = () => globalThis.localStorage) {
  const record = { version: 1, model, hash };
  if (!locationView(record)) return false;
  try { getStorage().setItem(EXPERIMENT_LOCATION_KEY, JSON.stringify(record)); return true; }
  catch { return false; }
}
