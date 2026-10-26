# Using Teren

[Project overview](../README.md) · [Model assumptions](models.md) · [Current review](review.md)

Jump to [single loans](#lending-supply-borrow-change-conditions-respond), [ETH/USDC loops](#borrowing-loops-build-change-conditions-unwind), [LST loops](#correlated-asset-loops), [controlled widths](#compare-widths-with-a-common-starting-mix), [fee flow](#follow-the-fees), [recorded cases](#historical-cases-fees-through-a-recorded-period), [lessons](#learn-liquidity-essentials) or [saved experiments](#saved-experiments). Each tool is available directly.

## Fees, time and costs in liquidity labs

In either endpoint lab, choose **A total cash amount** or **An average fee APR**. APR applies to your starting capital over the duration you enter. Use an average for the whole period, including time outside a range; changing the width does not automatically increase it. Cash mode can leave duration blank.

Open **LP costs** to include opening, total fee-collection and closing expenses. Enter only the additional costs relative to holding, paid separately from the starting tokens. **Where the result comes from** follows the tokens’ final value, adds assumed fees, subtracts costs and compares the net result with holding your original basket. The fee target includes costs; a duration also shows the required average APR. A target is not a forecast of attainable earnings.

The optional V2-style reference in the range lab keeps its own cash fees and uses the same cost budget. Copying, saving or exporting includes these assumptions. Older links and saved experiments retain their cash amounts and open with zero added costs; lessons and recorded cases keep their original accounting.

## Start from Home

Home introduces Liquidity and Lending. **Open the lab** and **Learn step by step** have equal prominence; every lesson and tool stays directly accessible. **Continue experimenting** restores the last valid assumptions edited or saved in this browser, independently of lesson progress. Its local bookmark contains inputs, not recorded provenance; use named saves to retain a source snapshot. **Your saved experiments** opens the shared library. Phones have a shortcut to each topic above the cards. The Teren logo returns Home, and **Continue learning** reopens the most recently visited lesson in this browser after it has been opened in this release. It is a navigation bookmark, not a completion mark.

Inside a topic, the mode links stay within it: Liquidity has Learn, Experiment and Inspect; Lending has Learn and Experiment. Switch topics in the header. Valid liquidity drafts survive a same-tab visit to Home, Learn or Lending. An explicit shared scenario takes precedence when reopening the lab.

The liquidity lab now lives at `liquidity.html`. Existing links such as `/#scenario=...`, `/#inspect` and `/#historical-case` still open the corresponding liquidity view and preserve their fragment. Home links and lesson links remain directly shareable.


[Project overview](../README.md) · [Product decisions](../DECISIONS.md)

## Finding a tool and returning to your setup

Choose **Liquidity** or **Lending** in the topic switch. Experiment and Learn follow the chosen topic. Inspect currently contains liquidity snapshots and historical cases; lending has no live or recorded position imports yet.

| Topic | Experiment | Learn |
| --- | --- | --- |
| Liquidity | [Full-range and price-range labs](https://teren.sh/liquidity.html#experiment) | [Foundations, range choices and recorded cases](https://teren.sh/learn.html) |
| Lending | [Collateralized-loan lab](https://teren.sh/lending.html#experiment) | [Supply, borrow, change conditions and respond](https://teren.sh/lending.html#learn) |

The top navigation stays visible while scrolling. **Experiment** opens the chosen topic’s calculator workspace; **Learn** opens its lessons. **Inspect** opens liquidity’s pool/position workspace. Within Liquidity, the tool links follow the current workspace: calculator tools in Experiment, snapshot sources in Inspect, and a return to experiments from recorded history or Pool mechanics. Historical cases belong to Inspect and remain directly accessible from Experiment. Existing tool and shared-scenario links still open their targets directly.

Switching workspaces or calculator tabs preserves their current inputs. Clicking a same-tab Learn or Lending link temporarily retains valid liquidity calculator inputs, the selected lab and any matching source snapshot. Returning restores those working drafts; an explicit shared scenario takes precedence. This handoff uses per-tab session storage and is consumed after restoration. If storage is blocked, navigation still works but the handoff cannot be saved. Invalid/incomplete inputs are not captured. Use **Save experiment** and export the library for a durable, portable liquidity copy.

## Lending: supply, borrow, change conditions, respond

Open [the lending lab](https://teren.sh/lending.html#experiment) directly or start with [the first lesson](https://teren.sh/lending.html#lesson=supply). The four lessons add one idea at a time; every lesson can also be opened directly. Predictions are ungraded. The explanation and changed-situation checks require no arithmetic. Optional reading links to primary sources.

The first two lessons open with **Follow the money**. Move ETH from the wallet into a supplied balance, see a year of assumed interest with collateral off, then explore enabling it. The next lesson shows borrowed USDC arriving with matching debt. **Available to borrow** is remaining capacity, not cash already owned. Use the named action, Back, replay or **Choose any step**; no answer or watching is required. The prediction question and choices stay visible, with a clear **Not sure — show me** alternative. **Explain this example** restores the fixed question frame, and its Experiment link keeps the original inputs.

The third lesson, [Prices, interest and time](https://teren.sh/lending.html#lesson=conditions), starts with a visual comparison of counted backing and debt. **Time** holds ETH at $2,000 while simple interest grows the debt; **ETH price** holds time at one year and changes only the value of the same ETH. Equal bars mean health factor 1. **Boundary** selects the exact price, with balances clearly labelled before liquidation. Dashed marks show the start of the selected comparison. Switching modes starts that comparison afresh; reselecting the active mode keeps its value. Predictions are optional, and **Explain this example** restores the fixed one-year question and its original Experiment link.

The fourth lesson, [Repay or add collateral](https://teren.sh/lending.html#lesson=respond), shows both choices together. Move **Budget per choice** to compare smaller or larger responses from the same original loan. **Question** restores the $1,000 case; **Repay all** clears the debt in the repayment column while the 5 ETH stays supplied. A larger budget leaves unused USDC there; the collateral column spends its whole budget on ETH and keeps the debt. The bars share one dollar scale and mark the original balances. These are separate alternatives using fresh outside cash, not successive actions. Predictions are optional; the explanation and Experiment handoff use the fixed question budget.

**Your starting loan** sets supplied ETH (representing WETH), its starting price, whether it backs the loan and the amount of USDC borrowed. **Rates and collateral rules** contains editable teaching assumptions. Maximum starting LTV limits a new loan; the liquidation threshold governs an existing loan. The starting loan must be valid before later conditions can be explored. The setup collapses on phones and summarizes the starting balances.

**Change the conditions** adjusts the later valuation price and elapsed days. Choose **Continuous compounding** or **Simple interest** for the whole loan. Both use fixed APRs: supply interest adds ETH, and borrow interest adds USDC debt. Compounding also grows earlier interest. New and reset loans default to compounding; older links, saved setups and the foundation lessons retain simple interest. Borrowed USDC stays in the wallet. **Assets minus debt** includes that cash and its matching liability, so borrowing does not create profit. A health factor below 1 means eligible for liquidation. **Balances before liquidation** labels the unchanged endpoint; **What would liquidation take?** opens a separate single-event illustration at that price.

Assumed APRs stay visible beside the conditions; **Edit rates** opens and focuses their controls. On mobile, a compact health factor and status follow you while editing, with **Full result** opening the detailed outcome. Invalid loan inputs offer a shortcut to the affected field, even when it is inside a closed disclosure. An incomplete response budget hides only the response comparison; the current loan remains visible.

**See health factor across prices** keeps the accrued token balances fixed while changing only ETH’s valuation price. It shows the health-factor-1 boundary and the currently selected price; it is a sensitivity chart, not recorded price history.

**What would liquidation take?** uses an editable requested repayment fraction and bonus. The liquidator repays debt and takes matching collateral plus the bonus. The bonus is a percentage of the debt repaid. It is taken from your collateral. The result shows debt repaid, ETH removed, extra value taken, remaining balances and the effect on net assets. Repayment is capped by available collateral; a crash can leave unpaid debt after all collateral is removed. The percentages are illustrative, not current Aave close-factor or bonus rules. The example excludes earlier events, gas and later protocol handling of shortfalls. Event assumptions have a separate tab draft and are retained in copied loan links.

**What time adds** keeps the time slider beside two bars: original supplied ETH plus supply interest, and original USDC debt plus borrow interest. Both bars use one dollar scale at the selected ETH price, which stays fixed as you move time. Hatched sections show added interest; token amounts remain labelled. Enter exact days in the numeric field. The same balances drive health factor, the price boundary, responses and the separate liquidation event. The APR summary also shows one-year growth (equivalent APY when compounding).

**Compare interest assumptions** puts both debt calculations beside each other and identifies the selected rule. In simple-interest mode, a visible prompt points to a material compounding difference. Neither calculation forecasts changing rates or reproduces Aave’s exact reserve-index accounting.

**Repay or add collateral?** compares two immediate responses before any liquidation with the same additional external budget at the chosen price. Repayment stops at the total debt and shows unused money. Added collateral increases the supplied ETH without reducing debt. Execution costs and delays are excluded, so the comparison does not promise that a response can happen before liquidation.

The lab keeps the last valid working loan in this tab's session storage, separately from lesson examples and liquidity drafts. **Copy experiment link** preserves all inputs in a validated `#loan=collateral-loan-v1` link; if clipboard access fails, a selectable link appears. **Save experiment** keeps a named loan and notes in the shared library, including its liquidation illustration inputs. Reopening creates a working copy; it does not update the saved original. Lesson progress uses its own local-storage key. **Explore this setup in Experiment** opens the exact example in a separate tab without replacing the working loan.

**Learn** resumes the last opened lending lesson, including after a reload or a visit to Liquidity. Explicit `#lesson=...` links still select their named lesson, and **All lessons** keeps the whole sequence accessible. The current topic is labelled rather than linked, so selecting it cannot unexpectedly switch modes.

USDC = $1 is an assumption. Rates, LTV and threshold are illustrative, not current Aave market quotes; Aave's indexed interest accounting is not reproduced. Multiple collateral assets, live lending snapshots and independently checked lending history are later iterations. Borrowing loops use the separate lab below. See [the model](models.md#collateralized-loan-model).

## Borrowing loops: build, change conditions, unwind

Open **Borrowing loops** beside Single loan, or use [the direct lab link](https://teren.sh/lending.html#loops). Begin with zero or one round, then use the minus/plus controls or number field to change rounds up to five. Zero rounds is supply only, with no loan. Each round borrows a fraction of the ETH value just supplied: the original ETH for round one, then the preceding purchase for later rounds. The helper shows round one's borrowing amount.

**Follow each round** starts with compact summaries; open a round to separate borrowing, swapping and supplying, including wallet balances, debt, health factor and net assets. Open rounds stay open while editing. These balances use the starting price, before time passes. Borrowed USDC is spent when it buys ETH; it is never counted again beside that purchase.

Both sides of the holding comparison start with the original ETH. The loop adds no outside funds. **Original capital and assumptions** sets the ETH, starting price, borrowing limit, liquidation threshold and assumed loss on each swap. The swap loss represents a combined fee/price-impact haircut, applied when buying or selling; gas is excluded. **Where the difference comes from** separates construction costs, interest and a supply-only comparison at the same assumed supply rate.

**Test price and time** applies a later ETH valuation and interest period to the completed loop. The result leads with the difference from holding, labelled with that selected price and time. Continuous compounding is the default; fixed simple interest is available for comparison. Neither calculation reproduces changing protocol rates or Aave reserve indexes. The chart compares possible prices at the same accrued token balances, rather than reconstructing a price path. Its dot marks the selected price and net assets. Health factor and net assets are separate: an improved health factor does not undo extra ETH exposure.

**What would liquidation take?** shows one event on the main loop at the selected price after interest. Adjust the debt-repayment percentage and bonus to see USDC repaid, ETH taken and remaining assets minus debt. The borrowed cash has already been spent on ETH. Unpaid debt stays visible if collateral runs out. Event inputs travel with saved experiments and copied links; they do not change the pre-liquidation headline or the separate unwind preview. The risk summary gives the boundary’s percentage distance from the selected price, and the chart includes both main and reference boundaries.

**Withdraw, sell, repay** previews a sequential unwind at that one selected price. Each withdrawal uses up to 95% of the collateral value above health factor 1, capped by the sale needed to repay the remaining debt. Sale proceeds repay debt before the next withdrawal. The preview stops at or below the liquidation boundary, retains unpaid debt and uses no outside cash or flash loan. Its 95% convention and 64-step limit belong to this teaching model, not Aave. Gas, liquidity restrictions, market changes and execution ordering are excluded. Pre-liquidation headline balances do not establish that a real position survived earlier prices.

Unwind labels distinguish completed, partial, blocked and no-debt outcomes. A blocked preview shows swaps as **Not run**, with supplied ETH and debt unchanged. A partial preview keeps the debt still owed visible. Construction and unwind swap losses are reported separately when swaps occur.

**Compare loop setups** adds a reference alongside your current construction. Change its round count and, optionally, its borrowing fraction; **Same borrowing fraction** keeps that input linked until unchecked. Original ETH, starting/future prices, time, interest rates/mode, collateral rules and swap costs stay shared. The main table compares net assets, ETH, debt, health factor and liquidation boundaries. The chart includes the reference line; **Compare build and unwind costs** separates construction costs and the fixed-price exit previews. A supply-only reference earns assumed supply interest, unlike holding ETH in a wallet. A blocked preview retains its debt. **Stop comparing** returns to the single setup.

**Follow the money in your setup** illustrates every construction round using your inputs, including swap losses. **Follow your unwind visually** uses the same action ledger as the exit preview. Named actions and direct step selection expose wallet assets, collateral, debt and health factor. Blocked previews move no tokens; partial previews retain debt and have no fictional final withdrawal. Changing inputs resets an open walkthrough to its new starting balances. These views are available without lessons or predictions.

**Copy loop link** includes every assumption in a strict `#loop=borrowing-loop-v1` fragment. When comparing, **Copy comparison link** includes the reference count and any separately chosen borrowing fraction. **Save experiment** stores these together with a name and notes. A valid working loop and its comparison stay in their own tab draft, separate from the single loan; incomplete edits do not overwrite it. Reset clears the comparison. Older links still open their exact single setup.

The three [loop lessons](https://teren.sh/lending.html#loop-lesson=build) follow the four essentials and remain independently accessible. They use the actual loop model and conceptual explanation/application checks. The first and last open with **Follow the money** and an optional prediction before the action controls. The middle lesson uses an optional prediction and separate price/time comparisons. The first lesson separates the starting supply, borrowing, buying ETH and supplying it. Wallet assets, collateral and debt remain visible; assets minus debt stay unchanged in this no-cost, fixed-price example.

In **Explore unwinding**, the money flow has eight stages: the starting balances, two passes through withdrawal → sale → repayment, and a final withdrawal of the remaining ETH. Selling ETH creates wallet USDC and incurs the assumed swap loss; the debt falls only when that USDC is spent on repayment. After the last repayment, ETH is still supplied until the final transfer moves it into the wallet. Wallet, collateral and debt stay visible. **Balance details and assumptions** expands the exact changes and cumulative unwind costs; health factor stays visible. These stages use the fixed-price teaching model, not recorded or executable transactions.

The final application pauses a separate view just after **Sell ETH**. Identify the missing action while the wallet has USDC and debt is still owed. After checking, **Show the repayment** compares the wallet and debt before and after that action. This contrast is optional and does not advance the main walkthrough or change its Experiment link.

The middle lesson, [Repeat and change conditions](https://teren.sh/lending.html#loop-lesson=stress), compares holding 5 ETH with a three-round loop from the same $10,000 start. The headline values subtract debt; the bars show gains or losses from the original capital, with one zero and dollar scale. **ETH price** keeps interest at zero. **Time** starts afresh at $2,000 per ETH with 0% supply APR and 10% borrow APR using continuous compounding. Interest added to supply and debt is shown separately. The loop’s debt, health factor and liquidation price stay visible; the balances remain before any liquidation. **Boundary** selects the exact price even though its display is rounded. Each selection is an endpoint, not a history. **Explain this example** and a revealed-lesson reload return to the $1,500 price question with no interest; its Experiment link is unchanged.

The build and unwind lessons open with **Follow the money**. See the starting balances, optionally predict, then use each named action to move wallet tokens, collateral and debt. **Replay action** repeats the short cue; **Back** revisits a frame. **Choose any step** gives direct access, grouping unwind actions by pass. There is no autoplay or required watching. The unwind keeps health factor and the collateral constraint visible; detailed deltas and costs are expandable. Explanations and changed-situation checks determine completion, without calculations. Compatible answers and earlier completion remain intact when questions improve, and each lesson opens its exact loop setup in a separate Experiment tab.

## Starting and comparing an experiment

**Start with a simple example** opens the unchanged-price, zero-fee baseline directly at its inputs. **Learn from the beginning** opens the first lesson; advanced users can use **Examples** to open any stage. The example and saved libraries sit after the working labs so they do not delay editing. **Try a quick change** is an optional, unnumbered set of shortcuts; the ordered library remains the progression.

On mobile, a compact comparison of **LP vs holding** stays visible above the fields while you edit. It includes the current assumed cash fees and uses the same result as the full analysis. **Full results** opens the detailed outcome without changing inputs. Incomplete or invalid fields show a nearby message and clear the compact outcome. Optional empty fee inputs mean zero. Save, share and export controls follow the result.

Price-comparison tables keep their columns on desktop. On mobile, each price becomes a labelled card showing all values, including the gap to holding, without horizontal scrolling. Selecting a price still updates the lab and retains keyboard focus.

## Compare widths with a common starting mix

Open [Compare widths](https://teren.sh/liquidity.html#compare-widths) from the liquidity tools, range lab or recorded comparison. Both alternatives start with the same capital and a 50/50 ETH/USDC basket by value. **Shared starting setup** changes the capital or starting price for both. A width is the total span of its price bounds as a percentage of the starting price; 20% does not mean ±20%. These bounds keep the start 50/50 by value. The range lab’s ± presets instead put equal dollar distances on either side of the starting price; its **50/50 start · 20% total width** preset matches this comparison’s centering.

Change A or B, enter an exact comparison price, or move the common price slider. The bands share one price scale. Each outcome card shows token balances, principal now, dollar change and fees needed to match holding. Cards stack on narrow phones to keep amounts readable. Equal widths produce equal results. Boundary shortcuts are under **Choose a range edge or return to the start**. The optional gap chart compares hypothetical endpoints before fees.

Valid edits stay in this browser, independently of lessons and the other labs. Home’s **Continue experimenting** returns to the edited comparison. **Share this comparison** preserves the exact inputs in a link. **Open A/B in range lab** carries the selected range and price with zero assumed fees; it can then be edited or saved as a named range experiment. Back returns to the comparison. A corrupt draft or unsupported link produces an explicit fallback message.

This isolates width’s effect on principal under the stated model. It does not estimate what either range would earn. The separately linked recorded comparison retains its original NFT bounds, token mixes and historical fee evidence.

## Example progression

Liquidity’s **Choose an example** library follows eleven ordered cases. Each states what it adds. The four stages are **Foundations → Comparisons → Ranges → Applied cases**, shared with Learn's lesson groups.

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
| 11 | Applied cases | A week without new fees | Daily accounting, elapsed time without income, and dollar change versus holding |

Every stage and lesson is directly accessible; variations practice the same concept rather than representing difficulty levels. Advanced users can open [the recorded in-range snapshot](https://teren.sh/liquidity.html#example=in-range-position), [fee-accounting snapshot](https://teren.sh/liquidity.html#example=position-fees), [in-range replay](https://teren.sh/liquidity.html#historical-case), [exit-and-return replay](https://teren.sh/liquidity.html#historical-case=range-return) or [one-week replay](https://teren.sh/liquidity.html#historical-case=one-week) without completing earlier lessons. The example definitions live in [public/learning/example-path.js](../public/learning/example-path.js).

Examples 01–05 carry hypothetical, versioned assumptions through scenario links. Examples 06–08 select Inspect's position source and save the chosen recorded snapshot; calculator inputs change only when the user applies it. Examples 09–11 open the recorded-period workspace. It does not replace the latest position snapshot or automatically change calculator inputs. Examples do not change virtual balances or lesson completion.

## Historical cases: fees through a recorded period

Open **Historical cases** from Experiment. The **Recorded cases** selector starts with **01 · Stays in range** (example 09), then **02 · Exit and return** (example 10) and **03 · One week** (example 11). Each remains directly accessible. The baseline follows Ethereum Uniswap v3 WETH/USDC position #1382030 in the 0.3% pool from block 26168526 to 26168941 on 11 October 2026. Nine checkpoints cover **4,992 seconds** (83 minutes and 12 seconds), with unchanged position liquidity and bounds.

The exit-and-return case follows position #1375047 in the same 0.3% pool from block 26080000 to 26090000 on 29–30 September 2026. Its 17 checkpoints span **120,468 seconds** (33 hours, 27 minutes and 48 seconds): 50,256 seconds in range and 70,212 outside, with unchanged liquidity and bounds.

Move the checkpoint slider to compare **Principal + period fees** with **Hold starting principal tokens**. Both strategies begin with the first checkpoint's exact principal tokens; previously accrued fees and recorded owed balances are excluded. Period fees are calculated from recorded fee growth and kept in their earned tokens, rather than entered as assumed cash. Time in range comes from cumulative contract counters, not the sampled price line. Independent read-only collection simulations and complete position-update event queries check the recorded accounting and continuity.

Use **Start**, **Outside sample**, **Between samples**, **Return sample** and **End** to jump through the exit-and-return case. These identify recorded checkpoints, not exact crossing times. **Since the previous checkpoint** separates interval fees and active time from the cumulative totals. At the Between samples checkpoint, both endpoints are outside, yet counters show 45 minutes and 24 seconds of activity and new fee tokens between them. The chart focuses on recorded prices and identifies any fixed bound outside its view.

**One week** follows position #1375090 from 12–19 October 2026, with eight daily checkpoints over 604,800 seconds. It begins with about $140.75, entirely in WETH, and records zero newly earned fees and zero active seconds. LP and holding end equal at about $133.80: matching holding does not establish a dollar profit. **Start** and **Day 1–7** jump directly to each checkpoint. **Compare all seven days** shows each interval’s fee tokens and active time. **How this position was chosen** links to the dates and candidate order declared before inspecting the selected outcome, including both initial exclusions. The week was retained despite its lack of income.

Every case shows dollar change from its starting principal separately from its difference against holding. Expand **Tokens and verification** for the full UTC window, token balances, the selected block/hash and exact fee/time integers. **How to read this replay** explains sampling, fee tokens versus dollar valuation and the holding benchmark. **Export recorded case** downloads the checkpoint snapshots, counters and verification evidence as JSON. The week export retains all seven segments and their complete event-query coverage. **Explore this checkpoint in Experiment** starts a new hypothetical range experiment from the selected checkpoint's principal, price and bounds, with zero assumed future fees. Already collectable tokens stay outside both strategies in that new comparison.

These are fixed-position records checked against chain reads and collect simulations at capture. The browser revalidates bundled arithmetic; it does not re-query Ethereum. Capture dates and providers are in **Tokens and verification**, alongside the reproduction procedure. They have no editable historical bounds or date window and do not provide arbitrary-range backtesting or lifetime PnL. Valuations use the selected pool ratio and USDC = $1; gas and incentives are excluded. See [the replay method and limitations](replay.md) for the fee checks, rounding tolerance and capture procedure.

## Saved experiments

Choose **Save experiment** in a liquidity, single-loan, ETH/USDC-loop or LST-loop lab to keep its model, exact assumptions, name and optional notes. One shared library is available from both topics. **Duplicate as variation** creates an independent named copy with the same assumptions and notes; open it to explore changes and save a new setup when ready. The [Saved experiments library](https://teren.sh/liquidity.html#saved-experiments) can search names/notes, filter by model, edit names and notes, and reopen any setup. Reopening loads a working copy; input edits leave the original record intact, and saving again creates a variation. Removal has an Undo action until another record is removed or the tab reloads.

Select two or three compatible records to compare. Outcomes are recalculated from saved inputs, with expandable assumptions and notes:

- **Liquidity with liquidity:** show LP value, the exact starting-token holding value and their difference. The context identifies shared baskets/prices or differing budgets, prices and token mixes. Equal budgets do not guarantee the same starting tokens. Fee inputs remain assumed USD cash and USDC is valued at $1.
- **ETH/USDC loans and loops:** show assets minus debt before liquidation, debt and health factor. Loan cash stays in the wallet; loop borrowing buys ETH. The context identifies differing capital, market conditions or interest rules. The loop lab separately offers a comparison under shared conditions.
- **LST loops with other LST loops:** keep WETH-denominated values and the original-wstETH holding benchmark, with differing conditions identified. These records cannot be mixed with ETH/USDC comparisons.

Each saved setup retains its own assumptions; comparison does not silently synchronize them.

When a setup still matches its imported pool price or NFT principal/range, saving retains the full validated source snapshot, including its block and exact integers. Changing a pool starting price, or an NFT's starting price, investment or bounds, clears that attribution. Future-price and fee-assumption changes preserve it. Reopening does not fetch the chain, contact imported provider URLs or replace the latest pool/position snapshot. Recorded collectable tokens remain outside both strategies' future principal comparison.

The library uses its own degenerator-experiments-v1 storage key and version-1 JSON schema, independent of lesson progress, snapshots and the virtual sandbox. Export includes names, notes, assumptions, loan liquidation illustration fields, optional loop reference choices and retained liquidity source snapshots; ordinary scenario links still contain only model inputs. Imports merge atomically, skip identical records, and keep conflicting IDs as new copies rather than overwriting either version. Limits are 50 records, 80-character names, 1,000-character notes and a 512 KB file. Unsupported models/versions, invalid sources and malformed files are rejected without altering the current collection.

Storage failures keep changes for the current tab and explicitly request an export. Unreadable or newer saved copies are retained, downloadable and discarded only through their own recovery action. Each edit reads the latest stored collection to preserve another tab's additions; stale name/notes edits and removals are rejected. Data/schema/storage code lives in public/data/saved-experiments.js, calculation/presentation helpers in public/lib/saved-experiments.js, and the injected library controller in public/ui/saved-experiments.js.

## Learn: Liquidity essentials

Open [Learn](https://teren.sh/learn.html) for six independent foundation lessons, a final challenge, **Choosing and managing a range**, then **Fees, time and range exits**. The two later chapters each have three exercises. Every topic is available directly, including shareable lesson fragments such as learn.html#lesson=range-boundaries. Exercises follow **Predict → Observe → Check**. Predictions are optional and ungraded. In Check, explain the mechanism and use it in another situation; later questions combine earlier ideas. No required task involves calculation or rounding. Hints remain available, and feedback explains the selected misconception. A short sourced pitfall stays beside the result, while worked calculations and detailed reading remain optional.

**Swaps & price impact** shows ETH entering a pool and USDC leaving, with a comparison of the starting price and the average received on small and larger trades. **Providing liquidity** shows a matching deposit, then a separate trader’s swap: your percentage stays the same through that trade while your claim on ETH and USDC changes. Use the named action, Back, replay or direct step selection. The amount slider explores fresh examples from the same starting pool; **Question amount** returns to the assessed setup. **Change the question trade size/deposit** explicitly replaces that setup and clears its earlier answers. The existing sandbox link remains independent and preserves its virtual balances.

**Changing token balances** and **Narrow and wide ranges** begin with interactive diagrams. Move the price slider to compare both token amounts or both ranges; use **Question** to return to the price used in the understanding checks. Exploration does not change the assessed setup or Experiment link. In the token lesson, **Change the question price** explicitly updates that setup. Range boundary buttons show the difference between an exact edge and a price inside or outside. Earned fees are not inferred from these diagrams.

All twenty lessons introduce the starting situation, the change being tested and its key assumptions before the prediction choices. Choose an expectation, then **See what happens**, or use **Not sure — show me**. Feedback states whether your prediction matched and explains the finding. Visual lessons bring the question’s diagram into view beside that feedback. You can also explore or read the explanation directly; the explanation and application checks determine completion.

The lessons cover swap impact, proportional pool ownership, changing token balances, impermanent loss versus dollar profit, fee break-even, and concentrated range boundaries. The final challenge brings the comparisons together: find a setup where the LP matches holding but both are below the starting capital, then explain why those statements can coexist. The controls supply the values; no exact price or manual fee calculation is required. The optional worked example still distinguishes additional fees from the total break-even target.

[Loss versus profit](https://teren.sh/learn.html#lesson=loss-vs-profit), [Fees & break-even](https://teren.sh/learn.html#lesson=fee-break-even) and the [Final challenge](https://teren.sh/learn.html#lesson=final-challenge) share a live comparison of starting capital, holding and LP value. The first starts at the original price; move the price to see dollar profit and performance against holding separately. The fee lesson holds the question price fixed and starts with no fees. Add hypothetical cash fees as a striped part of the LP bar, or choose **Match holding** to see the exact total required. This target says nothing about achievable earnings. In the final challenge, switch between **ETH price** and **Assumed fees**; both selections are kept. All bars retain one dollar scale.

The prediction stays visible and optional. Observation exploration does not edit saved answers or Experiment inputs. **Explain the question setup** restores the assessed price and fees; a revealed lesson also restores that setup on reload. **Change the question price and fees** explicitly edits the assessed setup and clears its old answers. The follow-up situations ask whether withdrawing the same tokens changes the gap against holding, and whether already-earned cash fees still cover that gap after a further price move. Key prices appear beside the question; no arithmetic is required.

The final application has its own price control, **Lower price**, **Starting price**, **Higher price** and **Match holding** shortcuts. **Show an example** supplies a working setup when needed; the explanation still matters. Checking requires a setup that meets both conditions and correct conceptual answers, with no required number of clicks. This task saves separately from the worked observation. Its result card and scenario link describe the original worked example, not the task’s exploratory values.

Every subject, including the final challenge, has optional Go deeper reading after its experiment explanation. Topic-specific mechanics, a worked example using the selected inputs, common misconceptions, a separately expandable math panel and two primary-source links provide a deeper path. Opening reading never affects completion; switching lessons closes both disclosures, and rerunning an edited setup refreshes its example. Editorial content lives in public/learning/deeper-reading.js and worked-example narration in public/lib/lesson-walkthrough.js.

Essentials lesson inputs and answers are stored under degenerator-learning-liquidity-v1, independently of sandbox balances, snapshot imports and liquidity controllers. Reopening restores the last lesson and validated exercise draft, including a stable order of answer choices. When a question is materially revised, its earlier answer is cleared while already checked lessons remain checked. Old numeric answers are never converted into conceptual answers. Damaged drafts are ignored; unavailable or full storage leaves learning usable in the current tab. Experiment links open a separate tab. Price/range lessons carry their exact model assumptions; swap/ownership lessons open the existing swap sandbox without replacing its saved pool or wallet.

Content lives in public/learning/, pure experiment/assessment logic in public/models/lesson-experiments.js, progress persistence in public/data/learning-progress.js, and the controller in public/ui/learning.js. The learning document has its own composition root, public/learn-main.js, and shares the existing calculator models and styles. No backend, account, live RPC request or new runtime dependency is required.

## Practical learning: choosing and managing a range

Open [range choices](https://teren.sh/learn.html#manage=range-width) after the essentials challenge, or open any exercise directly. The sequence adds range width, then fee tiers and APR, then exits, returns and management costs. Each exercise has three repeatable situations. Read the supplied setup, predict, reveal the outcome, explain it and answer a changed situation. No calculation field is present.

The width exercise calculates two continuous range positions with the same budget and starting price, each funded with its own required token mix. It compares active status, not earned fees or a shared holding basket. The fee-tier exercise uses unknown earnings or explicitly supplied fictional fee totals; the totals are teaching facts, not estimates, imports or verified history. The management exercise calculates principal at two outside prices with unchanged liquidity and shows why an inside return can reactivate it. USDC is assumed to stay at $1. It explains the actions and possible costs of changing a real v3 range; it does not simulate rebalancing or reimburse past losses.

Experiment links open these hypothetical range setups in separate tabs, preserving their original funding, displayed final price and zero assumed fees. Range choices use `passiko-range-learning-v1` independently of essentials, historical learning and saved experiments. Valid drafts, stable answer order and checked exercises survive reloads. The chapter uses hypothetical inputs and has no live chain reads; the recorded historical cases remain separate. See [lesson goals and research](learning.md).

## Applied learning: fees, time and range exits

Open [the applied chapter](https://teren.sh/learn.html#applied=fees-over-time) after range choices or use any exercise directly. The sequence adds one idea at a time: new fee tokens in the in-range baseline; active time between two outside samples in the exit-and-return case; then that case’s final LP-versus-holding result. Each exercise introduces the recorded position with its starting tokens and a price/range graphic before asking about the mechanism. The final prediction asks whether earning fees can still leave a position behind holding; it does not ask you to guess the record’s unseen winner. Reveal the recorded result to explore its chart and balances, then explain the record and apply the idea to a clearly labelled thought experiment.

The record explanation and final-period conclusion refer to a marked checkpoint or interval. Revealing restores that checkpoint; the slider and milestone buttons then explore the rest of the record without changing the assessment. **Return to the question checkpoint** restores its observation. Predictions can be mistaken or skipped; **Not sure — show me** opens the validated record without recording a guess. Both conceptual answers must be correct to mark an exercise checked; optional numeric practice never affects completion. All three exercises remain directly accessible, and replaying a question retains previous completion.

**Explore this setup in Experiment** opens a separate tab with the selected checkpoint’s principal, price and range, and zero assumed future fees. This starts a new hypothetical principal-only experiment. It excludes earlier collectable tokens and the historical period’s earnings. **Inspect the full recorded case** opens the existing historical evidence. The first two applications consider collecting fee tokens without removing liquidity and sharing fees with more competing active liquidity. The latter supplies equal active time and equal total USDC fees at each traded price, so the question isolates competition. Relevant recorded balances, interval facts and hypothetical conditions appear beside their questions. In the final exercise, one question pairs the earlier balances with a fee collection: moving already-earned tokens into the wallet leaves the total gap unchanged when prices and costs stay fixed. The next shows the final token mix and asks what happens if ETH rises further above the range. Holding contains more ETH, so the LP’s lead shrinks even though its WETH fees also gain value. A hypothetical $1 LP-only cost remains a worked illustration, separate from the record. Optional accounting details show exact token quantities, raw fees, block hashes, independent checks and primary sources. The essentials and historical chapters keep worked calculations and optional numeric practice in **Go deeper**; practice feedback never controls completion or the final result card.

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

The footer provides [Methods](https://teren.sh/methods.html), [About](https://teren.sh/about.html) and the project source. A ↗ marks a link that opens a separate tab; → marks a same-tab destination. Methods explains hypothetical inputs, snapshot validation and historical accounting checked at capture. **Email feedback** opens a message to hello@teren.sh without a GitHub account. **Report an issue** opens a prefilled GitHub issue for visitors who prefer it.

On mobile, use **Explore experiment tools** or **Explore inspect tools** to reveal the secondary destinations. Primary Experiment, Learn and Inspect navigation stays visible. Practical lesson situations change the supplied facts and may change the correct follow-up; hints remain available and no calculation is required.

## Which Uniswap version am I exploring?

- **Full range · V2-style** and the virtual pool use Uniswap v2-style mechanics. The early lessons identify this scope beside the lesson heading.
- **Price range · V3-style** and practical range exercises use simplified Uniswap v3-style concentrated liquidity math. Price bounds are continuous inputs here; native v3 positions use tick boundaries.
- **Inspect** labels real v2 pool snapshots separately from v3 positions. All three historical cases use real v3 positions.

Uniswap v3 can also provide full-range liquidity. The lab labels identify the calculations Teren uses. The `v1` in `cp50-v1` or `cl-range-v1` identifies Teren’s model revision; it does not mean Uniswap v1.

## Putting an assumed fee amount in context

Both liquidity labs, Fees & break-even and the final challenge offer **Could fees cover this?** below the comparison. It expresses the total holding-match fee target as a percentage of starting capital. A chosen time window translates that target into a required average per day; extending the window does not predict more income. The remaining gap subtracts your assumed fees from the total target, while the daily hurdle uses the full target.

A separate disclosure loads three recorded v3 positions as starting capital → recorded time → new fees earned. Each retains its actual range and active time; capture details and accounting notes are available below. Their fee tokens are valued at the final recorded price with USDC = $1. They cover different dates, durations and ranges; the week earned no new fees. These observations do not establish representative yields or forecasts for either lab. Follow **Inspect this recorded case** for the accounting and providers. Opening context or changing its window does not alter the question, an experiment, or a shared link.

## Compare two recorded ranges

Open **Compare two ranges over the same week** from a liquidity lab’s **Could fees cover this?** panel or the historical cases. The shared slider and Start/Day buttons move both positions to the same block. The chart shows new fee value as a share of each position’s starting capital; the cards separate fee income, LP minus holding, and dollar change. Seven bars show each day’s recorded active time.

Each range keeps its own starting principal basket. **Tokens, collections and evidence** shows current principal, actual withdrawals, earlier excluded claims and remaining collectable tokens. Withdrawals can include old claims, so they are not automatically new income. **Explore this range in Experiment** starts a principal-only hypothetical scenario with zero future fees. **Export both positions and their evidence** retains both complete records.

The two positions share their pool and week, but differ in range placement and starting mix. This is an illustration, not typical earnings or a controlled test of width. Collected tokens are valued as if held to the selected checkpoint; gas and recipient trades are excluded.


## Follow the fees

Open [Compare widths → Follow the fees](https://teren.sh/liquidity.html#follow-fees). Start with the **Try two batches** example: the same trading amount first happens at the starting price, then at the selected price. Each is hypothetical, with its price held fixed while fees are split.

The preview shows trader fees, the protocol share, and each alternative’s share among active LPs. **Add this trading batch** keeps its ETH and USDC fee tokens. Move the price outside a range: it receives no new fees there, but tokens from earlier batches remain. Their ETH value changes with price. **Next batch** lets you vary volume and competing capital. The other LPs’ width slider changes where that same capital competes; their band appears alongside A and B, with each fee share beside the slider. Use **Compare at the starting price** to see all chosen ranges active. Full-range competition is a separate checkbox. All these settings are captured when you add a batch. Inspect the batches to see those assumptions.

The totals separate fee-token value, principal plus fees, the holding comparison and dollar change. **Token balances** returns to the principal-only comparison. Share retains every batch and setting; Home can resume the experiment. Undo removes the last batch, clear removes all batches, and Reset comparison also resets the widths and starting setup. Opening either range with fees converts the retained tokens into a fixed USD fee assumption for a separate range-lab experiment.

These results explain fee sharing under chosen conditions. They do not establish whether a real pool would see that volume or earn those fees. Use the recorded cases separately for historical observations.


Other LPs occupy one illustrative range, not a measured pool distribution. A batch cannot be added on any exact range edge, or when one of the alternatives has no active LPs. Previous shared links and saved batches keep their full-range assumptions. **Go deeper: arbitrage and changing fee competition** contains an independent three-step price/trade illustration and a JIT diagram; neither changes your experiment. The fee-tier lesson and Methods also link to these explanations.

## Correlated-asset loops

Open [LST loops](https://teren.sh/lending.html#lst-loops) from Home or Lending’s tool strip. This wstETH/WETH experiment is separate from the ETH/USDC borrowing loop. All three stages are directly accessible.

- **Build:** choose an exact target or switch to borrowing rounds. A 3× target means three times your original wstETH before interest; it does not mean three times your net ETH price exposure. Presets offer 1×, 2×, 3× and 5× when allowed by your assumed LTV and costs. Follow the flash-assisted purchase or each borrowing round through its intermediate balances. The summary shows completed collateral, debt, LTV and health factor. Starting tokens, conversion rate, swap losses, build flash fee and collateral rules are in the disclosure. Build gas is excluded; execution is assumed.
- **Hold & stress:** move time, change staking APY and borrow APR, or apply a market discount. The baseline keeps the same original wstETH without borrowing. Optional controls add one borrowing-rate change, separate collateral lending yield, a conversion-rate oracle, and an ETH dollar price. The nearby readout on phones keeps the effect of each change visible. Detailed accounting and a health-factor sensitivity chart are optional.
- **Exit:** compare selling all collateral into WETH with selling only enough to repay and keep the unsold wstETH. Choose **Follow the WETH exit** or **Follow the wstETH exit** to inspect each action; temporary and original debts remain visible until settled. Change swap loss, flash fee, flat exit cost or assumed availability. Blocked exits retain collateral and debt. The full-sale benchmark sells the original holding with the same swap and flat costs but no flash loan; the retained-token benchmark simply keeps the original wstETH. Retained tokens still carry staking exposure and market risk, and their WETH valuation is not cash received.

The market discount applies at the selected endpoint. A prior boundary caused by the chosen rates is flagged separately; a recovered endpoint is not evidence the loan survived. A liquidation illustration appears when the current endpoint is at or below its boundary.

**Save experiment** keeps exact assumptions and notes in the shared library. Compare LST records with other LST records; their units and benchmark differ from ETH/USDC loans. Conditions and exit destinations are not silently synchronized. Copying a link includes the selected stage. The working draft and Home’s resume link are independent from existing loan and loop drafts. Older LST scenarios open in round mode with their original oracle choice and WETH exit; the original named record stays unchanged. See [model details](lst-loops.md) before interpreting these scenarios as protocol outcomes.
