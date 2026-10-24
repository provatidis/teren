# Using Teren

[Project overview](../README.md) · [Product decisions](../DECISIONS.md)

## Finding a tool and returning to your setup

Choose **Liquidity** or **Lending** in the topic switch. Experiment and Learn follow the chosen topic. Inspect currently contains liquidity snapshots and historical cases; lending has no live or recorded position imports yet.

| Topic | Experiment | Learn |
| --- | --- | --- |
| Liquidity | [Full-range and price-range labs](https://teren.sh/#experiment) | [Foundations, range choices and recorded cases](https://teren.sh/learn.html) |
| Lending | [Collateralized-loan lab](https://teren.sh/lending.html#experiment) | [Supply, borrow, change conditions and respond](https://teren.sh/lending.html#learn) |

The top navigation stays visible while scrolling. **Experiment** opens the chosen topic’s calculator workspace; **Learn** opens its lessons. **Inspect** opens liquidity’s pool/position workspace. Within Liquidity, the tool links follow the current workspace: calculator tools in Experiment, snapshot sources in Inspect, and a return to experiments from recorded history or Pool mechanics. Historical cases belong to Inspect and remain directly accessible from Experiment. Existing tool and shared-scenario links still open their targets directly.

Switching workspaces or calculator tabs preserves their current inputs. Clicking a same-tab Learn or Lending link temporarily retains valid liquidity calculator inputs, the selected lab and any matching source snapshot. Returning restores those working drafts; an explicit shared scenario takes precedence. This handoff uses per-tab session storage and is consumed after restoration. If storage is blocked, navigation still works but the handoff cannot be saved. Invalid/incomplete inputs are not captured. Use **Save experiment** and export the library for a durable, portable liquidity copy.

## Lending: supply, borrow, change conditions, respond

Open [the lending lab](https://teren.sh/lending.html#experiment) directly or start with [the first lesson](https://teren.sh/lending.html#lesson=supply). The four lessons add one idea at a time; every lesson can also be opened directly. Predictions are ungraded. The explanation and changed-situation checks require no arithmetic. Optional reading links to primary sources.

The first two lessons open with **Follow the money**. Move ETH from the wallet into a supplied balance, see a year of assumed interest with collateral off, then explore enabling it. The next lesson shows borrowed USDC arriving with matching debt. **Available to borrow** is remaining capacity, not cash already owned. Use the named action, Back, replay or **Choose any step**; no answer or watching is required. The prediction question stays visible with optional choices. **Explain this example** restores the fixed question frame, and its Experiment link keeps the original inputs. The prices/time and response lessons retain their predict-then-observe sequence.

**Your starting loan** sets supplied ETH (representing WETH), its starting price, whether it backs the loan and the amount of USDC borrowed. **Rates and collateral rules** contains editable teaching assumptions. Maximum starting LTV limits a new loan; the liquidation threshold governs an existing loan. The starting loan must be valid before later conditions can be explored. The setup collapses on phones and summarizes the starting balances.

**Change the conditions** adjusts the later valuation price and elapsed days. Both rates use fixed simple interest: supply interest adds ETH, and borrow interest adds USDC debt. Borrowed USDC stays in the wallet. **Assets minus debt** includes that cash and its matching liability, so borrowing does not create profit. A health factor below 1 means eligible for liquidation. **Balances before liquidation** labels the unchanged endpoint; **What would liquidation take?** opens a separate single-event illustration at that price.

Assumed APRs stay visible beside the conditions; **Edit rates** opens and focuses their controls. On mobile, a compact health factor and status follow you while editing, with **Full result** opening the detailed outcome. Invalid loan inputs offer a shortcut to the affected field, even when it is inside a closed disclosure. An incomplete response budget hides only the response comparison; the current loan remains visible.

**See health factor across prices** keeps the accrued token balances fixed while changing only ETH’s valuation price. It shows the health-factor-1 boundary and the currently selected price; it is a sensitivity chart, not recorded price history.

**What would liquidation take?** uses an editable requested repayment fraction and bonus. The liquidator repays debt and takes matching collateral plus the bonus. The bonus is a percentage of the debt repaid. It is taken from your collateral. The result shows debt repaid, ETH removed, extra value taken, remaining balances and the effect on net assets. Repayment is capped by available collateral; a crash can leave unpaid debt after all collateral is removed. The percentages are illustrative, not current Aave close-factor or bonus rules. The example excludes earlier events, gas and later protocol handling of shortfalls. Event assumptions have a separate tab draft and are retained in copied loan links.

**Compare interest assumptions** shows the main model’s simple-interest debt beside continuous compounding at the same constant borrow APR. At high rates or long durations, a visible prompt points to the difference. Neither calculation forecasts changing rates or reproduces Aave’s exact reserve-index accounting.

**Repay or add collateral?** compares two immediate responses before any liquidation with the same additional external budget at the chosen price. Repayment stops at the total debt and shows unused money. Added collateral increases the supplied ETH without reducing debt. Execution costs and delays are excluded, so the comparison does not promise that a response can happen before liquidation.

The lab keeps the last valid working loan in this tab's session storage, separately from lesson examples and liquidity drafts. **Copy experiment link** preserves all inputs in a validated `#loan=collateral-loan-v1` link; if clipboard access fails, a selectable link appears. Lending is not yet part of the saved liquidity experiment library. Lesson progress uses its own local-storage key. **Explore this setup in Experiment** opens the exact example in a separate tab without replacing the working loan.

**Learn** resumes the last opened lending lesson, including after a reload or a visit to Liquidity. Explicit `#lesson=...` links still select their named lesson, and **All lessons** keeps the whole sequence accessible. The current topic is labelled rather than linked, so selecting it cannot unexpectedly switch modes.

USDC = $1 is an assumption. Rates, LTV and threshold are illustrative, not current Aave market quotes; Aave's indexed interest accounting is not reproduced. Multiple collateral assets, live lending snapshots and independently checked lending history are later iterations. Borrowing loops use the separate lab below. See [the model](models.md#collateralized-loan-model).

## Borrowing loops: build, change conditions, unwind

Open **Borrowing loops** beside Single loan, or use [the direct lab link](https://teren.sh/lending.html#loops). Begin with zero or one round, then use the minus/plus controls or number field to change rounds up to five. Zero rounds is supply only, with no loan. Each round borrows a fraction of the ETH value just supplied: the original ETH for round one, then the preceding purchase for later rounds. The helper shows round one's borrowing amount.

**Follow each round** starts with compact summaries; open a round to separate borrowing, swapping and supplying, including wallet balances, debt, health factor and net assets. Open rounds stay open while editing. These balances use the starting price, before time passes. Borrowed USDC is spent when it buys ETH; it is never counted again beside that purchase.

Both sides of the holding comparison start with the original ETH. The loop adds no outside funds. **Original capital and assumptions** sets the ETH, starting price, borrowing limit, liquidation threshold and assumed loss on each swap. The swap loss represents a combined fee/price-impact haircut, applied when buying or selling; gas is excluded. **Where the difference comes from** separates construction costs, interest and a supply-only comparison at the same assumed supply rate.

**Test price and time** applies a later ETH valuation and interest period to the completed loop. The result leads with the difference from holding, labelled with that selected price and time. Continuous compounding is the default; fixed simple interest is available for comparison. Neither calculation reproduces changing protocol rates or Aave reserve indexes. The chart compares possible prices at the same accrued token balances, rather than reconstructing a price path. Its dot marks the selected price and net assets. Health factor and net assets are separate: an improved health factor does not undo extra ETH exposure.

**Withdraw, sell, repay** previews a sequential unwind at that one selected price. Each withdrawal uses up to 95% of the collateral value above health factor 1, capped by the sale needed to repay the remaining debt. Sale proceeds repay debt before the next withdrawal. The preview stops at or below the liquidation boundary, retains unpaid debt and uses no outside cash or flash loan. Its 95% convention and 64-step limit belong to this teaching model, not Aave. Gas, liquidity restrictions, market changes and execution ordering are excluded. Pre-liquidation headline balances do not establish that a real position survived earlier prices.

Unwind labels distinguish completed, partial, blocked and no-debt outcomes. A blocked preview shows swaps as **Not run**, with supplied ETH and debt unchanged. A partial preview keeps the debt still owed visible. Construction and unwind swap losses are reported separately when swaps occur.

**Compare round counts** adds a reference setup alongside your current one. Only the round count differs: original capital, prices, time, rates, borrowing fraction and costs follow the same controls for both. Change either count, then test a price fall or rise. The comparison shows assets minus debt, supplied ETH, debt and liquidation sensitivity before liquidation or unwinding. A supply-only reference includes assumed supply interest; it is different from holding ETH in a wallet. **Stop comparing** returns to the single setup.

**Copy loop link** includes every assumption in a strict `#loop=borrowing-loop-v1` fragment. When comparing, **Copy comparison link** includes the reference count too. A valid working loop and its comparison stay in their own tab draft, separate from the single loan; incomplete edits do not overwrite it. Reset clears the comparison. Older links still open their exact single setup.

The three [loop lessons](https://teren.sh/lending.html#loop-lesson=build) follow the four essentials and remain independently accessible. They use the actual loop model and conceptual explanation/application checks. The first and last open with **Follow the money** and an optional prediction before the action controls. The middle lesson retains its predict-then-observe sequence. The first lesson separates the starting supply, borrowing, buying ETH and supplying it. Wallet assets, collateral and debt remain visible; assets minus debt stay unchanged in this no-cost, fixed-price example.

In **Explore unwinding**, the money flow has eight stages: the starting balances, two passes through withdrawal → sale → repayment, and a final withdrawal of the remaining ETH. Selling ETH creates wallet USDC and incurs the assumed swap loss; the debt falls only when that USDC is spent on repayment. After the last repayment, ETH is still supplied until the final transfer moves it into the wallet. Wallet, collateral and debt stay visible. **Balance details and assumptions** expands the exact changes and cumulative unwind costs; health factor stays visible. These stages use the fixed-price teaching model, not recorded or executable transactions.

The build and unwind lessons open with **Follow the money**. See the starting balances, optionally predict, then use each named action to move wallet tokens, collateral and debt. **Replay action** repeats the short cue; **Back** revisits a frame. **Choose any step** gives direct access, grouping unwind actions by pass. There is no autoplay or required watching. The unwind keeps health factor and the collateral constraint visible; detailed deltas and costs are expandable. Explanations and changed-situation checks determine completion, without calculations. Saved answers and earlier completion remain intact, and each lesson opens its exact loop setup in a separate Experiment tab.

## Starting and comparing an experiment

**Start with a simple example** opens the unchanged-price, zero-fee baseline directly at its inputs. **Learn from the beginning** opens the first lesson; advanced users can use **Examples** to open any stage. The example and saved libraries sit after the working labs so they do not delay editing. **Try a quick change** is an optional, unnumbered set of shortcuts; the ordered library remains the progression.

On mobile, a compact comparison of **LP vs holding** stays visible above the fields while you edit. It includes the current assumed cash fees and uses the same result as the full analysis. **Full results** opens the detailed outcome without changing inputs. Incomplete or invalid fields show a nearby message and clear the compact outcome. Optional empty fee inputs mean zero. Save, share and export controls follow the result.

Price-comparison tables keep their columns on desktop. On mobile, each price becomes a labelled card showing all values, including the gap to holding, without horizontal scrolling. Selecting a price still updates the lab and retains keyboard focus.

## Example progression

Liquidity’s **Choose an example** library follows ten ordered cases. Each states what it adds. The four stages are **Foundations → Comparisons → Ranges → Applied cases**, shared with Learn's lesson groups.

| Example | Stage | Case | What it adds |
| --- | --- | --- | --- |
| 01 | Foundations | Price unchanged | A hypothetical baseline with no fees |
| 02 | Comparisons | ETH price doubles | A future-price change |
| 03 | Comparisons | Fees match holding | Assumed cash fees at the break-even target |
| 04 | Ranges | Inside a price range | Price bounds and the starting token mix |
| 05 | Ranges | At the upper price boundary | A position holding only USDC at that endpoint |
| 06 | Applied cases | A recorded in-range position | Exact NFT amounts and ticks at one block |
| 07 | Applied cases | A recorded out-of-range position | A single-token NFT snapshot |
| 08 | Applied cases | Principal, fees and tokens owed | Snapshot fee accounting and collectable balances |
| 09 | Applied cases | Fees through a recorded period | Period fees, cumulative time in range and a holding comparison |
| 10 | Applied cases | Leaving a range and returning | Outside intervals, fee pauses and activity between sampled prices |

Every stage and lesson is directly accessible; variations practice the same concept rather than representing difficulty levels. Advanced users can open [the recorded in-range snapshot](https://teren.sh/#example=in-range-position), [fee-accounting snapshot](https://teren.sh/#example=position-fees), [in-range replay](https://teren.sh/#historical-case) or [exit-and-return replay](https://teren.sh/#historical-case=range-return) without completing earlier lessons. The example definitions live in [public/learning/example-path.js](../public/learning/example-path.js).

Examples 01–05 carry hypothetical, versioned assumptions through scenario links. Examples 06–08 select Inspect's position source and save the chosen recorded snapshot; calculator inputs change only when the user applies it. Examples 09–10 open the recorded-period workspace. It does not replace the latest position snapshot or automatically change calculator inputs. Examples do not change virtual balances or lesson completion.

## Historical cases: fees through a recorded period

Open **Historical cases** from Experiment. The **Recorded cases** selector starts with **01 · Stays in range** (example 09), then **02 · Exit and return** (example 10). Each remains directly accessible. The baseline follows Ethereum Uniswap v3 WETH/USDC position #1382030 in the 0.3% pool from block 26168526 to 26168941 on 11 October 2026. Nine checkpoints cover **4,992 seconds** (83 minutes and 12 seconds), with unchanged position liquidity and bounds.

The longer case follows position #1375047 in the same 0.3% pool from block 26080000 to 26090000 on 29–30 September 2026. Its 17 checkpoints span **120,468 seconds** (33 hours, 27 minutes and 48 seconds): 50,256 seconds in range and 70,212 outside, with unchanged liquidity and bounds.

Move the checkpoint slider to compare **Principal + period fees** with **Hold starting principal tokens**. Both strategies begin with the first checkpoint's exact principal tokens; previously accrued fees and recorded owed balances are excluded. Period fees are calculated from recorded fee growth and kept in their earned tokens, rather than entered as assumed cash. Time in range comes from cumulative contract counters, not the sampled price line. Independent read-only collection simulations and complete position-update event queries check the recorded accounting and continuity.

Use **Start**, **Outside sample**, **Between samples**, **Return sample** and **End** to jump through the longer case. These identify recorded checkpoints, not exact crossing times. **Since the previous checkpoint** separates interval fees and active time from the cumulative totals. At the Between samples checkpoint, both endpoints are outside, yet counters show 45 minutes and 24 seconds of activity and new fee tokens between them. The chart focuses on recorded prices and identifies any fixed bound outside its view.

Expand **Tokens and verification** for the full UTC window, token balances, the selected block/hash and exact fee/time integers. **How to read this replay** explains sampling, fee tokens versus dollar valuation and the holding benchmark. **Export recorded case** downloads the checkpoint snapshots, counters and verification evidence as JSON. **Explore this checkpoint in Experiment** starts a new hypothetical range experiment from the selected checkpoint's principal, price and bounds, with zero assumed future fees. Already collectable tokens stay outside both strategies in that new comparison.

These are fixed-position records checked against chain reads and collect simulations at capture. The browser revalidates bundled arithmetic; it does not re-query Ethereum. Capture dates and providers are in **Tokens and verification**, alongside the reproduction procedure. They have no editable historical bounds or date window and do not provide arbitrary-range backtesting or lifetime PnL. Valuations use the selected pool ratio and USDC = $1; gas and incentives are excluded. See [the replay method and limitations](replay.md) for the fee checks, rounding tolerance and capture procedure.

## Saved experiments

Choose **Save experiment** in either liquidity lab to keep its current model, exact numeric assumptions, name and optional notes. The [Saved experiments library](https://teren.sh/#saved-experiments) can search names/notes, filter by model, edit names and notes, and reopen any setup. Reopening loads a working copy; input edits leave the original record intact, and saving again creates a variation. Removal has an Undo action until another record is removed or the tab reloads.

Select two or three records to compare. Outcomes are recalculated from the saved model inputs, rather than storing potentially stale derived results. The comparison shows each LP value, holding value and difference, with expandable assumptions and notes. Its context distinguishes identical starting baskets and future prices, different future-price scenarios, and different budgets/prices/token mixes. A concentrated range and a 50/50 position can have different starting tokens even with equal budgets; each uses its own holding benchmark. Fee inputs remain assumed USD cash, with USDC = $1 and the existing model exclusions.

When a setup still matches its imported pool price or NFT principal/range, saving retains the full validated source snapshot, including its block and exact integers. Changing a pool starting price, or an NFT's starting price, investment or bounds, clears that attribution. Future-price and fee-assumption changes preserve it. Reopening does not fetch the chain, contact imported provider URLs or replace the latest pool/position snapshot. Recorded collectable tokens remain outside both strategies' future principal comparison.

The library uses its own degenerator-experiments-v1 storage key and version-1 JSON schema, independent of lesson progress, snapshots and the virtual sandbox. Export includes names, notes, assumptions and retained source snapshots; ordinary scenario links still contain only model inputs. Imports merge atomically, skip identical records, and keep conflicting IDs as new copies rather than overwriting either version. Limits are 50 records, 80-character names, 1,000-character notes and a 512 KB file. Unsupported models/versions, invalid sources and malformed files are rejected without altering the current collection.

Storage failures keep changes for the current tab and explicitly request an export. Unreadable or newer saved copies are retained, downloadable and discarded only through their own recovery action. Each edit reads the latest stored collection to preserve another tab's additions; stale name/notes edits and removals are rejected. Data/schema/storage code lives in public/data/saved-experiments.js, calculation/presentation helpers in public/lib/saved-experiments.js, and the injected library controller in public/ui/saved-experiments.js.

## Learn: Liquidity essentials

Open [Learn](https://teren.sh/learn.html) for six independent foundation lessons, a final challenge, **Choosing and managing a range**, then **Fees, time and range exits**. The two later chapters each have three exercises. Every topic is available directly, including shareable lesson fragments such as learn.html#lesson=range-boundaries. Exercises follow **Predict → Observe → Explain → Apply**. Predictions are ungraded. After viewing the calculated outcome, explain the mechanism and apply it to a setup with one changed assumption. Both conceptual answers must be correct to mark the exercise checked; no calculation or rounding is required. Token explanations follow the selected price direction, including an unchanged price. Incorrect reasoning receives an explanation of the misconception; token reserves change through swaps, not newly created ETH or USDC. Each result starts with a short takeaway before the detailed explanation. A short sourced pitfall remains visible in the normal lesson flow: slippage, withdrawal expectations, recovery, inactive positions, fee assumptions or limits of a short record. Hints and three repeatable variations support practice; completion records understanding checks, not simulated profit.

**Swaps & price impact** shows ETH entering a pool and USDC leaving, with a comparison of the starting price and the average received on small and larger trades. **Providing liquidity** shows a matching deposit, then a separate trader’s swap: your percentage stays the same through that trade while your claim on ETH and USDC changes. Use the named action, Back, replay or direct step selection. The amount slider explores fresh examples from the same starting pool; **Question amount** returns to the assessed setup. **Change the question trade size/deposit** explicitly replaces that setup and clears its earlier answers. The existing sandbox link remains independent and preserves its virtual balances.

**Changing token balances** and **Narrow and wide ranges** begin with interactive diagrams. Move the price slider to compare both token amounts or both ranges; use **Question** to return to the price used in the understanding checks. Exploration does not change the assessed setup or Experiment link. In the token lesson, **Change the question price** explicitly updates that setup. Range boundary buttons show the difference between an exact edge and a price inside or outside. Earned fees are not inferred from these diagrams.

In these four liquidity lessons, the first two lending lessons and the build/unwind loop lessons, the prediction question stays visible above the controls. **Choose an answer · optional** opens its choices. You can explore or read the explanation without choosing a prediction; the explanation and application checks still determine completion.

The lessons cover swap impact, proportional pool ownership, changing token balances, impermanent loss versus dollar profit, fee break-even, and concentrated range boundaries. The final challenge compares the same starting tokens, checks why an all-ETH benchmark describes a different strategy, differentiates additional fees from the total break-even target in its optional worked example, and can export a PNG result card and a reproducible experiment link.

Every subject, including the final challenge, has optional Go deeper reading after its experiment explanation. Topic-specific mechanics, a worked example using the selected inputs, common misconceptions, a separately expandable math panel and two primary-source links provide a deeper path. Opening reading never affects completion; switching lessons closes both disclosures, and rerunning an edited setup refreshes its example. Editorial content lives in public/learning/deeper-reading.js and worked-example narration in public/lib/lesson-walkthrough.js.

Essentials lesson inputs and answers are stored under degenerator-learning-liquidity-v1, independently of sandbox balances, snapshot imports and liquidity controllers. Reopening restores the last lesson and validated exercise draft, including a stable order of answer choices. Existing checked lessons and optional numeric answers survive this change; old numeric answers are not converted into application answers. Damaged drafts are ignored; unavailable or full storage leaves learning usable in the current tab. Experiment links open a separate tab. Price/range lessons carry their exact model assumptions; swap/ownership lessons open the existing swap sandbox without replacing its saved pool or wallet.

Content lives in public/learning/, pure experiment/assessment logic in public/models/lesson-experiments.js, progress persistence in public/data/learning-progress.js, and the controller in public/ui/learning.js. The learning document has its own composition root, public/learn-main.js, and shares the existing calculator models and styles. No backend, account, live RPC request or new runtime dependency is required.

## Practical learning: choosing and managing a range

Open [range choices](https://teren.sh/learn.html#manage=range-width) after the essentials challenge, or open any exercise directly. The sequence adds range width, then fee tiers and APR, then exits, returns and management costs. Each exercise has three repeatable situations. Read the supplied setup, predict, reveal the outcome, explain it and answer a changed situation. No calculation field is present.

The width exercise calculates two continuous range positions with the same budget and starting price, each funded with its own required token mix. It compares active status, not earned fees or a shared holding basket. The fee-tier exercise uses unknown earnings or explicitly supplied fictional fee totals; the totals are teaching facts, not estimates, imports or verified history. The management exercise calculates principal at two outside prices with unchanged liquidity and shows why an inside return can reactivate it. USDC is assumed to stay at $1. It explains the actions and possible costs of changing a real v3 range; it does not simulate rebalancing or reimburse past losses.

Experiment links open these hypothetical range setups in separate tabs, preserving their original funding, displayed final price and zero assumed fees. Range choices use `passiko-range-learning-v1` independently of essentials, historical learning and saved experiments. Valid drafts, stable answer order and checked exercises survive reloads. The chapter has no live chain reads and does not change the two verified historical records. See [lesson goals and research](learning.md).

## Applied learning: fees, time and range exits

Open [the applied chapter](https://teren.sh/learn.html#applied=fees-over-time) after range choices or use any exercise directly. The sequence adds one idea at a time: new fee tokens in the in-range baseline; active time between two outside samples in the exit-and-return case; then that case’s final LP-versus-holding result. Each exercise asks for a prediction, reveals validated bundled records, then checks an explanation of the record and an application of the idea to a clearly labelled thought experiment.

The question, prediction feedback and final-period conclusion refer to a marked checkpoint or interval. The slider and milestone buttons explore the rest of the record without changing the assessment; **Return to the question checkpoint** restores its observation. Predictions do not need to be correct to learn from the result. Both conceptual answers must be correct to mark an exercise checked; optional numeric practice never affects completion. All three exercises remain directly accessible, and replaying a question retains previous completion.

**Explore this setup in Experiment** opens a separate tab with the selected checkpoint’s principal, price and range, and zero assumed future fees. This starts a new hypothetical principal-only experiment. It excludes earlier collectable tokens and the historical period’s earnings. **Inspect the full recorded case** opens the existing historical evidence. The applications consider collecting fee tokens without removing liquidity, the limits of two inside-range samples, and a hypothetical $1 LP-only cost. These do not change the verified record. Optional accounting details show exact token quantities, raw fees, block hashes, independent checks and primary sources. The essentials and historical chapters keep worked calculations and optional numeric practice in **Go deeper**; practice feedback never controls completion or the final result card.

Applied progress uses `passiko-applied-liquidity-v1`, independently of the unchanged essentials key and saved liquidity experiments. It restores each exercise’s prediction, answers and explored checkpoint. The records are bundled with the site and require no live RPC call. Blocked storage leaves the chapter usable in the current tab; failed record loads offer retry, and switching exercises cannot let a late response replace the new case.

## Guided experiments and result cards

**ETH price doubles** and **ETH price halves** keep the current investment/starting price, set ETH to 2× or 0.5×, and clear assumed fees. **Fees needed to match holding** sets assumed fee income to the break-even amount for the current future price; it does not estimate yield.

**Create result card** previews a downloadable 1200x720 PNG with the four assumptions, model version, holding/LP outcomes, before-fee IL, break-even fees, and model limitations. Input changes invalidate the preview so a card cannot silently describe an older scenario.

## Experiments

- Compare 1 ETH and 5 ETH swaps to see how trade size changes price impact.
- Change future prices and assumed fees in the liquidity scenario lab, then share a scenario link or export its comparison.
- Reverse the swap direction to trade USDC for ETH.
- Deposit matching ETH and USDC to receive LP tokens, then make a swap and withdraw your pool share.
- Move the impermanent-loss slider to compare liquidity provision with holding the initial assets.
- Reset to restore the initial pool and virtual wallet.

## Methods and feedback

The footer links to [Methods](https://teren.sh/methods.html), [About](https://teren.sh/about.html) and source in separate tabs, keeping the current experiment open. Methods explains hypothetical inputs, snapshot validation and historical accounting checked at capture. **Email feedback** opens a message to hello@teren.sh without a GitHub account. **Report an issue** opens a prefilled GitHub issue for visitors who prefer it.

On mobile, use **Explore experiment tools** or **Explore inspect tools** to reveal the secondary destinations. Primary Experiment, Learn and Inspect navigation stays visible. Practical lesson situations change the supplied facts and may change the correct follow-up; hints remain available and no calculation is required.

## Which Uniswap version am I exploring?

- **Full range · V2-style** and the virtual pool use Uniswap v2-style mechanics. The early lessons identify this scope beside the lesson heading.
- **Price range · V3-style** and practical range exercises use simplified Uniswap v3-style concentrated liquidity math. Price bounds are continuous inputs here; native v3 positions use tick boundaries.
- **Inspect** labels real v2 pool snapshots separately from v3 positions. Both historical cases use real v3 positions.

Uniswap v3 can also provide full-range liquidity. The lab labels identify the calculations Teren uses. The `v1` in `cp50-v1` or `cl-range-v1` identifies Teren’s model revision; it does not mean Uniswap v1.
