// Run with Playwright + Chromium installed and THREE_R128 pointing to the same
// local Three.js asset used by the Cube page. No browser traffic leaves the test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { resolve, extname } = require('node:path');

const origin = 'https://wuenhouse.com';
const root = resolve(__dirname, '..');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript',
  '.mjs':'text/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp' };
const threeURL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const game = 'chemistry_tetris';

async function main() {
  const three = await readFile(process.env.THREE_R128);
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH,
    args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
  try {
    const context = await browser.newContext({viewport:{width:800,height:900}});
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.href === threeURL) return route.fulfill({contentType:'text/javascript', body:three});
      if (url.origin !== origin) return route.abort();
      const filename = resolve(root, '.'+url.pathname);
      if (!filename.startsWith(root+'/')) return route.abort();
      try {
        const body = await readFile(filename);
        await route.fulfill({contentType:mime[extname(filename)] ?? 'application/octet-stream', body});
      } catch { await route.fulfill({status:404, body:'not found'}); }
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const events = () => page.evaluate(() => window.dataLayer.filter(x => x[0] === 'event')
      .map(x => ({name:x[1], ...x[2]})));
    const names = async () => (await events()).map(e => e.name);
    await page.goto(origin+'/index.html');
    const links = page.locator('[data-game-select]');
    assert.equal(await links.count(),3);
    await links.evaluateAll(nodes => nodes.forEach(node => node.addEventListener('click', ev => ev.preventDefault())));
    for (const link of await links.all()) await link.click();
    assert.deepEqual((await events()).map(e=>e.game_id),
      ['chemistry_arpg','chemistry_rubiks_cube','chemistry_tetris']);
    assert.deepEqual(await names(), Array(3).fill('game_select'));
    console.log('PASS: the three real lobby links emit the expected game selections');

    await page.goto(origin+'/chemistry_tetris.html');
    await page.waitForTimeout(1150); // at least one automatic fall
    assert.deepEqual(await names(), ['game_enter']);
    await page.keyboard.press('q');
    await page.hover('#board');
    await page.locator('#btn-guide').click();
    await page.keyboard.press('ArrowUp');
    assert.deepEqual(await names(), ['game_enter']);
    await page.locator('#btn-close-guide').click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await names(), ['game_enter','game_start']);
    for (let i=0;i<80 && !(await page.locator('#gameover-modal').isVisible());i++) {
      await page.keyboard.press('Space');
    }
    assert.equal(await page.locator('#gameover-modal').isVisible(),true);
    assert.equal((await events()).find(e=>e.name==='game_end').game_outcome,'gameover');
    const gameEndsBefore = (await names()).filter(n=>n==='game_end').length;
    await page.locator('#btn-restart').click();
    assert.notEqual((await names()).at(-1),'game_replay');
    await page.locator('#btn-left').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',isPrimary:true,button:0});
    assert.deepEqual((await names()).slice(-2), ['game_start','game_replay']);
    assert.equal((await names()).filter(n=>n==='game_end').length,gameEndsBefore);
    assert.ok((await events()).every(e=>e.game_id===game));
    console.log('PASS: Tetris gravity, hover and guide do not count; keyboard start, game over and resumed touch input count');

    await page.goto(origin+'/chemistry_rubiks_cube.html');
    const canvas = page.locator('#canvas-container canvas');
    await canvas.waitFor();
    await page.locator('#btn-reset-view').click();
    await page.locator('#btn-scramble').click();
    await page.waitForTimeout(2500);
    assert.deepEqual(await names(), ['game_enter']);
    const turn = async () => {
      const {x,y,width,height} = await canvas.boundingBox();
      await page.mouse.move(x+width/2,y+height/2);
      await page.mouse.down();
      await page.mouse.move(x+width/2+65,y+height/2+5,{steps:5});
      await page.mouse.up();
      await page.waitForTimeout(400);
    };
    await turn();
    assert.ok((await names()).includes('game_start'));
    assert.ok(!(await names()).includes('game_replay'));
    await page.locator('#btn-scramble').click();
    await page.waitForTimeout(2500);
    assert.equal((await events()).find(e=>e.name==='game_end').game_outcome,'restart');
    await turn();
    assert.ok((await names()).includes('game_replay'));
    assert.ok((await events()).every(e=>e.game_id==='chemistry_rubiks_cube'));
    console.log('PASS: Cube camera and scrambling are not starts; an actual slice turn starts and confirms replay');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
