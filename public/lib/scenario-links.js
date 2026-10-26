import { liquidityHash, liquidityFromHash } from './liquidity-links.js';
export const scenarioHash = input => liquidityHash(input, 'full');
export const scenarioFromHash = hash => liquidityFromHash(hash, 'full');
