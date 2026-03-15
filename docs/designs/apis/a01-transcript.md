# A-01 字幕取得 API

| 項目 | 内容 |
|---|---|
| API ID | A-01 |
| API名 | 字幕取得 |
| エンドポイント | `GET /api/transcript` |
| 関連機能 | F-02, F-03 |
| 関連画面 | S-02 学習画面 |

---

## リクエスト

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | `string` | ✅ | YouTube動画のURL |

### 例

```
GET /api/transcript?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

---

## レスポンス

### 成功時 `200 OK`

```json
{
  "transcript": [
    {
      "text": "We're no strangers to love",
      "start": 18.24,
      "duration": 2.12
    },
    {
      "text": "You know the rules and so do I",
      "start": 20.36,
      "duration": 2.50
    }
  ]
}
```

### レスポンス型定義

| フィールド | 型 | 説明 |
|---|---|---|
| `transcript` | `TranscriptItem[]` | 字幕アイテムの配列 |

**TranscriptItem**

| フィールド | 型 | 説明 |
|---|---|---|
| `text` | `string` | 字幕テキスト |
| `start` | `number` | 開始時刻（秒） |
| `duration` | `number` | 表示継続時間（秒） |

---

## エラーレスポンス

| HTTPステータス | エラーコード | 発生条件 |
|---|---|---|
| `400 Bad Request` | `INVALID_URL` | `url` パラメータが不正な形式 |
| `404 Not Found` | `NO_TRANSCRIPT` | 動画に字幕が存在しない |
| `502 Bad Gateway` | `YOUTUBE_ERROR` | YouTube側のエラー（Bot検知など） |

```json
{
  "detail": "NO_TRANSCRIPT"
}
```

---

## 処理フロー

```
1. クエリパラメータ url を受け取る
2. [router] url を services/transcript.py へ渡す
3. [service] url から video_id を抽出する
4. [service] youtube-transcript-api で字幕を取得する
             ├── 字幕なし → NO_TRANSCRIPT (404)
             └── YouTube エラー → YOUTUBE_ERROR (502)
5. [service] TranscriptItem[] 形式に整形して返す
6. [router] JSON レスポンスとして返却する
```

---

## 備考

- 字幕は英語（`en`）を優先取得する。存在しない場合は自動生成字幕（`en-US` 等）にフォールバック
- `url` のバリデーションは `youtube.com/watch?v=` または `youtu.be/` 形式を許容
- サーバーサイドで字幕取得するのは、ブラウザから直接 YouTube API を叩くと CORS および Bot 検知の問題があるため
