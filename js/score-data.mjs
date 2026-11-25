export const SCORE_GAMES = ['chemistry_tetris', 'chemistry_arpg'];
export function requireScoreGame(game) {
  if (!SCORE_GAMES.includes(game)) throw new Error('Unsupported game');
  return game;
}
export function prepareScore(run, nickname, language) {
  requireScoreGame(run.game);
  if (typeof run.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(run.id)) throw new Error('Invalid run');
  if (typeof nickname !== 'string' || !nickname.trim() || nickname.trim().length > 20) throw new Error('暱稱請填寫 1～20 字。');
  if (!Number.isInteger(run.score) || run.score < 0 || run.score > 1e9) throw new Error('無效的成績。');
  if (!Number.isInteger(run.durationMs) || run.durationMs < 0 || run.durationMs > 604800000) throw new Error('無效的遊玩時間。');
  if (!['zh-Hant', 'en', 'ja'].includes(language)) throw new Error('Invalid language');
  if (run.version !== '2026-11-25.1') throw new Error('Invalid version');
  if (run.game === 'chemistry_tetris' ? run.reason !== 'gameover' || run.hero !== 'none'
    : !['death', 'victory'].includes(run.reason) || !['mage', 'archer'].includes(run.hero)) throw new Error('Invalid result');
  return { nickname: nickname.trim(), score: run.score, durationMs: run.durationMs,
    language, version: run.version, reason: run.reason, hero: run.hero };
}
export function rankScores(rows) {
  return rows.slice().sort((a, b) => b.score - a.score || a.createdAt - b.createdAt || a.uid.localeCompare(b.uid)).slice(0, 20);
}
export async function withDeadline(operation, timeoutMs = 15000) {
  let timer;
  try {
    return await Promise.race([operation, new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error('Unconfirmed score operation'), { code: 'score/timeout' })), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}
