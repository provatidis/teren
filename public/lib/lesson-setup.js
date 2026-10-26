import { fmt, usd } from './format.js';

// Keep the facts needed for a prediction together, before its answer choices.
export function renderLessonSetup(container, { facts, action, assumptions, title = 'Starting setup', actionLabel = 'What changes' }) {
  container.classList.add('learn-setup');
  const heading = document.createElement('p');
  heading.className = 'learn-setup-title'; heading.textContent = title;
  const list = document.createElement('dl');
  for (const [label, value, token] of facts) {
    const row = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
    term.textContent = label;
    if (token) {
      const marker = document.createElement('span');
      marker.className = 'allocation-swatch allocation-swatch-' + token;
      marker.setAttribute('aria-hidden', 'true'); detail.append(marker, ' ');
    }
    detail.append(value); row.append(term, ' ', detail); list.append(row);
  }
  const nodes = [heading, list];
  for (const [label, copy, name] of [[actionLabel, action, 'action'], ['Keep in mind', assumptions, 'assumptions']]) {
    if (!copy) continue;
    const line = document.createElement('p'), strong = document.createElement('strong');
    line.className = 'learn-setup-' + name; strong.textContent = label + ': ';
    line.append(strong, copy); nodes.push(line);
  }
  container.replaceChildren(...nodes);
}

export function liquidityLessonSetup(id, input) {
  const s = input;
  if (id === 'swap-impact' || id === 'pool-share') return {
    facts: [['ETH in the pool', fmt(s.reserveEth, 0) + ' ETH', 'eth'],
      ['USDC in the pool', fmt(s.reserveEth * s.initialPrice, 0) + ' USDC', 'usdc'],
      ['Starting price', usd(s.initialPrice) + ' per ETH']],
    action: id === 'swap-impact' ? 'Swap ' + fmt(s.amount, 0) + ' ETH for USDC.'
      : 'Add ' + fmt(s.depositEth, 0) + ' ETH and ' + fmt(s.depositEth * s.initialPrice, 0) + ' USDC together.',
    assumptions: id === 'swap-impact' ? 'The swap pays a 0.3% fee.' : 'Deposit both tokens in the pool’s existing ratio.',
  };
  const fees = ['fee-break-even', 'final-challenge'].includes(id);
  const facts = [['Starting budget', usd(s.investment)], ['Starting ETH price', usd(s.initialPrice)]];
  if (id === 'range-boundaries') facts.push(['Your range', usd(s.initialPrice * (1 - s.width)) + '–' + usd(s.initialPrice * (1 + s.width))]);
  if (fees) facts.push(['Assumed cash fees', usd(s.fees)]);
  return {
    facts, action: 'ETH’s price moves to ' + usd(s.futurePrice) + '.',
    assumptions: 'USDC stays at $1. ' + (fees ? 'Fee income is an assumption, kept separate from principal.' : 'Exclude fees from this comparison.'),
  };
}

export function managementLessonSetup(result) {
  if (result.id === 'range-width') return {
    facts: [['Each starting budget', '$5,000'], ['Starting ETH price', '$2,000'],
      ['Narrow range', '$1,900–$2,100'], ['Wider range', '$1,500–$2,500']],
    action: 'ETH’s price moves to ' + usd(result.price) + '.',
    assumptions: 'Each range starts with its own token mix. USDC stays at $1; earned fees are unknown.',
  };
  if (result.id === 'fee-tiers') return {
    facts: [['Pool A swap fee', fmt(result.rates[0], 2) + '%'], ['Pool B swap fee', fmt(result.rates[1], 2) + '%']],
    action: 'Compare the two positions’ fee income over the same example day.',
    assumptions: 'Same WETH/USDC pair and equal position budgets. Trade activity and each position’s share of active liquidity are not supplied.',
  };
  return {
    facts: [['Starting budget', '$5,000'], ['Starting ETH price', '$2,000'], ['Unchanged range', '$1,800–$2,200']],
    action: 'After the range exit, ETH moves from ' + usd(result.prices[0]) + ' to ' + usd(result.prices[1]) + '.',
    assumptions: 'Keep liquidity and bounds unchanged. USDC stays at $1; compare principal before fees.',
  };
}

export function lendingLessonSetup(id, { input: s, result: r }) {
  const eth = fmt(s.collateral, 0) + ' ETH', debt = fmt(s.borrow ?? 0, 0) + ' USDC';
  if (id === 'supply') return {
    facts: [['Your starting tokens', eth, 'eth'], ['ETH price', usd(s.start)], ['Collateral setting', 'Off · no borrowing']],
    action: 'Supply the ETH, then let one year pass at ' + fmt(s.supplyAPR, 0) + '% simple annual interest.',
    assumptions: 'Keep ETH’s price unchanged and collateral off. The interest rate is a teaching assumption.',
  };
  if (id === 'borrow') return {
    facts: [['Supplied collateral', eth, 'eth'], ['ETH price', usd(s.start)], ['Starting debt', 'None']],
    action: 'Borrow ' + debt + ' and keep it in your wallet.',
    assumptions: 'No time passes or costs apply. USDC = $1. Assumed borrowing limit: ' + s.maxLTV + '%; liquidation threshold: ' + s.threshold + '%.',
  };
  if (id === 'conditions') return {
    facts: [['Collateral', eth, 'eth'], ['Debt', debt], ['ETH price', usd(s.start)]],
    action: 'Let one year pass at ' + s.borrowAPR + '% simple borrow APR and ' + s.supplyAPR + '% supply APR.',
    assumptions: 'ETH’s price and the ' + s.threshold + '% liquidation threshold stay fixed. USDC = $1; rates are teaching assumptions.',
  };
  if (id === 'respond') return {
    facts: [['Collateral', eth, 'eth'], ['ETH price', usd(s.future)], ['Debt', debt], ['Extra budget', usd(s.budget)]],
    action: 'Use the extra money either to repay USDC debt or to buy and supply more ETH.',
    assumptions: 'Each option uses the same extra budget once. Keep prices and the ' + s.threshold + '% liquidation threshold fixed; execution is immediate, with no costs.',
  };
  if (id === 'build') return {
    facts: [['Supplied collateral', eth, 'eth'], ['ETH price', usd(s.start)], ['Starting debt', 'None']],
    actionLabel: 'One loop',
    action: 'Borrow ' + fmt(r.rounds[0].borrowed, 0) + ' USDC → buy ETH with all of it → supply the purchased ETH.',
    assumptions: 'Keep ETH’s price unchanged. USDC = $1; ignore interest and swap costs.',
  };
  if (id === 'stress') return {
    facts: [['Each choice starts with', eth, 'eth'], ['Starting ETH price', usd(s.start)], ['Loop construction', s.rounds + ' rounds']],
    action: 'In each round, borrow ' + s.borrowPercent + '% of the value just supplied, buy ETH and supply it. Then lower ETH’s price to ' + usd(s.future) + '.',
    assumptions: 'Compare with holding the original ETH. No interest or swap costs; balances are before liquidation. USDC = $1.',
  };
  if (id !== 'unwind') throw new RangeError('Choose a lending lesson.');
  return {
    facts: [['Collateral after ' + s.rounds + ' rounds', fmt(r.end.collateralTokens, 4) + ' ETH', 'eth'],
      ['Debt still owed', fmt(r.end.debt, 2) + ' USDC'], ['ETH price', usd(s.future)]],
    action: 'Withdraw part of the collateral → sell it for USDC → repay debt. Repeat, then withdraw the remaining ETH.',
    assumptions: 'Unlike the previous zero-cost example, this loop includes ' + s.swapCost + '% swap costs when building and closing it. That is why its starting collateral and debt differ slightly. Keep prices fixed; no outside money or flash loan. USDC = $1.',
  };
}
