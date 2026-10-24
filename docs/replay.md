# Historical cases: fixed positions

[In-range baseline](https://teren.sh/#historical-case) · [Exit and return](https://teren.sh/#historical-case=range-return) · [Project overview](../README.md)

The recorded cases follow unchanged Ethereum Uniswap v3 WETH/USDC positions in the 0.3% pool. Each retains validated snapshots, cumulative range-time counters and independent read-only collection checks. They are fixed-position replays, not arbitrary-range backtests.

| Case | Position | Block window | Checkpoints | Elapsed time | Time in range |
| --- | --- | --- | --- | --- | --- |
| 01 · Stays in range | #1382030 | 26168526–26168941 | 9 | 4,992 seconds | 4,992 seconds · 100% |
| 02 · Exit and return | #1375047 | 26080000–26090000 | 17 | 120,468 seconds | 50,256 seconds · 41.7% |

## In-range baseline

The first replay shipped in 1.8.0. Its 415-block period on 11 October 2026 lasts **4,992 seconds** (83 minutes and 12 seconds). The position stays active throughout. The final conservative period fees are **112674 USDC base units** and **896672855663157 WETH base units**. Subtracting the simulated collect balances gives one additional base unit of each token because accounting checkpoints floor separately.

The original [record](../public/examples/uniswap-v3-position-period.json) remains unchanged. Its historical state came from dRPC and its independent event queries from PublicNode.

## Exit and return

Release 1.9.0 adds [position #1375047](../public/examples/uniswap-v3-position-range-return.json) from **29 September 2026, 02:01:23 UTC** to **30 September 2026, 11:29:11 UTC**. Its 10,000-block period lasts **120,468 seconds** (33 hours, 27 minutes and 48 seconds), with **50,256 seconds in range** and **70,212 outside**. Liquidity remains 350853357174328, with raw tick bounds 197400–203880, throughout the verified period.

The starting principal is **4982691068 USDC base units** and **14920139441099507 WETH base units**. The final conservative period fees are **274940 USDC base units** and **65624095827826 WETH base units**. Independent collect differences are 274941 and 65624095827826 respectively: a one-base-unit USDC difference and an exact WETH match. Historical state came from dRPC; MEV Blocker supplied complete event queries and independent endpoint block-identity checks.

The first outside sample is block 26081250. Several following intervals add no active seconds and no fee tokens. Between blocks **26084375 and 26085000**, both sampled endpoints are outside, but cumulative counters record **2,724 active seconds** and new fee tokens. The first subsequent in-range sample is block **26086875**. The final checkpoint is outside again.

These facts explain why an endpoint status or sampled price line cannot establish the whole path. **Outside sample** and **Return sample** identify recorded checkpoints, not exact crossing times. **Between samples** opens the interval with activity omitted by the price line. The position's lower USD price bound is far below these prices, so the chart focuses on the observed movement and explicitly identifies that bound as outside the plotted window.

## Learn from these records

The [Fees, time and range exits chapter](https://teren.sh/learn.html#applied=fees-over-time) uses these unchanged records for three guided prediction-and-explanation exercises. Assessment targets come from the existing period accounting: final baseline fee value, the exit-and-return case’s 2,724 active seconds between blocks 26084375–26085000, and its final LP-minus-holding result before costs. Checkpoint exploration stays independent of the fixed question. Experiment handoffs start a separate principal-only hypothetical experiment with zero assumed future fees.

## Calculations and checks

- Principal is recomputed from unchanged NFT liquidity and tick bounds at each recorded Q96 price.
- Holding preserves the first checkpoint's exact principal token amounts. Previously accrued fees and recorded owed balances are excluded from both starting strategies.
- Period fees are `floor(L × (insideGrowthNow − insideGrowthStart) / 2^128)`, with uint256 growth wrapping. Each earned token remains separate and is valued at the selected pool ratio; fees are not assumed USD cash or compounded.
- Interval fee tokens are differences of cumulative period credits. Summing separately floored intervals would lose rounding carries. Their sum exactly preserves the final period credits. Interval dollar values use the selected checkpoint price, not the unknown prices of individual fee-earning swaps.
- Time in range is the uint32 difference of `snapshotCumulativesInside().secondsInside`. Time outside is elapsed time minus that difference. Adjacent increments must fit their elapsed intervals; a plausible total cannot hide an impossible interval. Cumulative fee credits must not decrease.
- Active seconds and fee tokens measure different things. A zero active-second increment alone does not prove zero fees: swaps can enter and leave a range within one block. The observed zero-fee intervals above are established by both counters and fee growth.
- Every checkpoint retains the same position accounting with positive liquidity. Complete, contiguous manager event queries from start + 1 through end return no events indexing this NFT ID. IncreaseLiquidity, DecreaseLiquidity and Collect all index the ID first. This establishes position continuity under the event provider's history.
- Independent read-only `collect` simulations at every checkpoint agree with cumulative period fees within one base unit per token. The state and event providers' endpoint block numbers, hashes and timestamps agree before and after event queries. Every checkpoint's state-provider block is rechecked.

The price line connects recorded samples; it does not recover every intra-block or intra-sample price. Fee and range-time correctness comes from cumulative accounting and verified position continuity, not chart resolution.

The result describes this period's principal and earned fee tokens relative to holding. It excludes gas and incentives, assumes USDC = $1, uses the pool price for valuation and does not reconstruct mint deposits or lifetime PnL. Dollar values are rounded separately; differences use unrounded values. LVR would require its own external-price rebalancing benchmark and is not added as a second deduction from the holding comparison.

## Reproduce the capture

```sh
# Baseline: nine checkpoints by default.
npm run check:replay
node scripts/check-replay.js 1382030 26168526 26168941 public/examples/uniswap-v3-position-period.json

# Longer case: the optional final argument chooses 17 checkpoints.
node scripts/check-replay.js 1375047 26080000 26090000 public/examples/uniswap-v3-position-range-return.json 17
```

The development script makes read-only calls, paces provider requests and retries temporary limits. It supports 2–32 checkpoints over at most 10,000 blocks. It rejects changed positions, incomplete event queries, invalid counters, non-finalized endpoints and fee discrepancies, then validates the complete record before writing it. `REPLAY_RPC` and `REPLAY_LOG_RPC` select public HTTPS providers; current defaults are dRPC for state and MEV Blocker for events. Public archive availability and request limits vary. No wallet, transaction or scheduled collector is involved.

The browser opens the bundled cases without RPC calls. Export includes all checkpoint snapshots, block hashes, raw counters, simulation results and event query coverage. File validation checks arithmetic and evidence consistency; it cannot independently authenticate a provider's chain history. Applying a checkpoint starts a new hypothetical principal-only range experiment with zero assumed future fees, rather than continuing the recorded history.

Source references: [Uniswap range counters](https://github.com/Uniswap/v3-core/blob/main/contracts/interfaces/pool/IUniswapV3PoolDerivedState.sol), [fee-growth rules](https://github.com/Uniswap/v3-core/blob/main/contracts/libraries/Tick.sol), [NFT accounting events](https://github.com/Uniswap/v3-periphery/blob/main/contracts/interfaces/INonfungiblePositionManager.sol).

## Recheck the bundled evidence in CI

The manually triggered **Recheck recorded chain evidence** workflow runs `npm run check:records`. It recaptures both windows, checks fresh contract/collection/event evidence, and compares every canonical checkpoint with the bundled record, excluding provider labels and capture timestamps. It uploads `record-verification.json` with the run time, providers and per-case matches or errors. The original files are not overwritten. Public archive availability can fail the run; it is separate from ordinary release CI. No new run is implied by a “checked at capture” label.

## Next validation cases

First extend one unchanged position to a week in the existing 0.3% pool, as specified below. A later comparison can follow two existing ranges over the same period in the ETH/USDC 0.05% pool, retaining each position's starting basket and verification evidence. Arbitrary hypothetical bounds need historical tick/swap reconstruction and an explicit assumption about the effect of adding liquidity. Hourly pool price and global fee growth alone do not establish their fee allocation.

## Proposed next case: one position over one week

**Status: specification only. No position, block window or new earnings have been captured or verified for this proposal.** This takes priority over the two-range 0.05% comparison above. Extend a familiar mechanism before adding a pool and a second strategy.

### Learning question

**Does giving a position more time make its fee target easier to earn?** Show the difference between dividing a fixed target by more days and observing additional fee tokens. Follow one unchanged position through daily checkpoints; show both cumulative fees and the newly earned tokens in each interval. A quiet or inactive interval should remain visible. If the selected week contains no such contrast, report that limitation rather than silently choosing a more dramatic week.

### Selection before looking at the returns

- Start with Ethereum WETH/USDC in the existing Uniswap v3 0.3% pool. Target 12–19 October 2026, 00:00 UTC, using the first finalized block at or after each requested boundary. Record actual timestamps and elapsed seconds; do not assume exactly seven days from block counts.
- First check the two existing NFT IDs, in ascending numeric order, for positive liquidity and unchanged position accounting across the entire window. If neither qualifies, stop and document why. Broader candidate discovery needs a declared, reproducible candidate list and ordering before fee outcomes are examined.
- Record exclusions for position changes, missing history or inconsistent evidence. Low fees, losses against holding, inactivity and disappointing returns are not exclusion criteria. Do not move the dates to improve the result. Technical unavailability is an incomplete capture, not evidence of zero earnings.
- Select daily checkpoints in advance. Additional samples may explain a counter change, but never claim that sampled prices locate every range crossing. A later multi-case library should include contrasting conditions under the same selection rules; one week is still not a representative yield.

### Evidence and engineering gate

The current format supports at most 10,000 blocks, 32 checkpoints and 20 event-query chunks. A week will require a new bounded composition layer; merely raising those limits would change an existing validation contract.

Proposed approach: a versioned manifest joining existing validated segments of at most 10,000 blocks. Adjacent segments must share exactly the same boundary block hash and canonical snapshot/counter/collect evidence, with one NFT, pool, liquidity and position accounting throughout. Omit only duplicate boundary points in the combined view. Fail on gaps, overlap beyond the shared boundary, changed accounting, missing event coverage, conflicting evidence or partial captures. Keep the original two records and routes unchanged.

Calculate week-to-date fees against the **first** checkpoint's inside fee growth. Do not sum separately floored segment credits: that loses rounding carries. Interval credits are differences of those cumulative totals. Compare each cumulative result with an independent simulated-collect difference from the same first checkpoint, preserving the existing one-base-unit tolerance. Range-time deltas must be valid both within each segment and across the joined period. Complete event queries and provider block-identity checks remain mandatory over the full window.

Bound the new manifest to eight segments and 64 unique checkpoints initially, validate all segments before enabling results, and record capture/check dates and providers. The capture tool should resume verified immutable segments after temporary RPC failures and invalidate conflicting boundaries. Add adversarial fixtures for gaps, boundary conflicts, changed positions, rounding carry, missing chunks and failed independent checks before publishing a record. Reproduction must succeed from the documented read-only commands and raw files; arithmetic-only browser validation must keep its existing label.

### Presentation and accounting

- Begin with starting principal → recorded time → newly earned fees. Daily exploration uses actual timestamps, with no smooth animation implying unseen prices.
- Keep the original holding basket; compare principal alone and principal plus new fee tokens against it. Show dollar change from starting capital separately from the holding difference.
- Keep earned USDC and WETH visible. Value cumulative fees at the selected checkpoint price with USDC = $1. Do not sum daily dollar values priced at different times to construct the final fee total.
- Show exact range-active seconds alongside fees, without treating active time as a fee rate. No annualized yield, future earnings projection or scaling the position to an arbitrary deposit.
- Results remain before gas and incentives. Do not invent execution costs for an unchanged position or claim lifetime PnL. A hypothetical fee target may be shown alongside the record only with its benchmark and endpoint assumptions explicitly identified.

### Observation before further expansion

Give a learner a fixed target and let them change the hypothetical window from 7 to 30 days. Ask, without calculations: “What changed? What would you need to know before expecting those fees?” Then open the week record and ask whether another equal-length interval must earn the same amount. Finally, ask whether matching holding establishes a dollar profit. Record their explanation and navigation difficulties without coaching first; this is a small usability/understanding observation, not a graded exam or proof of general learning effectiveness.
