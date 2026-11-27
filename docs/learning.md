# Lesson goals and misconceptions

[Project overview](../README.md) · [User guide](guide.md) · [Current review](review.md) · [Observation plan](#observation-plan)

Teren has 25 lessons across liquidity, lending and yield trading. The visible method is **Predict → Observe → Check**. Check combines an explanation with an application to another situation; predictions are ungraded and questions do not ask the learner to calculate or round a result. Go deeper retains worked examples, formulas and original sources. The wstETH/WETH lab has an optional advanced lesson that can be opened directly.

## What the research establishes

Uniswap's primary documentation describes active ranges, token ownership and fee accounting. Published LP research separates holding benchmarks from rebalancing benchmarks. Public user questions illustrate mistaken expectations about [fee tiers](https://www.reddit.com/r/UniSwap/comments/n9oec4/), [fee APR](https://www.reddit.com/r/UniSwap/comments/zbmqz5/) and [stablecoin risk](https://www.reddit.com/r/UniSwap/comments/1cbavf6/). These questions demonstrate that confusion exists; they are not a representative survey or a measurement of how common each error is. Forum answers are not used as technical authority.

The normal lesson flow includes short, sourced pitfalls alongside the mechanisms. The practical chapter connects those mechanisms to decisions without claiming to identify the best investment. The observation plan below separates research informing the content, engineering checks and evidence about people using Teren.

## Progression and purpose

Within a chapter, questions move from noticing a change to explaining its cause, applying the mechanism in another situation and combining earlier ideas. Each new topic can start simply again. Numbers establish the case; comparing two printed totals is useful as a worked illustration but insufficient as a chapter's final application. A stronger application changes a relevant condition, asks which evidence supports a conclusion, or asks the learner to construct and explain an example.

Keep the evidence needed for a question beside it, and name the situation being considered. Guide the learner through the mechanism rather than narrating how lesson state or assessment controls work. Hints remain available. Wrong answers represent plausible misconceptions, and feedback identifies the mechanism behind the selected mistake. Success names the distinction the learner just made, rather than claiming mastery. Earlier ideas recur in later contexts: dollar profit versus a holding benchmark returns in recorded fees, and wallet assets versus debt returns during an unwind.

| Topic | Misconception to challenge | Understanding check |
| --- | --- | --- |
| Trade size | Every unit receives the starting pool price; pool depth does not matter; a slippage limit removes impact. | Say which of two pools pays more for the same swap and why; distinguish price impact already included in a wallet quote from slippage tolerance relative to that quote. |
| Ownership | Withdrawal guarantees the original dollar deposit or original ETH. | Follow a claim through swaps in either direction; distinguish them from another provider's proportional deposit. |
| Token balances | Rebalancing creates tokens, pays interest or protects a falling asset. | Explain swaps and a price return; distinguish holding more ETH from having more dollar value. |
| Loss versus profit | Dollar profit means beating holding; withdrawal erases or charges the holding gap. | Explain the swaps behind the changed exposure, then choose the original-token benchmark for a fictional dashboard or consider withdrawal. Reasoning follows the selected price, including an unchanged price. |
| Break-even fees | Matching holding once locks in the result; a required fee target predicts earnings. | Distinguish the total fee target from the amount still needed. Then hold earned USDC fees fixed while ETH moves farther from its starting price. |
| Range boundaries | Outside means liquidation, no earlier fees, or no price exposure. | Predict an all-USDC, an all-ETH and a mixed claim across the three variations; tell being able to earn now from fees earned on the way; apply the range’s ends to a second, narrower range. |
| Final challenge | Matching holding means making a dollar profit; a correct simulation proves safety. | Construct a case where the claim matches holding while both finish below the start, then explain the two comparisons. |
| Narrow and wide ranges | Tighter capital concentration always means greater profit; price exposure means a position is trading. | Compare eligibility, follow a price move below one range, and choose each position’s own holding basket. |
| Fee tiers and APR | The highest charge earns most; a past fee APR fixes future profit; reinvesting guarantees a larger fee share. | Explain a lower-tier pool earning more, interpret yesterday’s APR after competition changes, and distinguish collection from reinvesting while other LPs add more liquidity. |
| Exits, returns and costs | Inactive means closed or protected; changing bounds refunds losses. | Interpret outside principal values and re-entry; compare leaving a range in place with moving it after a fall before a rebound. |
| Period fees | All collectable tokens are new period income; collection is compounding. | Identify new fee tokens; collect them with principal unchanged. |
| Between samples | Endpoints describe every crossing; a wide range leaves ample room on both sides of the starting price. | Infer a return and exit from recorded active time; use the position’s placement to explain why a small rise can leave a wide range. |
| Period versus holding | Fees explain every recovery against holding; an out-of-range LP keeps its lead as ETH rises. | Separate a shrinking principal shortfall from the change in fee value, explain the token exposure behind it, then apply a further ETH rise. |

Practical follow-ups change active liquidity, trading activity or whether liquidity was removed, so the observation matters to the conclusion. Short headings name each situation. When a question depends on specific balances, prices or recorded facts, a compact panel supplies them beside the question. Feedback addresses the selected misconception. Any required totals are supplied; learners do not calculate them.

Every topic is directly accessible. Three repeatable situations in each practical topic change the observation, while retaining the conceptual scope. An unchanged-price width situation explicitly says both positions are active, rather than implying one has exited.

Direct lesson links open at the requested heading, below the primary navigation. The generic Learn entry keeps its chapter overview. Reload and browser Back retain the reading position. Selecting the current liquidity topic returns to its heading without resetting the exploration or answers. Essentials counts six foundation lessons and its final challenge as seven exercises, consistently with its progress indicator.

## Evidence boundaries

The width and outside-value cases are calculated hypothetical endpoints from `cl-range-v1`. They do not reconstruct a trading path, predict fees or model native ticks. Equal budgets across widths use different initial token mixes, so each position has its own holding benchmark. Price inputs and bounds are visible before predicting.

Fee-tier predictions start without earnings data, then reveal supplied fictional volumes, fee totals and equal active shares, with no protocol fee. The APR application supplies yesterday's share and changed competition; learners infer the direction of fee income, with the calculated new share in feedback. Reinvestment uses an ordered sequence of supplied shares. No annualization or proportion calculation is required. The APR screenshot uses a fictional past day, and the reinvestment case uses a separate fictional pool. These are teaching facts, never forecasts or independently checked history.

The three historical exercises continue to use the original two independently checked records. Their fixed question checkpoint or interval remains separate from exploration. Any changed setup is labelled a thought experiment.

## Yield trading

[Four lessons](https://teren.sh/yield-learn.html) follow a 1,000 USDC deposit over 90 days using the same assumptions as [Split the yield](models.md#split-the-yield). Start with the depositor. A buyer hands over money today for the right to future interest. Only after the rights have names do the lessons introduce buying at a discount, the timing of interest and a market price for the remaining yield.

| Lesson | Distinction to look for |
| --- | --- |
| What gets split? | Trace the principal and the buyer’s payment. Explain what the buyer can still claim after the YT expires. |
| Why buy PT or YT? | Find the source of a PT buyer’s gain when the deposit pays no interest. Explain who bears the shortfall when YT earns less than its price. |
| When does the interest arrive? | Distinguish spending more days at a higher rate from putting the same ten high-rate days first or last. Compare breaking even on YT with depositing the same money. |
| Selling before maturity | Explain what a higher YT offer buys and which interest belongs to each owner. Identify the missing amount in a wallet’s buy and sale history. |

Lessons 3 and 4 add a slider under the drawing. In lesson 3 it moves the day the rate rises (1 to 89); the buyer covers the 20 USDC price only when the rise comes by day 54. In lesson 4 it moves the implied APY of the day-45 offer (0% to 20%): the PT offer falls, the YT offer rises and the interest earned before the sale stays the same. The two named cases remain buttons above the drawing, and exploring never changes the question or a saved answer.

To observe understanding, ask a learner to explain an early sale from the seller’s point of view using their own example. A useful follow-up is what else they would need to know after seeing only the sale price.

## Lending foundations

The second topic introduces one collateral asset and one debt asset before any looping. Four fixed lessons remain directly accessible. All four use the visual patterns below, with visible questions and optional predictions. The lessons use `collateral-loan-v1`, and their Experiment handoffs preserve that model and every input. Wrong predictions are welcome; completion checks the explanation and application, with clear corrective feedback and no calculation fields.

| Step | Misconception to challenge | Changed situation |
| --- | --- | --- |
| Supply and collateral | Supplying requires borrowing; collateral settings move tokens or create debt. | Return supplied ETH to the wallet: distinguish withdrawal from disabling collateral, with no debt and enough pool liquidity explicitly stated. |
| Borrowing and debt | Borrowed cash increases wealth; the maximum allowed loan is a recommended amount. | Show the maximum loan’s narrow price headroom and distinguish the opening limit from the liquidation threshold. |
| Prices, interest and time | An unchanged ETH price means an unchanged loan. | Change the supplied growth rates; distinguish faster collateral growth from growing debt. |
| Repay or add collateral | Adding collateral repays debt; a later price recovery restores liquidated collateral. | Compare the two responses, then distinguish improved backing from reversing an actual liquidation. |

The interest lesson deliberately uses zero supply APR so only debt grows. It does not claim time always lowers health factor: different rates on both sides can change that conclusion. The response lesson displays the already-calculated outcomes. Optional reading explains collateral rules, both balance-sheet sides, variable real rates and execution limits using [Aave supply guidance](https://aave.com/help/supplying/supply-tokens), [collateral guidance](https://aave.com/help/supplying/toggle-collateral-status) and [the protocol FAQ](https://aave.com/faq).

The lending lab additionally illustrates one liquidation event: debt repayment offsets part of the collateral removed, while the bonus reduces net assets. The compounding reference exposes how a fixed simple-interest assumption diverges over longer periods. These illustrations require no calculation from the learner.

The four lending foundation lessons use hypothetical cases with fixed simple interest and USDC = $1, separate from the recorded liquidity evidence. They are not quoted Aave market parameters. Unit tests cover reference outcomes and every reasoning/application combination; browser checks cover wrong predictions, completion, exact handoffs, independent storage and mobile navigation. The ETH/USDC loop chapter below uses its own interest assumptions; the separate LST experiment is documented in [its model reference](lst-loops.md).

## Primary references

- [Uniswap: price impact and slippage](https://support.uniswap.org/hc/en-us/articles/8643794102669-Price-Impact-vs-Price-Slippage): distinguishes the trade's own impact from execution changing relative to a quote.
- [Uniswap: pools and LP ownership](https://developers.uniswap.org/docs/protocols/v2/concepts/pools): ownership of changing reserves, rather than a guaranteed dollar payout.
- [Uniswap: understanding returns](https://developers.uniswap.org/docs/protocols/v2/concepts/understanding-returns): the original holding basket and the conditional effect of price reconvergence. Simplified examples are checked against the implemented models, not copied as exact accounting.
- [Uniswap: concentrated liquidity](https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity): ranges, inactive liquidity and reactivation when price returns.
- [Uniswap: fees](https://developers.uniswap.org/docs/get-started/concepts/fees): active liquidity, per-trade rates, separate v3 fee balances and protocol shares.
- [Uniswap: changing a range](https://support.uniswap.org/hc/en-us/articles/20915975893645-How-to-change-the-price-range-of-a-liquidity-position): removing liquidity and funding another position.
- [Uniswap: range orders](https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/range-orders): reversals and the limits of stop-loss interpretations.
- [Revert: performance comparisons](https://docs.revert.finance/revert/open-positions): benchmark definitions, omitted gas and exceptional results.
- [Circle: USDC risk disclosures](https://www.circle.com/fr/legal/mica-usdc-whitepaper): secondary-market price dislocation; the $1 setting remains an assumption.
- [Milionis et al., Automated Market Making and Loss-Versus-Rebalancing](https://arxiv.org/abs/2208.06046): holding and rebalancing compare different strategies. Teren's endpoint holding gap is not an LVR estimate, and the two metrics should not be added as independent penalties.

## wstETH discounts and the lender’s price

In the [optional correlated-loop lesson](https://teren.sh/lending.html#lst-lesson=discount), a borrower starts with 1 wstETH and builds a position of 4 wstETH against 3.75 WETH of debt. The position initially sells for 5 WETH in the model. A 10% market discount takes that value to 4.5 WETH. Under the conversion-rate oracle, the health factor stays at 1.10. The modeled full sale and repayment would leave 0.75 WETH, down from 1.25.

The follow-up keeps the discount, balances, costs and elapsed time fixed. Using the market price to value collateral takes health factor to 0.99 under the example’s 82.5% threshold. The loan becomes eligible for liquidation. The quoted sale value and debt are unchanged. The experiment link opens the displayed stage in Hold & stress, and the learner’s working lab remains available on return.

An optional walkthrough follows one liquidator who repays half the debt, or 1.875 WETH. Market and oracle prices both stay at 1.125 WETH per wstETH. With a 3% bonus the liquidator receives collateral worth 1.93125 WETH. The borrower’s collateral value minus debt falls from 0.75 to 0.69375 WETH. Replaying the same repayment with zero bonus leaves the borrower with fewer wstETH and the same 0.75 WETH of equity. Each version opens its liquidation details in the lab.

## Borrowing-loop chapter

Three directly accessible lessons follow lending essentials. They use `borrowing-loop-v1` and connect prediction, observation, explanation and application. All three use the visual patterns described below. Loop drafts and completion have their own storage key, preserving earlier lending progress. The scenario handoff carries all loop assumptions into a separate Experiment tab.

| Step | Misconception | Changed situation |
| --- | --- | --- |
| Build one loop | Extra borrowed ETH is new wealth; spent USDC remains in the wallet. | Identify when buying ETH increases price exposure, then decide which ETH backs the loan before the new purchase is supplied. |
| Repeat and change conditions | A loan above its liquidation boundary has preserved its starting value. | Explain how the loan can still meet its collateral rule while losing more than holding. |
| Explore unwinding | Selling collateral repays debt; a sale cost leaves repayment unchanged. | Compare the same feasible sale with and without a cost; explain why selling the same ETH can leave debt unpaid. |

The first lesson removes costs and interest to isolate matching debt. Its application shows the supplied ETH, wallet ETH and debt immediately after the purchase, before supplying the purchased tokens. The second compares the same original capital with more ETH exposure; no arithmetic is required from the learner. The last explains intermediate collateral constraints and labels the unwind as an assumed sequence, not guaranteed execution. Its application keeps the same starting loan, price and ETH sold, changing only the sale cost. The main walkthrough retains the distinction between wallet sale proceeds and repayment. Automated checks cover answer combinations and numerical references.

## Visual lesson patterns

Review each lesson as one flow: move its explorer far enough to reverse the outcome, then open the explanation, answer, follow the lab handoff and revisit saved work. Each statement must identify the situation it describes. Open optional controls too: two individually correct controls may still duplicate one learning purpose. Preserve deliberately different application situations and their local evidence.

In liquidity and lending, fifteen lessons use the visual patterns: swaps, providing liquidity, changing token balances, loss versus profit, break-even fees, the final challenge, range-boundary token composition, narrow versus wide ranges, supplying, borrowing, prices/interest/time, repayment versus collateral, and building, stressing and unwinding a loop. The lessons put a readable starting setup before the prediction choices: balances or supplied facts, the action being tested, and decisive assumptions. **See what happens** follows a selected expectation; **Not sure — show me** opens the same outcome without inventing an answer. Feedback explicitly names a match or a different result, with a self-contained finding beside it. Matching predictions are green, differing predictions amber and skipped predictions neutral. A selected option is neutral until checked. Each explanation/application answer receives local feedback on the first check; focus goes to the first answer needing attention while keeping its question and selected answer in view. The focused feedback also names its question for assistive technology. There is no mandatory failed retry or first-attempt score. The interface does not repeat scoring disclaimers.

In visual lessons, the setup and prediction come before the interactive diagram, keeping the diagram beside its controls on phones. The action restores the question’s diagram and brings it into view. After reveal, **Show the outcome again** returns to that outcome, **Replay action** repeats a selected step’s visual cue, and the explanation button names the question outcome and opens its explanation without changing the explored diagram. Exploration remains available before choosing, and watching every step is never required. The sequence is **starting setup → prediction invitation → exploration → explanation → changed situation**. The conceptual checks still determine completion, with no arithmetic or rounding task. The build-loop setup defines one loop as borrowing USDC, spending it on ETH and supplying that ETH; the question refers to all three actions.

Recorded lessons first show the validated starting principal, price and range. The outside-sample exercise also introduces its two specific observations without reconstructing the unknown interval. At checkpoint 7, learners know the position earned fees. They decide what else they need to compare it with holding the original tokens. Revealing restores the question checkpoint and brings the recorded price chart forward, before the detailed metrics. The holding comparison additionally pairs checkpoint 7 (block 26083750, fees with a negative holding gap) with the final checkpoint (block 26090000, a small positive gap). Both use the original starting tokens and exclude costs. This named teaching contrast neither changes the record nor claims typical returns. The first check shows the price return and separates the smaller principal shortfall from the increase in period fee value. It asks why the same USDC principal at two above-range checkpoints compares better with holding at the lower ETH price. This endpoint comparison does not claim the position stayed outside throughout the interval. The second shows the final token mix and asks how a further ETH rise above the range affects the LP’s lead. Holding contains more ETH; the LP’s smaller WETH fee balance also gains value, while its USDC principal stays unchanged. The first check interprets the historical record; the second is a labelled thought experiment beside its recorded starting evidence. The $1-cost comparison remains a separate hypothetical worked illustration.

- **Actions:** one named action per activation, a short visual cue, then a readable resting frame. Back revisits an earlier state without animating an undo. Replay repeats the current cue without changing balances. Direct step access groups the ETH/USDC unwind actions into withdrawal/sale/repayment passes. There is no autoplay or animation queue.
- **Continuous conditions:** the token lesson changes the selected price while keeping both token quantities and their starting markers together. Each bar states its signed change from the same start. The price slider is an endpoint comparison, not a recorded trading path.
- **Comparison:** narrow and wider bands share one price scale and marker position. Bounds are directly selectable; exact boundaries are labelled separately from inside/outside states. Boundary labels connect to their band edges, with distinct price-axis endpoints. Labels are staggered above and below the track to fit narrow ranges on phones. The same guide is used for single-range and recorded starting-position diagrams. Single-token principal remains visible outside the range. Inside means eligible to earn from swaps, not a claim about earnings.

The swap scene tracks both reserves and the changed pool price, with average execution immediately beside the trade outcome. Its three comparison rows show the starting price, a 1 ETH trade’s average, and the selected trade’s average on the same scale. Both trades start from the same original pool and include a 0.3% fee. The deposit scene adds both tokens proportionally, shows the unchanged price and share of the enlarged pool, then shows a different trader selling ETH into it. The hatched fraction stays constant through that swap while the claim becomes more ETH and less USDC. Claims use proportional ownership before withdrawal rounding; this is a hypothetical lesson, not on-chain LP-token accounting or a fee forecast.

The lending supply scene shows ETH leaving the wallet for a claim on the pool, then interest accruing to that supply with collateral off. Enabling the already-accrued supply changes borrowing capacity without moving tokens or creating debt. The separate borrowing scene adds equal wallet cash and debt; the remaining capacity falls and assets minus debt stay unchanged before costs. The source of borrowed tokens is the lending pool. Supplied balances represent a claim, explained further with [Aave's receipt-token accounting](https://aave.com/docs/aave-v3/smart-contracts/tokenization); they are not additional spendable ETH in the wallet.

Exploratory amounts, prices and collateral stages never edit the question, its saved answers or its Experiment link. **Lesson setup**, **Question** shortcuts or **Show the outcome again** return to the prediction’s example. Opening its explanation preserves exploration; headings and prediction feedback name the original amount, price or action. Duplicate question sliders are removed. Variations provide fresh questions, while the distinct range-width choice can change the range and invalidate answers to that changed setup. Earlier custom saved inputs remain supported. Revising a prediction alone preserves later answers and feedback. Reload restores compatible answers and completion, even when no prediction was made. Materially revised questions clear their incompatible saved answers while preserving completed lesson IDs. The build and unwind scenes start with the opening balances. After reveal, Build returns to the completed round and Unwind to the first repayment. The revealed loop-stress scene restores the original price question; revealed liquidity foundations reopen just after the question’s swap or deposit, and price examples reopen at the question price. Revealed supply/borrow lessons reopen at the one-year collateral-off balance or the new loan, respectively. The conditions lesson reopens at one year with ETH’s price unchanged; the response lesson restores the $1,000 comparison. Their Experiment links keep these fixed cases even after enabling collateral or revisiting an earlier stage. The swap/deposit links still open the independent virtual sandbox; exact setup transfer applies to the price/range and lending handoffs.

The unwind application compares the same final-pass ETH sale with and without swap loss. Its evidence and feedback use that pass; the earlier first-pass repayment remains available in the main observation’s named steps.

Wallet assets, collateral and debt remain distinct. Borrowing highlights cash and matching debt; the debt card is never the source of tokens. Unwind health factor and the remaining collateral constraint stay visible. Detailed deltas and costs are optional. Reduced motion keeps the same completed frames, labels and arrows. Price controls are native keyboard/touch sliders; step controls are native buttons with named destinations and concise announcements.

The loan conditions scene isolates one variable at a time. Time runs from day zero to one year at $2,000 per ETH, with zero supply interest and 10% simple borrow interest. The price comparison holds the resulting 5 ETH and 5,500 USDC debt fixed. Both bars use a single unchanged dollar scale: collateral value weighted by the assumed 80% liquidation threshold, versus debt value. Their ratio is the health factor, following [Aave's definition](https://aave.com/help/borrowing/liquidations). Equal bars mean 1; the $1,375 boundary is exact. Labels preserve below/above distinctions when a nearby value would round to 1.00. The original token quantity and added interest remain visible, and wallet cash does not pay the interest automatically. The dashed reference is day zero in Time mode and the unchanged-price one-year result in ETH price mode. Moving below the boundary and back does not establish that a real loan survived such a path.

The response lesson compares two alternatives from the same 5 ETH / 5,000 USDC loan at $1,500 per ETH. A single extra-budget slider funds each alternative independently. Repayment reduces debt without changing the supplied ETH; buying and supplying ETH increases collateral without changing debt. Shared dollar scales and original-balance markers connect these changes to health factor. Full repayment shows **No debt**, keeps the ETH supplied and retains unused cash if the budget exceeds the debt. Cash already borrowed stays separate. Immediate net assets increase only by the outside budget; neither response creates profit. Execution, costs, liquidation timing and future returns are not simulated.

The loop-stress lesson compares holding the original 5 ETH with a three-round loop: 9.375 ETH and 8,750 USDC debt. Both start with $10,000 after debt, without additional capital or retained borrowed cash. Price changes keep tokens fixed; gain/loss bars extend from the same zero on a fixed dollar scale. The $1,500 question gives $7,500 for holding and $5,312.50 for the loop, whose health factor remains above 1. This separates price loss from liquidation eligibility. The separate Time example uses the original $2,000 price, 0% supply APR and 10% borrow APR with continuous compounding for up to one year; it explicitly shows zero supply interest and growing debt. Those are teaching assumptions, not live rates. Mode changes start fresh examples and never edit the assessed case or accumulate history.

Loss versus profit, Fees & break-even and the Final challenge share one two-bar figure: holding and your claim on a fixed dollar scale, each with its tokens underneath and a dashed line at the starting value. They are described under the pool-first lessons below. Fees are a striped segment on the claim’s bar; they never change the claim’s tokens or holding. **Match holding** sets the exact break-even fees at the chosen price, not a forecast or a rounded input. Variation changes invalidate answers to the changed case, while revised predictions preserve them.

The final challenge is a construction task on that figure. Learners choose a price and a fee income so that the claim matches holding and both are below the start. A broad range of lower prices works, and **Match holding for me** and **Show an example** are available. The task checks the resulting state and a conceptual explanation; it does not require a particular click sequence or infer understanding from motion. Task inputs and the checked state survive reload. Editing them clears current feedback and sharing eligibility until checked again, while earlier lesson completion remains. One worked example, ETH at the question price with the question’s fees, stays available as an optional disclosure with its own **ETH price** and **Fees** controls. The result card uses that example’s numbers. The link to the full-range lab opens the reader’s own example instead. Financial models and recorded evidence remain unchanged.

## Extending the patterns

Choose a form that explains the mechanism: named actions, continuous conditions, comparisons or recorded timelines. Dedicated scenes already cover the subjects listed above. Range composition now has its own price-band and token-mix scene; the width scene also shows each range’s gap to its own holding basket. Management, fee-tier and historical lessons use metrics, supplied comparisons or recorded timelines; further treatment should address an observed interpretation problem.

| Subject | Candidate treatment |
| --- | --- |
| Exits and returns | Extend the existing composition scene to outside price exposure; keep changing bounds distinct from recovering losses. |
| Fee tiers and APR | Extend the supplied-facts reveal if needed; never derive earnings from the tier alone. |
| Recorded history | Separate principal, new fees and collections at recorded checkpoints. Keep unknown intervals unknown; active-time totals do not locate every crossing. |

Each visual should replace repeated setup/result prose, retain essential assumptions nearby, and offer a changed-situation check. Preserve the same starting basket within each comparison. Equal budgets across ranges do not imply identical token mixes. These are design candidates, not a commitment to animate every lesson or a second feature roadmap.

## Teaching emphasis

A prediction makes an expectation explicit. It is visible, ungraded and deliberately skippable: its heading asks **What do you expect?**, and until a choice is made its button reads **Not sure — show me**. In the liquidity essentials, a prediction that differs from the outcome is answered with what it would need to be true, in one sentence: “More ETH” would be true if ETH had fallen. The note names a condition under which that answer holds. It does not claim to know why the reader chose it, and the verdict beside it already says what holds here. Removing arithmetic and long introductory text supports this step; it does not require hiding it. Explanations and changed-situation checks remain the completion criteria, and direct Experiment access serves people who already have a question. Evaluate reviews against that sequence, including people who choose to see the outcome first.

## Liquidity lessons 1 to 7: pool first

[Lesson 1](https://teren.sh/learn.html#lesson=swap-impact) is the reference for how a lesson moves from seeing to doing. Links from its pilot (`&layout=play`) still open it.

1. **See one swap.** The pool comes first, and its labels carry the setup. The question sits under it. Answering or skipping reveals the swap with the pool on screen, and the verdict appears right under it. The question gives what the trade is worth at the starting pool price and asks whether the pool will pay less, the same, or more. The verdict answers, then gives what the pool pays and the average price. It does not call the difference a loss, because that difference is already in the quote.
2. **Try another size.** The answered question folds to one line with a Change button, the steps reduce to one Replay button, and the slider follows with a prompt to sell more. The comparison under it holds one explanation and the pitfall.
3. **Reason about a deeper pool.** The question after the figure puts the same swap into a pool holding ten times as much. Every answer's feedback shows both quotes. The three variations all sell 10% of the pool, so this question is where depth is tested. Price impact against slippage tolerance is no longer asked here: it belongs beside the sandbox's own slippage control.

The lesson uses one name for each of three different numbers: starting pool price, average price you receive, and pool price after the swap.

[Lesson 2](https://teren.sh/learn.html#lesson=pool-share) follows the same sequence with a deposit.

1. **See one deposit.** The question offers two numbers from the pool on screen: the deposit as a share of the pool it enlarges, or of the pool as it stands. The verdict answers in those numbers.
2. **Watch a later trade.** The trade is a separate step beside the pool, because it is the lesson's second idea. Its result compares the share and the claim before and after in three fixed lines.
3. **Try another size.** The slider changes the deposit. Two bars compare it with the pool before and after, which is the difference the question asked about. The panel holds one explanation and the pitfall.
4. **Apply it.** The scene showed a trade changing the tokens behind a fixed share. The question is the other case: another provider deposits, or in the second variation withdraws, so the share changes and the tokens the reader could withdraw stay the same. Every variation asks this one idea.

Lesson 2 uses two names: share, a percentage of the pool, and claim, the tokens that share is worth at the moment.

[Lesson 3](https://teren.sh/learn.html#lesson=token-balances) applies the sequence to a price move. Its subject is the claim from lesson 2.

1. **See one price move.** The claim comes first, as two bars with their starting amounts marked. The question names the move and its condition, that traders bring the pool’s price along with it, and asks whether the claim will hold less, more, or the same ETH. Without the condition, “the same ETH” would be a fair answer. The reveal plays the bars from the starting amounts, and the verdict answers the question before it shows the claim before and after.
2. **Drag the price.** The slider appears with the outcome and sits directly under the bars, because the bars are what it moves and a hand on the slider covers whatever is below it. The verdict follows the slider. Each bar shows its signed change, so no separate comparison is needed.
3. **Read why.** One panel names who changes the claim: traders, acting on the gap between the pool’s price and the market’s. It holds the pitfall too.
4. **Apply it.** The question describes a market price that has moved before anyone has traded with the pool, and asks whether the claim’s tokens have changed. The slider cannot show that state, because every price it shows assumes traders have already closed the gap. The right answer says only what is true of this case, that nothing has moved in or out: deposits and fees change a pool too.

[Lesson 4](https://teren.sh/learn.html#lesson=loss-vs-profit) puts a dollar value on that claim and compares it with two things.

1. **See one price move.** Two bars come first: holding and the claim, on one dollar scale, each with its tokens underneath. A dashed line marks the starting value on both. The question gives holding's value at the new price and asks whether the claim will be worth more, less, or the same. The verdict answers, then gives the claim against holding and against the start.
2. **Drag the price.** The slider sits under the bars and two fixed lines: the claim against its start, and against holding. The prompt asks for a price where the claim beats holding. Before fees there is none, and finding that out is the point.
3. **Name the gap.** One panel calls the gap to holding impermanent loss, shows it as a percentage at the chosen price and says it is a comparison, not a charge. It gives the cause for both directions, so it stays true wherever the slider is: traders buy ETH from the pool as it rises and sell ETH to it as it falls, and holding makes neither trade.
4. **Apply it.** The question gives two true readings of one claim, for example up 41.42% on what you started with and 5.72% behind holding, and asks whether both can be right. Each wrong answer folds the two comparisons into one. Which fold is false depends on the direction, so the variation where ETH falls has its own wording: there the claim is down, and holding fell too.

Lesson 4 uses three names: your start, holding, and your claim.

[Lesson 5](https://teren.sh/learn.html#lesson=fee-break-even) adds fees to the same two bars and holds the price still.

1. **See fees arrive.** The bars open at the moved price, with the claim behind holding. The question gives the gap before any fees and a fee amount, and asks which bar grows: only the claim, both, or neither because the fees go to whoever runs the pool. A claim includes every fee its pool has taken in, so the question has to say that its starting point has none yet, and no wrong answer may be a true statement about pools. The reveal plays the fees onto the claim as a striped segment, and the verdict says how far behind holding the claim still is.
2. **Drag the fees.** The slider sits under the bars and a third bar: the gap to holding, filling as fees cover it. On the dollar scale the fees are a sliver, so the gap gets a scale of its own. The thumb settles on the amount that matches holding when it comes close, and a shortcut sets it exactly.
3. **Name the amount.** One panel calls it the break-even fees, gives it in dollars and as a share of the start, and says the fees here are an amount the reader chooses. Recorded fee evidence stays one disclosure away in the same panel.
4. **Apply it.** The question names the amount that puts the claim ahead in this figure and asks what the reader would need before saying a real claim beat holding. The answer is a record of the fees it actually earned: the amount in the figure is one the reader chose. The amount named is each variation's own break-even fees, which every fee slider can reach.

[Lesson 7](https://teren.sh/learn.html#lesson=final-challenge) is the reverse of the others: the reader does the thing first.

1. **Take the challenge.** The same two bars come first, at the starting price with no fees. Under them are two goals, each one line with the amount that decides it: the claim matches holding, and both are below the start. A price slider and a fee slider follow. The goals tick in place and a solved message opens below the sliders, so nothing above a slider moves.
2. **Ask for a first step.** The lesson’s question follows the challenge and is optional. It asks which price move can leave holding worth less than the start, which has one true answer. Asking which move to “try first” had none. Its answer opens under the sliders and leaves the challenge as the reader left it.
3. **Read why.** Solving the challenge or showing that answer opens one panel: matching holding and making money are two different results. It holds the pitfall too. Solving does not move focus or the page.
4. **Apply it.** The question asks what the fees covered in the reader’s own example, with two answers. Completion needs a solved challenge and that answer.

[Lesson 6](https://teren.sh/learn.html#lesson=range-boundaries) gives the claim a price range.

1. **See the price leave the range.** The figure has a price track with the range as a band and the price as a marker, and under it the claim’s ETH and USDC as two bars. Each bar is full where the claim holds only that token: ETH at the lower end, USDC at the upper end. The question names the move against the range, for example “ETH rises from $2,000.00 to $2,400.00, above your range”, and asks what the claim holds then. The reveal moves the marker across the track. The bars change only while the marker is inside the band, so they stop where it leaves. The three variations end above, below and inside the range.
2. **Drag the price.** The slider sits under the figure and shares its span of prices. That span is closer than in lesson 3, so the range takes about a third of the track. Two shortcuts jump to the lower and upper end. One line under the track says where the price is: inside, above, below, or at an end.
3. **Read what a range does.** One panel has a line for the price on the slider and the explanation: inside the range the claim trades as in a pool that covers every price, only faster, and outside it nothing trades. It holds the pitfall that leaving a range is not liquidation.
4. **Apply it.** The question gives two paths to the same end, one move or weeks of moving up and down inside the range, and asks whether the claim earned the same fees. The end fixes the tokens and says nothing about the trades on the way. The slider shows end states only, so it cannot answer this. All three variations ask it with their own end amounts.

The lesson has no range width selector. A width saved by the earlier one still loads, with its own range and span of prices.

**One question after each figure.** Since 1.68.0 every liquidity lesson asks one prediction and one question, where it used to ask a prediction and two. The question kept is the one that makes the reader use the lesson’s idea on a case the figure does not show: a smaller share with the same tokens, a market move before anyone trades, a gain that trails holding, an end state that cannot tell you the fees. Three rules hold for all seven, and unit tests check them in every variation:

- Every wrong answer is false in the case asked. None is a true statement placed under the wrong verdict.
- The idea is the same in all three variations. Only the numbers and the direction change, and the wording follows the direction.
- No answer is given away by its length, and each question has a hint and its own feedback for every answer.

The case sits in one sentence above the question, with no label of its own. The answer's feedback says whether it is right, and the box under it says where the lesson stands: “Lesson 4 done.” A lesson is complete after one right answer, plus the solved task in lesson 7. Lessons completed earlier stay complete. Saved answers to replaced questions are cleared, and the challenge keeps its answer and the reader's own example because its question did not change.

**Look closer.** After the figure, each lesson gives one question to take into a lab, with a link that names the lab it opens. The test for each is whether the lab behind the link can answer it: after clicking, what can the reader change or inspect? Lesson 3’s link opens the full-range lab, which assumes traders have already moved the pool, so it asks what returns when the price moves away and back. It does not ask whether anyone has traded yet. Lesson 7’s link opens the reader’s own example and asks whether it still matches holding once costs are counted, because that lab has cost fields the lesson leaves out. Every reader gets the same link, whatever they predicted. Lessons 5 and 6 end on needing a record of fees, so once answered they also link to the recorded case “Fees over time”.

The three headings a reader meets are **What do you expect?**, **Look closer** and **What does this tell you?**

The browser checks print a report of how much each lesson shows on a 390px phone with its outcome open: words, headings and labels, and screens. The guideline is 350 words, 10 labels and 3 screens. It is a guideline and not a limit, and a condition an answer depends on is never cut to meet it.

Lessons 3 to 7 use one set of names: your claim, holding, your start, impermanent loss for the gap to holding before fees, and break-even fees for the fees that close it. Lesson 6 adds your range and its lower and upper end. Lesson 7’s optional worked example uses the same names.

Anything above a slider keeps its height while the slider moves, so the slider stays under a dragging thumb. Lines whose numbers follow the slider use a label and a value in fixed columns or stay on one line, and sentences above a slider do not contain those numbers.

## Observation plan

Automated tests establish calculation and interaction consistency in their covered cases. Research and public questions inform which misconceptions to address. The owner's informal feedback from experienced friends is encouraging, but no documented observation sessions yet establish improved understanding or repeat use. [The current review](review.md#evidence-and-what-it-establishes) summarizes those distinct evidence types.

Use this task bank when participants are available. Choose two or three tasks suited to a person's experience and purpose; it is not an exam or a release gate. Record their starting explanation, let them explore, then ask about an unfamiliar variation. Supply any needed totals and avoid calculation or rounding tasks. Capture their words and navigation difficulties before offering hints, and record any help given. A correct choice alone is weaker evidence than an explanation applied to a changed situation.

| Task | Prompt and distinction to observe |
| --- | --- |
| Swaps and pool ownership | Reverse a trade or add another provider. Ask what enters/leaves and what happens to the original LP's share. Distinguish a trade changing reserves from a deposit changing ownership percentage. |
| Collateral, wallet and debt | Pause after enabling collateral, borrowing, purchasing, selling and repaying. Ask what is owned, where it is and what is owed. Capacity, spendable cash, supplied claims and obligations must remain distinct. After full repayment, ask where the collateral remains. |
| Price, interest and responses | Hold price still while time passes, then hold accrued token balances still while price changes. Ask what changed. Compare repayment and collateral addition with the same extra budget; ask where that budget went and what remains exposed to ETH. |
| Fees and benchmarks | Show an LP dollar gain that trails holding, then a falling-price case that matches holding. Ask what each comparison establishes. Change a target window from 7 to 30 days and ask what additional evidence would be needed to expect the fees. |
| Fee competition and width | Add a batch, leave the range and tighten competitors' range at unchanged capital. Ask what happens to existing tokens and the next-batch preview. Ask whether higher fee income settles the holding comparison. If using JIT, ask what fee dilution alone establishes about total LP profit. |
| Recorded observations | Open the inactive week and an interval whose sampled endpoints are outside. Ask what the fees, counters and sampled prices establish separately. Ask what the matched pair can show when its ranges and starting baskets differ. |
| Correlated-asset loops | Change only ETH/USD, then a market discount under each oracle assumption. Ask what happens to WETH debt, net value and health factor. Compare with unlooped wstETH, then pause during the flash-funded exit and identify every obligation. Ask what changes when the exit is unavailable. |

For an experienced user's direct workflow, start from a question they already care about. Observe them finding the tool without lessons, editing assumptions, saving a variation and sharing or reopening it. Ask which missing evidence would change their interpretation. A later return visit can establish whether the saved setup is useful again; one guided session cannot establish repeated use.

Keep observation notes with the session's date, app version, device/browser, experience level, chosen task, initial and changed-situation explanations, assistance given and unresolved problems. Add findings to the current review when they change the evidence status, rather than copying every task into release notes. Real-device and assistive-technology checks have their own access goals; they should not be reported as learning measurements.
