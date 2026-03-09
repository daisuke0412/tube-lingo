# YouTube 字幕取得 PoC レポート

## 目的

YouTubeの動画から英語字幕（手動 / 自動生成）をプログラムで取得する方法を検証する。

---

## YouTube 字幕配信の仕組み

### 字幕データの流れ

```
1. ブラウザが YouTube 動画ページにアクセス
   └→ HTMLレスポンスに ytInitialPlayerResponse が埋め込まれる
       └→ captionTracks 配列（字幕トラック一覧）
           └→ 各トラックに timedtext API の baseUrl が含まれる
              ※ この baseUrl は「テンプレートURL」で、PoToken が含まれていない

2. YouTubeプレーヤー（JS）が初期化される
   └→ BotGuard チャレンジを実行
       └→ PoToken（Proof of Origin Token）を生成

3. 動画再生時、プレーヤーが字幕をリクエスト
   └→ baseUrl + PoToken を付与して timedtext API へリクエスト
       └→ 正しい PoToken があれば → 字幕データが返る
          PoToken がなければ → 200 OK だが空レスポンス（0 bytes）
```

### 2種類の timedtext URL

```
■ HTMLに埋め込まれた baseUrl（テンプレート、トークンなし）
  https://www.youtube.com/api/timedtext
    ?v=AJpK3YTTKZ4&ei=xxxxx&caps=asr&xoaf=5&hl=ja&lang=ja
    → Node.js fetch で叩くと 200 OK だが 0 bytes

■ プレーヤーが実際にリクエストする URL（PoToken付き）
  https://www.youtube.com/api/timedtext
    ?v=AJpK3YTTKZ4&ei=xxxxx&caps=asr&xoaf=5&hl=ja&lang=ja&token=XXXXXXXXX
    → Node.js fetch でも字幕データが返る
```

### captionTracks の例（AJpK3YTTKZ4）

| 言語 | 種別 | languageCode |
|---|---|---|
| ドイツ語 | 手動 | de |
| フランス語 | 手動 | fr |
| 英語 | 手動 | en |
| 英語（自動生成） | ASR | en |
| 韓国語 | 手動 | ko |
| 日本語 | 手動 | ja |

### timedtext URL の主要パラメータ

| パラメータ | 意味 |
|---|---|
| `v` | 動画ID |
| `ei` | セッション固有のイベントID |
| `xoaf=5` | PoToken による保護が有効であることを示すフラグ |
| `xowf=1` | 同上 |
| `lang` | 字幕の言語コード |
| `fmt` | 出力形式（省略=XML、`json3`=JSON、`srv3`=SRV3） |

---

## PoToken（Proof of Origin Token）とは

YouTubeが2024年頃から導入したBot対策の仕組み。

- ブラウザ内で BotGuard の JavaScript により生成されるトークン
- 正規のYouTubeプレーヤーからのリクエストであることを証明する
- サーバーサイド（Node.js）や curl からのリクエストにはこのトークンが付与されないため、**200 OK だがレスポンスボディが空（0 bytes）** という挙動になる
- headless ブラウザ（Chromium headless）も検出対象
- **PoToken 付きの完全なURLがあれば、cookie やヘッダーなしでも Node.js fetch で字幕が取得できる**（検証で確認済み）

---

## 検証結果

### 方法1: `youtube-transcript` ライブラリ

```javascript
const { YoutubeTranscript } = require("youtube-transcript");
const result = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
```

**結果: ✕ 失敗** — `result` が空配列 `[]`

**原因:** 内部的に timedtext URL を Node.js の fetch で叩いているが、PoToken がないため空レスポンスが返る。ライブラリ側はエラーにならず空配列として返却する。

---

### 方法2: `youtubei.js` ライブラリ（Innertube）

```javascript
const { Innertube } = require("youtubei.js");
const yt = await Innertube.create();
const info = await yt.getInfo(videoId);
const transcript = await info.getTranscript();
```

**結果: ✕ 失敗** — パーサーエラー + `get_transcript` API が 400 を返却

**原因:**
- `Failed to extract signature decipher function` — YouTubeのプレーヤーJS変更にライブラリが追従できていない
- `Type mismatch, got ListItemView expected MenuServiceItem` — YouTubeのレスポンス構造の変更
- `get_transcript` エンドポイントへのリクエストが 400 Bad Request

---

### 方法3: InnerTube Player API 直接リクエスト

```javascript
const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
  method: "POST",
  body: JSON.stringify({ videoId, context: { client: { clientName: "WEB", ... } } }),
});
const data = await res.json();
const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
```

**結果: ✕ 失敗** — `captionTracks` が `null`

**原因:** Player API も PoToken を要求するようになり、Node.js からのリクエストでは字幕トラック情報が返されない。

---

### 方法4: HTMLスクレイピング + timedtext fetch

```javascript
const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`).then(r => r.text());
// HTMLから captionTracks を抽出 → baseUrl を取得 → baseUrl に fetch
```

**結果: ✕ 失敗（部分的成功）**
- HTMLから `captionTracks` の抽出は **成功**（6トラック検出）
- timedtext URL への fetch は **200 OK だがレスポンスが空（0 bytes）**

**原因:** HTMLに埋め込まれた baseUrl はテンプレートURL（PoTokenなし）。このURLで直接 fetch してもサーバーは空レスポンスを返す。curl でも同じ結果。

---

### 方法5: Playwright headless ブラウザ

```javascript
const browser = await chromium.launch({ headless: true });
page.on("response", async (response) => { /* timedtext をキャプチャ */ });
await page.goto(`https://www.youtube.com/watch?v=${videoId}`);
```

**結果: ✕ 失敗** — timedtext リクエストは発生するがレスポンスが空（0 bytes）

**原因:** headless Chromium もBot検出の対象。YouTubeは `navigator.webdriver` やその他の手法でheadlessブラウザを識別し、BotGuard が有効な PoToken を生成しない。

---

### 方法6: Playwright headful ブラウザ ✅

```javascript
const browser = await chromium.launch({
  headless: false,
  args: ["--disable-blink-features=AutomationControlled"],
});
page.on("response", async (response) => { /* timedtext をキャプチャ */ });
await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
  waitUntil: "domcontentloaded",
});
```

**結果: ◎ 成功** — 8,580 bytes の字幕データ（JSON形式）を取得。70件の字幕セグメント。

**成功の理由:**
- headful（GUI表示あり）のChromiumは通常のブラウザとして認識される
- `--disable-blink-features=AutomationControlled` で自動化検出を回避
- BotGuard が正常に動作し、有効な PoToken を生成
- YouTubeプレーヤーが PoToken 付きで timedtext リクエストを送信
- ネットワーク監視でそのレスポンスをキャプチャ

---

### 方法7: ハイブリッド方式（Playwright headful → Node.js fetch） ✅

Playwright headful で PoToken 付きの timedtext URL をキャプチャし、その URL を Node.js fetch で再利用できるか検証。

```javascript
// Phase 1: Playwright headful でURLをキャプチャ
page.on("request", (request) => {
  if (request.url().includes("timedtext")) capturedUrl = request.url();
});
await page.goto(...);
await page.click("video");  // 動画再生で字幕リクエスト発生

// Phase 2: キャプチャしたURLを Node.js fetch で再利用
const res = await fetch(capturedUrl);  // cookie なしでも OK
```

**結果:**

| テスト | 内容 | 結果 |
|---|---|---|
| テスト1 | cookie + ヘッダー付きで fetch | **◎ 成功** (8,580 bytes) |
| テスト2 | cookie + `fmt=json3` で fetch | **◎ 成功** (8,580 bytes) |
| テスト3 | **cookie なし、URL のみ**で fetch | **◎ 成功** (8,580 bytes) |
| テスト4 | 別動画の videoId に差し替えて fetch | ✕ 失敗 (404) |

**重要な発見:**
- **PoToken 付きの URL さえあれば、cookie もヘッダーも不要で Node.js fetch で字幕が取得できる**
- ただし URL は動画ごとに固有（`ei` やトークンがセッションに紐づく）ため、videoId の差し替えでは使い回せない
- トークンには有効期限がある可能性がある

---

### 方法8: Playwright new-headless モード (`--headless=new`) ✅ 🏆

Chrome 112+ で追加された `--headless=new` モードを使用。従来の headless とは異なり、**headful と同じ Blink レンダリングエンジン**を使用するため、BotGuard が正常に動作する。

```javascript
const browser = await chromium.launch({
  headless: true,
  args: [
    "--headless=new",
    "--disable-blink-features=AutomationControlled",
  ],
});
const context = await browser.newContext({
  locale: "en-US",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
});
const page = await context.newPage();
await page.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
});
page.on("response", async (response) => { /* timedtext をキャプチャ */ });
await page.goto(`https://www.youtube.com/watch?v=${videoId}`);
```

**結果: ◎ 成功** — 9,652 bytes の字幕データを取得。headful と完全に同一の結果。

| テスト | 内容 | 結果 |
|---|---|---|
| テスト1 | `--headless=new` のみ | **◎ 成功** (9,652 bytes) |
| テスト2 | `--headless=new` + 検出回避強化 | **◎ 成功** (9,652 bytes) |
| テスト3 | headful（ベースライン比較） | **◎ 成功** (9,652 bytes) |

**成功の理由:**
- `--headless=new` は headful と同じ Blink エンジンを使用（従来の headless は別実装だった）
- BotGuard のブラウザ指紋検査をパスし、有効な PoToken を生成
- **GUI 不要（ディスプレイ不要）**で完全に動作
- 追加の検出回避フラグ（`--disable-features=IsolateOrigins` 等）は不要（テスト1で十分）

**従来の headless との違い:**

| 項目 | 従来の headless | `--headless=new` |
|---|---|---|
| エンジン | 独自実装 | headful と同一の Blink |
| BotGuard | 検出される → PoToken 無効 | パスする → PoToken 有効 |
| GUI | 不要 | 不要 |
| 対応バージョン | 全バージョン | Chrome 112+ |

---

## 結果サマリ

| # | 方法 | 結果 | 失敗原因 / 成功理由 |
|---|---|---|---|
| 1 | `youtube-transcript` ライブラリ | ✕ | PoToken なし → 空配列 |
| 2 | `youtubei.js` (Innertube) | ✕ | パーサー型不一致 + API 400 |
| 3 | InnerTube Player API 直接 | ✕ | captionTracks が null |
| 4 | HTMLスクレイピング + fetch | ✕ | baseUrl にPoToken なし → 空レスポンス |
| 5 | Playwright headless | ✕ | headless 検出 → PoToken 無効 |
| 6 | Playwright headful | ◎ | 通常ブラウザ認識 → PoToken 有効 |
| 7 | ハイブリッド（headful → fetch） | ◎ | PoToken付きURL は cookie 不要で再利用可 |
| 8 | **Playwright new-headless** | **◎🏆** | **headful と同じエンジン → PoToken 有効 + GUI 不要** |

---

## 制約と注意事項

### new-headless 方式の制約

- ~~**GUIが必要**~~ → `--headless=new` により **GUI 不要** ✅
- **処理時間** — ブラウザ起動 + ページ読み込み + 字幕キャプチャで約5〜10秒
- **リソース消費** — Chromium 1プロセスで 100〜200MB のメモリを使用
- **英語字幕の選択** — キャプチャした timedtext URL の `lang` パラメータを `en` に書き換えて再取得する戦略で対応
- **URL の有効期限** — PoToken付きURLがどの程度の時間有効かは未検証
- **Chromium バイナリ** — サーバーに Chromium バイナリが必要（`npx playwright install chromium` でインストール）

### デプロイ可能な環境

| 環境 | headful | new-headless | 備考 |
|---|---|---|---|
| ローカル PC | ◎ | ◎ | 推奨 |
| VPS (Linux) | ○ (Xvfb必要) | **◎ (不要)** | new-headless なら追加設定なし |
| Docker | ○ (Xvfb必要) | **◎ (不要)** | Chromium バイナリのみ必要 |
| Vercel / AWS Lambda | ✕ | △ | Chromium バイナリサイズ制限あり |

---

## 採用方針

**方法8（Playwright new-headless）を採用。**

### 実装方針

1. `/api/transcript` API ルートで Playwright `--headless=new` を使用
2. Chromium を起動 → YouTube 動画ページにアクセス → timedtext レスポンスをネットワーク監視でキャプチャ
3. 英語字幕が必要な場合はキャプチャした URL の `lang` パラメータを書き換えて Node.js fetch で再取得
4. MVP 段階ではリクエストごとにブラウザ起動・終了（将来的にブラウザ再利用で高速化可能）

### 将来の最適化案

- **ブラウザインスタンス再利用** — 起動コスト（1〜2秒）を削減
- **Docker + new-headless でデプロイ** — Xvfb 不要で軽量コンテナ化
- **PoToken 生成ライブラリの動向追跡** — `bgutils-js` 等が安定したらブラウザ不要に
