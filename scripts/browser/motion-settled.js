// Bars ease to a new size after a button or keyboard step. Measure them once
// every running transition and cue has finished.
export const motionSettled = evaluate => evaluate('Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})))');

// Easing that began before the switch keeps running to its end. Let it finish
// first, so a reduced-motion check counts only what starts afterwards.
export async function reduceMotion({ call, evaluate }) {
  await motionSettled(evaluate);
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
}
