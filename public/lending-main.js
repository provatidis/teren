import { initSavedExperiments } from './ui/saved-experiments.js';
import { initPageAccess } from './ui/page-access.js';
import { initLending } from './ui/lending.js';
import { initLendingLearning } from './ui/lending-learning.js';
import { initBorrowingLoops } from './ui/borrowing-loops.js';
import { initLoopLiquidation } from './ui/loop-liquidation.js';
import { initLSTLoops } from './ui/lst-loops.js';
import { readLSTHash } from './lib/lst-links.js';
import { lendingLessonFromHash } from './lib/lending-links.js';
import { loopLessonFromHash, readLoopHash } from './lib/loop-links.js';
import { focusInitialLesson } from './lib/learning-elements.js';

initPageAccess();
const loanLab = initLending();
const loopLab = initBorrowingLoops({ initLiquidation: initLoopLiquidation });
const lstLab = initLSTLoops();
const learning = initLendingLearning();

function route(scroll = false) {
  const loopLesson = loopLessonFromHash(location.hash), essential = lendingLessonFromHash(location.hash);
  const lesson = location.hash === '#learn' ? learning.resume() : loopLesson
    ? { chapter: 'loops', id: loopLesson } : essential ? { chapter: 'essentials', id: essential } : null;
  const loops = lesson ? lesson.chapter === 'loops' : location.hash === '#loops' || readLoopHash(location.hash).status !== 'none';
  const lst = !lesson && (location.hash === '#lst-loops' || readLSTHash(location.hash).status !== 'none');
  document.body.dataset.lendingView = lesson ? 'learn' : lst ? 'lst' : loops ? 'loops' : 'loan';
  document.getElementById('lending-experiment').hidden = !!lesson || loops || lst;
  document.getElementById('lending-loops').hidden = !!lesson || !loops;
  document.getElementById('lending-lst').hidden = !lst;
  document.getElementById('lending-learn').hidden = !lesson;
  document.getElementById('lending-tools').hidden = !!lesson;
  document.getElementById('saved-experiments').hidden = !!lesson;
  document.getElementById('lending-tool-loan').setAttribute('aria-current', loops || lst ? 'false' : 'page');
  document.getElementById('lending-tool-loops').setAttribute('aria-current', loops ? 'page' : 'false');
  document.getElementById('lending-tool-lst').setAttribute('aria-current', lst ? 'page' : 'false');
  document.getElementById('lending-nav-experiment').href = lst ? '#lst-loops' : loops ? '#loops' : '#experiment';
  document.getElementById('lending-nav-learn').href = loops || lst ? '#loop-lesson=' + (lesson ? lesson.id : learning.resumeIn('loops')) : '#learn';
  document.getElementById('lending-page-title').textContent = lesson
    ? loops ? 'Borrowing loops' : 'Lending essentials' : lst ? 'Correlated-asset loops' : loops ? 'Borrowing loops' : 'Lending lab';
  document.getElementById('lending-page-subtitle').textContent = lesson
    ? loops ? 'Build a loop, change conditions, then explore unwinding. No calculations required.' : 'Supply, borrow, change conditions and compare responses. Open any lesson; no calculations required.'
    : lst ? 'Build a wstETH/WETH loop. Test its carry, collateral value and exit.' : loops ? 'Follow borrowed money into more ETH. Test price, interest and unwinding.' : 'Supply ETH, borrow USDC, then change price or time.';
  document.getElementById('lending-evidence').textContent = lesson ? 'LEARN BY DOING · LENDING' : lst ? 'CORRELATED ASSETS · HYPOTHETICAL' : 'AAVE V3-STYLE · HYPOTHETICAL';
  document.getElementById('topic-liquidity').href = lesson ? 'learn.html' : 'liquidity.html#experiment';
  document.getElementById('lending-start').hidden = !!lesson;
  document.getElementById('lending-start').href = loops || lst ? '#loop-lesson=build' : '#learn';
  document.getElementById('lending-start').textContent = lst ? 'Loop basics →' : 'Learn →';
  document.getElementById('lending-start').setAttribute('aria-label', loops || lst ? 'Learn about borrowing loops' : 'Learn about lending');
  for (const name of ['experiment', 'learn']) {
    const link = document.getElementById('lending-nav-' + name);
    if ((name === 'learn') === !!lesson) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.getElementById('lending-route-note').hidden = !((location.hash.startsWith('#lesson=') || location.hash.startsWith('#loop-lesson=')) && !lesson);
  if (lesson) learning.activate(lesson.id, scroll, lesson.chapter);
  else {
    document.title = (lst ? 'Correlated-asset loops' : loops ? 'Borrowing-loop lab' : 'Lending lab') + ' · Teren';
    if (scroll) {
      document.getElementById('lending-page-title').focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
}
window.addEventListener('hashchange', () => route(true));
document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
  const url = new URL(link.href);
  if (url.origin === location.origin && url.pathname === location.pathname && url.hash === location.hash) {
    if (url.hash === '#learn' || lendingLessonFromHash(url.hash) || loopLessonFromHash(url.hash)) { event.preventDefault(); learning.focusLesson(); }
    else if (['#experiment', '#loops', '#lst-loops'].includes(url.hash)) { event.preventDefault(); route(true); }
  }
});
route();
if (lendingLessonFromHash(location.hash) || loopLessonFromHash(location.hash)) focusInitialLesson('lend-title');

initSavedExperiments({ labs: { 'collateral-loan-v1': loanLab, 'collateral-loan-v2': loanLab, 'borrowing-loop-v1': loopLab, 'lst-loop-v1': lstLab, 'lst-loop-v2': lstLab }, onOpen: () => route(true) });
