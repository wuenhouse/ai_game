import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('魔術方塊 Canvas 元素名稱使用目前語系，切換時僅更新貼圖並釋放舊貼圖', () => {
  const source = readFileSync(new URL('../chemistry_rubiks_cube.html',import.meta.url),'utf8');
  const code = source.slice(source.indexOf('  function createStickerTexture('),source.indexOf('  const innerMat ='));
  let locale='en'; const listeners={};
  const context={
    ELEMENTS:[{sym:'H',name:'氫 (1)',color:'#fff'}],
    window:{GameI18n:{t:()=>locale==='en'?'Hydrogen (1)':'水素 (1)'},addEventListener:(key,fn)=>{listeners[key]=fn;}},
    document:{createElement:()=>{
      const labels=[];
      return {labels,getContext:()=>({fillRect(){},beginPath(){},roundRect(){},fill(){},stroke(){},fillText:text=>labels.push(text)})};
    }},
    THREE:{CanvasTexture:class {constructor(canvas){this.canvas=canvas;}dispose(){this.disposed=true;}},MeshStandardMaterial:class {constructor(options){Object.assign(this,options);}}},
  };
  runInNewContext(code+'\nglobalThis.materials=stickerMaterials;',context);
  const material=context.materials[0],original=material.map;
  assert.deepEqual(original.canvas.labels,['H','Hydrogen (1)']);
  locale='ja'; listeners.languagechange();
  assert.equal(context.materials[0],material);
  assert.equal(original.disposed,true);
  assert.deepEqual(material.map.canvas.labels,['H','水素 (1)']);
  assert.equal(material.needsUpdate,true);
});
