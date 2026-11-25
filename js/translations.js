// Source text is the Traditional Chinese catalog key. Symbols/formulas stay unchanged.
(() => {
  const rows = `
化學益智遊戲實驗室|Chem Puzzle Lab|化学パズル実験室
化學益智遊戲實驗室 \u007c Chem Puzzle Lab|Chem Puzzle Lab|化学パズル実験室 \u007c Chem Puzzle Lab
支援手機直式單手觸控與電腦滑鼠鍵盤操作，點擊下方選擇遊戲開始實驗！|Play with touch, mouse or keyboard. Choose a game below and start experimenting!|スマホのタッチ操作にもパソコンのマウス・キーボードにも対応。ゲームを選んで実験を始めよう！
元素獵人|Element Hunter|元素ハンター
像素 ARPG × 元素合成|Pixel ARPG × Element crafting|ピクセルARPG × 元素合成
深入地下化學實驗室，用短杖近戰、發射六種元素彈，收集元素並合成技能。|Explore an underground lab, fight with a wand and six elemental shots, and collect elements to craft skills.|地下の化学実験室を探索。杖と6種類の元素弾で戦い、元素を集めてスキルを合成しよう。
開始探索|Start exploring|探索を始める
意見與討論|Feedback & discussion|ご意見・掲示板
化學魔術方塊|Chemistry Cube|化学キューブ
空間轉動 × 化學反應連線|Rotation × Chemical matches|立体回転 × 化学反応マッチ
單指滑動方塊轉動切片層、滑動背景旋轉視角。在任意一面湊齊 H₂O、CO₂、CaCO₃ 等化合物觸發粒子反應！|Swipe the cube to turn a slice; swipe the background to rotate the view. Match compounds such as H₂O and CO₂ on any face!|キューブをスワイプして列を回転、背景をスワイプして視点を変更。どの面でもH₂OやCO₂などをそろえて反応させよう！
開始遊玩 3D 魔術方塊|Play the 3D Cube|3Dキューブで遊ぶ
化學俄羅斯方塊|ChemTetris|化学テトリス
落下消除 × 重力連鎖合成|Falling blocks × Reaction chains|落ちものパズル × 連鎖合成
經典消行結合相鄰原子自動合成引爆！支援底部虛擬按鍵與棋盤手勢滑動，挑戰連續重力反應 Combo。|Clear lines and combine neighboring atoms for explosive reactions! Use touch buttons or swipe the board to build chain combos.|ライン消去と隣接原子の合成が融合！画面下のボタンやスワイプで操作して、重力連鎖コンボに挑戦しよう。
開始遊玩化學俄羅斯方塊|Play ChemTetris|化学テトリスで遊ぶ
建議於手機瀏覽器使用「加入主畫面」獲得全螢幕沉浸體驗|On mobile, use “Add to Home Screen” for a full-screen experience.|スマホでは「ホーム画面に追加」で全画面表示を楽しめます。
關閉意見與討論|Close feedback & discussion|掲示板を閉じる
留言是公開的。請用暱稱，不要填自己或別人的真實姓名、學校、電話、地址或社群帳號等聯絡方式。|Comments are public. Use a nickname; do not share anyone’s real name, school, phone, address or social accounts.|コメントは公開されます。ニックネームを使い、本名・学校・電話番号・住所・SNSなどの個人情報は書かないでください。
目前暫停發文與回覆，仍可看已發布的留言。|Posting is paused. Existing comments are still available.|現在、投稿と返信を停止しています。過去のコメントは閲覧できます。
你的暱稱（最多 20 字）|Your nickname (up to 20 characters)|ニックネーム（20文字以内）
問題或意見（最多 1000 字）|Question or feedback (up to 1000 characters)|質問・ご意見（1000文字以内）
發布主題|Post topic|トピックを投稿
讀取討論區中…|Loading discussion…|掲示板を読み込み中…
重新整理討論|Refresh discussion|掲示板を更新
討論主題|Discussion topics|トピック一覧
載入更早的主題|Load older topics|過去のトピックを表示
回大廳|Lobby|ロビーへ
返回大廳|Return to character selection|キャラクター選択へ戻る
最終實驗分數：|Final score: |最終スコア：
分數|Score|スコア
消行|Lines|消去ライン
圖鑑|Codex|図鑑
化學反應|Reaction|化学反応
左移|Left|左
加速|Down|下降
右移|Right|右
直落|Drop|落下
旋轉|Rotate|回転
相鄰化學反應公式|Neighboring atom reactions|隣接原子の反応式
方塊落地後，只要|After a block lands, |ブロックが着地したら、
上下左右相鄰連通|atoms connected horizontally or vertically|上下左右につながった
的原子符合以下配方，就會自動引爆消除並觸發上方重力連鎖！| that match a recipe below react automatically, triggering gravity chains!|原子が下のレシピに一致すると自動で消え、重力連鎖が発生します！
實驗室爆滿！|The lab is full!|実験室がいっぱい！
重新開始實驗|Try again|もう一度実験する
水分子|Water molecule|水分子
二氧化碳|Carbon dioxide|二酸化炭素
氯化鈉|Sodium chloride|塩化ナトリウム
氧化鈣 (生石灰)|Calcium oxide (quicklime)|酸化カルシウム（生石灰）
氧化鈣|Calcium oxide|酸化カルシウム
氯化鈣|Calcium chloride|塩化カルシウム
氫氧化鈉|Sodium hydroxide|水酸化ナトリウム
碳酸鈣|Calcium carbonate|炭酸カルシウム
甲烷|Methane|メタン
氧化鈉|Sodium oxide|酸化ナトリウム
次氯酸|Hypochlorous acid|次亜塩素酸
碳氫化合物|Hydrocarbon|炭化水素
臭氧|Ozone|オゾン
氫氣分子|Hydrogen molecule|水素分子
水|Water|水
氫|Hydrogen|水素
氧|Oxygen|酸素
碳|Carbon|炭素
鈉|Sodium|ナトリウム
氯|Chlorine|塩素
鈣|Calcium|カルシウム
簡化|simplified|簡略化
連鎖！|chain!|連鎖！
反應成功！|Reaction complete!|反応成功！
步數|Moves|手数
滑動|Swipe |スワイプ：
方塊|cube|キューブ
轉動排面| to turn a slice|で列を回転
背景|background|背景
旋轉視角| to rotate the view|で視点を回転
正視角|Reset view|視点リセット
復原|Undo|元に戻す
洗牌|Shuffle|シャッフル
配方|Recipes|レシピ
3格連線化學配方表|Three-in-a-row chemistry recipes|3マスでそろえる化学レシピ
在魔術方塊任意一面的「橫排或直排 3 格」湊齊以下元素組合即可得分並刷新元素：|Match these elements in any horizontal or vertical row of three on a face to score points and refresh the elements:|いずれかの面で縦か横の3マスに次の元素をそろえると、得点して元素が入れ替わります：
需求：|Requires: |必要元素：
合成|Craft|合成
分！| points!|点！
已選取元素：|Selected element: |選択した元素：
滑動轉動該排）|swipe to turn this row)|スワイプしてこの列を回転）
收集 · 合成 · 探索|Collect · Craft · Explore|収集 · 合成 · 探索
選擇你的冒險夥伴，走進神祕遺跡。|Choose your adventurer and enter mysterious ruins.|冒険の仲間を選んで、神秘的な遺跡へ。
收集元素、合成化合物，發現化學的魔法！|Collect elements, craft compounds and discover the magic of chemistry!|元素を集め、化合物を合成して、化学の魔法を見つけよう！
選擇角色|Choose a character|キャラクターを選択
元素法師|Element Mage|元素の魔法使い
馬尾弓手|Ponytail Archer|ポニーテールの弓使い
出發探索|Start exploring|探索に出発
角色狀態|Character stats|キャラクター情報
選單|Menu|メニュー
遊戲區：手機按住任意位置並拖曳即可移動|Game area: touch and drag anywhere to move|ゲーム画面：好きな場所を長押ししてドラッグで移動
鍵盤操作說明|Keyboard controls|キーボード操作
操作指南|Controls|操作ガイド
探索開始後，就能用鍵盤操作。|Keyboard controls are available once exploration begins.|探索を始めるとキーボードで操作できます。
先試試 W A S D，或方向鍵移動！|Try moving with W A S D or the arrow keys!|W A S Dや矢印キーで移動してみよう！
WASD／方向鍵移動。按住 Z 或空白鍵集氣，放開射擊。可邊走邊集氣。|Move with WASD/arrows. Hold Z or Space to charge, release to shoot. You can charge while moving.|WASD・矢印キーで移動。Z・スペースを長押しでため、離すと発射。移動しながらためられます。
短按單箭。金色氣焰是三箭；燃起更大的亮金氣焰是大箭，可打碎岩石。弓手不能施放技能。|Tap for one arrow. A gold aura means three arrows; a larger bright gold aura fires a large arrow that breaks rocks. Archers cannot cast skills.|短押しで単発。金色のオーラは3本矢、大きく輝く金色のオーラは岩を砕く大矢。弓使いはスキルを使えません。
普通攻擊|Basic attack|通常攻撃
施放選中技能|Cast selected skill|選択スキルを発動
切換選中技能|Cycle selected skill|選択スキルを切替
直接施放技能|Cast skill directly|スキルを直接発動
開啟選單|Open menu|メニューを開く
關閉選單|Close menu|メニューを閉じる
元素與技能|Elements & skills|元素とスキル
點上方元素欄切換彈種，發射會消耗元素。靠近掉落的元素即可拾取。|Tap an element above to switch ammo. Shots consume elements. Walk near dropped elements to collect them.|上の元素欄をタップして弾を切替。発射時に元素を消費します。落ちた元素に近づくと拾えます。
先選招，再施放|Select, then cast|選んでから発動
點下方技能格只會選招，按 X 才施放。首次在背包合成化合物，可解鎖技能；施放需要 MP。|Tap a skill slot to select it, then press X to cast. Craft a compound in your inventory to unlock its skill. Casting costs MP.|下のスキル枠で選び、Xで発動。持ち物で化合物を初めて合成すると解放されます。発動にはMPが必要です。
按住畫面拖曳移動|Touch and drag to move|長押ししてドラッグで移動
技1|S1|技1
技2|S2|技2
技3|S3|技3
技4|S4|技4
戰鬥操作|Combat controls|戦闘操作
普攻|Attack|攻撃
施放選取技能|Cast selected skill|選択スキルを発動
先合成解鎖|Craft to unlock|合成して解放
發射元素彈（點擊上方元素欄切換彈藥）|Fire an elemental shot (tap the element bar to change ammo)|元素弾を発射（上の元素欄で弾を切替）
發射元素彈|Fire elemental shot|元素弾を発射
元素彈|Element shot|元素弾
背包|Inventory|持ち物
狀態|Stats|情報
操作|Controls|操作
結束本次探索，返回選角|End exploration & choose a character|探索を終了してキャラクター選択へ
關閉詳細資料|Close details|詳細を閉じる
返回|Back|戻る
實驗失敗|Experiment failed|実験失敗
你在探索中倒下了，但收集到的元素與經驗已保存。|You fell during exploration. Your collected elements and experience have been saved.|探索中に倒れました。集めた元素と経験値は保存されています。
Boss 擊敗！|Boss defeated!|ボス撃破！
淨化之水|Purifying Water|浄化の水
回復 30% 最大 HP|Restore 30% of max HP|最大HPの30%を回復
結晶爆破|Crystal Burst|結晶爆破
周圍 3 格範圍傷害|Damage within 3 tiles|周囲3マスにダメージ
煙霧彈|Smoke Bomb|煙幕弾
3 秒內周圍怪物停止追蹤|Nearby monsters stop chasing for 3 seconds|周囲の敵が3秒間追跡を停止
腐蝕陷阱|Corrosive Trap|腐食トラップ
放置陷阱，怪物踩到持續扣血|Place a trap that damages enemies over time|踏んだ敵に継続ダメージを与える罠を設置
石盾|Stone Shield|石の盾
2 秒無敵|Invincible for 2 seconds|2秒間無敵
甲烷爆炸|Methane Blast|メタン爆発
大範圍高傷害（5 格半徑）|High damage in a 5-tile radius|半径5マスに大ダメージ
急凍結晶|Frost Crystal|氷結結晶
凍結周圍怪物 2 秒|Freeze nearby monsters for 2 seconds|周囲の敵を2秒間凍結
酸霧|Acid Mist|酸の霧
前方錐形持續傷害 3 秒|Damage in a forward cone for 3 seconds|前方の扇形範囲に3秒間継続ダメージ
一杯水|A glass of water|コップの水
每個水分子有 2 個氫原子和 1 個氧原子。就算水結成冰，裡面的水分子仍是 H₂O。|Each water molecule has 2 hydrogen atoms and 1 oxygen atom. Even when water freezes, its molecules are still H₂O.|水分子は水素原子2個と酸素原子1個からできています。氷になっても水分子はH₂Oのままです。
美國地質調查局|US Geological Survey|米国地質調査所
餐桌鹽|Table salt|食卓の塩
離子化合物|Ionic compound|イオン化合物
分子|Molecule|分子
氯化鈉是食鹽的主要成分。鹽晶體裡，鈉離子和氯離子按 1：1 排列。|Sodium chloride is the main ingredient in table salt. In its crystals, sodium and chloride ions occur in a 1:1 ratio.|食塩の主成分は塩化ナトリウムです。結晶ではナトリウムイオンと塩化物イオンが1：1で並んでいます。
氣泡水裡的氣泡|Bubbles in sparkling water|炭酸水の泡
氣泡水裡溶有二氧化碳。開瓶後，部分二氧化碳跑出來，成為你看到的氣泡。氣體本身是看不見的。|Sparkling water contains dissolved carbon dioxide. Opening the bottle releases some of it as bubbles. The gas itself is invisible.|炭酸水には二酸化炭素が溶けています。ふたを開けると一部が出てきて泡になります。気体そのものは見えません。
美國化學學會|American Chemical Society|米国化学会
密封瓶裡的白色顆粒|White granules in a sealed bottle|密閉容器の白い粒
氫氧化鈉又叫苛性鈉，是一種強鹼。有些肥皂在製作時會用到它，但肥皂不是氫氧化鈉。|Sodium hydroxide, also called caustic soda, is a strong base. It is used to make some soaps, but soap is not sodium hydroxide.|水酸化ナトリウムは苛性ソーダとも呼ばれる強いアルカリです。一部の石けんの製造に使われますが、石けん自体は水酸化ナトリウムではありません。
有腐蝕性，不要自行碰觸、打開容器或混合。|Corrosive: do not touch it, open the container or mix it yourself.|腐食性があります。自分で触ったり、容器を開けたり、混ぜたりしないでください。
美國 NIOSH|US NIOSH|米国NIOSH
石灰岩|Limestone|石灰岩
石灰岩的主要成分通常是碳酸鈣，也常以方解石這種礦物的形式存在。不是每一塊石頭都含有碳酸鈣。|Limestone is usually made mostly of calcium carbonate, often as the mineral calcite. Not every rock contains calcium carbonate.|石灰岩の主成分は通常、炭酸カルシウムで、方解石という鉱物としても見られます。すべての石に含まれるわけではありません。
天然氣爐的燃料|Fuel for a gas stove|ガスコンロの燃料
天然氣是一種混合物，主要成分是甲烷。圖中的藍色是火焰，不是甲烷本身的顏色。|Natural gas is a mixture made mostly of methane. The blue in the picture is the flame, not the color of methane itself.|天然ガスはメタンを主成分とする混合物です。絵の青色は炎の色で、メタンそのものの色ではありません。
甲烷無色、易燃；不要自己用火測試。|Methane is colorless and flammable. Never test it with fire yourself.|メタンは無色で燃えやすい気体です。自分で火を使って確かめないでください。
美國能源資訊署|US Energy Information Administration|米国エネルギー情報局
有些除濕盒的顆粒|Granules in some moisture absorbers|一部の除湿剤の粒
有些除濕盒用氯化鈣吸收空氣中的水分。現實中，它也能用來幫路上的冰融化，和遊戲裡的「急凍」正好相反。|Some moisture absorbers use calcium chloride to absorb water from the air. It can also melt road ice—the opposite of its freezing skill in the game.|一部の除湿剤は塩化カルシウムで空気中の水分を吸収します。現実では道路の氷を溶かす用途もあり、ゲームの氷結スキルとは逆です。
除濕盒裡的顆粒和液體都不能吃。|Do not eat the granules or liquid in moisture absorbers.|除湿剤の粒や液体は口に入れないでください。
除濕盒成分表|Moisture absorber ingredients|除湿剤の成分表
道路除冰說明|Road deicing information|道路の凍結対策
游泳池的水質消毒|Pool water disinfection|プールの水の消毒
次氯酸也常寫成 HOCl。在使用含氯消毒的泳池裡，水中可有少量次氯酸幫助殺菌。游泳池的水不是純次氯酸。|Hypochlorous acid is also written HOCl. Chlorinated pools can contain small amounts to help kill germs. Pool water is not pure hypochlorous acid.|次亜塩素酸はHOClとも書きます。塩素消毒するプールには、殺菌のため少量含まれることがあります。プールの水は純粋な次亜塩素酸ではありません。
不要自行調配或混合任何清潔、消毒用品。|Do not prepare or mix cleaning or disinfecting products yourself.|洗剤や消毒用品を自分で調合・混合しないでください。
美國 CDC|US CDC|米国CDC
元素魔杖|Element wand|元素の杖
弓箭：按住集氣，放開射擊|Bow: hold to charge, release to shoot|弓：長押しでため、離して発射
弓箭|Bow|弓
選中技能：|Selected skill: |選択スキル：
按技能圓鈕或 X 施放）|press the skill button or X to cast)|スキルボタンかXで発動）
技能尚未解鎖：請到選單|Skill locked: open Menu|スキル未解放：メニューの
背包合成化合物|Inventory and craft a compound|持ち物で化合物を合成してください
彈藥不足，點擊元素欄切換彈藥|Not enough ammo. Tap the element bar to switch.|弾が足りません。元素欄で切り替えてください。
第二段|Stage 2|2段階
大箭|Large arrow|大矢
第一段|Stage 1|1段階
三箭|Triple shot|3本矢
集氣中|Charging|ため中
硬直|Recovery|硬直
長按集氣|Hold to charge|長押しでためる
未解鎖|Locked|未解放
選擇|Select |選択：
再按技能圓鈕施放|then press the skill button to cast|スキルボタンで発動
消耗|Cost: |消費：
在選單的背包中合成化合物以解鎖技能|Craft a compound in Menu → Inventory to unlock skills|メニューの持ち物で化合物を合成するとスキルが解放されます
施放|Cast |発動：
技能尚未解鎖|Skill not unlocked|スキル未解放
彈藥：|Ammo: |弾：
剩餘|Remaining: |残り：
升級！Lv.|Level up! Lv.|レベルアップ！Lv.
不足：|Not enough: |不足：
需要|Requires |必要：
淨化之水：HP 回復！|Purifying Water: HP restored!|浄化の水：HP回復！
結晶爆破！|Crystal Burst!|結晶爆破！
煙霧彈：怪物暫時失明！|Smoke Bomb: monsters temporarily blinded!|煙幕弾：敵の視界を一時的に遮断！
腐蝕陷阱已放置！|Corrosive trap placed!|腐食トラップを設置！
石盾：無敵 2 秒！|Stone Shield: invincible for 2 seconds!|石の盾：2秒間無敵！
甲烷爆炸！！！|Methane Blast!|メタン爆発！
急凍結晶！|Frost Crystal!|氷結結晶！
酸霧噴射！|Acid Mist!|酸の霧を噴射！
獲得經驗值 100，收集了|Gained 100 EXP. Elements in inventory: |経験値100を獲得。所持元素：
個元素！| elements!|個！
圖鑑解鎖：|Codex unlocked: |図鑑解放：
亮框：已納入遊戲的|Highlighted: in-game elements, |明るい枠：ゲームに登場する
種元素| elements|種類の元素
灰色：尚未納入|Gray: not in game yet|灰色：未登場
左上角為原子序，×數字為庫存。手機可左右滑動查看整張表。|Atomic number is at top left; × shows stock. Swipe sideways on mobile to view the full table.|左上は原子番号、×の数字は所持数です。スマホでは左右にスワイプして全体を見られます。
元素週期表，可左右捲動|Periodic table, scroll horizontally|元素周期表、左右にスクロールできます
原子序|Atomic number |原子番号
已納入遊戲，庫存|In game, stock: |登場済み、所持数：
尚未納入遊戲|Not in game yet|未登場
鑭系|Lanthanides|ランタノイド
錒系|Actinides|アクチノイド
元素排列參考：IUPAC 元素週期表|Layout: IUPAC periodic table|配列参考：IUPAC元素周期表
共用元素背包|Shared element inventory|共通の元素持ち物
兩位角色共用元素及圖鑑。合成經驗歸給目前角色；本次解鎖的技能可由元素法師使用。|Both characters share elements and the codex. Crafting EXP goes to the current character; unlocked skills can be used by the mage.|元素と図鑑は両キャラクター共通です。合成経験値は現在のキャラクターに入り、解放したスキルは魔法使いが使用できます。
兩位角色共用元素及圖鑑。合成經驗歸給目前角色。|Both characters share elements and the codex. Crafting EXP goes to the current character.|元素と図鑑は両キャラクター共通です。合成経験値は現在のキャラクターに入ります。
查看完整週期表|View full periodic table|周期表全体を見る
已納入|Included: |登場済み：
合成配方|Crafting recipes|合成レシピ
再合成|Craft again|再合成
化學圖鑑|Chemistry codex|化学図鑑
點開卡片，看看化學式藏在哪些生活用品裡。知識可以先讀，遊戲技能要合成才會解鎖。|Open a card to discover chemistry in everyday objects. Read the facts anytime; craft compounds to unlock game skills.|カードを開いて身近な物の化学を発見しよう。知識はいつでも読めますが、スキルの解放には合成が必要です。
化學式右下的小數字表示原子個數或比例，沒寫數字就是 1。遊戲合成不是現實的製作方法。|Subscript numbers show atom counts or ratios; no number means 1. In-game crafting is not a real-world recipe.|化学式の右下の数字は原子数や比率を表し、省略されていると1です。ゲームの合成は現実の製造方法ではありません。
已收集|Collected|収集済み
待合成|Not crafted|未合成
每個分子的組成|Atoms in each molecule|1分子の構成
元素的最簡比例|Simplest element ratio|元素の最も簡単な比
生活中的化學：|Everyday chemistry: |身近な化学：
遊戲技能：|Game skill: |ゲームのスキル：
首次合成後解鎖。|Unlocked after first crafting.|初回合成で解放。
來源（英文）：|Source (English): |出典（英語）：
返回圖鑑|Back to codex|図鑑へ戻る
武器|Weapon|武器
等級|Level|レベル
經驗值|Experience|経験値
弓手不能施放技能|Archers cannot cast skills|弓使いはスキルを使えません
擊敗怪物|Monsters defeated|倒した敵
攻擊力|Attack power|攻撃力
共用圖鑑|Shared codex|共通図鑑
已收集配方|Collected recipes|収集済みレシピ
馬尾弓手：按住弓箭按鈕（鍵盤 Z 或空白鍵）集氣，放開射箭。短按單箭；小金色氣焰是三箭，大金色氣焰是大箭（可打碎岩石）。可以邊走邊集氣；射出後短暫硬直，箭碰到地形或怪物就停。你仍可以合成、收集與閱讀圖鑑，但弓手不能施放技能。|Archer: hold the bow button (Z or Space) to charge, then release to shoot. Tap for one arrow; a small gold aura means three arrows, a large gold aura means a rock-breaking arrow. Charge while moving. Firing causes brief recovery; arrows stop at terrain or monsters. You can still craft, collect and read the codex, but cannot cast skills.|弓使い：弓ボタン（Z・スペース）を長押しでため、離して発射。短押しは単発、小さな金色のオーラは3本矢、大きな金色のオーラは岩を砕く大矢。移動しながらためられます。発射後に短い硬直があり、矢は地形や敵に当たると止まります。合成・収集・図鑑閲覧はできますが、スキルは使えません。
操作說明|How to play|遊び方
鍵盤|Keyboard|キーボード
方向鍵|Arrow keys|矢印キー
近戰攻擊|Melee attack|近接攻撃
點擊上方元素欄切換彈種）|tap the element bar to change ammo)|上の元素欄で弾を切替）
切換技能|Cycle skills|スキル切替
觸控|Touch|タッチ操作
按住遊戲區任意位置拖曳，放開停止|Touch and drag anywhere in the game area; release to stop|ゲーム画面を長押ししてドラッグ、離すと停止
右側左下「普攻」大圓鈕|Large Attack button at lower left of the action cluster|右側操作エリア左下の「攻撃」ボタン
射擊元素彈|Fire elemental shot|元素弾を発射
右下「元素彈」圓鈕|Element shot button at lower right|右下の「元素弾」ボタン
切換彈種|Change ammo|弾を切替
點擊元素欄|Tap the element bar|元素欄をタップ
選擇技能|Select a skill|スキルを選択
點上方 1～4 技能格（只選招）|Tap skill slot 1–4 (select only)|上のスキル枠1〜4をタップ（選択のみ）
施放技能|Cast a skill|スキル発動
右上「技能」大圓鈕|Large Skill button at upper right|右上の「スキル」ボタン
遊戲提示|Tips|ヒント
擊敗怪物會掉落元素字母，靠近自動拾取|Defeated monsters drop elements; approach to collect them|敵が落とす元素に近づくと自動で拾います
收集足夠元素後，在背包頁面合成化學式|Collect enough elements, then craft compounds in Inventory|元素を集めたら持ち物で化合物を合成しよう
首次合成可解鎖技能並自動裝備|First-time crafting unlocks and auto-equips a skill|初回合成でスキルを解放して自動装備
攻擊岩石有機率掉落元素|Breaking rocks may drop elements|岩を攻撃すると元素が出ることがあります
射擊會消耗背包中的元素|Shots consume elements from your inventory|元素弾は持ち物の元素を消費します
擊敗 Boss 完成本次探索|Defeat the Boss to finish this exploration|ボスを倒すと今回の探索が完了
死亡會失去地圖進度，但保留等級與元素|Death resets the map, but keeps your level and elements|倒れるとマップはリセットされますが、レベルと元素は残ります
元素週期表|Periodic table|元素周期表
返回背包|Back to inventory|持ち物へ戻る
返回選角會結束這次探索。角色經驗、元素和圖鑑會保留，房間進度不保留。確定返回？|Returning to character selection ends this exploration. Experience, elements and the codex are kept, but room progress is lost. Return?|キャラクター選択に戻ると今回の探索は終了します。経験値・元素・図鑑は残りますが、部屋の進行状況は失われます。戻りますか？
地圖|Map|マップ
遠距弓箭|Ranged bow|遠距離の弓
可邊走邊集氣，放開射擊|Charge while moving; release to shoot|移動しながらため、離すと発射
不能施放技能|Cannot cast skills|スキル使用不可
近戰魔杖|Melee wand|近接の杖
可發射元素彈與施放合成技能|Fire elemental shots and cast crafted skills|元素弾と合成スキルを使用可能
共用元素|Shared elements|共通の元素
個|items|個
排名|Rank|順位
暱稱|Nickname|ニックネーム
可以在|You can post again in |再投稿まで
秒後再發布主題或回覆。| seconds.|秒です。
發文太快了，請等倒數結束再送出。|Please wait for the countdown before posting again.|カウントダウンが終わってから投稿してください。
討論區暫時無法登入，請稍後重試。|Cannot sign in to the discussion. Please try again later.|掲示板にログインできません。しばらくしてから再試行してください。
目前無法讀寫討論區，請稍後重試。|Discussion access is unavailable. Please try again later.|掲示板にアクセスできません。しばらくしてから再試行してください。
連線失敗，請檢查網路並重試。|Connection failed. Check your network and try again.|接続に失敗しました。ネットワークを確認して再試行してください。
查看回覆|View replies|返信を見る
載入更早的回覆|Load older replies|過去の返信を表示
你的回覆（最多 1000 字）|Your reply (up to 1000 characters)|返信（1000文字以内）
送出回覆|Post reply|返信する
讀取回覆中…|Loading replies…|返信を読み込み中…
沒有更早的回覆了。|No older replies.|これ以前の返信はありません。
還沒有回覆。|No replies yet.|まだ返信はありません。
可再按一次載入。|Press again to retry.|もう一度押すと再試行できます。
關閉再展開可重試。|Close and reopen to retry.|閉じて開き直すと再試行できます。
請先在上方填寫 1～20 字的暱稱。|Enter a nickname of 1–20 characters above first.|先に上の欄に1〜20文字のニックネームを入力してください。
回覆請填寫 1～1000 字。|Replies must be 1–1000 characters.|返信は1〜1000文字で入力してください。
回覆送出中…|Posting reply…|返信を送信中…
回覆已送出。|Reply posted.|返信しました。
讀取更早的主題…|Loading older topics…|過去のトピックを読み込み中…
讀取討論中…|Loading discussion…|掲示板を読み込み中…
每次載入最多 20 則主題。|Up to 20 topics are loaded at a time.|1回に最大20件のトピックを表示します。
沒有更早的主題了。|No older topics.|これ以前のトピックはありません。
還沒有討論。|No discussions yet.|まだ投稿はありません。
討論區尚未開放，請稍後再來。|Discussion is not available yet. Please check back later.|掲示板はまだ利用できません。また後でお越しください。
暱稱請填寫 1～20 字。|Enter a nickname of 1–20 characters.|ニックネームは1〜20文字で入力してください。
內容請填寫 1～1000 字。|Content must be 1–1000 characters.|内容は1〜1000文字で入力してください。
主題送出中…|Posting topic…|トピックを送信中…
主題已送出。|Topic posted.|投稿しました。
技能|Skill|スキル
移動|Move|移動
關閉|Close|閉じる
排行榜|Leaderboard|ランキング
本次探索分數|Exploration score|今回の探索スコア
登錄分數|Submit score|スコアを登録
暱稱會公開顯示，請勿填寫個人資料。|Your nickname will be public. Do not enter personal information.|ニックネームは公開されます。個人情報を入力しないでください。
送出成績|Submit score|スコアを送信
略過登錄|Skip submission|登録をスキップ
成績送出中…|Submitting score…|スコアを送信中…
成績已儲存！|Score saved!|スコアを保存しました！
這局成績已儲存。|This score has already been saved.|このスコアは保存済みです。
成績尚未儲存，請檢查網路後重試。|Score not saved. Check your network and try again.|保存できませんでした。ネットワークを確認して再試行してください。
尚未確認成績是否儲存，請檢查網路後重試。|Could not confirm the score was saved. Check your network and try again.|保存できたか確認できません。ネットワークを確認して再試行してください。
目前無法登錄成績，請稍後重試。|Score submission is unavailable. Please try again later.|現在スコアを登録できません。しばらくしてから再試行してください。
送出太快，請稍候幾秒再試。|Please wait a few seconds before submitting again.|数秒待ってから再度送信してください。
讀取排行榜中…|Loading leaderboard…|ランキングを読み込み中…
目前無法讀取排行榜，請稍後重試。|Leaderboard unavailable. Please try again later.|ランキングを読み込めません。しばらくしてから再試行してください。
還沒有成績，來成為第一位吧！|No scores yet. Be the first!|まだスコアがありません。一番乗りを目指そう！
每人最高分・前 20 名|Personal bests · Top 20|各プレイヤーの自己ベスト・上位20名
同一瀏覽器的匿名玩家共用紀錄；換裝置或清除資料會視為新玩家。|Anonymous scores belong to this browser. Changing devices or clearing data creates a new player.|記録はこのブラウザの匿名プレイヤーに紐づきます。端末変更やデータ削除後は別のプレイヤーになります。
重新整理|Refresh|更新
本局分數：|This run: |今回のスコア：
無效的成績。|Invalid score.|無効なスコアです。
無效的遊玩時間。|Invalid play duration.|無効なプレイ時間です。
一般怪 10・分子怪 30・Boss 100 分|Normal 10 · Molecular 30 · Boss 100 points|通常の敵10・分子の敵30・ボス100点
語言|Language|言語
`;
  window.GameTranslations = Object.fromEntries(rows.trim().split('\n').map(row => {
    const [source, en, ja] = row.split('|');
    return [source, [en, ja]];
  }));
  window.GameTranslations['化學益智遊戲實驗室 | Chem Puzzle Lab'] = ['Chem Puzzle Lab', '化学パズル実験室 | Chem Puzzle Lab'];
})();
