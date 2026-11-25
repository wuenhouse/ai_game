import { loadLeaderboard, submitScore } from './score-store.js?v=20261125-2';
import { withDeadline } from './score-data.mjs?v=20261125-2';
const I = window.GameI18n;
const names = { chemistry_arpg: '元素獵人', chemistry_tetris: '化學俄羅斯方塊' };
const node = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
const button = (label, action) => {
  const el = node('button', label, 'platform-button'); el.type = 'button';
  el.addEventListener('click', action); return el;
};

const dialog = node('dialog', undefined, 'score-dialog');
dialog.id = 'leaderboard-dialog'; dialog.setAttribute('aria-labelledby', 'leaderboard-title');
const heading = node('h2'); heading.id = 'leaderboard-title';
const header = node('header');
const close = button('關閉', () => dialog.close());
header.append(heading, close);
const hint = node('p', '每人最高分・前 20 名', 'score-note');
const status = node('p'); status.setAttribute('role', 'status');
const table = node('table', undefined, 'score-table');
table.setAttribute('aria-label', '排行榜');
const tableHead = node('thead');
const labels = node('tr');
for (const label of ['排名', '暱稱', '分數']) { const th = node('th', label); th.scope = 'col'; labels.append(th); }
tableHead.append(labels); table.append(tableHead);
const rows = node('tbody'); table.append(rows);
const refresh = button('重新整理', () => readBoard());
dialog.append(header, hint, status, table, refresh,
  node('p', '同一瀏覽器的匿名玩家共用紀錄；換裝置或清除資料會視為新玩家。', 'score-note'));
document.body.append(dialog);
let boardGame, revision = 0;
async function readBoard() {
  const token = ++revision, game = boardGame;
  refresh.disabled = true; status.textContent = '讀取排行榜中…'; rows.replaceChildren();
  try {
    const data = await withDeadline(loadLeaderboard(game));
    if (token !== revision || !dialog.open) return;
    data.forEach((row, index) => {
      const tr = node('tr');
      const nickname = node('td', row.nickname); nickname.dataset.userContent = '';
      tr.append(node('td', String(index + 1)), nickname, node('td', row.score.toLocaleString()));
      rows.append(tr);
    });
    status.textContent = data.length ? '' : '還沒有成績，來成為第一位吧！';
  } catch {
    if (token === revision && dialog.open) status.textContent = '目前無法讀取排行榜，請稍後重試。';
  } finally { if (token === revision) refresh.disabled = false; }
}
function openBoard(game) {
  boardGame = game; heading.textContent = `${names[game]} · 排行榜`;
  dialog.showModal(); window.GameScores.blocked = true; readBoard();
}
dialog.addEventListener('close', () => { revision++; window.GameScores.blocked = false; });
document.querySelectorAll('[data-leaderboard-game]').forEach(el => {
  el.addEventListener('click', () => openBoard(el.dataset.leaderboardGame));
});

function panel(host) {
  const section = node('section', undefined, 'score-panel');
  section.hidden = true;
  const title = node('h3', '登錄分數');
  const score = node('p');
  const form = node('form'); form.noValidate = true;
  const label = node('label', '你的暱稱（最多 20 字）');
  const input = node('input'); input.type = 'text'; input.maxLength = 20;
  input.name = 'nickname'; input.autocomplete = 'nickname';
  label.append(input);
  const note = node('p', '暱稱會公開顯示，請勿填寫個人資料。', 'score-note');
  const actions = node('div', undefined, 'score-actions');
  const submit = node('button', '送出成績', 'platform-button'); submit.type = 'submit';
  const skip = button('略過登錄', () => { form.hidden = true; message.textContent = ''; });
  const board = button('排行榜', () => { if (run) openBoard(run.game); });
  actions.append(submit, skip, board); form.append(label, note, actions);
  const message = node('p'); message.setAttribute('role', 'status');
  section.append(title, score, form, message); host.append(section);
  let run, pending = false, generation = 0;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!run || pending) return;
    if (!input.value.trim() || input.value.trim().length > 20) {
      message.textContent = '暱稱請填寫 1～20 字。'; input.focus(); return;
    }
    const current = run, token = generation, language = I.locale;
    pending = true; submit.disabled = true; skip.disabled = true; input.disabled = true;
    message.textContent = '成績送出中…';
    try {
      const result = await withDeadline(submitScore(current, input.value, language));
      if (token !== generation) return;
      message.textContent = result.alreadySaved ? '這局成績已儲存。' : '成績已儲存！';
      form.hidden = true;
      message.append(' ', button('排行榜', () => openBoard(current.game)));
    } catch (error) {
      if (token !== generation) return;
      message.textContent = error.code === 'score/timeout' ? '尚未確認成績是否儲存，請檢查網路後重試。'
        : error.code === 'score/cooldown' ? '送出太快，請稍候幾秒再試。' : String(error.code).toLowerCase().includes('permission')
        ? '目前無法登錄成績，請稍後重試。' : '成績尚未儲存，請檢查網路後重試。';
    } finally {
      if (token === generation) { pending = false; submit.disabled = false; skip.disabled = false; input.disabled = false; }
    }
  });
  return {
    reset() {
      generation++; run = null; pending = false; section.hidden = true; input.value = '';
      input.disabled = false; submit.disabled = false; skip.disabled = false;
    },
    finish(value) {
      generation++; run = value; pending = false;
      section.hidden = false; form.hidden = false; message.textContent = ''; input.value = '';
      input.disabled = false; submit.disabled = false; skip.disabled = false;
      score.textContent = `本局分數：${value.score.toLocaleString()}`;
    },
  };
}
const panels = [...document.querySelectorAll('[data-score-result]')].map(host => ({
  reason: host.dataset.scoreResult, ui: panel(host),
}));
function finish(run) {
  panels.forEach(({reason,ui}) => { ui.reset(); if (reason === run.reason) ui.finish(run); });
}
window.addEventListener('game:started', () => panels.forEach(({ui}) => ui.reset()));
window.addEventListener('game:finished', event => finish(event.detail));
if (window.GameScores.latest) finish(window.GameScores.latest);
