(() => {
  'use strict';
  const catalog = window.GameTranslations;
  const supported = ['zh-Hant', 'en', 'ja'];
  const storageKey = 'chem-lab-language';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch { /* private browsing */ }
  const preferred = (navigator.languages || [navigator.language || '']).map(value => {
    const base = value.toLowerCase().split('-')[0];
    return base === 'zh' ? 'zh-Hant' : supported.includes(base) ? base : null;
  }).find(Boolean);
  let locale = supported.includes(saved) ? saved : preferred || 'zh-Hant';
  const pattern = new RegExp(Object.keys(catalog).sort((a, b) => b.length - a.length)
    .map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const t = source => locale === 'zh-Hant' ? String(source) : String(source).replace(pattern, key => catalog[key][locale === 'en' ? 0 : 1]);
  const originals = new WeakMap();
  const attributes = ['title', 'aria-label', 'placeholder'];
  const excluded = 'script,style,textarea,input,[data-user-content],.discussion-text,.discussion-author';
  let observer;
  function text(node) {
    if (node.parentElement?.closest(excluded)) return;
    const old = originals.get(node);
    // A changed value is a new source from the game, never a translation key inferred from English.
    const source = old && node.data === old.rendered ? old.source : node.data;
    const rendered = t(source);
    originals.set(node, { source, rendered });
    if (node.data !== rendered) node.data = rendered;
  }
  function element(el) {
    if (el.closest(excluded)) return;
    const old = originals.get(el) || {};
    for (const name of attributes) {
      const value = el.getAttribute(name);
      if (value === null) continue;
      const source = old[name] && value === old[name].rendered ? old[name].source : value;
      const rendered = t(source);
      old[name] = { source, rendered };
      if (value !== rendered) el.setAttribute(name, rendered);
    }
    originals.set(el, old);
  }
  function translate(root) {
    if (root.nodeType === 3) { text(root); return; }
    if (root.nodeType === 1) element(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) node.nodeType === 3 ? text(node) : element(node);
  }
  function observe() {
    observer?.observe(document.documentElement, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: attributes });
  }
  function setLocale(value) {
    if (!supported.includes(value)) throw new Error('Unsupported language');
    locale = value;
    try { localStorage.setItem(storageKey, value); } catch { /* selection still works */ }
    if (typeof document === 'undefined') return;
    observer?.disconnect();
    document.documentElement.lang = value;
    document.querySelectorAll('[data-language-select]').forEach(select => { select.value = value; });
    translate(document.documentElement);
    observe();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: value }));
  }
  window.GameI18n = { t, setLocale, translate, catalog, get locale() { return locale; } };
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.createElement('nav');
    toolbar.className = 'platform-toolbar';
    toolbar.setAttribute('aria-label', '語言');
    const select = document.createElement('select');
    select.dataset.languageSelect = '';
    select.setAttribute('aria-label', '語言');
    for (const [value, label] of [['zh-Hant', '繁體中文'], ['en', 'English'], ['ja', '日本語']]) {
      const option = document.createElement('option'); option.value = value; option.textContent = label;
      option.dataset.userContent = ''; select.append(option);
    }
    select.value = locale;
    select.addEventListener('change', () => setLocale(select.value));
    toolbar.append(select);
    const host = document.querySelector('#title-screen .title-content, .header, .top-bar, .container header');
    (host || document.body).prepend(toolbar);
    const hud = document.querySelector('#game-screen .hud');
    if (hud) {
      const copy = toolbar.cloneNode(true);
      copy.querySelector('select').value = locale;
      copy.querySelector('select').addEventListener('change', event => setLocale(event.target.value));
      hud.prepend(copy);
    }
    translate(document.documentElement);
    observer = new MutationObserver(records => {
      observer.disconnect();
      for (const record of records) {
        if (record.type === 'attributes') element(record.target);
        else if (record.type === 'characterData') text(record.target);
        else for (const node of record.addedNodes) translate(node);
      }
      observe();
    });
    window.addEventListener('pagehide', () => observer.disconnect());
    window.addEventListener('pageshow', observe);
    observe();
  });
})();
