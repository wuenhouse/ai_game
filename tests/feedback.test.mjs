import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareMessage, requireGame, hasFirebaseConfig } from '../js/feedback-data.mjs';
test('拒絕未知遊戲及路徑穿越', () => {
  assert.equal(requireGame('chemistry_arpg'), 'chemistry_arpg');
  for (const v of ['other', '../chemistry_arpg', '', null]) assert.throws(() => requireGame(v));
});
test('trim 訊息並保留純文字', () => {
  assert.deepEqual(prepareMessage(' 玩家 ', ' <script>alert(1)</script> '), { author: '玩家', message: '<script>alert(1)</script>' });
});
test('拒絕空白與過長欄位', () => {
  for (const [a,m] of [['','問題'], ['玩家','  '], ['a'.repeat(21),'問題'], ['玩家','a'.repeat(1001)]]) assert.throws(() => prepareMessage(a,m));
  assert.equal(prepareMessage('a'.repeat(20),'a'.repeat(1000)).message.length,1000);
});
test('暱稱與內容皆拒絕半形、全形、換行與 Tab 組成的空白', () => {
  for (const blank of [' ', '\t', '\n', '\r\n', '　', '\u00a0', ' \t\n　\u00a0']) {
    assert.throws(() => prepareMessage(blank, '正常內容'), /暱稱/);
    assert.throws(() => prepareMessage('玩家', blank), /內容/);
  }
  assert.deepEqual(prepareMessage('　玩家　', '\n第一行\n第二行\t'), {
    author: '玩家', message: '第一行\n第二行'
  });
});
test('只有完整必要的 Web config 才能連線', () => {
  assert.equal(hasFirebaseConfig({}),false);
  assert.equal(hasFirebaseConfig({apiKey:'x',authDomain:'x',projectId:'x',appId:'x'}),false);
  assert.equal(hasFirebaseConfig({apiKey:'x',authDomain:'x',projectId:'x',appId:'x',databaseURL:'https://example.firebaseio.com'}),true);
});

test('分頁游標使用最舊一筆的時間與 ID，即便 20 筆時間相同', async () => {
  const { feedbackPage, FEEDBACK_PAGE_SIZE } = await import('../js/feedback-data.mjs');
  const rows = Array.from({ length: FEEDBACK_PAGE_SIZE }, (_, i) =>
    ({ createdAt: 1000, id: 't' + String(i).padStart(2, '0') }));
  assert.deepEqual(feedbackPage(rows).before, { createdAt: 1000, id: 't00' });
  assert.equal(feedbackPage(rows.slice(1)).before, null);
  assert.equal(feedbackPage([]).before, null);
});
