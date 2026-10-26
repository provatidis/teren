# Product decisions

These are durable working choices. Revisit them when evidence or the owner's direction changes. Candidate features belong in [the roadmap](docs/roadmap.md), current validation priorities in [the review](docs/review.md), and dated changes in [the changelog](CHANGELOG.md).

## Product and access

- Teren helps people understand DeFi mechanisms and test assumptions. Guided learning and direct exploration belong in one app, with Liquidity and Lending as distinct topics.
- Teren takes its name from Pontic Greek τέρεν, “look.” Keep the founder's heritage to a short About explanation. Use the custom wordmark as the main identity and the separate open-t symbol for compact uses.
- Home orients visitors by topic before mode. Experimentation and guided learning have equal standing; mode navigation stays within its named topic. Recorded Inspect remains scoped to liquidity.
- Complexity increases predictably across examples. Advanced cases, every lesson and repeatable personal work remain directly accessible. Saved assumptions, variations, comparisons and return visits must work without completing lessons.
- Give each task a focused workspace. Preserve public fragments, working drafts and the independence of learning progress, virtual balances, model drafts and recorded snapshots during navigation.
- Prefer depth and clearer workflows before more chains, wallet discovery or library features. Review experienced users' tasks alongside beginner comprehension.

## Learning and explanation

- Explain results plainly. Keep decisive assumptions and essential misconceptions nearby; place derivations and detailed accounting in optional disclosures.
- Before a prediction, show the starting balances, the action or condition being tested, and what stays fixed. Give explicit feedback when the outcome is revealed. Recorded lessons introduce the position first; questions about a particular historical outcome require the relevant evidence, rather than a guess about hidden data.
- Invite an expectation with the prediction question and choices visible together. Predictions are ungraded and optional, with a clear “Not sure — show me” route. Completion checks explanation and application; arithmetic and rounding practice stay optional in Go deeper.
- Keep the sequence: expectation, observation, explanation and application to a changed situation. Use named steps for discrete actions, sliders for continuous conditions, comparisons for trade-offs and recorded timelines for evidence. Never require animation viewing to unlock learning. A smoother interface alone does not establish better understanding.
- Exploratory frames stay separate from assessed inputs and handoffs. Learn links carry exact setups only where the destination model supports them; swap/deposit lessons open the independent sandbox. Practical range topics follow the essentials before historical accounting. A changed historical setup is a labelled thought experiment.

## Evidence and accounting

- Distinguish hypothetical models, recorded single-block snapshots and historical accounting checked against chain evidence. Keep chain reads read-only and block-pinned; use integers for contract accounting and pure models for calculations.
- A holding comparison uses that experiment's exact starting tokens. Separate fees, withdrawn principal, recorded owed balances and dollar change. Shared-condition comparisons expose which choices differ; saved setups with different conditions must say so.
- Declare historical dates, eligibility and candidate order before inspecting outcomes. Retain low fees, inactivity and losses. Provider failure is incomplete evidence, never zero income. Verify bounded fixed-position cases before extending to editable historical ranges; hourly prices alone cannot establish their fee earnings.
- Lending grows from one collateral/debt pair to loops through separately versioned hypothetical models. Live lending Inspect requires its own adapter and independently checked accounting. Keep the endpoint single-loan model compatible, with simple interest and a separate assumed liquidation event. Retain debt after collateral exhaustion and distinguish repayment from the bonus cost.
- ETH/USDC loops track borrowed cash until purchase, then the purchased ETH; never count both. Keep original capital, interest and price exposure separate from health factor. Their sequential unwind checks withdrawal constraints before sale and repayment, retaining obligations when it stops.
- Correlated-asset loops have a separate wstETH/WETH model, draft and comparison family. Count staking through conversion growth, optional lending yield through token quantity, and WETH debt separately. Keep sale and oracle prices distinct, flag earlier rate-only boundaries and retain every obligation in an atomic exit. Protocol settings require separate adapters and evidence.
- Loan and ETH/USDC loop liquidation illustrations share event arithmetic on already accrued balances. Single loans retain borrowed wallet cash; loops have spent it. Event assumptions are saved separately from the original model inputs, and illustrations never mutate pre-liquidation endpoints or unwind previews. New LST setups use conversion-rate valuation; saved oracle choices remain explicit.
- Hypothetical fee allocation uses explicit fixed-price batches, retains fee tokens separately and excludes previews from totals. Expose competitors' placement as well as capital. Chosen ranges are assumptions; a current snapshot is not a historical path. Preserve legacy full-range meanings. These allocations are not swap execution or earnings forecasts.
- Explain arbitrage and temporary liquidity with optional mechanisms. Holding and rebalancing are different benchmarks; do not add IL and LVR as independent costs. Fictional fee-tier totals remain supplied teaching facts.

## Engineering and upkeep

- Keep the frontend static while that serves the product. Add dependencies or maintained services when their benefit justifies their cost. Separate models, data, utilities and UI.
- Rebrands preserve storage keys, scenario versions and file-format identifiers. They are compatibility contracts independent of public names. New models and schemas need explicit versioning and migrations where required.
- Generate production content hashes throughout the dependency graph and test the generated output in CI. Source stays readable, and storage identity remains independent of asset URLs.
- Review blind spots with each mechanism release: misleading interpretations, accounting boundaries and execution assumptions. Report newly found omissions, including deliberately retained ones. Keep [Review](docs/review.md) concise and current; preserve dated observations in [its archive](docs/review-history.md). Automated checks, chain verification and observed understanding establish different things.

Technical references: [models](docs/models.md), [data](docs/data.md), [learning](docs/learning.md) and [development](docs/development.md).
