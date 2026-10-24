# Lesson goals and misconceptions

Liquidity review: 2026-10-13. Lending foundations added 2026-10-23. Teren teaches liquidity and lending mechanics, interpretation and the limits of evidence. Completion checks explanation and application; predictions are ungraded and no required question asks the learner to calculate or round a result. Numeric practice remains optional in the liquidity essentials and historical chapters.

## What the research establishes

Uniswap's primary documentation describes active ranges, token ownership and fee accounting. Published LP research separates holding benchmarks from rebalancing benchmarks. Public user questions illustrate mistaken expectations about [fee tiers](https://www.reddit.com/r/UniSwap/comments/n9oec4/), [fee APR](https://www.reddit.com/r/UniSwap/comments/zbmqz5/) and [stablecoin risk](https://www.reddit.com/r/UniSwap/comments/1cbavf6/). These questions demonstrate that confusion exists; they are not a representative survey or a measurement of how common each error is. Forum answers are not used as technical authority.

The prior course covered mechanisms well but placed several practical cautions only in optional reading. The normal lesson flow now includes short, sourced pitfalls. The practical chapter connects those mechanisms to decisions without claiming to identify the best investment. Automated checks establish internal consistency and working interactions; they do not measure learning outcomes in real users.

## Progression and purpose

| Topic | Misconception to challenge | Understanding check |
| --- | --- | --- |
| Trade size | Every unit receives the starting spot price; a slippage limit removes impact. | Explain changing reserves; apply a changed trade size. |
| Ownership | Withdrawal guarantees the original dollar deposit or original ETH. | Identify a share of both current reserves; apply another matching deposit. |
| Token balances | Rebalancing creates tokens, pays interest or protects a falling asset. | Explain swaps in the selected direction; apply another final price. |
| Loss versus profit | Dollar profit means beating holding; “impermanent” promises recovery. | Identify the same-token benchmark; apply a changed price. |
| Break-even fees | A required fee target or an assumed amount predicts earnings. | Explain what the target establishes; change only the assumed fees. |
| Range boundaries | Outside means liquidation, no earlier fees, or no price exposure. | Identify composition at a boundary; separate the final state from earnings history. |
| Final challenge | Earning any fees makes LP the winner; a correct simulation proves safety. | Interpret total values under assumptions; identify a changed benchmark. |
| Narrow and wide ranges | Tighter capital concentration always means greater profit. | Compare eligibility at shown prices; explain why an earlier fee advantage is incomplete. |
| Fee tiers and APR | The highest charge earns most; a past fee APR fixes future profit. | Identify trades and active share; interpret a short-period APR claim. |
| Exits, returns and costs | Inactive means closed or protected; changing bounds refunds losses. | Interpret outside principal values; apply an inside return without changing liquidity. |
| Period fees | All collectable tokens are new period income; collection is compounding. | Identify new fee tokens; collect them with principal unchanged. |
| Between samples | Endpoints or a plotted line describe every crossing; active time pays fees. | Interpret counters separately from fee accounting; apply two inside samples. |
| Period versus holding | A short, before-cost advantage guarantees longer-term performance. | Name period and basket; read supplied values after a hypothetical LP-only cost. |

Hints are part of learning, and predictions remain ungraded. Wrong answers describe plausible misconceptions without relying on conspicuous absolutes. Practical follow-ups add supplied final values or change whether liquidity was removed, so the observation changes the conclusion. All needed totals are displayed; learners do not calculate them.

Every topic is directly accessible. Three repeatable situations in each practical topic change the observation, while retaining the conceptual scope. An unchanged-price width situation explicitly says both positions are active, rather than implying one has exited.

## Evidence boundaries

The width and outside-value cases are calculated hypothetical endpoints from `cl-range-v1`. They do not reconstruct a trading path, predict fees or model native ticks. Equal budgets across widths use different initial token mixes, so each position has its own holding benchmark. Price inputs and bounds are visible before predicting.

Fee-tier variants provide either no earnings data or fictional fee totals after any protocol share. These figures are not derived from the rate alone. They are labelled teaching facts and never presented as a forecast or independently checked history.

The three historical exercises continue to use the original two independently checked records. Their fixed question checkpoint or interval remains separate from exploration. Any changed setup is labelled a thought experiment.

## Lending foundations

The second topic introduces one collateral asset and one debt asset before any looping. Four fixed lessons remain directly accessible. All four use the visual patterns below, with visible questions and optional predictions. Each uses the same pure `collateral-loan-v1` model as Experiment, and its handoff carries every input. Wrong predictions are welcome; completion checks the explanation and application, with clear corrective feedback and no calculation fields.

| Step | Misconception to challenge | Changed situation |
| --- | --- | --- |
| Supply and collateral | Supplying requires borrowing; earning supply interest and enabling collateral are the same action. | Enable collateral without opening a loan; identify capacity versus actual debt. |
| Borrowing and debt | Borrowed cash increases wealth; maximum LTV is the liquidation threshold. | A price decline passes the new-loan limit while remaining above the liquidation boundary. |
| Prices, interest and time | An unchanged ETH price means an unchanged loan. | Lower ETH’s price after interest accrues; interpret collateral value against the same debt. |
| Repay or add collateral | Adding collateral repays debt; both responses have the same effect for the same budget. | Repay all debt; distinguish absence of loan liquidation from absence of investment risk. |

The interest lesson deliberately uses zero supply APR so only debt grows. It does not claim time always lowers health factor: different rates on both sides can change that conclusion. The response lesson displays the already-calculated outcomes. Optional reading explains collateral rules, both balance-sheet sides, variable real rates and execution limits using [Aave supply guidance](https://aave.com/help/supplying/supply-tokens), [collateral guidance](https://aave.com/help/supplying/toggle-collateral-status) and [the protocol FAQ](https://aave.com/faq).

The lending lab additionally illustrates one liquidation event: debt repayment offsets part of the collateral removed, while the bonus reduces net assets. The compounding reference exposes how a fixed simple-interest assumption diverges over longer periods. These illustrations require no calculation from the learner.

All lending figures are hypothetical teaching cases with fixed simple interest and USDC = $1, separate from the verified liquidity records. They are not quoted Aave market parameters. Unit tests cover reference outcomes and every reasoning/application combination; browser checks cover wrong predictions, completion, exact handoffs, independent storage and mobile navigation. These checks establish consistency, not measured teaching effectiveness.

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

## Borrowing-loop chapter

Three directly accessible lessons follow lending essentials. They use `borrowing-loop-v1` and connect prediction, observation, explanation and application. All three use the visual patterns described below. Loop drafts and completion have their own storage key, preserving earlier lending progress. The scenario handoff carries all loop assumptions into a separate Experiment tab.

| Step | Misconception | Changed situation |
| --- | --- | --- |
| Build one loop | Extra borrowed ETH is new wealth; spent USDC remains in the wallet. | Pause before supplying purchased ETH; distinguish wallet assets from collateral. |
| Repeat and change conditions | More collateral means less price risk; unchanged prices mean an unchanged loan. | Hold prices fixed while debt accrues interest and supply interest is zero. |
| Explore unwinding | All collateral can be withdrawn first; withdrawing cancels debt. | Start below the liquidation boundary; the withdrawal-first preview stops. |

The first lesson removes costs and interest to isolate matching debt. The second compares the same original capital with more ETH exposure; no arithmetic is required from the learner. The last explains intermediate collateral constraints and labels the unwind as an assumed sequence, not guaranteed execution. Automated checks cover every answer combination and numerical references. They do not establish learning effectiveness.

## Visual lesson patterns · 1.23–1.28

Eleven lessons use the visual patterns: swaps, providing liquidity, changing token balances, narrow versus wide ranges, supplying, borrowing, prices/interest/time, repayment versus collateral, and building, stressing and unwinding a loop. The starting diagram and prediction question are visible immediately. **Choose an answer · optional** opens the choices before the exploration controls; answering or watching every step is never required. The sequence is **starting setup → visible question → exploration → explanation → changed situation**. The conceptual checks still determine completion, with no arithmetic or rounding task.

- **Actions:** one named action per activation, a short visual cue, then a readable resting frame. Back revisits an earlier state without animating an undo. Replay repeats the current cue without changing balances. Direct step access groups unwind actions into withdrawal/sale/repayment passes. There is no autoplay or animation queue.
- **Continuous conditions:** the token lesson changes the selected price while keeping both token quantities and their starting markers together. Arrows describe the net trades relative to the same start. The price slider is an endpoint comparison, not a recorded trading path.
- **Comparison:** narrow and wider bands share one price scale and marker position. Bounds are directly selectable; exact boundaries are labelled separately from inside/outside states. Single-token principal remains visible outside the range. Inside means eligible to earn from swaps, not a claim about earnings.

The swap scene tracks both reserves and the changed pool price. Its three comparison rows show the starting price, a 1 ETH trade’s average, and the selected trade’s average on the same scale. Both trades start from the same original pool and include a 0.3% fee. The deposit scene adds both tokens proportionally, shows the unchanged price and share of the enlarged pool, then shows a different trader selling ETH into it. The hatched fraction stays constant through that swap while the claim becomes more ETH and less USDC. Claims use proportional ownership before withdrawal rounding; this is a hypothetical lesson, not on-chain LP-token accounting or a fee forecast.

The lending supply scene shows ETH leaving the wallet for a claim on the pool, then interest accruing to that supply with collateral off. Enabling the already-accrued supply changes borrowing capacity without moving tokens or creating debt. The separate borrowing scene adds equal wallet cash and debt; the remaining capacity falls and assets minus debt stay unchanged before costs. The source of borrowed tokens is the lending pool. Supplied balances represent a claim, explained further with [Aave's receipt-token accounting](https://aave.com/docs/aave-v3/smart-contracts/tokenization); they are not additional spendable ETH in the wallet.

Exploratory amounts, prices and collateral stages never edit the question, its saved answers or its Experiment link. **Question amount** or **Question** returns to its input; opening the explanation also restores the assessed frame. **Change the question trade size/deposit/price** explicitly changes that setup and invalidates its earlier result and answers. Reload restores answers and completion, even when no prediction was made. Build/unwind scenes restart at the beginning; the revealed loop-stress scene restores the original price question; revealed liquidity foundations reopen just after the question’s swap or deposit, and price examples reopen at the question price. Revealed supply/borrow lessons reopen at the one-year collateral-off balance or the new loan, respectively. The conditions lesson reopens at one year with ETH’s price unchanged; the response lesson restores the $1,000 comparison. Their Experiment links keep these fixed cases even after enabling collateral or revisiting an earlier stage. The swap/deposit links still open the independent virtual sandbox; exact setup transfer applies to the price/range and lending handoffs.

Wallet assets, collateral and debt remain distinct. Borrowing highlights cash and matching debt; the debt card is never the source of tokens. Unwind health factor and the remaining collateral constraint stay visible. Detailed deltas and costs are optional. Reduced motion keeps the same completed frames, labels and arrows. Price controls are native keyboard/touch sliders; step controls are native buttons with named destinations and concise announcements.

The loan conditions scene isolates one variable at a time. Time runs from day zero to one year at $2,000 per ETH, with zero supply interest and 10% simple borrow interest. The price comparison holds the resulting 5 ETH and 5,500 USDC debt fixed. Both bars use a single unchanged dollar scale: collateral value weighted by the assumed 80% liquidation threshold, versus debt value. Their ratio is the health factor, following [Aave's definition](https://aave.com/help/borrowing/liquidations). Equal bars mean 1; the $1,375 boundary is exact. Labels preserve below/above distinctions when a nearby value would round to 1.00. The original token quantity and added interest remain visible, and wallet cash does not pay the interest automatically. The dashed reference is day zero in Time mode and the unchanged-price one-year result in ETH price mode. Moving below the boundary and back does not establish that a real loan survived such a path.

The response lesson compares two alternatives from the same 5 ETH / 5,000 USDC loan at $1,500 per ETH. A single extra-budget slider funds each alternative independently. Repayment reduces debt without changing the supplied ETH; buying and supplying ETH increases collateral without changing debt. Shared dollar scales and original-balance markers connect these changes to health factor. Full repayment shows **No debt**, keeps the ETH supplied and retains unused cash if the budget exceeds the debt. Cash already borrowed stays separate. Immediate net assets increase only by the outside budget; neither response creates profit. Execution, costs, liquidation timing and future returns are not simulated.

The loop-stress lesson compares holding the original 5 ETH with a three-round loop: 9.375 ETH and 8,750 USDC debt. Both start with $10,000 after debt, without additional capital or retained borrowed cash. Price changes keep tokens fixed; gain/loss bars extend from the same zero on a fixed dollar scale. The $1,500 question gives $7,500 for holding and $5,312.50 for the loop, whose health factor remains above 1. This separates price loss from liquidation eligibility. The separate Time example uses the original $2,000 price, 0% supply APR and 10% borrow APR with continuous compounding for up to one year; it explicitly shows zero supply interest and growing debt. Those are teaching assumptions, not live rates. Mode changes start fresh examples and never edit the assessed case or accumulate history.

## Extending the patterns

Use these four forms rather than forcing every subject into an animation:

| Lessons | Next visual treatment |
| --- | --- |
| Loss versus profit, fees and final challenge | Compare starting capital, holding and LP totals on a common scale. Keep assumed income separate from required fees. |
| Concentrated liquidity and exits/returns | Reuse the price/range scene; add token composition and outside price exposure, then management costs. |
| Fee tiers and APR | Reveal supplied facts and visibly missing information; never derive fee income from the tier alone. |
| Historical lessons | Use recorded checkpoints. Separate principal, new fees and collection; keep unknown intervals unknown. Active-time totals do not establish crossing times. |

Next extend interpretation and changing-condition lessons, then evidence lessons. Each visual should replace repeated setup/result prose, retain essential assumptions nearby, and offer a changed-situation check. Keep the same starting basket within each comparison; equal budgets across ranges do not imply identical token mixes.

Automated checks establish accounting and interaction consistency, not improved learning. In an observed session, pause after enabling collateral and ask whether cash or debt appeared; after borrowing, ask why more wallet cash did not increase net assets. Pause after selling ETH and ask whether debt changed; after repayment, ask where collateral remains. For the loan conditions lesson, ask which token balance changed after interest, then which value changed after a price fall. For the response lesson, ask where the extra cash went in each column and where the ETH remains after full repayment. Ask what stays exposed to ETH’s price; a larger health factor is not a return forecast. For the loop comparison, show a loss while health factor remains above 1 and ask what each measure tells you. Then hold price still and ask which balance grows. For liquidity, reverse the price direction and ask which token enters the pool. For ranges, show a new price and ask what being inside establishes about fee income. Look for a mechanism explanation rather than recall of displayed numbers.
