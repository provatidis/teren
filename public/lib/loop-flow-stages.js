import { loopMoney, loopTokens } from './loop-presentation.js';
import { formatTokenQuantity } from './format.js';

const usdc = value => formatTokenQuantity(value, 2) + ' USDC';
const starting = () => ({ wallet: 'Starting balance', supplied: 'Starting balance', debt: 'Starting balance' });

function building(result) {
  const [borrow, buy, supply] = result.steps.filter(step => step.round === 1);
  return {
    intro: 'One round at ' + loopMoney(result.input.start) + '/ETH, without interest or swap costs.',
    sliderLabel: 'Move through the round',
    completeLabel: 'Round complete',
    note: 'Count wallet assets and supplied ETH, then subtract the debt. Borrowing adds assets and a matching obligation.',
    stages: [
      {
        label: 'Start', title: 'Your original ETH is already supplied.',
        copy: 'Your original ETH is supplied. The wallet is empty, and there is no debt.',
        position: result.initial, changes: starting(),
      },
      {
        label: 'Borrow', title: 'Borrowed USDC enters your wallet.',
        copy: 'Borrowed USDC enters the wallet. An equal debt appears; the supplied ETH is unchanged.',
        position: borrow.position,
        changes: { wallet: '+' + usdc(borrow.amount) + ' borrowed', supplied: 'Unchanged', debt: '+' + usdc(borrow.amount) + ' owed' },
      },
      {
        label: 'Buy ETH', title: 'Spend the USDC to buy ETH.',
        copy: 'The USDC is spent on ETH. This ETH is in your wallet and does not back the loan yet.',
        position: buy.position,
        changes: { wallet: usdc(borrow.amount) + ' → ' + loopTokens(buy.amount), supplied: 'Unchanged', debt: 'Unchanged' },
      },
      {
        label: 'Supply', title: 'Move the purchased ETH into collateral.',
        copy: 'The new ETH moves into collateral. The debt stays unchanged.',
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
    label: 'Start', title: 'The loop is still supplied, with debt outstanding.',
    copy: 'ETH is supplied and USDC is owed. The loan limits how much ETH can be withdrawn at once.',
    position: result.end, changes: starting(), costs: 0,
  }];
  for (const step of result.unwind.actions) {
    const pass = 'Pass ' + step.cycle + ' of ' + total + '. ';
    const changes = { wallet: 'Unchanged', supplied: 'Unchanged', debt: 'Unchanged' };
    let label, title, copy;
    if (step.action === 'withdraw') {
      label = 'Withdraw'; title = 'Move part of the supplied ETH into the wallet.';
      copy = pass + 'Move ETH to the wallet. Supplied ETH still backs the unchanged debt.';
      changes.wallet = '+' + loopTokens(step.amount) + ' moved in';
      changes.supplied = '−' + loopTokens(step.amount) + ' moved out';
    } else if (step.action === 'sell') {
      label = 'Sell ETH'; title = 'Sell wallet ETH for USDC.';
      copy = pass + 'Sell wallet ETH for USDC, less swap costs. The debt stays unchanged.';
      changes.wallet = loopTokens(step.amount) + ' → ' + usdc(step.proceeds);
    } else if (step.action === 'repay') {
      label = 'Repay'; title = step.position.debt === 0 ? 'Clear the remaining debt.' : 'Spend the wallet USDC to reduce debt.';
      copy = step.position.debt === 0
        ? 'Debt is cleared. The remaining ETH is still supplied until you withdraw it.'
        : pass + 'Spend wallet USDC to repay debt. This makes more ETH available to withdraw.';
      changes.wallet = '−' + usdc(step.amount) + ' paid';
      changes.debt = '−' + usdc(step.amount) + ' repaid';
    } else if (step.action === 'release') {
      label = 'Withdraw rest'; title = 'Move the remaining supplied ETH into the wallet.';
      copy = 'The remaining ETH is now in your wallet. In this model, the loan no longer limits the withdrawal.';
      changes.wallet = '+' + loopTokens(step.amount) + ' moved in';
      changes.supplied = '−' + loopTokens(step.amount) + ' moved out';
    } else throw new RangeError('Unknown unwind action.');
    stages.push({ label, title, copy, changes, position: step.position, costs: step.costs });
  }
  return {
    intro: 'ETH stays at ' + loopMoney(result.input.future) + '. Each sale loses ' + result.input.swapCost + '% to swap costs.',
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
