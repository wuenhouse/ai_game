import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function boot(languages, saved, blocked = false) {
  const window = {};
  const context = { window, navigator: { languages }, localStorage: {
    getItem: () => { if (blocked) throw Error('blocked'); return saved; },
    setItem: () => { if (blocked) throw Error('blocked'); },
  }};
  runInNewContext(readFileSync(new URL('../js/translations.js', import.meta.url), 'utf8'), context);
  runInNewContext(readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8'), context);
  return window.GameI18n;
}
test('語系優先使用選擇，其次瀏覽器偏好，未知語言 fallback 繁中', () => {
  assert.equal(boot(['en-US'],'ja').locale,'ja');
  assert.equal(boot(['fr-FR','ja-JP']).locale,'ja');
  assert.equal(boot(['zh-CN','en']).locale,'zh-Hant');
  assert.equal(boot(['fr-FR']).locale,'zh-Hant');
  assert.equal(boot(['en-GB'],null,true).locale,'en');
});
test('三語詞庫完整，翻譯保留數值、化學式與來回切換', () => {
  const api = boot(['en']);
  assert.equal(api.t('元素獵人'),'Element Hunter');
  assert.equal(api.t('最終實驗分數：2500'),'Final score: 2500');
  assert.equal(api.t('二氧化碳 (CO₂)'),'Carbon dioxide (CO₂)');
  api.setLocale('ja'); assert.equal(api.t('元素獵人'),'元素ハンター');
  api.setLocale('zh-Hant'); assert.equal(api.t('元素獵人'),'元素獵人');
  assert.throws(() => api.setLocale('fr'));
  for (const [key, values] of Object.entries(api.catalog)) {
    assert.equal(values.length,2,key); assert.ok(values[0] && values[1],key);
  }
});

test('新手任務、材料不足及結算可切換三語且保留化學式與數量', () => {
  const api = boot(['en']);
  assert.equal(api.t('1/4 · 收集原子'), '1/4 · Collect atoms');
  assert.match(api.t('H₂O：2 個氫原子和 1 個氧原子。這是分子組成，不是實驗步驟。'), /H₂O has 2 hydrogen atoms and 1 oxygen atom/);
  assert.equal(api.t('O：0/1 (缺少 1)'), 'O：0/1 (need 1)');
  assert.equal(api.t('入門任務完成！'), 'Guided adventure complete!');
  api.setLocale('ja');
  assert.equal(api.t('使用 H₂O 技能'), 'H₂Oスキルを使う');
  assert.equal(api.t('4/4 · 抵達出口'), '4/4 · 出口にたどり着く');
  api.setLocale('zh-Hant');
  assert.equal(api.t('輔助戰鬥'), '輔助戰鬥');
});
