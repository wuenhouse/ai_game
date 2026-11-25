const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

// Reuse the original game's keyboard, touch, canvas and localStorage harness.
const harness = fs.readFileSync(path.join(__dirname, 'arpg-archer.test.cjs'), 'utf8')
  .split('a.equal(q.player.level,7);')[0]
  .replace('window.qa={update,', 'window.qa={runAssist, beginExploration, missionAction, missionTarget, goRoom: transitionRoom, readMission:()=>mission, ROOM:()=>rooms, update,')
  .replace("const window=listeners({", "const window=listeners({GameScores:{starts:0,finishes:0,begin(){this.starts++},finish(){this.finishes++}},GameAnalytics:{calls:[],enter(...p){this.calls.push(['enter',...p])},start(...p){this.calls.push(['start',...p])},event(...p){this.calls.push(['event',...p])},end(...p){this.calls.push(['end',...p])}},");
const verify = `
const score = window.GameScores, calls = window.GameAnalytics.calls;
for (const hero of ['mage','archer']) {
  pick(hero); q.beginExploration('intro');
  a.equal(score.starts, 0);
  a.equal(q.world().drops.filter(d=>d.quest && d.sym==='H').length, 2);
  a.equal(q.world().drops.filter(d=>d.quest && d.sym==='O').length, 1);
  a.equal(q.goRoom(1,0), false);
  const before = q.inventory.H;
  q.missionAction(); a.equal(q.readMission().phase,'collect');
  while (q.world().drops.some(d=>d.quest)) {
    const target=q.missionTarget();
    q.player.x=target.x;q.player.y=target.y;
    q.update(0.05);
  }
  a.equal(q.inventory.H,before);
  a.equal(q.readMission().phase,'craft');
  q.missionAction();
  a.equal(q.readMission().phase, hero==='mage'?'heal':'guard');
  a.equal(q.inventory.H,before);
  if (hero==='mage') {
    const injured=q.player.hp;
    a.equal(q.goRoom(1,0),false);
    q.missionAction(); a.ok(q.player.hp>injured);
  }
  q.player.x=14.5; q.player.y=7.1;
  q.keys.right=true;
  for (let i=0;i<10&&q.state.mapX===2;i++) q.update(.05);
  q.keys.right=false;
  a.equal(q.state.mapX,3); // off-center phone joystick still crosses the tutorial doorway
  q.player.x=3.5; q.player.y=6.5;
  const guard=q.world().monsters[0];
  q.player.atkTimer=0;
  const mp=q.player.mp, h=q.inventory.H;
  q.openMenu('help'); q.runAssist(); a.equal(q.player.atkTimer,0); q.closeMenu();
  document.hidden=true; q.runAssist(); a.equal(q.player.atkTimer,0); document.hidden=false;
  q.world().tiles[6][4]=q.TILE.ROCK;
  q.runAssist(); a.equal(q.player.atkTimer,0);
  q.world().tiles[6][4]=q.TILE.FLOOR;
  if(hero==='archer'){
    q.startBowCharge('test'); q.runAssist();a.equal(q.player.atkTimer,0);
    q.finishBowCharge('test'); q.arrows().length=0;q.player.atkTimer=0;
  }
  el('assist-menu').emit('change',{target:{checked:false}});
  q.runAssist(); a.equal(q.player.atkTimer,0);
  el('assist-title').emit('change',{target:{checked:true}});
  q.runAssist(); a.ok(q.player.atkTimer>0);
  const pending = q.arrows().length;
  const hp = guard.hp;
  q.runAssist(); a.equal(q.arrows().length,pending); a.equal(guard.hp,hp);
  a.equal(q.inventory.H,h);a.equal(q.player.mp,mp);
  for(let i=0;i<80&&q.readMission().phase==='guard';i++) q.update(.05);
  a.equal(q.world().monsters.length,0);
  a.equal(q.readMission().phase,'exit');
  q.player.x=12.5;q.player.y=6.5; q.update(.05);
  a.equal(q.state.screen,'intro-result');
  a.equal(score.finishes,0);
  a.ok(calls.some(c=>c[0]==='event'&&c[1]==='tutorial_complete'));
  a.ok(calls.some(c=>c[0]==='end'&&c[2].outcome==='completed'));
  a.equal(saved.get('chem_arpg_intro_v1'),'done');
  q.returnToTitle();
}
a.equal(JSON.parse(saved.get('chem_arpg_save')).player.level,7);
start(); a.equal(score.starts,1);
q.bossVictory();a.equal(score.finishes,1);
console.log('PASS: both intro routes, reserved ingredients, assist line of sight/cooldown, local-only result, save and classic scoring');
`;
vm.runInNewContext(harness + verify, {require, __dirname, console});
