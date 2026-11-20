import { firebaseConfig } from './firebase-config.js';
import { hasFirebaseConfig, requireGame, prepareMessage } from './feedback-data.mjs';

export const isConfigured = () => hasFirebaseConfig(firebaseConfig);
let connection;
async function connect() {
  if (!isConfigured()) throw new Error('討論區尚未開放，請稍後再來。');
  if (!connection) {
    connection = (async () => {
      const [appSDK, authSDK, dbSDK] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js')
      ]);
      const app = appSDK.initializeApp(firebaseConfig, 'game-feedback');
      const auth = authSDK.getAuth(app);
      await auth.authStateReady();
      if (!auth.currentUser) await authSDK.signInAnonymously(auth);
      return { auth, db: dbSDK.getDatabase(app), sdk: dbSDK };
    })().catch(error => { connection = undefined; throw error; });
  }
  return connection;
}
function rows(snapshot) {
  const values = [];
  snapshot.forEach(child => { values.push({ ...child.val(), id: child.key }); });
  return values;
}
export async function loadThreads(game) {
  requireGame(game);
  const { db, sdk } = await connect();
  return rows(await sdk.get(sdk.query(sdk.ref(db, `feedback/${game}/threads`),
    sdk.orderByChild('createdAt'), sdk.limitToLast(20)))).reverse();
}
export async function loadReplies(game, threadId) {
  requireGame(game);
  if (!/^[A-Za-z0-9_-]+$/.test(threadId)) throw new Error('無效的討論主題');
  const { db, sdk } = await connect();
  return rows(await sdk.get(sdk.query(sdk.ref(db, `feedback/${game}/replies/${threadId}`),
    sdk.orderByChild('createdAt'))));
}
export async function postMessage(game, author, message, threadId = null) {
  requireGame(game);
  const content = prepareMessage(author, message);
  if (threadId !== null && !/^[A-Za-z0-9_-]+$/.test(threadId)) throw new Error('無效的討論主題');
  const { auth, db, sdk } = await connect();
  const path = threadId ? `feedback/${game}/replies/${threadId}` : `feedback/${game}/threads`;
  await sdk.push(sdk.ref(db, path), { ...content, uid: auth.currentUser.uid, createdAt: sdk.serverTimestamp() });
}
