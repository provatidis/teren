import { readExperimentLocation } from './data/experiment-location.js';
import { isLiquidityEntry } from './lib/entry-links.js';
import { readLearningLocation } from './data/learning-location.js';
import { nextLearningStep, readLearningOverview, topicProgress } from './data/learning-overview.js';
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
    const lessons = readLearningOverview();
    const saved = readLearningLocation();
    // A finished bookmark points forward; an unfinished one resumes in place.
    const step = saved && nextLearningStep(lessons, saved.route);
    const link = document.getElementById('home-continue');
    link.hidden = !step;
    if (step) {
      link.href = step.route;
      document.getElementById('home-continue-label').textContent = step.resumed ? 'Continue learning' : 'Next lesson';
      document.getElementById('home-continue-title').textContent = step.title;
    }
    showProgress(lessons);
    const experiment = readExperimentLocation();
    const resume = document.getElementById('home-experiment');
    resume.hidden = !experiment;
    if (experiment) {
      resume.href = experiment.route;
      document.getElementById('home-experiment-title').textContent = experiment.title;
    }
  }
  // Progress appears on every topic once one lesson is done, so a first
  // visit keeps the plain cards and returning learners see where they stand.
  function showProgress(lessons) {
    const started = lessons.some(lesson => lesson.done);
    for (const row of document.querySelectorAll('.home-progress')) {
      const { topic, label } = row.dataset;
      const { done, total, next } = topicProgress(lessons, topic);
      const first = lessons.find(lesson => lesson.topic === topic);
      const continuing = done > 0 && next;
      row.hidden = !started;
      const meter = row.querySelector('progress');
      meter.max = total; meter.value = done;
      const finished = done === total;
      meter.setAttribute('aria-label', label + ': ' + (finished ? 'all ' + total : done + ' of ' + total) + ' lessons done');
      row.querySelector('.home-progress-count').textContent = finished ? 'All ' + total + ' lessons done' : done + ' of ' + total;
      row.querySelector('.home-progress-next').textContent = continuing ? 'Next: ' + next.title : '';
      // The lesson button follows the learner: start, continue or review.
      const link = row.closest('.home-topic').querySelector('.home-learn-link');
      link.dataset.startLabel ??= link.getAttribute('aria-label');
      link.href = continuing ? next.route : first.route;
      link.querySelector('.home-learn-label').textContent = continuing ? 'Continue learning' : done ? 'Review the lessons' : 'Learn step by step';
      link.setAttribute('aria-label', continuing ? 'Continue ' + label.toLowerCase() + ' lessons: ' + next.title
        : done ? 'Review the ' + label.toLowerCase() + ' lessons' : link.dataset.startLabel);
    }
  }
  showContinue();
  window.addEventListener('pageshow', showContinue);
  window.addEventListener('storage', showContinue);
}
window.addEventListener('hashchange', openSharedLink);
