# Release history

## 1.70.1 · 2026-11-27

- **Lesson 7** now says which goal failed and which control changes it. With ETH at $1,980 and $500 in fees, holding is $25 below your start but your claim is $474.94 above it. The goal line showed “−$25.00” and the check told you to find another price. It now shows “+$474.94”, the amount that decides the goal, and says: “Holding is already $25.00 below your start. Your fees put your claim $474.94 above it. Lower the fees until your claim meets holding.”
- **Lesson 6**’s feedback on the right answer no longer says that weeks of trading pay more than one move. Time alone does not settle that. It now says what the end can and cannot show: the tokens you end with show what your claim holds; to know what it earned, you need a record of its fees.
- **Keyboard.** After **Change**, arrow keys move through the answers to a prediction without folding them away, and the verdict follows. Enter, Space or moving to another control folds them. A click folds them at once, as before, now also on the answer already chosen.

## 1.70.0 · 2026-11-27

A second outside read of the lessons found three defects and two sentences that said more than the lessons can show.

- **Lesson 7.** The feedback on the wrong answer always said “Holding itself is below your start in your example”, even when your own example had holding above it. It now describes your example as it stands: solved, not yet matching, or at a price where holding has lost nothing. The hint asks where the two bars sit against the dashed starting line.
- **Lesson 4, when ETH falls.** The lab instruction asked for a gain on your start that still trails holding. After a fall no fee amount can give one. That variation now asks for the mirror image: “Keep ETH at $750.00. Can fees put your claim ahead of holding while you’re still down on your start?”
- **Lesson 6.** The link to the range lab opened with an edge of 1650.0000000000002 or 3300.0000000000005. It now opens at 1650 and 3300.
- **Lesson 6** no longer says “traders are still swapping against your claim” when the price is inside your range. In range means swaps at that price can use your claim. It does not say any are happening. Past the end of your range it now says “your claim does not trade”, where it said “nothing trades”.
- **Lesson 3** no longer says “nobody has a reason to trade” when the price has not moved. The pool’s price already matches the market’s, so no trade is needed to bring them together.
- Lesson 6’s question now asks what the end can tell you: “Does ending with the same tokens tell you it earned the same fees?” The answer is that the end does not record the trades on the way.
- Lesson 5’s feedback stays with your claim: “The figure is ahead because of the fee amount you entered. It cannot show what a real claim earned.”
- In lessons 5 and 6 the link to the recorded case **Fees over time** now follows the feedback on any answer, not only the right one.
- Lesson 1’s note for “More than” says what would have to be true of the average price, fee included.
- Three cuts: the box that said “Read the feedback under your answer, then try again” after a wrong answer in lessons 1 to 6, lesson 7’s “Think back to the price and fees you chose”, and a sentence in lesson 1 that repeated the line above it.
- New tests check what the earlier ones missed: every lab instruction can be carried out in every variation, no link carries stray decimals, and lesson 7’s feedback is right for every state of your example.

## 1.69.1 · 2026-11-27

- The new line beside the sandbox’s slippage control now looks like the “Try this” note the sandbox already had, with the same mark and wording.

## 1.69.0 · 2026-11-27

- A prediction that differs from the outcome is now answered with what it would need to be true, in one sentence: “More ETH” would be true if ETH had fallen. It replaces “You expected: More ETH.” It names a condition and does not guess why you chose it.
- Three labels in the liquidity lessons use the site’s own words: **What do you expect?** above a prediction, **What does this tell you?** above the question, and **Look closer** above the link to a lab. The first of these now reads the same in every chapter.
- Under **Look closer**, each lesson gives one question to take into a lab, and the link names the lab it opens. Each question is one that lab can answer. Two changed for that reason: lesson 3 now asks what returns when the price moves away and back, and lesson 5 asks whether a match with holding survives a further price move.
- Lesson 7’s lab link opens your own example, with the price and fees on its sliders, and asks whether it still matches holding once costs are counted. The result card keeps the worked example.
- Lessons 5 and 6 end on “you need a record”. Once answered, they link to the recorded case **Fees over time**.
- The swap sandbox has a line beside its slippage control: keep the amount you pay fixed, change the tolerance, and see which number moves. This is where lesson 1’s cut question about slippage now lives.
- Lesson 1’s verdict is shorter, so it fits on a phone screen with the pool: “Less. The pool pays 18,132.22 USDC, not 20,000: an average price of $1,813.22 per ETH.”
- The browser checks now report how much each lesson shows on a phone. With the outcome open, a lesson has 340 to 460 words and runs to about three and a half screens, down from 410 to 510 words and about four screens.

## 1.68.0 · 2026-11-27

- Every liquidity lesson now asks one question after its figure, where it asked two. The question kept is the one that takes the lesson’s idea to a case the figure does not show.
- Lesson 1’s prediction is in the pool’s own numbers: “You sell 10 ETH. At the starting pool price that is worth 20,000 USDC. Will the pool pay you less, the same, or more?” The question about a wallet’s slippage tolerance has left the lesson.
- Lesson 2 asks what happens to the tokens you could withdraw when another provider joins or leaves the pool. All three variations ask it.
- Lesson 3’s prediction now says that traders bring the pool’s price along with the market. Without that, “the same ETH” was a fair answer. Its question asks whether your claim’s tokens have changed before anyone has traded.
- Lesson 4 has a new question: your dashboard says you are up 41.42% on what you started with, and another view says you are 5.72% behind holding. Can both be right? Where ETH falls, it is worded for a claim that is down. The panel now says why the gap opens.
- Lesson 5 asks what you would need before saying a real claim beat holding. The fees in its figure are an amount you choose.
- Lesson 6 asks whether two paths to the same end earn the same fees, in all three variations.
- Lesson 7’s first step asks which price move can leave holding worth less than your start. Asking which move to “try first” had no wrong answer. Its question now has two answers.
- Every wrong answer is false in the case asked. No answer is given away by its length, and every question has a hint and feedback for each answer.
- A lesson is complete after one right answer, plus the solved task in lesson 7. The box under your answer says where the lesson stands: “Lesson 4 done.”
- Saved answers to replaced questions are cleared. Completed lessons stay completed, and the challenge keeps its answer and your own example.

## 1.67.0 · 2026-11-27

- Liquidity lesson 6 now follows the layout of the other six lessons: the figure first, the question under it, and the outcome played in place.
- The figure shows your range on a price track, with your claim’s ETH and USDC as two bars under it. Each bar is full where the claim holds only that token.
- The question names the move against the range: “ETH rises from $2,000.00 to $2,400.00, above your range. What does your claim hold then?” The three variations end above, below and inside the range.
- Showing the outcome moves the price across the range. The bars change only while the price is inside it and stop where it leaves.
- The price slider appears with the outcome, under the figure. It covers a closer span of prices, so the range takes about a third of the track, and two shortcuts jump to either end of the range.
- One panel says what happens inside and outside the range and holds the pitfall that leaving a range is not liquidation.
- In two of the variations the second check question is new: someone else has a narrower range, and ETH sits between the two ranges’ ends. The earlier “just inside the edge” question could be read off the figure. Saved answers to it are cleared; completed lessons stay completed.
- The range width selector is gone from the lesson. A width saved earlier still loads. The lesson uses the names of lessons 3 to 5: your claim, your range, and its lower and upper end.
- All seven liquidity lessons now share one layout.

## 1.66.1 · 2026-11-27

- Lesson 5’s question now says its starting point is your claim before any fees. A claim includes every fee its pool has taken in, so without that the question could not be answered with confidence.
- The answer “Neither. Fees are already in my claim’s value.” is gone: it marked a true statement wrong. In its place is a belief that is false, that the fees go to whoever runs the pool.
- The verdict now says why only your claim grows: traders pay fees into the pool, so your share of them is part of your claim.
- A saved answer to the earlier wording is cleared; completed lessons stay completed.

## 1.66.0 · 2026-11-27

- Liquidity lessons 5 and 7 now follow the layout of lessons 1 to 4, on the two bars from lesson 4: holding and your claim, with a dashed line at what you started with.
- Lesson 5 holds ETH at the moved price and asks a new question: your claim is behind holding, then it earns fees. Which bar grows? Showing the outcome plays the fees onto your claim. A third bar shows the gap to holding and how much of it the fees have covered, because on the dollar scale the fees themselves are a sliver. A saved answer to the earlier question is cleared; completed lessons stay completed.
- The fee slider appears with the outcome, directly under the bars. It settles on the amount that matches holding when the thumb comes close, and **Match holding** sets it exactly. One panel names that amount as the break-even fees and says they are not a forecast.
- Lesson 7 opens with the challenge itself: pick a price and a fee income so that your claim matches holding and both are worth less than you started with. Two goals sit under the bars, each with the amount that decides it, and tick as you reach them.
- The lesson’s question now follows the challenge as an optional first step. Solving the challenge, or showing the answer to that question, opens one panel on why matching holding and making money are two different results. The check questions follow it.
- In both lessons the line under your claim’s bar says when its value includes fees.
- Lesson 7’s worked example is still there as an optional extra under **Go further**, in the lesson’s own names. The setup box and the explanation button are gone from both lessons.
- Lessons 3 to 7 now use one set of names: your claim, holding, your start, impermanent loss for the gap to holding before fees, and break-even fees for the fees that close it. Lesson 6 keeps its earlier layout.

## 1.65.0 · 2026-11-26

- Liquidity lesson 4 now follows the layout of lessons 1 to 3. Two bars come first: holding, the same tokens left in your wallet, and your claim in the pool. Each shows its dollar value and the tokens behind it. The question sits under them, and showing the outcome plays the price move on the bars.
- The question is new. It gives what holding would be worth after the price move and asks whether your claim will be worth more, less, or the same. The earlier question asked only whether the position gained dollars. A saved answer to it is cleared; completed lessons stay completed.
- Two lines under the bars keep both comparisons in view: your claim against your start, and against holding. The price slider appears with the outcome, right under the bars, with a prompt to look for a price where your claim beats holding.
- One panel names the gap to holding as impermanent loss and shows it as a percentage at the price you picked. Why the gap exists is left to the first check question, with the tokens under each bar as evidence.
- The setup box, the separate starting-capital bar and the explanation button are gone. A dashed line on both bars marks what you started with.
- The lesson says “your claim” and “holding” throughout. Lessons 5 and 7 keep their fee comparison unchanged.

## 1.64.0 · 2026-11-26

- Liquidity lesson 3 now follows the layout of lessons 1 and 2. Your claim, the tokens behind your share, comes first with the question under it. Showing the outcome plays the price move on the bars you are looking at.
- The price slider appears with the outcome, right under the bars it moves. Each bar shows how much it gained or lost since the start. The setup box and the separate explanation button are gone.
- The question names the move, such as “ETH rises from $2,000.00 to $4,000.00”. The verdict answers it first, then shows your claim before and after.
- One panel under the verdict explains who changes your claim: traders, buying from the pool when it is cheaper than the market and selling to it when it pays more. The caution about yield sits in the same panel.
- The first check question is new. The market price has moved, but nobody has traded with the pool yet: what does your claim hold? Each answer’s feedback uses your claim’s own amounts. A saved answer to the earlier question is cleared; completed lessons stay completed.
- The lesson says “your claim” where it used to say “the LP” or “the position”, matching lesson 2.

## 1.63.0 · 2026-11-26

- Liquidity lesson 2 now follows lesson 1’s layout. The pool comes first with the question under it, and showing the outcome plays your deposit where you are looking. The pool lists your share and your claim, the tokens that share is worth.
- The question is asked in the pool’s own numbers: 4.76% of the pool your deposit enlarges, or 5% of the pool as it stands. The verdict answers in the same numbers.
- The later trade is its own step beside the pool. **Show the trade** plays it, and three lines compare your share and your claim before and after.
- A deposit-size slider follows, with two bars: your deposit against the pool before it, and against the pool after it. One explanation and the caution about getting your deposit back sit with those bars. The separate explanation button and its repeated paragraph are gone.
- The second check question no longer repeats what the lesson just showed. Its three variations ask about another provider depositing, another provider withdrawing, and a trader buying ETH. Saved answers to the earlier prediction and that question are cleared; completed lessons stay completed.
- The lesson uses two fixed names: your share, a percentage of the pool, and your claim, the tokens behind it.
- In both lessons, the lines under the pool keep their place while you drag the slider.

## 1.62.0 · 2026-11-26

- Liquidity lesson 1 now opens with the pool and puts the question under it. Showing the outcome plays the swap where you are looking, with the verdict right under the pool. Links to the pilot layout still work.
- After the swap, the answered question folds to one line, the step controls become a single **Replay the swap** button, and the trade-size slider follows with a prompt to sell more. One explanation and the “small test swap” caution sit with the comparison. The separate explanation button and its repeated paragraph are gone.
- The verdict states what the trade is worth at the starting pool price and what the pool quotes for it.
- The first check question now asks which of two pools pays more for the same swap, one holding ten times as much. Each answer’s feedback shows both quotes. A saved answer to the earlier question is cleared; completed lessons stay completed.
- The lesson uses three fixed names: starting pool price, average price you receive, and pool price after the swap. Its title is now “Trade size and the price you receive”.

## 1.61.0 · 2026-11-26

- A pilot of liquidity lesson 1 with the pool first opens at `learn.html#lesson=swap-impact&layout=play`. The question sits under the pool and the swap plays where you are looking. The setup box and assumption lines are replaced by one “About this example” note. The usual link, Home and every other lesson are unchanged.

## 1.60.0 · 2026-11-26

- Yield lessons 3 and 4 now have a slider under the drawing. In **When does the interest arrive?** you drag the day the rate rises and watch the interest the YT buyer collects against the 20 USDC they paid. In **Selling before maturity** you drag the implied APY of the day-45 offer and watch the PT offer fall while the YT offer rises. The two named cases stay as buttons, and exploring never changes your answers.
- On narrow phones, the bar labels in those lessons sit on their own line, so the slider no longer moves while you drag.

## 1.59.0 · 2026-11-26

- In the first two liquidity lessons you can now watch the swap or deposit happen. After **See what happens**, the page lands on the outcome and the pool’s balances then move from the starting pool to the result. **Replay action** plays the same change again and brings the bars into view if you have scrolled away. Reduced-motion settings still show the result at once.
- The pool bars stay in place when the average execution line appears, so they no longer jump while they change. Before the swap, that line says the average appears after the swap.
- The range lab’s percentage presets now set prices a person would type, such as 3,300 instead of 3300.0000000000005. Prices picked on the chart or with the slider are rounded to the nearest dollar on a typical scale.

## 1.58.0 · 2026-11-26

- Home shows how many lessons you have finished in each topic once you complete your first one. Each topic’s lesson button continues with your next unfinished lesson, and the link above the topics opens the next lesson after one you have finished.
- Bars in the lessons and labs now ease to their new value after a button, preset or keyboard step. They still follow a dragged slider directly, and reduced-motion settings turn the easing off.
- The liquidity final challenge has a fee slider beside its price slider, two goals that tick as you meet them, and a solved state that appears as soon as both are met. **Match holding for me** remains available as a hint.
- Lesson lists say “done” in place of “checked”.

## 1.57.3 · 2026-11-23

- Show more APY decimals in the early-sale comparison when rounding would hide the higher or lower rate behind a change in YT sale proceeds.
- Clarify that in the day-45 lesson, the seller keeps the interest earned before the sale even if they claim it later.

## 1.57.2 · 2026-11-18

- Opening or editing a Lending essentials or ETH-loop lesson example now preserves the personal setup that Home resumes. You can still save the example as a named experiment.
- Copied links from all three Lending labs share the scenario inputs and omit unrelated URL parameters, including referral tags. This also applies when the browser displays a link for manual copying.

## 1.57.1 · 2026-11-17

- Fix the single-loan lab showing a liquidation at the exact boundary under simple interest. Both interest modes now show a health factor of 1 at the calculated boundary price. A lower price makes the loan eligible.

## 1.57.0 · 2026-11-17

- Extend the wstETH discount lesson with an optional partial liquidation. Follow the WETH repaid and wstETH taken, then compare what the borrower keeps with a 3% bonus and with zero bonus.
- Open either example in the loop lab with its liquidation details expanded and its assumptions ready to edit.

## 1.56.0 · 2026-11-17

- Add an optional wstETH/WETH lesson. Follow what happens to a loop’s sale value, debt and health factor when wstETH trades at a discount, then change the price the lender uses.
- Open the lesson from the correlated-loop lab and explore the same position and pricing assumptions in Experiment.

## 1.55.2 · 2026-11-17

- Start the liquidity final challenge by building a position that matches holding while both lose dollar value. Explore how additional fees change the amount still needed to match holding.
- Use checkpoint 7 to examine what fee earnings tell a liquidity provider. Give the fee-tier lesson a pool choice and name the next range scenario before opening it.
- Follow who pays lending interest, when buying ETH increases a loop’s price exposure and when repayment reduces its debt.
- Show the day-45 yield sale from the YT holder’s perspective, with separate amounts for the sale and interest already earned.

## 1.55.1 · 2026-11-17

- Return from lending lessons to the last lending experiment, including wstETH/WETH loops.
- Clarify which day-45 YT offer opens in Experiment and which rate the lab uses for comparison. Label the historical sDAI case’s link to the hypothetical yield lab.
- Open the first two recorded liquidity lessons with the position and the observed facts. Reveal what the fee and time-in-range records establish after the prediction.

## 1.55.0 · 2026-11-17

- Add a Yield trading Inspect case for the March 2024 Ethereum sDAI market. Follow what 1,000 DAI could buy, compare PT, YT and holding at a smaller trade size, and see what happened when Maker raised the savings rate.
- Publish the block-pinned entry simulations, real redemption receipts and reproduction tools with the case.

## 1.54.0 · 2026-11-17

- Compare PT’s fixed APY with the annualized yield of the chosen deposit scenario. See how much the deposit must earn for YT to recover its cost or match holding, in both USDC and annual rates.
- Restore shared yield setups and saved drafts in browsers without `URLSearchParams.size`. Align PT and YT prices when the card headings wrap.
- Clarify what selling future interest achieves, how holding through maturity affects the timing example, and how redeeming a matching PT and YT connects their prices.

## 1.53.1 · 2026-11-16

- Refine the four yield lessons’ questions and feedback. Compare how long a rate lasts, who bears a YT shortfall, and what an early-sale quote buys. Preserve completed lessons and answers to unchanged questions.

## 1.53.0 · 2026-11-16

- Add four step-by-step yield trading lessons. Follow the owner of one deposit, compare the principal and yield buyers, change when interest is earned, then price a sale before maturity.
- Open any yield lesson directly, return to it from Home, or explore its assumptions in Split the yield.

## 1.52.0 · 2026-11-16

- Extend **Split the yield** with an early-sale comparison. Choose a sale day and market implied APY to see how the same remaining term prices PT and YT.
- Compare both sellers with holding the underlying on the same day. Show the YT seller’s sale proceeds and previously earned interest separately.

## 1.51.0 · 2026-11-16

- Add **Split the yield**, a hypothetical Pendle-style market. Follow the principal and yield buyers of one USDC-denominated deposit, move a rate change through the term and inspect the interest earned by each milestone.
- Compare PT, YT and holding with equal starting budgets. Show the separate yields needed to recover the YT purchase cost and to match holding, including cases where matching is impossible. Add direct topic navigation, local draft recovery and shareable inputs.

## 1.50.8 · 2026-10-28

- Synchronize the guide, review and roadmap with current lesson interactions, model versions and exports. Clarify About, Methods and in-app notes on hypothetical fee allocation, snapshot claims, correlated loops and APY. This documentation pass changes no calculations, lesson checks, saved formats or recorded evidence.

- Keep lab and lesson controls and results unavailable until their page has initialized, and remove pre-rendered health verdicts. Missing scripts or startup errors now show a reload message instead of editable-looking defaults and stale risk verdicts. A static explanation remains if the startup guard itself cannot load; Home keeps its ordinary links available.
- Preserve shared routes and saved work on reload. Extend content hashing and preloads to literal dynamic imports, and add desktop/mobile checks for missing entries and dependencies, interrupted initialization, delayed loading, recovery and JavaScript-disabled access.

## 1.50.7 · 2026-10-27

- Show one field error for invalid width-comparison inputs and replace stale setup summaries until the relevant inputs are valid. Preserve the last valid comparison and restore results after correction.
- Clear lending and ETH/USDC-loop preset selections when their price or round inputs are invalid, and restore matching selections after correction. Add desktop and mobile checks for both validation fixes.

## 1.50.6 · 2026-10-27

- Remove the ten optional number-entry exercises that asked learners to copy or round displayed results. Keep conceptual checks, worked examples, formulas, original sources and recorded accounting details in place.
- Preserve completed lessons, existing setups and compatible answers. Retire unused numeric grading and extend checks for read-only deeper explanations and restoration of older saved progress.

## 1.50.5 · 2026-10-27

- Remove overlapping question sliders from the seven liquidity essentials lessons, retaining visual exploration, variations and the distinct range-width choice. Preserve existing custom lesson setups and saved completion.
- Name the original example in explanations, prediction feedback and Experiment handoffs. Opening an explanation preserves the explored visual; explicitly showing the outcome returns to the question. Scope labels no longer imply that changed-situation questions use the original price.
- Preserve later answers and feedback when revising a prediction or revisiting an explanation. Remove the first-pass unwind recap that no longer matched the last-pass sale-cost question; keep the full unwind walkthrough.
- Extend interaction checks to reverse explored outcomes, follow explanations and handoffs, and revisit checked work on desktop and phones. Add this whole-lesson consistency check to the review guidance.

## 1.50.4 · 2026-10-27

- Connect the range lab’s “Could fees cover this?” panel directly to Follow the fees, where changing competing liquidity shows its effect on fee share. Keep the recorded comparisons alongside this hypothetical experiment.

## 1.50.3 · 2026-10-27

- Group lending price shortcuts beneath the price slider, separate from elapsed time on desktop and phones. Clarify the live-data provider notices in both liquidity import panels.
- Use consistent negative dollar amounts across lab results, charts and tables, without displaying a negative zero.
- Show concise field errors in Follow the fees, remove stale next-batch figures while inputs are invalid, and preserve existing batches and the last valid saved comparison. Stack batch inputs on narrow phones and extend validation and layout checks.

## 1.50.2 · 2026-10-27

- Connect unwind feedback to the extra ETH sold in the walkthrough, distinguishing the hypothetical 4.07 USDC shortfall from the actual completed repayment. Label the assumed loss consistently as a swap loss.
- Keep the unwind question and answer choices beside their evidence; place the optional sale-and-repayment recap afterward. Refine the leverage hint to separate collateral backing from net value.
- Restore the recorded range's almost $1,300 width in the placement question. Keep the accessible picture, answer meanings and saved progress intact.

## 1.50.1 · 2026-10-27

- Refine lesson checks around ownership share, borrowing headroom and losses before liquidation. Preserve helpful explanations and replace repeated misconceptions with distinct ones.
- Let learners infer how competition changes fee income, with the calculated share in feedback. Present collection and reinvestment as ordered steps, stacked on phones.
- Ask which direction reaches a recorded range boundary first. Keep equivalent spatial evidence for screen readers and meaningful price labels; remove decorative axis prices and the rebound's sub-cent implementation note.
- Compare the same feasible ETH sale with and without an exit cost, showing why some debt remains. Keep the sale-to-repayment illustration as an optional recap. Core financial formulas and recorded evidence are unchanged.
- Preserve completed lessons and compatible drafts while retiring answers to revised questions. Extend accounting, progress and desktop/mobile checks.

## 1.50.0 · 2026-10-27

- Give loss-versus-profit checks different jobs: explain the token exchanges behind the holding gap, then interpret the comparison or a withdrawal. The explanation follows rising, falling and unchanged editable prices.
- Ground fee-tier applications in three fictional situations: volume versus fee rate, an APR screenshot under changed competition, and reinvesting while other LPs add more liquidity. Supply the figures and fee shares so questions ask for explanations rather than calculations.
- Put the recorded starting price and fixed range beside the placement question. Move the derived upward room into feedback, trim repeated answer previews and replace weak wrong answers across liquidity, lending and loops.
- Distinguish withdrawing a supply from disabling collateral. Keep the borrowing headroom chart, simplify question wording, remove obsolete collection references and give the rebound handoff a cents-level investment with its remaining wallet cash accounted for separately.
- Preserve completed lessons and compatible saved work while retiring answers to materially revised questions. Extend question, persistence and desktop/mobile checks. Core financial formulas and recorded blockchain evidence are unchanged.

## 1.49.0 · 2026-10-27

- Compare two exact wstETH exposure targets inside Hold & stress. Both use the same original tokens, rates, time, prices, oracle, costs and exit destination. Show differences against holding, health, oracle-price headroom and after-exit outcomes together.
- Keep targets above the borrowing limit visible as unavailable without changing the main setup. Flag earlier liquidation boundaries and suppress executable exit outcomes after a boundary. Preserve optional comparisons in drafts, links, Home resumption and named experiment exports; older rounds and records retain their meaning.
- Put the main setup’s break-even borrow APR beside its rate controls, explicitly before exit costs, with a direct route to the exit preview. Keep mobile readouts beside the controls and stable during touch dragging; retain complete chart-end labels on narrow screens. Correct saved liquidity comparisons to acknowledge entered LP costs.
- Extend accounting, compatibility, keyboard and desktop/mobile checks. Existing financial formulas and recorded evidence are unchanged.

## 1.48.1 · 2026-10-26

- Keep collateral and debt on a common visual scale in LST stress results, including debt above collateral value. Add exact day and market-discount entries beside the sliders, preserving fractional inputs, validation and saved assumptions.
- Keep the active lending lab when opening Saved experiments and returning through Experiment, Back or reload. Give an empty lending library relevant starting links. Bring fee-mechanics links directly to the opened illustration.
- Explain invalid position NFT IDs beside the input and accept a leading #. Preserve the loaded snapshot during invalid edits. Clear stale liquidity price/range preset selections until the inputs are valid.
- Shorten the mobile liquidity entry, keep Home continuation arrows beside their destinations and separate the arbitrage illustration’s prices on narrow phones. Clarify a recorded price-rise question, range controls and the moved-range lab invitation. Mention correlated-asset loops in About.
- Extend desktop, keyboard and narrow-phone regression checks. Financial models, historical records and lesson grading are unchanged.

## 1.48.0 · 2026-10-26

- Ground selected lesson questions in wallet quotes, position dashboards, range management and borrowing limits. Keep explanations, hints, optional predictions and direct lab access available; no required arithmetic is added.
- Distinguish price impact already included in a swap quote from slippage tolerance. Compare a fictional dashboard’s total value with the original token basket, retaining the withdrawal question in another variation. Fresh concentrated-liquidity variations now end above, below and inside the range.
- Compare leaving a range in place with moving it after a fall, then show both outcomes when ETH rebounds. Use the recorded cases to explain range placement and separate the recovery in principal versus holding from the increase in period fee value.
- Show the maximum-loan example’s price headroom and liquidation boundary. Add contextual lab invitations for changed scenarios while retaining the original observation handoffs.
- Preserve completed lessons and compatible drafts; retire answers to changed questions. Extend reference, migration and desktop/mobile checks. Historical records and financial formulas remain unchanged.

## 1.47.0 · 2026-10-26

- Review predictions, explanations and applications across all twenty lessons and their variations. Retain strong swap, ownership, range and unwind checks; replace weak applications with withdrawals, a fee target that changes with price, movement before range re-entry, reinvestment, and a price recovery after a hypothetical liquidation.
- Name each application’s situation and supply relevant prices, recorded facts or wallet/collateral balances beside its question. Keep the recent recorded finale and constructed liquidity challenge. No required question asks for calculation or precise slider placement.
- Give feedback for the selected misconception while retaining price-dependent token explanations. Distinguish all collectable tokens from new period fees, active time from fee share, and a recovered health factor from returned collateral.
- Preserve completed lessons and compatible answers; retire answers to materially changed questions. Extend accounting, migration and desktop/mobile checks. Financial models, recorded blockchain evidence and Experiment handoffs are unchanged.

## 1.46.1 · 2026-10-26

- Replace the recorded comparison lesson’s final checks with two concrete situations: collecting earned fees without changing total value, and a further ETH rise while the position remains above its range. Use concise, parallel answer choices and explain the consequences after checking.
- Put the relevant earlier balances beside the collection question and the final ETH holdings beside the price question. Include ETH held in earned fees, use a shared visual scale, and distinguish a shrinking lead from necessarily falling behind. Remove instructions about lesson state in favor of local context.
- Preserve completed progress, predictions and the selected historical checkpoint while clearing answers to the two replaced questions. Extend accounting, migration and desktop/mobile checks; recorded evidence and financial models remain unchanged.

## 1.46.0 · 2026-10-26

- Review all twenty lessons around explanation and application. Replace weak number comparisons and predictable repeat questions with changes in conditions, plausible misconceptions and feedback tied to the selected answer. Keep Predict → Observe → Check, optional predictions and direct lesson access.
- Add a separate visual challenge to the liquidity finale: construct an example that matches holding while both lose dollars, then explain what the assumed fees covered. Exact matching and a worked example remove arithmetic and slider precision as barriers.
- Pause the borrowing unwind application after selling ETH so learners identify the repayment still needed, with an optional repayment contrast. Replace the recorded finale’s cost-ranking question with interpreting principal, fees and the holding benchmark; retain the cost reversal as a worked illustration.
- Keep application state separate from the fixed observation and lab handoffs. Preserve completed progress while retiring answers to materially revised questions, and label sharing as the worked example. Extend model, migration and desktop/mobile interaction checks. Financial models and recorded blockchain evidence are unchanged.

## 1.45.0 · 2026-10-26

- Add an assumed average position fee APR and duration alongside cash fees in both liquidity endpoint labs. Apply APR to starting deployed capital over the entire period, without compounding or multiplying by concentration.
- Add optional opening, collection and closing costs, measured as extra LP expenses relative to holding. Show principal, fees, costs, net value and the exact starting-token holding benchmark on one dollar scale. Include costs in break-even fees and show a required average APR when duration is set; retain negative net outcomes.
- Introduce `cp50-v2` and `cl-range-v2`. Preserve original links, saved records, lesson assumptions and recorded accounting. Carry new assumptions through price presets, charts, shares, Home resumption, Learn-return drafts, saved comparisons, CSV and result cards. The optional 50/50 reference keeps its separate cash fees and uses the same LP cost budget.
- Use the saved lab duration for fee context while preserving lesson-only time experiments. Extend independent accounting and compatibility checks plus desktop, 390px and 320px browser coverage.

## 1.44.0 · 2026-10-26

- Apply a single-loan choice of simple interest or continuous compounding to supplied ETH, USDC debt, health factor, boundaries, responses and the separate liquidation illustration. New/reset experiments default to compounding at the entered constant APRs; show equivalent one-year growth beside the rates.
- Add a time slider and original-plus-interest bars, with one dollar scale, explicit token amounts and unchanged borrowed wallet cash. Keep risk feedback nearby on mobile and preserve exact numeric time input.
- Introduce `collateral-loan-v2` while retaining original simple-interest arithmetic for v1 links, session drafts, named records and lesson handoffs. Preserve the choice in new shares, library exports, comparison and Home resumption; saving an opened legacy setup creates a variation.
- Extend reference, conservation, boundary, migration and desktop/mobile browser checks. Update methods and guides to distinguish the selected mathematical convention from real protocol reserve indexes or changing rates.

## 1.43.0 · 2026-10-26

- Add exact wstETH exposure targets alongside borrowing rounds. Show the assumed flash-assisted construction, temporary and long-term debt, swap losses, build flash fee and LTV limit. Define exposure as a multiple of original wstETH holdings, with collateral-to-net-equity leverage shown separately.
- Compare selling all collateral into WETH with repaying debt and keeping unsold wstETH. Follow either exit step by step, count every obligation and show the appropriate holding benchmark. Blocked exits retain collateral and debt; a retained token's market value is not sale proceeds.
- Introduce `lst-loop-v2` for the added assumptions. Preserve v1 links, drafts, exports and named records, including their rounds and oracle choices. New targets and exit destinations survive sharing, saving, comparison and Home resumption.
- Give LST selectors full touch targets and bring the selected exit walkthrough below the sticky navigation. Extend accounting, compatibility and desktop/mobile browser checks; update the guide and methods.

## 1.42.0 · 2026-10-26

- Add a separate, editable liquidation event to ETH/USDC borrowing loops. Show USDC repaid, ETH removed, the bonus cost and remaining balances without counting spent borrowing as wallet cash. Retain unpaid debt when collateral is exhausted; keep headline endpoints and unwind previews separate.
- Preserve event assumptions in loop drafts, named experiments, exports, Home resumption and shared links. Legacy links retain their original balances and use default event assumptions when opened.
- Show liquidation-boundary distance from the selected ETH price in single loans and loops. Include both the main and reference loop boundaries in the sensitivity chart.
- Use conversion-rate valuation for new LST setups, with the chosen oracle explained beside the discount control and a sourced explanation of the simplified Aave-style approach. Existing saved oracle choices retain their meaning.
- Keep headline money and token amounts together on narrow screens, abbreviate large headline values with exact values retained in titles and existing tables/exports, and show all four lending tools on phones. Add a 50/50-centered range preset and distinguish it from the existing symmetric dollar-distance presets.

## 1.41.1 · 2026-10-26

- Restore the assessed build/unwind diagram alongside saved lesson explanations. Opening an explanation after exploring another step returns to the same assessed outcome.
- Align range boundaries, price markers and labelled scales in hypothetical and recorded lesson diagrams. Stagger boundary labels for narrow screens while keeping width-comparison boundaries selectable.
- Keep the question and selected answer in view when focusing corrective feedback, with the question included in its accessible name. Distinguish first reveal, return to the outcome, action replay and explanation controls.
- Explain range composition through the direction of swaps and make the historical holding-comparison answer a complete conclusion. Preserve optional predictions, progress, financial models, recorded evidence and calculator handoffs.

## 1.41.0 · 2026-10-26

- Give matching, differing and skipped predictions green, amber and neutral states respectively, with explicit findings. Keep selected answers neutral until checked. Explain each understanding-check answer beside its question and focus the first answer needing attention; explanations are available on the first check.
- Strengthen follow-ups with the same trade in deeper liquidity, ownership through a swap, a price returning to its start, composition just inside a range, collateral growing faster than debt, and the upside of leverage. Replace implausible distractors. Preserve optional predictions and earlier completion; retired choices cannot answer revised questions.
- Put average swap execution beside the outcome. Add a price-band and token-mix scene to the concentrated-liquidity lesson, show each width’s shortfall against its own original basket, and reveal supplied fictional fee totals after the fee-tier prediction.
- Compare an explicitly named earlier checkpoint with the final historical result: earned fees can coexist with trailing holding. Keep the full record, final assessed endpoint, exact accounting and Experiment handoffs unchanged; shorten token amounts in the main reading view.
- Clarify collateral defaults, leverage, opening/closing swap costs and the distinction between sequential and atomic unwinding. Update teaching documentation and desktop/mobile regression coverage. Financial models and recorded chain evidence are unchanged.

## 1.40.0 · 2026-10-26

- Introduce each lesson with a readable starting setup, the action or condition being tested and its decisive assumptions. Keep the required facts before prediction choices, including the complete borrow → buy → supply loop.
- Give matching, differing and skipped predictions distinct, prominent feedback. Remove the repeated scoring disclaimer while retaining optional predictions and conceptual completion checks.
- Introduce recorded positions with their starting tokens, price and range before the prediction. Bring the historical chart forward on reveal, keep unknown intervals unknown and replace the unseen-winner guess with a question about fees and the holding comparison. Preserve earlier completion; retired prediction choices are not treated as answers to the new question.
- Check all twenty setups and prediction flows on desktop and mobile, including loading/retry, saved progress, exact handoffs and changed question inputs. Financial models and recorded evidence are unchanged.
- Restructure the review as a current assessment with distinct evidence types, consequential model boundaries and prioritized validation. Preserve the complete previous review body in a linked historical archive.
- Consolidate observation tasks in Learning, group durable Decisions, improve documentation navigation and correct stale lending, replay, saved-comparison and domain-cutover descriptions. Those documentation changes preserve the versioned models and recorded evidence.

## 1.39.1 · 2026-10-25

- Keep button labels free of underlines at rest, on hover and during keyboard focus. Remove the Home-only lab-link hover override so lab and lesson buttons share the same treatment.
- Keep disabled secondary buttons from showing the hover feedback used by available actions. Preserve text-link underlines and keyboard focus outlines across the site.

## 1.39.0 · 2026-10-25

- Add a separate wstETH/WETH correlated-loop experiment with directly accessible Build, Hold & stress, and Exit stages. Follow construction and atomic-exit balances without adding borrowed cash to wealth.
- Separate staking conversion-rate growth, additional collateral lending yield and continuously compounded WETH borrow APR. Support one rate change and flag an earlier rate-only liquidation boundary even if the endpoint recovers.
- Distinguish market discounts, oracle valuation and a shared ETH dollar price. Compare with holding the exact original wstETH, expose the value bridge and break-even borrow APR, and provide an optional health-factor sensitivity chart and bounded liquidation event.
- Keep all debt when an exit is unavailable, underfunded or outside the preview’s boundary rules. Compare complete exits after explicit swap, flash and flat costs. Current protocol parameters and execution are not inferred.
- Add independent drafts, strict share links, Home resumption and named LST experiments in the shared library. Preserve ETH/USDC loops and all recorded liquidity evidence. Keep the four-tool lending strip within narrow screens and show nearby mobile results.
- Add reference, conservation, boundary, storage and desktop/mobile browser coverage. Update methods, guides and the remaining roadmap.

## 1.38.0 · 2026-10-25

- Make competing LPs’ range visible alongside A and B. Change its width while keeping capital fixed, or use full-range competition. Show fee shares beside the slider, preserve each batch’s assumptions, and identify inactive competitors. New experiments use an explicit 100% competitor width; this is a teaching choice, not calibrated market data.
- Reject trading batches at competitor boundaries or when an alternative has no active LPs. Keep accrued tokens and outcome totals independent from the next-batch preview.
- Add a separate stepped arbitrage illustration and a before/during/after JIT diagram. Explain the different holding and rebalancing benchmarks without inventing an LVR estimate or adding another loss deduction. Link from the fee-tier lesson and Methods.
- Version new fee links and drafts while preserving the full-range meaning of earlier records. Add independent concentration/conservation checks and desktop/mobile coverage for sliders, boundaries, compatibility and illustration isolation.
- Keep correlated-asset/LST looping as the next roadmap discussion, alongside later evidence-sharing and historical-analysis decisions.

## 1.37.0 · 2026-10-25

- Add Follow the fees within the controlled width experiment. Allocate a hypothetical trading batch between the protocol, the chosen active range and other LPs; each range is a separate alternative against the same competing liquidity.
- Keep up to eight batches with their own prices, volumes, competitor capital, fee tiers and protocol shares. Retain ETH/USDC fee tokens after range exits, revalue them at the selected price, and separate fees, LP versus holding and dollar change. Previewed activity is excluded until added.
- Keep the price control next to the fee split, with setup details available on demand, paired mobile results, a two-batch example, undo/clear and exact fee-value handoffs. Versioned links and migrated local drafts retain every assumption; original width-only links and records remain supported.
- Label the fixed-price approximation explicitly. Half of each batch’s input notional is ETH and half USDC; the other LPs use continuous full-range liquidity. No price impact, inter-batch swap fees, historical earnings or executable trades are inferred. Exact-edge batches require a different model and cannot be added.
- Add independent fee-allocation, conservation, revaluation, dilution, compatibility and desktop/mobile workflow checks. Historical evidence and lesson progress are unchanged.

## 1.36.0 · 2026-10-25

- Add a controlled range-width experiment with equal capital, starting price, 50/50 token basket and comparison price. Reciprocal bounds preserve the common starting mix as either width changes; A and B can be equal or reverse order.
- Show both ranges on one price scale, changing token balances, principal value, dollar change and the fees needed to match the common holding basket. A separate chart shows the gap across hypothetical prices. No fee earnings or historical path are inferred.
- Keep the shared setup and boundary shortcuts available on demand, with a native price slider, exact price entry and side-by-side results on phones. Add validated share links, an independent local draft, Home resumption and exact zero-fee handoffs into the range lab.
- Link the experiment from the range lab and recorded comparison. Preserve all historical evidence, lessons and existing saved experiments. Add reference/invariant tests and desktop/mobile checks for persistence, invalid-input recovery, keyboard/touch controls and handoffs.

## 1.35.0 · 2026-10-25

- Compare two real WETH/USDC 0.3% ranges over the same declared week. Require both to start active and select the first eligible NFT in each predeclared width group, retaining later exits, losses and collections. Preserve the earlier inactive case.
- Account for fee collections without changing principal. Reconcile manager debits with actual pool payments in transaction receipts, subtract starting claims, retain rounding differences and check the ledger against fee growth and collection simulations. Keep complete event coverage and exports; original record formats remain unchanged.
- Add a shared daily timeline, normalized fee chart, daily range-time bars and three separate outcomes: fees, LP versus holding, and dollar change. Each position retains its own starting mix and capital. Experiment handoffs start with principal and zero assumed future fees.
- Link the comparison from fee context and historical cases. Add receipt, accounting, selection, navigation, export and mobile checks, with reproducible capture commands. The comparison is a historical illustration, not a forecast or a controlled test of width alone.

## 1.34.0 · 2026-10-25

- Add a fixed-position week for Ethereum WETH/USDC 0.3% NFT #1375090: eight daily checkpoints over 604,800 seconds, with zero newly earned fees and zero recorded active seconds. Preserve the original fixed dates, publish candidate exclusions and a fallback list declared before its earnings were inspected, and retain the first eligible outcome.
- Join seven independently checked bounded segments through identical canonical checkpoints. Check cumulative fees from the week's first checkpoint, preserve rounding carries, reject missing or conflicting evidence, and retain complete per-segment exports. Existing record formats and both earlier cases remain unchanged.
- Add daily checkpoint shortcuts, a seven-interval comparison, selection evidence, starting-capital context and dollar change separately from the holding benchmark. The eleventh example and fee-context panels link directly to the week; checkpoint handoffs remain new principal-only experiments with zero assumed future fees.
- Add resumable capture and selection commands, bounded event-read retries and support for fresh week recapture in the existing evidence-check workflow. Arithmetic, continuity, capture recovery, keyboard/mobile access and export/handoff checks cover the new record.

## 1.33.0 · 2026-10-25

- Give Home equally prominent lab and lesson entries, with independent Continue experimenting and Continue learning routes. Restore edited model assumptions locally; keep saved source snapshots in named experiments.
- Extend the existing experiment library to single loans and borrowing loops, including liquidation illustration inputs and loop reference choices. Add named duplication, model-aware saved comparisons and cross-topic reopening while retaining export/import, recovery and existing liquidity records.
- Compare loop round counts and borrowing fractions under shared capital, prices, time, rates, collateral rules and swap costs. Add the reference to the price chart and separate build/unwind cost details; preserve legacy links and drafts.
- Apply Follow the money to the user’s own complete construction and unwind ledgers. Show swap costs, blocked previews and unpaid debt without adding imagined execution steps. Keep lessons and their completion rules unchanged.
- Check persistence, comparison boundaries, exact action balances, invalid reference recovery, return visits and desktop/mobile workflows. Financial models and recorded historical evidence are unchanged.

## 1.32.0 — 2026-10-25

- Put prediction questions and answer choices in view across all twenty lessons. A clear “Not sure — show me” route keeps results accessible; choosing an answer offers “See what happens”. Visual lessons show the question’s outcome in the diagram, with the expectation and finding beside the choices. Keep each interactive diagram beside its controls on phones.
- Make prediction optional consistently in the six older range and recorded lessons too. Skipping never invents an answer or marks a lesson complete; explanation and changed-situation checks still determine completion. Saved answers, earlier completion, exploratory controls and exact Experiment handoffs remain compatible.
- Keep recorded outcomes behind successful record validation and preserve loading, retry and navigation isolation. Check desktop/mobile prediction access, keyboard activation, mistaken predictions, skipped completion and restoration across chapters.
- Record the teaching sequence as a durable product choice: form an expectation, observe the mechanism, explain the result and apply it elsewhere. Usability and accounting checks do not establish improved learning.

## 1.31.3 · 2026-10-25

- Remove browser-default outlines around non-interactive heading destinations when opening or navigating lessons. Keep heading focus and scroll placement, with visible focus indicators on controls and feedback cards.

## 1.31.2 · 2026-10-24

- Align ETH and USDC identity in liquidity and lending lessons with Home and the labs: gold ETH, striped blue USDC, with diamond/circle markers and token labels retained.
- Share the USDC background treatment between lab swatches and lesson markers/bars. Keep debt, warning, holding, strategy and range-comparison colours scoped to their existing meanings.
- Wait for initial lesson focus and header measurements before browser-test interactions, preserving the existing feedback-visibility and native-touch assertions.

## 1.31.1 · 2026-10-24

- Give Home a descriptive browser/search title and align each content page’s title and description across search and social previews. Liquidity metadata now describes liquidity experiments and records.
- Use Lending consistently on Home and in topic navigation, with plain-language copy covering supplying, borrowing and loops. Match arrows to existing same-tab, in-page and new-tab behavior.
- Publish a six-page canonical sitemap and a robots file that allows crawling and references it. Serve XML with the appropriate content type in local previews.

## 1.31.0 · 2026-10-24

- Added a permanent Home with Liquidity and Borrowing & leverage entry points, direct labs, mobile topic shortcuts and a local Continue-learning bookmark. Home loads no financial models or recorded datasets.
- Grouped navigation by topic, followed by the available Learn, Experiment and Inspect modes. Lending no longer has an Inspect link that changes topic. The logo returns Home; leaving liquidity through Home preserves valid working drafts.
- Moved the liquidity workspace to `liquidity.html`. Existing root scenario, snapshot, historical-case and tool fragments still open the same setups through a history-replacing route. Shared links generated by the app use the direct document.
- Simplified lesson orientation: chapter progress appears once in the closed catalogue or in the expanded chapter list; removed the competing exercise total and stage number. The foundation slider's reset shortcut now names the lesson setup.
- Reserved space for changing slider values and extended the traced native-touch check to both foundation lessons at 390px and 320px.
- Flattened local CSS imports during the existing build, preserving cascade order and rebasing nested resource URLs. Production entry pages load one bundled stylesheet; readable source modules and content hashes remain.
- Added entry/navigation and CSS-build regressions. Financial models, historical records, completion rules and existing progress/storage formats are unchanged.

## 1.30.1 — 2026-10-24

- Make recorded fee context easier to scan with starting capital → recorded time → fees earned. Keep ranges, active time and percentage denominators visible; move period/capture details and accounting notes below the figures.
- Shorten the hypothetical fee explanation and clarify that choosing more days lowers the required daily average without establishing earnings. Models, records, scenarios and progress formats are unchanged.
- Harden the intermittent pilot touch test with mode-before-measurement setup, stable hit-target checks, trusted event diagnostics and repeated fresh-page drags. No failed-gesture retry or weaker endpoint assertion is introduced.
- Specify a proposed week-long fixed-position case with predetermined selection, bounded segment composition, exact cumulative fee accounting and a no-calculation learner observation. No new historical case is published in this release.

## 1.30.0 — 2026-10-24

- Add optional “Could fees cover this?” context to both liquidity labs and the fee-break-even/final-challenge lessons. Show the total fee hurdle as a percentage of starting capital, the gap after assumed fees, and the required daily average over a chosen 1/7/30/90-day window. This is a hurdle, not an earnings estimate.
- Offer two lazily loaded historical examples with their original principal, newly earned fees, exact duration, ranges, active time and capture-check dates. Inspect links open the original evidence. Different positions and periods remain separate observations; nothing is annualized or rescaled to the hypothetical deposit.
- Keep the time-window control outside scenario inputs, saved progress and shared links. Failed example loads can be retried without disabling calculations. Financial models and stored formats are unchanged.

## 1.29.0 — 2026-10-24

- Make loss versus profit, break-even fees and the final challenge visual. Compare starting capital, the exact holding basket and LP principal on one fixed dollar scale; add hypothetical cash fees as a separate striped segment.
- Progress from changing price, to adding fees at a fixed price, to changing either assumption in the final challenge. Preserve both values when switching its active control. The exact **Match holding** shortcut is a required total, not an earnings forecast.
- Make predictions optional while retaining conceptual checks, prior completion, result cards and exact Experiment handoffs. Exploration stays separate from the assessed setup; explanation and revealed-lesson reload restore its price and fees.
- Add benchmark, fee-target, conservation, restoration and mobile interaction checks. Keep financial models, storage formats and recorded evidence unchanged.

## 1.28.1 — 2026-10-24

- Open direct lesson links at their heading across liquidity, practical ranges, historical exercises and both lending chapters. Preserve the overview for generic Learn links and the reading position on reload or browser history.
- Make selecting the current liquidity lesson return to it without rebuilding its scene or changing saved answers. Compact the mobile chapter links and align the essentials counter with its seven exercises, including the final challenge.
- Label the loop comparison's bars as gain or loss from the start and its totals as value after debt, before liquidation. Keep the existing calculations and shared scale.
- Enlarge historical evidence disclosures for touch and keyboard use, and give an empty position import an accurate first-use label.
- Record a whole-app review of usability, teaching, evidence, accessibility, performance and engineering, including unresolved learning and execution limits. Add navigation, reading-position and disclosure checks.

## 1.28.0 — 2026-10-24

- Make the middle borrowing-loop lesson visual. Compare holding the original 5 ETH with a three-round loop from the same starting capital; show value after debt and gains/losses on one fixed scale.
- Separate the original zero-interest price question from a labelled time example at the unchanged ETH price, with 0% supply APR and 10% borrow APR using continuous compounding. Keep debt, health factor, the liquidation price and pre-liquidation scope visible.
- Complete visual exploration across all seven lending/loop lessons. Predictions are optional; conceptual checks, prior answers and completion remain compatible. Explanation and reload restore the original $1,500 question, and the Experiment handoff retains that exact setup.
- Preserve exact named slider values when a browser shortens repeating decimals, and clear earlier announcements when a different frame is shown. The liquidation-boundary shortcut uses the full model value.
- Add gain/loss, boundary, interest and restoration checks, plus mobile keyboard/touch and reduced-motion coverage. The financial models and recorded evidence are unchanged.

## 1.27.0 — 2026-10-24

- Make the repayment lesson visual: compare repaying USDC debt with buying and supplying more ETH, using one outside-budget slider and two columns on the same dollar scale. Keep the original loan visible through reference marks.
- Show full repayment without selling or withdrawing the supplied ETH, and retain cash beyond the debt instead of spending it twice. Explain that fresh outside money is not profit and that adding collateral keeps both debt and ETH price exposure.
- Complete the four visual lending essentials with optional predictions, conceptual checks, compatible progress and the fixed $1,000 Experiment handoff. Add reference/conservation tests and desktop/mobile checks for the comparison, touch dragging, restoration and state isolation.

## 1.26.0 — 2026-10-24

- Make the prices/interest/time lesson visual. Explore a year of debt interest at a fixed ETH price, then change the price while keeping the accrued token balances fixed. Two bars on one dollar scale compare counted collateral backing with debt; equal bars mean health factor 1.
- Keep comparison markers, the original ETH quantity, added interest and liquidation status visible. Show the exact boundary and distinguish nearby values that would otherwise round to 1.00. Balances below the boundary are explicitly before liquidation; moving the slider never invents a price history or liquidation event.
- Make the prediction optional while preserving explanation/application checks, prior completion and the exact one-year Experiment handoff. Opening the explanation or restoring a revealed lesson returns to that assessed setup. Mode changes and sliders stay separate from working drafts.
- Add reference and boundary tests, keyboard/touch checks, stable mobile slider checks and reduced-motion coverage. The underlying financial model and recorded evidence are unchanged.

## 1.25.0 — 2026-10-24

- Extend **Follow the money** to the first two lending lessons. Follow ETH from the wallet into a supplied claim, let interest accrue with collateral off, then enable collateral without taking a loan. In the borrowing lesson, USDC and matching debt appear together while assets minus debt stay unchanged.
- Keep wallet funds, supplied ETH, remaining borrowing capacity and debt distinct. Reuse named actions, replay, Back and direct step selection, with brief cues and reduced-motion support. Predictions remain visible and optional; completion still checks explanation and application.
- Keep exploration separate from the fixed lesson question and exact Experiment link. Opening an explanation or restoring a revealed lesson returns to its assessed balances. Preserve existing answers, completion and independent working drafts.
- Add accounting checks for transfers, accrued interest, collateral enabling and borrowing capacity, plus browser checks for keyboard controls, restoration and narrow mobile layouts. No financial model, recorded evidence or storage version changes.

## 1.24.0 — 2026-10-24

- Extend the visual lessons to swaps and providing liquidity. Follow ETH into the pool and USDC out, then compare small and large trades by their average execution price. Step through a matching deposit and a separate trader’s later swap, with the ownership percentage visible beside both token balances.
- Keep the prediction question visible in all six visual lessons. Answer choices remain optional; exploration and explanations are available immediately. Retain the conceptual checks, saved answers, completion and existing Experiment links.
- Keep exploratory amounts separate from the lesson question. Each starts from the original pool; replay does not accumulate trades. Explicit question edits invalidate earlier answers, while opening an explanation restores its question amount.
- Check exact swap quotes, retained fees, proportional ownership, keyboard actions, reduced motion, restoration and stable touch controls at 390px and 320px. These are hypothetical v2-style teaching scenes; recorded evidence is unchanged.

## 1.23.0 — 2026-10-24

- Establish four visual lesson pilots: build a loop, unwind it, changing token balances, and narrow versus wide ranges. Show the starting state and offer an optional prediction before exploration. Explanation and changed-situation checks still determine completion.
- Replace the loop sliders with one named action at a time, replay, Back and grouped direct step access. Keep completed balances readable, preserve reduced-motion support, and keep the unwind's collateral constraint and health factor visible.
- Show both LP token quantities with starting markers and trade direction. Compare two range bands on one price scale, with boundary shortcuts and single-token endpoints. All frames use the existing hypothetical models; no new fees or historical paths are inferred.
- Keep exploratory prices separate from the question and its Experiment handoff. Preserve editable question prices, existing answers and completion. Check native keyboard/touch controls, fixed question scope, reduced motion and restoration without a prediction.

## 1.22.0 — 2026-10-24

- Open the build and unwind lessons with **Follow the money**, before any answer is required. Keep reflection and conceptual checks below the visual; preserve existing answers, completion and Experiment handoffs.
- Show wallet tokens, ETH backing the loan and debt as distinct areas. Label transfers with directional arrows, show both sides of borrowing, and keep swaps separate from repayment. Use brief, user-triggered motion with a static reduced-motion alternative; revisiting earlier stages does not animate an undo.
- Shorten the surrounding explanation and place detailed changes, health factor and costs in an optional disclosure. Keep the fixed-price assumptions and the limits of real withdrawals beside the example.
- Check upfront access, stage preservation, reduced motion, keyboard navigation and mobile touch dragging alongside the existing accounting tests. Financial models and recorded evidence are unchanged.

## 1.21.0 — 2026-10-23

- Extend **Follow the money** to the unwinding lesson. Eight slider stops separate two withdrawals, sales and repayments, then the final transfer of debt-free ETH to the wallet.
- Show debt unchanged after a sale, swap losses charged at the sale, and collateral still supplied after repayment. Keep health factor, wallet balances and net assets beside the sequence.
- Add action-level model balances without changing existing unwind totals, scenarios or saved progress. Check intermediate balance conservation, incomplete previews and desktop/mobile slider interaction.

## 1.20.1 — 2026-10-23

- Turn the first loop lesson's money flow into a four-stop slider, with named stages, keyboard controls and Previous/Next as an alternative. Keep exact action balances instead of inventing intermediate transaction states.
- Highlight the balances changed by each action and label borrowed cash, new debt and ETH moving into collateral. Moving backward revisits the example; it does not reverse a loan.
- Extend desktop keyboard and mobile touch-drag checks. Preserve lesson progress, calculations and links.

## 1.20.0 — 2026-10-23

- Compare borrowing-round counts under identical starting capital, prices, time, rates and costs. Keep debt, health factor and liquidation boundaries beside net assets; distinguish supply only from holding.
- Preserve the optional reference count in tab drafts and share links. Older links and saved progress remain compatible; reset and explicit single-setup links clear the comparison.
- Add an optional four-stage money walkthrough to the first loop lesson, using the model's actual ledger. Show wallet assets, supplied collateral and debt without adding calculation questions or completion gates.
- Align the replay heading with its checked-at-capture evidence, simplify a pool-ownership takeaway and correct the build documentation. Extend comparison, persistence and desktop/mobile interaction checks; the financial models and recorded evidence are unchanged.

## 1.19.1 — 2026-10-23

- Lead borrowing-loop results with the difference from holding and the selected price/time. Identify zero rounds as supply only and show original capital beside its assumptions.
- Add touch-sized round controls with clear limits. Keep round summaries compact, preserve opened details while editing and distinguish construction balances from later price/interest results.
- Label completed, partial, blocked and unnecessary unwinds separately. Show that blocked swaps were not run, retain debt and separate construction from unwind swap losses.
- Explain the chart's selected point, clarify chapter navigation and preserve the sign of real sub-cent differences. Extend unit and desktop/mobile interaction checks; financial models and recorded evidence are unchanged.

## 1.19.0 — 2026-10-23

- Add an ETH/USDC borrowing-loop lab alongside the single-loan lab. Follow borrowing, buying ETH and supplying it through up to five rounds, with original capital, wallet balances, debt, swap losses and price exposure kept distinct.
- Compare the loop with holding its original ETH. Test price and time with fixed simple interest or continuous compounding; show health factor separately from net value and retain pre-liquidation balances at adverse endpoints.
- Add a withdrawal-first unwind preview with intermediate collateral checks, swap losses and no outside funds. Stop at or below the liquidation boundary, retain remaining debt and label the assumed sequence’s execution limits.
- Add three directly accessible lessons: build one loop, repeat and change conditions, then explore unwinding. Keep predictions ungraded and checks conceptual; preserve the earlier four lessons and their independent progress.
- Add strict versioned loop links and independent tab drafts, with model reference/conservation tests and desktop/mobile browser coverage. Document the new model and remaining blind spots; existing loan and liquidity calculations are unchanged.

## 1.18.2 — 2026-10-23

- Update About and README around liquidity and lending as two topics, with direct routes to both labs and lesson sequences.
- Refresh GitHub’s project description, homepage sharing metadata, the app description and social preview. Align the guide and model/data introductions with the current scope; recorded snapshots and historical accounting remain specific to liquidity.

## 1.18.1 — 2026-10-23

- Polish all four lending lessons with more natural questions, clearer references and simpler explanations. Define assets minus debt before using it and explain borrowing limits without an extra numerical comparison.
- Clarify the lab’s chart, compounding and liquidation wording. State that the liquidation bonus is a percentage of the debt repaid and connect the field to that explanation for screen readers.
- Keep predictions ungraded and preserve conceptual checks, answer identifiers, calculations, shared setups and saved progress.

## 1.18.0 — 2026-10-23

- Explain lending liquidation with a separate single-event illustration: debt repaid, collateral removed, bonus cost, remaining balances and unpaid debt when collateral runs out. Keep pre-liquidation balances explicit. Event assumptions have their own draft and versioned share fields; older loans retain their calculations.
- Add a health-factor price chart and continuous-compounding debt reference, with clear fixed-balance and fixed-rate scope. Surface large interest-model differences and clarify lesson explanations.
- Replace manual release queries with a dependency-free build that hashes all modules/styles and preloads entry dependencies. Check Node 22/24 and run the browser suite against the exact deployed build.
- Label historical records as checked at capture, expose capture dates/providers and add a manual chain-evidence verification workflow with comparison reports. Add fee-target context, RPC privacy disclosure and email feedback at hello@teren.sh.
- Record review questions and known blind spots for recurring discussion before further model expansion.

## 1.17.1 — 2026-10-23

- Shorten the lending entry and keep health factor and liquidation status visible while editing on mobile. Show assumed APRs beside the time controls, with a direct shortcut to edit them.
- Keep the existing loan result visible while a response budget is incomplete. Add focused recovery for invalid loan fields, including fields inside closed disclosures, and prevent delayed clipboard failures from surfacing an outdated link.
- Resume the current lending lesson through Learn and topic navigation. Make the selected topic a non-navigating label, so it cannot reset the workspace. Preserve older progress and explicit lesson links.
- Make response comparisons easier to scan on narrow screens, remove unnecessary token decimal padding and extend desktop/mobile interaction checks. Calculations and recorded evidence are unchanged.

## 1.17.0 — 2026-10-23

- Add Lending as a second topic with an ETH/USDC collateralized-loan lab: adjust prices and time, inspect both sides of the balance sheet, and compare repayment with adding collateral using the same additional budget.
- Add four directly accessible lessons: supply and collateral, borrowing and debt, prices/interest/time, then responses. Completion checks understanding without calculations; predictions stay ungraded and each exact setup opens in Experiment.
- Separate the maximum starting loan from the liquidation boundary. Use explicit, editable assumptions and fixed simple interest; identify all lending outcomes as hypothetical, with no live market quotes or simulated liquidation execution.
- Preserve liquidity drafts across topic changes, keep lending drafts in the current tab and learning progress in its own browser key, and add validated share links. Extend reference, storage, link and desktop/mobile browser checks.


## 1.16.1 — 2026-10-23

- Give mobile editing more space: the wordmark scrolls away while primary navigation stays available, lab tabs scroll normally, and the compact result stays beside working inputs.
- Keep sandbox currency amounts on one line with labelled mobile summary rows.
- Lead the range lab with holding versus the range's own starting tokens. Make the V2-style reference and its chart line optional, while preserving all calculations and export formats.
- Label the lesson selector “All topics” and show the current chapter's progress. Group answer feedback, the takeaway and the next lesson in one focused panel.
- Use Experiment consistently in learning handoffs, label V2 pool snapshots explicitly and simplify recorded-lesson feedback.

## 1.16.0 — 2026-10-23

- Rebrand the interface, documentation and downloads as Teren, with a custom vector wordmark, open-t symbol, favicon, app icons and social preview. Introduce ink-blue surfaces while retaining the distinct token-allocation colors and patterns.
- Explain the Pontic origin of the name briefly on About. Prepare canonical metadata and links for teren.sh, with GitHub Pages hosting and Cloudflare DNS.
- Preserve all calculations, recorded evidence, browser-storage keys and file-format identifiers. Document the separate browser storage created by a domain change and the supported experiment/snapshot export path.

## 1.15.2 — 2026-10-15

- Make token allocations easier to read with a taller bar, solid gold for ETH/WETH and striped blue for USDC. Add matching markers beside larger percentage labels in starting mixes, range outcomes and position snapshots.
- Keep the bar proportional at every screen size, including all-ETH and all-USDC positions. Preserve all calculations and saved data.

## 1.15.1 — 2026-10-15

- Name Uniswap v2-style full-range and v3-style price-range calculations in lab tabs, badges, lessons, saved experiments and result cards. Label the virtual pool as v2-style and recorded historical cases as v3.
- Move Passiko’s internal model revision labels out of prominent badges and lesson footers. Explain that `cp50-v1` and `cl-range-v1` do not mean Uniswap v1, and that v3 can also provide full-range liquidity.
- Clarify the simplified range model’s continuous price bounds versus native v3 ticks. Preserve calculation identifiers, shared links, saved data and all math.

## 1.15.0 — 2026-10-13

- Keep lesson hints and ungraded predictions while making explanatory choices more believable. Practical follow-ups now change their conclusion with the supplied fees, costs or removal of liquidity; all totals are provided.
- Replace the mobile rows of secondary links with an expandable tools menu. Keep desktop links visible, preserve navigation and drafts, and correct Learn’s sidebar heading order.
- Add About and Methods pages with clear evidence boundaries and shared access to methods, source and feedback. Keep imported-file validation distinct from independent chain-state verification.
- Extend checks for changing situations, mobile tools, project-information pages and restoration. Preserve existing lesson IDs, completion, historical records and saved experiments. Legacy pre-rebrand website links are intentionally unsupported.

## 1.14.0 — 2026-10-13

- Add three practical lessons after the essentials: range widths, fee tiers and APR, then exits, returns and management costs. Each has three situations and checks explanation/application without any calculation field.
- Show sourced pitfalls in all ten existing topics. Clarify the fee-target question, remove division from the ownership prediction and balance explanatory answer lengths.
- Use calculated hypothetical range outcomes and explicitly supplied fictional fee totals. Keep them distinct from independently verified historical accounting and preserve older learning progress, scenario links and saved work.
- Share choice/metric rendering across chapter controllers. Add strict routes, independent progress and desktop/mobile checks for the new chapter.


## 1.13.0 — 2026-10-13

- Learning completion now checks explanation and application of an idea after one assumption changes. Predictions remain ungraded; numeric answers and rounding are optional practice in Go deeper.
- All seven essentials exercises follow selected prices, trade sizes and ranges. Applied historical exercises add labelled thought experiments about fee collection, sampling and costs without altering the verified records.
- Answer order varies between attempts and remains stable within a draft. Existing progress and checked lessons are retained; optional practice cannot hide Continue or invalidate a result card.


## 1.12.1 — 2026-10-13

- Explain token transfers using the selected rising, falling or unchanged ETH price. Clarify that pools do not create ETH or USDC; give specific feedback for incorrect reasoning throughout both learning chapters.
- Match numeric grading to the question’s displayed precision and require whole-number answers where requested. Reject adjacent incorrect rounded answers.
- Anchor historical conclusions and prediction feedback to the marked question checkpoint while other checkpoints are explored. Clarify before-fee budget comparisons and principal-only range questions.
- Version mutable teaching text and grading together, with regressions against a retained previous model. Add direction, distractor, rounding, boundary and desktop/mobile checks while preserving lesson identifiers and saved progress.

## 1.12.0 — 2026-10-13

- Add a three-exercise applied learning chapter: fees accumulating, activity between outside-range samples, and the final comparison with holding. Reuse the two independently checked historical records and their existing accounting.
- Keep a fixed question checkpoint or interval while learners explore recorded history. Require a numeric answer and sound reasoning, with hints, optional exact accounting and source links.
- Connect the essentials challenge and Inspect to the applied chapter. Provide direct access to every exercise, independent saved progress, loading recovery, and zero-fee principal-only Playground handoffs.
- Check assessment arithmetic, record loading, storage isolation and desktop/mobile workflows without changing the historical evidence or original lesson formats.

## 1.11.1 — 2026-10-13

- Commit primary navigation fragments before changing the workspace, including touch navigation from Learn and an edited calculator.
- Preserve the previous entry-element selector so cached navigation code can initialize the updated page. Version page entries, UI-controller imports and stylesheet imports, with a release stamping command and checks.
- Add regressions for cached navigation and real touch events at mobile widths, while preserving calculator drafts and existing links.

## 1.11.0 — 2026-10-12

- Open a simple zero-fee baseline directly at the inputs, with a separate entry to Learn. Keep examples and saved libraries below the working labs.
- Show a compact mobile comparison while editing, put errors beside individual fields, and place save/share controls after the full outcome.
- Present all comparison columns as labelled rows on mobile. Preserve price selection and keyboard focus.
- Make secondary navigation specific to each workspace and group verified history under Inspect. Separate quick changes from the ordered example numbering.
- Distinguish hypothetical models, recorded snapshots and verified history at the workspace entrance. Show the lesson takeaway before its detailed explanation and use a first-visit Start label.

## 1.10.1 — 2026-10-12

- Separate the charcoal page background, lighter cards and recessed inputs; strengthen control borders and secondary text.
- Use sage fills with dark text for selected navigation and presets, with clear outlines on selected lessons and answers.
- Match result-card exports, social previews and browser theme colours to the updated surfaces.

## 1.10.0 — 2026-10-12

- Rename the app to Passiko and publish at `/passiko/`, with an open-frame p, outlined lowercase wordmark, soft sage accents and forest-green surfaces.
- Update the site, Learn, error page, metadata, social preview, touch/app icons, result cards, download filenames and documentation together.
- Preserve existing saved experiments, lesson progress, snapshots, working-draft keys and exported JSON schemas. Previously shared fragments work when moved to the new site path.

## 1.9.1 — 2026-10-12

- Keep keyboard focus on a selected price when either calculator redraws its comparison table. Clearing a saved comparison and undoing a removal return focus to available controls.
- Preserve readable chart-label sizes as cards shrink on mobile, including charts revealed after switching workspaces. Add sideways-scroll hints to mobile comparison tables and visible disclosure focus outlines.
- Place collapsed example and saved-experiment controls together on desktop; expanded libraries retain the full available width.
- Define LP on the calculator entry screen, clarify cumulative replay fees and show each recorded case’s dates. Order the position examples from in-range to out-of-range to fee accounting.
- Align the guide’s experiment names and local startup instructions with the current interface. Add browser regressions for comparison keyboard continuity, saved-library focus and all four charts at 390px and 320px.

## 1.9.0 — 2026-10-12

- Add a second verified fixed-position case: 17 checkpoints over 33 hours 27 minutes, with exits, returns and 41.7% time in range.
- Keep the in-range baseline first and add the longer case as example 10, with a direct link and recorded-case selector.
- Explain interval fee credits, active/outside time, and activity hidden between sampled prices; preserve cumulative integer rounding.
- Add checkpoint milestones, a price chart focused on relevant bounds, exact evidence/export and a principal-only Playground handoff.
- Reject impossible adjacent range-time counters and decreasing cumulative fee credits; handle delayed case loads and retries.

## 1.8.1 — 2026-10-12

- Keep primary navigation visible and make Experiment/Inspect open their section introductions.
- Offset anchored tools, sticky lab tabs and the learning sidebar below the measured header.
- Preserve valid working calculator drafts when visiting Learn and returning in the same tab.

## 1.8.0 — 2026-10-11

- Focus Experiment, Inspect and Pool mechanics on separate workspaces while preserving existing links and drafts.
- Keep Learn directly accessible alongside the tools.
- Add a verified 83-minute fixed-position case with nine checkpoints, calculated period fees, cumulative range time and JSON export.
- Shorten the project introduction and move detailed guides, models and architecture into `docs/`.

## 1.7.0 — 2026-10-11

- Save named experiments with notes, reopen working copies, compare up to three setups and export/import the library.
- Preserve verified source snapshots when starting assumptions still match.
- Protect edits across tabs and handle delayed dialog close events.

## 1.6.0 — 2026-10-11

- Add block-pinned v3 fee accounting and distinguish new fee credits, recorded owed tokens and estimated collectable balances.
- Add an applied fee-accounting example and read-only collection verification.

Earlier changes are available in the [commit history](https://github.com/provatidis/passiko/commits/main/).
