export const GAME_NAMES = Object.freeze({
  chemistry_arpg: '元素獵人',
  chemistry_rubiks_cube: '3D 化學魔術方塊',
  chemistry_tetris: '化學俄羅斯方塊'
});
export function requireGame(game) {
  if (!Object.hasOwn(GAME_NAMES, game)) throw new Error('找不到這款遊戲');
  return game;
}
export function prepareMessage(author, message) {
  author = typeof author === 'string' ? author.trim() : '';
  message = typeof message === 'string' ? message.trim() : '';
  if (!author || author.length > 20) throw new Error('暱稱請填寫 1～20 字');
  if (!message || message.length > 1000) throw new Error('內容請填寫 1～1000 字');
  return { author, message };
}
export function hasFirebaseConfig(config) {
  return !!config && ['apiKey', 'authDomain', 'projectId', 'appId', 'databaseURL']
    .every(key => typeof config[key] === 'string' && config[key].trim().length > 0);
}
