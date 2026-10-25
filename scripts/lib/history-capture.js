import { createRpcClient } from '../../public/data/rpc.js';
import { fetchPositionSnapshot } from '../../public/data/uniswap-v3.js';
import { confirmBlock } from '../../public/data/block.js';
import { abiWords, encodeInt, encodeUint, encodeWord, uintFromWord, decodeAddress } from '../../public/data/abi.js';
import { V3 } from '../../public/data/config.js';

export const blockTag = block => '0x' + BigInt(block.number ?? block).toString(16);
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function captureClient(endpoint) {
  const base = createRpcClient({ endpoint });
  let queue = Promise.resolve();
  const rpc = (method, params = []) => {
    const task = queue.then(async () => {
      await sleep(180);
      for (let attempt = 0; ; attempt++) {
        try { return await base(method, params); }
        catch (error) {
          if (!error.retryable || attempt === 3) throw error;
          await sleep(1000 * 2 ** attempt);
        }
      }
    });
    // A missing NFT is an expected qualification result; later reads can continue.
    queue = task.catch(() => {});
    return task;
  };
  Object.defineProperty(rpc, 'provider', { value: endpoint });
  return rpc;
}

export async function capturePoint(tokenId, number, rpc) {
  const tag = blockTag(number);
  const pinned = (method, params = []) => rpc(method,
    method === 'eth_getBlockByNumber' && params[0] === 'finalized' ? [tag, false] : params);
  Object.defineProperty(pinned, 'provider', { value: rpc.provider });
  const snapshot = await fetchPositionSnapshot(tokenId, { rpc: pinned });
  const p = snapshot.position;
  const counters = await rpc('eth_call', [{ to: snapshot.poolAddress,
    data: '0xa38807f2' + encodeInt(p.tickLower) + encodeInt(p.tickUpper) }, tag]);
  const secondsInside = uintFromWord(abiWords(counters, 3)[2], 32).toString();
  const owner = decodeAddress(await rpc('eth_call', [{ to: V3.positionManager, data: '0x6352211e' + encodeUint(tokenId) }, tag]));
  const maximum = (1n << 128n) - 1n;
  const data = '0xfc6f7865' + encodeUint(tokenId) + encodeWord(V3.positionManager) + encodeUint(maximum) + encodeUint(maximum);
  const simulatedCollect = abiWords(await rpc('eth_call', [{ to: V3.positionManager, from: owner, data }, tag]), 2)
    .map(word => uintFromWord(word).toString());
  await confirmBlock(rpc, tag, snapshot.block);
  return { snapshot, secondsInside, simulatedCollect };
}
