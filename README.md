# Teren

*Look closely.*

A DeFi playground for learning liquidity and lending mechanics. Test a price range, explore a collateralized loan, or inspect a real Uniswap position at a recorded block.

[Liquidity](https://teren.sh/) · [Lending](https://teren.sh/lending.html) · [Learn](https://teren.sh/learn.html) · [Inspect a position](https://teren.sh/#position-lab)

- **Experiment:** full-range and concentrated-liquidity calculators, ordered examples, and saved comparisons.
- **Learn:** six essentials lessons, a final challenge, three practical range exercises and three exercises using verified historical cases. Every topic is available directly.
- **Inspect:** Ethereum WETH/USDC pool and v3 NFT snapshots, principal, fee accounting and JSON exports.
- **Historical cases:** start with an in-range baseline, then follow a 33-hour position through exits and returns. Inspect interval fees, active/outside time and the holding comparison.
- **Pool mechanics:** a separate virtual swap and liquidity sandbox, linked from Experiment and Learn.
- **Lending:** an ETH/USDC loan lab and four conceptual lessons: supply, borrow, change conditions, then compare repayment with adding collateral. Prices, interest rates and collateral rules are hypothetical inputs.

The liquidity calculators use hypothetical prices and assumed cash fees. The lending lab uses fixed simple interest and Aave v3-style collateral concepts, with editable teaching assumptions rather than current market quotes. Snapshots record on-chain state at one block. Historical liquidity cases calculate earned fee tokens and time in range from recorded periods, with independent accounting checks. These tools do not reconstruct a position’s lifetime profit; the fixed-position replay is not an arbitrary-range backtester. The interface identifies which kind of result you are viewing.

No wallet connection or transactions. The site runs on GitHub Pages; saved work stays in your browser unless exported.

## Run locally

Node.js 22 or later; no installation step or application dependencies.

```sh
npm start
npm test
npm run check
```

Open http://127.0.0.1:3000/ after starting the development server. Browser interaction checks run in CI before publication; see [development](docs/development.md) for the Chromium setup.

## Documentation

- [Using the tools and saved experiments](docs/guide.md)
- [Lesson goals, misconceptions and evidence](docs/learning.md)
- [Calculation models and assumptions](docs/models.md)
- [Historical replay method and recorded evidence](docs/replay.md)
- [Chain reads, fee accounting and snapshot validation](docs/data.md)
- [Architecture, local checks and deployment](docs/development.md)
- [Custom domain and repository cutover](docs/domain-setup.md)
- [Product decisions](DECISIONS.md)
- [Release history](CHANGELOG.md)

MIT licensed. The adapted Uniswap tick arithmetic retains its [separate notice](public/licenses/uniswap-v3-sdk.txt).
