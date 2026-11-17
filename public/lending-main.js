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
let lastExperimentView = null;
const discountLesson = '#lst-lesson=discount';
const chapterTitles = { essentials: 'Lending essentials', loops: 'Borrowing loops', lst: 'Correlated-asset loops' };
const chapterDescriptions = {
  essentials: 'Supply, borrow, change conditions and compare responses. Open any lesson; no calculations required.',
  loops: 'Build a loop, change conditions, then explore unwinding. No calculations required.',
  lst: 'Follow a wstETH market discount through a WETH loan.',
};

function lessonFromHash(hash) {
  if (hash === discountLesson) return { chapter: 'lst', id: 'discount' };
  const loop = loopLessonFromHash(hash);
  if (loop) return { chapter: 'loops', id: loop };
  const essential = lendingLessonFromHash(hash);
  return essential ? { chapter: 'essentials', id: essential } : null;
}

function route(scroll = false) {
  const lesson = location.hash === '#learn' ? learning.resume() : lessonFromHash(location.hash);
  const savedLibrary = location.hash === '#saved-experiments';
  // Learn and Saved share the three labs. Each history entry remembers where
  // Experiment should return, including after Back or reload.
  const recordedView = history.state?.terenLendingView;
  const origin = [null, 'loan', 'loops', 'lst'].includes(recordedView) ? recordedView : lastExperimentView;
  const loops = lesson ? lesson.chapter === 'loops' : savedLibrary ? origin === 'loops'
    : location.hash === '#loops' || readLoopHash(location.hash).status !== 'none';
  const lst = lesson ? lesson.chapter === 'lst' : savedLibrary ? origin === 'lst'
    : location.hash === '#lst-loops' || readLSTHash(location.hash).status !== 'none';
  lastExperimentView = lesson ? origin : lst ? 'lst' : loops ? 'loops' : 'loan';
  history.replaceState({ ...history.state, terenLendingView: lastExperimentView }, '');
  const experimentView = lastExperimentView ?? (lst ? 'lst' : loops ? 'loops' : 'loan');
  document.body.dataset.lendingView = lesson ? 'learn' : lst ? 'lst' : loops ? 'loops' : 'loan';
  document.getElementById('lending-experiment').hidden = !!lesson || loops || lst;
  document.getElementById('lending-loops').hidden = !!lesson || !loops;
  document.getElementById('lending-lst').hidden = !!lesson || !lst;
  document.getElementById('lending-learn').hidden = !lesson;
  document.getElementById('lending-tools').hidden = !!lesson;
  document.getElementById('saved-experiments').hidden = !!lesson;
  document.getElementById('lending-tool-loan').setAttribute('aria-current', loops || lst ? 'false' : 'page');
  document.getElementById('lending-tool-loops').setAttribute('aria-current', loops ? 'page' : 'false');
  document.getElementById('lending-tool-lst').setAttribute('aria-current', lst ? 'page' : 'false');
  document.getElementById('lending-nav-experiment').href = experimentView === 'lst' ? '#lst-loops' : experimentView === 'loops' ? '#loops' : '#experiment';
  document.getElementById('lending-nav-learn').href = lst ? discountLesson : loops ? '#loop-lesson=' + (lesson ? lesson.id : learning.resumeIn('loops')) : '#learn';
  document.getElementById('lending-page-title').textContent = lesson
    ? chapterTitles[lesson.chapter] : lst ? 'Correlated-asset loops' : loops ? 'Borrowing loops' : 'Lending lab';
  document.getElementById('lending-page-subtitle').textContent = lesson
    ? chapterDescriptions[lesson.chapter]
    : lst ? 'Build a wstETH/WETH loop. Test its carry, collateral value and exit.' : loops ? 'Follow borrowed money into more ETH. Test price, interest and unwinding.' : 'Supply ETH, borrow USDC, then change price or time.';
  document.getElementById('lending-evidence').textContent = lesson ? 'LEARN BY DOING · LENDING' : lst ? 'CORRELATED ASSETS · HYPOTHETICAL' : 'AAVE V3-STYLE · HYPOTHETICAL';
  document.getElementById('topic-yield').href = lesson ? 'yield-learn.html' : 'yield.html';
  document.getElementById('topic-liquidity').href = lesson ? 'learn.html' : 'liquidity.html#experiment';
  document.getElementById('lending-start').hidden = !!lesson;
  document.getElementById('lending-start').href = lst ? discountLesson : loops ? '#loop-lesson=build' : '#learn';
  document.getElementById('lending-start').textContent = lst ? 'Explore a wstETH discount →' : 'Learn →';
  document.getElementById('lending-start').setAttribute('aria-label', lst ? 'Explore a wstETH discount step by step' : loops ? 'Learn about borrowing loops' : 'Learn about lending');
  for (const name of ['experiment', 'learn']) {
    const link = document.getElementById('lending-nav-' + name);
    if ((name === 'learn') === !!lesson) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.getElementById('lending-route-note').hidden = !(/^#(?:(?:lst|loop)-)?lesson=/.test(location.hash) && !lesson);
  if (lesson) learning.activate(lesson.id, scroll, lesson.chapter);
  else {
    document.title = (lst ? 'Correlated-asset loops' : loops ? 'Borrowing-loop lab' : 'Lending lab') + ' · Teren';
    if (scroll && !savedLibrary) {
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
    if (url.hash === '#learn' || lessonFromHash(url.hash)) { event.preventDefault(); learning.focusLesson(); }
    else if (['#experiment', '#loops', '#lst-loops'].includes(url.hash)) { event.preventDefault(); route(true); }
  }
});
route();
if (lessonFromHash(location.hash)) focusInitialLesson('lend-title');

initSavedExperiments({ labs: { 'collateral-loan-v1': loanLab, 'collateral-loan-v2': loanLab, 'borrowing-loop-v1': loopLab, 'lst-loop-v1': lstLab, 'lst-loop-v2': lstLab }, onOpen: () => route(true) });
