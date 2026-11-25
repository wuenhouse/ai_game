# 三語介面與遊戲排行榜 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成三款多語系與兩款可登錄排行榜。
**Architecture:** 共用語系目錄、DOM 翻譯與同步遊戲局次橋接；Firebase 模組延遲載入，原子保存私有歷史和公開最高分。
**Tech Stack:** 原生 JavaScript、HTML、Firebase RTDB、Node test。
**Spec:** docs/superpowers/specs/2026-11-25-i18n-leaderboards-design.md

## Global Constraints
- 繁中、英文、日文；玩家內容不翻譯。
- 魔術方塊不記分到雲端；元素獵人每局 10／30／100 計分。
- 不自動提交、推送或部署正式環境。

## Review Focus
- 語系切換不重設遊戲、不改玩家文字；儲存不可用仍可玩。
- 死亡與勝利只結算一次，新探索不得繼承上局分數。
- 送出失敗可重試，慢速回應不污染下一局；同局不可重複。
- 規則拒絕未登入、冒用、未知遊戲、額外欄位與不配對寫入。
- 手機文字換行與彈窗可捲動，遊戲鍵盤不攔截暱稱。

### Task 1: 多語系
**Files:** js/i18n.js、js/translations.js、js/platform.css、四個 HTML、js/feedback.js、tests/i18n.test.mjs。
**Interfaces:** window.GameI18n.t(text)、locale、setLocale(locale)；DOM 透過原文快取還原、略過玩家內容。
- [x] 先測語系選擇、完整字典、切換還原、動態節點與玩家內容保護。
- [x] 實作三語字典與共用選單，四頁接入，提示／canvas／確認對話框使用翻譯。
- [x] 執行 node --test tests/i18n.test.mjs。

### Task 2: 成績與 Firebase
**Files:** js/score-session.js、js/score-data.mjs、js/score-store.js、js/scores.js、js/feedback-store.js、firebase/database.rules.json、兩個 HTML、tests/scores.test.mjs、tests/score-rules.test.mjs。
**Interfaces:** GameScores.begin(game)、addKill(type)、finish(score,reason,hero)；submitScore(run,nickname)、loadLeaderboard(game)。
- [x] 先測局次重設、10／30／100 計分、快照、防重複結算及輸入限制。
- [x] 實作共用局次、暱稱送出與榜單，沿用同一 Firebase app 匿名身分。
- [x] 原子寫入 scoreRuns、scoreLatest、leaderboards，規則配對與最高分單調增加。
- [x] 測合法與非法規則、重試與同局防重複，執行 Node 全套測試。

### Task 3: 驗收與文件
**Files:** firebase/README.md、docs/RELEASE_NOTES.md、docs/i18n-leaderboards-validation.md。
- [x] 瀏覽器驗證三語、兩款結算、玩家文字保留、離線失敗、手機與桌面。
- [x] 若 Emulator 可用，真實規則引擎驗收；否則明確標示未驗證範圍。
- [x] 全套測試、內嵌腳本語法與 git diff --check；更新文件與部署指引。

## 執行紀錄

使用者已明確要求實作，於既有目錄的功能分支執行，未另建立 worktree。實作驗收後，使用者另行明確要求 commit、push、更新 release note 及合併至 main，依此執行交付。完成獨立唯讀審查，修正 Canvas 元素名稱未翻譯；瀏覽器驗收另修正本地時間偏移讀取、斷線逾時與HUD選單初始值，均有回歸測試。正式部署留待另行操作。
