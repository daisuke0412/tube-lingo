# A-02 AI解説 API

| 項目 | 内容 |
|---|---|
| API ID | A-02 |
| API名 | AI解説（SSEストリーミング） |
| エンドポイント | `POST /api/explain` |
| 関連機能 | F-06, F-07 |
| 関連画面 | S-02-M AIチャットモーダル |

---

## リクエスト

### ヘッダー

| ヘッダー | 必須 | 説明 |
|---|---|---|
| `Content-Type` | ✅ | `application/json` |
| `x-api-key` | ✅ | ユーザーの Anthropic API キー（`sk-ant-` で始まる） |

### ボディ（初回）

```json
{
  "selected_text": "photosynthesis",
  "context_lines": [
    { "text": "Plants need sunlight to grow.", "start": 10.0, "duration": 2.5 },
    { "text": "This process is called photosynthesis.", "start": 12.5, "duration": 3.0 },
    { "text": "It converts light into energy.", "start": 15.5, "duration": 2.8 }
  ],
  "user_message": "「photosynthesis」について解説してください。",
  "chat_history": []
}
```

### ボディ（追加質問）

```json
{
  "selected_text": "photosynthesis",
  "context_lines": [
    { "text": "Plants need sunlight to grow.", "start": 10.0, "duration": 2.5 },
    { "text": "This process is called photosynthesis.", "start": 12.5, "duration": 3.0 },
    { "text": "It converts light into energy.", "start": 15.5, "duration": 2.8 }
  ],
  "user_message": "もっと簡単に説明してください。",
  "chat_history": [
    { "role": "user", "content": "「photosynthesis」について解説してください。" },
    { "role": "assistant", "content": "翻訳: 光合成\n\n解説: これは植物が太陽光をエネルギーに変える仕組みについて説明している場面です。..." }
  ]
}
```

### ボディ型定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `selected_text` | `string` | ✅ | ユーザーが選択した字幕テキスト |
| `context_lines` | `TranscriptItem[]` | ✅ | 前後を含む字幕ブロック |
| `user_message` | `string` | ✅ | 今回のユーザーメッセージ |
| `chat_history` | `ChatMessage[]` | ✅ | 過去のチャット履歴（初回は空配列 `[]`） |

**TranscriptItem**

| フィールド | 型 | 説明 |
|---|---|---|
| `text` | `string` | 字幕テキスト |
| `start` | `number` | 開始時刻（秒） |
| `duration` | `number` | 表示継続時間（秒） |

**ChatMessage**

| フィールド | 型 | 説明 |
|---|---|---|
| `role` | `"user" \| "assistant"` | 発言者 |
| `content` | `string` | メッセージ内容 |

---

## レスポンス

### 成功時 `200 OK`（SSE ストリーミング）

```
Content-Type: text/event-stream

data: 光合成

data: とは、

data: 植物が太陽光を

data: 使ってエネルギーを作り出す

data: 仕組みです。

data: [DONE]
```

- 各 `data:` はトークン単位またはチャンク単位のテキスト断片
- `data: [DONE]` でストリーム終了を通知する
- クライアントは受信するたびにチャット欄へ追記表示する

---

## エラーレスポンス

| HTTPステータス | エラーコード | 発生条件 |
|---|---|---|
| `400 Bad Request` | `INVALID_REQUEST` | ボディの必須フィールド欠損・型不正 |
| `401 Unauthorized` | `INVALID_API_KEY` | `x-api-key` が不正または未設定 |
| `429 Too Many Requests` | `RATE_LIMIT` | Anthropic API のレート制限超過 |
| `502 Bad Gateway` | `CLAUDE_ERROR` | Anthropic API 側のエラー |

```json
{
  "detail": "INVALID_API_KEY"
}
```

---

## 処理フロー

```
1. リクエストヘッダーから x-api-key を取得する
2. ボディの selected_text / context_lines / user_message / chat_history を受け取る
3. [router] バリデーション後、services/explain.py へ渡す
4. [service] chat_history が空配列かどうかで分岐する
       │
       ├─ 空（初回）
       │   [service] システムプロンプトを構築する → docs/designs/prompts/p01-explain-initial.md
       │             selected_text / context_lines を埋め込む
       │   [service] messages = [{"role": "user", "content": user_message}]
       │
       └─ 非空（追加質問）
           [service] システムプロンプトを構築する → docs/designs/prompts/p02-explain-followup.md
           [service] messages = chat_history 全件 + {"role": "user", "content": user_message}
5. [service] Anthropic SDK (stream=True) で claude-sonnet 系モデルを呼び出す
             引数: system=システムプロンプト, messages=messages配列
             ├── 認証エラー → INVALID_API_KEY (401)
             ├── レート制限 → RATE_LIMIT (429)
             └── その他エラー → CLAUDE_ERROR (502)
6. [service] ストリームのチャンクを SSE 形式（data: <text>\n\n）に変換しながら yield する
7. [service] ストリーム完了後に data: [DONE]\n\n を送信する
8. [router] StreamingResponse として返却する
9. API キーはリクエスト処理後にスコープを外れ破棄される（メモリにも残さない）
```

---

## セキュリティ

- `x-api-key` はリクエスト処理中のみメモリ上で使用し、ログ・DB・ファイルには一切出力しない
- サーバー側でキーを保持・キャッシュしない
- Claude への呼び出しはユーザーのキーで都度認証する

---

## 備考

- 使用モデルは `claude-sonnet` 系の最新モデル（`docs/guides/guides.md` の AIモデル設定に従う）
- `context_lines` は字幕の前後 1〜2 行を含めた 3〜5 行を推奨（コンテキスト品質とトークンコストのバランス）
- トークン消費目安: 1回の質問あたり 入力〜500 tok / 出力〜300 tok（合計 $0.005〜$0.01 程度）
