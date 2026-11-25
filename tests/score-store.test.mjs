import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

async function store({existing=false,best=200,writeError=false,latest=null}={}) {
  const writes=[], reads=[];
  const sdk={
    ref:(_db,path='')=>path,
    get:async path=>{
      reads.push(path);
      // RTDB get() sends a server read; .info is a local-only path.
      if(path.startsWith('.info')) throw new Error('Invalid token in path');
      const value=path.startsWith('scoreRuns/')?(existing?{score:100}:null):path.startsWith('scoreLatest/')?latest:best===null?null:{score:best};
      return {exists:()=>value!==null,val:()=>value};
    },
    onValue:(_ref,callback)=>{callback({val:()=>0});return ()=>{};},
    serverTimestamp:()=>({'.sv':'timestamp'}),
    update:async (_ref,updates)=>{if(writeError)throw Error('offline');writes.push(updates);},
  };
  const connection={auth:{},authSDK:{},db:{},sdk};
  globalThis.__scoreStoreTest={connect:async()=>connection,getWriter:async()=>({uid:'alice'})};
  let source=readFileSync(new URL('../js/score-store.js',import.meta.url),'utf8');
  source=source.replace("import { connect, getWriter } from './feedback-store.js?v=20261125-2';",'const {connect,getWriter}=globalThis.__scoreStoreTest;');
  source=source.replace("'./score-data.mjs?v=20261125-2'",JSON.stringify(pathToFileURL(new URL('../js/score-data.mjs',import.meta.url).pathname).href));
  const module=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`);
  return {module,writes,reads};
}
const run={game:'chemistry_tetris',id:'run-1',score:100,durationMs:10000,reason:'gameover',hero:'none',version:'2026-11-25.1'};
test('低分原子保存歷史與marker，不修改最高分，.info使用本地訂閱而非get',async()=>{
  const {module,writes}=await store();
  await module.submitScore(run,' 元素獵人 ','ja');
  assert.equal(writes.length,1);
  assert.equal(writes[0]['scoreRuns/chemistry_tetris/alice/run-1'].nickname,'元素獵人');
  assert.equal(writes[0]['scoreRuns/chemistry_tetris/alice/run-1'].language,'ja');
  assert.equal(writes[0]['scoreLatest/alice'].runId,'run-1');
  assert.equal(writes[0]['leaderboards/chemistry_tetris/alice'],undefined);
});
test('新高分同步寫入榜單；同一局已存在時不再寫入',async()=>{
  const high=await store({best:null}); await high.module.submitScore(run,'A','en');
  assert.equal(high.writes[0]['leaderboards/chemistry_tetris/alice'].score,100);
  const duplicate=await store({existing:true});
  assert.equal((await duplicate.module.submitScore(run,'B','en')).alreadySaved,true);
  assert.equal(duplicate.writes.length,0);
});
test('寫入失敗向上回報、不回傳成功；冷卻未滿不送出',async()=>{
  const offline=await store({writeError:true});
  await assert.rejects(offline.module.submitScore(run,'A','en'),/offline/);
  const cooldown=await store({latest:{at:Date.now()}});
  await assert.rejects(cooldown.module.submitScore(run,'A','en'),e=>e.code==='score/cooldown');
  assert.equal(cooldown.writes.length,0);
});
test('同局同時送出及逾時重試共用原操作，只會寫入一次',async()=>{
  const {module,writes}=await store({best:null});
  await Promise.all([module.submitScore(run,'A','en'),module.submitScore(run,'A','en')]);
  assert.equal(writes.length,1);
});
