import { calculateFixedPositionPeriod } from './fixed-position-period.js';

// Fixed liquidity, with fee withdrawals retained as token cash flows. Starting
// claims can include old fees or previously removed principal: subtract them all.
export function calculateCollectionPeriod(start, end, collections) {
  if (!Array.isArray(collections) || collections.length > 32) throw new Error('Unsupported collection count.');
  const growth = calculateFixedPositionPeriod(start, end);
  const count = BigInt(collections.length);
  const result = { ...growth, collectionCount: collections.length };
  for (const token of [0, 1]) {
    const claim = 'claim' + token, available = 'available' + token;
    for (const point of [start, end]) {
      if (typeof point[claim] !== 'bigint' || typeof point[available] !== 'bigint'
        || point[claim] < 0n || point[claim] >= 1n << 128n
        || point[available] < 0n || point[available] > point[claim]) {
        throw new Error('Invalid collection entitlement or simulation.');
      }
    }
    let debited = 0n, paid = 0n;
    for (const collection of collections) {
      const debit = collection['debit' + token], payment = collection['paid' + token];
      if (typeof debit !== 'bigint' || typeof payment !== 'bigint' || debit < 0n
        || debit >= 1n << 128n || payment < 0n || payment > debit) {
        throw new Error('Invalid collected token amount.');
      }
      debited += debit; paid += payment;
    }
    const credited = debited + end[claim] - start[claim];
    const difference = credited - growth['earned' + token];
    // Each real collect floors one accounting interval. The hypothetical start
    // simulation can contribute one rounding carry. Do not round each day afresh.
    if (difference < -count || difference > 1n) {
      throw new Error('Collection accounting disagrees with recorded fee growth.');
    }
    result['growthEarned' + token] = growth['earned' + token];
    result['credited' + token] = credited;
    result['collected' + token] = paid;
    result['collectionRoundingLoss' + token] = debited - paid;
    result['earned' + token] = paid + end[available] - start[available];
    // A one-unit rounding loss may make a zero-growth interval slightly negative.
    // Retain it instead of turning it into invented income.
  }
  return result;
}
