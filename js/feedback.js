import { GAME_NAMES } from './feedback-data.mjs';
import { isConfigured, loadThreads, loadReplies, postMessage } from './feedback-store.js';

const dialog = document.getElementById('feedback-dialog');
const list = document.getElementById('feedback-list');
const status = document.getElementById('feedback-status');
const form = document.getElementById('feedback-form');
const authorInput = document.getElementById('feedback-author');
const messageInput = document.getElementById('feedback-message');
const submit = form.querySelector('button[type="submit"]');
const refresh = document.getElementById('feedback-refresh');
let currentGame, revision = 0;
let busy = false;
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function describeError(error) {
  if (error.code === 'auth/operation-not-allowed') return '討論區暫時無法登入，請稍後重試。';
  if (String(error.code).toLowerCase().includes('permission')) return '目前無法讀寫討論區，請稍後重試。';
  return '連線失敗，請檢查網路並重試。';
}
function renderMessage(message) {
  const item = node('article', undefined, 'discussion-message');
  const date = new Date(message.createdAt);
  item.append(node('div', `${message.author} · ${Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-TW')}`, 'discussion-meta'),
    node('p', message.message, 'discussion-text'));
  return item;
}
function renderThread(thread, game, token) {
  const item = renderMessage(thread);
  const details = node('details');
  const summary = node('summary', '查看回覆／回覆此主題');
  const replies = node('div', undefined, 'discussion-replies');
  const replyForm = node('form');
  replyForm.noValidate = true;
  const label = node('label', '你的回覆（最多 1000 字）');
  const input = node('textarea');
  input.name = 'reply'; input.maxLength = 1000; input.rows = 3;
  label.append(input);
  const button = node('button', '送出回覆', 'feedback-action'); button.type = 'submit';
  const note = node('p', '', 'discussion-meta'); note.setAttribute('role', 'status');
  replyForm.append(label, button, note);
  let loaded = false, loading = false;
  async function readReplies() {
    if (loading) return;
    loading = true;
    note.textContent = '讀取回覆中…';
    try {
      const data = await loadReplies(game, thread.id);
      if (revision !== token) return;
      replies.replaceChildren(...data.map(renderMessage));
      note.textContent = data.length ? '' : '還沒有回覆。';
      loaded = true;
    } catch (error) { note.textContent = describeError(error) + ' 關閉再展開可重試。'; }
    finally { loading = false; }
  }
  details.addEventListener('toggle', () => { if (details.open && !loaded) readReplies(); });
  replyForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    let content = input.value;
    if (!authorInput.value.trim() || authorInput.value.trim().length > 20) {
      note.textContent = '請先在上方填寫 1～20 字的暱稱。'; authorInput.focus(); return;
    }
    if (!content.trim() || content.trim().length > 1000) {
      note.textContent = '回覆請填寫 1～1000 字。'; input.focus(); return;
    }
    button.disabled = true;
    note.textContent = '回覆送出中…';
    try {
      await postMessage(game, authorInput.value, content, thread.id);
      input.value = '';
      await readReplies();
      if (revision === token) note.textContent = '回覆已送出。';
    } catch (error) { note.textContent = describeError(error); }
    finally { button.disabled = false; }
  });
  details.append(summary, replies, replyForm); item.append(details);
  return item;
}
async function reload() {
  const game = currentGame, token = ++revision;
  refresh.disabled = true; list.replaceChildren();
  status.textContent = '讀取討論中…';
  try {
    const threads = await loadThreads(game);
    if (revision !== token) return;
    list.replaceChildren(...threads.map(thread => renderThread(thread, game, token)));
    status.textContent = threads.length ? '顯示最新 20 則主題，舊紀錄仍會保留。' : '還沒有討論，歡迎提出第一個問題！';
  } catch (error) { if (revision === token) status.textContent = describeError(error); }
  finally { if (revision === token) refresh.disabled = false; }
}
document.querySelectorAll('[data-feedback-game]').forEach(button => {
  button.addEventListener('click', () => {
    currentGame = button.dataset.feedbackGame;
    document.getElementById('feedback-title').textContent = `${GAME_NAMES[currentGame]}｜意見與討論`;
    messageInput.value = '';
    const configured = isConfigured();
    submit.disabled = !configured || busy;
    refresh.hidden = !configured;
    dialog.showModal();
    if (configured) reload();
    else { revision++; list.replaceChildren(); status.textContent = '討論區尚未開放，請稍後再來。'; }
  });
});
document.getElementById('feedback-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { revision++; });
refresh.addEventListener('click', reload);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !isConfigured()) return;
  const game = currentGame, token = revision;
  const author = authorInput.value, message = messageInput.value;
  if (!author.trim() || author.trim().length > 20) { status.textContent = '暱稱請填寫 1～20 字。'; authorInput.focus(); return; }
  if (!message.trim() || message.trim().length > 1000) { status.textContent = '內容請填寫 1～1000 字。'; messageInput.focus(); return; }
  busy = true; submit.disabled = true; status.textContent = '主題送出中…';
  try {
    await postMessage(game, author, message);
    if (revision === token && dialog.open) {
      messageInput.value = '';
      await reload();
      if (dialog.open && currentGame === game) status.textContent = '主題已送出。';
    }
  } catch (error) { if (revision === token) status.textContent = describeError(error); }
  finally { busy = false; submit.disabled = !isConfigured(); }
});
