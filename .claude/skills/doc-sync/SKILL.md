---
name: doc-sync
description: コンポーネント・APIルート・画面の追加・変更後に使用。関連するドキュメント（guides, designs, requirements）を漏れなく更新する。「ドキュメントを更新して」「docsを同期して」と言われた場合、またはコンポーネントやAPIルートを追加・変更したタイミングで自律的に使用する。
---

# ドキュメント同期スキル

## コンポーネント・APIルート・画面を追加・変更した場合

以下のドキュメントを確認し、必要に応じて更新する：
- `docs/guides/guides.md` — ディレクトリ構成ツリーに新ファイルが反映されているか
- `docs/designs/screens.md` — 画面一覧・遷移図に変更が必要か
- 対応する画面設計書 — イベントやUI要素に差分がないか
- `docs/requirements/requirements.md` — 新しいエラーコードが必要か
