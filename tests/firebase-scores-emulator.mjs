// Run only against demo-ai-game's LOCAL emulator, never the configured live Firebase.
// AI_GAME_TEST_MODULES=/tmp/ai-game-validation node --test tests/firebase-scores-emulator.mjs
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(resolve(process.env.AI_GAME_TEST_MODULES || '/private/tmp/ai-game-validation', 'package.json'));
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { ref, update, set, get, query, orderByChild, limitToLast, serverTimestamp } = require('firebase/database');
let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId:'demo-ai-game', database:{host:'127.0.0.1',port:9037,
    rules:readFileSync(new URL('../firebase/database.rules.json',import.meta.url),'utf8')} });
});
beforeEach(async () => { await env.clearDatabase(); });
after(async () => { await env?.cleanup(); });
const db = (uid='alice') => uid ? env.authenticatedContext(uid).database() : env.unauthenticatedContext().database();
const archive = (score=100, extra={}) => ({ nickname:'小科學家',score,durationMs:12345,language:'en',version:'2026-11-25.1',reason:'gameover',hero:'none',createdAt:serverTimestamp(),...extra });
function writes({game='chemistry_tetris',uid='alice',id='run-1',score=100,extra={},best=true}={}) {
  const row=archive(score,extra);
  const data={ [`scoreRuns/${game}/${uid}/${id}`]:row, [`scoreLatest/${uid}`]:{game,runId:id,at:serverTimestamp()} };
  if (best) data[`leaderboards/${game}/${uid}`]={nickname:row.nickname,score,createdAt:row.createdAt,runId:id};
  return data;
}
test('合法原子新增歷史與個人最高分；本人可讀歷史，外人不可讀',async()=>{
  await assertSucceeds(update(ref(db()),writes()));
  const row=await assertSucceeds(get(ref(db(),'scoreRuns/chemistry_tetris/alice/run-1')));
  assert.equal(row.val().score,100); assert.equal(typeof row.val().createdAt,'number');
  await assertFails(get(ref(db('bob'),'scoreRuns/chemistry_tetris/alice')));
  await assertFails(get(ref(db(null),'scoreRuns')));
  await assertSucceeds(update(ref(db('bob')),writes({uid:'bob',game:'chemistry_arpg',extra:{hero:'archer',reason:'victory'}})));
});
test('榜單僅允許分數排序且最多20筆；根讀取、未知遊戲與超額讀取遭拒',async()=>{
  await assertSucceeds(update(ref(db()),writes()));
  await assertSucceeds(get(query(ref(db(null),'leaderboards/chemistry_tetris'),orderByChild('score'),limitToLast(20))));
  await assertFails(get(ref(db(null))));
  for (const path of ['leaderboards','leaderboards/chemistry_tetris','leaderboards/chemistry_tetris/alice']) await assertFails(get(ref(db(null),path)));
  await assertFails(get(query(ref(db(null),'leaderboards/chemistry_tetris'),orderByChild('score'),limitToLast(21))));
  await assertFails(get(query(ref(db(null),'leaderboards/chemistry_rubiks_cube'),orderByChild('score'),limitToLast(20))));
});
test('未登入、冒用、未知遊戲、空白、非法數值、時間、額外欄位遭拒',async()=>{
  await assertFails(update(ref(db(null)),writes()));
  await assertFails(update(ref(db('bob')),writes()));
  await assertFails(update(ref(db()),writes({game:'chemistry_rubiks_cube'})));
  for (const extra of [{nickname:' \t\n　'}, {nickname:'a'.repeat(21)}, {score:-1}, {score:1.5}, {score:'100'}, {score:1e9+1}, {createdAt:1}, {durationMs:-1}, {durationMs:604800001}, {language:'fr'}, {reason:'victory'}, {hero:'mage'}, {version:'old'}, {injected:true}]) {
    await assertFails(update(ref(db()),writes({extra})));
  }
});
test('不可覆寫、刪除、只寫歷史、只寫榜單、marker或偽造配對',async()=>{
  const paired=writes();
  for (const key of Object.keys(paired)) await assertFails(set(ref(db(),key),paired[key]));
  const wrong=writes(); wrong['leaderboards/chemistry_tetris/alice'].nickname='另一位';
  await assertFails(update(ref(db()),wrong));
  await assertSucceeds(update(ref(db()),writes()));
  await assertFails(set(ref(db(),'scoreRuns/chemistry_tetris/alice/run-1'),archive(200)));
  await assertFails(set(ref(db(),'scoreRuns/chemistry_tetris/alice/run-1'),null));
  await assertFails(set(ref(db(),'leaderboards/chemistry_tetris/alice'),null));
  await assertFails(update(ref(db()),writes({id:'run-2',score:200})));
});
async function clearCooldown() {
  await env.withSecurityRulesDisabled(async context=>{
    await set(ref(context.database(),'scoreLatest/alice/at'),Date.now()-6000);
  });
}
test('低分仍存歷史，榜單不降分；新高分必須同步上榜且暱稱一致',async()=>{
  await assertSucceeds(update(ref(db()),writes())); await clearCooldown();
  await assertSucceeds(update(ref(db()),writes({id:'run-2',score:50,best:false})));
  assert.equal((await get(ref(db(),'leaderboards/chemistry_tetris/alice'))).val().score,100);
  await clearCooldown();
  await assertFails(update(ref(db()),writes({id:'run-3',score:200,best:false})));
  await assertFails(update(ref(db()),writes({id:'run-3',score:50})));
  await assertSucceeds(update(ref(db()),writes({id:'run-3',score:200,extra:{nickname:'新暱稱'}})));
  assert.equal((await get(ref(db(),'leaderboards/chemistry_tetris/alice'))).val().nickname,'新暱稱');
});
test('原有留言規則可接受配對投稿，新增排行榜不改留言權限',async()=>{
  const id='topic-1', game='chemistry_arpg';
  await assertSucceeds(update(ref(db()),{
    [`feedback/${game}/threads/${id}`]:{author:'Tester',message:'Hello',uid:'alice',createdAt:serverTimestamp()},
    'feedbackThrottle/alice':{at:serverTimestamp(),game,thread:'',id},
  }));
});
