"""Optional browser acceptance: python3 tests/arpg-intro-browser.py (Playwright + Chromium)."""
from pathlib import Path
import mimetypes
import os
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://wuenhouse.com"
PATH = "/chemistry_arpg.html"
SOURCE = (ROOT / PATH[1:]).read_text().replace(
    "  // === INIT ===",
    """  window.qaMission = () => ({
      x:player.x, y:player.y, mapX:state.mapX, screen:state.screen,
      target:missionTarget(), phase:mission?.phase, hp:player.hp, mp:player.mp,
      H:inventory.H, O:inventory.O, score:window.GameScores.latest?.score
    });
    // === INIT ===""",
)

def offline_route(route):
    url = urlsplit(route.request.url)
    if url.netloc != "wuenhouse.com":
        return route.abort()
    if url.path == PATH:
        return route.fulfill(body=SOURCE, content_type="text/html; charset=utf-8")
    file = (ROOT / url.path.lstrip("/")).resolve()
    if ROOT not in file.parents or not file.is_file():
        return route.abort()
    return route.fulfill(path=file, content_type=mimetypes.guess_type(file)[0] or "application/octet-stream")

def test_route(browser, hero, mobile):
    context = browser.new_context(
        viewport={"width": 390 if mobile else 1366, "height": 740 if mobile else 850},
        has_touch=mobile, is_mobile=mobile, locale="zh-TW",
    )
    context.route("**/*", offline_route)
    page = context.new_page()
    page.set_default_timeout(8000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE + PATH, wait_until="domcontentloaded")
    page.locator('#pick-' + hero).click()
    assert page.locator('#assist-title').is_checked()
    assert page.locator('#btn-intro').is_visible()
    page.locator('#btn-intro').click()
    assert page.locator('#mission-panel').is_visible()
    assert not page.locator('.run-score').is_visible()
    cdp = context.new_cdp_session(page) if mobile else None

    def status():
        return page.evaluate("qaMission()")

    def move_for(key, ms):
        if not cdp:
            page.keyboard.down(key)
            page.wait_for_timeout(ms)
            page.keyboard.up(key)
            return
        canvas = page.locator('#game').bounding_box()
        x, y = canvas['x'] + 75, canvas['y'] + min(100, canvas['height'] / 2)
        dx, dy = {'ArrowRight': (65, 0), 'ArrowLeft': (-65, 0), 'ArrowDown': (0, 65), 'ArrowUp': (0, -65)}[key]
        def send(kind, points):
            cdp.send("Input.dispatchTouchEvent", {"type":kind, "touchPoints":points})
        send('touchStart', [{'x':x,'y':y,'id':1}])
        send('touchMove', [{'x':x+dx,'y':y+dy,'id':1}])
        page.wait_for_timeout(ms)
        send('touchEnd', [])

    def step_to(x, y, until, epsilon=0.3):
        for _ in range(35):
            data = status()
            if until(data):
                return
            dx, dy = x - data['x'], y - data['y']
            delta, pos, neg = (dx, 'ArrowRight','ArrowLeft') if abs(dx) > abs(dy) else (dy,'ArrowDown','ArrowUp')
            if abs(delta) < epsilon:
                return
            move_for(pos if delta > 0 else neg, min(550, max(75, round(abs(delta) * 1000 / 4.5))))
        raise AssertionError(status())

    for _ in range(5):
        data = status()
        if data['phase'] != 'collect':
            break
        target = data['target']
        step_to(target['x'], target['y'], lambda next: next['phase'] != 'collect' or next['target'] != target)
    assert status()['phase'] == 'craft', status()
    lang = page.locator('#game-screen select[data-language-select]')
    lang.select_option('en')
    page.get_by_text('2/4 · Make a water molecule', exact=True).wait_for()
    page.get_by_role('button', name='Make H₂O').click()
    assert page.locator('#toast').inner_text().startswith('H₂O has 2 hydrogen')
    lang.select_option('ja')
    page.get_by_text('3/4 · 回復スキルを試す' if hero == 'mage' else '3/4 · 番人を突破する', exact=True).wait_for()
    if hero == 'mage':
        injured = status()['hp']
        page.get_by_role('button',name='H₂Oスキルを使う').click()
        assert status()['hp'] > injured
    assert (status()['H'],status()['O']) == (0,0)
    lang.select_option('zh-Hant')
    step_to(15.9,6.5,lambda data: data['mapX'] == 3, epsilon=0.15)
    assert status()['mapX'] == 3, status()
    step_to(4.3,6.5,lambda d:d['phase'] == 'exit')
    page.wait_for_function("qaMission().phase === 'exit'", timeout=6000)
    step_to(12.5,6.5,lambda d:d['screen'] == 'intro-result')
    page.get_by_text('入門任務完成！',exact=True).wait_for()
    assert not page.locator('#intro-result [data-score-result]').count()
    assert page.evaluate("localStorage.getItem('chem_arpg_intro_v1')") == 'done'
    assert 'H2O' in page.evaluate("JSON.parse(localStorage.getItem('chem_arpg_save')).codex")
    events = page.evaluate("""Array.from(dataLayer).filter(e => e[0] === 'event').map(e => [e[1], e[2]])""")
    event_names = [name for name,_ in events]
    assert event_names == ['game_enter','game_start','first_move','first_pickup','first_craft','tutorial_complete','game_end'], events
    assert all(props['game_id'] == 'chemistry_arpg' for _,props in events)
    screenshot = os.environ.get('ARPG_SCREENSHOT_DIR')
    if screenshot:
        page.screenshot(path=str(Path(screenshot) / f'{hero}-intro-result.png'))
    page.locator('#btn-intro-continue').click()
    assert page.locator('.run-score').is_visible()
    assert not page.locator('#mission-panel').is_visible()
    assert 'game_replay' in page.evaluate("""Array.from(dataLayer).map(e=>e[1])""")
    assert not errors, errors
    context.close()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    test_route(browser, 'mage', False)
    print('PASS mage: desktop keyboard, three languages, no attacks pressed, local result -> classic.')
    test_route(browser, 'archer', True)
    print('PASS archer: phone viewport + touch joystick, three languages, no attacks pressed, local result -> classic.')
    browser.close()
