import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../chemistry_arpg.html',import.meta.url),'utf8');
function setup(solid=()=>false){
  const code=html.split('// === MONSTER HIT ===')[1]?.split('// === MONSTER ART ===')[0];
  assert.ok(code,'尚未加入怪物受擊回饋');
  const scope={isSolid:solid,player:{dir:'right'}};
  vm.runInNewContext(code+'\nglobalThis.api={hit:hitMonster,update:updateMonsterImpact};',scope);
  return scope.api;
}
test('命中扣血、短暫硬直與向外擊退，距離不隨 FPS 改變',()=>{
  for(const dt of [1/120,1/60,.05]){
    const s=setup(),m={x:5,y:5,hp:30,type:'slime'};
    s.hit(m,7,1,0);
    assert.equal(m.hp,23);assert.ok(m.hitFlash>0);assert.ok(m.hitStun>0);
    for(let n=0;n<60;n++)s.update(m,dt);
    assert.ok(Math.abs(m.x-5.28)<.000001);assert.equal(m.y,5);
    assert.equal(m.hitStun,0);assert.equal(m.hitFlash,0);
  }
});
test('擊退不穿地形，Boss 幅度較小，特殊鈉彈保留較強推力',()=>{
  const wall=setup(x=>x>=6),s=setup();
  const m={x:5.65,y:5,hp:100,type:'slime'};
  wall.hit(m,1,1,0);for(let n=0;n<10;n++)wall.update(m,.02);
  assert.ok(m.x<5.7);
  const boss={x:5,y:5,hp:100,type:'boss'},normal={x:5,y:5,hp:100,type:'slime'};
  s.hit(boss,1,1,0);s.hit(normal,1,1,0,1.5);
  for(let n=0;n<10;n++){s.update(boss,.02);s.update(normal,.02)}
  assert.ok(boss.x>5&&boss.x<5.28);assert.ok(Math.abs(normal.x-6.5)<.000001);
});

test('怪物硬直期間停止追擊，結束後恢復追擊',()=>{
  const impact=html.split('// === MONSTER HIT ===')[1].split('// === MONSTER ART ===')[0];
  const ai=html.slice(html.indexOf('  function updateMonsters(dt)'),html.indexOf('  function drawMonsters()'));
  const m={x:5,y:5,hp:100,type:'slime',speed:2,dotTimer:0,frozen:0};
  const scope={isSolid:()=>false,player:{x:3,y:5,dir:'right',invincible:1},rooms:[[{monsters:[m]}]],state:{mapX:0,mapY:0},smokeTimer:0};
  vm.runInNewContext(impact+ai+'\nglobalThis.api={hit:hitMonster,update:updateMonsters};',scope);
  scope.api.hit(m,1,1,0);
  scope.api.update(.05);
  assert.ok(m.x>5,'受擊期間只向外擊退');
  scope.api.update(.05);scope.api.update(.05);
  const pushed=m.x;
  scope.api.update(.05);
  assert.ok(m.x<pushed,'硬直結束後重新向玩家移動');
  assert.equal(m.hitStun,0);
});
