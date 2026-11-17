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
      for (const [href, expectedHealth] of [[conversionHref, health], [marketHref, marketHealth]]) {
        await navigate(href);
        assert.equal(await visible('lst-hold'), true);
        assert.equal(Number.parseFloat(await text('lst-health')), expectedHealth);
        assert.equal(Number.parseFloat(await text('lst-debt')), debt);
        await reload();
        assert.deepEqual(await personal(), original, 'Opening or reloading a lesson example preserves the working LST draft and Home resume link');
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
}
