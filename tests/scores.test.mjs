import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { prepareScore, rankScores, withDeadline } from '../js/score-data.mjs';

function session() {
  let time = 1000;
  const events = [];
  const window = { dispatchEvent: e => events.push(e) };
  runInNewContext(readFileSync(new URL('../js/score-session.js', import.meta.url), 'utf8'), {
    window, performance: { now: () => time }, crypto: { randomUUID: () => 'run-id' },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  return { api: window.GameScores, events, tick: n => { time += n; } };
}
test('探索每局重新計分、一般怪／分子怪／Boss 為 10／30／100，僅結算一次', () => {
  const { api, events, tick } = session();
  api.begin('chemistry_arpg');
  api.addKill('slime'); api.addKill('molecular'); api.addKill('boss'); tick(1234);
  const run = api.finish(null, 'victory', 'archer');
  assert.equal(run.score, 140); assert.equal(run.durationMs, 1234);
  assert.equal(run.hero, 'archer'); assert.equal(Object.isFrozen(run), true);
  assert.equal(api.finish(null, 'death', 'mage'), null);
  assert.equal(events.filter(e => e.type === 'game:finished').length, 1);
  api.begin('chemistry_arpg');
  assert.equal(api.finish(null, 'death', 'mage').score, 0);
  assert.equal(run.score, 140);
});
test('方塊採最終分數，中途不寫入，拒絕魔術方塊', () => {
  const { api, events } = session();
  assert.throws(() => api.begin('chemistry_rubiks_cube'));
  api.begin('chemistry_tetris'); assert.equal(events.length, 1);
  assert.equal(api.finish(2500, 'gameover').score, 2500);
});
test('驗證暱稱、分數、時間、語系與遊戲，不接受空白、分數字串或額外輸入欄位', () => {
  const run = { game: 'chemistry_tetris', id: 'run-id', score: 100, durationMs: 3000,
    reason: 'gameover', hero: 'none', version: '2026-11-25.1' };
  const row = prepareScore(run, '  小科學家  ', 'ja');
  assert.equal(row.nickname, '小科學家'); assert.equal(row.language, 'ja');
  for (const nickname of ['', ' \t\n　', 'a'.repeat(21)]) assert.throws(() => prepareScore(run, nickname, 'en'));
  for (const score of [-1, 1.5, NaN, Infinity, '100', 1e9 + 1]) assert.throws(() => prepareScore({ ...run, score }, 'A', 'en'));
  assert.throws(() => prepareScore({ ...run, durationMs: -1 }, 'A', 'en'));
  assert.throws(() => prepareScore({ ...run, game: '../feedback' }, 'A', 'en'));
  assert.throws(() => prepareScore(run, 'A', 'fr'));
  assert.equal(prepareScore({ ...run, injected: true }, 'A', 'en').injected, undefined);
});
test('排行榜依分數遞減，同分依時間及 UID 穩定排序，最多 20 筆', () => {
  const rows = [{ uid:'b',score:10,createdAt:2 },{ uid:'a',score:10,createdAt:1 },{ uid:'c',score:20,createdAt:3 }];
  assert.deepEqual(rankScores(rows).map(x => x.uid), ['c','a','b']);
  assert.equal(rankScores(Array.from({length:30},(_,i)=>({uid:String(i),score:i,createdAt:i}))).length,20);
});
test('網路操作逾時會回報未確認，恢復後仍可等待原寫入確認', async () => {
  let acknowledge;
  const operation = new Promise(resolve => { acknowledge = resolve; });
  await assert.rejects(withDeadline(operation, 5), error => error.code === 'score/timeout');
  acknowledge('saved');
  assert.equal(await withDeadline(operation, 20),'saved');
});
