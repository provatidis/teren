# Release history

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
