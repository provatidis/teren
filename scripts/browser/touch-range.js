import assert from 'node:assert/strict';

const settle = evaluate => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

// Enable the input mode before scrolling/measuring. A stale coordinate must
// fail with evidence, not silently turn a drag into a tap on another element.
export async function dragRangeToMax({ evaluate, call, fill }, id, { inset = 26 } = {}) {
  const selector = JSON.stringify(id);
  let gestureStarted = false;
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  try {
    await fill(id, await evaluate(`document.getElementById(${selector}).min`));
    await evaluate(`document.getElementById(${selector}).scrollIntoView({block:'center',behavior:'instant'})`);
    const box = await evaluate(`new Promise((resolve,reject)=>{
      const input=document.getElementById(${selector}), deadline=performance.now()+5000;
      let previous='', stable=0;
      const check=()=>{
        const r=input.getBoundingClientRect(), x=r.left+${inset}, y=r.top+r.height/2;
        const frame=[r.left,r.top,r.width,r.height,scrollX,scrollY].join(',');
        stable=frame===previous?stable+1:0; previous=frame;
        if(stable>=3 && document.elementFromPoint(x,y)===input && r.top>=0 && r.bottom<=innerHeight){
          const events=[];
          const record=event=>{if(events.length<80)events.push({type:event.type,target:event.target.id,trusted:event.isTrusted,pointer:event.pointerType,value:input.value});};
          const types=['pointerdown','pointermove','pointerup','pointercancel','input'];
          types.forEach(type=>document.addEventListener(type,record,true));
          window.touchRangeTrace={events,remove:()=>types.forEach(type=>document.removeEventListener(type,record,true))};
          resolve({left:r.left,top:r.top,width:r.width,height:r.height});
        }else if(performance.now()>deadline)reject(new Error('Touch target not stable or covered: '+${selector}+' '+frame));
        else requestAnimationFrame(check);
      }; requestAnimationFrame(check);
    })`);
    assert.ok(box.height >= 44, id + ': touch target height');
    const point = fraction => ({ x: box.left + inset + (box.width - 2 * inset) * fraction, y: box.top + box.height / 2, id: 0 });
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
    gestureStarted = true;
    await settle(evaluate);
    for (const fraction of [.25, .5, .75, 1]) {
      await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(fraction)] });
      await settle(evaluate);
      const current = await evaluate(`({top:document.getElementById(${selector}).getBoundingClientRect().top,value:document.getElementById(${selector}).value,width:innerWidth})`);
      assert.ok(Math.abs(current.top - box.top) < 1, id + ': control moved during drag: ' + JSON.stringify({ before: box.top, ...current }));
    }
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    gestureStarted = false;
    await settle(evaluate);
    const result = await evaluate(`({value:document.getElementById(${selector}).value,max:document.getElementById(${selector}).max,events:window.touchRangeTrace.events})`);
    const trace = id + ': ' + JSON.stringify(result);
    assert.ok(result.events.some(event => event.type === 'pointerdown' && event.target === id && event.trusted && event.pointer === 'touch'), trace);
    assert.ok(result.events.some(event => event.type === 'input' && event.target === id && event.trusted), trace);
    assert.equal(result.value, result.max, trace);
  } catch (error) {
    const trace = await evaluate('window.touchRangeTrace?.events || []');
    error.message += '\nTouch event trace: ' + JSON.stringify(trace);
    throw error;
  } finally {
    if (gestureStarted) await call('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await evaluate('window.touchRangeTrace?.remove(); delete window.touchRangeTrace');
    await call('Emulation.setTouchEmulationEnabled', { enabled: false });
  }
}
