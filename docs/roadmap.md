# Next discussion

Updated for 1.44.0. These are discussion priorities, not commitments to build every item.

## Next lab iteration

The lab-risk release added the ETH/USDC loop liquidation event, visible price boundaries and clearer oracle assumptions. Release 1.43.0 adds exact LST targets, the flash-assisted construction ledger and a comparison of full WETH exits with retaining unsold wstETH after repayment. Borrowing rounds and older scenarios remain available. The LTV ceiling is an accounting constraint, not proof that a transaction can execute.

Release 1.44.0 makes single-loan interest explicit and consistent across balances, health, responses and liquidation, with a time visual and preserved legacy simple-interest setups. The next candidate is optional LP costs plus an assumed **position** fee APR and duration. Do not automatically multiply a pool APR by concentration: competing active liquidity and time in range remain separate assumptions. An atomic ETH/USDC exit and fee-aware sandbox arbitrage are later candidates.

## Learning depth

The lesson clarity release improves feedback, changed situations and the connection between questions and visuals. Next candidates are a liquidation lesson that separates debt repaid, collateral removed and the bonus cost, and a correlated-asset looping chapter using the existing LST experiment. Keep the first lending lesson focused on supply before introducing existing-debt restrictions. Neither a new chapter nor an observed-learning claim follows from polishing the interface alone.

## Correlated-asset looping and LSTs

The first wstETH/WETH experiment shipped in 1.39.0: build the balances, separate staking and collateral lending growth from WETH borrow costs, stress sale/oracle prices, and inspect a hypothetical atomic exit. The existing ETH/USDC loop remains available.

Next, use this experiment to identify which assumptions experienced users actually want to compare. Test whether a person can distinguish a shared ETH-dollar move, a market discount and an oracle change, and whether they understand why a positive yield spread need not pay for the exit.

Candidates for a later release are an explicit utilization-to-rate experiment and a separately validated protocol adapter. Aave e-mode and Morpho Blue require their own market identity, oracle behavior, limits and liquidation rules. A captured rate is a point-in-time observation, not a future borrowing cost. Do not treat wrapping, redemption and a liquid market sale as equivalent exits.

## Other decisions to revisit

- Shareable recorded-case cards, with the period, benchmark, exclusions and link to reproducible evidence. Extend the current hypothetical sharing and record exports rather than adding a monitoring dashboard.
- Broader position discovery, chain coverage and lifetime accounting. Treat these as separately scoped work; a snapshot cannot establish acquisition cost or complete position PnL.
- Historical fee estimates for editable ranges. Require swap/path and changing-liquidity evidence; a single snapshot or hourly price series is insufficient. Keep this separate from the fixed-price fee allocation experiment.

## Before expanding

Use the [current review](review.md) to distinguish scope boundaries from evidence still needed for a stronger claim. Choose relevant tasks from the [observation plan](learning.md#observation-plan) when feedback sessions are available. Keep the next feature decision tied to a question people want to explore.

[Product decisions](../DECISIONS.md) · [Models](models.md)
