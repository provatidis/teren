import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSON_IDS, VARIANTS, lessonSetup, runLesson } from '../public/models/lesson-experiments.js';
import { matchChallengeHolding } from '../public/models/liquidity-challenge.js';
import { calculateScenario } from '../public/models/cp50-v1.js';
import { lessonHandoff } from '../public/lib/lesson-handoff.js';
import { scenarioFromHash } from '../public/lib/scenario-links.js';
import { rangeFromHash } from '../public/lib/range-links.js';
import { usd } from '../public/lib/format.js';

const outcomeFor = (id, variant) => runLesson(id, lessonSetup(id, variant), variant);

test('every lesson hands one question, one named lab and one instruction to a link that opens', () => {
  for (const id of LESSON_IDS) for (let variant = 0; variant < VARIANTS; variant++) {
    const handoff = lessonHandoff(id, outcomeFor(id, variant));
    assert.deepEqual(Object.keys(handoff).sort(), ['hash', 'link', 'note', 'question']);
    assert.match(handoff.question, /\?$/); assert.match(handoff.link, / ↗$/);
    assert.match(handoff.note, /new tab/);
    assert.doesNotMatch(JSON.stringify(handoff), /NaN|undefined|Infinity/);
    // The link names the lab it opens, and the lab can read it.
    if (['swap-impact', 'pool-share'].includes(id)) { assert.equal(handoff.hash, '#swap-sandbox'); assert.match(handoff.link, /swap sandbox/); }
    else if (id === 'range-boundaries') { assert.ok(rangeFromHash(handoff.hash)); assert.match(handoff.link, /range lab/); }
    else { assert.ok(scenarioFromHash(handoff.hash)); assert.match(handoff.link, /full-range lab/); }
  }
});

test('no link carries the float noise of a price times a width', () => {
  for (const id of LESSON_IDS) for (let variant = 0; variant < VARIANTS; variant++) {
    const outcome = outcomeFor(id, variant), { hash } = lessonHandoff(id, outcome);
    // 1650.0000000000002 and 3300.0000000000005 were in lesson 6's link.
    assert.doesNotMatch(hash, /\d\.\d{7,}/, id + ' ' + variant + ' ' + hash);
    if (id !== 'range-boundaries') continue;
    const opened = rangeFromHash(hash), r = outcome.result;
    // The lab opens the lesson's own range: the same prices, to within the noise removed.
    for (const key of ['initialPrice', 'futurePrice', 'lowerPrice', 'upperPrice']) assert.ok(Math.abs(opened[key] - r[key]) < 1e-9, key);
    assert.equal(opened.investment, r.investment);
    assert.deepEqual([opened.lowerPrice, opened.upperPrice], [[1800, 2200], [1350, 1650], [2700, 3300]][variant]);
    // The lesson's own maths keeps the exact values, so its edge states do not move.
    assert.deepEqual(runLesson(id, lessonSetup(id, variant), variant).result, r);
  }
});

test('lesson 4’s instruction can be carried out in the lab from the example it opens, whichever way ETH moved', () => {
  const directions = [];
  for (let variant = 0; variant < VARIANTS; variant++) {
    const outcome = outcomeFor('loss-vs-profit', variant), s = outcome.setup, { note, hash } = lessonHandoff('loss-vs-profit', outcome);
    const opened = scenarioFromHash(hash), start = opened.investment;
    assert.deepEqual([opened.initialPrice, opened.futurePrice, opened.fees], [s.initialPrice, s.futurePrice, 0]);
    const withFees = fees => calculateScenario({ ...opened, fees });
    const bare = withFees(0), gap = bare.breakEvenFees;
    if (s.futurePrice < s.initialPrice) {
      directions.push('fell');
      assert.equal(note, 'Keep ETH at ' + usd(s.futurePrice) + '. Can fees put your claim ahead of holding while you’re still down on your start? It opens in a new tab.');
      // After a fall holding is below the start, so no fee amount gives a gain that trails it.
      assert.ok(bare.holdValue < start);
      for (const fees of [0, gap / 2, gap, gap + 1, start]) { const r = withFees(fees); assert.equal(r.lpValue > start && r.lpValue < r.holdValue, false); }
      // The mirror image exists: fees just over the gap put the claim ahead and still down.
      const ahead = withFees(gap + 1);
      assert.ok(ahead.lpValue > ahead.holdValue && ahead.lpValue < start);
    } else {
      directions.push('rose');
      assert.equal(note, 'Add fees there and find a gain on your start that still trails holding. It opens in a new tab.');
      for (const fees of [gap / 4, gap / 2]) { const r = withFees(fees); assert.ok(r.lpValue > start && r.lpValue < r.holdValue); }
    }
  }
  // The variations cover both directions, so both wordings are exercised.
  assert.deepEqual(directions, ['rose', 'fell', 'rose']);
  // A saved example at the starting price still gets an instruction it can follow.
  const still = runLesson('loss-vs-profit', { ...lessonSetup('loss-vs-profit'), futurePrice: 2000 });
  assert.equal(lessonHandoff('loss-vs-profit', still).note, 'Move the price there, add fees, and compare your claim with your start and with holding. It opens in a new tab.');
});

test('the challenge’s link follows the reader’s own example', () => {
  for (let variant = 0; variant < VARIANTS; variant++) {
    const outcome = outcomeFor('final-challenge', variant), s = outcome.setup;
    const worked = scenarioFromHash(lessonHandoff('final-challenge', outcome).hash);
    assert.deepEqual([worked.futurePrice, worked.fees], [s.futurePrice, s.fees]);
    const task = matchChallengeHolding(s, s.initialPrice * .75), own = lessonHandoff('final-challenge', outcome, task), opened = scenarioFromHash(own.hash);
    assert.deepEqual([opened.futurePrice, opened.fees], [task.price, task.fees]);
    assert.equal(own.note, 'Opens ETH at ' + usd(task.price) + ' with ' + usd(task.fees) + ' in fees, in a new tab. Add the costs there.');
    // The fee amount that matches holding stays exact, so the lab opens on a match.
    assert.ok(Math.abs(calculateScenario(opened).difference) < 1e-8);
    // No other lesson reads a task.
    assert.deepEqual(lessonHandoff('fee-break-even', outcomeFor('fee-break-even', variant), task), lessonHandoff('fee-break-even', outcomeFor('fee-break-even', variant)));
  }
});
