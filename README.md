# Teren

*Look closely.*

A place to understand DeFi through short lessons and experiments you can change. Teren currently covers **liquidity** and **lending**: how token balances change, what fees mean, how debt grows and what makes liquidation possible.

[Open Teren](https://teren.sh/) · [Liquidity lessons](https://teren.sh/learn.html) · [Lending lessons](https://teren.sh/lending.html#learn) · [About](https://teren.sh/about.html)

Start with a lesson or open the setup you want to test. Lessons use predictions, explanations and changed situations to check understanding; required answers involve no calculations. Links open Experiment in a separate tab so you can explore the idea without replacing your working draft.

Visual lessons let you follow swaps, pool ownership, supplying, borrowing and loops one action at a time, or use sliders to explore token balances, price ranges, a loan’s health factor and equal-budget responses to debt. The prediction question stays visible, and answering it is optional.

## Two topics

**[Liquidity](https://teren.sh/#experiment)** compares full-range and concentrated-liquidity positions with holding their starting tokens. Change prices, bounds and assumed cash fees, save comparisons, or try virtual swaps and deposits. Learn has six foundation lessons and a final challenge, followed by three range-choice exercises and three exercises using recorded historical cases.

**[Lending](https://teren.sh/lending.html#experiment)** explores supplying ETH and borrowing USDC. The single-loan lab compares repayment with adding collateral and illustrates liquidation costs. The **[borrowing-loop lab](https://teren.sh/lending.html#loops)** follows borrowed USDC into more ETH, compares price exposure with holding and previews unwinding. Compare two round counts under identical conditions, or step through the money movements while building and unwinding a loop. Four foundation lessons lead to three loop lessons; every lesson is directly accessible. The single-loan model uses fixed simple interest, while loops offer simple interest or continuous compounding. Rates and collateral rules are editable teaching assumptions informed by Aave v3 concepts.

## Models and recorded evidence

- **Hypothetical experiments:** liquidity fee income, prices and lending rates/rules are inputs. Outcomes describe those assumptions; they are not live quotes or forecasts.
- **[Snapshots](https://teren.sh/#inspect):** Inspect reads Ethereum mainnet WETH/USDC Uniswap v2 pools and v3 NFT positions at a recorded block. It shows principal, fee accounting where available and exportable JSON. A snapshot does not establish lifetime profit.
- **[Historical liquidity cases](https://teren.sh/#historical-case):** two unchanged v3 positions over about 83 minutes and 33 hours, with earned fee tokens, time in range and a comparison with holding the exact starting principal tokens. Chain reads, event queries and independent collection simulations checked the records at capture. The browser validates the bundled arithmetic without re-querying Ethereum. These are fixed-position records, not an arbitrary-range backtester.

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

- [Using the tools and saved experiments](docs/guide.md)
- [Lesson goals, misconceptions and evidence](docs/learning.md)
- [Calculation models and assumptions](docs/models.md)
- [Historical replay method and recorded evidence](docs/replay.md)
- [Chain reads, fee accounting and snapshot validation](docs/data.md)
- [Architecture, local checks and deployment](docs/development.md)
- [Custom domain and repository cutover](docs/domain-setup.md)
- [Product decisions](DECISIONS.md)
- [Review questions and open blind spots](docs/review.md)
- [Release history](CHANGELOG.md)

MIT licensed. The adapted Uniswap tick arithmetic retains its [separate notice](public/licenses/uniswap-v3-sdk.txt).
