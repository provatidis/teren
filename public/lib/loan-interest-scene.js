import { formatTokenQuantity } from './format.js';
import { loanMoney } from './lending-presentation.js';

// Both bars use the selected endpoint's USD valuation. ETH interest is still
// counted in ETH; changing its price cannot manufacture additional tokens.
export function loanInterestBreakdown(result) {
  const { input, end } = result;
  const scale = Math.max(end.collateralValue, end.debt);
  return [
    { key: 'supply', unit: 'ETH', original: input.collateral, added: result.supplyInterestTokens,
      total: end.collateralTokens, price: input.future },
    { key: 'debt', unit: 'USDC', original: input.borrow, added: result.borrowInterest,
      total: end.debt, price: 1 },
  ].map(row => ({ ...row,
    originalWidth: row.original * row.price / scale * 100,
    interestWidth: row.added * row.price / scale * 100,
  }));
}

export function createLoanInterestScene(root) {
  const rows = {};
  for (const [key, label] of [['supply', 'Supplied ETH'], ['debt', 'USDC debt']]) {
    const row = document.createElement('div'); row.className = 'loan-accrual-row'; row.dataset.balance = key;
    const heading = document.createElement('p'); heading.className = 'loan-accrual-heading';
    const name = document.createElement('span'); name.textContent = label;
    const total = document.createElement('strong'); total.id = 'loan-accrual-' + key + '-total';
    heading.append(name, total);
    const track = document.createElement('div'); track.className = 'loan-accrual-track'; track.setAttribute('aria-hidden', 'true');
    const original = document.createElement('span'); original.className = 'loan-accrual-original';
    const interest = document.createElement('span'); interest.className = 'loan-accrual-interest';
    track.append(original, interest);
    const details = document.createElement('p'); details.className = 'loan-accrual-detail'; details.id = 'loan-accrual-' + key + '-detail';
    row.append(heading, track, details); root.append(row);
    rows[key] = { total, original, interest, details };
  }
  const caption = document.createElement('p'); caption.className = 'fine-print'; caption.id = 'loan-accrual-caption';
  root.append(caption);
  return { render(result) {
    for (const data of loanInterestBreakdown(result)) {
      const row = rows[data.key], quantity = value => formatTokenQuantity(value, data.unit === 'ETH' ? 6 : 2) + ' ' + data.unit;
      row.total.textContent = quantity(data.total);
      row.original.style.width = data.originalWidth + '%';
      row.interest.style.width = data.interestWidth + '%';
      row.interest.hidden = data.added === 0;
      row.details.textContent = quantity(data.original) + ' original + ' + quantity(data.added) + ' interest';
    }
    const p = result.input;
    caption.textContent = (p.days === 0 ? 'At the start: no interest yet. ' : 'After ' + formatTokenQuantity(p.days, 4) + ' days, before any liquidation. ')
      + 'Both bars use dollar value at ' + loanMoney(p.future) + '/ETH. Hatched sections show added interest; borrowed wallet cash stays unchanged.';
  } };
}
