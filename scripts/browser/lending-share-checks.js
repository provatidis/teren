import assert from 'node:assert/strict';
import { loanHash } from '../../public/lib/lending-links.js';
import { loopHash } from '../../public/lib/loop-links.js';
import { lstHash } from '../../public/lib/lst-links.js';
import { LOAN_DEFAULTS } from '../../public/models/collateral-loan-v2.js';
import { LOOP_DEFAULTS } from '../../public/models/borrowing-loop-v1.js';
import { LST_DEFAULTS } from '../../public/models/lst-loop-v2.js';

export async function checkLendingShareLinks({ evaluate, click, fill, navigate, base }) {
  const page = new URL('lending.html', base).href;
  const referral = '?utm_source=conference&ref=example';
  const lesson = referral + '&from=lesson&show=liquidation';
  const liquidation = { repayPercent: 40, bonusPercent: 7 };
  const cases = [
    { lab: 'loan', daysField: 'loan-days', hash: days => loanHash({ ...LOAN_DEFAULTS, days, borrow: 4300 }, liquidation) },
    { lab: 'loop', daysField: 'loop-days', hash: days => loopHash({ ...LOOP_DEFAULTS, days }, 3, 40, liquidation) },
    { lab: 'lst', daysField: 'lst-days-input', hash: days => lstHash({ ...LST_DEFAULTS, days }, 'hold', { targetExposure: 2 }) },
  ];
  await navigate(page);
  const saved = await evaluate(`[
    ...['teren-experiment-location-v1', 'teren-lst-loop-draft-v1'].map(key => ['localStorage', key, localStorage.getItem(key)]),
    ...['teren-lending-draft-v1', 'teren-liquidation-draft-v1', 'teren-loop-draft-v1'].map(key => ['sessionStorage', key, sessionStorage.getItem(key)])
  ]`);
  try {
    for (const { lab, daysField, hash } of cases) {
      await navigate(page + referral + hash(21));
      await fill(daysField, '37');
      const expected = page + hash(37);
      await evaluate(`Object.defineProperty(navigator, 'clipboard', {
        configurable: true, value: { writeText: async href => { window.copiedLendingSetup = href; } }
      })`);
      await click(lab + '-share');
      assert.equal(await evaluate('window.copiedLendingSetup'), expected, lab + ' copies only the page and edited scenario');
      assert.equal(await evaluate('location.search'), referral);
      await navigate(page + lesson + hash(21));
      await fill(daysField, '37');
      await evaluate(`Object.defineProperty(navigator, 'clipboard', {
        configurable: true, value: { writeText: async () => { throw new Error('Clipboard unavailable'); } }
      })`);
      await click(lab + '-share');
      const fallback = await evaluate(`document.getElementById('${lab}-share-url').value`);
      assert.equal(await evaluate('document.activeElement.id'), lab + '-share-url');
      assert.equal(fallback, expected, lab + ' offers the same clean link for manual copying');
      assert.equal(await evaluate('location.search'), lesson, 'Sharing leaves the current tab in its original context');
      await navigate(fallback);
      assert.equal(await evaluate(`document.getElementById('${daysField}').value`), '37');
    }
  } finally {
    await evaluate(`${JSON.stringify(saved)}.forEach(([storage, key, value]) => {
      if (value === null) window[storage].removeItem(key); else window[storage].setItem(key, value);
    })`);
  }
  console.log('PASS: all three lending labs copy and reopen the edited scenario without referral or lesson parameters in clipboard and fallback links');
}
