import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const load = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function setup(hostname = 'wuenhouse.com', send) {
  const events = [];
  let time = 1000;
  const window = { location: { hostname }, performance: { now: () => time },
    gtag: send ?? ((kind, name, properties) => events.push({ kind, name, ...properties })) };
  runInNewContext(load('js/game-analytics.js'), { window });
  return { a: window.GameAnalytics, events, advance(ms) { time += ms; } };
}

test('game entry and start differ, play milestones de-duplicate, and replay follows a prior run', () => {
  const { a, events, advance } = setup();
  const id = 'chemistry_arpg';
  a.enter(id); a.enter(id);
  a.event('first_craft', id);
  a.start(id, { mode:'intro', hero:'archer', nickname:'never send' });
  a.start(id);
  a.event('first_craft', id); a.event('first_craft', id);
  advance(1660);
  a.end(id, { outcome:'completed' }); a.end(id, { outcome:'completed' });
  a.start(id, { mode:'classic', hero:'mage' }); a.event('first_craft', id);
  assert.deepEqual(events.map(e=>e.name), ['game_enter','game_start','first_craft','game_end','game_start','game_replay','first_craft']);
  assert.equal(events[3].elapsed_sec, 2);
  assert.equal(events[3].game_outcome, 'completed');
  assert.equal(events[1].game_id, id);
  assert.equal(events[1].game_mode, 'intro');
  assert.equal(events[1].hero_type, 'archer');
  assert.ok(!JSON.stringify(events).includes('never send'));
});

test('invalid games, milestones and metadata never become events or free text', () => {
  const { a, events } = setup();
  a.enter('person name'); a.select('person name');
  a.select('chemistry_tetris');
  a.start('chemistry_tetris', { mode:'name', hero:'name' });
  a.event('private message', 'chemistry_tetris');
  a.end('chemistry_tetris', { outcome:'name' });
  assert.deepEqual(events.map(e=>e.name), ['game_select','game_start']);
  assert.ok(events.every(e=>!e.game_mode && !e.hero_type && !e.game_outcome));
});

test('local and preview runtime never sends custom GA4 events; missing or throwing GA must not break gameplay', () => {
  for (const host of ['localhost','127.0.0.1','', 'example.test']) {
    const { a, events } = setup(host);
    a.enter('chemistry_tetris'); a.start('chemistry_tetris');
    assert.equal(events.length, 0);
  }
  const { a } = setup('wuenhouse.com', () => { throw Error('GA blocked'); });
  assert.doesNotThrow(()=>a.start('chemistry_tetris'));
});

test('lobby and all games keep exactly one existing GA config; no manual fake page_view', () => {
  for (const page of ['index.html','chemistry_arpg.html','chemistry_tetris.html','chemistry_rubiks_cube.html']) {
    const html=load(page);
    assert.equal((html.match(/gtag\('config', 'G-7BKPPQVQWR'/g) ?? []).length,1);
    assert.equal((html.match(/gtag\('event', 'page_view'/g) ?? []).length,0);
  }
});

test('Tetris interaction handlers exclude gravity, idle mouse, guide, shortcuts, and secondary button', () => {
  const html = load('chemistry_tetris.html');
  const controls = html.slice(html.indexOf('  // 操控函式'), html.indexOf("  document.getElementById('btn-back-to-lobby').addEventListener"));
  const boardListeners = {}, keyListeners = {}, buttonListeners = {};
  const { a, events } = setup();
  const buttons = new Map();
  let guideOpen = false, gameOver = false, blocked = false;
  const current = {x:0,y:0,matrix:[[1]]};
  const document = {
    hidden:false,
    getElementById(id) {
      if (id==='guide-modal') return {classList:{contains:()=>guideOpen}};
      if (id==='hold-canvas') return {parentElement:{addEventListener:(ev, fn)=>buttonListeners['hold-'+ev]=fn}};
      if (!buttons.has(id)) buttons.set(id,{addEventListener:(ev,fn)=>buttonListeners[id+'-'+ev]=fn});
      return buttons.get(id);
    }
  };
  const c = {
    document, current, gameOver, cellSize:20, collide:()=>false, lockPiece(){}, beep(){},
    rotateMatrix:matrix=>matrix, holdCurrent:()=>a.start('chemistry_tetris'),
    boardCanvas:{addEventListener:(ev,fn)=>boardListeners[ev]=fn,setPointerCapture(){}},
    window:{GameAnalytics:a,GameScores:{get blocked() {return blocked;}},addEventListener:(ev,fn)=>keyListeners[ev]=fn}
  };
  runInNewContext(controls + '\nglobalThis.dropFromGravity=()=>softDrop(true);',c);
  c.dropFromGravity();
  boardListeners.pointermove({pointerId:2,clientX:300,clientY:160}); // No pointerdown.
  keyListeners.keydown({key:'c',metaKey:true});
  keyListeners.keydown({key:'z'});
  guideOpen=true; keyListeners.keydown({key:'ArrowLeft'}); guideOpen=false;
  blocked=true; keyListeners.keydown({key:'ArrowRight'}); blocked=false;
  buttonListeners['btn-left-pointerdown']({button:2,preventDefault(){}});
  assert.equal(events.length,0);
  assert.deepEqual([current.x,current.y],[0,1]);
  keyListeners.keydown({key:'ArrowLeft'});
  keyListeners.keydown({key:'ArrowRight'});
  assert.deepEqual(events.map(e=>e.name), ['game_start']);
  a.end('chemistry_tetris',{outcome:'gameover'});
  boardListeners.pointerdown({button:0,pointerId:2,clientX:10,clientY:10});
  boardListeners.pointermove({pointerId:2,clientX:40,clientY:10});
  boardListeners.pointerup({pointerId:2,clientX:40,clientY:10});
  assert.deepEqual(events.map(e=>e.name), ['game_start','game_end','game_start','game_replay']);
});

test('Tetris emits first craft from recipe removals, not ordinary line clear', () => {
  const html = load('chemistry_tetris.html');
  const resolve = html.slice(html.indexOf('  function resolveBoard('), html.indexOf('  function spawnPiece('));
  const { a, events } = setup();
  const c = {
    window:{GameAnalytics:a}, document:{getElementById:()=>({})}, navigator:{},
    ROWS:3,COLS:3,score:0,lines:0,RECIPES:[{name:'H₂O',req:{H:2,O:1},pts:200}],
    showBanner(){},beep(){},grid:[
      [null,null,null],[null,null,null],[{sym:'C'},{sym:'C'},{sym:'C'}]
    ]
  };
  runInNewContext(resolve,c);
  a.start('chemistry_tetris');
  c.resolveBoard(1); assert.equal(c.lines,1);
  assert.deepEqual(events.map(e=>e.name),['game_start']);
  c.grid[2][0]={sym:'H'};c.grid[2][1]={sym:'H'};c.grid[1][0]={sym:'O'};
  c.resolveBoard(1);
  assert.deepEqual(events.map(e=>e.name),['game_start','first_craft']);
});

test('Cube counts player turns, not programmatic slices; shuffle ends only an existing session', () => {
  const html = load('chemistry_rubiks_cube.html');
  const rotate = html.slice(html.indexOf('  function rotateSlice('), html.indexOf('  // 檢查 6 個面'));
  const scramble = html.slice(html.indexOf("  document.getElementById('btn-scramble').addEventListener"),
    html.indexOf("  document.getElementById('btn-back-to-lobby').addEventListener"));
  const { a, events } = setup();
  let onScramble;
  const c = {
    window:{GameAnalytics:a}, document:{getElementById:()=>({addEventListener:(_ev,fn)=>{onScramble=fn;}})},
    THREE:{Object3D:class{ rotation={}; updateMatrixWorld(){} }},
    cubeGroup:{add(){},remove(){}}, cubies:[], moveHistory:[], moves:0, gap:1, isAnimating:false,
    updateUI(){},checkMatches(){},playTone(){},performance:{now:()=>0},
    requestAnimationFrame:fn=>fn(250),setInterval(){}
  };
  runInNewContext(rotate+scramble,c);
  onScramble();
  c.rotateSlice('x',0,1,false,true);
  c.rotateSlice('x',0,-1,false,false);
  assert.equal(events.length,0);
  c.rotateSlice('x',0,1,true,false);
  c.rotateSlice('x',0,1,true,false);
  onScramble();
  c.rotateSlice('x',0,1,true,false);
  assert.deepEqual(events.map(e=>e.name),['game_start','game_end','game_start','game_replay']);
  assert.equal(events[1].game_outcome,'restart');
});
