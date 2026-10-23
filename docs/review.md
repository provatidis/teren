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
