import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildSite } from './lib/build-site.js';

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const result = await buildSite({
  sourceRoot: fileURLToPath(new URL('../public/', import.meta.url)),
  outputRoot: fileURLToPath(new URL('../dist/', import.meta.url)),
  version,
});
console.log('Built Teren ' + version + ': ' + Object.keys(result.assets).length + ' content-hashed assets and transitive module preloads.');
