# Development and architecture

[Project overview](../README.md) · [Product decisions](../DECISIONS.md)

## Run

Requires Node.js 22 or newer. No dependencies or installation step are needed.

```sh
git clone https://github.com/provatidis/teren.git
cd teren
npm start
```

For an existing clone, pull the latest `main` and run `npm start` from its checkout directory. No installation step is needed.

The HTTP server defaults to loopback port 3000. Set `HOST` and `PORT` to change its binding. It serves `public/` by default. Set `SITE_DIR=dist` after `npm run build` to inspect the production output. To verify it:

```sh
curl --fail http://127.0.0.1:3000/
```

Open http://127.0.0.1:3000/ in your browser. The hypothetical labs, lessons and bundled recorded cases work without an external network connection. Live snapshots and the development-only chain verifiers need RPC access. No wallet, API key or locally running blockchain node is required.

## Test

```sh
npm test
```

Tests cover the sandbox and hypothetical liquidity and lending models, versioned links and exports, v2/v3 snapshot validation, exact v3 fee accounting, fixed-position period accounting and continuity evidence, essential and applied learning assessments, saved comparisons, Learn-return drafts and storage failures. The bundled historical records are checked locally without RPC calls; `npm run check:replay` separately recaptures and verifies chain history through public providers.

For a local browser smoke test, install Chromium or set `CHROMIUM_BIN` to its executable, then run `npm run test:browser`. It starts temporary servers and checks actual page interactions at desktop and mobile sizes, including calculators, learning, snapshot imports, saved comparisons, the historical checkpoint slider, downloads and persistence. Navigation checks cover sticky-header offsets, direct tool fragments, browser history and returning from Learn. The same suite runs in CI before deployment. Its mobile routing checks use touch events as well as keyboard and mouse input. The test runner launches Chromium with its browser sandbox disabled; serving the app itself requires no browser installation.

Set `TEST_BASE_URL` to a deployed site or a local server with a project subpath to test that target instead of starting the Node server. The browser smoke test checks that the home link, scripts, styles, and swaps work at that base URL.

Run `npm run build` before publication. The dependency-free builder hashes every JS/CSS asset after rewriting its dependencies, flattens plain local CSS imports in cascade order with nested URL rebasing, then rewrites HTML entries and preloads each entry’s transitive module graph. Unsupported CSS import forms fail before output is replaced. Shared dependencies keep one URL and identity. Source imports remain canonical and have no release queries; the old hand-maintained stamper is removed. `dist/build-manifest.json` identifies the release and every output asset. Original source paths remain as compatibility aliases for previously cached entries. An old open tab may require a reload after deployment if its earlier hashed assets are no longer published. Hashes prevent mixing changed dependencies within the new build; this is not indefinite retention of older releases. Storage keys and model versions are independent of asset URLs.

## Focused workspaces and historical records

`public/ui/workspaces.js` controls visibility and top-level navigation without rebuilding feature controllers. `public/lib/workspace-links.js` maps existing fragments to Experiment, Inspect or Pool mechanics; `#historical-case` opens the recorded replay. Lab and snapshot controllers receive an activation callback from `main.js`, so explicit handoffs reveal the correct workspace while preserving drafts. Learn remains a separate document. Primary fragments `#experiment` and `#inspect` open section introductions; existing tool fragments still open their targets. `page-access.js` measures the visible sticky header for native anchor offsets, lab tabs and the learning sidebar. On phones the wordmark scrolls above the viewport, the main navigation remains visible, and lab tabs scroll normally. A passive scroll listener updates offsets without changing the document height.

The period model lives in `public/models/fixed-position-period.js`; record validation is in `public/data/position-period.js`, with bounded multi-segment composition in `public/data/position-history.js`; values for display are in `public/lib/period-presentation.js`; the DOM controller is in `public/ui/position-period.js`. The development-only `scripts/check-replay.js` captures and independently checks a bounded fixed-position period, with an optional 2–32 checkpoint count. It validates the complete record before writing it. `public/data/replay-cases.js` orders the bundled cases and preserves the original fragment alongside `#historical-case=range-return` and `#historical-case=one-week`. The week uses seven legacy segments, each within the original limits. Canonical shared boundaries must match and global accounting is checked from the first checkpoint. `scripts/qualify-replay-week.js` applies a committed candidate order; `scripts/check-replay-week.js` validates the selection audit and resumes only matching validated cached segments after checking block identities. Failed or partial captures never produce a final record. Event reads retry bounded temporary failures without changing the queried interval. Case selection keeps separate checkpoint positions in the current document; late responses cannot replace a newer selection. Interval presentation uses cumulative credit differences and cumulative range-time counters. See [the replay method](replay.md).

## Project structure

- public/main.js, public/learn-main.js and public/lending-main.js: composition roots for liquidity Experiment/Inspect, liquidity Learn and lending respectively. They initialize each document's controllers and inject the interfaces they need.
- public/ui/: explicit initializers for the sandbox, both labs, learning, pool/position snapshots, saved experiments, historical replay and navigation. Importing a controller does not start it.
- public/models/: pure hypothetical calculations, lesson experiments and exact protocol/period arithmetic. They do not read the DOM, browser storage or network.
- public/data/: deployment configuration, read-only Uniswap v2/v3 adapters, snapshot/period schemas, saved experiments, learning progress and temporary Learn-return storage.
- public/lib/: compatible scenario links, exports, formatting and rendering utilities.
- public/learning/: essential and applied lesson definitions, optional deeper reading and the eleven-example progression.
- public/examples/: bundled pool/position snapshots and the verified fixed-position period record; these open without RPC requests.
- public/styles/: shared foundation and components followed by feature styles. public/styles.css preserves the existing cascade order.
- public/index.html, public/liquidity.html, public/learn.html and public/lending.html: semantic, static markup with one module entry point per document. Each feature owns its IDs; the structure check rejects duplicates.
- scripts/: development, integration and browser checks; test/: reference calculations and adapter/storage contracts.
- scripts/lib/build-site.js and scripts/build-site.js: generate a static `dist/` with dependency-derived asset hashes and module preloads.
- server.js: a local static server for source or generated output.

Run npm run check to verify module paths, circular dependencies, architectural boundaries, stylesheet imports, unique HTML IDs and document entry points. CI runs this before calculation and browser tests. Existing scenario.js, amm.js and storage.js exports and storage keys remain compatible.

The structure review keeps the current dependency-free deployment. Explicit startup removes cross-controller import side effects; feature styles reduce collisions as labs grow. Shared tab behavior handles keyboard navigation consistently across the sandbox, labs and snapshot sources. ABI decoding, block pinning and snapshot-file/storage handling are shared by both protocol adapters; protocol identity checks remain adapter-specific. Static HTML remains appropriate at this size. The build now handles cache coherence and preload hints; a future markup composition step should be driven by repeated layout costs. A framework, database or application backend is not needed for read-only, public-chain imports.

## Architecture and extension policy

The static app remains dependency-free and deployable on GitHub Pages. Keep the model, data, utility and UI responsibilities above separate. `public/scenario.js` retains compatibility exports for existing integrations and tests.

New financial models get their own versioned module and reference/invariant tests. New protocols get a deployment definition, adapter, exact token-unit handling and contract validation. Preserve old model links and storage keys; introduce explicit migrations when schemas change. Unit and desktop/mobile browser tests run before deployment.

Release 1.8.0 shipped the first verified fixed-position period: nine checkpoints over 4,992 seconds for position #1382030 in Ethereum's WETH/USDC 0.3% pool. Release 1.9.0 adds a 17-checkpoint exit-and-return case spanning 120,468 seconds for position #1375047 in the same pool. Release 1.34.0 follows position #1375090 for 604,800 seconds through eight daily checkpoints in the same pool. A separately versioned manifest composes seven validated segments; no new fee tokens or active seconds were recorded. The dates and candidate order were declared before inspecting this outcome. Release 1.35.0 adds two active-at-start positions over that same week, with independently validated collection accounting and a published selection audit. The separate 1.36.0 controlled width experiment is hypothetical and does not modify those records. Editable historical bounds/windows and arbitrary-range backtesting remain future work; they require evidence beyond sampled prices and global fee growth. See [replay.md](replay.md#next-validation-cases) before extending the model.

A backend becomes useful for private provider credentials, shared caching, scheduled snapshots or account synchronization. Each can be added behind the data layer without rewriting the calculation models or existing labs. No scheduled collector or backend is part of the shipped replay.

The cl-range-v1 model, links, CSV, presentation helpers and result cards are separate modules. A shared link router and accessible lab navigation coordinate the two calculators while preserving cp50-v1 links. Reference tests cover asymmetric funding, outside starts, exact boundaries, continuity, virtual-reserve conservation, wide-range limits, separate fees, numerical bounds and reproducible exports.

## Browser identity and sharing

Teren uses a custom lowercase wordmark in page headers and exported result cards. `public/assets/teren-logo.svg` contains the outlined light lettering; `teren-logo-ink.svg` is its navy version for light backgrounds. `teren-mark.svg` is the separate open-t symbol. Ink-blue surfaces, warm white text and sea-glass accents define the interface. Gold ETH/WETH and striped blue USDC remain distinct from the brand colors.

The symbol is supplied as an SVG favicon and a 16/32/48-pixel ICO fallback. Opaque 180-pixel Apple touch and 192/512-pixel maskable app icons keep the mark inside the central safe area. The manifest identifies the site at its own root. There is no font download or service worker. The dependency-free production build hashes scripts and styles and adds module preloads.

Each public page has its own title and description, shared by its search and social-preview metadata. Canonical and Open Graph URLs identify that page on `https://teren.sh/`. The 1200×630 social preview uses the same wordmark and a calculated, hypothetical `cl-range-v1` illustration before fees. Scenario fragments share this site preview. The 404 page uses root-relative asset and home URLs so deeply nested missing paths also work on the custom domain and local server. Ordinary page links are relative. The active skip link preserves shared scenario fragments when moving keyboard focus to the main content.

`public/sitemap.xml` lists the six canonical content pages, without fragments, saved scenarios or the 404 page. Add or remove an entry when a public page changes. `public/robots.txt` allows crawling and points to that sitemap. These files are copied into the production build; they do not guarantee indexing. In page links, → indicates a same-tab destination, ↓ a location below on the page, and ↗ a new tab.

The structure check verifies linked files, metadata, PNG/ICO dimensions and manifest paths. The local server supplies correct image/manifest types and preserves HTTP status 404 for missing resources.

To regenerate the committed favicon, ink wordmark, social SVG and raster assets after editing the two source SVGs, run `node scripts/render-brand-assets.js` with the optional Sharp graphics tool. `SHARP_MODULE` can point to its module entry file when Sharp is supplied externally. This is a maintainer tool, not a website dependency. The renderer calculates the social illustration using the existing range model.

## Publishing with GitHub Pages

The workflow in `.github/workflows/pages.yml` checks models and the build on Node 22 and 24. Node 24 also runs the full desktop/mobile browser suite against `dist/`, then uploads the exact tested site. Deployment publishes that artifact whenever `main` changes. Pull requests run the same checks without publishing. Hosting stays on GitHub Pages; Cloudflare manages the `teren.sh` domain and DNS. The public domain is independent of the repository name.

The publishing source is **Settings → Pages → Build and deployment → Source → GitHub Actions**. The intended public address is `https://teren.sh/`. See [domain setup](domain-setup.md) for the cutover sequence and DNS records. A `CNAME` file does not configure a custom domain for this Actions-based deployment; the domain must be saved in GitHub Pages settings.

### Repository name and saved work

Keep the existing repository and its history. After renaming it to `teren`, update existing clones:

```sh
git remote set-url origin https://github.com/provatidis/teren.git
```

Historical names remain in the changelog and compatibility identifiers. There is no separately maintained legacy website or redirect repository. Existing scenario fragments can be appended to `https://teren.sh/`; newly shared links use the current page address. Local checkout directories can keep their names.

The sandbox key remains `defi-sandbox-v1`. The `degenerator-*` keys, `passiko-applied-liquidity-v1` and `passiko-range-learning-v1` also stay unchanged. Exported experiment libraries retain their version-1 `degenerator-experiments` kind, so earlier backups still import. Visible names and new download filenames use Teren.

These unchanged identifiers preserve saved work on the same origin. **Moving to `teren.sh` creates a different browser-storage origin:** lesson progress, sandbox balances, working drafts and snapshots do not move automatically. Export saved experiments and any pool/position JSON you want to keep before changing the published domain; import those files on Teren afterward. Exported experiments do not include lesson progress or sandbox balances. Keep this distinction explicit during the cutover.

## Working drafts during a Learn visit

Clicking a same-tab Learn or Lending link captures validated liquidity calculator inputs, the active lab and any matching source snapshot into `degenerator-learn-return-v1` in session storage. Returning restores the working drafts without changing saved experiments, lesson progress or latest chain snapshots, then consumes that temporary handoff. Explicit shared scenario links take precedence. Browser history restores cached pages directly; stale handoffs are cleared when such a page returns. Unsupported or unreadable handoff data is preserved, and blocked storage leaves navigation usable. Invalid incomplete inputs are not captured.

## Applied learning records

`public/ui/applied-learning.js` composes the three applied exercises beside the existing essentials controller. Strict `#applied=...` routes preserve existing `#lesson=...` links. Editorial definitions live in `public/learning/applied-liquidity.js`; `public/lib/applied-lessons.js` derives fixed assessment targets from the same period presentation used by Inspect. Exploring checkpoints does not change the question. No new fee model or historical capture is introduced.

`public/data/applied-records.js` loads only configured bundled replay records (currently three), shares requests, validates their evidence and permits retry after failures. The three applied lessons continue to use the original two records; fee-context disclosures also include the week. The controller rejects stale responses when the selected exercise changes. Applied drafts and completion use their own `passiko-applied-liquidity-v1` key; the essentials schema and all existing keys remain compatible. Unit checks cover optional calculation targets and rounding, interval versus cumulative values, identity checks and independent storage. Browser checks cover direct entry, progression, restoration, Playground transfer, loading failures/races and 390px/320px layouts.

## Lesson consistency checks

`public/lib/lesson-narration.js` narrates the calculated setup and explains each incorrect foundation reason. Token-transfer direction follows the selected price; an unchanged price has a distinct explanation. Benchmarks, total fee targets and additional fees stay explicit. Applied corrective feedback remains scoped to the marked question checkpoint or interval.

`public/models/learning-answer.js` checks the same decimal rounding used in displayed outcomes, with explicit whole-number requirements. It accepts equivalent extra precision without accepting an adjacent incorrectly rounded number. Lesson and progress identifiers are unchanged. The builder versions every dependency by content and preserves shared protocol adapter/RPC identities. Unit checks cover all distractors, price directions, widths and variations; browser checks verify the built teaching module identities and cover desktop/mobile feedback.

## Understanding checks

Essentials and applied exercises require an explanation and a transfer answer after changing one assumption. The pure `models/lesson-application.js` derives changed hypothetical outcomes from the selected variation; `lib/lesson-application-copy.js` supplies its questions. `lib/applied-applications.js` defines explicitly hypothetical applications beside fixed recorded questions. The required checkers accept choice identifiers only; predictions and optional numeric answers do not control completion, Continue, or result-card eligibility. The existing numeric checkers remain available only for optional practice within Go deeper.

Choice order is shuffled once per draft and group, then remains stable through checks and reloads. Progress version 1 and existing keys remain unchanged. Parsers add bounded application identifiers and a validated uint32 choice seed while retaining older completion, inputs, predictions, reasoning and numeric practice. A legacy draft has no invented transfer answer. The content-hashed build updates the changed progress parsers, choice-order helper, teaching copy and checkers together. Browser checks cover conceptual-only completion, incorrect prediction, both kinds of feedback, optional calculation isolation, restoration and desktop/mobile layouts.

## Practical range learning

`models/range-decisions.js` defines three bounded variations for each practical topic and grades only explanation/application choices. Width and outside-principal results use the existing continuous range model. Fee totals are explicitly supplied fictional facts; there is no fee estimator or replay request. `learning/choosing-ranges.js` keeps teaching text and presentation separate from grading. `ui/management-learning.js` owns the chapter, and `lib/management-links.js` accepts only strict `#manage=<id>` routes. Composition stays in `learn-main.js`; controllers do not import one another.

The new `passiko-range-learning-v1` key stores bounded variants, choices and a validated ordering seed. Earlier lesson keys, IDs and completion remain unchanged. Navigation moves from essentials to range choices to recorded history; every topic remains directly accessible. `lib/learning-elements.js` shares radio rendering and metric elements across the three controllers, while editorial pitfalls in `learning/pool-pitfalls.js` appear in the normal results flow. The builder hashes these imports through the complete graph. Tests cover model conservation, boundary eligibility, fee-rate counterexamples, unknown earnings, outside exposure, automatic return, independent progress, mixed-route rejection, all variations, wrong predictions, feedback, restoration and desktop/mobile chapter switching.

## Clear entry and project information

`ui/workspaces.js` controls a mobile-only tools disclosure without duplicating destinations or changing fragment routing. Desktop links remain visible. The disclosure closes after a selection and returns keyboard focus before hiding its links. About and Methods are static HTML, share identity metadata/CSP and need no JavaScript. The builder and project check include both pages.

`managementApplication` supplies situation-specific follow-ups. Width totals combine calculated principal with supplied fee/cost assumptions; fee-tier totals are explicitly fictional teaching facts; removal and fee collection remain distinct actions. These values do not modify historical records or estimate earned fees. Completed topics remain saved; a restored draft is checked against its displayed situation.

For coverage diagnostics, import the same canonical source URL used by the model consumers. Production asset hashes are generated from that source graph. Answer-combination tests and browser restoration checks remain the primary evidence for grading behavior, rather than a project-wide coverage percentage.

## Lending foundations

`lending.html` has its own composition root, `lending-main.js`, with separate Experiment and Learn panels. It does not add lending controllers to the liquidity document. The topic links preserve the current mode; Inspect still opens the existing liquidity records. Strict `#loan=collateral-loan-v1` links carry all model assumptions, and `#lesson=supply|borrow|conditions|respond` routes select directly accessible lessons.

`models/collateral-loan-v1.js` validates the initial loan and calculates later balances, liquidation eligibility and immediate responses. It is pure floating-point teaching arithmetic, separate from the integer protocol accounting. `models/lending-lessons.js` defines reference cases and grades conceptual choices; `learning/lending-essentials.js` owns editorial definitions. `lib/lending-presentation.js` preserves the side of the liquidation boundary when formatting health factors. UI controllers share choice rendering and feedback focus without importing one another.

`data/lending-state.js` validates a per-tab `teren-lending-draft-v1` session draft and independent `teren-lending-learning-v1` local progress. Invalid edits do not overwrite the last valid working setup. Explicit valid links override the draft; unsupported links leave it intact and explain the failure. Lesson handoffs open a separate tab. The existing liquidity Learn-return handoff also captures departures to Lending; no older key or schema changes.

The builder and structure checker include the third entry point and all of its dependencies. Reference tests cover debt/cash conservation, simple interest on each token balance, LTV versus liquidation threshold, exact boundaries, full/partial repayment, same-budget responses, links, storage and all conceptual answer combinations. CI also checks the complete lessons, shares, recovery from invalid inputs, topic draft isolation and desktop/390px/320px layouts.

The `#learn` lending route resumes an allowlisted `currentLesson`, added to the existing version-1 progress object without changing prior drafts or completion. Explicit lesson routes take precedence. The active topic is a label rather than a link on all three interactive pages. Mobile lending feedback uses the shared measured header/feedback offsets; shortcuts reveal enclosing disclosures before focusing a field. Response-budget validation is separate from presentation of the existing loan: invalid budgets suppress response cards and sharing, while the current loan is recalculated with no response applied. A render revision guards delayed clipboard feedback after edits. Browser checks cover these flows and ensure focused fields/results are not covered by sticky feedback.

## Lending explanations and model review

`models/loan-explanations.js` adds a separate `single-liquidation-v1` illustration, a fixed-balance health/price curve and a continuous-compounding debt reference. It does not change `collateral-loan-v1`. Liquidation bonus and repayment fraction use an independent session draft. Optional versioned event fields extend loan links; older links restore their original loan with default event assumptions. Invalid event inputs hide only the event and disable sharing; invalid response budgets still preserve the loan outcome.

The build tests cover parent hash invalidation, deterministic output, shared dependency identity, missing imports and cycles. Loan reference tests cover balance conservation, capped repayment, remaining debt, zero bonus, full repayment and boundaries. CI browser checks add event sharing/drafts, independent validation, compounding differences and chart readability at 390px/320px.

Review [open blind spots](review.md) before a mechanism release. Report which misleading interpretation was tested as well as which calculation checks passed.

## Borrowing loops

The existing lending document has Single loan and Borrowing loops experiment routes. `#loops` and strict `#loop=borrowing-loop-v1` links select the loop lab; `#loop-lesson=build|stress|unwind` selects the companion chapter. The main composition root routes both without controller-to-controller imports. Experiment returns from loop lessons to loops; chapter links keep the foundations directly accessible.

`models/borrowing-loop-v1.js` owns pure construction, accrued balances, price sensitivity and the withdrawal-first unwind. `models/loop-lessons.js` owns reference scenarios and conceptual grading. Editorial definitions live in `learning/borrowing-loops.js`; presentation/links in `lib/loop-presentation.js` and `lib/loop-links.js`. `ui/borrowing-loops.js` renders with DOM nodes and guards stale clipboard results.

Presentation tests cover signed sub-cent comparisons and distinct unwind-state labels. The UI separates starting-price construction from later price/time results, preserves opened rounds across edits and moves focus to the round field when a clicked minus/plus control reaches its limit. Browser checks exercise those bounds, supply-only results and blocked unwind labels at desktop and narrow mobile widths.

`data/loop-state.js` isolates `teren-loop-draft-v1` in session storage and `teren-loop-learning-v1` in local storage. A separate session chapter preference supports Learn resumption. The shared lending progress parser accepts explicit chapter allowlists; its default remains the earlier four IDs. The shared lesson renderer receives chapter-specific model, links, grading, presentation and persistence functions.

`models/loop-comparison.js` compares construction choices by applying shared market inputs to both calculations. The optional `compare=0..5` link field and `comparisonRounds` draft field identify the reference count; zero means supply only, not holding. Older links/drafts default to no comparison. Invalid optional draft metadata is dropped without losing valid inputs; malformed or duplicated URL fields reject the link. Reset clears the comparison, and an explicit older link replaces it with that link's single setup.

`lib/loop-flow-stages.js` maps the model ledger into presentation stages for the build and unwind lessons; `lib/loop-money-flow.js` shares their renderer. The build lesson has four stages. The unwind lesson has eight: start, two withdrawal/sale/repayment passes, then a final wallet transfer. `unwind.actions` holds intermediate wallet assets, supplied collateral, debt, health and cumulative swap losses. The existing aggregate steps and `unwind.remaining` retain their prior values. Only a completed unwind adds a release action; the fixed lesson adapter rejects incomplete previews rather than presenting them as completed.

`lib/lesson-scene.js` shares visible prediction prompts with optional choices, generic amount/price exploration and action playback. Action players expose their element and a `show` method for restoring the assessed frame. Controls activate one named action, replay its cue, or jump directly to a grouped step. No timers or queued financial transitions run; balances always come from a completed model frame. Backward navigation is a static revisit. Stage selection is temporary and changes no saved answer identifiers. The diagram cancels the prior cue before starting another, and CSS disables motion under `prefers-reduced-motion`.

`lib/liquidity-scene-state.js` derives token and range frames through the existing pure models; `lib/liquidity-lesson-scenes.js` renders them. The same initial funding is reused for every selected price. `lib/foundation-scene-state.js` derives swaps and proportional deposits from `lesson-experiments.js`, with the separate post-deposit trade using the existing integer v2 swap calculation. `lib/foundation-lesson-scenes.js` renders reserve bars, the average-price comparison and the LP claim. Every selected amount starts again from the original pool.

`lib/lending-flow-stages.js` derives the first two lending lessons from `collateral-loan-v1`; `lib/lending-lesson-scenes.js` renders their wallet, supply, debt and capacity balances. Enabling collateral rebases the already-accrued supply at day zero, so no second year of interest is added. Remaining capacity subtracts existing debt from the borrowing limit. The fixed scenes reject other periods or price paths. The renderer uses the shared action player; the controller restores the assessed frame when opening an explanation or reloading an already-revealed lesson.

Exploration has no persistence callback, so it cannot change the fixed question, answers, grading or handoff. The controller separately owns explicit question changes. Eleven visual routes allow omitted predictions, including on restoration; other lessons retain their current sequence. Browser checks cover this distinction, exact token transfers and range boundaries, native touch dragging, keyboard actions, replay, completion and state isolation. Liquidity foundation handoffs keep opening the independent sandbox; they do not seed it with the displayed lesson pool. All seven lending/loop lessons retain their exact model links and existing progress keys.

`lib/loan-condition-state.js` derives fresh endpoints for the conditions lesson through `collateral-loan-v1`. It bounds time to the assessed year and price to half through one-and-a-half times the starting price, rejecting scenarios that would no longer isolate debt interest. `lib/loan-condition-scene.js` reuses native scene sliders with one active mode. Time fixes price; price fixes the full-year balances. Both bars and dashed references share one stable dollar scale. Mode changes reset that comparison, while clicking the active mode preserves it. The renderer never persists state, compounds a prior frame or applies a liquidation. The controller restores Time at one year for the explanation and revealed-draft reload. Browser coverage checks exact and adjacent boundaries, optional completion, link/draft isolation and slider stability during touch dragging at 390px/320px.

`lib/loan-response-state.js` derives both response alternatives from `collateral-loan-v1`, starting afresh for every selected outside budget. It rejects non-immediate, debt-free or liquidation-boundary/below setups for this lesson. `lib/loan-response-scene.js` renders both alternatives in an accessible comparison table, using one dollar scale and unchanged reference marks. The slider includes the exact question and full-debt budgets; spending is capped in the repayment branch and unused cash remains visible. Explanation and revealed-draft reload restore the $1,000 question. The model, source question IDs and all storage/link formats stay unchanged. Checks cover conservation including outside cash, full repayment without withdrawal, unused funds, native keyboard/touch interaction and 320px/390px chart/control proximity.

`lib/loop-stress-state.js` rebuilds the three-round, zero-cost lesson for each selected price or time. The original question keeps zero interest; Time separately fixes the original price and supplies named 0%/10% continuously compounded teaching rates. `lib/loop-stress-scene.js` renders value after debt, signed gain/loss bars around a shared zero, debt, health factor and liquidation price. One stable scale covers both modes; the underlying model remains unchanged. The exact boundary shortcut uses the unrounded value, and nearby labels preserve below/above distinctions. The controller restores the original question on explanation/reload, including omitted predictions. Tests check capital and debt accounting, both price directions, interest isolation, boundary precision, saved-state/link isolation and native touch dragging at 390px/320px.

Tests compare geometric-series references against the step ledger across 1,000 varied setups, check conservation before/after costs, exact boundaries, both interest assumptions, withdrawal health before repayment, remaining debt, strict links and storage isolation. CI browser checks cover lessons, links, draft restoration, compounding, invalid inputs, blocked unwind and 390px/320px layouts against the generated build.


### Native touch regression checks

The token-balance and range-width pilot checks repeat fresh-page drags three times at each phone width. `scripts/browser/touch-range.js` enables touch mode before scrolling and measuring, waits for stable geometry and an unobscured hit target, and checks trusted touch/input events as well as the final value and stationary control. Failures include event traces. It never retries a failed gesture or writes the expected end value. Passing repetitions reduces uncertainty about the intermittent failure; it does not prove all Android/Chrome combinations reliable.


## Home and topic navigation · 1.31.0

`index.html` is a lightweight topic entry with `home-main.js` and `home.css`. Its dependency graph contains no financial models, records or live adapters. `liquidity.html` retains the existing liquidity composition root and fragment router. `lib/entry-links.js` recognises existing root liquidity fragments; Home uses `location.replace` to preserve the search and fragment at the direct lab document without a Back-button redirect loop. Home anchors remain on Home. New lesson handoffs use the direct document.

`data/learning-location.js` stores only an allowlisted lesson route in `teren-learning-location-v1`; it cannot alter answers or completion. Blocked/corrupt storage leaves Home usable. Existing lesson progress remains in its original keys. The small route catalogue is checked against all five lesson chapters in unit tests. Returning through Home uses the existing per-tab liquidity draft handoff, with explicit scenarios taking precedence.

`styles/navigation.css` places topic choice before the topic's available modes. Current topics are non-actionable; only the other topic is a link. `styles.css` and `home.css` remain readable import lists in source; each production entry points at a flattened content-hashed stylesheet. Nested CSS URLs are rebased relative to the receiving stylesheet. The builder preserves canonical source aliases for previously cached entries.


## Personal experiments · 1.33.0

The existing version-1 experiment library accepts the tagged `collateral-loan-v1` and `borrowing-loop-v1` models alongside liquidity. Loan entries retain validated event assumptions; loop entries retain optional `{ rounds, borrowPercent }` comparison metadata, where null fraction follows the main setup. Existing liquidity entries and sources are unchanged. Older app versions reject unfamiliar model tags through their existing recovery path; no migration overwrites an earlier backup. Shared CRUD keeps atomic import, stale-edit checks and storage recovery across topics. Presentation is model-aware; mixed-topic comparisons are blocked rather than implying equivalent benchmarks.

`loop-comparison.js` permits a distinct reference borrowing fraction while deriving all market assumptions from one main input set. `compareBorrow` is optional and requires `compare`; older links retain the shared-fraction behavior. Valid custom fractions survive drafts, saved records and share links. Invalid reference fields hide only the comparison and disable saving/sharing until corrected. User-defined build/unwind scenes reuse the calculation ledger, with distinct DOM ID prefixes and explicit incomplete-preview states.

`data/experiment-location.js` is a lightweight, local input-link bookmark. Home imports no model or historical record. Destination pages validate the fragment before using it. It does not carry source attribution; named library entries remain the way to retain exact snapshots. Home presents lab and lesson actions equally, and keeps experiment and lesson resume independent.

## Matched fee comparison

`#fee-comparison` is a direct recorded-liquidity route, linked from the fee-context panels and individual replay cases. `models/collection-period.js` separates claim credits, actual payments and net new fee tokens. `data/collection-history.js` validates bounded daily/collection checkpoints, complete events and successful transaction receipts; `data/matched-comparison.js` enforces shared pool/block evidence and declared starting eligibility. `lib/matched-comparison.js` provides normalized values and daily intervals; `ui/matched-comparison.js` owns the synchronized controls, chart, ledger, export and principal-only handoffs. Original period formats and lesson records stay unchanged.

`qualify:comparison` records eligibility in a declared ascending order and can resume an unfinished audit without repeating completed candidates. At most three starting metadata reads run concurrently; selection decisions remain ordered and any provider failure stops the batch. `check:comparison` captures both histories, verifies collections against pool receipts and writes only a complete comparison. Empty caches force fresh state reads; cached points are only a capture-resume mechanism. The browser RPC allowlist is unchanged. See [capture and accounting](replay.md#matched-week-comparison).


## Controlled width comparison · 1.36.0

`models/range-width.js` constructs reciprocal bounds and delegates principal accounting to `cl-range-v1`. Both alternatives use an explicit common 50/50 basket. `lib/width-links.js` validates versioned `#width=cl-width-v1` links; `data/width-draft.js` isolates the last valid setup in `teren-width-comparison-v1`. Invalid edits never overwrite that setup, and unreadable storage remains untouched until a deliberate valid edit or reset. Home’s experiment-location metadata supports this separate comparison.

`#compare-widths` opens a focused Experiment workspace. `ui/width-comparison.js` owns controls, range bands, current inventories, the optional before-fee gap chart and exact handoffs through the injected range-lab interface. The 0–1000 native slider maps to a fixed price domain during a drag; exact numeric inputs and boundary buttons retain their unrounded values. It does not fetch recorded data or alter learning progress. Existing named-experiment schemas remain unchanged; either result can be opened and saved through the range lab.

Reference/invariant tests cover centering, shared baskets, equal/reversed widths, scaling, boundaries and fee targets. Browser checks cover links, Home resume, reload/Back, recovery, keyboard and native touch at 390px/320px, chart text and isolated handoffs. Run the focused browser checks with `BROWSER_CHECKS=width npm run test:browser`; the full suite includes them.


## Fee-flow experiment

`models/range-fee-flow-v2.js` allocates and accumulates hypothetical token fees on top of the existing width/principal model. `ui/range-fee-flow.js` receives the range-lab handoff and a change callback through `main.js`; it does not import another UI controller. The width controller supplies the common inputs and coordinates validation, sharing and persistence. Switching views moves the same bands/price control only on the mode transition; price input does not rebuild or move its slider.

`lib/width-flow-links.js` keeps the old `cl-width-v1` links unchanged and reads legacy `cl-width-fees-v1` links and writes `cl-width-fees-v2` links with validated compact tuples including each competitor width. The existing width draft key reads versions 1–3; version 3 stores widths and the complete fee state together on valid edits. Legacy missing widths normalize to full range, independently of new defaults. Invalid edits preserve the last valid draft and disable sharing. A standalone `#follow-fees` route opens the fee view. Home’s lightweight location metadata recognizes the new model. Named experiment libraries and historical schemas are unchanged.

Run the full unit/structure/build/browser checks for release. `BROWSER_CHECKS=fees npm run test:browser` focuses on both original width behavior and the fee flow, including native touch at 390px and 320px, sharing, restoration, handoffs, invalid inputs, ledger limits and retained fees outside a range. No network request is introduced by the experiment.


`ui/fee-mechanics.js` owns only the isolated arbitrage steps. The scene uses the existing full-range calculation, stays separate from the fee ledger and opens directly at `#fee-mechanics`. The static JIT diagram labels its fictional liquidity units and shares. Both explanations are optional, and no LVR estimate or new lesson grading is introduced. Check the next-batch share readout, empty-liquidity alternatives, competitor boundaries, per-batch widths, legacy migration and scene isolation before extending the model.

## Correlated-loop extension · 1.39.0

`models/lst-loop-v1.js` owns construction, accrual, the rate-only boundary check, one liquidation event and an atomic exit ledger. `lib/lst-links.js` validates complete versioned fragments; `data/lst-state.js` keeps its independent local draft. `lib/lst-scene.js` renders intermediate balances without changing model inputs. `ui/lst-loops.js` owns controls and the three-stage view, composed from `lending-main.js`. Shared saved experiments support the model as its own comparison family. No chain adapter or protocol preset is implied.

Tests independently check geometric construction, conservation, APY/APR accrual, price/oracle separation, earlier-boundary recovery, bad debt, exit obligations, strict links and storage. Browser coverage includes cross-topic reopening, invalid-input recovery, live result updates and native touch controls at 390px/320px. The lending tool strip scrolls horizontally without widening the page.
