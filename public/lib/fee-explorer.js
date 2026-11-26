import { createSceneExplorer } from './lesson-scene.js';
import { usd } from './format.js';

// A fee slider that can land exactly on a goal amount, such as the fees that
// match holding. A dragged thumb settles on the goal when it is within reach,
// and a single arrow step stops on it when it would cross. Shortcut and saved
// amounts are never adjusted.
export function createFeeExplorer({ id, max, start, target, labelText, shortcuts, scopeText = () => '', goal, onChange }) {
  const snapRange = max * .025;
  let fromSlider = false, pointer = false, last = start;
  function chosen(value) {
    if (!fromSlider) return value;
    const amount = goal();
    if (pointer) return Math.abs(value - amount) <= snapRange ? amount : value;
    // Home, End and page keys travel on; only a single arrow step stops here.
    const arrowStep = Math.abs(value - last) <= max * .011;
    return arrowStep && ((last < amount && value >= amount) || (last > amount && value <= amount)) ? amount : value;
  }
  const explorer = createSceneExplorer({
    id, min: 0, max, step: 'any', start, target, format: value => usd(chosen(value)),
    labelText, valueText: value => usd(chosen(value)) + ' in fees', scopeText, shortcuts,
    onChange(value) { last = chosen(value); fromSlider = false; return onChange(last); },
  });
  const slider = explorer.element.querySelector('input');
  explorer.element.addEventListener('input', () => { fromSlider = true; }, true);
  slider.addEventListener('pointerdown', () => { pointer = true; });
  const settle = () => { pointer = false; };
  slider.addEventListener('pointerup', settle); slider.addEventListener('pointercancel', settle);
  // On release, rest the thumb on the amount in use.
  slider.addEventListener('change', () => { settle(); explorer.show(last); });
  return explorer;
}
