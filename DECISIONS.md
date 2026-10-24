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

- Visual lessons start with a readable setup and a visible prediction question; opening its choices and answering remain optional. Use named steps for discrete actions, sliders for amounts or continuous conditions, comparisons for trade-offs, and recorded timelines for evidence. Never force animation viewing to unlock learning. Exploratory frames stay separate from assessed inputs and handoffs. Exact setup transfers remain scoped to the models that support them; swap/deposit lessons open the independent sandbox.

- Home orients visitors by topic before mode. Both learning and direct experimentation are available immediately. Mode navigation stays within its named topic; recorded Inspect remains scoped to liquidity. Existing shared links continue to resolve.
