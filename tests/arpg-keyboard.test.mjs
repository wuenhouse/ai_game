import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../chemistry_arpg.html', import.meta.url), 'utf8');
function setup() {
  const handlers = {};
  const keys = {}, state = { screen: 'play', paused: false }, skills = [];
  vm.runInNewContext(html.split('// === KEYBOARD INPUT ===')[1].split('// === BUTTON HANDLERS ===')[0], {
    window: { addEventListener: (type, fn) => { handlers[type] = fn; } },
    document:{hidden:false}, state, keys, isArcher: () => false, selectedSkillSlot: 1, useSkill: n => skills.push(n), cycleSkill() {},
  });
  const send = (type, code, key, repeat = false) => {
    let prevented = false;
    handlers[type]({ code, key, repeat, preventDefault() { prevented = true; } });
    return prevented;
  };
  return { keys, state, skills, send };
}
test('中文輸入法或其他鍵盤配置仍依 WASD 實體鍵移動與停止', () => {
  const s = setup();
  for (const [code, direction] of [['KeyW','up'],['KeyA','left'],['KeyS','down'],['KeyD','right']]) {
    assert.equal(s.send('keydown', code, 'Process'), true);
    assert.equal(s.keys[direction], true);
    s.send('keyup', code, 'Unidentified');
    assert.equal(s.keys[direction], false);
  }
});
test('方向鍵與舊式 key 事件可移動，按住重複事件不會中斷', () => {
  const s = setup();
  for (const [code, key, direction] of [['ArrowUp','ArrowUp','up'],['','A','left'],['','s','down'],['','d','right']]) {
    assert.equal(s.send('keydown', code, key), true);
    s.send('keydown', code, key, true);
    assert.equal(s.keys[direction], true);
    s.send('keyup', code, key);
    assert.equal(s.keys[direction], false);
  }
});
test('暫停時不新增移動，但放開按鍵仍會清除方向；技能單次觸發', () => {
  const s = setup();
  s.send('keydown', 'KeyW', 'Process');
  s.state.paused = true;
  s.send('keyup', 'KeyW', 'Process');
  assert.equal(s.keys.up, false);
  s.send('keydown', 'KeyD', 'Process');
  assert.ok(!s.keys.right);
  s.state.paused = false;
  s.send('keydown', 'KeyX', 'Process');
  s.send('keydown', 'KeyX', 'Process', true);
  assert.deepEqual(s.skills, [1]);
});
test('桌面可用 F 發射元素彈，中文輸入法也能觸發', () => {
  const s = setup();
  assert.equal(s.send('keydown', 'KeyF', 'Process'), true);
  assert.equal(s.keys.shoot, true);
  s.keys.shoot = false; // 遊戲 update 消耗這次發射請求。
  s.send('keydown', 'KeyF', 'Process', true);
  assert.equal(s.keys.shoot, false);
  s.send('keyup', 'KeyF', 'Process');
  assert.equal(s.keys.shoot, false);
});
