import { RpcError } from '../../public/data/rpc.js';
import { validateProvider } from '../../public/data/provenance.js';

// Development capture only. The browser's RPC allowlist remains unchanged.
export async function readReplayEvents(endpoint, filter, {
  fetchImpl = globalThis.fetch, retryDelayMs = 1000, onRetry = () => {},
} = {}) {
  validateProvider(endpoint);
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getLogs', params: [filter] }),
      });
      if (!response.ok) throw new RpcError('Historical event HTTP ' + response.status + '.', {
        retryable: [408, 429].includes(response.status) || response.status >= 500,
      });
      const text = await response.text();
      if (text.length > 1000000) throw new Error('Oversized historical event response.');
      let reply;
      try { reply = JSON.parse(text); } catch { throw new Error('Invalid historical event JSON.'); }
      if (reply?.jsonrpc !== '2.0' || reply.id !== 1) throw new Error('Invalid historical event envelope.');
      if (reply.error) throw new RpcError('Historical event RPC failed: ' + (reply.error.message || reply.error.code), {
        retryable: reply.error.code === -32005 || /rate.?limit|too many requests|temporarily unavailable/i.test(reply.error.message || ''),
      });
      if (!Array.isArray(reply.result)) throw new Error('Invalid historical event result.');
      return reply.result;
    } catch (error) {
      const temporary = error.retryable || error instanceof TypeError || ['AbortError', 'TimeoutError'].includes(error.name);
      if (!temporary || attempt >= 3) throw error;
      onRetry(attempt + 1);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * 2 ** attempt));
    }
  }
}
