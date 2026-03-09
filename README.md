# TubeLingo

YouTubeの英語動画を使って英語学習ができるWebアプリ。

- **フロントエンド**: React + Vite + MUI（`frontend/`）
- **バックエンド**: FastAPI + Python（`backend/`）

---

## ディレクトリ構成

```
tube-lingo/
├── frontend/                          # フロントエンド（React + Vite + MUI）
│   ├── src/
│   │   ├── App.tsx                    # ルーティング定義
│   │   ├── main.tsx                   # エントリポイント
│   │   ├── pages/                     # ページコンポーネント
│   │   │   ├── HomePage.tsx           # / — 初期画面
│   │   │   └── LearnPage.tsx          # /learn/:videoId — 学習画面
│   │   ├── features/                  # 機能単位のモジュール
│   │   │   ├── init/                  # 初期画面（URL入力）
│   │   │   │   ├── components/
│   │   │   │   └── hooks/
│   │   │   ├── learning/              # 学習画面（動画 + 字幕）
│   │   │   │   ├── components/        # LearningScreen, TranslationModal
│   │   │   │   └── hooks/             # useTranscriptSync
│   │   │   └── ai-chat/              # AIチャットモーダル
│   │   │       ├── components/
│   │   │       └── hooks/
│   │   ├── shared/                    # 共通ユーティリティ・型定義
│   │   │   ├── lib/
│   │   │   └── types/
│   │   └── providers/                 # グローバルProvider（テーマ等）
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                           # バックエンド（FastAPI）
│   ├── app/
│   │   ├── main.py                    # FastAPIアプリ（CORS設定・ルーター登録）
│   │   └── routers/
│   │       ├── transcript.py          # GET /api/transcript — 字幕取得
│   │       └── explain.py             # POST /api/explain — AI解説（SSE）
│   ├── .env                           # 環境変数（gitignore対象）
│   ├── .venv/                         # Python仮想環境（gitignore対象）
│   └── requirements.txt
│
├── docs/                              # 設計・仕様ドキュメント
│   ├── requirements/
│   │   └── requirements.md            # 要件定義書
│   ├── designs/
│   │   ├── screens.md                 # 画面インデックス・遷移図
│   │   ├── s01-init.md                # S-01 初期画面
│   │   ├── s02-learning.md            # S-02 学習画面
│   │   └── s02m-ai-chat-modal.md      # S-02-M AIチャットモーダル
│   └── guides/
│       └── guides.md                  # 開発ガイド
│
├── poc/                               # 技術検証スクリプト
├── .claude/                           # Claude Code設定
│   ├── settings.json
│   └── skills/                        # スキル定義
├── CLAUDE.md                          # Claude Code行動指示
└── README.md
```

---

## 起動方法

### 前提

- Node.js 20+、pnpm
- Python 3.12+

### 初回セットアップ

```bash
# フロントエンド
cd frontend && pnpm install

# バックエンド
cd backend
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS / Linux:      source .venv/bin/activate
pip install -r requirements.txt
```

### 起動（フロント + バック同時）

```powershell
# Windows PowerShell
.\start.ps1
```

```bash
# macOS / Linux
bash start.sh
```

### 個別起動

```bash
# フロントエンド (port 5173)
cd frontend && pnpm dev

# バックエンド (port 8000)
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
```


