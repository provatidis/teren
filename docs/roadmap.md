# Next discussion

Updated for 1.38.0. These are discussion priorities, not commitments to build every item.

## Correlated-asset looping and LSTs

Bring this back first when discussing the next release. There is a direct user interest in testing liquid staking token (LST) loops, including wstETH/WETH. The product should remain useful for experienced DeFi users testing assumptions as well as people learning a mechanism for the first time.

Start with a visual experiment that separates:

- Staking income, lending income and the cost of borrowing. Avoid counting the underlying staking yield twice.
- A change in borrowing rates, including the role of utilization, from a change in collateral value.
- The collateral’s value relative to the debt asset from both assets’ prices in dollars. Distinguish a market discount, the redemption/exchange rate and the protocol oracle used for liquidation.
- Building exposure, maintaining it and unwinding it, including assumed costs and unavailable exits.

Keep the existing ETH/USDC loop: it teaches a different exposure. Step-by-step balances remain useful even when a flash loan packages a real strategy into one transaction. Aave e-mode and Morpho market parameters need separate treatment before either is presented as a supported deployment. A captured current rate must not be presented as a fixed future borrowing cost.

## Other decisions to revisit

- Shareable recorded-case cards, with the period, benchmark, exclusions and link to reproducible evidence. Extend the current hypothetical sharing and record exports rather than adding a monitoring dashboard.
- Broader position discovery, chain coverage and lifetime accounting. Treat these as separately scoped work; a snapshot cannot establish acquisition cost or complete position PnL.
- Historical fee estimates for editable ranges. Require swap/path and changing-liquidity evidence; a single snapshot or hourly price series is insufficient. Keep this separate from the fixed-price fee allocation experiment.

## Before expanding

Review the [open blind spots](review.md). Ask users to explain what changes when competitors tighten their ranges, and why a fee total alone cannot establish LP performance. Arithmetic and browser tests establish consistency, not learning outcomes.

[Product decisions](../DECISIONS.md) · [Models](models.md)
