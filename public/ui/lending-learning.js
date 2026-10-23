import { LENDING_LESSONS } from '../learning/lending-essentials.js';
import { LOOP_LESSONS } from '../learning/borrowing-loops.js';
import { lendingCase, checkLendingUnderstanding } from '../models/lending-lessons.js';
import { loopCase, checkLoopUnderstanding } from '../models/loop-lessons.js';
import { readLendingProgress, saveLendingProgress } from '../data/lending-state.js';
import { readLoopProgress, saveLoopProgress, readLendingChapter, saveLendingChapter } from '../data/loop-state.js';
import { loanHash } from '../lib/lending-links.js';
import { loopHash } from '../lib/loop-links.js';
import { lendingMetrics } from '../lib/lending-presentation.js';
import { loopLessonMetrics } from '../lib/loop-presentation.js';
import { renderLoopMoneyFlow } from '../lib/loop-money-flow.js';
import { newChoiceSeed } from '../lib/learning-choices.js';
import { learningChoices, learningMetric, learningSources, focusLearningFeedback } from '../lib/learning-elements.js';

export function initLendingLearning() {
  const $ = id => document.getElementById(id);
  const courses = {
    essentials: { lessons: LENDING_LESSONS, example: lendingCase, check: checkLendingUnderstanding,
      metrics: lendingMetrics, hash: loanHash, save: saveLendingProgress, progress: readLendingProgress().progress,
      route: '#lesson=', label: 'LENDING', experiment: '#experiment' },
    loops: { lessons: LOOP_LESSONS, example: loopCase, check: checkLoopUnderstanding,
      metrics: loopLessonMetrics, hash: loopHash, save: saveLoopProgress, progress: readLoopProgress().progress,
      route: '#loop-lesson=', label: 'LOOPING', experiment: '#loops' },
  };
  let chapter = 'essentials', course = courses.essentials, progress = course.progress;
  let lesson, draft, example;
  const visualLesson = () => chapter === 'loops' && ['build', 'unwind'].includes(lesson?.id);
  const revealLabel = () => visualLesson() ? 'Compare your answer →' : 'Reveal the result →';
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
  function clearFeedback() { $('lend-feedback').hidden = true; $('lend-continue').hidden = true; }
  function reveal() {
    if (!draft.prediction) return;
    draft.revealed = true;
    const prediction = lesson.predictions.find(([id]) => id === example.prediction)[1];
    $('lend-prediction-feedback').textContent = draft.prediction === example.prediction
      ? (visualLesson() ? 'Yes. ' : 'Your prediction matches. ') + prediction
      : (visualLesson() ? 'Compare this with what you saw: ' : 'Compare this with your prediction: ') + prediction;
    $('lend-metrics').replaceChildren(...course.metrics(lesson.id, example.result).map(items => learningMetric(...items)));
    $('lend-metrics').hidden = visualLesson();
    $('lend-observe').hidden = false;
    $('lend-assessment').hidden = false;
    $('lend-reveal').textContent = visualLesson() ? 'Revisit the explanation ↓' : 'Revisit the result ↓';
    persist();
  }
  function check(save = true) {
    const result = course.check(lesson.id, draft.reason, draft.application);
    $('lend-feedback').hidden = false;
    $('lend-feedback').className = 'learn-feedback ' + (result.passed ? 'learn-pass' : 'learn-retry');
    $('lend-feedback-title').textContent = result.passed ? 'Both answers are correct.' : 'Review your answers.';
    const reasoning = draft.reason ? lesson.reasonFeedback[draft.reason] : 'Choose an explanation. ' + lesson.hint;
    const application = draft.application ? lesson.applicationFeedback : 'Choose an answer for the new situation. ' + lesson.hint;
    $('lend-feedback-copy').textContent = result.passed ? lesson.takeaway
      : [!result.reasoning ? reasoning : '', !result.application ? application : ''].filter(Boolean).join(' ');
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
    draft = progress.drafts[id] || fresh();
    example = course.example(id);
    for (const [key, choices] of [['prediction', lesson.predictions], ['reason', lesson.reasons], ['application', lesson.applications]]) {
      if (!choices.some(([value]) => value === draft[key])) draft[key] = '';
    }
    if (!draft.prediction) draft.revealed = false;
    const index = course.lessons.indexOf(lesson);
    document.title = lesson.short + ' · Teren Learn';
    $('lend-number').textContent = course.label + ' ' + (index + 1) + ' OF ' + course.lessons.length;
    $('lend-meta-label').textContent = (name === 'loops' ? 'Three' : 'Four') + ' steps · Open any lesson';
    $('lend-own-question').href = course.experiment;
    $('lend-title').textContent = lesson.title;
    $('lend-adds').textContent = lesson.adds;
    for (const key of ['intro', 'setup', 'question', 'takeaway', 'explanation', 'pitfall', 'reasoning']) $('lend-' + key).textContent = lesson[key];
    const showFlow = visualLesson();
    $('lend-adds').hidden = showFlow;
    $('lend-visual').hidden = !showFlow;
    $('lend-money-flow').hidden = !showFlow;
    $('lend-setup').hidden = showFlow;
    $('lend-predict-label').textContent = showFlow ? 'REFLECT' : '01 · PREDICT';
    $('lend-predict-title').textContent = showFlow ? 'What did you notice?' : 'Before opening the result';
    $('lend-predict-note').textContent = showFlow
      ? 'Revisit any stage to help you answer. Getting this wrong does not block completion.'
      : 'Your prediction helps you explore the idea. You can complete the lesson even if it is wrong.';
    $('lend-observe-label').textContent = showFlow ? 'CONNECT THE IDEA' : '02 · OBSERVE';
    $('lend-observe-title').textContent = showFlow ? 'What to take away' : 'Read the result';
    $('lend-check-label').textContent = showFlow ? 'CHECK YOUR UNDERSTANDING' : '03 · CHECK YOUR UNDERSTANDING';
    if (showFlow) renderLoopMoneyFlow($('lend-money-flow'), example.result, lesson.id);
    $('lend-application-context').textContent = lesson.applicationContext;
    $('lend-application-question').textContent = lesson.applicationQuestion;
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
    $('lend-reveal').disabled = !draft.prediction; $('lend-reveal').textContent = revealLabel();
    if (draft.revealed) {
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
  $('lend-reveal').addEventListener('click', () => {
    reveal(); $('lend-observe-title').focus({ preventScroll: true });
    $('lend-observe').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
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
