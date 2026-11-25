# Firebase 設定與驗收

## 新增：兩款遊戲成績與排行榜（2026-11-25，尚未部署）

本地已加入俄羅斯方塊與元素獵人的送分與排行榜，沿用留言的同一個 Firebase app 與匿名帳號。讀取排行榜不會建立帳號；結算後輸入暱稱並按送出才登入、寫入。不把成績、暱稱或 UID 加入 GA4 事件。

| 路徑 | 資料與權限 |
| --- | --- |
| `scoreRuns/{game}/{uid}/{runId}` | 每次主動登錄的局次；只有該玩家與 Firebase 管理者可讀，客戶端不可修改或刪除 |
| `leaderboards/{game}/{uid}` | 公開最高分；按 `score` 排序且每次最多 20 筆才能讀取整個榜單，玩家也可讀自己的單筆 |
| `scoreLatest/{uid}` | 私有最近送分標記；兩款共用 5 秒冷卻，必須與新局次原子寫入 |

`game` 只接受 `chemistry_tetris`、`chemistry_arpg`。魔術方塊不寫入成績。歷史欄位為 `nickname`、`score`、`durationMs`、`language`、`version`、`reason`、`hero`、`createdAt`；管理者可在 Firebase Console 的 Realtime Database → Data → `scoreRuns` 查看每局分數。`language` 是登錄當下所選語系；`durationMs` 從本局開始計算，包含選單／分頁停留時間，不等同有效操作時間。

排行榜只存 `nickname`、`score`、`createdAt`、`runId`，匿名 UID 是公開資料的路徑 key。低分與同分仍保存私有歷史，不覆蓋最高分及其暱稱。匿名帳號以瀏覽器為單位，換裝置或清除網站資料後可能形成新玩家；暱稱不具唯一性，也不是登入帳號。分數由前端計算，規則可驗證身分／格式／原子性，無法證明沒有改分。

網路操作 15 秒仍未確認時，介面顯示未確認提示並保留暱稱供重試。Firebase 仍可能在恢復連線後完成原寫入；同一頁面的同局重試共用原操作，並以固定局次 ID 及不可覆寫規則防止重複。重新整理頁面會失去尚未送出的結算畫面，不提供跨頁面的離線送分佇列。

### 本地驗收

一般測試不連 Firebase：

```sh
node --test tests/*.test.mjs tests/*.test.cjs
```

DOM 測試需要 jsdom；規則驗收需要 Firebase 官方工具與 Java。安裝在暫存目錄，不改專案依賴：

```sh
npm install --prefix /private/tmp/ai-game-validation firebase-tools@13.35.1 @firebase/rules-unit-testing@3 firebase@10 jsdom@26
AI_GAME_TEST_MODULES=/private/tmp/ai-game-validation node --test tests/i18n-dom.integration.mjs tests/score-ui.integration.mjs
FIREBASE_EMULATORS_PATH=/private/tmp/ai-game-validation/emulators /private/tmp/ai-game-validation/node_modules/.bin/firebase emulators:exec --only auth,database --project demo-ai-game --config firebase/emulator.json 'node --test tests/firebase-scores-emulator.mjs'
```

測試固定連到 `127.0.0.1:9037` 的 `demo-ai-game`，會清空該本機模擬器資料。不要同時與手動瀏覽器驗收共用資料。測試套件的 firebase@10 用於規則引擎；瀏覽器另以網站實際的 Firebase SDK 13.4.0 驗證送分、讀榜、斷線重試。

### 正式部署步驟

1. 先備份並讀取正式規則，與本地 `database.rules.json` 比對；保留正式環境後來新增的其他功能，不直接覆蓋未知變更。
2. 發布合併後的規則，讀回確認。既有留言規則本次保持不變，新增三個成績路徑。
3. 一起發布四個 HTML 與完整 `js/`。共用資源使用 `v=20261125-2`，未來更版需同步更新版本，避免新舊模組混用。
4. 正式網站再確認三語、合法送分、私有歷史與榜單；本地驗收結果不代表正式環境已部署。

本次沒有發布正式規則，也沒有在正式資料庫寫測試成績。程式碼依使用者要求提交、推送並合併至 `main`；網站部署狀態需另行確認。詳細結果見 [驗收紀錄](../docs/i18n-leaderboards-validation.md)。

網站維持靜態部署。Firebase Realtime Database 提供共用 JSON 資料；不需要自行部署 API。每款遊戲先顯示最新 20 則主題，主題和回覆皆可逐頁讀取較早的內容，不自動刪除舊紀錄。

## 1. 確認專案屬於你的帳號

1. 開啟 https://console.firebase.google.com/，確認右上角 Google 帳號是你要管理遊戲的帳號。
2. 新增專案，名稱可填 `ai-game`，實際 project ID 以控制台產生／你選定的為準。
3. Google Analytics 非此功能必要，可略過。先使用免費 Spark 方案，不需升級或綁定帳單。
4. 在「專案設定 → 使用者與權限」確認自己有擁有者權限。

Google 登入與 IAM 決定管理者；網站 Web config 只指定要連接的專案，不授予管理權。

## 2. 建立 Realtime Database

1. 左側「建構／Build → Realtime Database」，建立資料庫。
2. 選擇適合讀者的可用區域；建立後地區不能直接變更。
3. 以鎖定模式開始，不使用公開任意寫入的測試規則。
4. 記下控制台顯示的 database URL，不自行猜測地區或網域。
5. 在 Rules／規則分頁貼入本目錄 `database.rules.json` 的完整內容並發布。

規則僅允許三款既有遊戲。匿名登入後才可新增主題與回覆，每筆 author 1–20 字、message 1–1000 字；uid 必須屬於目前玩家，createdAt 使用伺服器時間。禁止額外欄位、客戶端修改及刪除。回覆必須有對應主題。

先前版本於 2026-11-20 已發布至 `ai-game-82dd7` 並以管理 API 讀回確認與當時的本地規則一致。若套用至其他已有應用資料與規則的專案，不要整份覆蓋，先合併審查。

空白驗證使用 Realtime Database 的 `String.replace()`（替換全部相符子字串），移除與 JavaScript `trim()` 相同的 25 種空白字元後要求長度大於零，提問與回覆的暱稱／內容皆適用。原始內容仍可保留換行；字數限制仍以原始字串計算。先前 `matches(/\S/)` 的版本經雲端驗收仍放行純空白，已由此版本取代。

舊版留存工具 `tests/firebase-rules-cloud-check.py` 不支援下方新版的配對寫入，不能拿來驗收新版。只適用仍使用舊寫入格式的測試專案。這會連到設定檔指定的真實專案、建立匿名帳號及保留 `rules-check-*` 測試留言；不需要管理員憑證，不應加入自動 CI。結果寫入 `/private/tmp/firebase-rules-check-result.json`，任一驗收失敗即以非零狀態退出。

### 新版隱私與分頁規則（2026-11-20 已部署）

- 根節點和整個遊戲路徑禁止公開讀取；主題與單一主題的回覆只允許依 `createdAt` 排序、每次 1–20 筆的查詢。兩者使用時間與記錄 ID 當分頁游標，即使同一毫秒也不漏資料。此上限並非全站限流，仍可逐頁查詢，公開留言含已儲存的匿名 UID。
- 同一帳號在三款遊戲的發文／回覆共用 30 秒。新留言和該 UID 私有的 `/feedbackThrottle/$uid` 紀錄以單次原子更新寫入。Firebase 檢查同一次寫入是否成對、使用伺服器時間，且前一次成功發文距今至少 30 秒。僅自己的 UID 可讀取冷卻資料。換分頁不重置；換成不同匿名帳號仍可能繞開。
- 閱讀不需匿名登入；新增時才登入。留言現為公開內容，畫面明示使用暱稱，不要填姓名、學校、電話、地址和聯絡方式。
- 玩家仍可預設發文和回覆。需要暫停時，管理者可在 Realtime Database 把 `/feedbackSettings/postingEnabled` 設成布林值 `false`；改回 `true` 或移除即可恢復。這是臨時防洗版的開關，前端不能改設定。管理者可在資料庫後台處理不適合公開的留言。
- 依使用者提供的另一個 Agent 部署回報，新版已發布至正式專案 `ai-game-82dd7`，舊規則已備份，發布後已讀回確認生效。正式環境確認每次讀取 20 筆可用，21 筆及整批讀取遭拒，留言暫停開關未開啟。
- 同帳號 30 秒冷卻規則已上線；寫入行為已在模擬器驗證，本次未在正式環境寫入測試留言。上述為該 Agent 的部署及驗證回報，本次文件更新未另行連線複驗。
- 規則部署與網站發布分開記錄：該 Agent 未推送網站；此前前端程式已合併並推送 `main`，正式網站部署結果仍需另行確認。新版前端上線後，玩家須重新整理頁面；舊版前端不會寫入冷卻資料。App Check、跨帳號限速和內容審核是獨立措施，此版未啟用。

## 3. 啟用匿名登入

1. 「Authentication → 開始使用 → Sign-in method／登入方式」。
2. 啟用 Anonymous／匿名登入。
3. 檢查 Authentication 設定中的授權網域，依控制台要求加入 `wuenhouse.com`、實際使用的 `www` 網域與本機測試用 `localhost`。

玩家不必輸入 Google 帳號。匿名使用者 UID 與網站擁有者 Google 帳號不同。

## 4. 新增網頁應用程式並取得設定

1. 「專案設定 → 一般 → 你的應用程式」，點選網頁 `</>`。
2. 暱稱可填 `ai-game-web`。不需要啟用 Firebase Hosting；沿用既有網站主機。
3. 在 SDK 設定與配置中複製完整 `firebaseConfig`，確認包含 `databaseURL`。
4. 把完整物件填入 `js/firebase-config.js`：`export const firebaseConfig = { …實際完整值… };`。不可用範例值代替。
5. Web config 可公開。請勿提供 Google 密碼、OAuth token、服務帳戶私鑰，亦不可放在前端。

若新增 Database 後舊設定仍缺少 databaseURL，回控制台重新取得完整設定。

## 5. 測試與發布

1. 本地以 HTTP 開啟 `index.html`，不使用 file://。
2. 在三款卡片各開啟討論入口，確認標題與資料互不混用。
3. 瀏覽器 A 提問，瀏覽器 B 或無痕視窗重新整理後看到主題並回覆；A 展開／重新展開或重新整理討論後看到回覆。
4. 空白、超長文字不能送出；HTML 字串顯示成文字。網路或權限失敗不能顯示送出成功。
5. 使用 Firebase Rules Playground／Emulator 驗證未登入、錯誤 uid、偽造時間、修改／刪除、未知遊戲與欄位遭拒絕；正確匿名 uid 的新增能通過。測試資料使用獨立測試專案，勿污染正式資料。
6. 在確認規則前不開放正式留言。公開前依流量啟用 Firebase App Check 與其官方驗證供應者，降低機器人濫用；匿名登入本身不能阻止洗版，前端冷卻也不是強制限流。
7. 發布 `index.html` 和完整 `js/` 目錄；其餘遊戲與素材按既有方式一起保留。

每次顯示最多 20 則主題或回覆，不是最多保存 20 則；沒有自動刪除舊資料。留言為公開內容，無編輯刪除 UI；管理者可從控制台管理。

參考：
- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/auth/web/anonymous-auth
- https://firebase.google.com/docs/database/security
- https://firebase.google.com/docs/database/web/lists-of-data
