import { validatePositionPeriod, canonicalPeriodPoint, periodValidation } from './position-period.js';

export const HISTORY_MAX_SEGMENTS = 8;
export const HISTORY_MAX_POINTS = 64;
export const REPLAY_MAX_BYTES = 524288;

function joinSegments(segments) {
  const points = [];
  for (const segment of segments) {
    if (points.length) {
      const previous = canonicalPeriodPoint(points.at(-1));
      const next = canonicalPeriodPoint(segment.points[0]);
      if (JSON.stringify(previous) !== JSON.stringify(next)) {
        throw new Error('Historical segments must share one identical boundary checkpoint.');
      }
    }
    points.push(...segment.points.slice(points.length ? 1 : 0));
    if (points.length > HISTORY_MAX_POINTS) throw new Error('Too many composed historical checkpoints.');
  }
  return points;
}

export function validatePositionHistory(input) {
  if (input?.version !== 1 || input.kind !== 'fixed-position-history' || input.chainId !== 1) {
    throw new Error('Unsupported composed historical case.');
  }
  if (!Array.isArray(input.segments) || input.segments.length < 2 || input.segments.length > HISTORY_MAX_SEGMENTS) {
    throw new Error('Choose two to eight bounded historical segments.');
  }
  // Keep the original span, checkpoint and event-query limits on every segment.
  const segments = input.segments.map(validatePositionPeriod);
  if (segments.some(segment => segment.id !== input.id)) throw new Error('Historical segment position IDs differ.');
  const points = joinSegments(segments);
  const validation = periodValidation(points);
  if (JSON.stringify(input.validation) !== JSON.stringify(validation)) {
    throw new Error('The composed historical validation summary differs.');
  }
  const captured = typeof input.capturedAt === 'string' ? Date.parse(input.capturedAt) : NaN;
  if (!Number.isFinite(captured) || segments.some(segment => Date.parse(segment.capturedAt) > captured)) {
    throw new Error('Invalid composed historical capture time.');
  }
  return { version: 1, kind: input.kind, id: input.id, chainId: 1, segments, validation, capturedAt: input.capturedAt };
}

export function composePositionHistory(inputs, capturedAt = new Date().toISOString()) {
  if (!Array.isArray(inputs) || inputs.length < 2 || inputs.length > HISTORY_MAX_SEGMENTS) {
    throw new Error('Choose two to eight bounded historical segments.');
  }
  const segments = inputs.map(validatePositionPeriod);
  const points = joinSegments(segments);
  return validatePositionHistory({
    version: 1, kind: 'fixed-position-history', id: segments[0].id, chainId: 1,
    segments, validation: periodValidation(points), capturedAt,
  });
}

export function validateRecordedCase(input) {
  return input?.kind === 'fixed-position-history' ? validatePositionHistory(input) : validatePositionPeriod(input);
}

// The viewer receives one continuous sequence; export retains every original
// segment and its checks. Never sum the independently floored segment fees.
export function recordedPeriod(record) {
  if (record.kind !== 'fixed-position-history') return record;
  return {
    id: record.id, points: joinSegments(record.segments),
    eventQueries: record.segments.flatMap(segment => segment.eventQueries),
    validation: record.validation, capturedAt: record.capturedAt,
  };
}
