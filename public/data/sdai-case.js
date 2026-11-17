import { abiWords } from './abi.js';
import { annualizedApy } from '../models/split-yield-v1.js';

const WAD = 10n ** 18n;
const RAY = 10n ** 27n;
const SECONDS_PER_DAY = 86400;
const ENTRY = 19315170, EXPIRY = 19528924, SETTLEMENT = 19529386;
const DAI = '6b175474e89094c44da98b954eedeac495271d0f';
const LIMIT_ERROR = '0xfc68d09e';
const EVIDENCE_INTEGRITY = 'sha256-qP/ZeIdgq9exvhcVXmjL/YRMKS/1LH4cve8x/ZV0ZtU=';
const toUnits = amount => Number(amount) / Number(WAD);

function word(data, count = 1) {
  return BigInt('0x' + abiWords(data, count)[0]);
}

function check(condition) {
  if (!condition) throw new Error('The sDAI capture does not match its recorded accounting.');
}

export function summarizeSdaiCase(record) {
  const reads = record.reads;
  const read = (key, count = 1) => word(reads[key].result, count);
  const fill = (key, count) => word(record.entry_simulations_raw[key], count);
  const timestamp = block => record.block_headers[block].timestamp;
  function redeem(key, block, shares) {
    const preview = reads[key];
    check(preview.block === block && preview.calldata === '0xcbe52ae3' +
      DAI.padStart(64, '0') + shares.toString(16).padStart(64, '0'));
    return toUnits(word(preview.result));
  }

  // Each strategy starts with a separate simulated purchase at the entry block.
  // Convert its actual output to DAI using a redemption preview at the same closing block.
  function outcomes(budget, block) {
    const suffix = budget === 1000 ? '1000' : '100_' + block;
    const index = read('current_py_index_' + block);
    const pt = fill('pt_' + budget, 3);
    const hold = fill('hold_' + budget, 1);
    const result = {
      pt: redeem('pt_redemption_' + suffix, block, pt * WAD / index),
      hold: redeem('holding_redemption_' + suffix, block, hold),
      yt: null,
    };
    if (budget === 100) {
      const yt = fill('yt_100', 3);
      const gross = yt * (index - entryIndex) * WAD / (index * entryIndex);
      const net = gross - gross * read('claim_fee_' + block) / WAD;
      result.yt = redeem('yt_sale_claim_' + suffix, block, net);
    }
    return result;
  }

  const entryIndex = read('yt_entry_index');
  const expiryTime = Number(read('contract_expiry'));
  const entryTime = timestamp(ENTRY);
  const remaining = expiryTime - entryTime;
  check(record.chain === 1 && timestamp(ENTRY - 1) < expiryTime - 30 * SECONDS_PER_DAY
    && remaining > 0 && remaining <= 30 * SECONDS_PER_DAY);
  check(timestamp(EXPIRY - 1) < expiryTime && timestamp(EXPIRY) >= expiryTime);
  check(read('before_settlement', 2) === 0n && read('settlement', 2) === read('current_py_index_' + SETTLEMENT));
  const capInSy = read('last_feasible_at_micro_yt_precision', 6);
  check(reads.next_micro_yt_reverts.revert.startsWith(LIMIT_ERROR)
    && reads.yt_default_approximation_1000.revert.startsWith(LIMIT_ERROR)
    && capInSy < fill('hold_1000', 1));

  const original = outcomes(1000, SETTLEMENT);
  const small = outcomes(100, SETTLEMENT);
  const atExpiry = outcomes(100, EXPIRY);
  const periodGrowth = atExpiry.hold / 100 - 1;
  const feePercent = toUnits(read('yt_fee_at_claim')) * 100;
  const ytUnits = toUnits(fill('yt_100', 3));
  // Subtract one in ray precision before converting Maker's tiny per-second rate.
  const entryGrowthPerSecond = Number(read('maker_rate_' + ENTRY) - RAY) / Number(RAY);
  const changedGrowthPerSecond = Number(read('dsr_after_change') - RAY) / Number(RAY);
  const spotPt = toUnits(read('marginal_pt_reference'));
  return {
    entrySavingsApy: annualizedApy(entryGrowthPerSecond, 1 / SECONDS_PER_DAY),
    entryImpliedApy: annualizedApy(1 / spotPt - 1, remaining / SECONDS_PER_DAY),
    changedSavingsApy: annualizedApy(changedGrowthPerSecond, 1 / SECONDS_PER_DAY),
    maximumYtDai: redeem('maximum_single_pool_YT_cost_in_DAI', ENTRY, capInSy),
    feePercent, ytUnits, original, small,
    flatYtDai: ytUnits * Math.expm1(Math.log1p(entryGrowthPerSecond) * remaining) * (1 - feePercent / 100),
    expiryYtDai: atExpiry.yt,
    periodYieldPercent: periodGrowth * 100,
    annualizedYieldPercent: annualizedApy(periodGrowth, (timestamp(EXPIRY) - entryTime) / SECONDS_PER_DAY),
    settlementDelaySeconds: timestamp(SETTLEMENT) - expiryTime,
  };
}

export async function loadSdaiCase() {
  const url = new URL('../examples/pendle-sdai-march-2024.json', import.meta.url);
  const response = await fetch(url, { integrity: EVIDENCE_INTEGRITY });
  if (!response.ok) throw new Error('Could not load the recorded sDAI case.');
  return summarizeSdaiCase(await response.json());
}
