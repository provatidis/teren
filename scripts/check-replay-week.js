import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRpcClient } from '../public/data/rpc.js';
import { confirmBlock, finalizedBlock } from '../public/data/block.js';
import { composePositionHistory } from '../public/data/position-history.js';
import { validateWeekSelection, validateWeekSegment } from './lib/week-selection.js';

const planBytes = await readFile(new URL('./replay-week-plan.json', import.meta.url), 'utf8');
const plan = JSON.parse(planBytes);
const selectionPath = process.argv[2] || fileURLToPath(new URL('../docs/evidence/week-selection.json', import.meta.url));
const selection = JSON.parse(await readFile(selectionPath, 'utf8'));
const { tokenId, blocks } = validateWeekSelection(selection, plan, createHash('sha256').update(planBytes).digest('hex'));
const output = resolve(process.argv[3] || 'week-replay.json');
const cache = resolve(process.argv[4] || '.replay-week-cache');
const checker = fileURLToPath(new URL('./check-replay.js', import.meta.url));
const state = createRpcClient({ endpoint: process.env.REPLAY_RPC || 'https://eth.drpc.org', serial: true });
const events = createRpcClient({ endpoint: process.env.REPLAY_LOG_RPC || 'https://rpc.mevblocker.io', serial: true });
const tag = block => '0x' + BigInt(block.number).toString(16);
const latest = (await finalizedBlock(state)).block;
assert.ok(BigInt(blocks.at(-1).number) <= BigInt(latest.number), 'The whole period must be finalized.');

// Reconfirm the daily date boundaries, including their immediate predecessors.
// Metadata in a saved selection report is not fresh chain authentication.
for (const entry of selection.boundaries) {
  await confirmBlock(state, tag(entry.previousBlock), entry.previousBlock);
  await confirmBlock(state, tag(entry.block), entry.block);
  await confirmBlock(events, tag(entry.block), entry.block);
}
await mkdir(cache, { recursive: true });
const segments = [];
for (let index = 0; index < blocks.length - 1; index++) {
  const start = blocks[index], end = blocks[index + 1];
  const file = join(cache, 'position-' + tokenId + '-' + start.number + '-' + end.number + '.json');
  let saved;
  try { saved = await readFile(file, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (saved === undefined) {
    console.log('Capturing daily segment ' + (index + 1) + ' of 7.');
    await new Promise((resolveCapture, reject) => {
      const child = spawn(process.execPath, [checker, tokenId, start.number, end.number, file, '2'], { stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolveCapture() : reject(new Error('Daily capture failed with code ' + code + '. Verified earlier segments remain cached.')));
    });
    saved = await readFile(file, 'utf8');
  } else console.log('Validating cached daily segment ' + (index + 1) + ' of 7.');
  assert.ok(saved.length <= 131072, 'Cached daily segment is too large.');
  try { segments.push(validateWeekSegment(JSON.parse(saved), tokenId, start, end)); }
  catch (error) { throw new Error('Invalid cached segment ' + file + ': ' + error.message + ' Keep it for diagnosis and recapture into a fresh cache.'); }
}
// Recheck the shared identities after capture, then validate all global prefixes.
for (const block of blocks) {
  await confirmBlock(state, tag(block), block);
  await confirmBlock(events, tag(block), block);
}
const history = composePositionHistory(segments);
await mkdir(dirname(output), { recursive: true });
const temporary = output + '.pending';
await writeFile(temporary, JSON.stringify(history, null, 2) + '\n');
await rename(temporary, output);
console.log(JSON.stringify({ tokenId, segments: segments.length, validation: history.validation, output }, null, 2));
