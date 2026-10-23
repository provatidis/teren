import { loopMoney, loopTokens } from './loop-presentation.js';
import { formatTokenQuantity } from './format.js';

const usdc = value => formatTokenQuantity(value, 2) + ' USDC';
const starting = () => ({ wallet: 'Starting balance', supplied: 'Starting balance', debt: 'Starting balance' });

function building(result) {
  const [borrow, buy, supply] = result.steps.filter(step => step.round === 1);
  return {
    intro: 'Start with ' + loopTokens(result.initial.collateralTokens) + ' supplied. ETH stays at ' + loopMoney(result.input.start) + '; no interest or swap costs.',
    sliderLabel: 'Move through the round',
    completeLabel: 'Round complete',
    note: 'Count wallet assets and supplied ETH, then subtract the debt. Borrowing adds assets and a matching obligation.',
    stages: [
      {
        action: 'start', label: 'Start', title: 'Your original ETH is already supplied.',
        copy: 'The ETH is already supplied to back a loan. You have not borrowed yet.',
        position: result.initial, changes: starting(),
      },
      {
        action: 'borrow', label: 'Borrow', title: 'Borrowed USDC enters your wallet.',
        copy: 'USDC arrives in your wallet, and an equal debt appears. The ETH backing the loan stays put.',
        position: borrow.position,
        changes: { wallet: '+' + usdc(borrow.amount) + ' borrowed', supplied: 'Unchanged', debt: '+' + usdc(borrow.amount) + ' owed' },
      },
      {
        action: 'buy', label: 'Buy ETH', title: 'Spend the USDC to buy ETH.',
        copy: 'You spend the USDC on ETH. This new ETH is in your wallet; it does not back the loan yet.',
        position: buy.position,
        changes: { wallet: usdc(borrow.amount) + ' → ' + loopTokens(buy.amount), supplied: 'Unchanged', debt: 'Unchanged' },
      },
      {
        action: 'supply', label: 'Supply', title: 'Move the purchased ETH into collateral.',
        copy: 'The new ETH now backs the loan too. You still owe the same USDC.',
        position: supply.position,
        changes: { wallet: '−' + loopTokens(supply.amount) + ' moved out', supplied: '+' + loopTokens(supply.amount) + ' moved in', debt: 'Unchanged' },
      },
    ],
  };
}

function unwinding(result) {
  if (result.unwind.status !== 'complete') throw new RangeError('The unwind lesson needs a completed preview.');
  const total = result.unwind.steps.length;
  const stages = [{
    action: 'start', label: 'Start', title: 'The loop is still supplied, with debt outstanding.',
    copy: 'The ETH backs an unpaid loan. You can only withdraw some of it while the debt remains.',
    position: result.end, changes: starting(), costs: 0,
  }];
  for (const step of result.unwind.actions) {
    const pass = step.cycle ? 'Pass ' + step.cycle + ' of ' + total : '';
    const changes = { wallet: 'Unchanged', supplied: 'Unchanged', debt: 'Unchanged' };
    let label, title, copy;
    if (step.action === 'withdraw') {
      label = 'Withdraw'; title = 'Move part of the supplied ETH into the wallet.';
      copy = 'Some ETH moves to your wallet. The ETH left behind must still back the unpaid loan.';
      changes.wallet = '+' + loopTokens(step.amount) + ' moved in';
      changes.supplied = '−' + loopTokens(step.amount) + ' moved out';
    } else if (step.action === 'sell') {
      label = 'Sell ETH'; title = 'Sell wallet ETH for USDC.';
      copy = 'Selling puts USDC in your wallet, after swap costs. You still owe the same debt.';
      changes.wallet = loopTokens(step.amount) + ' → ' + usdc(step.proceeds);
    } else if (step.action === 'repay') {
      label = 'Repay'; title = step.position.debt === 0 ? 'Clear the remaining debt.' : 'Spend the wallet USDC to reduce debt.';
      copy = step.position.debt === 0
        ? 'Debt is cleared. The remaining ETH is still supplied until you withdraw it.'
        : 'Wallet USDC pays down the debt. With less debt to back, you can withdraw more ETH.';
      changes.wallet = '−' + usdc(step.amount) + ' paid';
      changes.debt = '−' + usdc(step.amount) + ' repaid';
    } else if (step.action === 'release') {
      label = 'Withdraw rest'; title = 'Move the remaining supplied ETH into the wallet.';
      copy = 'The remaining ETH is now in your wallet. The loan is fully repaid.';
      changes.wallet = '+' + loopTokens(step.amount) + ' moved in';
      changes.supplied = '−' + loopTokens(step.amount) + ' moved out';
    } else throw new RangeError('Unknown unwind action.');
    stages.push({ action: step.action, pass, label, title, copy, changes, position: step.position, costs: step.costs });
  }
  return {
    intro: 'Start after ' + result.input.rounds + ' rounds. ETH stays at ' + loopMoney(result.input.future) + '; each sale costs ' + result.input.swapCost + '%.',
    sliderLabel: 'Move through the unwind', completeLabel: 'Unwind complete',
    note: 'Starting balances already include the costs of building the loop. This fixed-price preview leaves out gas, market changes and withdrawal liquidity limits.',
    stages,
  };
}

export function loopFlowStages(result, lesson) {
  if (lesson === 'build') return building(result);
  if (lesson === 'unwind') return unwinding(result);
  throw new RangeError('Choose a money-flow lesson.');
}
