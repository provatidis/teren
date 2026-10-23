import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePositionPeriod } from '../public/data/position-period.js';

const report = { checkedAt: new Date().toISOString(), cases: [] };
const temporary = await mkdtemp(join(tmpdir(), 'teren-record-check-'));
const checker = fileURLToPath(new URL('./check-replay.js', import.meta.url));
const canonicalPoints = record => record.points.map(point => {
  const { provider, capturedAt, ...state } = point.snapshot;
  return { snapshot: state, secondsInside: point.secondsInside, simulatedCollect: point.simulatedCollect };
});
try {
  for (const file of ['uniswap-v3-position-period.json', 'uniswap-v3-position-range-return.json']) {
    const saved = validatePositionPeriod(JSON.parse(await readFile(new URL('../public/examples/' + file, import.meta.url), 'utf8')));
    const first = saved.points[0].snapshot, last = saved.points.at(-1).snapshot;
    const output = join(temporary, file);
    const entry = { file, tokenId: first.tokenId, blocks: [first.block.number, last.block.number], checkpoints: saved.points.length };
    try {
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [checker, first.tokenId, first.block.number, last.block.number, output, String(saved.points.length)], { stdio: 'inherit' });
        child.on('error', reject);
        child.on('exit', code => code === 0 ? resolve() : reject(new Error('Historical capture exited with code ' + code)));
      });
      const fresh = validatePositionPeriod(JSON.parse(await readFile(output, 'utf8')));
      assert.deepEqual(canonicalPoints(fresh), canonicalPoints(saved), 'Fresh chain evidence differs from the bundled record.');
      entry.matched = true;
      entry.stateProvider = fresh.points[0].snapshot.provider;
      entry.eventProvider = fresh.eventQueries[0].provider;
    } catch (error) {
      entry.matched = false;
      entry.error = error.message;
    }
    report.cases.push(entry);
  }
} finally {
  await writeFile(process.env.REPLAY_REPORT || 'record-verification.json', JSON.stringify(report, null, 2) + '\n');
  await rm(temporary, { recursive: true, force: true });
}
if (report.cases.length !== 2 || report.cases.some(item => !item.matched)) process.exitCode = 1;
