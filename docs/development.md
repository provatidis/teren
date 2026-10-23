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

The HTTP server defaults to loopback port 3000. Set `HOST` and `PORT` to change its binding. It serves only the `public/` directory. To verify it:

```sh
curl --fail http://127.0.0.1:3000/
```

Open http://127.0.0.1:3000/ in your browser. The hypothetical labs, lessons and bundled recorded cases work without an external network connection. Live snapshots and the development-only chain verifiers need RPC access. No wallet, API key or locally running blockchain node is required.

## Test

```sh
npm test
```

Tests cover the sandbox and both hypothetical models, versioned links and exports, v2/v3 snapshot validation, exact v3 fee accounting, fixed-position period accounting and continuity evidence, essential and applied learning assessments, saved comparisons, Learn-return drafts and storage failures. The bundled historical records are checked locally without RPC calls; `npm run check:replay` separately recaptures and verifies chain history through public providers.

For a local browser smoke test, install Chromium or set `CHROMIUM_BIN` to its executable, then run `npm run test:browser`. It starts temporary servers and checks actual page interactions at desktop and mobile sizes, including calculators, learning, snapshot imports, saved comparisons, the historical checkpoint slider, downloads and persistence. Navigation checks cover sticky-header offsets, direct tool fragments, browser history and returning from Learn. The same suite runs in CI before deployment. Its mobile routing checks use touch events as well as keyboard and mouse input. The test runner launches Chromium with its browser sandbox disabled; serving the app itself requires no browser installation.

Set `TEST_BASE_URL` to a deployed site or a local server with a project subpath to test that target instead of starting the Node server. The browser smoke test checks that the home link, scripts, styles, and swaps work at that base URL.

When changing the package version, run `npm run release:assets` before the checks. This stamps page entry points, UI-controller imports, mutable teaching/assessment modules and stylesheet imports so a browser retaining the previous release fetches the new UI. The structure check rejects stale release queries. Storage keys, exported schemas and model versions are independent of these asset URLs.

## Focused workspaces and historical records

`public/ui/workspaces.js` controls visibility and top-level navigation without rebuilding feature controllers. `public/lib/workspace-links.js` maps existing fragments to Experiment, Inspect or Pool mechanics; `#historical-case` opens the recorded replay. Lab and snapshot controllers receive an activation callback from `main.js`, so explicit handoffs reveal the correct workspace while preserving drafts. Learn remains a separate document. Primary fragments `#experiment` and `#inspect` open section introductions; existing tool fragments still open their targets. `page-access.js` measures the visible sticky header for native anchor offsets, lab tabs and the learning sidebar. On phones the wordmark scrolls above the viewport, the main navigation remains visible, and lab tabs scroll normally. A passive scroll listener updates offsets without changing the document height.

The period model lives in `public/models/fixed-position-period.js`; record validation is in `public/data/position-period.js`; values for display are in `public/lib/period-presentation.js`; the DOM controller is in `public/ui/position-period.js`. The development-only `scripts/check-replay.js` captures and independently checks a bounded fixed-position period, with an optional 2–32 checkpoint count. It validates the complete record before writing it. `public/data/replay-cases.js` orders the bundled cases and preserves the original fragment while adding `#historical-case=range-return`. Case selection keeps separate checkpoint positions in the current document; late responses cannot replace a newer selection. Interval presentation uses cumulative credit differences and cumulative range-time counters. See [the replay method](replay.md).

## Project structure

- public/main.js and public/learn-main.js: composition roots for Experiment/Inspect and Learn respectively. They initialize each document's controllers and inject the interfaces they need.
- public/ui/: explicit initializers for the sandbox, both labs, learning, pool/position snapshots, saved experiments, historical replay and navigation. Importing a controller does not start it.
- public/models/: pure hypothetical calculations, lesson experiments and exact protocol/period arithmetic. They do not read the DOM, browser storage or network.
- public/data/: deployment configuration, read-only Uniswap v2/v3 adapters, snapshot/period schemas, saved experiments, learning progress and temporary Learn-return storage.
- public/lib/: compatible scenario links, exports, formatting and rendering utilities.
- public/learning/: essential and applied lesson definitions, optional deeper reading and the ten-example progression.
- public/examples/: bundled pool/position snapshots and the verified fixed-position period record; these open without RPC requests.
- public/styles/: shared foundation and components followed by feature styles. public/styles.css preserves the existing cascade order.
- public/index.html and public/learn.html: semantic, static markup with one module entry point per document. Each feature owns its IDs; the structure check rejects duplicates.
- scripts/: development, integration and browser checks; test/: reference calculations and adapter/storage contracts.
- server.js: a local static server; GitHub Pages deploys public/ directly.

Run npm run check to verify module paths, circular dependencies, architectural boundaries, stylesheet imports, unique HTML IDs and document entry points. CI runs this before calculation and browser tests. Existing scenario.js, amm.js and storage.js exports and storage keys remain compatible.

The structure review keeps the current dependency-free deployment. Explicit startup removes cross-controller import side effects; feature styles reduce collisions as labs grow. Shared tab behavior handles keyboard navigation consistently across the sandbox, labs and snapshot sources. ABI decoding, block pinning and snapshot-file/storage handling are shared by both protocol adapters; protocol identity checks remain adapter-specific. Static HTML remains appropriate at this size. Split markup or add a build step when repeated page layouts actually need it. A framework, database or application backend is not needed for read-only, public-chain imports.

## Architecture and extension policy

The static app remains dependency-free and deployable on GitHub Pages. Keep the model, data, utility and UI responsibilities above separate. `public/scenario.js` retains compatibility exports for existing integrations and tests.

New financial models get their own versioned module and reference/invariant tests. New protocols get a deployment definition, adapter, exact token-unit handling and contract validation. Preserve old model links and storage keys; introduce explicit migrations when schemas change. Unit and desktop/mobile browser tests run before deployment.

Release 1.8.0 shipped the first verified fixed-position period: nine checkpoints over 4,992 seconds for position #1382030 in Ethereum's WETH/USDC 0.3% pool. Release 1.9.0 adds a 17-checkpoint exit-and-return case spanning 120,468 seconds for position #1375047 in the same pool. The next validation case is a comparison of existing ranges in the 0.05% pool. Editable historical bounds/windows and arbitrary-range backtesting remain future work; they require evidence beyond sampled prices and global fee growth. See [replay.md](replay.md#next-validation-cases) before extending the model.

A backend becomes useful for private provider credentials, shared caching, scheduled snapshots or account synchronization. Each can be added behind the data layer without rewriting the calculation models or existing labs. No scheduled collector or backend is part of the shipped replay.

The cl-range-v1 model, links, CSV, presentation helpers and result cards are separate modules. A shared link router and accessible lab navigation coordinate the two calculators while preserving cp50-v1 links. Reference tests cover asymmetric funding, outside starts, exact boundaries, continuity, virtual-reserve conservation, wide-range limits, separate fees, numerical bounds and reproducible exports.

## Browser identity and sharing

Teren uses a custom lowercase wordmark in page headers and exported result cards. `public/assets/teren-logo.svg` contains the outlined light lettering; `teren-logo-ink.svg` is its navy version for light backgrounds. `teren-mark.svg` is the separate open-t symbol. Ink-blue surfaces, warm white text and sea-glass accents define the interface. Gold ETH/WETH and striped blue USDC remain distinct from the brand colors.

The symbol is supplied as an SVG favicon and a 16/32/48-pixel ICO fallback. Opaque 180-pixel Apple touch and 192/512-pixel maskable app icons keep the mark inside the central safe area. The manifest identifies the site at its own root. There is no font download, service worker or application build step.

Canonical, Open Graph and large-image social metadata use `https://teren.sh/`. The 1200×630 social preview uses the same wordmark and a calculated, hypothetical `cl-range-v1` illustration before fees. Scenario fragments share this site preview. The 404 page uses root-relative asset and home URLs so deeply nested missing paths also work on the custom domain and local server. Ordinary page links are relative. The active skip link preserves shared scenario fragments when moving keyboard focus to the main content.

The structure check verifies linked files, metadata, PNG/ICO dimensions and manifest paths. The local server supplies correct image/manifest types and preserves HTTP status 404 for missing resources.

To regenerate the committed favicon, ink wordmark, social SVG and raster assets after editing the two source SVGs, run `node scripts/render-brand-assets.js` with the optional Sharp graphics tool. `SHARP_MODULE` can point to its module entry file when Sharp is supplied externally. This is a maintainer tool, not a website dependency. The renderer calculates the social illustration using the existing range model.

## Publishing with GitHub Pages

The workflow in `.github/workflows/pages.yml` tests the project and publishes only `public/` whenever `main` changes. Pull requests run the same checks without publishing. Hosting stays on GitHub Pages; Cloudflare manages the `teren.sh` domain and DNS. The public domain is independent of the repository name.

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

Clicking a same-tab Learn link captures validated calculator inputs, the active lab and any matching source snapshot into `degenerator-learn-return-v1` in session storage. Returning restores the working drafts without changing saved experiments, lesson progress or latest chain snapshots, then consumes that temporary handoff. Explicit shared scenario links take precedence. Browser history restores cached pages directly; stale handoffs are cleared when such a page returns. Unsupported or unreadable handoff data is preserved, and blocked storage leaves navigation usable. Invalid incomplete inputs are not captured.

## Applied learning records

`public/ui/applied-learning.js` composes the three applied exercises beside the existing essentials controller. Strict `#applied=...` routes preserve existing `#lesson=...` links. Editorial definitions live in `public/learning/applied-liquidity.js`; `public/lib/applied-lessons.js` derives fixed assessment targets from the same period presentation used by Inspect. Exploring checkpoints does not change the question. No new fee model or historical capture is introduced.

`public/data/applied-records.js` loads only the two configured bundled replay records, shares requests, validates their evidence and permits retry after failures. The controller rejects stale responses when the selected exercise changes. Applied drafts and completion use their own `passiko-applied-liquidity-v1` key; the essentials schema and all existing keys remain compatible. Unit checks cover optional calculation targets and rounding, interval versus cumulative values, identity checks and independent storage. Browser checks cover direct entry, progression, restoration, Playground transfer, loading failures/races and 390px/320px layouts.

## Lesson consistency checks

`public/lib/lesson-narration.js` narrates the calculated setup and explains each incorrect foundation reason. Token-transfer direction follows the selected price; an unchanged price has a distinct explanation. Benchmarks, total fee targets and additional fees stay explicit. Applied corrective feedback remains scoped to the marked question checkpoint or interval.

`public/models/learning-answer.js` checks the same decimal rounding used in displayed outcomes, with explicit whole-number requirements. It accepts equivalent extra precision without accepting an adjacent incorrectly rounded number. Lesson and progress identifiers are unchanged. The release stamper versions mutable teaching definitions, narration and grading together, while protocol adapter/RPC module identities remain shared. Unit checks cover all distractors, price directions, widths and variations; browser checks verify current versioned teaching imports and cover desktop/mobile feedback.

## Understanding checks

Essentials and applied exercises require an explanation and a transfer answer after changing one assumption. The pure `models/lesson-application.js` derives changed hypothetical outcomes from the selected variation; `lib/lesson-application-copy.js` supplies its questions. `lib/applied-applications.js` defines explicitly hypothetical applications beside fixed recorded questions. The required checkers accept choice identifiers only; predictions and optional numeric answers do not control completion, Continue, or result-card eligibility. The existing numeric checkers remain available only for optional practice within Go deeper.

Choice order is shuffled once per draft and group, then remains stable through checks and reloads. Progress version 1 and existing keys remain unchanged. Parsers add bounded application identifiers and a validated uint32 choice seed while retaining older completion, inputs, predictions, reasoning and numeric practice. A legacy draft has no invented transfer answer. The release stamper updates the changed progress parsers, choice-order helper, teaching copy and checkers together. Browser checks cover conceptual-only completion, incorrect prediction, both kinds of feedback, optional calculation isolation, restoration and desktop/mobile layouts.

## Practical range learning

`models/range-decisions.js` defines three bounded variations for each practical topic and grades only explanation/application choices. Width and outside-principal results use the existing continuous range model. Fee totals are explicitly supplied fictional facts; there is no fee estimator or replay request. `learning/choosing-ranges.js` keeps teaching text and presentation separate from grading. `ui/management-learning.js` owns the chapter, and `lib/management-links.js` accepts only strict `#manage=<id>` routes. Composition stays in `learn-main.js`; controllers do not import one another.

The new `passiko-range-learning-v1` key stores bounded variants, choices and a validated ordering seed. Earlier lesson keys, IDs and completion remain unchanged. Navigation moves from essentials to range choices to recorded history; every topic remains directly accessible. `lib/learning-elements.js` shares radio rendering and metric elements across the three controllers, while editorial pitfalls in `learning/pool-pitfalls.js` appear in the normal results flow. The release stamper versions these imports together. Tests cover model conservation, boundary eligibility, fee-rate counterexamples, unknown earnings, outside exposure, automatic return, independent progress, mixed-route rejection, all variations, wrong predictions, feedback, restoration and desktop/mobile chapter switching.

## Clear entry and project information

`ui/workspaces.js` controls a mobile-only tools disclosure without duplicating destinations or changing fragment routing. Desktop links remain visible. The disclosure closes after a selection and returns keyboard focus before hiding its links. About and Methods are static HTML, share identity metadata/CSP and need no JavaScript. The release stamper and project check include both pages.

`managementApplication` supplies situation-specific follow-ups. Width totals combine calculated principal with supplied fee/cost assumptions; fee-tier totals are explicitly fictional teaching facts; removal and fee collection remain distinct actions. These values do not modify historical records or estimate earned fees. Completed topics remain saved; a restored draft is checked against its displayed situation.

For coverage diagnostics, use the same release-qualified module URL as production consumers. Node treats a bare URL and a URL with `?v=` as separate instances; an unused copy can otherwise obscure the exercised grader in its per-file report. The range-learning test reads the package version for that import. Answer-combination tests and browser restoration checks remain the primary evidence for grading behavior, rather than a project-wide coverage percentage.
