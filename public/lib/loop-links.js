import { LOOP_MODEL, LOOP_LIMITS, validateLoop } from '../models/borrowing-loop-v1.js';

export function loopHash(input) {
  if (Object.keys(validateLoop(input)).length) throw new RangeError('Use a valid loop setup.');
  const params = new URLSearchParams({ loop: LOOP_MODEL });
  for (const key of [...Object.keys(LOOP_LIMITS), 'interestMode']) params.set(key, String(input[key]));
  return '#' + params;
}

export function readLoopHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (!params.has('loop')) return { status: 'none' };
  const keys = [...Object.keys(LOOP_LIMITS), 'interestMode'];
  if (hash.length > 2000 || params.get('loop') !== LOOP_MODEL ||
    [...params.keys()].some(key => !['loop', ...keys].includes(key) || params.getAll(key).length !== 1) ||
    keys.some(key => !params.get(key)?.trim())) return { status: 'invalid' };
  const input = Object.fromEntries(keys.map(key => [key, key === 'interestMode' ? params.get(key) : Number(params.get(key))]));
  return Object.keys(validateLoop(input)).length ? { status: 'invalid' } : { status: 'ready', input };
}

export function loopLessonFromHash(hash) {
  return /^#loop-lesson=(build|stress|unwind)$/.exec(hash)?.[1] || null;
}
