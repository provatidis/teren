import { isReplayHash } from '../data/replay-cases.js';
import { isWidthHash } from './width-links.js';

// Stable fragments remain the public entry points for every existing tool.
export function workspaceFromHash(hash) {
  if (isWidthHash(hash)) return 'width';
  if (['#inspect', '#pool-lab', '#position-lab'].includes(hash) || hash.startsWith('#example=')) return 'inspect';
  if (isReplayHash(hash) || hash === '#fee-comparison') return 'replay';
  if (hash === '#swap-sandbox') return 'mechanics';
  return 'experiment';
}
