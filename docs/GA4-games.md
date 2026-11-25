# GA4：三款遊戲的實玩人數與入門漏斗

保留原有首頁及三個遊戲頁的 GA4 自動 `page_view`；不手動補送頁面瀏覽。新增的遊戲事件只會從正式網域發送。既有 GA4 頁面瀏覽的發送範圍不變。

| 事件 | 代表什麼 |
| --- | --- |
| `game_select` | 在首頁點擊某款遊戲連結。直接開遊戲頁不會經過這一步。 |
| `game_enter` | 遊戲頁載入；同次頁面載入只送一次。 |
| `game_start` | 元素獵人開始一局；俄羅斯方塊第一次成功操控，不把自動落下算成遊玩；魔術方塊第一次手動轉動切片，不把旋轉視角、復原或洗牌算成遊玩。 |
| `first_move` / `first_pickup` | 元素獵人當局第一次移動或拾取。 |
| `first_craft` | 元素獵人當局第一次成功合成，或另外兩款遊戲當局第一次化學配方反應（俄羅斯方塊普通消行不算）。 |
| `tutorial_complete` | 元素獵人完成入門任務。 |
| `game_end` | 已開始的一局明確結束。魔術方塊沒有天然結局，以主動洗牌或返回大廳標記遊玩結束；直接關頁沒有可靠的結束事件。 |
| `game_replay` | 同一頁面內結束上一局後，又實際開始下一局；不含重整、隔天回訪，不能當留存。魔術方塊洗牌後還要再轉動才算。 |

分類：`game_id` = `chemistry_arpg`、`chemistry_tetris`、`chemistry_rubiks_cube`。元素獵人另有 `game_mode`（`intro`、`classic`）與 `hero_type`（`mage`、`archer`）。`game_outcome` 是預先定義的結束原因；里程碑和結束事件的 `elapsed_sec` 是自可衡量開始以來的經過秒數，不是有效操作時間，可能包含暫停或背景時間。自訂事件只傳固定分類與這個數字，不傳暱稱、留言、年齡、帳號、排行榜分數或自製玩家 ID。網站 GA 設定不啟用 Google Signals 或個人化廣告訊號。

## 在 GA4 看哪一款有多少人在玩

1. 管理 → 自訂定義 → 建立**事件範圍**自訂維度「遊戲」，事件參數輸入 `game_id`。「遊戲模式」`game_mode`、「角色」`hero_type`、「結束原因」`game_outcome` 可依分析需要新增。資料送出並建立維度後，通常需 24–48 小時；新維度和新事件不會補回過去資料。
2. 探索 → 自由格式。列用「遊戲」，指標放 **使用者總數** 和「事件計數」。第一個分頁篩選事件名稱**完全等於** `game_start`，這是各款實玩使用者數與開局數；複製分頁改成 `game_enter`，看各款到達使用者數。相同玩家可玩多款，**不能把三列加總當全站去重人數**。GA4 的使用者識別受瀏覽器、同意狀態、廣告阻擋等影響，不等於真人普查。
3. 看已收集的舊流量：用原本的 `page_view` 搭配「網頁路徑」（不要選含查詢參數的版本）及「使用者總數」，僅含 `/chemistry_arpg.html`、`/chemistry_tetris.html`、`/chemistry_rubiks_cube.html`。這只能重建遊戲頁訪客，不能倒推舊的實玩人數。

## 元素獵人：觀察小朋友在哪一步停下來

- 建立封閉漏斗：`game_start → first_move → first_pickup → first_craft → tutorial_complete`，事件條件一併指定 `game_id = chemistry_arpg`、`game_mode = intro`。步驟選「間接接續」，限制合理時間（例如 15 分鐘）。再依裝置類別比較，量少先看原始人數及現場試玩，不用百分比硬判定成效。
- 用 `game_replay` 觀察同頁面再開局；需要隔日回訪，另做以 `game_start` 為條件的同款遊戲同類群組分析。一般 GA4 漏斗是使用者層級，不能精確配對同一局（事件不傳局 ID）；不能拿排行榜送分當遊玩人數。
- 這次在程式端接線，未變更 GA4 資源或建立線上報表；正式部署後再用即時報表查實際自然流量。

官方操作：[事件範圍自訂維度](https://support.google.com/analytics/answer/14239696)・[自由格式探索](https://support.google.com/analytics/answer/9327972)・[漏斗探索](https://support.google.com/analytics/answer/9327974)・[Google Tag 設定](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
