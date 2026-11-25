// Synchronous bridge: game code never waits for Firebase or network access.
(() => {
  'use strict';
  let active = null, latest = null;
  const games = ['chemistry_arpg', 'chemistry_tetris'];
  const emit = (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail }));
  window.GameScores = {
    begin(game) {
      if (!games.includes(game)) throw new Error('Unsupported game');
      active = { game, id: crypto.randomUUID(), score: 0, started: performance.now() };
      latest = null;
      emit('game:started', { game });
    },
    addKill(type) {
      if (active?.game === 'chemistry_arpg') {
        active.score += ({ slime: 10, molecular: 30, boss: 100 })[type] || 0;
      }
    },
    finish(score, reason, hero = 'none') {
      if (!active) return null;
      latest = Object.freeze({ game: active.game, id: active.id,
        score: active.game === 'chemistry_arpg' ? active.score : score,
        durationMs: Math.round(performance.now() - active.started), reason, hero, version: '2026-11-25.1' });
      active = null;
      emit('game:finished', latest);
      return latest;
    },
    get latest() { return latest; },
    get score() { return active?.score ?? latest?.score ?? 0; },
  };
})();
