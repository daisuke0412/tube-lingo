# M-01 字幕取得ツール（MCPサーバ）

| 項目 | 内容 |
|---|---|
| ツール ID | M-01 |
| ツール名 | get_transcript |
| サーバ名 | tube-lingo |
| トランスポート | stdio |
| 関連機能 | F-11 |
| 関連 API | A-01 字幕取得 API（同一ロジックを MCP ツールとして公開） |

---

## 概要

YouTube動画のURLを受け取り、英語字幕をテキストとして返すMCPツール。
Claude Desktop / Claude Code 等のMCPクライアントから利用する。

バックエンド（FastAPI）の字幕取得ロジックと同じ `youtube-transcript-api` を使用するが、
独立したプロセスとして動作し、HTTP ではなく MCP プロトコル（stdio）で通信する。

---

## ツール定義

### 入力パラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | `string` | ✅ | YouTube動画のURL |

### 入力例

```
url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 対応URLフォーマット

| 形式 | 例 |
|---|---|
| `youtube.com/watch?v=` | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| `youtu.be/` | `https://youtu.be/dQw4w9WgXcQ` |

---

## 出力

### 成功時

タイムスタンプ付きの字幕テキストを返す（LLMが読みやすい形式）。

```
[0:18] We're no strangers to love
[0:20] You know the rules and so do I
[0:23] A full commitment's what I'm thinking of
[0:26] You wouldn't get this from any other guy
```

### 出力フォーマット

```
[M:SS] 字幕テキスト
```

- タイムスタンプは `start` を `M:SS` 形式に変換
- 各字幕アイテムを1行ずつ出力
- 先頭に動画情報（URL、総字幕数）を付与する

### 出力例（完全版）

```
YouTube字幕: https://www.youtube.com/watch?v=dQw4w9WgXcQ
字幕数: 42件
言語: en

[0:18] We're no strangers to love
[0:20] You know the rules and so do I
[0:23] A full commitment's what I'm thinking of
...
```

---

## エラーケース

| エラー | 発生条件 | エラーメッセージ |
|---|---|---|
| URL不正 | `url` が YouTube URL として解析できない | `INVALID_URL: YouTube URLの形式が不正です` |
| 字幕なし | 動画に英語字幕が存在しない | `NO_TRANSCRIPT: この動画に英語字幕が見つかりません` |
| YouTube接続エラー | YouTube側のエラー（Bot検知など） | `YOUTUBE_ERROR: YouTubeからの字幕取得に失敗しました` |

> MCP ツールのエラーは `McpError` として返す（HTTPステータスコードではない）。

---

## 処理フロー

```
1. MCPクライアントから get_transcript ツールが呼び出される
2. [tool] url パラメータを受け取る
3. [tool] url から video_id を抽出する
         └── 抽出失敗 → INVALID_URL エラー
4. [tool] youtube-transcript-api で字幕を取得する
         ├── 字幕なし → NO_TRANSCRIPT エラー
         └── YouTube エラー → YOUTUBE_ERROR エラー
5. [tool] 字幕を「[M:SS] テキスト」形式に整形する
6. [tool] 動画情報ヘッダー + 字幕テキストを結合して返却する
```

---

## ファイル構成

```
mcp-server/
├── requirements.txt       # 依存パッケージ
├── server.py              # MCPサーバ エントリポイント（FastMCP初期化・起動）
└── tools/
    └── transcript.py      # get_transcript ツール実装
```

---

## クライアント設定例

### Claude Desktop

`claude_desktop_config.json` に以下を追加:

```json
{
  "mcpServers": {
    "tube-lingo": {
      "command": "python",
      "args": ["C:/path/to/tube-lingo/mcp-server/server.py"]
    }
  }
}
```

### Claude Code

`.claude/settings.json` に以下を追加:

```json
{
  "mcpServers": {
    "tube-lingo": {
      "command": "python",
      "args": ["C:/path/to/tube-lingo/mcp-server/server.py"]
    }
  }
}
```

---

## 依存パッケージ

| パッケージ | バージョン | 用途 |
|---|---|---|
| `mcp` | 1.x | MCP Python SDK（FastMCP） |
| `youtube-transcript-api` | 1.2+ | YouTube字幕取得 |

### requirements.txt

```
mcp>=1.0.0
youtube-transcript-api>=1.2.0
```

---

## 備考

- 字幕は英語（`en`）を優先取得する。存在しない場合は自動生成字幕（`en-US`, `en-GB`）にフォールバック
- MCP ツールの戻り値はテキスト（LLMが読む前提）であり、REST API のような JSON オブジェクトではない
- `backend/` の字幕取得ロジック（`services/transcript.py`）と同一のアルゴリズムだが、コードは独立して管理する（FastAPI の `HTTPException` 等に依存しないため）
- 将来的にツールを追加する場合は `tools/` ディレクトリにファイルを追加し、`server.py` で登録する
