import assert from 'node:assert/strict';
import { readLSTHash } from '../../public/lib/lst-links.js';

export async function checkLSTDiscountLesson({ evaluate, click, fill, text, navigate, reload, base, call, nextEvent }) {
  const lesson = 'lending.html#lst-lesson=discount';
  const stage = () => evaluate("document.getElementById('lst-lesson-scene').dataset.stage");
  const visible = id => evaluate(`document.getElementById(${JSON.stringify(id)}).checkVisibility()`);
  const link = () => evaluate("document.getElementById('lend-explore').href");
  const balances = () => evaluate(`['sale', 'debt', 'health'].map(name => {
    const amount = document.querySelector('#lst-lesson-scene [data-metric="' + name + '"] strong');
    return Number.parseFloat(amount.textContent.replaceAll(',', ''));
  })`);
  const personal = () => evaluate("[localStorage.getItem('teren-lst-loop-draft-v1'), localStorage.getItem('teren-experiment-location-v1')]");
  async function follow(id) {
    const changed = nextEvent('Page.navigatedWithinDocument');
    await click(id);
    await changed;
  }
  async function choose(group, value) {
    await evaluate(`document.querySelector('input[name="lend-${group}"][value="${value}"]').click()`);
  }
  async function checkLedger(id, afterCollateral, afterEquity) {
    const actual = await evaluate(`Object.fromEntries(Array.from(
      document.querySelectorAll('#${id} [data-balance]'),
      row => [row.dataset.balance, Array.from(row.querySelectorAll('td'), cell => parseFloat(cell.textContent))]
    ))`);
    const expected = { collateral: [4, afterCollateral], debt: [3.75, 1.875], equity: [0.75, afterEquity] };
    for (const [balance, pair] of Object.entries(expected)) {
      assert.equal(actual[balance]?.length, 2, balance + ' is shown before and after the event');
      pair.forEach((value, i) => {
        assert.ok(Math.abs(actual[balance][i] - value) < 0.0001, id + ' ' + balance + ': ' + actual[balance]);
      });
    }
  }

  async function exploreLiquidation(width, marketInput) {
    const disclosure = 'lst-liquidation-walkthrough';
    assert.equal(await visible('lend-continue'), true, 'Completion is available without opening the optional event');
    assert.equal(await evaluate(`document.getElementById('${disclosure}').open`), false);
    await evaluate(`document.querySelector('#${disclosure} > summary').click()`);
    assert.equal(await visible('lst-liquidation-ledger'), true);
    assert.equal(await visible('lst-zero-outcome'), false);
    const transfers = await evaluate(`Array.from(document.querySelectorAll('#${disclosure} .liquidation-transfers dt'),
      label => [label.textContent, label.nextElementSibling.textContent])`);
    assert.match(transfers[0][0], /liquidator.*pays.*lender/i);
    assert.equal(transfers[0][1], '1.875 WETH');
    assert.match(transfers[1][0], /liquidator.*collateral/i);
    assert.equal(transfers[1][1], '1.7167 wstETH');
    await checkLedger('lst-liquidation-ledger', 2.2833333333, 0.69375);

    const [prediction, expectedFeedback] = {
      1440: ['less', 'different'],
      390: ['same', 'match'],
      320: [null, 'skipped'],
    }[width];
    if (prediction) await evaluate(`document.querySelector('input[name="lst-zero-prediction"][value="${prediction}"]').click()`);
    await click('lst-zero-reveal');
    assert.equal(await visible('lst-zero-outcome'), true);
    const feedbackState = () => evaluate("document.getElementById('lst-zero-feedback').dataset.state");
    assert.equal(await feedbackState(), expectedFeedback);
    await checkLedger('lst-zero-ledger', 2.3333333333, 0.75);
    if (prediction === 'less') {
      await evaluate("document.querySelector('input[name=lst-zero-prediction][value=same]').click()");
      assert.equal(await visible('lst-zero-outcome'), false);
      await click('lst-zero-reveal');
      assert.equal(await feedbackState(), 'match', 'Changing the prediction gives the matching explanation');
    }
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));

    const links = [];
    for (const [id, bonus] of [['lst-liquidation-lab', 3], ['lst-zero-lab', 0]]) {
      assert.equal(await visible(id), true);
      const href = await evaluate(`document.getElementById('${id}').href`);
      const url = new URL(href);
      assert.equal(url.searchParams.get('from'), 'lesson');
      assert.equal(url.searchParams.get('show'), 'liquidation');
      assert.equal(await evaluate(`document.getElementById('${id}').target`), '_blank');
      const shared = readLSTHash(url.hash);
      assert.equal(shared.view, 'hold');
      assert.deepEqual(shared.input, { ...marketInput, repayPercent: 50, bonus });
      links.push({ href, bonus });
    }
    return links;
  }

  await navigate(base + 'lending.html#lst-loops');
  const keys = ['teren-lst-loop-draft-v1', 'teren-experiment-location-v1', 'teren-lst-learning-v1', 'teren-learning-location-v1'];
  const saved = await evaluate(`${JSON.stringify(keys)}.map(k => [k, localStorage.getItem(k)])`);
  const chapter = await evaluate("sessionStorage.getItem('teren-lending-chapter-v1')");
  try {
    for (const width of [1440, 390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 750 });
      await evaluate("localStorage.removeItem('teren-lst-learning-v1')");
      await navigate(base + 'lending.html#lst-loops');
      await click('lst-view-build');
      await fill('lst-targetExposure', '2.5');
      const original = await personal();
      const learn = width < 750 ? 'lending-nav-learn' : 'lending-start';
      assert.equal(await visible(learn), true);
      await follow(learn);
      assert.equal(await evaluate('location.hash'), '#lst-lesson=discount');
      assert.equal(await stage(), 'start');
      const [startSale, startDebt, startHealth] = await balances();
      assert.ok(startSale > startDebt && startDebt > 0 && startHealth > 1);
      assert.equal(await visible('lend-assessment'), false);

      await evaluate("document.querySelector('#lst-lesson-scene .scene-prediction-show, #lend-money-flow .scene-prediction-show').click()");
      assert.equal(await stage(), 'discount');
      const [sale, debt, health] = await balances();
      assert.ok(sale < startSale);
      assert.equal(debt, startDebt);
      assert.equal(health, startHealth);
      const conversionHref = await link();
      assert.equal(new URL(conversionHref).searchParams.get('from'), 'lesson');
      assert.equal(await evaluate("document.getElementById('lend-explore').target"), '_blank');

      await choose('reason', 'debt-fixed');
      await choose('application', 'balance-covers');
      await click('lend-check');
      assert.equal(await text('lend-feedback-title'), 'Review your answers.');
      assert.equal(await visible('lst-lesson-followup'), true);
      assert.equal(await visible('lend-continue'), false);
      await choose('application', 'health-only');
      await click('lend-check');
      assert.equal(await text('lend-feedback-title'), 'Both answers are correct.');
      await evaluate("document.querySelector('[data-lst-lesson-stage=market]').click()");
      const [sameSale, sameDebt, marketHealth] = await balances();
      assert.deepEqual([sameSale, sameDebt], [sale, debt]);
      assert.ok(marketHealth < 1);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));

      const marketHref = await link();
      const conversion = readLSTHash(new URL(conversionHref).hash);
      const market = readLSTHash(new URL(marketHref).hash);
      assert.equal(conversion.status, 'ready');
      assert.equal(market.status, 'ready');
      assert.equal(conversion.view, 'hold');
      assert.equal(market.view, 'hold');
      assert.equal(conversion.input.oracleMode, 'rate');
      assert.deepEqual(market.input, { ...conversion.input, oracleMode: 'market' });
      const liquidationLinks = await exploreLiquidation(width, market.input);
      for (const [href, expectedHealth] of [[conversionHref, health], [marketHref, marketHealth]]) {
        await navigate(href);
        assert.equal(await visible('lst-hold'), true);
        assert.equal(await evaluate("document.getElementById('lst-liquidation').open"), false, 'Ordinary experiment handoffs open the position overview');
        assert.equal(Number.parseFloat(await text('lst-health')), expectedHealth);
        assert.equal(Number.parseFloat(await text('lst-debt')), debt);
        await reload();
        assert.deepEqual(await personal(), original, 'Opening or reloading a lesson example preserves the working LST draft and Home resume link');
      }
      for (const { href, bonus } of liquidationLinks) {
        await navigate(href);
        assert.equal(await visible('lst-hold'), true);
        assert.equal(await evaluate("document.getElementById('lst-liquidation').open"), true);
        assert.equal(await evaluate('document.activeElement.id'), 'lst-liquidation-summary');
        assert.equal(await visible('lst-liquidation-results'), true);
        assert.equal(await evaluate("document.getElementById('lst-bonus').value"), String(bonus));
        assert.equal(await evaluate("document.getElementById('lst-repayPercent').value"), '50');
        const lab = await evaluate(`Object.fromEntries(Array.from(
          document.querySelectorAll('#lst-liquidation-results dt'),
          label => [label.textContent, label.nextElementSibling.textContent]
        ))`);
        assert.equal(lab['WETH repaid by the liquidator'], '1.875 WETH');
        assert.equal(lab['WETH debt remaining'], '1.875 WETH');
        assert.equal(lab['wstETH removed'], bonus ? '1.7167 wstETH' : '1.6667 wstETH');
        assert.equal(lab['Bonus at oracle valuation'], bonus ? '0.05625 WETH' : '0 WETH');
        assert.equal(lab['Net market value after this event'], bonus ? '0.69375 WETH' : '0.75 WETH');
        await reload();
        assert.deepEqual(await personal(), original);
      }
      await navigate(base + lesson);
      assert.equal(await visible('lend-continue'), true, 'Completed advanced lesson restores');
      await follow('lending-nav-experiment');
      assert.equal(await evaluate("document.getElementById('lst-targetExposure').value"), '2.5');
    }
  } finally {
    await evaluate(`${JSON.stringify(saved)}.forEach(([k,v]) => v === null ? localStorage.removeItem(k) : localStorage.setItem(k,v))`);
    await evaluate(chapter === null ? "sessionStorage.removeItem('teren-lending-chapter-v1')" : `sessionStorage.setItem('teren-lending-chapter-v1',${JSON.stringify(chapter)})`);
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  }
  console.log('PASS: LST lesson distinguishes market proceeds, debt and oracle health; both exact scenarios and the original working lab survive desktop and phone handoffs');
  console.log('PASS: optional partial liquidation, before/after balances, zero-bonus prediction and retry, and exact liquidation handoffs at 1440, 390 and 320px');
}
