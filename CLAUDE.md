```markdown
# TubeLingo - CLAUDE.md

Claude Codeへの行動指示とドキュメントのナビゲーション。
詳細な仕様・設計・規約はすべて `docs/` を参照すること。

---

## ドキュメント参照先

| 内容 | ファイル |
|---|---|
| アプリ概要・機能要件・MVP範囲・エラー定義 | [docs/requirements/requirements.md](docs/requirements/requirements.md) |
| 画面設計インデックス・遷移図 | [docs/designs/screens.md](docs/designs/screens.md) |
| 各画面仕様（モックアップ含む） | [docs/designs/](docs/designs/) |
| 技術スタック・ディレクトリ構成・規約・セキュリティ | [docs/guides/guides.md](docs/guides/guides.md) |

---

## Claudeへの行動指示

- コードを書く前に必ず上記の `docs/` を参照する
- 仕様に不明点があれば実装前に質問する
- コンポーネント・APIルートを追加した場合は対応する `docs/` も更新する

---

## アーキテクチャ

- **フロントエンド**: `frontend/` — React + Vite + MUI
- **バックエンド**: `backend/` — FastAPI (Python)
- ルートの `package.json` でモノレポとして管理（`pnpm dev` で両方起動）

```
