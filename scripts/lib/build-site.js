import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, relative, posix } from 'node:path';

const moduleImports = /((?:import|export)\s+[^;]*?\sfrom\s*['"])([^'"]+)(['"])/g;
const cssImports = /(@import\s+url\(["'])([^"']+)(["']\)\s*;?)/g;
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 16);

async function filesIn(root, prefix = '') {
  const entries = await readdir(resolve(root, prefix), { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => {
    const name = posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Build sources must not contain symlinks: ' + name);
    return entry.isDirectory() ? filesIn(root, name) : [name];
  }));
  return groups.flat().sort();
}

async function replaceAsync(source, pattern, transform) {
  const matches = [...source.matchAll(pattern)];
  const replacements = await Promise.all(matches.map(transform));
  for (let index = matches.length - 1; index >= 0; index--) {
    const match = matches[index];
    source = source.slice(0, match.index) + replacements[index] + source.slice(match.index + match[0].length);
  }
  return source;
}

export async function buildSite({ sourceRoot, outputRoot, version }) {
  sourceRoot = resolve(sourceRoot);
  outputRoot = resolve(outputRoot);
  for (const [parent, child] of [[sourceRoot, outputRoot], [outputRoot, sourceRoot]]) {
    const path = relative(parent, child);
    if (!path || (!path.startsWith('..') && !path.startsWith('/'))) throw new Error('Source and output directories must be separate.');
  }
  const files = await filesIn(sourceRoot);
  const known = new Set(files);
  const assets = new Map();
  const dependencies = new Map();
  const targetFor = (owner, specifier) => {
    const plain = specifier.split(/[?#]/)[0];
    const target = plain.startsWith('/') ? plain.slice(1) : posix.normalize(posix.join(posix.dirname(owner), plain));
    if (target.startsWith('../') || !known.has(target)) throw new Error('Missing local asset: ' + owner + ' → ' + specifier);
    return target;
  };
  const relativeAsset = (owner, target, absolute = false) => {
    if (absolute) return '/' + target;
    const path = posix.relative(posix.dirname(owner), target);
    return path.startsWith('.') ? path : './' + path;
  };
  async function asset(name, ancestry = []) {
    if (ancestry.includes(name)) throw new Error('Circular build dependency: ' + [...ancestry, name].join(' → '));
    if (assets.has(name)) return assets.get(name);
    const operation = (async () => {
      let source = await readFile(resolve(sourceRoot, name), 'utf8');
      const imports = [];
      if (name.endsWith('.js') && /\bimport\s*\(/.test(source)) throw new Error('Dynamic imports require explicit build support: ' + name);
      source = await replaceAsync(source, name.endsWith('.js') ? moduleImports : cssImports, async match => {
        const target = targetFor(name, match[2]);
        imports.push(target);
        const built = await asset(target, [...ancestry, name]);
        return match[1] + relativeAsset(name, built.name, match[2].startsWith('/')) + match[3];
      });
      dependencies.set(name, imports);
      const extension = posix.extname(name);
      const outputName = name.slice(0, -extension.length) + '.' + digest(source) + extension;
      return { name: outputName, source };
    })();
    assets.set(name, operation);
    return operation;
  }
  // Resolve the graph before clearing output. Bad input must not erase an existing build.
  for (const name of files.filter(name => /\.(js|css)$/.test(name))) await asset(name);
  await rm(outputRoot, { recursive: true, force: true });
  await cp(sourceRoot, outputRoot, { recursive: true });
  for (const result of await Promise.all(assets.values())) {
    await mkdir(resolve(outputRoot, posix.dirname(result.name)), { recursive: true });
    await writeFile(resolve(outputRoot, result.name), result.source);
  }
  for (const name of files.filter(name => name.endsWith('.html'))) {
    let source = await readFile(resolve(sourceRoot, name), 'utf8');
    const entries = [];
    source = await replaceAsync(source, /<(?:script|link)\b[^>]*>/g, async match => {
      const tag = match[0];
      const path = tag.match(/(?:src|href)="([^"]+)"/)?.[1];
      if (!path || /^(?:[a-z]+:|#)/i.test(path) || !/\.(?:js|css)(?:\?|$)/.test(path)) return tag;
      const target = targetFor(name, path);
      const built = await assets.get(target);
      if (!built) throw new Error('Asset was not compiled: ' + target);
      if (tag.startsWith('<script') && tag.includes('type="module"')) entries.push(target);
      return tag.replace(path, relativeAsset(name, built.name, path.startsWith('/')));
    });
    const preload = new Set();
    function visit(name) {
      for (const child of dependencies.get(name) || []) {
        if (preload.has(child)) continue;
        preload.add(child); visit(child);
      }
    }
    entries.forEach(visit);
    const hints = await Promise.all([...preload].sort().map(async item => {
      const built = await assets.get(item);
      return '    <link rel="modulepreload" href="' + relativeAsset(name, built.name) + '">';
    }));
    source = source.replace('</head>', hints.join('\n') + '\n  </head>');
    await writeFile(resolve(outputRoot, name), source);
  }
  const mapping = Object.fromEntries(await Promise.all([...assets].map(async ([source, promise]) => [source, (await promise).name])));
  const manifest = { version, assets: mapping };
  await writeFile(resolve(outputRoot, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
