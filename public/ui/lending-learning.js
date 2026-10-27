import { saveLearningLocation } from '../data/learning-location.js';
import { renderLessonSetup, lendingLessonSetup } from '../lib/lesson-setup.js';
import { renderQuestionEvidence } from '../lib/lesson-question-evidence.js';
import { LENDING_LESSONS } from '../learning/lending-essentials.js';
import { LOOP_LESSONS } from '../learning/borrowing-loops.js';
import { lendingCase, checkLendingUnderstanding } from '../models/lending-lessons.js';
import { loopCase, checkLoopUnderstanding } from '../models/loop-lessons.js';
import { readLendingProgress, saveLendingProgress, LENDING_QUESTION_REVISIONS } from '../data/lending-state.js';
import { readLoopProgress, saveLoopProgress, readLendingChapter, saveLendingChapter, LOOP_QUESTION_REVISIONS } from '../data/loop-state.js';
import { loanHash } from '../lib/lending-links.js';
import { loopHash } from '../lib/loop-links.js';
import { lendingMetrics } from '../lib/lending-presentation.js';
import { loopLessonMetrics } from '../lib/loop-presentation.js';
import { renderLoopMoneyFlow } from '../lib/loop-money-flow.js';
import { createUnwindApplication } from '../lib/unwind-application.js';
import { createLendingScene } from '../lib/lending-lesson-scenes.js';
import { createLoanConditionScene } from '../lib/loan-condition-scene.js';
import { createLoanResponseScene } from '../lib/loan-response-scene.js';
import { createLoopStressScene } from '../lib/loop-stress-scene.js';
import { focusSceneOutcome, createPredictionPrompt, markPredictionRevealed } from '../lib/lesson-scene.js';
import { newChoiceSeed } from '../lib/learning-choices.js';
import { learningChoices, learningMetric, learningSources, focusLearningFeedback, renderPredictionFeedback, renderUnderstandingFeedback, clearUnderstandingFeedback } from '../lib/learning-elements.js';

export function initLendingLearning() {
  const $ = id => document.getElementById(id);
  const predictionFeedbackElement = $('lend-prediction-feedback');
  const predictionField = $('lend-prediction-field'), revealButton = $('lend-reveal');
  const courses = {
    essentials: { lessons: LENDING_LESSONS, example: lendingCase, check: checkLendingUnderstanding,
      metrics: lendingMetrics, hash: loanHash, save: saveLendingProgress, progress: readLendingProgress().progress,
      route: '#lesson=', label: 'LENDING', experiment: '#experiment', revisions: LENDING_QUESTION_REVISIONS },
    loops: { lessons: LOOP_LESSONS, example: loopCase, check: checkLoopUnderstanding,
      metrics: loopLessonMetrics, hash: loopHash, save: saveLoopProgress, progress: readLoopProgress().progress,
      route: '#loop-lesson=', label: 'LOOPING', experiment: '#loops', revisions: LOOP_QUESTION_REVISIONS },
  };
  let chapter = 'essentials', course = courses.essentials, progress = course.progress;
  let lesson, draft, example, lessonScene, loopScene, applicationScene;
  const foundationLesson = () => chapter === 'essentials' && ['supply', 'borrow', 'conditions', 'respond'].includes(lesson?.id);
  const stressLesson = () => chapter === 'loops' && lesson?.id === 'stress';
  const visualLesson = () => foundationLesson() || chapter === 'loops' && ['build', 'stress', 'unwind'].includes(lesson?.id);
  const revealLabel = () => visualLesson() ? 'Why this happens ↓' : 'Read the result ↓';
  const fresh = () => ({ prediction: '', reason: '', application: '', revealed: false, seed: newChoiceSeed() });
  function navigation() {
    $('lend-progress').textContent = progress.completed.length + ' of ' + course.lessons.length + ' checked';
    for (const name of Object.keys(courses)) $('lend-chapter-' + name).setAttribute('aria-current', name === chapter ? 'true' : 'false');
    for (const link of document.querySelectorAll('[data-lending-lesson]')) {
      const id = link.dataset.lendingLesson;
      link.setAttribute('aria-current', id === lesson?.id ? 'step' : 'false');
      link.classList.toggle('learn-step-done', progress.completed.includes(id));
      link.querySelector('.learn-step-state').textContent = progress.completed.includes(id) ? 'Checked' : id === lesson?.id ? 'Now exploring' : 'Open lesson';
    }
  }
  function persist() {
    progress.currentLesson = lesson.id;
    progress.drafts[lesson.id] = draft;
    saveLendingChapter(chapter);
    $('lend-storage').textContent = course.save(progress)
      ? 'Lesson progress saved in this browser.' : 'Saving is unavailable. You can keep learning in this tab.';
    navigation();
  }
  function clearFeedback() {
    clearUnderstandingFeedback('lend');
    $('lend-feedback').hidden = true;
    $('lend-continue').hidden = true;
    applicationScene?.reset();
  }
  function reveal() {
    draft.revealed = true;
    renderPredictionFeedback(predictionFeedbackElement, lesson.predictions, draft.prediction, example.prediction, lesson.finding);
    markPredictionRevealed(predictionField);
    $('lend-metrics').replaceChildren(...course.metrics(lesson.id, example.result).map(items => learningMetric(...items)));
    $('lend-metrics').hidden = visualLesson();
    $('lend-observe').hidden = false;
    $('lend-assessment').hidden = false;
    $('lend-reveal').textContent = revealLabel();
    persist();
  }
  function check(save = true) {
    const result = course.check(lesson.id, draft.reason, draft.application);
    $('lend-feedback').hidden = false;
    $('lend-feedback').className = 'learn-feedback ' + (result.passed ? 'learn-pass' : 'learn-retry');
    $('lend-feedback-title').textContent = result.passed ? 'Both answers are correct.' : 'Review your answers.';
    const reasoning = draft.reason ? lesson.reasonFeedback[draft.reason] : 'Choose an explanation. ' + lesson.hint;
    const application = draft.application ? (lesson.applicationFeedbackByChoice?.[draft.application] || lesson.applicationFeedback) : 'Choose an answer. ' + lesson.hint;
    renderUnderstandingFeedback('lend', [
      { container: 'lend-reason-choices', selected: draft.reason, correct: result.reasoning, explanation: reasoning },
      { container: 'lend-application-choices', selected: draft.application, correct: result.application, explanation: application },
    ]);
    $('lend-feedback-copy').textContent = result.passed ? lesson.accomplishment : 'Read the feedback beside each question, then try again. You can change either answer.';
    $('lend-continue').hidden = !result.passed;
    if (result.passed && !progress.completed.includes(lesson.id)) progress.completed.push(lesson.id);
    if (save) { persist(); focusLearningFeedback('lend'); }
    else navigation();
  }
  function focusLesson() {
    $('lend-title').focus({ preventScroll: true });
    $('lend-title').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function activate(id, scroll = false, name = 'essentials') {
    if (!courses[name]) return;
    if (chapter !== name) {
      chapter = name; course = courses[name]; progress = course.progress;
      buildNavigation();
    }
    lesson = course.lessons.find(item => item.id === id);
    if (!lesson) return;
    saveLearningLocation('lending.html#' + (name === 'loops' ? 'loop-lesson=' : 'lesson=') + id);
    draft = progress.drafts[id] || fresh();
    if (course.revisions[id]) draft.questionRevisions = { ...course.revisions[id] };
    example = course.example(id);
    for (const [key, choices] of [['prediction', lesson.predictions], ['reason', lesson.reasons], ['application', lesson.applications]]) {
      if (!choices.some(([value]) => value === draft[key])) draft[key] = '';
    }
    const index = course.lessons.indexOf(lesson);
    document.title = lesson.short + ' · Teren Learn';
    $('lend-number').textContent = course.label + ' ' + (index + 1) + ' OF ' + course.lessons.length;
    $('lend-meta-label').textContent = (name === 'loops' ? 'Three' : 'Four') + ' steps · Open any lesson';
    $('lend-own-question').href = course.experiment;
    $('lend-title').textContent = lesson.title;
    $('lend-adds').textContent = lesson.adds;
    for (const key of ['intro', 'question', 'takeaway', 'explanation', 'pitfall', 'reasoning']) $('lend-' + key).textContent = lesson[key];
    renderLessonSetup($('lend-setup'), lendingLessonSetup(lesson.id, example));
    const showFlow = visualLesson();
    const conditions = chapter === 'essentials' && lesson.id === 'conditions';
    const responses = chapter === 'essentials' && lesson.id === 'respond';
    const stress = stressLesson();
    $('lend-flow-title').textContent = stress ? 'Same start, different exposure'
      : conditions ? 'Watch the health factor' : responses ? 'Where does the extra money go?' : 'Follow the money';
    $('lend-flow-instruction').textContent = stress ? 'Compare holding with looping. Change one condition at a time.'
      : conditions ? 'Change one condition and compare what backs the debt.'
      : responses ? 'Compare two choices using the same extra budget.' : 'Take one action, then look at what changed.';
    $('lend-adds').hidden = showFlow;
    $('lend-visual').hidden = !showFlow;
    $('lend-money-flow').hidden = !showFlow;
    if (showFlow) $('lend-money-flow').before($('lend-setup'));
    else $('lend-predict-title').after($('lend-setup'));
    $('lend-predict-card').hidden = showFlow;
    $('lend-explanation').hidden = showFlow && !foundationLesson() && !stress;
    $('lend-observe-label').textContent = showFlow ? 'CONNECT THE IDEA' : '02 · OBSERVE';
    $('lend-observe-title').textContent = showFlow ? 'What to take away' : 'Read the result';
    $('lend-check-label').textContent = showFlow ? 'CHECK YOUR UNDERSTANDING' : '03 · CHECK YOUR UNDERSTANDING';
    $('lend-observe-title').after(predictionFeedbackElement);
    lessonScene = null; loopScene = null; applicationScene = null;
    if (foundationLesson() || stress) {
      const prediction = createPredictionPrompt(predictionField, { selected: draft.prediction, feedback: predictionFeedbackElement, onShow: () => showResult(true) });
      if (stress) lessonScene = createLoopStressScene(example.input, prediction);
      else if (conditions) lessonScene = createLoanConditionScene(example.input, prediction);
      else if (responses) lessonScene = createLoanResponseScene(example.input, prediction);
      else lessonScene = createLendingScene(example.result, lesson.id, prediction);
      $('lend-money-flow').replaceChildren(lessonScene.element);
      $('lend-money-flow').removeAttribute('data-flow');
      $('lend-visual').append(revealButton);
    } else if (showFlow) {
      loopScene = renderLoopMoneyFlow($('lend-money-flow'), example.result, lesson.id, createPredictionPrompt(predictionField, { selected: draft.prediction, feedback: predictionFeedbackElement, onShow: () => showResult(true) }));
      $('lend-visual').append(revealButton);
    } else {
      $('lend-predict-card').insertBefore(predictionField, $('lend-predict-note'));
      $('lend-predict-card').insertBefore(revealButton, $('lend-predict-note'));
    }
    $('lend-application-context').textContent = lesson.applicationContext;
    $('lend-application-label').textContent = lesson.applicationLabel || 'Another situation';
    $('lend-reason-context').textContent = lesson.reasonContext || '';
    $('lend-reason-context').hidden = !lesson.reasonContext;
    renderQuestionEvidence($('lend-application-evidence'), typeof lesson.applicationEvidence === 'function' ? lesson.applicationEvidence(example) : lesson.applicationEvidence);
    $('lend-application-question').textContent = lesson.applicationQuestion;
    if (chapter === 'loops' && lesson.id === 'unwind') applicationScene = createUnwindApplication(example.result);
    $('lend-application-scene').replaceChildren(...(applicationScene ? [applicationScene.element] : []));
    $('lend-application-scene').hidden = !applicationScene;
    $('lend-hint-text').textContent = lesson.hint;
    $('lend-hint').open = false; $('lend-deeper').open = false;
    $('lend-deeper-copy').replaceChildren(...lesson.deeper.map(copy => {
      const paragraph = document.createElement('p'); paragraph.textContent = copy; return paragraph;
    }));
    learningSources($('lend-sources'), lesson.sources);
    $('lend-explore').href = course.hash(example.input);
    const next = course.lessons[index + 1];
    $('lend-next').href = next ? course.route + next.id : chapter === 'essentials' ? '#loop-lesson=build' : '#loops';
    $('lend-next').textContent = next ? 'Next: ' + next.short + ' →' : chapter === 'essentials' ? 'Next: Borrowing loops →' : 'Try your own loop →';
    for (const [key, values] of [['prediction', lesson.predictions], ['reason', lesson.reasons], ['application', lesson.applications]]) {
      learningChoices($('lend-' + key + '-choices'), {
        name: 'lend-' + key, values, selected: draft[key], seed: draft.seed, group: id + key,
        onChange(value) {
          draft[key] = value;
          clearFeedback();
          if (key === 'prediction') {
            predictionFeedbackElement.textContent = '';
            draft.revealed = false; draft.reason = ''; draft.application = '';
            for (const radio of document.querySelectorAll('input[name="lend-reason"],input[name="lend-application"]')) radio.checked = false;
            $('lend-observe').hidden = true; $('lend-assessment').hidden = true;
            $('lend-reveal').disabled = false; $('lend-reveal').textContent = revealLabel();
          }
          persist();
        },
      });
    }
    $('lend-observe').hidden = true; $('lend-assessment').hidden = true; clearFeedback();
    $('lend-reveal').disabled = false; $('lend-reveal').textContent = revealLabel();
    if (draft.revealed) {
      lessonScene?.showQuestion();
      loopScene?.showQuestion();
      reveal();
      if (course.check(id, draft.reason, draft.application).passed) check(false);
    }
    persist();
    if (scroll) focusLesson();
  }
  function buildNavigation() {
    $('lend-lesson-list').replaceChildren();
    course.lessons.forEach((item, index) => {
    const row = document.createElement('li'), link = document.createElement('a');
    link.href = course.route + item.id; link.dataset.lendingLesson = item.id;
    const number = document.createElement('span'); number.className = 'learn-step-number'; number.textContent = '0' + (index + 1);
    const copy = document.createElement('span'); copy.className = 'learn-step-copy';
    const title = document.createElement('strong'); title.textContent = item.short;
    const state = document.createElement('span'); state.className = 'learn-step-state';
    copy.append(title, ' ', state); link.append(number, ' ', copy); row.append(link); $('lend-lesson-list').append(row);
    link.addEventListener('click', () => { if (matchMedia('(max-width: 750px)').matches) $('lend-course').open = false; });
    });
  }
  buildNavigation();
  function showResult(sceneFirst = false) {
    lessonScene?.showQuestion();
    loopScene?.showQuestion();
    reveal();
    if (sceneFirst && visualLesson()) { focusSceneOutcome($('lend-money-flow')); return; }
    const title = $('lend-observe-title');
    title.tabIndex = -1; title.focus({ preventScroll: true });
    title.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  $('lend-reveal').addEventListener('click', () => showResult());
  $('lend-form').addEventListener('submit', event => { event.preventDefault(); if (draft?.revealed) check(); });
  $('lend-retry').addEventListener('click', () => { progress.drafts[lesson.id] = fresh(); activate(lesson.id, true, chapter); });
  $('lend-topics').addEventListener('click', () => {
    $('lend-course').open = true; $('lend-course').querySelector('summary').focus({ preventScroll: true });
    $('lend-course').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  if (matchMedia('(max-width: 750px)').matches) $('lend-course').open = false;
  navigation();
  return {
    activate,
    focusLesson,
    resumeIn: name => courses[name].progress.currentLesson,
    resume: () => {
      const name = readLendingChapter();
      return { chapter: name, id: courses[name].progress.currentLesson };
    },
  };
}
