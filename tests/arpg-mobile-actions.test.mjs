import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../chemistry_arpg.html', import.meta.url), 'utf8');
function setup() {
  const handlers = {}, casts = [], notices = [];
  let attacks = 0, shots = 0, updates = 0;
  const sandbox = {
    document: { getElementById: id => ({ addEventListener: (event, fn) => { handlers[id + ':' + event] = fn; } }) },
    state: { screen: 'play', paused: false }, equippedSkills: ['water', 'fire', null, null],
    RECIPES: [{ id: 'water' }, { id: 'fire' }], selectedSkillSlot: 0,
    isArcher: () => false, updateHUD: () => updates++, showToast: text => notices.push(text),
    useSkill: slot => casts.push(slot), meleeAttack: () => attacks++, shootProjectile: () => shots++,
  };
  const slots = html.split('// === SKILL BUTTON HANDLERS (mobile) ===')[1].split('// === MENU BUTTON HANDLERS ===')[0];
  const actions = html.split('// === MOBILE ACTION BUTTONS ===')[1].split('// === MINIMAP ===')[0];
  vm.runInNewContext(slots + '\n' + actions, sandbox);
  return { sandbox, casts, notices, handlers, count: () => ({ attacks, shots, updates }) };
}
test('點技能格只選招，大圓鈕施放目前選招一次', () => {
  const s = setup();
  s.handlers['sk2:click']();
  assert.deepEqual(s.casts, []);
  assert.equal(s.sandbox.selectedSkillSlot, 1);
  assert.equal(s.count().updates, 1);
  assert.equal(typeof s.handlers['btn-skill:click'], 'function');
  s.handlers['btn-skill:click']();
  assert.deepEqual(s.casts, [1]);
});
test('鎖定技能不改變選招；普通攻擊與元素彈各自觸發', () => {
  const s = setup();
  s.handlers['sk3:click']();
  assert.equal(s.sandbox.selectedSkillSlot, 0);
  assert.equal(s.notices.length, 1);
  assert.deepEqual(s.casts, []);
  s.handlers['btn-atk:click']({ pointerType: 'mouse', detail: 1 });
  s.handlers['btn-shoot:click']();
  assert.deepEqual(s.count(), { attacks: 1, shots: 1, updates: 0 });
});
