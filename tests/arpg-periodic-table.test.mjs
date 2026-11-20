import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../chemistry_arpg.html', import.meta.url), 'utf8');
function setup(inventory = {}) {
  const code = html.split('// === PERIODIC INVENTORY ===')[1]?.split('// === INVENTORY TAB ===')[0];
  assert.ok(code, '元素週期表功能尚未加入');
  const scope = { inventory, ELEMENTS: ['H','O','C','Na','Cl','Ca'].map(sym => ({sym, name:sym, color:'#38bdf8'})) };
  vm.runInNewContext(code + '\nglobalThis.api = {elements: PERIODIC_ELEMENTS, render: renderPeriodicInventory};', scope);
  return scope.api;
}
test('完整 118 元素原子序與符號唯一，格位無重疊', () => {
  const { elements } = setup();
  assert.equal(elements.length, 118);
  assert.equal(new Set(elements.map(e => e.symbol)).size, 118);
  assert.equal(new Set(elements.map(e => `${e.row},${e.col}`)).size, 118);
  assert.deepEqual([...elements].map(e => e.number).sort((a,b)=>a-b), Array.from({length:118},(_,i)=>i+1));
  for (const [symbol, number, row, col] of [['H',1,1,1],['He',2,1,18],['C',6,2,14],['O',8,2,16],
    ['Na',11,3,1],['Cl',17,3,17],['Ca',20,4,2],['La',57,9,3],['Lu',71,9,17],
    ['Hf',72,6,4],['Ac',89,10,3],['Lr',103,10,17],['Rf',104,7,4],['Og',118,7,18]]) {
    const e = elements.find(e => e.symbol === symbol);
    assert.deepEqual([e.number,e.row,e.col], [number,row,col]);
  }
});
test('只標記遊戲已納入六種元素，零庫存仍標記，庫存隨資料更新', () => {
  const inventory = {H:4, Ca:12};
  const api = setup(inventory);
  const markup = api.render();
  assert.equal((markup.match(/class="periodic-element in-game"/g)||[]).length,6);
  assert.match(markup, /data-element="H"[^>]*aria-label="[^"]*庫存 4/);
  assert.match(markup, /data-element="O"[^>]*aria-label="[^"]*庫存 0/);
  assert.match(markup, /data-element="Ca"[^>]*aria-label="[^"]*庫存 12/);
  assert.match(markup, /data-element="He"[^>]*aria-label="[^"]*尚未納入/);
  inventory.H = 9;
  assert.match(api.render(), /data-element="H"[^>]*aria-label="[^"]*庫存 9/);
});
