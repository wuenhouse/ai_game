import { GAME_NAMES } from './feedback-data.mjs';
import { isConfigured, loadThreads, loadReplies, loadPostingEnabled, postMessage, cooldownSeconds } from './feedback-store.js';

const dialog = document.getElementById('feedback-dialog');
const list = document.getElementById('feedback-list');
const status = document.getElementById('feedback-status');
const form = document.getElementById('feedback-form');
const pausedNote = document.getElementById('feedback-paused');
const cooldownNote = document.getElementById('feedback-cooldown');
const authorInput = document.getElementById('feedback-author');
const messageInput = document.getElementById('feedback-message');
const submit = form.querySelector('button[type="submit"]');
const refresh = document.getElementById('feedback-refresh');
const older = document.getElementById('feedback-older');
let currentGame, revision = 0, threadsBefore = null;
let busy = false, postingEnabled = true, cooldownTick;

function updateCooldownNote() {
  const seconds = cooldownSeconds();
  cooldownNote.hidden = !postingEnabled || !seconds;
  if (!cooldownNote.hidden) cooldownNote.textContent = `可以在 ${seconds} 秒後再發布主題或回覆。`;
}

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function describeError(error) {
  if (error.code === 'feedback/cooldown') return '發文太快了，請等倒數結束再送出。';
  if (error.code === 'auth/operation-not-allowed') return '討論區暫時無法登入，請稍後重試。';
  if (String(error.code).toLowerCase().includes('permission')) return '目前無法讀寫討論區，請稍後重試。';
  return '連線失敗，請檢查網路並重試。';
}
function setPosting(enabled) {
  postingEnabled = enabled;
  dialog.dataset.posting = enabled ? 'open' : 'paused';
  pausedNote.hidden = enabled;
  updateCooldownNote();
  form.hidden = !enabled;
  submit.disabled = !enabled || busy || !isConfigured();
}
async function refreshPosting(token) {
  try {
    const enabled = await loadPostingEnabled();
    if (revision === token) setPosting(enabled);
  } catch {
    // During a rolling release old rules don't expose this flag. Server rules
    // remain authoritative; don't break existing posting just for a failed status read.
  }
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
  const summary = node('summary', '查看回覆');
  const loadEarlier = node('button', '載入更早的回覆', 'feedback-action');
  loadEarlier.type = 'button'; loadEarlier.hidden = true;
  const replies = node('div', undefined, 'discussion-replies');
  const replyForm = node('form', undefined, 'discussion-reply-form');
  replyForm.noValidate = true;
  replyForm.setAttribute('aria-describedby', 'feedback-privacy');
  const label = node('label', '你的回覆（最多 1000 字）');
  const input = node('textarea');
  input.name = 'reply'; input.maxLength = 1000; input.rows = 3;
  label.append(input);
  const button = node('button', '送出回覆', 'feedback-action'); button.type = 'submit';
  const note = node('p', '', 'discussion-meta'); note.setAttribute('role', 'status');
  replyForm.append(label, button);
  let loaded = false, loading = false, writing = false, repliesBefore = null;
  async function readReplies(before = null) {
    if (loading || revision !== token) return;
    loading = true; button.disabled = true; loadEarlier.disabled = true;
    note.textContent = '讀取回覆中…';
    try {
      const data = await loadReplies(game, thread.id, before);
      if (revision !== token) return;
      const items = data.rows.map(renderMessage);
      if (before) replies.prepend(...items);
      else replies.replaceChildren(...items);
      repliesBefore = data.before;
      loadEarlier.hidden = !repliesBefore;
      note.textContent = data.rows.length ? '' : before ? '沒有更早的回覆了。' : '還沒有回覆。';
      loaded = true;
    } catch (error) {
      if (revision === token) note.textContent = describeError(error) + (before ? ' 可再按一次載入。' : ' 關閉再展開可重試。');
    } finally {
      loading = false;
      button.disabled = writing;
      loadEarlier.disabled = false;
    }
  }
  loadEarlier.addEventListener('click', () => { if (repliesBefore) readReplies(repliesBefore); });
  details.addEventListener('toggle', () => { if (details.open && !loaded) readReplies(); });
  replyForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!postingEnabled || button.disabled || revision !== token) return;
    const content = input.value;
    if (!authorInput.value.trim() || authorInput.value.trim().length > 20) {
      note.textContent = '請先在上方填寫 1～20 字的暱稱。'; authorInput.focus(); return;
    }
    if (!content.trim() || content.trim().length > 1000) {
      note.textContent = '回覆請填寫 1～1000 字。'; input.focus(); return;
    }
    writing = true; button.disabled = true; loadEarlier.disabled = true;
    note.textContent = '回覆送出中…';
    try {
      await postMessage(game, authorInput.value, content, thread.id);
      updateCooldownNote();
      if (revision !== token) return;
      input.value = '';
      await readReplies();
      if (revision === token) note.textContent = '回覆已送出。';
    } catch (error) {
      if (revision === token) note.textContent = describeError(error);
      updateCooldownNote();
      void refreshPosting(token);
    } finally {
      writing = false; button.disabled = loading; loadEarlier.disabled = loading;
    }
  });
  details.append(summary, loadEarlier, replies, replyForm, note); item.append(details);
  return item;
}
async function loadThreadPage(before = null) {
  const game = currentGame, token = revision;
  older.disabled = true;
  status.textContent = before ? '讀取更早的主題…' : '讀取討論中…';
  try {
    const data = await loadThreads(game, before);
    if (revision !== token) return;
    const items = data.rows.slice().reverse().map(thread => renderThread(thread, game, token));
    if (before) list.append(...items);
    else list.replaceChildren(...items);
    threadsBefore = data.before;
    older.hidden = !threadsBefore;
    status.textContent = data.rows.length ? '每次載入最多 20 則主題。'
      : before ? '沒有更早的主題了。' : '還沒有討論。';
  } catch (error) {
    if (revision === token) status.textContent = describeError(error);
  } finally {
    if (revision === token) { older.disabled = false; refresh.disabled = false; }
  }
}
async function reload() {
  const token = ++revision;
  refresh.disabled = true; older.hidden = true; threadsBefore = null;
  list.replaceChildren();
  void refreshPosting(token);
  await loadThreadPage();
  return token;
}
document.querySelectorAll('[data-feedback-game]').forEach(button => {
  button.addEventListener('click', () => {
    currentGame = button.dataset.feedbackGame;
    document.getElementById('feedback-title').textContent = `${GAME_NAMES[currentGame]}｜意見與討論`;
    messageInput.value = '';
    const configured = isConfigured();
    if (!configured) setPosting(true);
    refresh.hidden = !configured;
    dialog.showModal();
    updateCooldownNote();
    clearInterval(cooldownTick);
    cooldownTick = setInterval(updateCooldownNote, 1000);
    if (configured) reload();
    else {
      revision++; older.hidden = true; list.replaceChildren();
      status.textContent = '討論區尚未開放，請稍後再來。';
    }
  });
});
document.getElementById('feedback-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { revision++; clearInterval(cooldownTick); });
refresh.addEventListener('click', reload);
older.addEventListener('click', () => {
  if (!older.disabled && threadsBefore) loadThreadPage(threadsBefore);
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!postingEnabled || busy || !isConfigured()) return;
  const game = currentGame, token = revision;
  const author = authorInput.value, message = messageInput.value;
  if (!author.trim() || author.trim().length > 20) { status.textContent = '暱稱請填寫 1～20 字。'; authorInput.focus(); return; }
  if (!message.trim() || message.trim().length > 1000) { status.textContent = '內容請填寫 1～1000 字。'; messageInput.focus(); return; }
  busy = true; submit.disabled = true; status.textContent = '主題送出中…';
  try {
    await postMessage(game, author, message);
    updateCooldownNote();
    if (revision === token && dialog.open) {
      messageInput.value = '';
      const loadedToken = await reload();
      if (revision === loadedToken && dialog.open) status.textContent = '主題已送出。';
    }
  } catch (error) {
    if (revision === token) status.textContent = describeError(error);
    updateCooldownNote();
    void refreshPosting(token);
  } finally {
    busy = false; submit.disabled = !postingEnabled || !isConfigured();
  }
});
