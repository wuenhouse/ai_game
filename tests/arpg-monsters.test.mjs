import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../chemistry_arpg.html', import.meta.url),'utf8');
function setup(width=1774,height=887) {
  const calls=[];
  const code=html.split('// === MONSTER ART ===')[1]?.split('// === MONSTERS ===')[0];
  assert.ok(code,'尚未接入怪物圖集');
  const ctx=new Proxy({}, {get:(_,name)=>name==='drawImage'?(...args)=>calls.push(args):()=>{}});
  const scope={ctx,monsterAtlas:{naturalWidth:width,naturalHeight:height}};
  vm.runInNewContext(code+'\nglobalThis.api={frame:monsterSpriteFrame,draw:drawMonsterSprite};',scope);
  return {...scope.api,calls};
}
test('六種元素小怪與化合物怪、Boss 對應不同圖格',()=>{
  const s=setup();
  for(const [i,sym] of ['H','O','C','Na','Cl','Ca'].entries())assert.equal(s.frame({type:'slime',element:{sym}}),i);
  assert.equal(s.frame({type:'molecular',element:{sym:'H'}}),6);
  assert.equal(s.frame({type:'boss',element:{sym:'O'}}),7);
  assert.equal(s.frame({type:'slime',element:{sym:'Fe'}}),-1);
});
test('實際圖片尺寸可換算裁切格，未載入或未知素材可退回原繪圖',()=>{
  const s=setup();
  assert.equal(s.draw({type:'slime',element:{sym:'Cl'},frozen:0,x:1,y:1},100,100,20),true);
  assert.equal(s.calls.length,1);
  assert.deepEqual(s.calls[0].slice(1,5),[0,443.5,443.5,443.5]);
  assert.equal(setup(0,0).draw({type:'boss',element:{sym:'H'}},100,100,20),false);
  assert.equal(s.draw({type:'slime',element:{sym:'Fe'}},100,100,20),false);
});
