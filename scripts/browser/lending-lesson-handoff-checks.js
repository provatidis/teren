import assert from 'node:assert/strict';
import { readLoanHash } from '../../public/lib/lending-links.js';
import { readLoopHash } from '../../public/lib/loop-links.js';

export async function checkLendingLessonHandoffs({ evaluate, navigate, reload, fill, click, base }) {
  const lab = base + 'lending.html';
  const resumeKey = 'teren-experiment-location-v1';
  const draftKeys = ['teren-lending-draft-v1', 'teren-liquidation-draft-v1', 'teren-loop-draft-v1'];
  const value = id => evaluate(`document.getElementById('${id}').value`);
  const readKeys = (storage, keys) => evaluate(`${JSON.stringify(keys)}.map(k => [k, ${storage}.getItem(k)])`);
  const restore = (storage, entries) => evaluate(`${JSON.stringify(entries)}.forEach(([k,v]) => v === null
    ? ${storage}.removeItem(k) : ${storage}.setItem(k,v))`);
  const drafts = () => readKeys('sessionStorage', draftKeys);
  const bookmark = () => evaluate(`localStorage.getItem('${resumeKey}')`);
  async function homeLink() {
    await navigate(base);
    assert.equal(await evaluate("document.getElementById('home-experiment').checkVisibility()"), true);
    return evaluate("document.getElementById('home-experiment').href");
  }
  async function exampleLink(selector) {
    const link = await evaluate(`(() => {
      const a = document.querySelector(${JSON.stringify(selector)});
      return { href: a.href, target: a.target, visible: a.checkVisibility() };
    })()`);
    assert.equal(link.target, '_blank');
    assert.equal(link.visible, true);
    const url = new URL(link.href);
    assert.equal(url.searchParams.get('from'), 'lesson');
    return url;
  }

  await navigate(base);
  const local = await readKeys('localStorage', [resumeKey, 'teren-learning-location-v1', 'teren-lending-learning-v1', 'teren-loop-learning-v1', 'degenerator-experiments-v1']);
  const session = await readKeys('sessionStorage', [...draftKeys, 'teren-lending-chapter-v1']);
  try {
    await navigate(lab + '#loops');
    await click('loop-reset');
    await fill('loop-rounds', '4');
    await navigate(lab + '#experiment');
    await click('loan-reset');
    await fill('loan-borrow', '4132');
    await fill('liquidation-bonusPercent', '7');
    const personal = await homeLink();
    const ownLoan = readLoanHash(new URL(personal).hash);
    assert.equal(ownLoan.input.borrow, 4132);
    assert.equal(ownLoan.input.interestMode, 'compound');
    assert.equal(ownLoan.liquidation.bonusPercent, 7);
    const originalDrafts = await drafts(), originalBookmark = await bookmark();

    async function checkIsolated(url, field, starting, edited) {
      await navigate(url.href);
      assert.equal(await value(field), starting);
      assert.equal(await bookmark(), originalBookmark, 'Opening the example preserves Home');
      await fill(field, edited);
      assert.equal(await value(field), edited);
      assert.equal(await bookmark(), originalBookmark, 'Exploring the example preserves Home');
      await reload();
      assert.equal(await value(field), edited, 'Reload restores the edited example in its own tab');
      assert.deepEqual(await drafts(), originalDrafts, 'The personal loan, liquidation settings and loop drafts survive');
      assert.equal(await homeLink(), personal);
    }

    await navigate(lab + '#lesson=borrow');
    await click('lend-reveal');
    const borrow = await exampleLink('#lend-explore');
    const maximum = await exampleLink('#lend-application-evidence .learn-explore');
    assert.equal(readLoanHash(borrow.hash).input.borrow, 5000);
    assert.equal(readLoanHash(maximum.hash).input.borrow, 7500);
    await checkIsolated(borrow, 'loan-borrow', '5000', '3300');
    await checkIsolated(maximum, 'loan-borrow', '7500', '6500');

    await navigate(lab + '#loop-lesson=build');
    await click('lend-reveal');
    const loop = await exampleLink('#lend-explore');
    assert.equal(readLoopHash(loop.hash).input.rounds, 1);
    await checkIsolated(loop, 'loop-rounds', '1', '3');
    await navigate(personal);
    assert.equal(await value('loan-borrow'), '4132');
    assert.equal(await value('liquidation-bonusPercent'), '7');

    // Unmarked legacy loan links and regular loop links become normal working experiments.
    await navigate(lab + borrow.hash);
    assert.equal(await value('loan-interestMode'), 'simple');
    await fill('loan-borrow', '3200');
    assert.equal(readLoanHash(new URL(await homeLink()).hash).input.borrow, 3200);
    await navigate(lab + loop.hash);
    await fill('loop-rounds', '2');
    assert.equal(readLoopHash(new URL(await homeLink()).hash).input.rounds, 2);

    await evaluate(`localStorage.removeItem('${resumeKey}')`);
    await navigate(borrow.href);
    await navigate(base);
    assert.equal(await evaluate("document.getElementById('home-experiment').hidden"), true,
      'A lesson visit alone does not create a personal experiment');

    await navigate(maximum.href);
    await fill('loan-borrow', '6100');
    await click('loan-save');
    await fill('experiment-name', 'My borrowing variation');
    await click('experiment-save-confirm');
    assert.equal(readLoanHash(new URL(await homeLink()).hash).input.borrow, 6100,
      'Explicitly saving a lesson variation makes it available from Home');
    await navigate(lab + '?from=lesson#saved-experiments');
    await evaluate(`Array.from(document.querySelectorAll('#experiments-list li'))
      .find(item => item.querySelector('h3').textContent === 'My borrowing variation')
      .querySelector('.experiment-entry-actions button').click()`);
    assert.equal(await value('loan-borrow'), '6100');
    await fill('loan-borrow', '6200');
    assert.equal(readLoanHash(new URL(await homeLink()).hash).input.borrow, 6200,
      'Choosing Open in lab resumes normal working-copy edits even from a lesson tab');
  } finally {
    await restore('localStorage', local);
    await restore('sessionStorage', session);
  }
  console.log('PASS: lending lesson examples preserve the personal Home link and drafts through edits and reload; ordinary loan and loop links remain resumable');
}
