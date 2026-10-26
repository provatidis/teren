import { liquidityHash, liquidityFromHash } from './liquidity-links.js';
export const rangeHash = input => liquidityHash(input, 'range');
export const rangeFromHash = hash => liquidityFromHash(hash, 'range');
