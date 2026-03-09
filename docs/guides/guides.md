# TubeLingo 開発ガイド

## アプリのディレクトリ構成

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
│       │   │   │   └── InitScreen.tsx
│       │   │   └── hooks/
│       │   │       └── useInitForm.ts
│       │   ├── learning/             # 学習画面
│       │   └── ai-chat/              # AIチャット
│       ├── shared/                   # 複数featureをまたぐ共通資産
│       │   ├── lib/
│       │   │   └── youtube.ts
│       │   └── types/
│       │       └── index.ts
│       └── providers/
│           └── ThemeRegistry.tsx      # MUI ThemeProvider
├── backend/                          # FastAPI (Python)
│   ├── requirements.txt
│   └── app/
│       ├── main.py                   # FastAPI アプリ定義・CORS・ルーター登録
│       └── routers/
│           ├── transcript.py         # GET /api/transcript?url=...
│           └── explain.py            # POST /api/explain（SSEストリーミング）
├── docs/
├── poc/
└── CLAUDE.md
```

### ディレクトリ構成の方針

| ディレクトリ | 役割 |
|---|---|
| `frontend/src/pages/` | ルーティングに対応するページコンポーネント |
| `frontend/src/features/<name>/` | 機能単位のモジュール。components/ と hooks/ を内包 |
| `frontend/src/shared/` | 複数 feature をまたいで使う共通資産 |
| `frontend/src/providers/` | アプリ全体に影響するグローバル Provider |
| `backend/app/routers/` | FastAPI のエンドポイント定義 |

`features/` 配下は、基本的に画面単位で作成すること。学習画面とAIチャットモーダルは別画面として扱う。


## 技術スタック

### フロントエンド

| 技術 | バージョン |
|---|---|
| React + Vite | React 19.x / Vite 6.x |
| React Router | v7.x |
| TypeScript | 5.x |
| Material UI (MUI) | v7.x |

#### Tailwind CSS は使わない
スタイルは **MUI の `sx` prop および `styled()`** で統一する。
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
- APIエラーは日本語メッセージでユーザーに表示する
- エラーコードの定義は [docs/requirements/requirements.md#エラー定義](../requirements/requirements.md#エラー定義) を参照


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

---

## 開発コマンド

```bash
# 初回セットアップ
pnpm setup                # frontend の依存 + backend の venv + pip install

# 開発サーバー起動（フロントエンド + バックエンドを同時起動）
pnpm dev                  # localhost:5173 (Vite) + localhost:8000 (FastAPI)

# 個別起動
pnpm dev:frontend         # Vite dev server (localhost:5173)
pnpm dev:backend          # FastAPI (localhost:8000)

# ビルド・チェック
pnpm build                # フロントエンドのプロダクションビルド
pnpm lint                 # ESLint
pnpm type-check           # tsc --noEmit
```

---

## デプロイ方針

### ローカル実行（MVP）

YouTube の字幕取得は住宅IPが必須（クラウドIPはブロックされる）のため、
MVP ではローカルマシンでバックエンドを起動する構成を採用。

```
[ブラウザ] → [Vite dev / ビルド済みSPA] → [ローカル FastAPI :8000]
                                               ├── YouTube字幕取得（住宅IP）
                                               └── Claude API呼び出し
```

### 将来の拡張
- 外部公開
- Docker Compose でコンテナ化
