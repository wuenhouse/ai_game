# Firebase 設定與驗收

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

### 新版隱私與分頁規則（本機，尚未發布）

- 根節點和整個遊戲路徑禁止公開讀取；主題與單一主題的回覆只允許依 `createdAt` 排序、每次 1–20 筆的查詢。兩者使用時間與記錄 ID 當分頁游標，即使同一毫秒也不漏資料。此上限並非全站限流，仍可逐頁查詢，公開留言含已儲存的匿名 UID。
- 同一帳號在三款遊戲的發文／回覆共用 30 秒。新留言和該 UID 私有的 `/feedbackThrottle/$uid` 紀錄以單次原子更新寫入。Firebase 檢查同一次寫入是否成對、使用伺服器時間，且前一次成功發文距今至少 30 秒。僅自己的 UID 可讀取冷卻資料。換分頁不重置；換成不同匿名帳號仍可能繞開。
- 閱讀不需匿名登入；新增時才登入。留言現為公開內容，畫面明示使用暱稱，不要填姓名、學校、電話、地址和聯絡方式。
- 玩家仍可預設發文和回覆。需要暫停時，管理者可在 Realtime Database 把 `/feedbackSettings/postingEnabled` 設成布林值 `false`；改回 `true` 或移除即可恢復。這是臨時防洗版的開關，前端不能改設定。管理者可在資料庫後台處理不適合公開的留言。
- 先用 Emulator 或測試專案檢查新版前端與規則，再上線。正式環境需協調前端與規則同次發布：舊版前端不會寫入冷卻資料，新版前端則需要新版規則允許配對寫入。請安排短暫留言維護時段並要求重新整理；遊戲內容可照常載入。App Check、跨帳號限速和內容審核是獨立措施，此版未啟用。

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
