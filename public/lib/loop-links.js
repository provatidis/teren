import { LOOP_MODEL, LOOP_LIMITS, validateLoop } from '../models/borrowing-loop-v1.js';
import { validReferenceRounds } from '../models/loop-comparison.js';

export function loopHash(input, comparisonRounds = null) {
  if (Object.keys(validateLoop(input)).length) throw new RangeError('Use a valid loop setup.');
  if (comparisonRounds !== null && !validReferenceRounds(comparisonRounds)) throw new RangeError('Choose a reference from 0 to 5 rounds.');
  const params = new URLSearchParams({ loop: LOOP_MODEL });
  for (const key of [...Object.keys(LOOP_LIMITS), 'interestMode']) params.set(key, String(input[key]));
  if (comparisonRounds !== null) params.set('compare', String(comparisonRounds));
  return '#' + params;
}

export function readLoopHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!params.has('loop')) return { status: 'none' };
  const keys = [...Object.keys(LOOP_LIMITS), 'interestMode'];
  if (hash.length > 2000 || params.get('loop') !== LOOP_MODEL ||
    [...params.keys()].some(key => !['loop', 'compare', ...keys].includes(key) || params.getAll(key).length !== 1) ||
    keys.some(key => !params.get(key)?.trim())) return { status: 'invalid' };
  if (params.has('compare') && !/^[0-5]$/.test(params.get('compare'))) return { status: 'invalid' };
  const comparisonRounds = params.has('compare') ? Number(params.get('compare')) : null;
  const input = Object.fromEntries(keys.map(key => [key, key === 'interestMode' ? params.get(key) : Number(params.get(key))]));
  return Object.keys(validateLoop(input)).length ? { status: 'invalid' } : { status: 'ready', input, comparisonRounds };
}

export function loopLessonFromHash(hash) {
  return /^#loop-lesson=(build|stress|unwind)$/.exec(hash)?.[1] || null;
}
