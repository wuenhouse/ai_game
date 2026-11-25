import { connect, getWriter } from './feedback-store.js?v=20261125-2';
import { prepareScore, requireScoreGame, rankScores } from './score-data.mjs?v=20261125-2';

const pendingRuns = new Map();
// Keep an unacknowledged SDK write alive after the UI timeout. Retrying waits
// for that same server acknowledgement, never an optimistic cached record.
export async function submitScore(run, nickname, language) {
  const key = `${run.game}/${run.id}`;
  if (pendingRuns.has(key)) return pendingRuns.get(key);
  const operation = saveScore(run, nickname, language).finally(() => pendingRuns.delete(key));
  pendingRuns.set(key, operation);
  return operation;
}
// Fixed run ID + create-only rules make retries safe after a lost response.
async function saveScore(run, nickname, language) {
  const row = prepareScore(run, nickname, language);
  const { auth, authSDK, db, sdk } = await connect();
  const user = await getWriter(auth, authSDK);
  const path = `scoreRuns/${run.game}/${user.uid}/${run.id}`;
  const existing = await sdk.get(sdk.ref(db, path));
  if (existing.exists()) return { alreadySaved: true };
  const latest = await sdk.get(sdk.ref(db, `scoreLatest/${user.uid}`));
  // .info is local SDK state; a server get() cannot read this path.
  const offset = await new Promise(resolve => {
    sdk.onValue(sdk.ref(db, '.info/serverTimeOffset'), snapshot => resolve(snapshot.val() || 0),
      () => resolve(0), { onlyOnce: true });
  });
  if (latest.exists() && Date.now() + offset < latest.val().at + 5000) {
    throw Object.assign(new Error('送出太快，請稍候幾秒再試。'), { code: 'score/cooldown' });
  }
  const bestPath = `leaderboards/${run.game}/${user.uid}`;
  const best = await sdk.get(sdk.ref(db, bestPath));
  const createdAt = sdk.serverTimestamp();
  const updates = {
    [path]: { ...row, createdAt },
    [`scoreLatest/${user.uid}`]: { game: run.game, runId: run.id, at: createdAt },
  };
  if (!best.exists() || row.score > best.val().score) {
    updates[bestPath] = { nickname: row.nickname, score: row.score, createdAt, runId: run.id };
  }
  await sdk.update(sdk.ref(db), updates);
  return { alreadySaved: false };
}

export async function loadLeaderboard(game) {
  requireScoreGame(game);
  const { db, sdk } = await connect();
  const data = await sdk.get(sdk.query(sdk.ref(db, `leaderboards/${game}`), sdk.orderByChild('score'), sdk.limitToLast(20)));
  const rows = [];
  data.forEach(child => { rows.push({ uid: child.key, ...child.val() }); });
  return rankScores(rows);
}
