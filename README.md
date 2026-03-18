# TubeLingo

YouTube の英語動画で英語学習ができる Web アプリ。
字幕を見ながら動画を視聴し、分からないフレーズを選択するだけで翻訳や AI 解説が得られます。

主な機能:
- YouTube URL を入力 → 字幕を自動取得・表示
- 動画再生位置に合わせた字幕ハイライト・自動スクロール
- テキスト選択で即時日本語翻訳（MyMemory API）
- テキスト選択で Claude による文脈を踏まえた AI 解説
- AI チャットで追加質問が可能

> ユーザー自身の Anthropic API キーが必要です（アプリ内で入力、メモリ上のみ保持）。

---

## 起動方法

### 前提

| ツール | バージョン |
|---|---|
| Node.js | 20 以上 |
| pnpm | 10 以上 |
| Python | 3.12 以上 |

### 1. フロントエンド（React + Vite）

```bash
cd frontend
pnpm install
```

### 2. バックエンド（FastAPI）

```bash
cd backend
pip install -r requirements.txt
```

### 3. 起動

フロントエンド（port 5173）とバックエンド（port 8000）を同時に起動するスクリプトがあります。

```powershell
# プロジェクトルートで実行
.\start.ps1
```

個別に起動する場合:

```bash
# バックエンド
cd backend
uvicorn app.main:app --reload --port 8000

# フロントエンド（別ターミナル）
cd frontend
pnpm dev
```

停止は `Ctrl+C` です。
