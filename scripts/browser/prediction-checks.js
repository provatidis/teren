import assert from 'node:assert/strict';
import { LEARNING_ROUTES } from '../../public/lib/entry-links.js';

export async function checkPredictions({ evaluate, click, text, navigate, reload, base, call }) {
  const keys = ['degenerator-learning-liquidity-v1', 'passiko-range-learning-v1',
    'passiko-applied-liquidity-v1', 'teren-lending-learning-v1', 'teren-loop-learning-v1'];
  const saved = await evaluate(`Object.fromEntries(${JSON.stringify(keys)}.map(key => [key, localStorage.getItem(key)]))`);
  const ready = () => evaluate(`new Promise((resolve, reject) => {
    const end = Date.now() + 5000;
    const check = () => {
      const applied = document.getElementById('learn-applied');
      if (!applied || applied.hidden || applied.getAttribute('aria-busy') === 'false') resolve();
      else if (Date.now() > end) reject(new Error('Historical record did not finish loading'));
      else setTimeout(check, 25);
    }; check();
  })`);
  const nonvisual = {
    'range-boundaries': ['path', 'both-inside'], 'fee-tiers': ['trades', 'smaller-share'],
    'range-management': ['asset', 'automatic'], 'fees-over-time': ['growth', 'same'],
    'between-samples': ['returned', 'edge-placement'], 'period-vs-holding': ['price-returned', 'smaller-lead'],
    'final-challenge': ['total', 'relative-gap'],
  };
  try {
    for (const width of [1440, 390]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 750 });
      await evaluate(`${JSON.stringify(keys)}.forEach(key => localStorage.removeItem(key))`);
      for (const route of Object.keys(LEARNING_ROUTES)) {
        const id = route.split('=')[1];
        const prefix = route.startsWith('lending') ? 'lend' : route.includes('#manage=') ? 'manage' : route.includes('#applied=') ? 'applied' : 'learn';
        const result = prefix === 'learn' ? 'learn-results' : prefix + '-observe';
        const selector = `#${prefix}-prediction-field`;
        await navigate(base + route); await ready();
        assert.equal(await evaluate(`document.querySelector('${selector} input').checkVisibility()`), true, route + ': choices are visible immediately');
        assert.equal(await evaluate(`document.querySelector('${selector} input:checked') === null`), true);
        const setup = await evaluate(`(() => {
          const field = document.querySelector('${selector}');
          const section = field.closest('article');
          const setup = [...section.querySelectorAll('.learn-setup')].find(node => node.checkVisibility());
          return setup ? { text: setup.textContent, size: parseFloat(getComputedStyle(setup).fontSize),
            beforeQuestion: setup.getBoundingClientRect().bottom <= field.getBoundingClientRect().top } : null;
        })()`);
        assert.ok(setup?.text.length > 60, route + ': the prediction has a visible setup');
        assert.ok(setup.size >= 15 && setup.beforeQuestion, route + ': readable setup precedes the question');
        if (id === 'build') assert.match(setup.text, /Borrow 5,000 USDC → buy ETH with all of it → supply/);
        assert.equal(await evaluate(`document.querySelector('${selector}').closest('.scene-prediction').textContent.includes('scored')`), false);
        assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
        assert.equal(await evaluate(`document.querySelector('${selector}').closest('.scene-prediction').querySelector('button').textContent`), 'Not sure — show me →');
        await evaluate(`document.querySelector('${selector}').closest('.scene-prediction').querySelector('button').focus()`);
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
        assert.equal(await evaluate(`document.getElementById('${result}').hidden`), false, route + ': skip reveals the outcome');
        assert.equal(await evaluate(`document.querySelector('${selector} input:checked') === null`), true, 'Skipping must not invent a prediction');
        assert.doesNotMatch(await text(prefix + '-prediction-feedback'), /Your prediction matches|You expected:/);
        assert.equal(await evaluate(`document.querySelector('#${prefix}-prediction-feedback > strong').textContent`), 'What happens');
        assert.equal(await evaluate(`document.getElementById('${prefix}-prediction-feedback').dataset.state`), 'skipped');
        assert.equal(await evaluate(`document.querySelector('${selector}').closest('.scene-prediction').querySelector('button').textContent`), 'Show the outcome again ↓');
        assert.equal(await evaluate(`document.getElementById('${prefix}-continue').hidden`), true, 'Viewing alone does not complete a lesson');
        if (id !== 'period-vs-holding') {
          const label = await text(prefix + '-application-label');
          assert.ok(label.trim().length > 4, route + ': name the next situation');
          assert.doesNotMatch(label, /APPLY|THOUGHT EXPERIMENT|CHANGE THE SITUATION/);
        }
        const evidenceFits = await evaluate(`Array.from(document.querySelectorAll('.learn-question-evidence')).filter(el => el.checkVisibility()).every(el => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && !!document.getElementById(el.getAttribute('aria-labelledby'))?.textContent;
        })`);
        assert.equal(evidenceFits, true, route + ': question evidence fits and has an accessible heading');
        if (nonvisual[id]) {
          for (const [group, value] of [['reason', nonvisual[id][0]], ['application', nonvisual[id][1]]]) {
            await evaluate(`document.querySelector('input[name="${prefix}-${group}"][value="${value}"]').click()`);
          }
          if (id === 'final-challenge') {
            await click('learn-check');
            assert.equal(await text('learn-feedback-title'),'Review your setup.','Correct choices alone do not complete the construction task.');
            assert.equal(await evaluate("document.getElementById('learn-continue').hidden"),true);
            await click('liquidity-task-example');
          }
          await click(prefix + '-check');
          assert.equal(await text(prefix + '-feedback-title'), 'Both answers are correct.');
        }
        await reload(); await ready();
        assert.equal(await evaluate(`document.getElementById('${result}').hidden`), false, route + ': skipped outcomes restore');
        assert.equal(await evaluate(`document.querySelector('${selector} input:checked') === null`), true);
        assert.equal(await evaluate(`document.querySelector('${selector}').closest('.scene-prediction').querySelector('button').textContent`), 'Show the outcome again ↓', route + ': restored controls distinguish returning from first reveal');
        if (nonvisual[id]) assert.equal(await text(prefix + '-feedback-title'), 'Both answers are correct.', 'Skipped completion restores');
      }
    }
  } finally {
    await evaluate(`Object.entries(${JSON.stringify(saved)}).forEach(([key, value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value))`);
  }
  console.log('PASS: visible predictions in all 20 lessons at desktop/mobile sizes, keyboard skip, no fabricated guesses, conceptual completion and restored progress');
}
