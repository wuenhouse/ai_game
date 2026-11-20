import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../chemistry_arpg.html', import.meta.url), 'utf8');
function setup() {
  const handlers = {}, windowHandlers = {}, documentHandlers = {};
  const ctx = new Proxy({}, { get: () => () => {} });
  const canvas = {
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 100 }),
    addEventListener: (name, fn) => { handlers[name] = fn; },
    setPointerCapture() {},
  };
  const keys = {}, player = {};
  const sandbox = { keys, player,
    document: { getElementById: () => canvas, hidden: false,
      body: { classList: { add() {} } },
      addEventListener: (name, fn) => { documentHandlers[name] = fn; } },
    window: { addEventListener: (name, fn) => { windowHandlers[name] = fn; } },
  };
  vm.runInNewContext(html.split('// === VIRTUAL JOYSTICK ===')[1].split('// === MOBILE ACTION BUTTONS ===')[0], sandbox);
  const send = (name, id, x, y) => {
    assert.equal(typeof handlers[name], 'function', `缺少 ${name} 處理`);
    handlers[name]({ pointerId: id, pointerType: 'touch', clientX: x, clientY: y, preventDefault() {} });
  };
  return { send, keys, player, windowHandlers, documentHandlers, sandbox };
}
test('縮放後的搖桿仍可控制方向，放開歸零', () => {
  const s = setup();
  s.send('pointerdown', 1, 100, 70);
  assert.equal(s.keys.right, true);
  s.send('pointermove', 1, 60, 30);
  assert.equal(s.keys.up, true);
  assert.equal(s.keys.right, false);
  s.send('pointerup', 1, 60, 30);
  assert.ok(Object.values(s.keys).every(v => v === false));
});
test('其他手指不會搶走方向或提前終止移動', () => {
  const s = setup();
  s.send('pointerdown', 1, 100, 70);
  s.send('pointerdown', 2, 20, 70);
  s.send('pointerup', 2, 20, 70);
  assert.equal(s.keys.right, true);
  s.send('pointercancel', 1, 100, 70);
  assert.ok(Object.values(s.keys).every(v => v === false));
});
test('失去指標捕捉、視窗焦點或切至背景會停止移動', () => {
  const s = setup();
  for (const reset of [() => s.send('lostpointercapture', 1, 100, 70),
    () => s.windowHandlers.blur(),
    () => { s.sandbox.document.hidden = true; s.documentHandlers.visibilitychange(); }]) {
    s.send('pointerdown', 1, 100, 70);
    assert.equal(s.keys.right, true);
    reset();
    assert.ok(Object.values(s.keys).every(v => v === false));
  }
});
