import { firebaseConfig } from './firebase-config.js';
import { hasFirebaseConfig, requireGame, prepareMessage, feedbackPage, FEEDBACK_PAGE_SIZE } from './feedback-data.mjs';

export const isConfigured = () => hasFirebaseConfig(firebaseConfig);
let connection, signIn;
const COOLDOWN_MS = 30_000;
let localDeadline = 0;
export const cooldownSeconds = () => Math.max(0, Math.ceil((localDeadline - performance.now()) / 1000));
function rememberCooldown(ms) {
  localDeadline = Math.max(localDeadline, performance.now() + Math.min(COOLDOWN_MS, Math.max(0, ms)));
}
function cooldownError() {
  return Object.assign(new Error('發文太快'), { code: 'feedback/cooldown' });
}
async function connect() {
  if (!isConfigured()) throw new Error('討論區尚未開放，請稍後再來。');
  if (!connection) {
    connection = (async () => {
      const [appSDK, sdk, authSDK] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js'),
        import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js')
      ]);
      const app = appSDK.initializeApp(firebaseConfig, 'game-feedback');
      return { auth: authSDK.getAuth(app), authSDK, db: sdk.getDatabase(app), sdk };
    })().catch(error => { connection = undefined; throw error; });
  }
  return connection;
}
async function getWriter(auth, authSDK) {
  // Public reads don't need to issue an anonymous account.
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  signIn ??= authSDK.signInAnonymously(auth).finally(() => { signIn = undefined; });
  return (await signIn).user;
}
function requireThreadId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('無效的討論主題');
  return id;
}
async function loadPage(path, before) {
  const { db, sdk } = await connect();
  const constraints = [sdk.orderByChild('createdAt')];
  if (before) constraints.push(sdk.endBefore(before.createdAt, before.id));
  constraints.push(sdk.limitToLast(FEEDBACK_PAGE_SIZE));
  const snapshot = await sdk.get(sdk.query(sdk.ref(db, path), ...constraints));
  const rows = [];
  snapshot.forEach(child => { rows.push({ ...child.val(), id: child.key }); });
  return feedbackPage(rows);
}
export function loadThreads(game, before = null) {
  return loadPage(`feedback/${requireGame(game)}/threads`, before);
}
export function loadReplies(game, threadId, before = null) {
  return loadPage(`feedback/${requireGame(game)}/replies/${requireThreadId(threadId)}`, before);
}
export async function loadPostingEnabled() {
  const { db, sdk } = await connect();
  const flag = await sdk.get(sdk.ref(db, 'feedbackSettings/postingEnabled'));
  return flag.val() !== false;
}
async function checkCooldownAfterRejection(sdk, db, path) {
  try {
    const [last, offset] = await Promise.all([
      sdk.get(sdk.ref(db, path)),
      sdk.get(sdk.ref(db, '.info/serverTimeOffset')).catch(() => null)
    ]);
    const at = last.val()?.at;
    if (Number.isFinite(at)) {
      const difference = offset?.val();
      const serverNow = Date.now() + (Number.isFinite(difference) ? difference : 0);
      rememberCooldown(at + COOLDOWN_MS - serverNow);
    }
  } catch {
    // If the status cannot be read, keep the original write error.
  }
}
export async function postMessage(game, author, message, threadId = null) {
  requireGame(game);
  const content = prepareMessage(author, message);
  const path = threadId === null ? `feedback/${game}/threads` : `feedback/${game}/replies/${requireThreadId(threadId)}`;
  if (cooldownSeconds()) throw cooldownError();
  const { auth, authSDK, db, sdk } = await connect();
  const user = await getWriter(auth, authSDK);
  const key = sdk.push(sdk.ref(db, path)).key;
  const throttlePath = `feedbackThrottle/${user.uid}`;
  const timestamp = sdk.serverTimestamp();
  try {
    await sdk.update(sdk.ref(db), {
      [`${path}/${key}`]: { ...content, uid: user.uid, createdAt: timestamp },
      [throttlePath]: { at: timestamp, game, thread: threadId ?? '', id: key }
    });
  } catch (error) {
    if (String(error.code).toLowerCase().includes('permission')) {
      await checkCooldownAfterRejection(sdk, db, throttlePath);
      if (cooldownSeconds()) throw cooldownError();
    }
    throw error;
  }
  rememberCooldown(COOLDOWN_MS);
}
