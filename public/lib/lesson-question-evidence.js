import { sceneNode as node } from './lesson-scene.js';

// These are facts for the adjacent question, independent of an explored frame.
export function renderQuestionEvidence(container, evidence) {
  container.replaceChildren();
  container.hidden = !evidence;
  container.removeAttribute('aria-labelledby');
  if (!evidence) return;
  const title = node('h4', evidence.title);
  title.id = container.id + '-title';
  container.setAttribute('aria-labelledby', title.id);
  const facts = node('dl', undefined, 'learn-question-facts');
  for (const [index, [label, value]] of evidence.rows.entries()) {
    const fact = node('div'), amount = node('dd', value);
    amount.id = container.id + '-value-' + index;
    fact.append(node('dt', label), ' ', amount);
    facts.append(fact);
  }
  container.append(title, facts);
  if (evidence.note) container.append(node('p', evidence.note, 'learn-question-note'));
}
