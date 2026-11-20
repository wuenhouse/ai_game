# 遊戲大廳共用意見

使用者已選擇 Firebase Realtime Database 並要求執行；網站繼續提供靜態檔案，不部署自訂後端。Firebase 專案由使用者的 Google 帳號建立；目前尚未建立，不推測專案設定。

每張遊戲卡片改為 article，保留遊戲連結，另加討論按鈕，避免巢狀互動元素。原 RWD 三欄／手機單欄保留。以原生 dialog 顯示各遊戲最新 20 則主題（保留舊紀錄），可填暱稱、提問與逐題回覆。匿名 Firebase Auth 提供 uid；所有訊息以純文字呈現，只有 submit 驗證。回覆使用獨立路徑，避免多人覆寫。

資料路徑 feedback/{game}/threads/{id} 與 feedback/{game}/replies/{threadId}/{id}，是雲端 JSON 節點，不是 Git 內 JSON 檔。每筆包含 author、message、uid、createdAt。公開讀取；寫入需驗證身分、字數及伺服器時間，只可新增，不允許客戶端修改或刪除；拒絕未知遊戲與欄位。公開設定缺少時禁止送出，不能假裝已存。

採用 Firebase 官方 CDN 模組。提供獨立設定檔、規則與控制台操作文件。測試包含資料驗證、遊戲隔離、未設定狀態、鍵盤／關閉對話框、RWD。未取得實際專案前，不宣稱完成雲端連線或規則部署。不自行 commit/push。
