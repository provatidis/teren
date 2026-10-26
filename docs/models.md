# Calculation models

[Project overview](../README.md) · [User guide](guide.md) · [Current review](review.md) · [Product decisions](../DECISIONS.md)

Teren has two topics: liquidity and lending. Both provide hypothetical experiments and lessons. On-chain snapshots and historical records currently cover liquidity only.

## Protocol names and calculation versions

The full-range lab and virtual pool use Uniswap v2-style mechanics. The price-range lab uses simplified Uniswap v3-style concentrated liquidity math, without native tick constraints or on-chain rounding. V3 also allows full-range positions; these names identify Teren’s models rather than an exclusive division between protocols. Inspect reads real Uniswap v2 pools or v3 positions, and the recorded historical cases are v3.

The single-loan and ETH/USDC loop labs use Aave v3-style collateral concepts with editable teaching assumptions. The separate wstETH/WETH lab explores correlated assets with its own rate and oracle assumptions. None reproduces a live protocol account or current market rules.

`cp50-v2`, `cl-range-v2` and `collateral-loan-v2` are current Teren model-revision identifiers. The version suffix does not identify a Uniswap or Aave protocol version. Earlier revisions remain supported. They remain in links, exports and technical details so calculations remain reproducible; prominent labels name the protocol style instead.

## Three kinds of results

- **Hypothetical models:** the endpoint liquidity labs use assumed USD cash fees or average position fee APR, plus optional costs; Follow the fees calculates token allocation from chosen trading batches. Single loans and ETH/USDC loops offer fixed simple interest or continuous compounding, and wstETH/WETH loops separate staking APY from continuously compounded borrow APR with one optional rate change. All use editable assumptions rather than forecasts.
- **Recorded snapshots:** Inspect shows v2 reserves/quotes or v3 principal from exact contract integers at one block. Version-2 v3 snapshots also include fee accounting; older files without fee-growth data show it as unavailable. A snapshot alone does not establish fees earned over a chosen period or lifetime PnL.
- **Verified historical accounting:** the shipped fixed-position cases compare multiple recorded checkpoints, with unchanged-position evidence and independent fee checks. It calculates earned fee tokens and cumulative time in range for that recorded period.

Applying a snapshot or replay checkpoint to a lab starts a new hypothetical comparison. The source data remains recorded evidence; subsequent prices and cash fees are model assumptions. [Snapshot validation](data.md) and [historical verification](replay.md) describe the separate checks.

## Concentrated-liquidity range lab

Switch between **Full range · V2-style** and **Price range · V3-style** without resetting either setup. The lab switch stays available while exploring a calculator. On mobile, budget/range inputs collapse into an editable summary; results and the price explorer remain visible, with sharing controls alongside the results. The range lab chooses lower/upper ETH prices, computes the required starting token mix for a fixed investment, and compares:

- Holding those exact starting range tokens.
- A separate full-range 50/50 LP position funded with the same budget.
- The concentrated range position.

An asymmetric range, or an out-of-range starting price, can require a mix other than 50/50. Range IL and break-even fees therefore use the range's own initial tokens as the holding benchmark. The full-range comparison displays its separate 50/50 holding benchmark. These are equal-budget strategy comparisons, with each starting composition visible.

Tight (±5%), Moderate (±10%) and Wide (±50%) presets center a range on the starting price. The future price input, keyboard-accessible slider, chart selection, exact boundary checkpoints and comparison rows all update the same scenario. The slider's domain stays stable while dragging. Allocation bars show how the position moves between ETH and USDC; below the range it is all ETH, and above it all USDC. Exact edges receive distinct labels.

The range accepts cash fees or an assumed average position fee APR and duration. Its optional 50/50 reference retains its own cash fee amount and subtracts the same opening, collection and closing cost budget. Fees and costs remain fixed across displayed prices and never compound or alter token quantities. Being out of range at the final price does not imply the position earned no fees earlier; this endpoint model does not reconstruct a trading path or estimate fee income.

### Principal model and retained cl-range-v1

Price p is USD per ETH, assuming USDC = $1. For bounds a < b, let c = clamp(p, a, b). For liquidity L:

~~~text
ETH(c)  = L × (1 / sqrt(c) − 1 / sqrt(b))
USDC(c) = L × (sqrt(c) − sqrt(a))
L       = investment / (ETH_per_unit_L(start) × start + USDC_per_unit_L(start))
~~~

The implementation rationalizes square-root differences to retain precision for narrow ranges. Starting prices outside the range are supported and fund the position with a single token. This is a continuous human-unit model: it does not apply tick spacing, Q96 arithmetic, token-unit rounding, gas, incentives or automatic rebalancing. It must not be presented as an exact quote for a deployed Uniswap position.

The model follows the holdings relationships in [Uniswap's math primer](https://blog.uniswap.org/uniswap-v3-math-primer-2) and [v3 whitepaper](https://app.uniswap.org/whitepaper-v3.pdf). A hand-solvable reference uses investment $5,000, starting price $4, and range $1–$9: initial assets are 500 ETH and 3,000 USDC. At $9 the range holds 6,000 USDC, versus $7,500 from holding its initial tokens. Before-fee range IL is −20% and $1,500 of assumed fees closes that gap. The separate full-range LP is worth $7,500; its own 50/50 holding benchmark is $8,125.

New shared links use `cl-range-v2` with the original seven inputs plus fee mode, APR, days and three cost inputs. Original `cl-range-v1` links keep their cash fee amounts and open with zero costs and no duration. They select the correct lab while leaving saved swap balances and the other lab's setup alone. CSV includes both distinct holding benchmarks and exact numeric inputs. A 1200×1000 PNG result card includes the range, starting mix, fee basis, cost budget and three outcomes; legacy lesson cards keep their original dimensions. Editing inputs invalidates a previous card.

**Use in range lab** seeds the theoretical setup with the existing v2 snapshot's reserve ratio, a fresh range and zero fee assumptions. The v3 snapshot source separately reads an actual position and its tick-derived range; **Explore this position's range** applies its recorded principal to a new theoretical setup. Already collectable tokens are excluded from both strategies in that projection. Historical period accounting is available in the separate fixed-position case described below.

## Controlled range widths

`cl-width-v1` reuses `cl-range-v1` with zero fees. Both positions have the same capital C, starting price P and endpoint price. Their initial basket is exactly C/(2P) ETH and C/2 USDC, and both use that common holding benchmark. The only position-specific input is width.

Width w is the total price span divided by the starting price, expressed as a percentage. Set s = w/100 and f = (√(s² + 4) + s)/2. The bounds are P/f and P×f. Their product is P² and their distance is P×s. This geometric centering makes both initial token values equal for any supported width; ±w% arithmetic bounds would change the initial mix. Bounds are continuous and do not apply protocol tick spacing or integer rounding.

The selected price determines principal token amounts through the existing range model. Fee target = max(0, shared holding value − LP principal). Dollar change compares principal with starting capital. Equal widths give identical outcomes, including at either boundary; exchanging the A/B widths exchanges their results. The chart compares separate hypothetical endpoints before fees. It does not reconstruct a trading path, time active or earned fees. Gas, incentives and rebalancing remain outside this experiment.

The allowed total widths are 1–400%, starting ETH prices $1–$1,000,000, capital $1–$1 billion and comparison prices $0.01–$10 million. These bounds keep the generated ranges within the existing model limits. Native slider steps are a UI convenience; exact-price entry, boundary shortcuts and shared links retain numeric precision.

## Liquidity scenario lab

Enter starting capital and ETH prices, choose cash fees or an assumed average fee APR and duration, and optionally add LP costs. Results include:

- Final dollar values and returns for holding versus providing liquidity.
- The ETH and USDC owned by each strategy at the future price.
- Impermanent loss before fees, the net difference after assumed fees and costs, and fees needed to match holding.
- A price-range chart and comparison rows with the same investment, duration, assumed fees and costs.

The default example invests $5,000 at $2,000/ETH, then values the position at $4,000/ETH with $100 in assumed fees. Holding ends at $7,500; liquidity holds 0.883883 ETH and 3,535.53 USDC, worth $7,071.07 before fees or $7,171.07 including the assumed cash income. $428.93 in total fees would match holding.

**Copy scenario link** creates a URL fragment containing the price, investment, fee and cost assumptions and model version (`cp50-v2`). Original `cp50-v1` links remain supported. Opening it restores the same scenario without changing the visitor's saved swap balances or activity. Clipboard failures show a selectable link for manual copying. Invalid or unsupported links show a message and use the default scenario. Editing a shared scenario does not change the original URL; copy a new link to share the edited assumptions. Ordinary visits use the default scenario; a same-tab return from Learn restores valid working drafts captured on departure. Explicit shared scenarios take precedence over that temporary handoff. [The guide](guide.md#finding-a-tool-and-returning-to-your-setup) distinguishes working drafts from named saved experiments.

**Export CSV** downloads the comparison rows with the inputs, model version, token balances, dollar outcomes, before-fee impermanent loss, and break-even fee income. **Reset scenario** restores the calculator's defaults; **Reset sandbox** separately clears the virtual swap session.

### Principal model and retained cp50-v1

The calculator models a full-range constant-product position with equal initial dollar allocations and USDC fixed at $1. Ideal, frictionless arbitrage rebalances the pool to the supplied future ETH market price, preserving the position's token product before fees. It describes endpoint balances, not a transaction path or a specific deployed protocol.

For investment V, starting ETH price P0, and ratio r = P1/P0:

```text
initial ETH     = V / (2 × P0)
initial USDC    = V / 2
final LP ETH    = initial ETH / sqrt(r)
final LP USDC   = initial USDC × sqrt(r)
holding value   = V × (1 + r) / 2
LP before fees  = V × sqrt(r)
LP with fees    = LP before fees + assumed fee income
IL before fees  = (LP before fees / holding value − 1) × 100%
break-even fees = holding value − LP before fees
```

Fee income is an explicit assumption added as separate USD cash at the end; it does not compound or change the token amounts. It is held fixed across comparison rows and chart prices. The retained v1 calculation does not estimate fees from volume, volatility, pool share, or a time horizon. V1 excludes gas costs, incentives, depegging and concentrated liquidity. V2 adds the explicit fee and cost assumptions below without changing principal accounting. These are hypothetical outcomes, not forecasts. Reference tests cover unchanged, falling, doubled, and quadrupled prices, asset-product preservation, fee break-even, input bounds, versioned links, and CSV output. The separate pool adapter validates recorded swap arithmetic against its supported protocol; this theoretical endpoint LP model is not a protocol-specific return forecast.

## Fee and cost assumptions · cp50-v2 / cl-range-v2

Both endpoint labs reuse the v1 principal formulas. Fee mode is either a total cash amount or an **assumed average position fee APR**. With starting deployed capital V, APR a as a fraction and duration d in days:

```text
assumed fee income = V × a × d / 365          (APR mode)
LP costs           = opening + collection + closing
LP before costs    = principal at final price + assumed fee income
LP after costs     = LP before costs − LP costs
net gap to holding = LP after costs − value of the exact starting tokens
break-even fees    = max(0, holding value − LP principal + LP costs)
required fee APR   = break-even fees / V × 365 / d
```

The annualized target is available only with a positive duration. Cash mode can leave duration blank (`feeDays: 0`); APR mode requires it. Days use a 365-day year. Entered APR is an average for the whole period, including any time out of range, after protocol fee share and before the separate cost budget. It is neither the pool fee tier nor a pool-wide APR multiplied by concentration. No yield or active-time forecast is inferred. The fee-context panel uses this same saved duration; lesson-only contexts keep their independent hypothetical windows.

Costs are extra USD cash expenses of providing liquidity relative to holding. They are paid separately from the starting investment, so they change neither the initial token basket nor before-fee IL. Returns use starting deployed capital as the denominator. Do not add acquisition costs shared by both strategies to only the LP side. Negative net outcomes remain negative. The optional 50/50 reference uses the same LP costs and its own cash fees; its holding basket is still separate. Fees are not reinvested, including in the simplified V2-style model; real V2 reserve fee growth is not reproduced.

Hand-worked example: $10,000 starting at $2,000/ETH and ending at $8,000/ETH gives $25,000 holding versus $20,000 LP principal. An assumed 36.5% APR for 100 days adds $1,000. Opening/collection/closing costs of $40/$10/$50 leave $20,900, trailing holding by $4,100. Required fees are $5,100, equivalent to a 186.15% average APR for that period. This target says nothing about whether it could be earned.

Shares, drafts, named saves and exports retain both inactive and active fee inputs, mode, duration and costs. CSV distinguishes gross value from value after costs and includes the required APR when defined. Legacy records remain v1; opening them supplies cash mode, zero costs and no duration, and saving creates a v2 variation. Historical records, controlled widths and lesson assessment models retain their existing assumptions.

## Collateralized loan model

`collateral-loan-v2` is a hypothetical single-collateral, single-debt teaching model with an explicit interest convention. The retained `collateral-loan-v1` model always uses simple interest. ETH represents supplied WETH, and USDC is fixed at $1. Aave v3 concepts inform the separation of maximum LTV, collateral eligibility and liquidation threshold; all entered rules and rates are illustrative assumptions. This model does not claim exact Aave interest accounting or current market parameters.

For original supplied ETH `C`, initial borrowed USDC `B`, future ETH price `P`, elapsed days `d`, annual supply/borrow rates `s` and `b`, and liquidation threshold `t` (rates and threshold as fractions):

```text
growth(r)         = 1 + r × d / 365  [simple]
                  = exp(r × d / 365) [continuous compounding]
later supplied ETH = C × growth(s)
later USDC debt    = B × growth(b)
collateral value  = later supplied ETH × P
health factor     = collateral value × t / later debt
boundary price    = later debt / (later supplied ETH × t)
assets minus debt = collateral value + B − later debt
```

Both balances use the selected convention at constant APRs over a 365-day year. Added compound interest uses `original × expm1(rate × days / 365)` to retain small positive increments. One-year compound growth is `exp(APR / 100) − 1`; this equivalent APY is not another rate input. New and reset experiments default to compounding. Legacy links, drafts, named records and existing lesson handoffs retain their simple-interest results; reopening them in the v2 editor selects simple interest. Saving creates a new variation without changing the original record. Borrowed USDC remains in the wallet, earning nothing. The holding comparison retains the original ETH at `P`, so the difference is the value of supply interest minus borrow interest. Borrowing itself creates a matching asset and liability. It does not increase net assets at inception.

When supply is not enabled as collateral, new borrowing is zero, but the supplied balance can still earn assumed interest. A new loan must fit original collateral value × maximum LTV; later prices or accrued interest may move it above that starting limit. Health factor below 1 means eligible for liquidation. Exactly 1 is the boundary. No debt has no loan liquidation boundary; this does not eliminate asset or protocol risks. The display preserves the side of 1 even when ordinary two-decimal rounding would hide it.

Responses use the same external USD budget at the endpoint. Repayment is capped at debt, with unused money shown separately. Adding collateral buys ETH at `P`, adds it to the supplied balance and leaves debt unchanged. Neither response receives retroactive supply interest. At 5 ETH, $1,500/ETH, $5,000 debt and an 80% threshold, the unchanged health factor is 1.20. An additional $1,000 raises it to 1.50 by repayment or 1.36 by adding collateral.

Results are endpoints before any liquidation, not a reconstruction of what would have survived the intervening path. The model excludes variable rates, reserve indexes, contract rounding, oracle delays, caps, E-mode, additional assets, liquidation execution, gas and swap costs. Borrowed cash is neither spent nor reinvested in this single-loan model. The separate borrowing-loop model below spends it explicitly. Independently verified lending history is not included. Primary references: [Aave collateral rules](https://aave.com/help/supplying/toggle-collateral-status), [supply mechanics](https://aave.com/help/supplying/supply-tokens) and [borrowing/liquidation overview](https://aave.com/faq).

### Single liquidation event and interest reference

`single-liquidation-v1` is a separate hypothetical event applied to an eligible single-loan endpoint under its selected interest convention. At selected price `P`, let supplied collateral value be `V`, debt `D`, requested repayment fraction `q`, and bonus fraction `b`:

```text
repaid = min(D × q, V / (1 + b))
removed collateral value = repaid × (1 + b)
remaining debt = D − repaid
remaining ETH = supplied ETH − removed collateral value / P
net assets after = remaining ETH × P + unchanged borrowed cash − remaining debt
net assets before − net assets after = repaid × b
```

No event is calculated at health factor exactly 1 or above, or with no debt. Repayment is limited by available collateral; explicit exhaustion sets remaining ETH to zero and leaves unpaid debt visible. This is not a complete Aave liquidation engine: requested fractions and bonuses are teaching assumptions, with no close-factor/dust-policy enforcement, oracle path, transaction ordering, gas or subsequent deficit handling. A single event may leave a position eligible.

The price chart fixes accrued balances and varies only ETH price. Its straight line expresses health factor’s proportionality to collateral price with fixed debt; it is not a price path or evidence that earlier liquidation was avoided.

The optional debt reference compares `B × (1 + b × d / 365)` with `B × exp(b × d / 365)` independently of the selected rule. The selected rule also drives the health curve, responses and liquidation event. Continuous compounding is a mathematical assumption; it does not reproduce Aave’s interest approximation, reserve-index updates or changing rates.

The time visual separates original amounts from added interest. Both bars use one USD scale at the chosen endpoint price; borrowed wallet cash is excluded from the bars and remains unchanged in the balance sheet. They show supplied collateral value, not threshold-weighted backing, so equal bar lengths do not identify the liquidation boundary.

## Fixed-position historical replay

The three original cases below require completely unchanged NFT accounting. Release 1.35.0 also supports a separate **fixed-liquidity history with fee collections**. Its principal liquidity and bounds stay unchanged, while collection debits and actual pool payments are tracked. New net fee tokens equal actual payments during the period plus the ending simulated collect amount, minus the starting simulated collect amount. Starting claims can include old fees or previously removed principal; all are excluded. Manager debits can exceed actual pool payments by rounding dust, which remains visible. The claim ledger is checked independently against inside fee growth, allowing only the floor differences implied by the number of real collection updates. See [the matched comparison method](replay.md#matched-week-comparison).

Release 1.8.0 shipped a verified case for Ethereum Uniswap v3 WETH/USDC position #1382030 in the 0.3% pool. Its nine checkpoints span blocks 26168526–26168941 and **4,992 seconds**, with unchanged liquidity, bounds and position accounting. The holding basket is the exact principal at the first checkpoint; previously accrued fees and recorded owed balances are excluded from both starting strategies.

The period model recomputes principal with integer Q96 arithmetic and calculates earned fee tokens from the difference in inside-range fee growth. Fees remain separate USDC/WETH amounts, valued at each checkpoint's pool price; they are not assumed cash or compounded. Time in range uses the cumulative `secondsInside` counter, including activity between sampled prices. Complete position-update event queries establish continuity under the providers' history, and read-only collection simulations independently check period fees within one base unit per token. The baseline stayed in range for all 4,992 seconds. Release 1.9.0 adds position #1375047 over blocks 26080000–26090000: 17 checkpoints and 120,468 seconds, including 50,256 active seconds and 70,212 outside. Release 1.34.0 adds position #1375090 over blocks 26172658–26222896: eight daily checkpoints and 604,800 seconds, with zero newly earned fee tokens and zero recorded active seconds. Its principal remains 0 USDC and 55672026415822610 WETH base units. It matches holding, while both fall from about $140.75 to $133.80. All three records use the same fixed-position accounting method.

Interval fee tokens are differences of cumulative credits measured from the period start. Summing separately floored interval calculations would lose integer rounding carries. Adjacent range-time increments must fit their elapsed intervals, and cumulative fee credits must not decrease. A zero active-second increment does not alone prove zero fees: swaps can enter and leave the range within one block. The exit-and-return record also shows active time and new fees between two outside samples. The week joins seven individually validated segments at identical canonical checkpoints. Cumulative fees and collection checks always use the first checkpoint of the whole week, preserving integer rounding carries; they are not sums of separately floored segment credits. Composition is bounded to eight segments and 64 unique checkpoints, with the original per-segment limits unchanged.

These cases verify bounded recorded fixed-position periods. Editable historical ranges/windows, mint-to-present PnL, rebalancing and arbitrary-range backtesting have not shipped. The chart does not reconstruct intra-sample prices. Valuation assumes USDC = $1 and excludes gas and incentives; the holding comparison does not separately deduct LVR. See [replay.md](replay.md) for the formulas, exact results, evidence and requirements for further validation cases.

## Virtual pool mechanics and limitations

The starting pool holds 100 ETH and 200,000 USDC. Your virtual wallet starts with 10 ETH and 20,000 USDC. Exact-input swaps use `output = reserveOut × (input × 0.997) / (reserveIn + input × 0.997)`. The 0.3% input fee stays in the pool, so the reserve product grows with trades. Price impact excludes this fee and compares execution against the fee-adjusted pre-trade spot quote.

Liquidity deposits match the pool ratio; LP tokens represent proportional ownership. Portfolio and pool values use a fixed $2,000 ETH reference price. The pool exchange rate changes with trades. The curve axes rescale with reserves.

The impermanent-loss calculator is a separate hypothetical 50/50 pool, assumes arbitrage after a market-price change, and excludes trading fees. It does not change the active simulation. Slippage tolerance protects the displayed quote, though this single-user simulator has no external trades or transaction delays.

Pool reserves, virtual wallet balances, and the latest 50 activity entries are saved in this browser's `localStorage` after successful transactions. The total action count is retained. Refreshing or reopening the site restores the saved sandbox; Reset sandbox removes it and restores the starting balances. Form inputs and the independent impermanent-loss slider start at their defaults on reload.

Saved data is versioned and validated before use. Invalid or incompatible sessions fall back to the starting sandbox. If browser storage is unavailable or full, the app remains usable and displays a notice that changes may not survive refresh. Storage is specific to this browser and site; it does not sync across devices. Open tabs keep their own in-memory state, and the last successful save wins. Clearing browser data removes the saved session. No credentials or real assets are stored.

The virtual sandbox and hypothetical labs use JavaScript floating-point numbers for learning. Recorded v3 principal, fee credits and historical period accounting use exact integers; their human-readable dollar valuations use floating-point numbers and the recorded pool ratio. Live snapshots read existing contracts through public providers. There are no real-fund transactions, user accounts, or investment recommendations.

## Borrowing-loop model

`borrowing-loop-v1` is a separate hypothetical ETH-collateral/USDC-debt model. It does not alter `collateral-loan-v1`. All rounds occur at the starting price before interest accrues. USDC is fixed at $1, and no outside funds are added after the original ETH supply.

Let initial ETH be `C`, starting price `P`, the per-round borrowing fraction `r`, swap-loss fraction `f` and number of rounds `n` (0–5). Define `a = r × (1 − f)`:

```text
ETH bought in round i = C × a^i
USDC borrowed in round i = C × P × r × a^(i−1)
total supplied ETH = C × sum(a^i, i=0..n)
total debt = C × P × r × sum(a^i, i=0..n−1)
construction swap loss = sum(round borrowing × f)
net assets at construction = C × P − construction swap loss
```

Before each purchase, borrowing increases both cash and debt. The purchase spends that cash and creates wallet ETH less swap loss. Supplying then moves wallet ETH into collateral. At each borrow step, total debt is `r` times the then-supplied collateral value, so limiting `r` to maximum LTV respects the illustrative new-borrowing rule. All wallet proceeds are spent and supplied before the later-price result.

For elapsed years `t = days / 365`, the selected growth factor is `1 + APR × t` for simple interest or `exp(APR × t)` for continuous compounding, with APR expressed as a fraction. Apply the supply factor to all built ETH and the borrow factor to all built debt. The default is continuous compounding; both rates remain constant. This is not Aave’s indexed interest approximation or a forecast of changing rates.

At later price `Q`, net assets are `accrued ETH × Q − accrued USDC debt`; holding retains the exact original `C` ETH without supply interest. A separate supply-only reference accrues interest on `C` without borrowing. Health factor and the price boundary use the same collateral-threshold/debt definitions as the single-loan model. Values remain pre-liquidation endpoints, with negative net assets and unpaid obligations retained. The sensitivity chart varies price at fixed accrued balances; it does not show a trading path.

### One liquidation event

The separate **What would liquidation take?** view applies `single-liquidation-v1` to the loop's already accrued collateral and debt. At a price strictly below the boundary, requested repayment is `debt × repayment fraction`, capped by `collateral value / (1 + bonus fraction)`. The liquidator receives ETH worth repayment plus bonus. Remaining net assets are `remaining ETH × selected price − remaining debt`: the loop has spent its borrowed cash, so none is added back. Net assets fall by the bonus, not by the full collateral seizure. An exact boundary or zero debt does not execute this illustration. Exhausted collateral leaves any unpaid debt visible.

This event is an alternative endpoint illustration, not a step applied to the headline balances, reference comparison or withdrawal-first unwind below. It neither reconstructs earlier liquidations nor implements protocol-specific close-factor, dust or shortfall rules. Optional versioned event fields preserve the assumptions in shares and saved records without changing the loop's construction or interest calculation.

### Withdrawal-first unwind preview

At an endpoint strictly above the liquidation boundary, for collateral dollar value `V`, debt `D` and threshold fraction `h`:

```text
headroom value = max(0, V − D / h)
gross ETH sale value = min(D / (1 − f), 0.95 × headroom value)
ETH withdrawn = gross sale value / Q
USDC repaid = gross sale value × (1 − f)
```

The 95% factor leaves intermediate health factor above 1 during withdrawal, before the sale repays debt. It is a teaching convention, not an Aave parameter or recommended margin. Repeat at fixed `Q`, without elapsed time, outside funds or flash loans. A final sale sufficient to repay all debt explicitly closes it. Stop at 64 steps or when floating-point progress becomes too small, leaving remaining debt visible. At/below the boundary the preview is blocked, with unchanged pre-liquidation balances. Net value after a completed or partial preview equals pre-unwind net value minus unwind swap losses.

The action ledger separates each withdrawal, sale and repayment. Withdrawn ETH is in the wallet and no longer backs debt; sale proceeds stay in the wallet until repayment. Only a sale reduces net assets, by its assumed swap loss. A completed ledger then transfers the remaining supplied ETH to the wallet in a separate final action. The aggregate `unwind.remaining` retains its original meaning: the supplied balance after the last repayment, before that final transfer. Incomplete previews never add a final release or erase debt.

This preview excludes gas, dynamic fees/price impact, liquidity availability, caps, reserve-index updates, collateral-specific withdrawal rules, oracle changes, transaction ordering and liquidation execution. It is accounting under stated rules, not evidence that these transactions can execute on Aave. Primary references: [Aave borrowing](https://aave.com/help/borrowing/borrow-tokens), [health factor/liquidations](https://aave.com/help/borrowing/liquidations), [repayment](https://aave.com/help/borrowing/repay-tokens), [withdrawal](https://aave.com/help/supplying/withdraw-tokens).


## Hypothetical fee flow · cl-width-fees-v2

[Follow the fees](https://teren.sh/liquidity.html#follow-fees) extends the controlled width comparison with a bounded allocation experiment. It is not a historical fee estimate or a swap engine. The original principal calculation stays `cl-width-v1`; all prior width-only links retain their meaning.

Each of up to eight batches records a price P, gross input volume V in USD, other LPs’ starting capital C and range width (or full range), trader fee f (millionths) and protocol divisor d. Half of the input value is ETH and half USDC. The same protocol fraction applies to both in this example. Other LPs use a chosen reciprocal range around the same starting price, or continuous full-range liquidity. For a chosen range, calculate the per-unit starting token amounts with `concentratedAmounts(1, P_start, lower, upper)` and divide C by their dollar value to obtain L_other. Outside that range, their active liquidity is zero. Full range retains `L_other = C / (2 × √P_start)`. They do not reinvest fees. These are supplied assumptions, not fetched pool settings.

Trader fees are `V × f / 1,000,000`. Deduct `trader fees / d` for the protocol, or zero when disabled. Each alternative receives `LP fees × L_range / (L_range + L_other)` strictly inside its own bounds; otherwise it receives zero. A and B do not compete with each other. Each range receives half of its fee value in USDC and the other half divided by P in ETH. Fees stay separate from principal. At the selected endpoint, value retained ETH at that price and USDC at $1, then compare principal plus fees with the exact common starting basket and with starting dollars separately.

A preview never changes cumulative tokens. Adding a batch captures its own volume, competition, tier and protocol choice. Changing those controls or the competitor width affects the next batch; changing A/B widths, position capital or starting price recalculates all existing batches under the revised common setup. Moving only the endpoint reprices fees without changing earlier token quantities. Undo and clear alter only this experiment. The range-lab handoff freezes fee-token value into that lab’s USD fee input at the selected price.

The price and liquidity are held fixed within a batch, including a large batch. Real swaps change prices and liquidity can change between ticks. The approximation omits price impact, routing, fees from travel between batch prices, exact ticks, rounding, gas and incentives. Exact edges need directional crossing accounting: previews identify them, additions are disabled, and a width edit that puts a recorded hypothetical batch on an edge blocks saving until corrected. A sequence of batches does not establish a continuous price path, elapsed time, APR or real earnings.

References: [Uniswap fee concepts](https://developers.uniswap.org/docs/get-started/concepts/fees), [liquidity math](https://blog.uniswap.org/uniswap-v3-math-primer-2), and [the pool’s fee/protocol accounting](https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol). Tests use an independently calculated 1000–4000 range, per-token conservation, unchanged fee tokens through exits, same-range equivalence, dilution and scaled alternatives.


Competitor width is an independent per-batch assumption. A new experiment uses a 100% total width, with the same geometric center and 50/50 starting mix as A and B. This is not a calibrated or typical market distribution. Moving the comparison price does not recenter competitors. All ranges’ bounds are recalculated if the shared starting price changes. Legacy `cl-width-fees-v1` links and version-2 drafts have no competitor width and retain full-range competition exactly; new links use v2 and drafts use version 3 under the unchanged storage key.

At $2,000 ETH, a $5,000 20%-wide position facing $1 million in full-range competitors receives about 9.31% of LP fees. If the same competing capital uses the same 20% range, its share is $5,000 / $1,005,000, about 0.50%. Both are hypothetical allocations. A range can receive all LP fees if it is active and the modeled competitors are outside. If an alternative has no active liquidity at all, its trading batch is unavailable, rather than assigned imagined fees. Exact competitor edges also require directional swap reconstruction and cannot be added.

### Separate mechanism illustrations

The arbitrage scene uses the existing zero-fee, full-range model: 10 ETH + 20,000 USDC at $2,000 ETH, followed by an external price of $2,200. Before a pool trade the reserves stay unchanged. After ideal frictionless arbitrage, reserves are `10 / sqrt(1.1)` ETH and `20,000 × sqrt(1.1)` USDC. Real costs can leave a gap. This isolated scene never changes the user's ledger and does not compute LVR.

Loss versus holding uses the unchanged starting basket. Loss versus rebalancing uses a strategy that changes its balances at external market prices under a defined model. They are distinct benchmarks, not additive deductions. The JIT diagram supplies fictional liquidity amounts: 100 units stay, 300 enter for a trade, then leave. It illustrates dilution at a fixed fee amount, not total profit, prevalence or reconstructed activity. Primary references: [LVR research](https://arxiv.org/html/2208.06046v6), [Uniswap JIT research](https://blog.uniswap.org/jit-liquidity).

## Correlated-asset loops

The current `lst-loop-v2` model supports exact wstETH targets and sequential borrowing rounds. Target construction finances the purchase and build flash fee, with an explicit LTV limit. Exposure means staked-token quantity relative to the original holding; collateral-to-net-equity leverage is separate. Original `lst-loop-v1` records retain their round-based meaning.

Staking growth changes the conversion rate; optional collateral lending yield changes token quantity; WETH debt uses a two-phase continuous-APR calculation. Market and oracle prices remain separate. The benchmark holds the original wstETH, and the model flags an earlier rate-only liquidation boundary even if the endpoint later recovers. Exit previews either sell everything into WETH or sell enough to repay and retain unsold wstETH, with distinct holding comparisons. See [the complete formulas, comparison basis and execution assumptions](lst-loops.md). Existing ETH/USDC models and recorded liquidity accounting are unchanged.
