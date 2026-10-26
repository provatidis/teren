import { usd, signedUSD, compactUSD } from './format.js';

// Keep headline figures readable at large allowed inputs. Exact values remain
// in the title, comparison tables and exports; calculations are never rounded.
export function moneyMetric(element, value, signed = false) {
  const exact = signed ? signedUSD(value) : usd(value);
  element.textContent = Math.abs(value) < 1e6 ? exact
    : (signed && value > 0 ? '+' : value < 0 ? '−' : '') + compactUSD(Math.abs(value));
  element.title = exact;
}
