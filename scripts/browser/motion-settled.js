// Bars ease to a new size after a button or keyboard step. Measure them once
// every running transition and cue has finished.
export const motionSettled = evaluate => evaluate('Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})))');
