# モックキャプチャ

画面モック実装・ロジック実装後のスクリーンショットを格納するディレクトリ。

## 命名規則

### モック実装時（screen-mock スキル）
`{画面ID}_{連番}_{状態名}_pending-review.png`

例:
- `S-01_01_initial_pending-review.png` — 初期表示
- `S-01_02_input-filled_pending-review.png` — 入力済み
- `S-01_03_validation-error_pending-review.png` — バリデーションエラー
- `S-01_04_loading_pending-review.png` — ローディング中

### ロジック実装時（screen-logic スキル）
`{画面ID}_{連番}_{イベント名}_{before|after}_pending-review.png`

例:
- `S-01_01_initial_after_pending-review.png` — 初期表示完了後
- `S-01_02_submit_before_pending-review.png` — 開始ボタン押下前
- `S-01_03_submit_after_pending-review.png` — 開始ボタン押下後（成功）
- `S-01_04_submit-error_after_pending-review.png` — 開始ボタン押下後（エラー）

## ステータス

- `_pending-review` — レビュー待ち（キャプチャ取得直後）
- レビュー完了後、ファイルを `_approved` にリネームする
