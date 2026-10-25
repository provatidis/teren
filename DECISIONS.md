# Product decisions

These are durable working choices, not a feature backlog. Revisit them when evidence or the user’s direction changes.

- Teren helps people understand DeFi mechanisms and test assumptions. Guided learning and direct exploration belong in one app, with Liquidity and Lending as distinct topics.
- Teren takes its name from Pontic Greek τέρεν, “look.” Keep the founder’s heritage to a short About explanation. Use the custom wordmark as the main identity and the separate open-t symbol for compact uses.
- Rebranding preserves existing browser-storage keys, scenario versions and file-format identifiers. Those are compatibility contracts, independent of visible names and download filenames.
- Complexity increases predictably across examples. Advanced cases and every lesson remain directly accessible.
- Learn links carry their setup into Experiment. Learning progress, virtual balances, model drafts and recorded snapshots remain independent.
- Give each task a focused workspace. Preserve public fragments, existing storage schemas and working drafts during navigation.
- Explain the result plainly. Keep essential assumptions nearby; put derivations and detailed accounting in optional disclosures.
- Treat hypothetical models, recorded single-block snapshots and independently checked historical accounting as different kinds of evidence.
- Keep chain reads read-only and block-pinned. Use integers for contract accounting and pure models for calculations.
- A holding comparison uses that experiment’s exact starting token basket. Fees, withdrawn principal and recorded owed balances must not be conflated.
- Declare historical dates, eligibility and candidate order before inspecting outcomes. Retain low fees, inactivity and losses; provider failure is incomplete evidence, never zero income.
- Verify one bounded historical case before presenting editable replay. Hourly price samples alone do not establish arbitrary-range fee earnings.
- Keep the frontend static while that serves the product. Add dependencies or maintained data services when their benefit justifies their cost.
- Prefer depth and clearer workflows before more chains, wallet discovery or library features.
- Expand lending in stages. First teach one collateral asset, one debt asset, interest and liquidation boundaries; then consider looping. The first loan model is explicitly hypothetical, with fixed simple interest. Independently verified lending accounting needs a separate adapter and evidence before it can appear in Inspect.

Technical references: [models](docs/models.md), [data](docs/data.md), [development](docs/development.md).

- Learn completion checks explanation and application of the concept. Predictions are ungraded; calculations and rounding practice stay optional in Go deeper. A changed historical setup is a labelled thought experiment, separate from verified accounting.

- Practical range lessons follow the essentials before historical accounting. Fee-rate examples use explicitly supplied fictional totals; no fee forecast is inferred from endpoint prices. Each range keeps its own starting basket. Essential misconceptions stay visible in the normal lesson flow.

- Review blind spots with each mechanism release: identify interpretations that could remain wrong even if arithmetic passes, test boundary cases, and report unmeasured learning or execution assumptions. Keep a short open list in `docs/review.md`; passing tests establish consistency, not teaching effectiveness.
- Keep the endpoint loan model compatible. Illustrate liquidation as an explicitly assumed event with separate state and versioned link fields. Preserve remaining debt when collateral is exhausted; distinguish repayment from the bonus cost.
- Production assets use generated content hashes throughout the dependency graph. Source stays readable, the published site remains static, and CI tests the generated output on supported Node versions.
- Borrowing loops use a separate versioned model and draft. Track borrowed cash until it is spent, then track the purchased ETH; never count both. Compare net value against the same original capital and keep price exposure separate from health factor. Unwinding must show the withdrawal before sale and repayment, with execution assumptions and remaining debt visible.

- Lessons invite an expectation with the question and choices visible together. Predictions are ungraded and optional, with a clear “Not sure — show me” route. Keep the sequence: form an expectation, observe the mechanism, explain the result and apply it to another situation. Judge review suggestions against that sequence; a smoother interface alone does not establish better learning. Use named steps for discrete actions, sliders for amounts or continuous conditions, comparisons for trade-offs, and recorded timelines for evidence. Never force animation viewing to unlock learning. Exploratory frames stay separate from assessed inputs and handoffs. Exact setup transfers remain scoped to the models that support them; swap/deposit lessons open the independent sandbox.

- Home orients visitors by topic before mode. Both learning and direct experimentation are available immediately. Mode navigation stays within its named topic; recorded Inspect remains scoped to liquidity. Existing shared links continue to resolve.

- Review experienced users’ tasks alongside beginner comprehension. Home gives experimentation and guided learning equal standing. Keep repeatable personal work—saved assumptions, variations, comparisons and return visits—available without lessons. Shared-condition comparisons must expose exactly which choices differ; saved scenarios with different conditions must say so.
- Controlled width experiments hold capital, starting price, initial token basket and endpoint price equal. Use reciprocal bounds to preserve a 50/50 starting basket. Their principal results and fee hurdles are hypothetical; never transplant recorded NFT fees onto these altered ranges.

- Hypothetical fee allocation captures explicit trading batches and retains fee tokens separately. Preserve per-batch assumptions, exclude previews from totals, and distinguish token accrual from later USD revaluation. A fixed-price fee split is not a swap engine, historical replay or earnings forecast; do not silently replace that scope with a stronger claim.

- Fee competition must expose where other LPs place capital, not just its dollar total. A chosen competitor range remains hypothetical; a current active-liquidity snapshot is not a historical path. Legacy full-range assumptions retain their original meaning.
- Explain arbitrage and temporary liquidity with optional visual mechanisms. Holding and rebalancing are separate benchmarks; do not add IL and LVR as independent costs.
- At the next roadmap discussion, revisit correlated-asset/LST looping first. Focus on staking income versus borrow cost, changing rates and relative asset prices before adding live protocol adapters. Keep the priorities and deferred scope in [the roadmap](docs/roadmap.md).
