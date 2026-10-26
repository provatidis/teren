import { LST_DEFAULTS as LEGACY_DEFAULTS, LST_KEYS as LEGACY_KEYS, validateLST as validateLegacy, calculateLST as calculateLegacy } from './lst-loop-v1.js';
import { lstBalance, finishLST } from './lst-accounting.js';

export const LST_MODEL = 'lst-loop-v2';
export const LST_DEFAULTS = Object.freeze({ ...LEGACY_DEFAULTS,
  buildMode: 'target', targetExposure: 3, buildFlashFee: 0.05, exitMode: 'weth',
});
export const LST_KEYS = Object.freeze([...LEGACY_KEYS, 'buildMode', 'targetExposure', 'buildFlashFee', 'exitMode']);

// Old records describe sequential rounds and a full sale. Never reinterpret
// their stored oracle, rates or construction as the new default setup.
export function upgradeLST(input) {
  return { ...input, buildMode: 'rounds', targetExposure: 3, buildFlashFee: 0.05, exitMode: 'weth' };
}

export function targetExposureLimit(input) {
  const feeFactor = 1 + input.buildFlashFee / 100;
  return feeFactor / (feeFactor - input.maxLTV / 100 * (1 - input.swapCost / 100));
}

export function validateLST(input) {
  const errors = validateLegacy(input);
  if (input?.buildMode === 'target' && Number.isFinite(input.borrowPercent) && input.borrowPercent >= 1 && input.borrowPercent <= 95) {
    // The retained per-round preference is inactive in a target construction.
    delete errors.borrowPercent;
  }
  if (!['rounds', 'target'].includes(input?.buildMode)) errors.buildMode = 'Choose how to build the position.';
  if (!['weth', 'wsteth'].includes(input?.exitMode)) errors.exitMode = 'Choose which asset to keep after repaying.';
  for (const [key, min, max] of [['targetExposure', 1, 50], ['buildFlashFee', 0, 5]]) {
    if (!Number.isFinite(input?.[key]) || input[key] < min || input[key] > max) errors[key] = `Enter a number from ${min} to ${max}.`;
  }
  if (input?.buildMode === 'target' && !['targetExposure', 'buildFlashFee', 'swapCost', 'maxLTV'].some(key => errors[key])) {
    const limit = targetExposureLimit(input);
    if (input.targetExposure > limit + 1e-12) {
      const shown = Math.floor((limit + 1e-12) * 1000) / 1000;
      errors.targetExposure = 'This target needs more debt than maximum LTV allows. Choose ' + shown.toFixed(3) + '× or lower, or review the costs and LTV.';
    }
  }
  return errors;
}

function buildTarget(input) {
  const original = input.collateral, collateral = original * input.targetExposure;
  const purchase = collateral - original;
  const flash = purchase * input.rate / (1 - input.swapCost / 100);
  const buildCosts = flash * input.swapCost / 100;
  const buildFlashCost = flash * input.buildFlashFee / 100;
  const debt = flash + buildFlashCost;
  const state = (supplied, loan = 0, cash = 0, tokens = 0, temporary = 0) =>
    lstBalance(supplied, loan, input.rate, input.rate, input.threshold, cash, tokens, temporary);
  const initial = state(original), start = state(collateral, debt);
  const steps = [{ action: 'start', round: 0, position: initial }];
  if (flash > 0) steps.push(
    { action: 'build-flash', amount: flash, position: state(original, 0, flash, 0, flash) },
    { action: 'buy', amount: purchase, cost: buildCosts, position: state(original, 0, 0, purchase, flash) },
    { action: 'supply', amount: purchase, position: state(collateral, 0, 0, 0, flash) },
    { action: 'finance', amount: debt, position: state(collateral, debt, debt, 0, flash) },
    { action: 'build-settle', cost: buildFlashCost, position: start },
  );
  return { initial, steps, start, buildCosts, buildFlashCost };
}

function retainExit(result) {
  const { input, end } = result, full = result.exit;
  const due = end.debt + full.flashCost + input.gas;
  const sold = due / (end.marketPrice * (1 - input.exitCost / 100));
  const retained = Math.max(0, end.collateral - sold);
  const swapLoss = sold * end.marketPrice * input.exitCost / 100;
  const exit = { ...full, mode: 'wsteth', cash: full.status === 'complete' ? 0 : null,
    retained: full.status === 'complete' ? retained : null, sold, swapLoss, steps: [], remaining: end };
  if (full.status !== 'complete') return exit;
  const state = (collateral, debt, cash = 0, tokens = 0, flashDebt = 0) =>
    lstBalance(collateral, debt, end.marketPrice, end.oraclePrice, input.threshold, cash, tokens, flashDebt);
  exit.steps.push({ action: 'start', position: end });
  if (end.debt > 0) exit.steps.push(
    { action: 'flash', position: state(end.collateral, end.debt, end.debt, 0, end.debt) },
    { action: 'repay', position: state(end.collateral, 0, 0, 0, end.debt) },
  );
  exit.steps.push({ action: 'release', position: state(0, 0, 0, end.collateral, end.debt) });
  if (sold > 0) exit.steps.push({ action: 'sell-part', amount: sold, cost: swapLoss,
    position: state(0, 0, due, retained, end.debt) });
  exit.remaining = state(0, 0, 0, retained);
  exit.steps.push({ action: 'keep', position: exit.remaining });
  return exit;
}

export function calculateLST(input) {
  const errors = validateLST(input);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors)[0]);
  const result = input.buildMode === 'target'
    ? finishLST(input, buildTarget(input), LST_MODEL)
    : { ...calculateLegacy(input), model: LST_MODEL };
  result.exits = { weth: { ...result.exit, mode: 'weth', sold: result.end.collateral, retained: result.exit.status === 'complete' ? 0 : null },
    wsteth: retainExit(result) };
  result.exit = result.exits[input.exitMode];
  return result;
}
