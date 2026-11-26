// Dragging a slider should move its bars with the thumb, without easing behind
// it. Mark the page from the first press on a range input until it is released;
// styles/motion.css eases bars only outside that window.
export function initMotion(root = document.documentElement) {
  const start = event => { if (event.target instanceof HTMLInputElement && event.target.type === 'range') root.dataset.scrubbing = 'true'; };
  const end = () => { delete root.dataset.scrubbing; };
  addEventListener('pointerdown', start, true);
  // Any later release clears the mark, so a missed pointerup cannot leave it set.
  for (const type of ['pointerup', 'pointercancel', 'change']) addEventListener(type, end, true);
}
