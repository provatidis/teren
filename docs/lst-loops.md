# Correlated-asset loops

[Models overview](models.md#correlated-asset-loops) · [Using this lab](guide.md#correlated-asset-loops) · [Current review](review.md)

`lst-loop-v1` is a hypothetical wstETH-collateral/WETH-debt model. It has no chain reads, current rates or protocol presets. Its purpose is to test exposure, carry, relative prices and exit assumptions. The ETH/USDC loop remains a separate model.

## Construction and units

Let `q` be the original wstETH, `R` the assumed starting stETH per wstETH, `r` the per-round borrowing fraction, `f` the build swap-loss fraction and `n` the number of rounds (0–8). During construction, one stETH is valued at one WETH. The original wstETH is already supplied. All rounds occur before time passes.

For each round, borrow `latest supplied wstETH × R × r` WETH, spend it to buy `(borrowed WETH × (1 − f)) / R` wstETH, then supply those tokens. The purchase loss combines an assumed fee and price impact; it is not inferred from liquidity. Build gas is excluded.

With `a = r(1 − f)`:

```
completed collateral Q = q × sum(a^i, i = 0..n)
original debt D       = q × R × r × sum(a^i, i = 0..n−1)
build swap losses     = D × f
initial net value     = Q × R − D = q × R − D × f
```

Zero rounds has zero debt. At a borrow step, total debt equals `r` times the collateral's current construction value, before the next purchase. Validation requires `r ≤ maximum LTV < liquidation threshold`. A wallet holds either the borrowed WETH or the purchased wstETH, never both after the purchase. Supplying moves the purchased asset from the wallet into collateral.

## Accrual and comparison

Staking yield `s` and additional collateral lending yield `l` are APYs, expressed here as fractions. Time is `t = days / 365`:

```
later conversion rate Rt = R × (1 + s)^t
later collateral Qt      = Q × (1 + l)^t
```

Staking growth changes the conversion rate rather than rebasing the wstETH balance. The default additional lending yield is zero. If a collateral product earns a separate yield, it must not include the staking return already counted in `Rt`. This model attributes their cross term to lending growth:

```
staking growth in WETH = Q × (Rt − R)
lending growth in WETH = (Qt − Q) × Rt
```

Borrow APR is a fraction `b1` before the optional change day and `b2` after it. Let `d1` and `d2` be the actual days spent in each segment, with `d1 + d2 = days`:

```
later WETH debt Dt = D × exp((b1 × d1 + b2 × d2) / 365)
```

No rate change means all days use `b1`. A change at day zero uses `b2` throughout; a change after the selected endpoint has no effect yet. Continuous compounding is a mathematical assumption, not an exact reproduction of reserve indexes or utilization-driven rates. A constant APR `b` has equivalent APY `exp(b) − 1` under this convention.

The market discount `d` is applied at the selected endpoint, relative to `Rt` valued in WETH. The model does not reconstruct a discount path:

```
market sale price M = Rt × (1 − d)
net WETH value     = Qt × M − Dt
unlooped holding   = q × M
```

Holding keeps the exact original wstETH in a wallet. It receives the same staking growth but no collateral lending yield. It is not an unstaked-ETH benchmark. Dollar display multiplies WETH values by a common ETH/USD price; this does not change ETH-denominated health or relative results.

The value bridge reconciles exactly:

```
net = qR − build swap losses + staking growth + lending growth
      − (Dt − D) − Qt × Rt × d
```

When `D > 0`, `days > 0` and `Qt × M − holding > 0`, the constant-equivalent borrow APR that matches holding is `ln((Qt × M − holding) / D) / t`. It is compared with the time-weighted borrow APR. A negative result requires a borrowing subsidy under these assumptions. This value comparison excludes exit costs and does not establish liquidation safety.

## Oracle, boundary and liquidation

The oracle price is either `M` (follows the endpoint market discount) or `Rt` (tracks conversion value). These are deliberately simplified alternatives, not descriptions of specific live feeds. Actual market feeds, exchange-rate oracles, caps and update delays require their own adapters. A conversion-rate oracle can leave health unchanged while the market exit loses value.

From 1.42.0, new setups and resets select conversion-rate valuation. Existing drafts, named experiments and complete shared links preserve their explicit oracle choice. The selection is visible beside the market-discount control. [BGD's explanation of Aave's wstETH oracle](https://governance.aave.com/t/exchange-rate-for-steth-eth-hardcoded/22693) supports this illustrative starting point; the model does not implement CAPO or establish current market parameters. A falling conversion rate can reduce health even when a market discount alone does not.

Health factor is `Qt × oracle price × threshold / Dt`. Zero debt has no loan boundary. Exactly 1 is labelled the boundary; below it is eligible. A numerical tolerance of `1e−12` recognizes floating-point boundary cases.

Before applying the endpoint discount, the rate-only path has at most two exponential segments. Each segment's log-health slope is `(ln(1+s) + ln(1+l) − borrow APR) / 365`. An analytic crossing check preserves the first boundary even when a subsequent rate reduction restores endpoint health. If it crossed, later balances are explicitly a thought experiment without liquidation. This is not a claim that the actual position survived.

The optional endpoint liquidation event repays the requested fraction of debt, capped by collateral value at the oracle divided by `(1 + bonus)`. Seized wstETH is repayment times `(1 + bonus)` divided by oracle price, capped by available collateral. Remaining debt is retained, including when collateral is exhausted. Oracle-valued bonus and market value removed are labelled separately; they need not be equal. It does not model a complete liquidation sequence, incentives, close-factor rules or an actual earlier event.

## Exit accounting

The preview sells all wstETH to WETH. It assumes an atomic transaction, a usable withdrawal, enough flash-loan and swap liquidity, and the selected sale price. It stops at a present or earlier rate-only boundary, when availability is unchecked, or when the sale cannot meet all obligations. A stopped preview moves no assets and retains the debt; it does not conclude that all real rescue routes are impossible.

With exit swap loss `x`, flash fee `h` and flat exit cost `g` in WETH:

```
sale proceeds = Qt × M × (1 − x)
flash fee     = Dt × h
remaining WETH = sale proceeds − Dt − flash fee − g
```

The ledger shows: flash borrowing adds wallet WETH and equal temporary debt; repayment clears the original loan; withdrawal releases wstETH; sale exchanges it for WETH; final settlement clears temporary principal, fee and flat cost. Gas must be funded up front, while the model deducts its assumed cost from proceeds. A failed transaction's gas expenditure is not simulated. When no debt exists, flash borrowing and repayment are skipped.

For an after-exit comparison, the original unlooped wstETH is sold with the same swap haircut and flat cost but no flash loan. If its costs exceed proceeds, the comparison is unavailable. The equality of cost assumptions is visible; it is not a claim that an atomic loop exit and a wallet sale use the same gas or market depth in practice.

## Evidence and next validation

Independent tests cover geometric construction, value conservation, APY/APR accrual, benchmark equivalence with zero rounds, dollar-price cancellation, market/oracle separation, earlier-boundary recovery, collateral-capped liquidation, all exit obligations, links and storage. Browser checks cover view navigation, saved variations, malformed links, validation and mobile touch. These establish model consistency, not teaching effectiveness or executable protocol transactions.

Current protocol rates, lending caps, oracle bounds/delays, slashing events, withdrawal queues, changing liquidity and actual transaction ordering remain outside this release. Negative assumed staking APY is a smooth growth scenario, not a slashing-event simulation. Staking rewards already reflected in an observed conversion rate must not be counted a second time as future income.

Primary references: [Lido's wstETH contract](https://docs.lido.fi/contracts/wsteth/), [Aave e-mode categories](https://aave.com/help/borrowing/e-mode), [Aave rate strategy](https://aave.com/docs/aave-v3/smart-contracts/interest-rate-strategy), [Morpho Blue market parameters](https://docs.morpho.org/learn/concepts/blue/), and [Morpho collateral yield](https://morpho.org/faq/). These explain mechanisms; none supplies this experiment's default values.
