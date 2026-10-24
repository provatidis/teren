import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const wait = (evaluate, condition) => evaluate(`new Promise((resolve, reject) => {
  const deadline = Date.now() + 10000;
  const check = () => { if (${condition}) resolve(); else if (Date.now() > deadline) reject(new Error('Entry route did not settle')); else setTimeout(check, 20); };
  check();
})`);

export async function checkEntry({ navigate, evaluate, text, fill, click, nextEvent, call, base }) {
  await navigate(base);
  assert.equal(await text('home-title'), 'Look closely.');
  assert.equal(await evaluate("document.getElementById('home-continue').hidden"), true);
  assert.equal(await evaluate("performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname.endsWith('.css')).length"), 1, 'Home loads one bundled stylesheet.');
  assert.equal(await evaluate("performance.getEntriesByType('resource').some(r=>['/models/','/examples/'].some(part=>new URL(r.name).pathname.includes(part)))"), false, 'Home loads no financial models or historical records.');
  for (const [width, height] of [[1366, 768], [390, 844], [320, 740]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 750 });
    await navigate(base); await settle(evaluate);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    if (width >= 750) assert.ok(await evaluate("[...document.querySelectorAll('.home-topic-actions .button')].every(a=>a.getBoundingClientRect().bottom<innerHeight)"), 'Both lab and lesson entry buttons are visible on the first laptop screen.');
    if (width < 750) assert.ok(await evaluate("[...document.querySelectorAll('.home-topic-jumps a')].every(a=>{const r=a.getBoundingClientRect();return r.height>=44&&r.bottom<innerHeight})"), 'Both topics are discoverable on the first phone screen.');
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await navigate(base + 'liquidity.html#experiment');
  await fill('scenario-future', '3570'); await fill('scenario-fees', '172');
  await click('lab-range-tab'); await fill('cl-future', '2400');
  let loaded = nextEvent('Page.loadEventFired');
  await evaluate("document.querySelector('.brand').click()"); await loaded;
  assert.equal(await text('home-title'), 'Look closely.');
  loaded = nextEvent('Page.loadEventFired');
  await evaluate("document.querySelector('.home-lab-link[href^=\"liquidity.html\"]').click()"); await loaded;
  assert.deepEqual(await evaluate("['scenario-future','scenario-fees','cl-future'].map(id=>document.getElementById(id).value)"), ['3570', '172', '2400']);
  assert.equal(await evaluate("document.getElementById('lab-range-tab').getAttribute('aria-selected')"), 'true');
  await click('cl-reset'); await click('lab-full-tab'); await click('scenario-reset');
  for (const route of ['learn.html#lesson=pool-share', 'learn.html#manage=fee-tiers', 'learn.html#applied=fees-over-time', 'lending.html#lesson=conditions', 'lending.html#loop-lesson=unwind']) {
    await navigate(base + route);
    if (route.includes('#applied=')) await wait(evaluate, "document.getElementById('learn-applied').getAttribute('aria-busy')==='false' && document.getElementById('applied-source').textContent.startsWith('Position #')");
    const progress = await evaluate("Object.keys(localStorage).filter(k=>/learning|progress|liquidity/.test(k)).sort().map(k=>[k,localStorage.getItem(k)])");
    await navigate(base);
    assert.equal(await evaluate("document.getElementById('home-continue').getAttribute('href')"), route);
    assert.deepEqual(await evaluate("Object.keys(localStorage).filter(k=>/learning|progress|liquidity/.test(k)).sort().map(k=>[k,localStorage.getItem(k)])"), progress, 'Home only reads the navigation bookmark.');
  }
  // Existing root fragments remain usable; replacement must not create a Back loop.
  await navigate(base + '#scenario=cp50-v1&investment=5000&start=2000&future=3333&fees=9');
  await wait(evaluate, "location.pathname.endsWith('/liquidity.html') && document.getElementById('scenario-future')?.value==='3333'");
  assert.equal(await evaluate('location.hash'), '#scenario=cp50-v1&investment=5000&start=2000&future=3333&fees=9');
  await navigate(base + '#inspect');
  await wait(evaluate, "location.pathname.endsWith('/liquidity.html') && document.getElementById('inspect-workspace')?.hidden===false");
  await navigate(base + 'lending.html#learn');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.product-nav a')].map(a=>a.textContent)"), ['Learn', 'Experiment']);
  assert.equal(await evaluate("document.querySelector('.topic-current').textContent"), 'Lending');
  await navigate(base);
  await evaluate("localStorage.removeItem('teren-learning-location-v1');localStorage.removeItem('teren-lending-learning-v1');localStorage.removeItem('teren-loop-learning-v1');localStorage.removeItem('passiko-range-learning-v1');localStorage.removeItem('passiko-applied-liquidity-v1');localStorage.removeItem('degenerator-learning-liquidity-v1');sessionStorage.clear()");
  console.log('PASS: Home, mobile topic discovery, lightweight assets, lesson resume, draft-preserving Home round trip and original shared links');
}
