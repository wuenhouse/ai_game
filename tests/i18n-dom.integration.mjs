// Optional dependency: npm install --prefix /tmp/ai-game-validation jsdom@26
// AI_GAME_TEST_MODULES=/tmp/ai-game-validation node --test tests/i18n-dom.integration.mjs
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(resolve(process.env.AI_GAME_TEST_MODULES || '/private/tmp/ai-game-validation', 'package.json'));
const { JSDOM } = require('jsdom');
const code = file => readFileSync(new URL(`../js/${file}`, import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

test('開始畫面和遊戲HUD的語系選單初始值一致', async () => {
  const dom = new JSDOM('<html><body><div id="title-screen"><div class="title-content"></div></div><div id="game-screen"><div class="hud"></div></div></body></html>',{url:'https://example.test',runScripts:'outside-only'});
  const w=dom.window;
  w.localStorage.setItem('chem-lab-language','ja');
  w.eval(code('translations.js'));w.eval(code('i18n.js'));await settle();
  assert.deepEqual([...w.document.querySelectorAll('select')].map(s=>s.value),['ja','ja']);
  w.dispatchEvent(new w.Event('pagehide'));w.close();
});

test('真實 DOM：切換可還原，動態介面會翻譯，玩家文字及輸入值不變', async () => {
  const dom = new JSDOM('<!doctype html><html lang="zh-Hant"><head><title>元素獵人</title></head><body><div class="header"></div><p id="label" title="普通攻擊">分數 <b>100</b></p><p class="discussion-text">元素獵人</p><div class="discussion-author">水・玩家</div><p data-user-content>水</p><input value="元素獵人"><textarea>化學反應</textarea></body></html>', {url:'https://example.test', runScripts:'outside-only'});
  const {window:w} = dom;
  w.eval(code('translations.js')); w.eval(code('i18n.js'));
  await settle();
  w.GameI18n.setLocale('en');
  assert.equal(w.document.title, 'Element Hunter');
  assert.equal(w.document.querySelector('#label').textContent,'Score 100');
  assert.equal(w.document.querySelector('#label').title,'Basic attack');
  assert.equal(w.document.querySelector('.discussion-text').textContent,'元素獵人');
  assert.equal(w.document.querySelector('.discussion-author').textContent,'水・玩家');
  assert.equal(w.document.querySelector('p[data-user-content]').textContent,'水');
  assert.equal(w.document.querySelector('input').value,'元素獵人');
  assert.equal(w.document.querySelector('textarea').value,'化學反應');
  const dynamic = w.document.createElement('p'); dynamic.textContent='二氧化碳 (CO₂)'; w.document.body.append(dynamic);
  await settle(); assert.equal(dynamic.textContent,'Carbon dioxide (CO₂)');
  w.GameI18n.setLocale('ja'); assert.equal(dynamic.textContent,'二酸化炭素 (CO₂)');
  dynamic.textContent='成績已儲存！'; await settle(); assert.equal(dynamic.textContent,'スコアを保存しました！');
  w.GameI18n.setLocale('zh-Hant'); assert.equal(dynamic.textContent,'成績已儲存！');
  assert.equal(w.document.title,'元素獵人');
  assert.equal(w.document.querySelector('#label').textContent,'分數 100');
  w.GameI18n.setLocale('en'); await settle();
  assert.equal(dynamic.textContent,'Score saved!');
  w.dispatchEvent(new w.Event('pagehide')); dom.window.close();
});

test('四頁可見靜態文字均有英文翻譯，語言選項保持原名', async () => {
  for (const file of ['index.html','chemistry_arpg.html','chemistry_tetris.html','chemistry_rubiks_cube.html']) {
    const dom = new JSDOM(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'), {url:'https://example.test',runScripts:'outside-only'});
    const w = dom.window; w.eval(code('translations.js')); w.eval(code('i18n.js')); await settle();
    w.GameI18n.setLocale('en');
    const walker = w.document.createTreeWalker(w.document.body,w.NodeFilter.SHOW_TEXT);
    const untranslated=[]; let node;
    while ((node=walker.nextNode())) {
      if (!node.parentElement.closest('script,style,[data-user-content]') && /[\u3400-\u9fff]/.test(node.data)) untranslated.push(node.data.trim());
    }
    assert.deepEqual(untranslated,[],file);
    assert.equal(w.document.querySelector('option').textContent,'繁體中文');
    w.dispatchEvent(new w.Event('pagehide')); dom.window.close();
  }
});
