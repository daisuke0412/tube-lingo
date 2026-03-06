# ロジック実装エビデンス

画面ロジック実装後の動作確認キャプチャを格納するディレクトリ。

## 命名規則

`{画面ID}_{連番}_{イベント名}_{before|after}_pending-review.png`

例:
- `S-01_01_initial_after_pending-review.png` — 初期表示完了後
- `S-01_02_submit_before_pending-review.png` — 開始ボタン押下前
- `S-01_03_submit_after_pending-review.png` — 開始ボタン押下後（成功）
- `S-01_04_submit-error_after_pending-review.png` — 開始ボタン押下後（エラー）

## ステータス

- `_pending-review` — レビュー待ち（キャプチャ取得直後）
- レビュー完了後、ファイルを `_approved` にリネームする
