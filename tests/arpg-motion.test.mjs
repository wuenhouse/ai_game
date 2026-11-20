import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../chemistry_arpg.html', import.meta.url), 'utf8');
const playerCode = html.split('// === PLAYER ===')[1].split('  const DIR_ARROWS')[0];
const damageCode = html.slice(html.indexOf('  function damagePlayer('), html.indexOf('  function killMonster('));
const angles = html.match(/const DIR_ANGLE = .*;/)[0];

function setup(solid = () => false) {
  const COLS = 16, ROWS = 12;
  const TILE = { FLOOR: 0, WALL: 1, ROCK: 2, WATER: 4 };
  const tiles = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => solid(x, y, TILE) || TILE.FLOOR));
  const state = { mapX: 0, mapY: 0 };
  const calls = [];
  const scope = { COLS, ROWS, TILE, state, rooms: [[{ tiles }]], castVisuals: [],
    transitionRoom: (x, y) => (calls.push([x, y]), true),
    playTone() {}, playerDeath() { state.dead = true; } };
  vm.runInNewContext(
    [angles, playerCode, damageCode, 'initPlayer(); globalThis.api = {player, keys, updatePlayer, damagePlayer};'].join('\n'),
    scope
  );
  return { ...scope.api, calls, state };
}

function finishPush(p, step) {
  for (let i = 0; p.player.knockback && i < 30; i++) p.updatePlayer(step);
  assert.equal(p.player.knockback, null);
}

test('走路依實際距離換格；停下或走不動回到待機', () => {
  const p = setup((x, y, tile) => x === 9 ? tile.WALL : 0);
  p.keys.right = true;
  p.updatePlayer(0.05);
  assert.equal(p.player.walking, true);
  assert.equal(p.player.dir, 'right');
  assert.ok(p.player.walkPhase > 0);
  p.updatePlayer(0.05);
  assert.ok(Math.floor(p.player.walkPhase) >= 1);
  p.keys.right = false;
  p.updatePlayer(0.02);
  assert.equal(p.player.walkPhase, 0);
  assert.equal(p.player.walking, false);
  p.player.x = 8.64;
  p.keys.right = true;
  p.updatePlayer(0.03);
  assert.equal(p.player.x, 8.64);
  assert.equal(p.player.walking, false);
});

test('撞怪往反方向退後，不因 FPS 改變後退距離', () => {
  for (const frameTime of [1 / 120, 1 / 60, 0.05]) {
    const p = setup();
    const start = p.player.x;
    p.keys.left = true;
    p.damagePlayer(3, { x: start - 0.5, y: p.player.y });
    assert.equal(p.player.hp, 47);
    assert.equal(p.player.hurtDir, 'left');
    assert.equal(p.player.walking, false);
    finishPush(p, frameTime);
    assert.ok(Math.abs(p.player.x - start - 0.65) < 0.00001);
    assert.ok(p.player.invincible > 0);
    p.updatePlayer(0.03);
    assert.equal(p.player.walking, true);
  }
});

test('後退不能穿越牆、岩石、水或自動跨房', () => {
  for (const tile of ['WALL', 'ROCK', 'WATER']) {
    const p = setup((x, y, tiles) => x === 9 ? tiles[tile] : 0);
    p.player.x = 8.6;
    p.damagePlayer(2, { x: 8.1, y: p.player.y });
    finishPush(p, 0.05);
    assert.ok(p.player.x <= 8.65);
  }
  const p = setup();
  p.player.x = 15;
  p.damagePlayer(3, { x: 14.5, y: p.player.y });
  finishPush(p, 0.025);
  assert.deepEqual(p.calls, []);
  p.keys.right = true;
  p.updatePlayer(0.01);
  assert.deepEqual(p.calls, [[1, 0]]);
  assert.equal(p.player.hurtTimer, 0);
});

test('護盾與無敵期不受擊；子彈可受擊但不新增位移', () => {
  const p = setup();
  const enemy = { x: p.player.x, y: p.player.y };
  p.player.shieldTimer = 1;
  p.damagePlayer(2, enemy);
  assert.equal(p.player.hp, 50);
  assert.equal(p.player.knockback, null);
  p.player.shieldTimer = 0;
  p.damagePlayer(2);
  assert.equal(p.player.hp, 48);
  assert.ok(p.player.hurtTimer > 0);
  assert.equal(p.player.knockback, null);
  p.damagePlayer(2, enemy);
  assert.equal(p.player.hp, 48);
  assert.equal(p.player.knockback, null);
});
