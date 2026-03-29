# TubeLingo - CLAUDE.md

Claude Codeへの行動指示とドキュメントのナビゲーション。
詳細な仕様・設計・規約はすべて `docs/` を参照すること。

---

## ドキュメント参照先

| 内容 | ファイル |
|---|---|
| アプリ概要・機能要件・MVP範囲 | [docs/requirements/requirements.md](docs/requirements/requirements.md) |
| 技術スタック・ディレクトリ構成・規約・セキュリティ | [docs/guides/guides.md](docs/guides/guides.md) |
| 画面設計インデックス・遷移図 | [docs/designs/screens/screens.md](docs/designs/screens/screens.md) |
| 各画面仕様（モックアップ含む） | [docs/designs/screens/](docs/designs/screens/) |
| API設計書 | [docs/designs/apis/](docs/designs/apis/) |
| プロンプト設計書 | [docs/designs/prompts/](docs/designs/prompts/) |

---

## スキル一覧

実装作業には以下のスキルを使用する。

| スキル | 用途 |
|---|---|
| `dev_screen-mock` | 画面モック実装。設計書のASCIIアートを元に見た目のみ作成・キャプチャ取得 |
| `dev_screen-logic` | 画面ロジック実装。モック済み画面に状態管理・API連携を組み込む |
| `dev_api` | FastAPIバックエンド実装。routers・services・プロンプトを実装 |
| `test_e2e` | PlayWirhgtを使ったE2Eテストを実行 |

---

## Claudeへの行動指示

- コードを書く前に必ず上記の `docs/` を参照する
- 仕様に不明点があれば実装前に質問する
- コンポーネント・APIルートを追加した場合は対応する `docs/` も更新する
