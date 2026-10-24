import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../scripts/lib/build-site.js';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'teren-build-'));
  const sourceRoot = join(root, 'source'), outputRoot = join(root, 'output');
  await mkdir(join(sourceRoot, 'lib'), { recursive: true });
  await mkdir(join(sourceRoot, 'styles'), { recursive: true });
  await writeFile(join(sourceRoot, 'main.js'), "import { value } from './lib/value.js';\nexport { value };\n");
  await writeFile(join(sourceRoot, 'lib/value.js'), 'export const value = 1;\n');
  await writeFile(join(sourceRoot, 'styles.css'), '@import url("./styles/base.css");\n');
  await writeFile(join(sourceRoot, 'styles/base.css'), 'body { color: red; }\n');
  await writeFile(join(sourceRoot, 'index.html'), '<head><link rel="stylesheet" href="styles.css"><script type="module" src="main.js"></script></head>');
  await writeFile(join(sourceRoot, '404.html'), '<head><link rel="stylesheet" href="/styles.css"></head>');
  await writeFile(join(sourceRoot, 'CNAME'), 'teren.sh\n');
  try { await run({ sourceRoot, outputRoot, version: 'test' }); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test('build hashes every dependency, preserves module directories and preloads the entry graph', async () => fixture(async options => {
  const manifest = await buildSite(options);
  const html = await readFile(join(options.outputRoot, 'index.html'), 'utf8');
  const entry = await readFile(join(options.outputRoot, manifest.assets['main.js']), 'utf8');
  assert.ok(html.includes(manifest.assets['main.js']));
  assert.ok(html.includes('rel="modulepreload" href="./' + manifest.assets['lib/value.js'] + '"'));
  assert.ok(entry.includes('./' + manifest.assets['lib/value.js']));
  const css = await readFile(join(options.outputRoot, manifest.assets['styles.css']), 'utf8');
  assert.ok(css.includes('body { color: red; }'));
  assert.doesNotMatch(css, /@import/);
  assert.ok((await readFile(join(options.outputRoot, '404.html'), 'utf8')).includes('href="/' + manifest.assets['styles.css'] + '"'));
  assert.equal(await readFile(join(options.outputRoot, 'CNAME'), 'utf8'), 'teren.sh\n');
  assert.equal(await readFile(join(options.outputRoot, 'main.js'), 'utf8'), await readFile(join(options.sourceRoot, 'main.js'), 'utf8'), 'Canonical aliases support previously cached page entries.');
}));

test('CSS bundles preserve cascade order, rebase nested URLs and propagate hashes', async () => fixture(async options => {
  await mkdir(join(options.sourceRoot, 'assets'));
  await mkdir(join(options.sourceRoot, 'styles/nested'));
  await writeFile(join(options.sourceRoot, 'assets/mark.svg'), '<svg/>');
  await writeFile(join(options.sourceRoot, 'styles/nested/detail.css'), '.detail{background:url("../../assets/mark.svg#shape")}');
  await writeFile(join(options.sourceRoot, 'styles/base.css'), '@import url("./nested/detail.css");\nbody{color:red}');
  await writeFile(join(options.sourceRoot, 'styles.css'), '@import url("./styles/base.css");\nbody{color:blue}');
  const first = await buildSite(options);
  const css = await readFile(join(options.outputRoot, first.assets['styles.css']), 'utf8');
  assert.doesNotMatch(css, /@import/);
  assert.match(css, /url\("\.\/assets\/mark.svg#shape"\)/);
  assert.ok(css.indexOf('color:red') < css.indexOf('color:blue'));
  await writeFile(join(options.sourceRoot, 'styles/nested/detail.css'), '.detail{color:green}');
  const second = await buildSite(options);
  assert.notEqual(first.assets['styles.css'], second.assets['styles.css']);
  assert.notEqual(first.assets['styles/base.css'], second.assets['styles/base.css']);
  await writeFile(join(options.sourceRoot, 'styles.css'), '@import url("./styles/base.css") print;');
  await assert.rejects(buildSite(options), /Unsupported CSS import/);
  assert.ok((await readFile(join(options.outputRoot, 'index.html'), 'utf8')).includes(second.assets['styles.css']));
}));

test('build is deterministic and a dependency change invalidates its parents', async () => fixture(async options => {
  const first = await buildSite(options);
  assert.deepEqual(await buildSite(options), first);
  await writeFile(join(options.sourceRoot, 'lib/value.js'), 'export const value = 2;\n');
  const second = await buildSite(options);
  assert.notEqual(second.assets['lib/value.js'], first.assets['lib/value.js']);
  assert.notEqual(second.assets['main.js'], first.assets['main.js']);
  assert.equal(second.assets['styles.css'], first.assets['styles.css']);
}));

test('shared dependencies have one hashed identity across entry points', async () => fixture(async options => {
  await writeFile(join(options.sourceRoot, 'other.js'), "export { value } from './lib/value.js';\n");
  const manifest = await buildSite(options);
  for (const entry of ['main.js', 'other.js']) {
    assert.ok((await readFile(join(options.outputRoot, manifest.assets[entry]), 'utf8')).includes('./' + manifest.assets['lib/value.js']));
  }
}));

test('build rejects cycles and missing imports before deleting the last good build', async () => fixture(async options => {
  const good = await buildSite(options);
  await writeFile(join(options.sourceRoot, 'lib/value.js'), "export { value } from '../main.js';\n");
  await assert.rejects(buildSite(options), /Circular build dependency/);
  assert.ok((await readFile(join(options.outputRoot, 'index.html'), 'utf8')).includes(good.assets['main.js']));
  await writeFile(join(options.sourceRoot, 'lib/value.js'), "export { value } from './missing.js';\n");
  await assert.rejects(buildSite(options), /Missing local asset/);
  await assert.rejects(buildSite({ ...options, outputRoot: options.sourceRoot }), /must be separate/);
}));
