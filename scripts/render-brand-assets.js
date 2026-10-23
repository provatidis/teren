// Optional maintainer tool. Uses Sharp to rasterize committed SVG sources;
// the static website build has no application dependencies.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { calculateRange } from '../public/models/cl-range-v1.js';

const { default: sharp } = await import(process.env.SHARP_MODULE || 'sharp');
const root = new URL('../public/', import.meta.url);
const logo = await readFile(new URL('assets/teren-logo.svg', root), 'utf8');
const mark = await readFile(new URL('assets/teren-mark.svg', root), 'utf8');
const wordmark = logo.match(/<g\b[\s\S]*<\/g>/)?.[0];
const symbol = mark.match(/<g\b[\s\S]*<\/g>/)?.[0];
if (!wordmark || !symbol) throw new Error('The wordmark and symbol must contain vector groups.');
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <title>Teren</title>
  <rect width="64" height="64" rx="16" fill="#082b49"/>
  <g id="teren-mark" transform="translate(6.4 6.4) scale(.8)">${symbol.replaceAll('#082b49', '#f6f4ee')}</g>
</svg>\n`;
await writeFile(new URL('favicon.svg', root), favicon);
await writeFile(new URL('assets/teren-logo-ink.svg', root), logo.replaceAll('#f6f4ee', '#082b49'));

// The social illustration uses the same hypothetical, fee-free range model as the lab.
const chart = { left: 784, right: 1118, top: 269, bottom: 433 };
const x = price => chart.left + (price - 1000) / 2000 * (chart.right - chart.left);
const y = value => chart.bottom - value / 16000 * (chart.bottom - chart.top);
const samples = Array.from({ length: 81 }, (_, index) => {
  const futurePrice = 1000 + index * 25;
  return { futurePrice, ...calculateRange({ investment: 10000, initialPrice: 2000, futurePrice, lowerPrice: 1800, upperPrice: 2200, fees: 0, fullRangeFees: 0 }) };
});
const line = key => samples.map((sample, index) => `${index ? 'L' : 'M'}${x(sample.futurePrice).toFixed(2)},${y(sample[key]).toFixed(2)}`).join('');
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <title>Teren · Look closely</title>
  <desc>Learn and experiment with DeFi liquidity and lending. The illustration compares a hypothetical range position with holding its starting tokens.</desc>
  <rect width="1200" height="630" fill="#f6f4ee"/>
  <g transform="translate(64 62) scale(.62)">${wordmark.replaceAll('#f6f4ee', '#082b49')}</g>
  <g font-family="Arial, Helvetica, sans-serif" fill="#082b49">
    <text x="64" y="278" font-size="83" font-weight="700" letter-spacing="-3">Look closely.</text>
    <text x="68" y="343" font-size="28">Understand DeFi through</text>
    <text x="68" y="384" font-size="28">lessons and experiments.</text>
    <text x="68" y="422" font-size="21" fill="#496173">Liquidity · Lending</text>
    <text x="68" y="458" font-size="18" fill="#496173">Learn · Experiment · Inspect</text>
    <rect x="754" y="172" width="394" height="332" rx="18" fill="#e8eef0" stroke="#9aaebc"/>
    <text x="784" y="209" font-size="15" font-weight="700" letter-spacing=".8">HYPOTHETICAL RANGE</text>
    <text x="784" y="239" font-size="17" fill="#496173">$1,800–$2,200 · No fees</text>
    <rect x="${x(1800)}" y="269" width="${x(2200)-x(1800)}" height="164" fill="#c8dbd4"/>
    <path d="M784 280H1118M784 330H1118M784 380H1118M784 433H1118" fill="none" stroke="#b8c7d0"/>
    <path d="${line('holdValue')}" fill="none" stroke="#082b49" stroke-width="3" stroke-dasharray="7 6"/>
    <path d="${line('lpValue')}" fill="none" stroke="#276e5d" stroke-width="4"/>
    <g font-size="13" fill="#496173"><text x="784" y="453">$1,000</text><text x="951" y="453" text-anchor="middle">ETH price</text><text x="1118" y="453" text-anchor="end">$3,000</text></g>
    <path d="M784 480h22" stroke="#276e5d" stroke-width="4"/><text x="816" y="485" font-size="15">Range LP</text>
    <path d="M961 480h22" stroke="#082b49" stroke-width="3" stroke-dasharray="6 4"/><text x="993" y="485" font-size="15">Holding</text>
    <text x="68" y="563" font-size="17" fill="#496173">Read-only · No wallet connection</text>
    <text x="1148" y="563" text-anchor="end" font-size="22">teren.sh</text>
  </g>
</svg>\n`;
await writeFile(new URL('assets/social-preview.svg', root), social);
// Keep the whole mark inside the central maskable-icon safe area.
const opaque = favicon.replace('rx="16"', 'rx="0"');
await mkdir(new URL('assets/', root), { recursive: true });
for (const [name, size] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]) {
  await sharp(Buffer.from(opaque)).resize(size,size).png().toFile(fileURLToPath(new URL('assets/' + name, root)));
}
const sizes = [16,32,48];
const frames = [];
for (const size of sizes) {
  const rgba = await sharp(Buffer.from(favicon)).resize(size,size).ensureAlpha().raw().toBuffer();
  const pixels = Buffer.alloc(size*size*4);
  const maskStride = Math.ceil(size/32)*4;
  const mask = Buffer.alloc(maskStride*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const source=(y*size+x)*4;
    const target=((size-1-y)*size+x)*4;
    pixels[target]=rgba[source+2];pixels[target+1]=rgba[source+1];pixels[target+2]=rgba[source];pixels[target+3]=rgba[source+3];
    if(rgba[source+3]===0)mask[(size-1-y)*maskStride+(x>>3)]|=1<<(7-(x%8));
  }
  const bitmap=Buffer.alloc(40);
  bitmap.writeUInt32LE(40,0);bitmap.writeInt32LE(size,4);bitmap.writeInt32LE(size*2,8);
  bitmap.writeUInt16LE(1,12);bitmap.writeUInt16LE(32,14);bitmap.writeUInt32LE(pixels.length+mask.length,20);
  frames.push(Buffer.concat([bitmap,pixels,mask]));
}
const directory=Buffer.alloc(6+sizes.length*16);
directory.writeUInt16LE(1,2);directory.writeUInt16LE(sizes.length,4);
let offset=directory.length;
for(const [index,size] of sizes.entries()){
  const entry=6+index*16;
  directory[entry]=size;directory[entry+1]=size;
  directory.writeUInt16LE(1,entry+4);directory.writeUInt16LE(32,entry+6);
  directory.writeUInt32LE(frames[index].length,entry+8);directory.writeUInt32LE(offset,entry+12);
  offset+=frames[index].length;
}
await writeFile(new URL('favicon.ico',root),Buffer.concat([directory,...frames]));
await sharp(Buffer.from(social)).png().toFile(fileURLToPath(new URL('assets/social-preview.png',root)));
console.log('Rendered Teren SVG variants, favicon, touch/app icons and the 1200×630 social preview.');
