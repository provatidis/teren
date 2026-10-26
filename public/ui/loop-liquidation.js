import { LIQUIDATION_DEFAULTS, LIQUIDATION_LIMITS, validateLiquidation } from '../models/single-liquidation-v1.js';
import { loopLiquidation } from '../models/loop-risk.js';
import { healthLabel } from '../lib/lending-presentation.js';
import { loopMoney, loopTokens } from '../lib/loop-presentation.js';
import { formatTokenQuantity } from '../lib/format.js';

export function initLoopLiquidation(onChange) {
  const $ = suffix => document.getElementById('loop-liquidation-' + suffix);
  const keys = Object.keys(LIQUIDATION_LIMITS);
  let wasEligible = false;

  function read() {
    return Object.fromEntries(keys.map(key => [key, $(key).value.trim() === '' ? NaN : Number($(key).value)]));
  }
  function write(assumptions = LIQUIDATION_DEFAULTS) {
    for (const key of keys) $(key).value = assumptions[key];
  }
  function render(result) {
    const assumptions = read();
    const errors = validateLiquidation(assumptions);
    const valid = Object.keys(errors).length === 0;
    for (const key of keys) {
      $(key).setAttribute('aria-invalid', String(!!errors[key]));
      $(key + '-error').textContent = errors[key] || '';
      $(key + '-error').hidden = !errors[key];
    }
    const eligible = result.end.status === 'eligible';
    if (eligible && !wasEligible) document.getElementById('loop-liquidation').open = true;
    wasEligible = eligible;
    $('caption').textContent = eligible ? 'See what one event takes and what remains.' : 'One event at your selected ETH price.';
    const event = valid ? loopLiquidation(result, assumptions) : null;
    $('result').hidden = event?.status !== 'executed';
    if (!valid) {
      $('status').textContent = 'Check the highlighted event assumptions. The loop balances above are still valid.';
    } else if (event.status !== 'executed') {
      $('status').textContent = result.end.status === 'no-debt'
        ? 'With no debt, there is no loan to liquidate.'
        : 'This setup is not eligible for liquidation at the selected price. Choose a price below its boundary to explore an event.';
    } else {
      const elapsed = result.input.days === 0 ? 'with no time elapsed' : 'after ' + result.input.days + (result.input.days === 1 ? ' day' : ' days');
      $('status').textContent = 'Your main setup at ' + loopMoney(result.input.future) + '/ETH, ' + elapsed + '. This event is separate from the unwind preview.';
      $('repaid').textContent = formatTokenQuantity(event.repaid, 2) + ' USDC';
      $('removed').textContent = loopTokens(event.removedTokens);
      $('removed-value').textContent = 'Worth ' + loopMoney(event.removedValue) + ' at the selected price. ' + loopMoney(event.repaid) + ' pays down debt.';
      $('penalty').textContent = loopMoney(event.penalty);
      $('collateral').textContent = loopTokens(event.remainingTokens);
      $('debt').textContent = formatTokenQuantity(event.remainingDebt, 2) + ' USDC';
      $('before').textContent = loopMoney(event.beforeNetAssets);
      $('net').textContent = loopMoney(event.netAssets);
      $('loss').textContent = 'Assets minus debt falls by the ' + loopMoney(event.penalty) + ' bonus. The rest of the collateral taken repays debt.';
      $('health').textContent = event.remainingHealth === null ? 'All debt is repaid in this event.'
        : event.exhausted ? 'All collateral is used. ' + loopMoney(event.remainingDebt) + ' of unpaid debt remains; it has not been written off.'
          : 'Remaining health factor: ' + healthLabel(event.remainingHealth) + (event.remainingHealth < 1
            ? '. Still below 1, so another liquidation could be possible.'
            : '. This does not prevent a later liquidation if conditions change.');
    }
    return { valid, assumptions };
  }
  for (const key of keys) $(key).addEventListener('input', onChange);
  return { read, write, render };
}
