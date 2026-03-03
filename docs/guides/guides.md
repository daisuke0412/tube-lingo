# TubeLingo 開発ガイド

## アプリのディレクトリ構成

```
TubeLingo/
├── src/
│   ├── app/                          # Next.js App Router（ルーティングのみ）
│   │   ├── layout.tsx                # ルートレイアウト
│   │   ├── page.tsx                  # ルートページ（画面状態管理）
│   │   └── api/
│   │       ├── transcript/
│   │       │   └── route.ts          # GET /api/transcript?url=...
│   │       └── explain/
│   │           └── route.ts          # POST /api/explain（SSEストリーミング）
│   ├── features/                     # 機能単位のモジュール
│   │   ├── init/                     # 初期画面（APIキー・URL入力）
│   │   │   ├── components/
│   │   │   │   └── InitScreen.tsx
│   │   │   └── hooks/
│   │   │       └── useInitForm.ts    # フォームバリデーション・字幕取得
│   │   ├── learning/                 # 学習画面
│   │   └── ai-chat/                  # AIチャット
│   ├── shared/                       # 複数featureをまたぐ共通資産
│   │   ├── components/               # 汎用UIコンポーネント
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── providers/                    # グローバルProvider
│       └── ThemeRegistry.tsx         # MUI ThemeProvider（'use client'）
├── public/
├── e2e/                              # Playwright E2Eテスト
│   ├── fixtures/
│   │   └── test-data.ts              # モックURL・APIキー等の定数
│   ├── s01-init.spec.ts              # S-01 初期画面
│   └── ...
├── playwright.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

### ディレクトリ構成の方針

| ディレクトリ | 役割 |
|---|---|
| `app/` | ルーティング定義のみ。ロジックは features/ に委譲 |
| `features/<name>/` | 機能単位のモジュール。components/ と hooks/ を内包 |
| `shared/` | 複数 feature をまたいで使う共通資産 |
| `providers/` | アプリ全体に影響するグローバル Provider |

`features/` 配下は、基本的に画面単位で作成すること。学習画面とAIチャットモーダルは別画面として扱う。

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 15.x |
| 言語 | TypeScript | 5.x |
| UI コンポーネント | Material UI (MUI) | v6.x |
| AI | Claude API (`claude-sonnet系`) | - |
| 字幕取得 | `youtube-transcript` (npm) | 最新安定版 |
| デプロイ | Vercel | - |

### Tailwind CSS は使わない
スタイルは **MUI の `sx` prop および `styled()`** で統一する。
`style=` 属性は原則禁止（MUI の仕組みで管理する）。

---

## コーディング規約

### 言語・型
- TypeScript を使用。`any` 禁止。型は必ず定義する
- API レスポンスの型は `src/shared/types/index.ts` で一元管理

### コンポーネント
- Server Components を基本とし、インタラクションが必要な箇所だけ `"use client"`
- MUI コンポーネントを優先的に使用し、独自実装は最小限に抑える

### コメント
- コメントは日本語で書く

### エラーハンドリング
- APIエラーは日本語メッセージでユーザーに表示する
- エラーコードの定義は [docs/requirements/requirements.md#エラー定義](../requirements/requirements.md#エラー定義) を参照

---

## セキュリティ原則

### APIキーの扱い
- ユーザーのAnthropicキーは **React の state（メモリ上）にのみ保持**する
- `localStorage` / `sessionStorage` / Cookie には **一切保存しない**
- ページ・タブを閉じると即座に消える（意図的な設計）
- `/api/explain` へのリクエスト時にヘッダー（`x-api-key`）で渡す
- サーバー側のAPIルートはキーをメモリにも残さない（リクエストごとに廃棄）
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
pnpm dev                 # 開発サーバー起動 (localhost:3000)
pnpm build               # プロダクションビルド
pnpm lint                # ESLint
pnpm type-check          # tsc --noEmit
pnpm test:e2e            # Playwright E2E テスト（ヘッドレス）
pnpm test:e2e:ui         # Playwright UIモード
pnpm test:e2e:debug      # Playwright ステップ実行
```

---

## 公開方針

- GitHubでOSSとして公開
- Vercelにデモ環境を用意
- README.md は日本語で書く
