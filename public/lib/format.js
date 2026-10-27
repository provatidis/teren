export const fmt = (value, digits = 2) => value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export function usd(value) {
  const amount = fmt(Math.abs(value));
  return (value < 0 && amount !== '0.00' ? '−' : '') + '$' + amount;
}

export function signedUSD(value) {
  const amount = usd(value);
  return (value > 0 && amount !== '$0.00' ? '+' : '') + amount;
}

export const percent = (value) => (value < -0.005 ? '−' : value > 0.005 ? '+' : '') + fmt(Math.abs(value)) + '%';

export function compactUSD(value) {
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(Math.abs(value));
  return (value < 0 && amount !== '$0' ? '−' : '') + amount;
}

export function formatTokenQuantity(value, digits, minimumDigits = 0) {
  const threshold = 10 ** -digits;
  if (value > 0 && value < threshold) return '<' + threshold.toLocaleString('en-US', { maximumFractionDigits: digits });
  return value.toLocaleString('en-US', { minimumFractionDigits: minimumDigits, maximumFractionDigits: digits });
}
