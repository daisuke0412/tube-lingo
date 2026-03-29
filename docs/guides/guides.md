# TubeLingo 開発ガイド

## アーキテクチャ概要

::: mermaid
graph LR
    User[ユーザー] --> SPA

    subgraph Frontend["フロントエンド"]
        SPA[React SPA]
    end

    subgraph Backend["バックエンド"]
        Router[FAST API]
    end

    SPA -->|リクエスト| Router
    Router -->|レスポンス| SPA

    Router -->|youtube-transcript-api| YouTube[YouTube字幕]
    Router -->|Anthropic SDK| Claude[Claude API]

    classDef frontend fill:#e8f5e8,stroke:#388e3c
    classDef backend fill:#fce4ec,stroke:#c2185b
    classDef external fill:#fff3e0,stroke:#f57c00

    class SPA frontend
    class Router,Service backend
    class YouTube,Claude external
:::

### MCPサーバ アーキテクチャ

::: mermaid
graph LR
    Client[MCPクライアント<br/>Claude Desktop / Claude Code等] -->|MCP Protocol<br/>stdio| MCPServer

    subgraph MCPServer["mcp-server (Python)"]
        Server[MCP Server]
        Tool1["get_transcript<br/>YouTube字幕取得ツール"]
        Server --> Tool1
    end

    Tool1 -->|youtube-transcript-api| YouTube[YouTube字幕]

    classDef mcp fill:#e3f2fd,stroke:#1565c0
    classDef backend fill:#fce4ec,stroke:#c2185b
    classDef external fill:#fff3e0,stroke:#f57c00
    classDef client fill:#f3e5f5,stroke:#7b1fa2

    class Server,Tool1 mcp
    class Router,Service backend
    class YouTube external
    class Client client
:::

> MCPサーバは `backend/` の字幕取得ロジックと同じ `youtube-transcript-api` を使用するが、
> 独立したプロセスとして動作する。MCPクライアント（Claude Desktop等）から stdio トランスポートで接続する。

## アプリのディレクトリ構成イメージ

```
tube-lingo/
├── frontend/                         # React SPA (Vite)
│   ├── index.html                    # エントリポイント HTML
│   ├── vite.config.ts                # Vite 設定（/api → FastAPI プロキシ含む）
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx                  # ReactDOM.createRoot
│       ├── App.tsx                   # React Router ルート定義
│       ├── pages/                    # ページコンポーネント
│       │   ├── HomePage.tsx          # / 初期画面
│       │   └── LearnPage.tsx         # /learn/:videoId 学習画面
│       ├── features/                 # 機能単位のモジュール
│       │   ├── init/                 # 初期画面（URL入力）
│       │   │   ├── components/
│       │   │   │   ├── mock/         # モックコンポーネント（実装後も残す）
│       │   │   │   └── InitScreen.tsx
│       │   │   └── hooks/
│       │   │       └── useInitForm.ts
│       │   ├── learning/             # 学習画面
│       │   └── ai-chat/              # AIチャット
│       ├── shared/                   # 複数featureをまたぐ共通資産
│       │   ├── lib/                  # 共有の
│       │   └── types/                # 共有の型定義
│       └── providers/
│           └── ThemeRegistry.tsx     # MUI ThemeProvider
├── backend/                          # FastAPI (Python)
│   ├── requirements.txt              # 依存パッケージ
│   └── app/
│       ├── main.py                   # FastAPI アプリ定義・CORS・ルーター登録
│       ├── config.py                 # 設定値（CORSオリジン等）
│       ├── routers/                  # エンドポイント定義のみ（薄いラッパー）
│       │   ├── transcript.py         # GET /api/transcript?url=...
│       │   └── explain.py            # POST /api/explain（SSEストリーミング）
│       ├── services/                 # ビジネスロジック
│       │   ├── transcript.py         # YouTube字幕取得ロジック
│       │   └── explain.py            # Claude API呼び出し・SSE生成ロジック
│       └── prompts/                  # プロンプトテンプレート
│           ├── explain_initial.txt   # P-01 初回解説プロンプト
│           └── explain_followup.txt  # P-02 追加質問プロンプト
├── mcp-server/                      # MCPサーバ (Python)
│   ├── requirements.txt              # 依存パッケージ
│   ├── server.py                     # MCPサーバ エントリポイント
│   └── tools/
│       └── transcript.py             # get_transcript ツール実装
├── docs/
│   ├── requirements/
│   │   └── requirements.md           # アプリ概要・機能要件・MVP範囲
│   ├── guides/
│   │   └── guides.md                 # 技術スタック・ディレクトリ構成・規約（このファイル）
│   └── designs/
│       ├── screens/                  # 画面設計書
│       │   └── screens.md            # 画面インデックス・遷移図
│       ├── apis/                     # API設計書
│       └── prompts/                  # プロンプト設計書
├── poc/
└── CLAUDE.md
```

## 技術スタック

### フロントエンド

| 技術 | バージョン |
|---|---|
| React + Vite | React 19.x / Vite 6.x |
| React Router | v7.x |
| TypeScript | 5.x |
| Material UI (MUI) | v7.x |

#### Tailwind CSS は使わない
スタイルは **MUI の `sx` prop** で統一する。
`style=` 属性は原則禁止（MUI の仕組みで管理する）。

### バックエンド

| 技術 | バージョン |
|---|---|
| FastAPI (Python) | 0.115+ |
| Pydantic | v2.x（FastAPI 同梱） |
| Python | 3.12+ |
| Anthropic Python SDK | 0.49+ |
| Claude API (`claude-sonnet系`) | - |
| youtube-transcript-api | 1.2+ |

### MCPサーバ

| 技術 | バージョン |
|---|---|
| Python | 3.12+ |
| mcp (Python SDK) | 1.x |
| youtube-transcript-api | 1.2+ |

> トランスポートは **stdio** を使用。Claude Desktop / Claude Code の MCP設定で `mcp-server/server.py` を指定して接続する。


## コーディング規約

### 言語・型
- TypeScript を使用（フロントエンド）。`any` 禁止。型は必ず定義する
- API レスポンスの型は `frontend/src/shared/types/index.ts` で一元管理
- Python は型ヒントを使用。Pydantic モデルでリクエスト/レスポンスを定義

### コンポーネント
- React の関数コンポーネントのみ使用
- MUI コンポーネントを優先的に使用し、独自実装は最小限に抑える

### コメント
- コメントは日本語で書く

### エラーハンドリング
- エラーハンドリングは各設計書に従う

## セキュリティ原則

### APIキーの扱い
- ユーザーのAnthropicキーは **React の state（メモリ上）にのみ保持**する
- `localStorage` / `sessionStorage` / Cookie には **一切保存しない**
- ページ・タブを閉じると即座に消える（意図的な設計）
- `/api/explain` へのリクエスト時にヘッダー（`x-api-key`）で渡す
- サーバー側はキーをメモリにも残さない（リクエストごとに廃棄）
- サーバーのログに絶対に出力しない

### XSS防止
- `dangerouslySetInnerHTML` は使わない
- 字幕テキストはエスケープして表示（MUI の `Typography` に渡すだけでOK）

---

## AIモデル設定

- 使用モデル: `claude-sonnet` の最新モデルをなるべく利用
- このファイルの記載を変更しない限り、コード内で勝手に変更しない
