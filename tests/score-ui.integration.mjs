// Uses the same optional jsdom installation as i18n-dom.integration.mjs.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { withDeadline } from '../js/score-data.mjs';
const require=createRequire(resolve(process.env.AI_GAME_TEST_MODULES||'/private/tmp/ai-game-validation','package.json'));
const {JSDOM}=require('jsdom');
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
function boot(submitScore) {
  const dom=new JSDOM('<!doctype html><body><div data-score-result="gameover"></div></body>',{url:'https://example.test',runScripts:'outside-only'});
  const w=dom.window;
  w.GameI18n={locale:'en'};w.GameScores={};
  w.scoreDependencies={submitScore,loadLeaderboard:async()=>[],withDeadline:operation=>withDeadline(operation,10)};
  const source=readFileSync(new URL('../js/scores.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  w.eval('const {submitScore,loadLeaderboard,withDeadline}=window.scoreDependencies;\n'+source);
  const finish=(id)=>w.dispatchEvent(new w.CustomEvent('game:finished',{detail:{game:'chemistry_tetris',id,score:100,reason:'gameover'}}));
  const form=w.document.querySelector('form'),input=form.elements.nickname;
  const message=w.document.querySelector('.score-panel [role=status]');
  const submit=()=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  return {w,finish,form,input,message,submit,close:()=>w.close()};
}
test('只在明確送出時驗證暱稱；略過不送分；每局重新輸入',async()=>{
  let calls=0;const x=boot(async()=>{calls++;return {};});
  x.finish('one');x.input.dispatchEvent(new x.w.Event('blur'));assert.equal(x.message.textContent,'');
  x.submit();assert.match(x.message.textContent,/暱稱/);assert.equal(calls,0);
  x.input.value='A';x.form.querySelectorAll('button')[1].click();assert.equal(calls,0);assert.equal(x.form.hidden,true);
  x.finish('two');assert.equal(x.input.value,'');assert.equal(x.form.hidden,false);x.close();
});
test('慢速的前一局回應不污染新局，送出期間重按只呼叫一次',async()=>{
  let resolveOld,calls=0;
  const x=boot(()=>{calls++;return new Promise(resolve=>{resolveOld=resolve;});});
  x.finish('one');x.input.value='A';x.submit();x.submit();assert.equal(calls,1);
  x.w.dispatchEvent(new x.w.CustomEvent('game:started'));
  x.finish('two');x.input.value='B';resolveOld({});await settle();
  assert.equal(x.form.hidden,false);assert.equal(x.input.value,'B');assert.equal(x.message.textContent,'');x.close();
});
test('逾時保留暱稱並允許重試，未收到確認不可顯示已儲存',async()=>{
  const x=boot(()=>new Promise(()=>{}));x.finish('one');x.input.value='水';x.submit();
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.match(x.message.textContent,/尚未確認/);assert.equal(x.input.value,'水');
  assert.equal(x.form.hidden,false);assert.equal(x.form.querySelector('button').disabled,false);x.close();
});
