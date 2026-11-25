// Collection stays separate from scores, saves and Firebase.
(() => {
  'use strict';
  const games = new Set(['chemistry_arpg', 'chemistry_tetris', 'chemistry_rubiks_cube']);
  const milestones = new Set(['first_move', 'first_pickup', 'first_craft', 'tutorial_complete']);
  const modes = new Set(['intro', 'classic']);
  const heroes = new Set(['mage', 'archer']);
  const outcomes = new Set(['victory', 'death', 'completed', 'quit', 'gameover', 'restart']);
  const live = /^(www\.)?wuenhouse\.com$/.test(window.location?.hostname ?? '');
  const entered = new Set(), played = new Set(), runs = new Map();
  const clock = () => window.performance?.now() ?? Date.now();
  const secs = run => Math.min(86400, Math.max(0, Math.round((clock() - run.started) / 1000)));
  function send(event, game, extra = {}) {
    if (!live || !games.has(game)) return;
    try {
      window.gtag?.('event', event, { game_id: game, ...extra });
    } catch { /* Analytics must never interrupt gameplay. */ }
  }
  window.GameAnalytics = Object.freeze({
    select(game) { send('game_select', game); },
    enter(game) {
      if (!games.has(game) || entered.has(game)) return;
      entered.add(game);
      send('game_enter', game);
    },
    start(game, {mode, hero} = {}) {
      if (!games.has(game) || runs.has(game)) return;
      const tags = {};
      if (game === 'chemistry_arpg') {
        if (modes.has(mode)) tags.game_mode = mode;
        if (heroes.has(hero)) tags.hero_type = hero;
      }
      runs.set(game, { tags, started:clock(), milestones:new Set() });
      send('game_start', game, tags);
      if (played.has(game)) send('game_replay', game, tags);
      played.add(game);
    },
    event(event, game) {
      const run = runs.get(game);
      if (!run || !milestones.has(event) || run.milestones.has(event)) return;
      run.milestones.add(event);
      send(event, game, { ...run.tags, elapsed_sec:secs(run) });
    },
    end(game, {outcome} = {}) {
      const run = runs.get(game);
      if (!run || !outcomes.has(outcome)) return;
      runs.delete(game);
      send('game_end', game, { ...run.tags, game_outcome:outcome, elapsed_sec:secs(run) });
    }
  });
})();
