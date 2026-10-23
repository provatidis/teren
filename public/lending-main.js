import { initPageAccess } from './ui/page-access.js';
import { initLending } from './ui/lending.js';
import { initLendingLearning } from './ui/lending-learning.js';
import { lendingLessonFromHash } from './lib/lending-links.js';

initPageAccess();
initLending();
const learning = initLendingLearning();

function route(scroll = false) {
  const lesson = location.hash === '#learn' ? learning.resumeLesson() : lendingLessonFromHash(location.hash);
  document.getElementById('lending-experiment').hidden = !!lesson;
  document.getElementById('lending-learn').hidden = !lesson;
  document.getElementById('lending-page-title').textContent = lesson ? 'Lending essentials' : 'Lending lab';
  document.getElementById('lending-page-subtitle').textContent = lesson
    ? 'Supply, borrow, change conditions and compare responses. Open any lesson; no calculations required.'
    : 'Supply ETH, borrow USDC, then change price or time.';
  document.getElementById('lending-evidence').textContent = lesson ? 'LEARN BY DOING · LENDING' : 'AAVE V3-STYLE · HYPOTHETICAL';
  document.getElementById('topic-liquidity').href = lesson ? 'learn.html' : './#experiment';
  document.getElementById('lending-start').hidden = !!lesson;
  for (const name of ['experiment', 'learn']) {
    const link = document.getElementById('lending-nav-' + name);
    if ((name === 'learn') === !!lesson) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.getElementById('lending-route-note').hidden = !(location.hash.startsWith('#lesson=') && !lesson);
  if (lesson) learning.activate(lesson, scroll);
  else {
    document.title = 'Lending lab · Teren';
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
    if (url.hash === '#learn' || lendingLessonFromHash(url.hash)) { event.preventDefault(); learning.focusLesson(); }
    else if (url.hash === '#experiment') { event.preventDefault(); route(true); }
  }
});
route();
