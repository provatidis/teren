import { runLesson } from '../models/lesson-experiments.js';
import { amountOut } from '../models/uniswap-v2.js';

// A new view always starts from the lesson's original pool. Selecting another
// amount does not accumulate swaps or deposits in an imaginary history.
export function swapSceneState(input, amount = input.amount, variant = 0) {
  const result = runLesson('swap-impact', { ...input, amount }, variant);
  const s = result.setup;
  const before = { eth: s.reserveEth, usdc: s.reserveEth * s.initialPrice };
  const after = { eth: result.afterEth, usdc: result.afterUsdc };
  return { result, before, after, amount: s.amount, out: result.out,
    beforePrice: s.initialPrice, afterPrice: after.usdc / after.eth,
    average: result.out / s.amount, referenceAverage: result.smallOut };
}

export function depositSceneState(input, depositEth = input.depositEth, variant = 0) {
  const result = runLesson('pool-share', { ...input, depositEth }, variant);
  const s = result.setup;
  const before = { eth: s.reserveEth, usdc: s.reserveEth * s.initialPrice };
  const deposit = { eth: s.depositEth, usdc: result.usdcDeposit };
  const after = { eth: before.eth + deposit.eth, usdc: before.usdc + deposit.usdc };
  // One separate trader, after the proportional deposit. Reuse exact v2 swap
  // arithmetic; LP ownership itself remains the lesson's proportional model.
  const tradeETH = s.amount;
  const tradeUSDC = Number(amountOut(BigInt(tradeETH) * 10n ** 18n,
    BigInt(after.eth) * 10n ** 18n, BigInt(after.usdc) * 10n ** 6n)) / 1e6;
  const traded = { eth: after.eth + tradeETH, usdc: after.usdc - tradeUSDC };
  const fraction = result.share / 100;
  const claim = pool => ({ eth: pool.eth * fraction, usdc: pool.usdc * fraction });
  return { result, before, deposit, after, traded, fraction, tradeETH, tradeUSDC,
    initialClaim: claim(after), laterClaim: claim(traded) };
}
