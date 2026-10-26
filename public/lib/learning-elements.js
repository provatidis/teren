import { orderedLearningChoices, predictionFeedback } from './learning-choices.js';

export function renderPredictionFeedback(element, choices, selected, actual, finding) {
  const copy = predictionFeedback(choices, selected, actual, finding);
  const hasPrediction = choices.some(([id]) => id === selected);
  element.dataset.state = hasPrediction ? selected === actual ? 'match' : 'different' : 'skipped';
  const heading = hasPrediction ? copy.slice(0, copy.indexOf('.') + 1) : 'What happens';
  const title = document.createElement('strong'); title.textContent = heading;
  const detail = document.createElement('span'); detail.textContent = hasPrediction ? copy.slice(heading.length).trim() : copy;
  element.replaceChildren(title, ' ', detail);
}

export function learningChapter(chapter, completed, total) {
  document.getElementById('learn-current-chapter').textContent = chapter;
  document.getElementById('learn-current-progress').textContent = completed + ' of ' + total + ' checked';
}

export function focusLearningFeedback(prefix) {
  const feedback = document.querySelector('[data-check="' + prefix + '"][data-state="different"], [data-check="' + prefix + '"][data-state="unanswered"]')
    || document.getElementById(prefix + '-feedback');
  feedback.focus({ preventScroll: true });
  feedback.scrollIntoView({ block: 'start', behavior: 'instant' });
}

// Explain each answer where it was chosen. These states are transient; completion
// remains the existing two-question progress check, with no attempt scoring.
export function renderUnderstandingFeedback(prefix, entries) {
  for (const { container, selected, correct, explanation } of entries) {
    const choices = document.getElementById(container);
    const field = choices.closest('fieldset');
    const id = container + '-feedback';
    let feedback = document.getElementById(id);
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = id;
      feedback.className = 'learn-answer-feedback';
      feedback.tabIndex = -1;
      feedback.dataset.check = prefix;
      choices.after(feedback);
    }
    const state = !selected ? 'unanswered' : correct ? 'match' : 'different';
    feedback.dataset.state = state;
    const title = document.createElement('strong');
    title.textContent = state === 'match' ? 'That’s right.' : state === 'different' ? 'Not quite — here’s why.' : 'Choose an answer to compare.';
    const detail = document.createElement('p'); detail.textContent = explanation;
    feedback.replaceChildren(title, '\n', detail);
    const describedBy = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    describedBy.add(id); field.setAttribute('aria-describedby', [...describedBy].join(' '));
  }
}

export function clearUnderstandingFeedback(prefix) {
  for (const feedback of document.querySelectorAll('[data-check="' + prefix + '"]')) {
    const field = feedback.closest('fieldset');
    const ids = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== feedback.id);
    if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
    else field.removeAttribute('aria-describedby');
    feedback.remove();
  }
}

// A newly opened lesson link should land on that lesson. Reload and browser
// history keep their reading position instead of being pulled back to its top.
export function focusInitialLesson(id) {
  if (performance.getEntriesByType('navigation')[0]?.type !== 'navigate') return;
  const hash = location.hash;
  requestAnimationFrame(() => {
    const heading = document.getElementById(id);
    if (location.hash !== hash || !heading || heading.closest('[hidden]')) return;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}

export function learningChoices(container, {name,values,selected,seed,group,onChange,shuffle=true}) {
  const ordered=shuffle?orderedLearningChoices(values,seed,group):values;
  container.replaceChildren(...ordered.map(([value,copy])=>{
    const label=document.createElement('label');label.className='learn-choice';
    const input=document.createElement('input');input.type='radio';input.name=name;input.value=value;input.checked=value===selected;
    const text=document.createElement('span');text.textContent=copy;label.append(input,' ',text);
    input.addEventListener('change',()=>onChange(value));return label;
  }));
}
export function learningMetric(label,value,note='') {
  const block=document.createElement('div');block.className='learn-metric';
  const title=document.createElement('span');title.className='label';title.textContent=label;
  const amount=document.createElement('strong');amount.textContent=value;
  const detail=document.createElement('span');detail.className='learn-metric-note';detail.textContent=note;
  block.append(title,' ',amount,' ',detail);return block;
}
export function learningSources(container,sources) {
  container.replaceChildren(...sources.map(source=>{
    const item=document.createElement('li'),link=document.createElement('a');
    link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source.title+' ↗';item.append(link);return item;
  }));
}
export function learningPitfall(container,entry) {
  const title=document.createElement('strong'),copy=document.createElement('p'),link=document.createElement('a');
  title.textContent=entry.title;copy.textContent=entry.copy;
  link.href=entry.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Read the source ↗';
  container.replaceChildren(title,' ',copy,' ',link);
}
