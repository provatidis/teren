import { YIELD_LESSONS } from '../learning/yield-lessons.js';
import { freshYieldDraft, readYieldProgress, saveYieldProgress } from '../data/yield-lesson-progress.js';
import { saveLearningLocation } from '../data/learning-location.js';
import { learningChoices, learningSources, focusInitialLesson, focusLearningFeedback,
  renderPredictionFeedback, renderUnderstandingFeedback, clearUnderstandingFeedback } from '../lib/learning-elements.js';
import { renderLessonSetup } from '../lib/lesson-setup.js';
import { createPredictionPrompt, markPredictionRevealed, focusSceneOutcome, sceneNode } from '../lib/lesson-scene.js';
import { createYieldLessonScene } from '../lib/yield-lesson-scene.js';

const el = id => document.getElementById('yl-' + id);
const route = id => '#lesson=' + id;

export function initYieldLearning() {
  const progress = readYieldProgress(YIELD_LESSONS);
  const field = el('prediction-field'), feedback = el('prediction-feedback'), reveal = el('reveal');
  const course = el('course');
  const phone = matchMedia('(max-width: 750px)');
  const menu = document.getElementById('learn-lesson-list');
  let lesson, draft, scene;

  const links = YIELD_LESSONS.map((entry, index) => {
    const row = sceneNode('li');
    const link = sceneNode('a');
    link.href = route(entry.id);
    const labels = sceneNode('span', undefined, 'learn-step-copy');
    const state = sceneNode('span', '', 'learn-step-state');
    labels.append(sceneNode('strong', entry.short), ' ', state);
    link.append(sceneNode('span', String(index + 1), 'learn-step-number'), ' ', labels);
    row.append(link);
    menu.append(row);
    return { id: entry.id, link, state };
  });
  function updateNavigation() {
    el('progress').textContent = progress.completed.length + ' of ' + links.length + ' checked';
    for (const { id, link, state } of links) {
      const completed = progress.completed.includes(id);
      link.classList.toggle('learn-step-done', completed);
      if (id === lesson.id) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
      state.textContent = completed ? 'Checked' : id === lesson.id ? 'Now exploring' : 'Open lesson';
    }
  }
  function save() {
    progress.drafts[lesson.id] = draft;
    const saved = saveYieldProgress(progress, YIELD_LESSONS, lesson.id);
    el('storage').textContent = saved ? 'Progress saves in this browser.' : 'Saving is unavailable. You can keep learning in this tab.';
    updateNavigation();
  }
  function showPrediction() {
    const question = lesson.prediction;
    renderPredictionFeedback(feedback, question.choices, draft.prediction, question.correct,
      question.feedback[draft.prediction] || lesson.finding);
    markPredictionRevealed(field);
    el('observe').hidden = false;
    el('assessment').hidden = false;
  }
  function showOutcome() {
    draft.revealed = true;
    scene.showOutcome();
    showPrediction();
    save();
    focusSceneOutcome(el('activity'));
  }
  function clearCheck() {
    clearUnderstandingFeedback('yl');
    el('feedback').hidden = true;
    el('continue').hidden = true;
  }
  function showCheck() {
    const groups = ['reason', 'application'];
    const entries = groups.map(key => {
      const selected = draft[key], question = lesson[key];
      return {
        container: 'yl-' + key + '-choices', selected, correct: selected === question.correct,
        explanation: selected ? question.feedback[selected] : 'Choose an answer, or open the hint below.',
      };
    });
    renderUnderstandingFeedback('yl', entries);
    const passed = entries.every(entry => entry.correct);
    el('feedback').hidden = false;
    el('feedback').className = 'learn-feedback ' + (passed ? 'learn-pass' : 'learn-retry');
    el('feedback-title').textContent = passed ? 'Both answers are correct.' : 'Review your answers.';
    el('feedback-copy').textContent = passed ? lesson.accomplishment : 'You can change either answer and check again.';
    el('continue').hidden = !passed;
    return passed;
  }

  function activate(entry) {
    lesson = entry;
    draft = progress.drafts[entry.id] || freshYieldDraft(entry);
    saveLearningLocation('yield-learn.html' + route(entry.id));
    const index = YIELD_LESSONS.indexOf(entry);
    document.title = entry.short + ' · Yield trading lessons · Teren';
    el('number').textContent = 'LESSON ' + (index + 1) + ' OF ' + links.length;
    for (const key of ['intro', 'title']) el(key).textContent = entry[key];
    el('scene-title').textContent = entry.scene.title;
    renderLessonSetup(el('setup'), entry.setup);
    scene = createYieldLessonScene(entry.scene, el('stage-controls'), el('scene-drawing'), el('scene-caption'));
    scene.show(draft.revealed ? entry.scene.outcome ?? entry.scene.stages.length - 1 : 0, false);
    el('application-context').textContent = entry.applicationContext;
    el('hint-text').textContent = entry.hint;
    el('reading').replaceChildren(...entry.deeper.map(copy => sceneNode('p', copy)));
    learningSources(el('sources'), entry.sources);
    el('explore').href = entry.experimentHref;
    const next = YIELD_LESSONS[index + 1];
    el('next').href = next ? route(next.id) : entry.experimentHref;
    el('next').textContent = next ? 'Next: ' + next.short + ' →' : 'Try your own exit in Experiment ↗';
    if (next) el('next').removeAttribute('target');
    else el('next').target = '_blank';
    el('next').rel = 'noopener noreferrer';
    el('deeper').open = false;
    el('hint').open = false;
    el('observe').hidden = true;
    el('assessment').hidden = true;
    clearCheck();

    for (const key of ['prediction', 'reason', 'application']) {
      const question = entry[key];
      el(key + '-question').textContent = question.question;
      learningChoices(el(key + '-choices'), {
        name: 'yl-' + key, values: question.choices, selected: draft[key], seed: draft.seed, group: entry.id + key,
        onChange(value) {
          draft[key] = value;
          if (key === 'prediction') {
            if (draft.revealed) showPrediction();
          } else {
            draft.checked = false;
            clearCheck();
          }
          save();
        },
      });
    }
    const prompt = createPredictionPrompt(field, { selected: draft.prediction, button: reveal, feedback, onShow: showOutcome });
    el('prompt').replaceChildren(prompt);
    if (draft.revealed) {
      showPrediction();
      if (draft.checked) showCheck();
    }
    updateNavigation();
  }

  function fromLocation() {
    const requested = YIELD_LESSONS.find(entry => location.hash === route(entry.id));
    el('route-note').hidden = !location.hash || Boolean(requested);
    activate(requested || YIELD_LESSONS[0]);
  }
  function focusLesson() {
    el('title').focus({ preventScroll: true });
    el('title').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function followLesson(event) {
    const link = event.target.closest('a');
    if (!link || event.button !== 0 || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
    const entry = YIELD_LESSONS.find(item => link.getAttribute('href') === route(item.id));
    if (!entry) return;
    event.preventDefault();
    if (phone.matches) course.open = false;
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    if (lesson !== entry) activate(entry);
    el('route-note').hidden = true;
    focusLesson();
  }

  menu.addEventListener('click', followLesson);
  el('next').addEventListener('click', followLesson);
  el('all').addEventListener('click', () => {
    course.open = true;
    course.querySelector('summary').focus({ preventScroll: true });
    course.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  el('form').addEventListener('submit', event => {
    event.preventDefault();
    if (!draft.revealed) return;
    draft.checked = true;
    if (showCheck() && !progress.completed.includes(lesson.id)) progress.completed.push(lesson.id);
    save();
    focusLearningFeedback('yl');
  });
  el('retry').addEventListener('click', () => {
    progress.drafts[lesson.id] = freshYieldDraft(lesson);
    activate(lesson);
    save();
    focusLesson();
  });
  window.addEventListener('hashchange', fromLocation);
  if (phone.matches) course.open = false;
  fromLocation();
  if (location.hash === route(lesson.id)) focusInitialLesson('yl-title');
}
