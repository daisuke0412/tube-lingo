# TubeLingo

YouTubeの英語動画を使って英語学習ができるWebアプリ。

---

## ディレクトリ構成

```
tube-lingo/
├── src/
│   ├── app/                           # Next.js App Router（ルーティングのみ）
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── transcript/
│   │       │   └── route.ts           # GET /api/transcript?url=...
│   │       └── explain/
│   │           └── route.ts           # POST /api/explain（SSEストリーミング）
│   ├── features/                      # 機能単位のモジュール
│   │   ├── init/                      # 初期画面（APIキー・URL入力）
│   │   ├── learning/                  # 学習画面
│   │   └── ai-chat/                   # AIチャット
│   ├── shared/                        # 複数featureをまたぐ共通資産
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── providers/                     # グローバルProvider
│       └── ThemeRegistry.tsx
├── e2e/                               # Playwright E2Eテスト
├── docs/
│   ├── requirements/
│   │   └── requirements.md            # 要件定義書
│   ├── designs/
│   │   ├── screens.md                 # 画面インデックス・遷移図
│   │   ├── s01-init.md                # S-01 初期画面
│   │   ├── s02-learning.md            # S-02 学習画面
│   │   └── s02m-ai-chat-modal.md      # S-02-M AIチャットモーダル
│   └── guides/
│       └── guides.md                  # 開発ガイド
├── .claude/
│   ├── settings.json                  # 許可・禁止コマンド設定
│   └── commands/
│       └── e2e-test.md                # /e2e-test → Playwright E2Eテスト作成・実行
├── playwright.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```
