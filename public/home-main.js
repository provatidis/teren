import { readExperimentLocation } from './data/experiment-location.js';
import { isLiquidityEntry } from './lib/entry-links.js';
import { readLearningLocation } from './data/learning-location.js';
import { initPageAccess } from './ui/page-access.js';

function openSharedLink() {
  if (!isLiquidityEntry(location.hash)) return false;
  const target = new URL('liquidity.html', location.href);
  target.search = location.search;
  target.hash = location.hash;
  location.replace(target.href);
  return true;
}

if (!openSharedLink()) {
  initPageAccess();
  function showContinue() {
    const saved = readLearningLocation();
    const link = document.getElementById('home-continue');
    link.hidden = !saved;
    if (saved) {
      link.href = saved.route;
      document.getElementById('home-continue-title').textContent = saved.title;
    }
    const experiment = readExperimentLocation();
    const resume = document.getElementById('home-experiment');
    resume.hidden = !experiment;
    if (experiment) {
      resume.href = experiment.route;
      document.getElementById('home-experiment-title').textContent = experiment.title;
    }
  }
  showContinue();
  window.addEventListener('pageshow', showContinue);
  window.addEventListener('storage', showContinue);
}
window.addEventListener('hashchange', openSharedLink);
