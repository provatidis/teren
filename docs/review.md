# Review status, evidence gaps and limitations

Assessed against **Teren 1.39.1, 25 October 2026**. This maintainer assessment draws on the implementation, committed records and automated checks. This documentation revision introduces no new chain capture, external audit or observed-user study.

[Project overview](../README.md) · [Models](models.md) · [Learning and observation plan](learning.md) · [Roadmap](roadmap.md) · [Historical reviews](review-history.md)

## Current assessment

Teren provides a coherent way to learn DeFi mechanisms and test personal assumptions. Liquidity and lending both support direct experimentation without completing lessons. The lesson sequence connects an expectation, a visible mechanism, an explanation and a changed situation. Saved variations, exact setup links and topic navigation support returning experienced users as well as newcomers.

The strongest established work is explicit accounting under stated assumptions: token ownership, matching assets and debt, exact starting-basket comparisons, and separate principal and fee balances. Recorded liquidity cases add bounded historical observations with reproducible accounting checks. Model, data and UI responsibilities remain separated; the static deployment has automated release checks and no wallet transactions.

The most useful next validation is how people interpret and reuse these results. New protocols or broader history should answer a specific user question and bring the evidence needed for that stronger scope. A deliberately bounded model can already answer useful questions within its assumptions.

## Evidence and what it establishes

| Evidence | Established scope | Boundary |
| --- | --- | --- |
| Model arithmetic and accounting | [Reference and invariant tests](../test/) check formulas, conservation, rounding, boundaries, remaining obligations and reproducible inputs. Continuous scenario models use floating point; v3 contract accounting uses integer units. | Passing covered cases is not a formal proof or an external audit. |
| Automated interactions | [Browser checks](../scripts/browser/) exercise navigation, keyboard/touch input, persistence, imports, links and recovery at desktop and narrow-phone sizes. [Release CI](../.github/workflows/pages.yml) checks supported Node versions and the generated site. | Emulation does not establish actual-device accessibility, field performance or understanding. |
| Recorded blockchain evidence | [Capture procedures and records](replay.md) preserve blocks, counters, complete position-event coverage, collection simulations and, where applicable, receipt payments. Separate calculation/check methods support the recorded accounting. | These are checks at capture, not an outside audit or a fresh Ethereum query on every page load. |
| Repeat verification | [Read-only scripts and a manual CI workflow](replay.md#recheck-the-bundled-evidence-in-ci) can recapture and compare the bundled cases. | A dated successful report establishes a recheck; the existence of a script does not. File validation alone cannot authenticate chain origin. |
| Informal feedback | The owner reports positive reactions from a few experienced DeFi friends, including interest in lessons. | This is useful qualitative input, not a representative sample or measured learning result. |
| Observed understanding and repeat use | [Concrete observation tasks](learning.md#observation-plan) are defined for learners and experienced users. | No documented sessions yet establish transfer to unfamiliar situations or repeated practical use. |

Independent accounting methods should not be described as independent human review. Keep those meanings explicit when adding evidence.

## Meaningful boundaries

**Liquidity experiments.** Endpoint labs compare a position with its exact starting tokens; assumed cash fees remain inputs. The controlled width experiment equalizes capital and the starting basket. Follow the fees instead calculates token allocation from chosen fixed-price batches and an illustrative competing range. It retains earned tokens after exits. These models do not establish attainable volume, real liquidity distribution, price impact during a batch or historical earnings for edited ranges. Arbitrage and JIT illustrations explain mechanisms; no LVR estimate is deducted from the holding comparison. See [models](models.md#hypothetical-fee-flow--cl-width-fees-v2).

**Recorded liquidity.** Inspect supports Ethereum mainnet WETH/USDC on Uniswap v2/v3. Historical evidence includes three unchanged-position cases and a two-position matched week with collections. The inactive week is deliberately retained: it earned no new fees and matched holding while losing dollar value. The matched pair differs in placement and starting mix, so it cannot isolate width or establish typical yields. Valuation assumes USDC = $1 and excludes gas and incentives. Collected tokens are valued as retained; recipient trading, active liquidity changes and lifetime PnL are outside these records.

**Lending and loops.** All three models remain hypothetical. The single loan uses simple interest; ETH/USDC loops offer simple interest or continuous compounding; wstETH/WETH loops separate staking conversion growth, optional lending yield and two-phase borrow APR. Rates, collateral rules and oracle choices are editable assumptions. The LST model detects earlier rate-only liquidation boundaries, while its market discount is an endpoint shock. Neither loan endpoints nor a completed unwind establish survival of a real path or executable withdrawals, flash loans and swaps. Protocol-specific limits, utilization-driven rates, oracle behavior and execution liquidity need their own adapters. [Model documentation](models.md) and [LST accounting](lst-loops.md) retain the detailed exclusions, costs and remaining-debt rules.

**Operational reach.** Keyboard, narrow-screen and native-touch checks exist; actual Android Chrome and assistive-technology workflows still need observation. Public RPC availability can interrupt live imports; saved files and bundled records work locally. Older open tabs may need reloading after a deployment because old hashed assets are not retained indefinitely. [Development](development.md) documents this policy; real failures should guide any added retention machinery.

## Resolved concerns and next attention

Earlier reviews identified confusing entry routes, uneven comparison visuals, weak fee context and the absence of a same-period reference. Home and direct lesson entry, visual comparisons, the fee-flow experiment, the inactive week and the matched pair now address those concrete gaps. Their accounting and interactions have checks. The remaining questions concern interpretation, representativeness and real execution; they should not be presented as missing shipped features. [Historical reviews](review-history.md) retain the original findings and [release history](../CHANGELOG.md) records their treatment.

1. **Observe useful understanding and reuse.** Use a small selection from the observation plan with newcomers and experienced users. Record explanations, mistaken inferences and navigation difficulties without arithmetic tasks or coaching first. Check that the public feedback mailbox actually delivers when arranging sessions; a mail link or MX record alone establishes no delivery.
2. **Exercise real access paths.** Check Android Chrome and a keyboard/screen-reader workflow through a lesson, a changed experiment and a return visit. Measure deployed loading under stated conditions before making performance claims.
3. **Define the next stronger claim before building it.** For protocol-specific loops, specify market identity, rates, oracle, liquidation and exit rules. For editable historical ranges, specify swap/path and changing-liquidity evidence. Keep those choices in [the roadmap](roadmap.md), rather than treating every model exclusion as a commitment.

Update this assessment when scope or evidence changes. Keep detailed observation prompts in Learning, durable constraints in Decisions and dated reviews in the archive. Preserve negative results and raise newly discovered omissions with the owner.
