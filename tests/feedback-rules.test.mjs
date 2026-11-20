import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

// Offline contract checks only: these predicates are evaluated with fixture
// data, not the Realtime Database rules compiler or a Firebase endpoint.
const { rules } = JSON.parse(readFileSync(
  new URL('../firebase/database.rules.json', import.meta.url), 'utf8',
));
const game = rules.feedback.$game;
const thread = game.threads.$thread;
const replies = game.replies.$thread;
const reply = replies.$reply;
const knownGames = ['chemistry_arpg', 'chemistry_rubiks_cube', 'chemistry_tetris'];
const matches = (expression, values) => runInNewContext(expression, values);
function snapshot(tree, path = []) {
  const value = path.reduce((node, key) => node?.[key], tree);
  return {
    child: (key) => snapshot(tree, [...path, key]),
    parent: () => snapshot(tree, path.slice(0, -1)),
    val: () => value ?? null,
    exists: () => value != null,
    hasChildren: (keys) => keys.every((key) => value?.[key] != null),
    isNumber: () => typeof value === 'number',
    isString: () => typeof value === 'string',
  };
}

test('feedback grants public reads only to bounded collections and the exact setting', () => {
  assert.equal(rules['.read'], false);
  assert.equal(rules['.write'], false);
  assert.equal(rules.feedback['.read'], undefined);
  assert.equal(game['.read'], undefined);
  assert.equal(game.replies['.read'], undefined);
  assert.equal(thread['.read'], undefined);
  assert.equal(reply['.read'], undefined);
  assert.deepEqual(rules.feedbackSettings, { postingEnabled: { '.read': true } });

  const orderByChild = 'createdAt';
  for (const collection of [game.threads, replies]) {
    assert.deepEqual(collection['.indexOn'], ['createdAt']);
    const queryRule = collection['.read'];
    for (const gameId of knownGames) {
      for (const limitToLast of [1, 20]) {
        assert.equal(matches(queryRule, {
          $game: gameId, query: { orderByChild, limitToLast },
        }), true);
      }
    }
    for (const [gameId, query] of [
      ['other_game', { orderByChild, limitToLast: 20 }],
      [knownGames[0], { orderByChild: 'author', limitToLast: 20 }],
      [knownGames[0], { orderByChild: null, limitToLast: 20 }],
      [knownGames[0], { orderByChild, limitToLast: null, limitToFirst: 20 }],
      [knownGames[0], { orderByChild, limitToLast: 0 }],
      [knownGames[0], { orderByChild, limitToLast: 21 }],
    ]) {
      assert.equal(matches(queryRule, { $game: gameId, query }), false);
    }
  }
});

const marker = rules.feedbackThrottle.$uid;
const now = 100000;
const uid = 'preview-user';
const gameId = 'chemistry_arpg';
const parentId = 'test-topic';

function postingFixture({
  mode = 'topic', recordId = 'new-record', postingEnabled, previousAt,
  auth = { uid }, owner = uid, oldRecord, withRecord = true, withMarker = true,
  existingParent = true, markerOverride = {}, recordUid = uid,
} = {}) {
  const isReply = mode === 'reply';
  const threadId = isReply ? parentId : recordId;
  const recordPath = isReply
    ? ['feedback', gameId, 'replies', parentId, recordId]
    : ['feedback', gameId, 'threads', recordId];
  const markerPath = ['feedbackThrottle', owner];
  const getRecord = (tree, id = recordId) =>
    snapshot(tree, [...recordPath.slice(0, -1), id]);

  const oldTree = {
    feedbackSettings: { postingEnabled },
    feedbackThrottle: previousAt === undefined ? {} : { [uid]: { at: previousAt } },
    feedback: {
      [gameId]: {
        threads: {
          [parentId]: existingParent ? { uid, createdAt: 0 } : null,
          ...(!isReply && oldRecord ? { [recordId]: oldRecord } : {}),
        },
        replies: { [parentId]: isReply && oldRecord ? { [recordId]: oldRecord } : {} },
      },
    },
  };
  const nextTree = structuredClone(oldTree);
  if (withRecord) {
    const newPath = isReply
      ? nextTree.feedback[gameId].replies[parentId]
      : nextTree.feedback[gameId].threads;
    newPath[recordId] = { uid: recordUid, author: 'Sample', message: 'Example', createdAt: now };
  }
  if (withMarker) {
    nextTree.feedbackThrottle[owner] = {
      at: now, game: gameId, thread: isReply ? parentId : '', id: recordId, ...markerOverride,
    };
  }
  const shared = { auth, now, root: snapshot(oldTree), $game: gameId, $thread: threadId, $reply: recordId };
  const evaluateRecord = (id = recordId) => matches((isReply ? reply : thread)['.write'], {
    ...shared,
    ...(isReply ? { $reply: id } : { $thread: id }),
    data: getRecord(oldTree, id), newData: getRecord(nextTree, id),
  });
  const markerFixture = {
    ...shared,
    $uid: owner,
    data: snapshot(oldTree, markerPath),
    newData: snapshot(nextTree, markerPath),
  };
  return {
    evaluateRecord,
    evaluateMarkerWrite: () => matches(marker['.write'], markerFixture),
    evaluateMarkerValidation: () => matches(marker['.validate'], markerFixture),
    evaluateMarkerRead: () => matches(marker['.read'], markerFixture),
    evaluateMarkerTime: () => matches(marker.at['.validate'], {
      ...markerFixture, newData: snapshot(nextTree, [...markerPath, 'at']),
    }),
  };
}

test('per-user cooldown allows eligible atomic creates and blocks both paths before 30 seconds', () => {
  const run = (opts) => {
    const f = postingFixture(opts);
    return [f.evaluateRecord(), f.evaluateMarkerWrite()];
  };
  for (const mode of ['topic', 'reply']) {
    assert.deepEqual(run({ mode }), [true, true], 'missing settings default open');
    assert.deepEqual(run({ mode, postingEnabled: true, previousAt: now - 30000 }), [true, true]);
    assert.deepEqual(run({ mode, previousAt: now - 29999 }), [false, false]);
    assert.deepEqual(run({ mode, previousAt: now - 1000 }), [false, false]);
    assert.deepEqual(run({ mode, previousAt: '70000' }), [false, false]);
    assert.deepEqual(run({ mode, postingEnabled: false }), [false, false]);
    assert.deepEqual(run({ mode, auth: null }), [false, false]);
    assert.equal(postingFixture({
      mode, oldRecord: { uid, createdAt: 0 },
    }).evaluateRecord(), false, 'existing records are immutable');
  }
  assert.equal(postingFixture({ mode: 'reply', existingParent: false }).evaluateRecord(), false);
  for (const record of [thread, reply]) {
    assert.equal(record.uid['.validate'], 'newData.val() === auth.uid');
    assert.equal(record.$other['.validate'], false);
  }
});

test('atomic write must bind one exact new feedback record; marker is protected', () => {
  for (const mode of ['topic', 'reply']) {
    const healthy = postingFixture({ mode, previousAt: now - 30000 });
    assert.equal(healthy.evaluateMarkerValidation(), true);
    assert.equal(healthy.evaluateMarkerTime(), true);
    assert.equal(healthy.evaluateMarkerRead(), true);
    assert.equal(healthy.evaluateRecord('unlinked-record'), false);
    assert.equal(postingFixture({ mode, withMarker: false }).evaluateRecord(), false);
    assert.equal(postingFixture({ mode, withRecord: false }).evaluateMarkerValidation(), false);
    assert.equal(postingFixture({ mode, oldRecord: { uid } }).evaluateMarkerValidation(), false);
    assert.equal(postingFixture({ mode, recordUid: 'other' }).evaluateMarkerValidation(), false);
    assert.equal(postingFixture({ mode, recordUid: 'other' }).evaluateRecord(), false);
    const changedAt = postingFixture({ mode, markerOverride: { at: now - 1 } });
    assert.equal(changedAt.evaluateRecord(), false);
    assert.equal(changedAt.evaluateMarkerTime(), false);
    for (const markerOverride of [
      { game: 'chemistry_tetris' }, { id: 'unlinked-record' },
      { thread: 'unlinked-thread' },
    ]) {
      const invalid = postingFixture({ mode, markerOverride });
      assert.equal(invalid.evaluateRecord(), false);
      assert.equal(invalid.evaluateMarkerValidation(), false);
    }
    const crossAccount = postingFixture({ mode, owner: 'other' });
    assert.equal(crossAccount.evaluateMarkerWrite(), false);
    assert.equal(crossAccount.evaluateMarkerRead(), false);
    assert.equal(postingFixture({ mode, auth: null }).evaluateMarkerRead(), false);
    assert.equal(postingFixture({ mode, withMarker: false }).evaluateMarkerWrite(), false);
  }
  assert.equal(rules.feedbackThrottle['.read'], undefined);
  assert.equal(rules.feedbackThrottle['.write'], undefined);
  assert.equal(marker.$other['.validate'], false);
});
