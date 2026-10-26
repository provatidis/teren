# Teren

*Look closely.*

A place to test DeFi assumptions and understand the mechanisms behind them, through experiments, recorded evidence and short lessons. Teren currently covers **liquidity** and **lending**: how token balances change, what fees mean, how debt grows and what makes liquidation possible.

[Open Teren](https://teren.sh/) · [Liquidity lessons](https://teren.sh/learn.html) · [Lending lessons](https://teren.sh/lending.html#learn) · [About](https://teren.sh/about.html)

Home gives direct labs and guided lessons equal prominence. Continue experimenting restores your last edited assumptions; Continue learning returns to your last opened lesson. Save named liquidity, loan and loop experiments with notes, duplicate them as variations, or compare saved alternatives. Lessons use predictions, explanations and changed situations to check understanding; required answers involve no calculations. Links open Experiment in a separate tab so you can explore the idea without replacing your working draft.

Visual lessons let you follow swaps, pool ownership, supplying, borrowing and loops one action at a time, or use sliders to explore token balances, price ranges, a loan’s health factor, equal-budget responses to debt, and holding versus looping as prices or interest change. Prediction questions and choices stay visible, with a “Not sure — show me” route. Predictions are ungraded; completion checks explanation and application.

Try [Follow the fees](https://teren.sh/liquidity.html#follow-fees) to see how hypothetical trading batches divide fees between active ranges and other LPs, then keep those fee tokens through a range exit. Tighten the other LPs’ range without adding capital and watch your share change. Optional illustrations explain arbitrage and temporary fee competition.

## Two topics

**[Liquidity](https://teren.sh/liquidity.html#experiment)** compares full-range and concentrated-liquidity positions with holding their starting tokens. Change prices, bounds and assumed cash fees, save comparisons, or try virtual swaps and deposits. Learn has six foundation lessons and a final challenge, followed by three range-choice exercises and three exercises using recorded historical cases.

**[Lending](https://teren.sh/lending.html#experiment)** explores supplying ETH and borrowing USDC. The single-loan lab compares repayment with adding collateral and illustrates liquidation costs. The **[borrowing-loop lab](https://teren.sh/lending.html#loops)** follows borrowed USDC into more ETH, compares price exposure with holding and previews unwinding. A separate liquidation event shows debt repaid, collateral taken, the bonus cost and any unpaid debt. Compare round counts and borrowing fractions under shared market conditions. Follow the money through your own construction and unwind preview, including costs and any remaining debt. Four foundation lessons lead to three loop lessons; every lesson is directly accessible. Single loans and ETH/USDC loops offer simple interest or continuous compounding. In the single-loan lab, a time slider shows original balances and added interest together; the selected rule drives the balances, health factor, responses and liquidation illustration. Older single-loan setups and lessons retain simple interest. Rates and collateral rules are editable teaching assumptions informed by Aave v3 concepts.

The **[correlated-asset loop lab](https://teren.sh/lending.html#lst-loops)** follows wstETH collateral against WETH debt. Choose a target holding or build in rounds, compare staking growth with borrowing costs, then stress the market discount and oracle assumptions. Compare exiting into WETH with repaying debt and keeping unsold wstETH; follow either route's balances and costs. Save exact assumptions and compare named variations. This is a separate hypothetical model from the ETH/USDC loop, with no live Aave or Morpho settings.

## Models and recorded evidence

- **Hypothetical experiments:** prices, assumed cash fees and lending rates/rules are inputs. Follow the fees instead calculates token fees from chosen trading batches and competing liquidity. Outcomes describe those assumptions; they are not live quotes or forecasts.
- **[Controlled width comparison](https://teren.sh/liquidity.html#compare-widths):** keep capital and the starting 50/50 basket equal, then move one shared price. Compare token balances, principal and fee targets for two widths. Share the setup or open either range in the lab; fee earnings are not estimated.
- **[Snapshots](https://teren.sh/liquidity.html#inspect):** Inspect reads Ethereum mainnet WETH/USDC Uniswap v2 pools and v3 NFT positions at a recorded block. It shows principal, fee accounting where available and exportable JSON. A snapshot does not establish lifetime profit.
- **[Historical liquidity cases](https://teren.sh/liquidity.html#historical-case):** three unchanged v3 positions over about 83 minutes, 33 hours and one week, with earned fee tokens, time in range and a comparison with holding the exact starting principal tokens. Chain reads, event queries and independent collection simulations checked the records at capture. The browser validates the bundled arithmetic without re-querying Ethereum. These are fixed-position records, not an arbitrary-range backtester.
- **[Two ranges, the same week](https://teren.sh/liquidity.html#fee-comparison):** compare narrower and wider real positions selected before inspecting earnings. Both started active in the same pool. A shared timeline separates fees, performance against each position’s own holding basket, and dollar change. Collections remain in the accounting; earlier claims are excluded. This pair illustrates one week, rather than typical earnings or the effect of width alone.

Recorded evidence currently covers liquidity only. Lending has no live position imports or verified historical records. Loop construction and unwinding are hypothetical sequences, not protocol execution plans. See [Methods](https://teren.sh/methods.html) for what each kind of result can establish.

No wallet connection or transactions. The static site runs on GitHub Pages. Working drafts and learning progress stay in your browser; links and exports let you keep or share supported setups. Feedback is welcome at [hello@teren.sh](mailto:hello@teren.sh) or through [GitHub issues](https://github.com/provatidis/teren/issues).

## Run locally

Node.js 22 or later; no installation step or application dependencies.

```sh
npm start
npm test
npm run check
npm run build
```

Open http://127.0.0.1:3000/ after starting the development server. `npm run build` generates `dist/` with content-hashed modules and styles; GitHub Pages publishes that tested output. To inspect the built site locally, run `SITE_DIR=dist npm start`. Browser interaction checks run in CI before publication; see [development](docs/development.md) for the Chromium setup.

## Documentation

| Start here for… | Document |
| --- | --- |
| Using a lab, lesson, recorded case or saved setup | [User guide](docs/guide.md) |
| Lesson goals, misconceptions and observation tasks | [Learning design](docs/learning.md) |
| Formulas, benchmarks and model assumptions | [Calculation models](docs/models.md), with [LST-loop accounting](docs/lst-loops.md) |
| Historical selection, capture evidence and reproduction | [Historical cases](docs/replay.md) |
| Live reads, fee accounting and snapshot-file validation | [Chain data](docs/data.md) |
| Architecture, local checks, releases and documentation upkeep | [Development](docs/development.md) |
| Domain configuration and the completed repository cutover | [Domain setup](docs/domain-setup.md) |
| Current strengths, consequential limits and next validation | [Review status, evidence gaps and limitations](docs/review.md) |
| Durable product and engineering choices | [Decisions](DECISIONS.md) |
| Candidate work to discuss next | [Roadmap](docs/roadmap.md) |
| Past releases and review observations | [Changelog](CHANGELOG.md) and [historical review archive](docs/review-history.md) |

MIT licensed. The adapted Uniswap tick arithmetic retains its [separate notice](public/licenses/uniswap-v3-sdk.txt).
