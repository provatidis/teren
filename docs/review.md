# Review questions and open blind spots

[Project decisions](../DECISIONS.md) · [Models](models.md) · [Learning evidence](learning.md)

Review this list before expanding a mechanism. Discuss newly found omissions with the owner, including an omission that is deliberately retained. Passing arithmetic and browser tests does not establish that people learn the intended idea.

## Questions for a mechanism release

- What conclusion could a learner draw from the headline number that the model cannot support? Put the decisive assumption beside that result.
- Which excluded event could change the conclusion: liquidation, changing fees or rates, a previous range exit, execution costs or an unavailable response?
- What happens at the exact boundary, on each side, with no debt, with tiny balances, or when an asset is exhausted? Preserve obligations rather than silently discarding them.
- Do headings and status labels still describe the result with zero rounds, a blocked action or a partial response? Correct arithmetic can still be misread as completed execution or forgiven debt.
- Are cash and debt both counted? Are repayment and penalties separate? Are fees, principal and already owed tokens kept distinct?
- Does a chart compare possible prices, connect recorded samples, or reconstruct a path? Label the distinction in the visible explanation.
- Which checks validate arithmetic, which re-read chain state, and which were performed by another person? Give capture/check dates without implying a new verification run.
- What did the observed learner understand before and after? Which changed situation would reveal an unresolved misconception without requiring calculations?
- Can a returning visitor load one coherent release, resume a lesson, retain a draft and give feedback without an account?

## Open after 1.18.0

| Blind spot | Current treatment | Evidence needed before extending the claim |
| --- | --- | --- |
| Teaching effectiveness | Positive informal feedback; no observed before/after learning sessions yet. | Watch a few learners explain a changed situation after a lesson. |
| Real liquidation outcomes | One assumed event at a selected price; no close-factor/dust rules, execution path or shortfall resolution. | A separate protocol-specific model and reference cases, including depleted collateral. |
| Real interest | Simple-interest model plus a constant-rate continuous-compounding reference. | Reserve indexes, rate updates, timestamp handling and contract rounding for a named deployment. |
| Fee plausibility | Hypothetical fee targets and two short recorded cases. No annualized yield claim. | More varied, longer cases with capital- and period-aware comparisons. A full-range reference would need its own defined scope. |
| Live coverage | Ethereum WETH/USDC on Uniswap v2/v3. | A deployment requested by users, with token/decimal/configuration checks before broadening import support. |
| Historical authenticity | Records checked at capture; reproduction script and optional CI recheck report. | Successful dated rechecks or an outside reproduction; the existence of the workflow is not proof it ran. |
| Release continuity | Complete content hashes and preload hints; no indefinite archive of prior hashed assets. | Test returning/open tabs across a deployment; retained prior assets if real failures justify that machinery. |
| Feedback email | Public mail link to hello@teren.sh; domain has mail-routing MX records. | Confirm the recipient/forwarding alias and an actual delivered message; the website cannot establish delivery. |

## Before looping

Carry both asset and debt exposure through every loop. Separate borrowed cash, reinvested proceeds and any outside funds. Show how repeated borrowing changes liquidation sensitivity and how rates or execution costs can reverse the result. Use the liquidation illustration as an explanation, without silently upgrading it into a protocol execution engine.

## Looping release review · 1.19.0

- Tested misleading interpretations: borrowed cash cannot remain after its purchase; added collateral can improve health factor without removing extra ETH exposure; withdrawing collateral happens before sale proceeds can repay debt.
- The loop uses the same original-capital benchmark. Construction and unwind swap losses remain separate; interest grows the appropriate tokens and debt. References, boundary checks and varied-input conservation tests establish accounting consistency.
- Retained blind spots: all construction rounds use one price, rates stay constant, unwind uses a fixed-price teaching withdrawal rule, and neither preview proves transaction execution or survival of earlier prices. No live lending adapter or verified lending record has been added. Gas, liquidity constraints and liquidation ordering remain excluded.
- Next learning evidence: ask a learner to explain where borrowed cash went, why net assets did not grow at construction and why an unwind can stop. No observed learning outcomes are claimed by the tests.

## Comparison and learning review · 1.20.0

- Compare round counts with identical capital, market conditions and assumptions. Do not present a higher endpoint value as a recommendation: show debt and liquidation sensitivity alongside it, including adverse and supply-only cases.
- Keep the reference distinct from holding, particularly when a zero-round supplied position earns interest. Links and drafts must preserve which comparison is shown.
- The first lesson's step-through targets a specific misconception: bought ETH remains a wallet asset until supplied, and more collateral does not by itself create wealth. The ledger supplies every displayed balance; stage navigation adds no grading or calculation task.
- Retained blind spots: the comparison still has fixed rates and endpoint prices, with no price path, liquidation execution or real-market borrowing opportunity. More interaction is not evidence of better understanding. In the next observed session, ask the learner to explain the wallet-versus-collateral distinction and what changes when a price move acts on more borrowed exposure.

## Unwind money flow review · 1.21.0

- Targeted misconceptions: a withdrawal does not repay debt; selling ETH does not automatically use the proceeds to repay; debt-free collateral remains supplied until withdrawn. The eight-stage lesson keeps each of those intermediate balances visible.
- Check that only sales incur the assumed swap loss, withdrawals and repayments conserve net assets, and the final wallet transfer appears only after full repayment. Blocked and partial previews retain unpaid debt. The action ledger does not alter the existing aggregate results.
- Retained blind spots: the fixed-price preview still excludes gas, liquidity restrictions, protocol-specific execution and liquidation ordering. Its final transfer is an assumed available withdrawal, not a claim that a real pool can execute it. A health factor above 1 is not a guarantee of a safe strategy.
- Next learning evidence: pause just after a sale and ask what is in the wallet and whether debt has changed. Then pause after repayment and ask where the remaining ETH is. No calculation or rounding is needed.

## Visual loop review · 1.22.0

- The diagram is available before answering. Its arrows explain asset transfers, not execution or a continuous transaction simulation. Borrowed tokens do not come from the debt card; that card records an obligation. Only adjacent forward steps animate, and reduced-motion mode keeps the same labels and balances.
- Keep a short explanation beside each scene, with detailed accounting available below. The three areas and their labels carry meaning without relying on color or animation. Saved completion and answers remain compatible.
- Retained blind spots: the example still uses a fixed price and teaching withdrawal rule. It does not establish liquidity availability or successful execution. One person's preference for visuals is design input, not learning evidence; the next observed session should test the sale-versus-repayment and wallet-versus-collateral distinctions without asking for arithmetic.

## Visual lesson patterns · 1.23.0

- Four pilots separate discrete action playback from continuous price exploration. Optional predictions precede controls; explanation/application still determine completion. Replaying, dragging or jumping does not grade a lesson or edit its question.
- Token frames must show both quantities, correct trade direction relative to the same start, and no token creation. Reversing the slider does not accumulate a fictional history. Range frames use each position's own starting basket and distinguish exact edges; activity alone establishes no fee income. Historical records and their evidence are unchanged.
- Keep the unwind's unpaid debt and collateral constraint visible. A sale changes wallet assets before repayment changes debt; final release follows repayment. Brief motion adds no interpolated financial state and is optional. Rapid input cancels earlier cues rather than queuing actions.
- Review mobile scene/control proximity, meaningful keyboard focus, 44px targets, copied-text spacing and restoration without a prediction. The native price slider must stay still during touch dragging.
- Retained blind spot: cleaner visuals do not establish comprehension. Before rolling this out to all lessons, use changed-direction and paused-action prompts to check the actual mechanism explanation. Fixed prices, simplified withdrawal rules and unmodelled real execution remain teaching limitations.

## Visual liquidity foundations · 1.24.0

- Keep the starting pool price distinct from the average received on a finite swap. Larger trades receive more total USDC but less per ETH against the same reserves. The full ETH input remains in reserves, including the 0.3% retained fee.
- A matching deposit preserves price and obtains a fraction of the enlarged pool. A later trade changes token amounts without changing that fraction. Another provider’s later deposit is a different event and can reduce the fraction; the changed-situation question checks this distinction.
- Show the ownership percentage beside the bars and identify the later trader explicitly. Token labels, shapes, dashed start markers and hatching must remain readable without motion or color alone. Prediction questions stay visible while choices remain optional. Exploration must preserve assessed inputs and saved answers.
- Retained blind spots: proportional ownership omits LP-token mint/burn rounding; the single hypothetical trade is not a fee-income estimate. A useful learner check is to ask what happens to the share percentage after a swap versus another deposit, and why the two answers differ. Passing accounting and interaction tests does not establish that learning outcome.

## Visual lending foundations · 1.25.0

- Supplying transfers wallet ETH into a pool claim; do not count the claim again as spendable wallet ETH. Interest accrues to the supply with collateral off. Enabling collateral changes borrowing capacity without moving tokens, creating debt or accruing interest twice.
- Borrowing adds cash and matching debt together. Remaining borrowing capacity decreases; the total borrowing limit is a different number. Neither capacity nor received cash establishes profit. Distinguish the limit on new loans from the liquidation threshold for existing debt.
- Keep each fixed question and Experiment link separate from explored stages. Check optional-prediction completion, existing saved answers, exact links, keyboard/replay controls, reduced motion and small-screen readability alongside accounting conservation.
- Retained blind spots: rates and collateral rules are fixed teaching assumptions; actual supply interest, eligibility, available liquidity and costs can differ. The scene simplifies receipt-token accounting and does not establish executable borrowing capacity. Ask a learner what changes immediately when collateral is enabled, then why receiving borrowed cash does not create wealth. Test that explanation without requiring arithmetic; automated checks do not establish comprehension.

## Loan conditions scene · 1.26.0

- Test two different mechanisms: time adds debt without spending the wallet cash, while a price fall changes collateral value without removing ETH or reducing debt. Zero supply interest deliberately isolates the first mechanism; other rates can change time's effect on health factor.
- The backing bar counts 80% of collateral value under this example's liquidation rule. It is not the full collateral value or the separate limit on new borrowing. Both bars and reference markers use one stable dollar scale; equal lengths correspond to health factor 1. Preserve exact boundary labels and below/above distinctions near rounding thresholds.
- Keep the assessed year at the unchanged price separate from exploration. Below-boundary balances are before liquidation. Returning to a higher price is a fresh comparison and must not imply that a real position survived or recovered collateral after liquidation.
- Retained blind spots: fixed simple interest, fixed rules and a chosen valuation price do not reproduce variable rates, oracle updates or real execution. A learner should be able to explain what changed after time versus after price, and why unchanged token quantities do not imply an unchanged health factor. No calculation is needed; accounting and browser tests do not establish that understanding.

## Visual response comparison · 1.27.0

- Compare two alternatives, each starting with the same original loan and the same outside budget. Do not split the budget between columns, reuse cash after spending it or treat extra funding as profit. Tests include all assets, debt and unused external cash.
- Repayment changes debt; adding collateral changes ETH quantity. Full repayment leaves the original ETH supplied, with no loan liquidation boundary. Cash above the debt remains available rather than being lost or counted as additional repayment. Both branches retain exposure to the ETH they still hold.
- Show both outcomes on one stable dollar scale, with unchanged start markers. Optional prediction and exploration do not edit the fixed question, exact Experiment handoff or saved answers. The slider and comparison fit together at 320px/390px; changes must not move the slider during a touch drag.
- Retained blind spots: immediate zero-cost responses assume execution before liquidation, and a higher health factor does not predict returns or eliminate protocol/asset risk. The model has no new protocol execution rules. Ask a learner where the money went and where the ETH remains after full repayment; automated checks establish consistency, not this understanding.

## Visual loop exposure review · 1.28.0

- Compare the same original ETH capital: loop purchases come with matching debt, and spent USDC cannot remain as cash. Gains and losses use that original capital, not the larger gross collateral value. Tests check both price directions and a loss while health factor remains above 1.
- Keep health factor separate from investment performance. Exact and adjacent boundary cases retain balances before liquidation; moving back above the boundary does not imply that a real position survived earlier prices.
- The Time example explicitly changes the interest assumptions while resetting price to its original value. Supply interest stays zero and debt compounds at a fixed 10% APR; the question and Experiment link retain zero interest and the $1,500 price. Mode changes and slider reversals never compound a previous frame or persist exploration.
- All seven lending/loop lessons now follow visual setup, optional prediction, exploration, explanation and a changed-situation check. The sequence moves from balances to conditions and responses, then loop construction, exposure and unwind constraints. The two conditions lessons share controls but answer different questions: health-factor mechanics versus extra price exposure from borrowed ETH.
- Retained blind spots: these are endpoint teaching comparisons with fixed rates, zero construction costs in this lesson, and no liquidation execution or historical survival claim. Ask a learner why a loop can lose more value before it becomes eligible for liquidation, and what changes when prices stay still. Passing checks does not establish that understanding.
