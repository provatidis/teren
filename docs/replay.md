# Historical cases: fixed positions

[In-range baseline](https://teren.sh/liquidity.html#historical-case) · [Exit and return](https://teren.sh/liquidity.html#historical-case=range-return) · [One week](https://teren.sh/liquidity.html#historical-case=one-week) · [Project overview](../README.md)

The recorded cases follow unchanged Ethereum Uniswap v3 WETH/USDC positions in the 0.3% pool. Each retains validated snapshots, cumulative range-time counters and independent read-only collection checks. They are fixed-position replays, not arbitrary-range backtests.

| Case | Position | Block window | Checkpoints | Elapsed time | Time in range |
| --- | --- | --- | --- | --- | --- |
| 01 · Stays in range | #1382030 | 26168526–26168941 | 9 | 4,992 seconds | 4,992 seconds · 100% |
| 02 · Exit and return | #1375047 | 26080000–26090000 | 17 | 120,468 seconds | 50,256 seconds · 41.7% |
| 03 · One week | #1375090 | 26172658–26222896 | 8 | 604,800 seconds | 0 seconds · 0% |

## In-range baseline

The first replay shipped in 1.8.0. Its 415-block period on 11 October 2026 lasts **4,992 seconds** (83 minutes and 12 seconds). The position stays active throughout. The final conservative period fees are **112674 USDC base units** and **896672855663157 WETH base units**. Subtracting the simulated collect balances gives one additional base unit of each token because accounting checkpoints floor separately.

The original [record](../public/examples/uniswap-v3-position-period.json) remains unchanged. Its historical state came from dRPC and its independent event queries from PublicNode.

## Exit and return

Release 1.9.0 adds [position #1375047](../public/examples/uniswap-v3-position-range-return.json) from **29 September 2026, 02:01:23 UTC** to **30 September 2026, 11:29:11 UTC**. Its 10,000-block period lasts **120,468 seconds** (33 hours, 27 minutes and 48 seconds), with **50,256 seconds in range** and **70,212 outside**. Liquidity remains 350853357174328, with raw tick bounds 197400–203880, throughout the verified period.

The starting principal is **4982691068 USDC base units** and **14920139441099507 WETH base units**. The final conservative period fees are **274940 USDC base units** and **65624095827826 WETH base units**. Independent collect differences are 274941 and 65624095827826 respectively: a one-base-unit USDC difference and an exact WETH match. Historical state came from dRPC; MEV Blocker supplied complete event queries and independent endpoint block-identity checks.

The first outside sample is block 26081250. Several following intervals add no active seconds and no fee tokens. Between blocks **26084375 and 26085000**, both sampled endpoints are outside, but cumulative counters record **2,724 active seconds** and new fee tokens. The first subsequent in-range sample is block **26086875**. The final checkpoint is outside again.

These facts explain why an endpoint status or sampled price line cannot establish the whole path. **Outside sample** and **Return sample** identify recorded checkpoints, not exact crossing times. **Between samples** opens the interval with activity omitted by the price line. The position's lower USD price bound is far below these prices, so the chart focuses on the observed movement and explicitly identifies that bound as outside the plotted window.

## One week without new fees

Release 1.34.0 adds [position #1375090](../public/examples/uniswap-v3-position-week.json), from **12 October 2026, 00:00:11 UTC** to **19 October 2026, 00:00:11 UTC**. The eight daily checkpoints cover **604,800 seconds**. All seven intervals record **zero newly earned USDC, zero newly earned WETH and zero active seconds**. Independent collection differences also equal zero throughout.

The starting and final principal are **0 USDC** and **55672026415822610 WETH base units** (about 0.055672 ETH). The fixed range is about **$2,643.90–$2,724.41 per ETH**, above every sampled price. Principal value falls from about **$140.75 to $133.80**, a **$6.96 loss**, while **LP minus holding is $0.00**. This separates matching holding from making a dollar profit. Values use the recorded pool ratio and USDC = $1.

The record joins seven independently checked daily segments, retaining 105 complete event-query chunks. State reads came from dRPC and event queries from MEV Blocker. Each segment retains its capture date and evidence. The UI begins with starting capital → seven days → no new fees, then offers daily checkpoint shortcuts, interval fee tokens and active time. Dollar change is shown separately from the holding comparison in every case.

This is one inactive week, not a typical yield or an estimate of how quickly another range might earn its fee target. The dates stayed fixed, and the first eligible position was retained regardless of its size or earnings. The selection procedure and exclusions are documented below.

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

# Exit and return: the optional final argument chooses 17 checkpoints.
node scripts/check-replay.js 1375047 26080000 26090000 public/examples/uniswap-v3-position-range-return.json 17

# Reproduce the week using the committed selection audit; output stays separate.
# Re-running resumes fully validated cached segments after checking block identities.
npm run check:week
# Optional explicit selection, output and cache paths:
node scripts/check-replay-week.js docs/evidence/week-selection.json week-replay.json .replay-week-cache

# Independently repeat candidate qualification in the predeclared order.
# This reads up to 500 candidates and stops on provider failure, never skips it.
npm run qualify:week
```

The development script makes read-only calls, paces provider requests and retries temporary limits. It supports 2–32 checkpoints over at most 10,000 blocks. It rejects changed positions, incomplete event queries, invalid counters, non-finalized endpoints and fee discrepancies, then validates the complete record before writing it. `REPLAY_RPC` and `REPLAY_LOG_RPC` select public HTTPS providers; current defaults are dRPC for state and MEV Blocker for events. Public archive availability and request limits vary. No wallet, transaction or scheduled collector is involved.

The browser opens the bundled cases without RPC calls. Export includes all checkpoint snapshots, block hashes, raw counters, simulation results and event query coverage. The week export retains its versioned manifest and every complete segment, including both copies of shared boundaries; only the display deduplicates those points. File validation checks arithmetic and evidence consistency; it cannot independently authenticate a provider's chain history. Applying a checkpoint starts a new hypothetical principal-only range experiment with zero assumed future fees, rather than continuing the recorded history.

Source references: [Uniswap range counters](https://github.com/Uniswap/v3-core/blob/main/contracts/interfaces/pool/IUniswapV3PoolDerivedState.sol), [fee-growth rules](https://github.com/Uniswap/v3-core/blob/main/contracts/libraries/Tick.sol), [NFT accounting events](https://github.com/Uniswap/v3-periphery/blob/main/contracts/interfaces/INonfungiblePositionManager.sol).

## Recheck the bundled evidence in CI

The manually triggered **Recheck recorded chain evidence** workflow runs `npm run check:records`. It recaptures all three windows (using a fresh cache for the week), checks fresh contract/collection/event evidence, and compares every canonical checkpoint with the bundled record, excluding provider labels and capture timestamps. It uploads `record-verification.json` with the run time, providers and per-case matches or errors. The original files are not overwritten. Public archive availability can fail the run; it is separate from ordinary release CI. No new run is implied by a “checked at capture” label.

## Week selection and composition

The question declared before capture was: **Does giving a position more time make its fee target easier to earn?** The record distinguishes dividing a hypothetical target by more days from observing additional fee tokens. This selected week contains no earning interval, so it cannot show variable daily income. That limitation is retained rather than changing the dates or choosing a more dramatic outcome.

### Selection before looking at the returns

- Use Ethereum WETH/USDC in the existing Uniswap v3 0.3% pool. Target 12–19 October 2026, 00:00 UTC, choosing the first finalized block at or after each daily boundary. The audit retains each boundary's previous block to establish this choice. All eight chosen timestamps are 11 seconds after midnight; actual elapsed time is exactly 604,800 seconds.
- First inspect the two existing NFT IDs in ascending order for positive liquidity and unchanged position accounting across the whole window. Neither qualified. Record exclusions before declaring broader discovery.
- The bounded fallback order below chooses the first eligible position. Low fees, losses, size and inactivity are not exclusion criteria. Do not move dates to improve results. Provider failure means incomplete evidence, never zero earnings or permission to skip a candidate.
- Retain daily samples as declared. Cumulative counters and complete continuity evidence establish accounting between them; sampled prices do not locate every range crossing.

### Initial exclusions and bounded fallback

The [initial read](evidence/week-initial-selection.json) on 24 October 2026 found unchanged positive liquidity but different endpoint fee accounting for **#1375047**, and zero liquidity at both endpoints for **#1382030**. Neither could represent an unchanged, positive-liquidity position over this week. The initial stage stopped without moving the dates.

Before further discovery, [the machine-readable selection plan](../scripts/replay-week-plan.json) declared NFT IDs **1375000–1375499 in ascending order**, skipping the already excluded original candidate. [Commit 2e293cc](https://github.com/provatidis/teren/commit/2e293cc51a1de520bb81a20d4230980eed8ebc1e) records that plan before the fallback reads. This 500-ID interval begins at the smaller original candidate rounded down to the nearest 1,000. Positive liquidity, the configured pair/fee, unchanged accounting and complete empty position-event coverage determine eligibility. A provider failure stops discovery as incomplete.

The [completed qualification audit](evidence/week-selection.json) records the plan hash, daily boundary headers, exclusions and event coverage. The fallback inspected 90 IDs: 81 used another pair or fee tier, eight were missing at the start, and **#1375090 was the first eligible candidate**. It was retained before daily fee accounting was captured. The week has no minimum-balance, active-time or fee-income filter.

### Bounded composition and rounding

The original version-1 period format still permits at most 10,000 blocks, 32 checkpoints and 20 event-query chunks, each covering at most 500 blocks. A separate version-1 **fixed-position-history** manifest joins **2–8 segments with at most 64 unique checkpoints**. The week uses seven two-point segments. Every segment independently passes the original validation.

Adjacent segments share exactly the same canonical checkpoint: block number/hash/time, snapshot accounting, range-time counters and collection amounts. Only provider labels and capture timestamps may differ. The combined view omits duplicate boundary points. Gaps, overlap beyond that boundary, changed accounting, missing event coverage, conflicting evidence and partial captures are rejected.

Week-to-date fees use the **first** checkpoint's inside fee growth. Summing separately floored segment credits would lose rounding carries. Interval credits are differences of those cumulative totals. Every cumulative result is checked against a simulated-collect difference from the same first checkpoint, within one base unit per token. Range-time increments and unchanged accounting are checked both locally and over the full sequence.

The week capture command validates the committed selection audit and confirms daily headers against both providers. Cached segments are accepted only when their canonical endpoint headers and position ID match that audit and their complete evidence validates. Temporary event-query failures have bounded retries of the identical query; invalid evidence stops capture. The final output is written atomically only after every segment and the combined record validate and block identities are rechecked. Reusing a cache is a resume operation, not a fresh re-query of its contract state. The separate `check:records` workflow always uses an empty temporary cache.

Tests cover boundary conflicts, gaps, reversed segments, changed accounting, missing chunks, rounding carries, global-versus-local collection discrepancies, cache identity and bounded retries. Browser checks cover daily access, export, selection changes, failed loads and principal-only Experiment handoffs. These checks establish implementation consistency; browser file validation cannot authenticate chain history independently.

### Presentation and interpretation

- Keep the original holding basket. Compare principal alone and principal plus new fee tokens against it, while showing dollar change from starting capital separately.
- Keep earned USDC and WETH visible. Value cumulative fees at the selected checkpoint price with USDC = $1; do not sum daily dollar values priced at different times into a final fee total.
- Show recorded active seconds beside fees without converting active time into a fee rate. Do not annualize, project future income or scale the record to an arbitrary deposit.
- Exclude gas and incentives, and do not claim lifetime PnL. Applying a checkpoint starts a new hypothetical principal-only range experiment with zero assumed future fees.

## Next validation cases

A future comparison can follow two existing ranges over the same period, retaining each starting basket and verification evidence. It needs a new selection declaration before returns are inspected. The inactive week does not close the gap between a hypothetical fee target and a useful matched earning reference. Arbitrary hypothetical bounds need historical tick/swap reconstruction and an explicit assumption about the effect of adding liquidity. Hourly pool price and global fee growth alone do not establish fee allocation.

## Observation before further expansion

Give a learner a fixed target and let them change the hypothetical window from 7 to 30 days. Ask, without calculations: “What changed? What would you need to know before expecting those fees?” Then open the week record and ask what its seven daily intervals establish about income, and whether matching holding establishes a dollar profit. Record their explanation and navigation difficulties without coaching first. This observation has not yet happened; tests are not evidence of teaching effectiveness.
