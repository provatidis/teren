import { saveLearningLocation } from '../data/learning-location.js';
import { focusSceneOutcome, createPredictionPrompt, markPredictionRevealed, foldPrediction, sceneNode } from '../lib/lesson-scene.js';
import { createTokenBalanceScene } from '../lib/liquidity-lesson-scenes.js';
import { createRangeBoundaryScene } from '../lib/range-lesson-scene.js';
import { createFoundationScene } from '../lib/foundation-lesson-scenes.js';
import { createComparisonScene } from '../lib/comparison-lesson-scene.js';
import { createBenchmarkScene, createFeeScene } from '../lib/benchmark-lesson-scene.js';
import { createLiquidityApplication } from '../lib/liquidity-application-scene.js';
import { stageForLesson } from '../learning/example-path.js';
import { DEEPER_READING } from '../learning/deeper-reading.js';
import { lessonWalkthrough } from '../lib/lesson-walkthrough.js';
import { renderLessonSetup, liquidityLessonSetup } from '../lib/lesson-setup.js';
import { LESSONS } from '../learning/liquidity-essentials.js';
import { LESSON_IDS, VARIANTS, lessonSetup, runLesson } from '../models/lesson-experiments.js';
import { checkLessonUnderstanding, essentialQuestionRevisions } from '../models/lesson-application.js';
import { lessonApplicationCopy } from '../lib/lesson-application-copy.js';
import { newChoiceSeed, validChoiceSeed } from '../lib/learning-choices.js';
import { learningChoices, learningMetric, learningPitfall, learningChapter, focusLearningFeedback, focusInitialLesson, renderPredictionFeedback, renderUnderstandingFeedback, clearUnderstandingFeedback } from '../lib/learning-elements.js';
import { POOL_PITFALLS } from '../learning/pool-pitfalls.js';
import { managementLessonFromHash } from '../lib/management-links.js';
import { readProgress, saveProgress } from '../data/learning-progress.js';
import { fmt, usd, signedUSD, percent, formatTokenQuantity } from '../lib/format.js';
import { scenarioHash } from '../lib/scenario-links.js';
import { lessonHandoff } from '../lib/lesson-handoff.js';
import { resultCardBlob } from '../lib/result-card.js';
import { appliedLessonFromHash } from '../lib/applied-lessons.js';
import { rangePrediction, benchmarkNarration, lessonFinding, predictionNote, tradePrediction, depositPrediction, priceMovePrediction, benchmarkPrediction, feePrediction } from '../lib/lesson-narration.js';

export function initLearning() {
  const $ = id => document.getElementById(id);
  const predictionFeedbackElement = $('learn-prediction-feedback');
  const predictionField = $('learn-prediction-field'), controls = $('learn-controls');
  let lessonScene, applicationScene;
  // Lessons 1 to 6 put the figure before the question and reveal the outcome in
  // place. Lesson 7 puts its challenge first and reveals when it is solved.
  // Links from lesson 1's pilot (&layout=play) still open it.
  const POOL_FIRST = ['swap-impact', 'pool-share', 'token-balances', 'loss-vs-profit', 'fee-break-even', 'range-boundaries', 'final-challenge'];
  let poolFirst = false;
  // Lessons 1 to 6 ask their prediction in the setup's own numbers.
  const predictionCopy = () => lesson.id === 'swap-impact' ? tradePrediction(draft.inputs)
    : lesson.id === 'pool-share' ? depositPrediction(draft.inputs)
    : lesson.id === 'token-balances' ? { question: priceMovePrediction(draft.inputs), choices: lesson.predictions }
      : lesson.id === 'loss-vs-profit' ? benchmarkPrediction(draft.inputs)
        : lesson.id === 'fee-break-even' ? feePrediction(draft.inputs, runLesson(lesson.id, draft.inputs, draft.variant).result)
          : lesson.id === 'range-boundaries' ? { question: rangePrediction(draft.inputs, runLesson(lesson.id, draft.inputs, draft.variant).result), choices: lesson.predictions }
            : { question: lesson.prediction, choices: lesson.predictions };
  const pitfallElement = $('learn-pitfall');
  const foundationLesson = () => ['swap-impact', 'pool-share'].includes(lesson?.id);
  const comparisonLesson = () => ['loss-vs-profit', 'fee-break-even', 'final-challenge'].includes(lesson?.id);
  const visualLesson = () => foundationLesson() || ['token-balances', 'range-boundaries'].includes(lesson?.id) || comparisonLesson();
  const restored = readProgress();
  const progress = restored.progress;
  let available = restored.available;
  let lesson, draft, outcome = null, applicationCopy = null, cardURL = null, generation = 0;
  const courseDetails = $('learn-course');
  courseDetails.open = !matchMedia('(max-width: 750px)').matches;
  function persist() {
    const started = draft.prediction || draft.ran || draft.answer || draft.variant > 0 || progress.completed.includes(lesson.id);
    const index = LESSON_IDS.indexOf(lesson.id);
    $('learn-resume').textContent = started ? 'Continue: ' + lesson.short + ' ↓' : index === 6 ? 'Open the final challenge ↓' : 'Start lesson ' + (index + 1) + ' ↓';
    progress.lastLesson = lesson.id;
    progress.drafts[lesson.id] = draft;
    available = saveProgress(progress);
    $('learn-storage').textContent = available ? 'Progress saved in this browser.' : 'Saving is unavailable. You can keep learning in this tab.';
  }
  function updateProgress() {
    const count = progress.completed.length;
    if (!managementLessonFromHash(location.hash) && !appliedLessonFromHash(location.hash)) learningChapter('Essentials', count, 7);
    $('learn-progress-count').textContent = count + ' of 7 done';
    $('learn-progress').value = count;
    $('learn-progress').setAttribute('aria-label', count + ' of 7 exercises done');
    $('learn-course-status').textContent = count === 7 ? 'All essentials exercises done. Continue with range choices or revisit an experiment.' : 'Swaps and ownership, then comparisons and price ranges.';
    for (const link of document.querySelectorAll('[data-lesson-id]')) {
      const id = link.dataset.lessonId;
      const active = !managementLessonFromHash(location.hash) && !appliedLessonFromHash(location.hash) && id === lesson?.id;
      link.setAttribute('aria-current', active ? 'step' : 'false');
      link.querySelector('.learn-step-state').textContent = progress.completed.includes(id) ? 'Done' : active ? 'Now exploring' : 'Open lesson';
      link.classList.toggle('learn-step-done', progress.completed.includes(id));
    }
    if (lesson && !managementLessonFromHash(location.hash) && !appliedLessonFromHash(location.hash) && !matchMedia('(max-width: 750px)').matches) {
      const sidebar = document.querySelector('.learn-sidebar');
      const selected = document.querySelector('[data-lesson-id="' + lesson.id + '"]');
      const bounds = selected.getBoundingClientRect(), visible = sidebar.getBoundingClientRect();
      if (bounds.bottom > visible.bottom) sidebar.scrollTop += bounds.bottom - visible.bottom + 24;
      else if (bounds.top < visible.top) sidebar.scrollTop += bounds.top - visible.top - 24;
    }
  }
  function clearCard() {
    generation++;
    if (cardURL) { URL.revokeObjectURL(cardURL); cardURL = null; }
    $('learn-card-preview').hidden = true;
    $('learn-card-status').textContent = '';
  }
  function selection(name) { return document.querySelector('input[name="' + name + '"]:checked')?.value || ''; }
  function choices(container, name, values, selected) {
    learningChoices($(container),{name,values,selected,seed:draft.choiceSeed,group:lesson.id+name,shuffle:name!=='learn-prediction',onChange:value=>{
      if(name==='learn-prediction') {draft.prediction=value;$('learn-run').disabled=false;if(draft.ran)renderPrediction(!arrowing);arrowing=false;}
      else {draft.application=value;draft.taskChecked=false;clearUnderstandingFeedback('learn');$('learn-feedback').hidden=true;$('learn-continue').hidden=true;$('learn-record').hidden=true;$('learn-share').hidden=true;clearCard();}
      persist();
    }});
  }
  // No lesson edits its question's inputs any more: each scene explores beside
  // the question instead. A saved range width from the earlier editor still loads.
  function renderControls() { controls.replaceChildren(); }
  function questionLabel() {
    const s = draft.inputs;
    if (lesson.id === 'swap-impact') return formatTokenQuantity(s.amount, 4) + ' ETH swap';
    if (lesson.id === 'pool-share') return formatTokenQuantity(s.depositEth, 4) + ' ETH deposit';
    // Lesson 5 holds the price still: its question is about the fees.
    if (lesson.id === 'fee-break-even') return usd(s.fees) + ' in fees';
    return 'ETH at ' + usd(s.futurePrice) + (lesson.id === 'final-challenge' ? ' · ' + usd(s.fees) + ' in fees' : '');
  }
  function explanationLabel() {
    const s = draft.inputs;
    return 'Explain the ' + (foundationLesson() ? questionLabel() : usd(s.futurePrice) + ' outcome') + ' ↓';
  }
  // Arrow keys select each answer in a radio group as they move through it. While
  // a reader revises a prediction that way, the verdict follows and the answers
  // stay open; Enter, Space or leaving the group folds them. A click folds at once.
  let arrowing = false;
  predictionField.addEventListener('keydown', event => {
    if (event.key.startsWith('Arrow')) { arrowing = true; return; }
    const input = event.target;
    if (!draft.ran || !poolFirst || input.name !== 'learn-prediction' || !(event.key === 'Enter' || (event.key === ' ' && input.checked))) return;
    event.preventDefault();
    renderPrediction();
    predictionFeedbackElement.tabIndex = -1; predictionFeedbackElement.focus({ preventScroll: true });
  });
  predictionField.addEventListener('keyup', () => { arrowing = false; });
  // A click on the answer already chosen confirms it too; a new one folds through its change.
  predictionField.addEventListener('click', event => {
    const input = event.target;
    if (event.detail > 0 && draft.ran && poolFirst && input.name === 'learn-prediction' && input.checked && input.value === draft.prediction) renderPrediction();
  });
  // Moving focus to a control outside the prompt confirms the choice. The prompt
  // is rebuilt with each lesson, so this listens on the lesson around it. A click
  // on the page around it moves focus nowhere and leaves the answers open.
  $('learn-essential').addEventListener('focusout', event => {
    const prompt = predictionField.closest('.scene-prediction');
    if (!draft?.ran || !poolFirst || !prompt?.contains(event.target) || prompt.dataset.folded !== 'false'
      || !event.relatedTarget || prompt.contains(event.relatedTarget)) return;
    renderPrediction();
  });
  function renderPrediction(fold = true) {
    renderPredictionFeedback(predictionFeedbackElement, predictionCopy().choices, draft.prediction, outcome.prediction,
      (['final-challenge', 'fee-break-even'].includes(lesson.id) ? '' : questionLabel() + ': ') + lessonFinding(lesson.id, outcome),
      // A prediction that differs is answered with what it would need to be true.
      predictionNote(lesson.id, outcome, draft.prediction));
    markPredictionRevealed(predictionField);
    if (poolFirst && fold) foldPrediction(predictionField, lesson.id === 'final-challenge' ? 'Your answer on the price move'
      : 'Your prediction for ' + (foundationLesson() ? 'the ' : '') + questionLabel());
  }
  function prepareChallenge(input) {
    applicationScene = createLiquidityApplication(input, draft.task, (value, solved) => {
      draft.task = value; draft.taskChecked = false;
      clearUnderstandingFeedback('learn');
      $('learn-feedback').hidden = true; $('learn-continue').hidden = true; $('learn-share').hidden = true;
      clearCard();
      // Solving the challenge is its outcome: the verdict, the explanation and the
      // questions appear under it. Nothing above the sliders moves, and focus stays put.
      if (solved && !draft.ran) { draft.ran = true; lessonScene.showQuestion(); renderResults(); }
      // The lab link carries the reader's own example, so it follows the sliders.
      else if (outcome) renderHandoff();
      persist();
    });
    draft.task = applicationScene.value();
    $('learn-application-task').replaceChildren(applicationScene.element);
  }
  function updateSetup() {
    const s = draft.inputs;
    renderLessonSetup($('learn-setup'), liquidityLessonSetup(lesson.id, s));
    const hasTask = lesson.id === 'final-challenge';
    // The challenge comes before its question; other lessons have no task.
    if (hasTask) $('learn-application-task').after($('learn-scene')); else $('learn-application-task').before($('learn-scene'));
    $('learn-application-task').hidden = !hasTask;
    $('learn-worked-comparison').hidden = !hasTask;
    $('learn-worked-comparison').open = false;
    $('learn-worked-scene').replaceChildren();
    if (hasTask) prepareChallenge(s);
    else { applicationScene = null; $('learn-application-task').replaceChildren(); }
    $('learn-variation-label').textContent = 'Variation ' + (draft.variant + 1) + ' of ' + VARIANTS;
    const model = lesson.protocol + (lesson.id === 'range-boundaries' ? ' · Price range' : ['swap-impact', 'pool-share'].includes(lesson.id) ? ' · Virtual pool' : ' · Full-range 50/50');
    $('learn-model').textContent = model + ' · Illustrative inputs · USDC = $1';
    if (visualLesson()) {
      $('learn-prediction-question').textContent = predictionCopy().question;
      const prediction = createPredictionPrompt(predictionField, { selected: draft.prediction, feedback: predictionFeedbackElement, onShow: () => showResult(true) });
      prediction.querySelector('.scene-prediction-show').id = 'learn-reveal';
      lessonScene = foundationLesson() ? createFoundationScene(lesson.id, s, draft.variant, prediction, { explanation: lesson.explanation })
        : lesson.id === 'loss-vs-profit' ? createBenchmarkScene(s, prediction, { explanation: lesson.explanation })
        : lesson.id === 'fee-break-even' ? createFeeScene(s, prediction, { explanation: lesson.explanation })
        : hasTask ? createComparisonScene(s)
        : lesson.id === 'range-boundaries' ? createRangeBoundaryScene(s, prediction, { explanation: lesson.explanation })
        : createTokenBalanceScene(s, prediction, { explanation: lesson.explanation });
      $('learn-prediction-home').replaceChildren();
      if (hasTask) {
        // The worked example stays an optional comparison under "Look closer". The
        // lesson's own scene is the challenge above, its question and one panel.
        const worked = lessonScene;
        $('learn-worked-scene').replaceChildren(worked.element);
        const frame = sceneNode('div', undefined, 'lesson-scene challenge-scene');
        const panel = sceneNode('section', undefined, 'foundation-outcome'); panel.id = 'challenge-outcome';
        panel.setAttribute('aria-labelledby', 'challenge-outcome-title');
        const heading = sceneNode('h4', 'Two results, not one'); heading.id = 'challenge-outcome-title';
        const why = sceneNode('p', lesson.explanation, 'foundation-why'); why.id = 'challenge-why';
        panel.append(heading, '\n', why); panel.hidden = true;
        // The challenge is already in hand, so its question reads as a first step.
        prediction.querySelector('.scene-prediction-invite').textContent = 'Need a first step?';
        frame.append(prediction, '\n', panel);
        $('learn-scene').replaceChildren(frame);
        // The answer opens where the question is, below the sliders: the challenge
        // figure above it stays where the reader left it.
        lessonScene = { element: frame, figure: frame, verdictBefore: prediction,
          showQuestion() { panel.hidden = false; worked.showQuestion(); } };
      } else $('learn-scene').replaceChildren(lessonScene.element);
      if (poolFirst) {
        // The verdict sits right under the figure and its control, the pitfall joins
        // the panel it warns about, and one note holds the assumptions.
        if (lessonScene.verdictBefore) lessonScene.verdictBefore.before(predictionFeedbackElement);
        else (lessonScene.verdictAfter || lessonScene.element.querySelector('.scene-player')).after(predictionFeedbackElement);
        lessonScene.element.querySelector('.foundation-outcome').append(pitfallElement);
        const about = sceneNode('details', undefined, 'learn-about-example');
        about.append(sceneNode('summary', 'About this example'),
          sceneNode('p', lesson.protocol + ' pool with illustrative inputs. USDC = $1. ' + (lesson.id === 'range-boundaries'
            // A range does not start half and half, unlike the pools of lessons 3 to 5.
            ? 'You put ' + usd(s.investment) + ' into one range, ' + usd(s.initialPrice * (1 - s.width)) + '–' + usd(s.initialPrice * (1 + s.width)) + ', at ' + usd(s.initialPrice)
              + ' per ETH. A range does not start half and half: this one starts with '
              + (start => fmt(start.eth, 4) + ' ETH + ' + fmt(start.usdc, 2) + ' USDC')(runLesson(lesson.id, { futurePrice: s.initialPrice, width: s.width }, draft.variant).result.pooled)
              + '. Each price you explore is a separate outcome, as if traders had already moved the pool’s price there. Fees are left out.'
            : foundationLesson()
            ? liquidityLessonSetup(lesson.id, s).assumptions
              + (lesson.id === 'pool-share' ? ' Each deposit size you explore starts from the same pool. The later trade pays a 0.3% fee. Claims use proportional ownership before withdrawal rounding.'
                : ' Each trade size you explore starts from the same pool.')
            : 'You start with ' + usd(s.investment) + ', half in ETH and half in USDC, at ' + usd(s.initialPrice) + ' per ETH. '
              + (hasTask ? 'Holding keeps those tokens in your wallet. Each price you pick is a separate outcome, as if traders had already brought the pool’s price to the market’s. Fees are cash you choose, added to your claim. Gas and other costs are left out.'
                : lesson.id === 'loss-vs-profit' ? 'Holding keeps those tokens in your wallet. Each price you explore is a separate outcome, as if traders had already brought the pool’s price to the market’s. Fees are left out here; the next lesson adds them.'
                : lesson.id === 'fee-break-even' ? 'ETH has moved to ' + usd(s.futurePrice) + ' and stays there while you change the fees. Fees are cash you choose, added to your claim after any protocol share. Gas and other costs are left out.'
                  : 'Each price you explore is compared with that same start, as if traders had already brought the pool’s price to the market’s. Fees are left out.'))),
          sceneNode('p', $('learn-variation-label').textContent + '. Try another variation for new ' + (foundationLesson() ? 'pool balances' : 'prices') + '.'));
        lessonScene.element.append(about);
      }
      $('learn-run').textContent = explanationLabel();
    } else {
      $('learn-prediction-home').replaceChildren(createPredictionPrompt(predictionField, { selected: draft.prediction, onShow: () => showResult() }));
    }
  }
  const metric=learningMetric;
  function bar(label, percentValue, detail) {
    const row = document.createElement('div'); row.className = 'learn-bar-row';
    const heading = document.createElement('div'); heading.className = 'learn-bar-label';
    const title = document.createElement('span'); title.textContent = label;
    const amount = document.createElement('span'); amount.textContent = detail;
    heading.append(title, ' ', amount);
    const rail = document.createElement('div'); rail.className = 'learn-bar'; rail.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span'); fill.style.width = Math.max(0, Math.min(100, percentValue)) + '%'; rail.append(fill);
    row.append(heading, rail); return row;
  }
  function renderDeeper() {
    const reading = DEEPER_READING[lesson.id];
    $('learn-fee-case').hidden = !['fee-break-even', 'range-boundaries', 'final-challenge'].includes(lesson.id);
    $('learn-deeper-title').textContent = reading.title;
    $('learn-deeper-body').replaceChildren(...reading.paragraphs.map(text => {
      const paragraph = document.createElement('p'); paragraph.textContent = text; return paragraph;
    }));
    $('learn-worked-steps').replaceChildren(...lessonWalkthrough(lesson.id, outcome).map(([title, text]) => {
      const step = document.createElement('li');
      const heading = document.createElement('strong'); heading.textContent = title;
      const paragraph = document.createElement('p'); paragraph.textContent = text;
      step.append(heading, '\n', paragraph); return step;
    }));
    $('learn-misconception-title').textContent = reading.misconception.title;
    $('learn-misconception-copy').textContent = reading.misconception.text;
    $('learn-math-intro').textContent = reading.math.introduction;
    $('learn-math-formula').textContent = reading.math.formula;
    $('learn-math-note').textContent = reading.math.note;
    $('learn-sources').replaceChildren(...reading.sources.map(source => {
      const item = document.createElement('li');
      const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = source.title + ' ↗';
      const description = document.createElement('p'); description.textContent = source.detail;
      item.append(link, '\n', description); return item;
    }));
  }
  function renderResults() {
    outcome = runLesson(lesson.id, draft.inputs, draft.variant);
    applicationCopy = lessonApplicationCopy(lesson.id, outcome, draft.task);
    const s = outcome.setup, r = outcome.result, metrics = [], visual = [];
    if (lesson.id === 'swap-impact') {
      metrics.push(metric('USDC received', fmt(outcome.out, 2), 'After the 0.3% swap fee'), metric('Price impact', fmt(outcome.impact, 2) + '%', 'Excludes the fee itself'), metric('Average price you receive', usd(outcome.out / s.amount), 'USDC per ETH, including fee'));
      const max = outcome.impact;
      const small = 0.997 / (s.reserveEth + 0.997) * 100;
      visual.push(bar('A 1 ETH swap', small / Math.max(max, small) * 100, fmt(small, 2) + '% impact'), bar('Your ' + s.amount + ' ETH swap', max / Math.max(max, small) * 100, fmt(max, 2) + '% impact'));
    } else if (lesson.id === 'pool-share') {
      metrics.push(metric('Your pool ownership', fmt(outcome.share, 2) + '%', 'Your claim on both reserves'), metric('Your matching deposit', fmt(s.depositEth, 0) + ' ETH', '+ ' + fmt(outcome.usdcDeposit, 0) + ' USDC'), metric('Enlarged ETH reserve', fmt(s.reserveEth + s.depositEth, 0) + ' ETH', 'Includes your deposit'));
      visual.push(bar('Your share of the enlarged pool', outcome.share, fmt(outcome.share, 2) + '%'));
    } else if (lesson.id === 'range-boundaries') {
      const state = { inside: 'Inside the range', above: 'Above the upper bound', below: 'Below the lower bound', 'upper-edge': 'At the upper bound', 'lower-edge': 'At the lower bound' }[r.state];
      metrics.push(metric('Final ETH', fmt(r.pooled.eth, 6) + ' ETH', 'Position principal, excluding fees'), metric('Final USDC', fmt(r.pooled.usdc, 2), 'USDC = $1'), metric('ETH share of value', fmt(r.finalEthPercent, 2) + '%', state));
      visual.push(bar('ETH portion of principal', r.finalEthPercent, fmt(r.finalEthPercent, 2) + '%'), bar('USDC portion of principal', 100 - r.finalEthPercent, fmt(100 - r.finalEthPercent, 2) + '%'));
    } else if (lesson.id === 'token-balances') {
      metrics.push(metric('Starting ETH', fmt(r.held.eth, 6) + ' ETH', 'Holding keeps this amount'), metric('Final LP ETH', fmt(r.pooled.eth, 6) + ' ETH', 'After ideal arbitrage'), metric('Final LP USDC', fmt(r.pooled.usdc, 2), 'Starting USDC: ' + fmt(r.held.usdc, 2)));
      const max = Math.max(r.held.eth, r.pooled.eth);
      visual.push(bar('Starting ETH', r.held.eth / max * 100, fmt(r.held.eth, 6)), bar('Final LP ETH', r.pooled.eth / max * 100, fmt(r.pooled.eth, 6)));
    } else {
      metrics.push(metric('Holding starting tokens', usd(r.holdValue), fmt(r.held.eth, 4) + ' ETH + ' + fmt(r.held.usdc, 2) + ' USDC'),
        metric('LP ' + (s.fees ? '+ assumed fees' : 'before fees'), usd(r.lpValue), 'Dollar return: ' + percent(r.lpReturn)),
        metric('LP minus holding', signedUSD(r.difference), 'Before-fee IL: ' + percent(r.impermanentLoss)));
      const max = Math.max(r.holdValue, r.lpValue);
      visual.push(bar('Holding', r.holdValue / max * 100, usd(r.holdValue)), bar('LP before fees', r.lpBeforeFees / max * 100, usd(r.lpBeforeFees)));
      if (s.fees) visual.push(bar('LP + ' + usd(s.fees) + ' assumed fees', r.lpValue / max * 100, usd(r.lpValue)));
    }
    $('learn-metrics').replaceChildren(...metrics); $('learn-visual').replaceChildren(...visual);
    $('learn-results-title').textContent = poolFirst ? 'Look closer' : questionLabel();
    renderPrediction();
    // Pool-first lessons keep their one explanation in the scene's panel.
    $('learn-explanation').textContent = benchmarkNarration(lesson.id, outcome) || lesson.explanation;
    // One question follows the figure: its case, the question, and a hint.
    $('learn-application-context').textContent = applicationCopy.context;
    // The challenge's case is the reader's own example, already on screen.
    $('learn-application-context').parentElement.hidden = !applicationCopy.context;
    const hasTask = lesson.id === 'final-challenge';
    $('learn-check').textContent = hasTask ? 'Check this setup and answer →' : 'Check answer →';
    $('learn-application-question').textContent = applicationCopy.question;
    if (!applicationCopy.choices.some(([id]) => id === draft.application)) draft.application = '';
    choices('learn-applications', 'learn-application', applicationCopy.choices, draft.application);
    $('learn-hint-text').textContent = applicationCopy.hint;
    learningPitfall(pitfallElement,POOL_PITFALLS[lesson.id]);
    renderDeeper();
    $('learn-results').hidden = false; $('learn-assessment').hidden = false;
    $('learn-run').textContent = visualLesson() ? explanationLabel() : 'Run again →';
    $('learn-input-status').textContent = '';
    renderHandoff();
  }
  // "Look closer": one question to take into a lab, and a link that names the
  // lab it opens. The challenge's link follows the reader's own example.
  function renderHandoff() {
    const handoff = lessonHandoff(lesson.id, outcome, draft.task);
    const home = new URL('liquidity.html', location.href); home.hash = handoff.hash;
    $('learn-explore-question').textContent = handoff.question;
    $('learn-explore').href = home.href; $('learn-explore').textContent = handoff.link;
    $('learn-explore-note').textContent = handoff.note;
    if (outcome.result && lesson.id === 'final-challenge') $('learn-share-url').value = new URL('liquidity.html' + scenarioHash(outcome.setup), location.href).href;
  }
  function loadLesson() {
    clearUnderstandingFeedback('learn');
    clearCard();
    const applied = appliedLessonFromHash(location.hash) || managementLessonFromHash(location.hash);
    $('learn-essential').hidden = Boolean(applied);
    if (applied) { $('learn-route-note').hidden = true; updateProgress(); return false; }
    $('learn-page-title').textContent = 'Liquidity essentials';
    $('learn-page-subtitle').textContent = 'Explore Uniswap v2-style full-range pools and Uniswap v3-style price ranges with interactive examples.';
    const params = new URLSearchParams(location.hash.slice(1));
    const requested = params.get('lesson');
    const pilotLink = requested === 'swap-impact' && params.getAll('layout').length === 1 && params.get('layout') === 'play';
    const valid = LESSON_IDS.includes(requested) && params.getAll('lesson').length === 1 && [...params.keys()].every(key => key === 'lesson' || (pilotLink && key === 'layout'));
    const id = valid ? requested : progress.lastLesson;
    $('learn-route-note').hidden = !location.hash || valid;
    lesson = LESSONS.find(item => item.id === id);
    poolFirst = POOL_FIRST.includes(id);
    $('learn-essential').toggleAttribute('data-pool-first', poolFirst);
    $('learn-explore').before(pitfallElement);
    $('learn-check-title').textContent = poolFirst ? 'What does this tell you?' : 'Explain the result and apply the idea';
    saveLearningLocation('learn.html#lesson=' + id);
    const index = LESSON_IDS.indexOf(id);
    draft = progress.drafts[id] || { variant: 0, inputs: lessonSetup(id), prediction: '', answer: '', application: '', choiceSeed: newChoiceSeed(), ran: false };
    const revisions = essentialQuestionRevisions(id, draft.variant);
    draft.predictionRevision = revisions.prediction; draft.applicationRevision = revisions.application;
    if (!validChoiceSeed(draft.choiceSeed)) draft.choiceSeed = newChoiceSeed();
    draft.application ||= '';
    if (!lesson.predictions.some(([value]) => value === draft.prediction)) draft.prediction = '';

    $('learn-level').textContent = lesson.protocol + ' · ' + stageForLesson(lesson.id).title;
    $('learn-lesson-title').textContent = lesson.title; document.title = lesson.short + ' · Teren Learn';
    $('learn-lesson-number').textContent = index === 6 ? 'FINAL CHALLENGE · 7 OF 7' : 'LESSON ' + (index + 1) + ' OF 7';
    $('learn-concept').textContent = lesson.concept; $('learn-skill').textContent = lesson.skill;
    $('learn-intro').textContent = lesson.intro; $('learn-prediction-question').textContent = lesson.prediction;
    $('learn-hint').open = false;
    $('learn-deeper').open = false; $('learn-math').open = false;
    $('learn-takeaway').textContent = lesson.takeaway;
    $('learn-takeaway').hidden = true;
    $('learn-results').hidden = true; $('learn-assessment').hidden = true; $('learn-feedback').hidden = true; $('learn-share').hidden = true; $('learn-continue').hidden = true; $('learn-record').hidden = true;
    $('learn-input-status').textContent = ''; $('learn-run').disabled = false; $('learn-run').textContent = 'Run experiment →';
    choices('learn-predictions', 'learn-prediction', predictionCopy().choices, draft.prediction);
    $('learn-scene').hidden = !visualLesson();
    $('learn-setup').hidden = false;
    $('learn-metrics').hidden = visualLesson(); $('learn-visual').hidden = visualLesson();
    $('learn-experiment-title').textContent = {
      'swap-impact': 'Follow the swap', 'pool-share': 'Watch your pool share', 'token-balances': 'Watch your claim',
      'loss-vs-profit': 'Profit compared with what?', 'fee-break-even': 'Can fees close the gap?', 'final-challenge': 'Your challenge', 'range-boundaries': 'Watch the price cross your range',
    }[lesson.id] || 'Your experiment';
    $('learn-results-title').after(predictionFeedbackElement);
    $('learn-controls-home').replaceChildren(controls);
    renderControls(); updateSetup(); updateProgress();
    if (draft.ran) {
      if (visualLesson()) lessonScene.showQuestion();
      renderResults();
      if ((id !== 'final-challenge' || draft.taskChecked) && checkLessonUnderstanding(id, draft.inputs, draft.variant, draft.application, draft.task).passed) showCheck(false);
    }
    persist();
    return true;
  }
  function showCheck(save = true) {
    const check = checkLessonUnderstanding(lesson.id, draft.inputs, draft.variant, draft.application, draft.task);
    if (applicationScene && save) draft.taskChecked = true;
    // The answer's own feedback says whether it is right, and why. This box says
    // where the lesson stands: done, or, in the challenge, which part to review.
    $('learn-feedback').hidden = !check.passed && !applicationScene;
    $('learn-feedback').className = 'learn-feedback ' + (check.passed ? 'learn-pass' : 'learn-retry');
    const position = LESSON_IDS.indexOf(lesson.id);
    $('learn-feedback-title').textContent = check.passed ? (position === 6 ? 'Challenge done.' : 'Lesson ' + (position + 1) + ' done.') : check.application ? 'Review your setup.' : 'Review your answer.';
    // The challenge's feedback describes the reader's example as it stands now.
    if (applicationScene) applicationCopy = lessonApplicationCopy(lesson.id, outcome, draft.task);
    const applicationFeedback = draft.application ? (applicationCopy.feedbackByChoice?.[draft.application] || applicationCopy.feedback) : 'Choose an answer. ' + applicationCopy.hint;
    renderUnderstandingFeedback('learn', [
      { container: 'learn-applications', selected: draft.application, correct: check.application, explanation: applicationFeedback },
    ]);
    $('learn-feedback-copy').textContent = check.passed ? lesson.completion : 'Read the feedback beside the task or question, then try again.';
    const taskFeedback = applicationScene?.showFeedback();
    $('learn-continue').hidden = !check.passed;
    $('learn-share').hidden = !(check.passed && lesson.id === 'final-challenge');
    // Lessons 5 and 6 end on "you need a record". The site has one, and a reader
    // who answered otherwise needs it most: it follows the feedback on any answer.
    $('learn-record').hidden = !draft.application || !['fee-break-even', 'range-boundaries'].includes(lesson.id);
    if (check.passed) {
      if (!progress.completed.includes(lesson.id)) progress.completed.push(lesson.id);
      const index = LESSON_IDS.indexOf(lesson.id);
      $('learn-next').href = index < 6 ? '#lesson=' + LESSON_IDS[index + 1] : '#manage=range-width';
      $('learn-next').textContent = index < 6 ? 'Next: ' + LESSONS[index + 1].short + ' →' : 'Next: Choosing and managing a range →';
    }
    updateProgress();
    if (save) {
      persist();
      if (!check.demonstration && check.application) {
        taskFeedback.focus({ preventScroll: true }); taskFeedback.scrollIntoView({ block: 'center', behavior: 'instant' });
      } else focusLearningFeedback('learn');
    }
  }
  // The figure is already on screen: keep it there while the outcome plays, and
  // scroll only as far as the verdict under it needs.
  function revealInPlace() {
    const pool = lessonScene.figure || $('learn-scene').querySelector('.foundation-pool');
    const feedback = predictionFeedbackElement;
    feedback.tabIndex = -1;
    feedback.classList.add('scene-outcome-focus');
    feedback.focus({ preventScroll: true });
    const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const poolTop = pool.getBoundingClientRect().top - top;
    const below = feedback.getBoundingClientRect().bottom + 16 - innerHeight;
    const delta = poolTop < 0 ? poolTop : Math.min(Math.max(below, 0), poolTop);
    if (delta) scrollBy({ top: delta, behavior: 'instant' });
  }
  function showResult(sceneFirst = false) {
    draft.prediction = selection('learn-prediction');
    if (sceneFirst && visualLesson()) lessonScene.showQuestion(true);
    if (!draft.ran) { draft.ran = true; renderResults(); }
    else renderPrediction();
    persist();
    if (sceneFirst && poolFirst) { revealInPlace(); return; }
    if (sceneFirst && visualLesson()) { focusSceneOutcome($('learn-scene')); return; }
    const title = $('learn-results-title');
    title.tabIndex = -1; title.focus({ preventScroll: true });
    title.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  $('learn-run').addEventListener('click', () => showResult());
  $('learn-assessment-form').addEventListener('submit', event => { event.preventDefault(); if (!draft.ran) return; draft.application = selection('learn-application'); showCheck(); });
  function changeVariation() {
    const variant = (draft.variant + 1) % VARIANTS;
    draft = { variant, inputs: lessonSetup(lesson.id, variant), prediction: '', answer: '', application: '', choiceSeed: newChoiceSeed(), ran: false };
    progress.drafts[lesson.id] = draft; loadLesson();
    $('learn-lesson-title').focus({ preventScroll: true }); $('learn-lesson-title').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  $('learn-variation').addEventListener('click', changeVariation);
  $('learn-fresh').addEventListener('click', changeVariation);
  $('learn-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('learn-share-url').value); $('learn-card-status').textContent = 'Scenario link copied.'; }
    catch { $('learn-card-status').textContent = 'Select and copy the scenario link below.'; $('learn-share-url').focus(); $('learn-share-url').select(); }
  });
  $('learn-create-card').addEventListener('click', async () => {
    if (lesson.id !== 'final-challenge' || !outcome || !draft.taskChecked || !checkLessonUnderstanding(lesson.id, draft.inputs, draft.variant, draft.application, draft.task).passed) return;
    const token = generation; $('learn-card-status').textContent = 'Creating your result card…';
    try {
      const blob = await resultCardBlob(outcome.setup, new URL('liquidity.html', location.href).href);
      if (generation !== token) return;
      if (cardURL) URL.revokeObjectURL(cardURL);
      cardURL = URL.createObjectURL(blob); $('learn-card-image').src = cardURL; $('learn-card-download').href = cardURL;
      $('learn-card-preview').hidden = false; $('learn-card-status').textContent = 'Card ready. The scenario link reproduces its assumptions.';
    } catch (error) { if (generation === token) $('learn-card-status').textContent = error.message; }
  });
  const overview = $('learn-lesson-list');
  let lastLevel = 0, groupList;
  LESSONS.forEach((item, i) => {
    const stage = stageForLesson(item.id);
    if (stage.level !== lastLevel) {
      const group = document.createElement('li'); group.className = 'learn-path-group';
      const heading = document.createElement('h2'); heading.textContent = stage.level + ' · ' + stage.title;
      groupList = document.createElement('ol'); group.append(heading, groupList);
      overview.append(group); lastLevel = stage.level;
    }
    const li = document.createElement('li'); const link = document.createElement('a'); link.href = '#lesson=' + item.id; link.dataset.lessonId = item.id;
    const number = document.createElement('span'); number.className = 'learn-step-number'; number.textContent = i === 6 ? '★' : String(i + 1).padStart(2, '0');
    const copy = document.createElement('span'); copy.className = 'learn-step-copy';
    const title = document.createElement('strong'); title.textContent = item.short;
    const state = document.createElement('span'); state.className = 'learn-step-state';
    copy.append(title, ' ', state); link.append(number, ' ', copy); li.append(link); groupList.append(li);
    link.addEventListener('click', () => { if (matchMedia('(max-width: 750px)').matches) courseDetails.open = false; });
  });
  $('learn-topics').addEventListener('click', () => { courseDetails.open = true; const summary = courseDetails.querySelector('summary'); summary.focus({ preventScroll: true }); courseDetails.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  $('learn-resume').addEventListener('click', () => { if (appliedLessonFromHash(location.hash) || managementLessonFromHash(location.hash)) return; $('learn-lesson-title').focus({ preventScroll: true }); $('learn-lesson-title').scrollIntoView({ block: 'start', behavior: 'instant' }); });
  window.addEventListener('hashchange', () => { if (!loadLesson()) return; $('learn-lesson-title').focus({ preventScroll: true }); $('learn-lesson-title').scrollIntoView({ block: 'start', behavior: 'instant' }); });
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#lesson="]');
    if (link && link.hash === location.hash && link.hash === '#lesson=' + lesson?.id) {
      event.preventDefault();
      if (matchMedia('(max-width: 750px)').matches) courseDetails.open = false;
      $('learn-lesson-title').focus({ preventScroll: true });
      $('learn-lesson-title').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });
  window.addEventListener('pagehide', () => { if (cardURL) URL.revokeObjectURL(cardURL); });
  if (loadLesson() && location.hash && $('learn-route-note').hidden) focusInitialLesson('learn-lesson-title');
}
