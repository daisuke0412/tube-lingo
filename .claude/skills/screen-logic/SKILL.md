---
name: screen-logic
description: 画面ロジック実装スキル。モック実装済みの画面に対して、状態管理・バリデーション・API連携・イベントハンドラ等のロジックを組み込む。「ロジックを実装して」「画面を実際に開発して」「モックに機能を追加して」と言われた場合に使用する。
---

# 画面ロジック実装スキル

## 概要
`screen-mock` スキルで作成済みのモックコンポーネントに対して、
画面設計書のイベント表・バリデーションルールに基づきロジックを実装する。

## 前提
- 対象画面のモック実装が完了していること（`screen-mock` スキル済み）
- ファイル名の末尾が `_approved` になっているモックがない場合は、処理を中断すること
- モックのUI構成は変更しない（見た目はそのまま維持）

---

## Step 1: 設計書の再確認
1. 対応する画面設計書（`docs/designs/s{XX}-*.md`）を読み、以下を把握する：
   - **画面イベント表** — 全イベント行（初期表示含む）
   - **入力バリデーション** — フィールドごとのルール
   - **状態遷移** — 正常系・異常系の表示切り替え
2. `docs/requirements/requirements.md` のエラー定義（E-01〜E-05）を確認する

---

## Step 2: カスタムフック作成
1. フックは `src/features/<機能名>/hooks/` に配置する
2. 以下を責務としてフックに切り出す：
   - フォーム状態管理（入力値・エラーメッセージ）
   - バリデーションロジック
   - API呼び出し（fetch / SSE）
   - ローディング・エラー状態の管理
3. コンポーネントからロジックを分離し、コンポーネントは表示に専念させる

---

## Step 3: コンポーネントへのロジック組み込み
1. モックのハードコード値をフックの state / props に置き換える
2. 画面イベント表の全行を**上から順に**実装する
3. 以下の要件に準拠する：
   - `docs/requirements/requirements.md` のエラー定義に一致するメッセージ
   - APIキーは state のみで保持（localStorage等に保存しない）
   - エラー時はインライン表示（設計書で指定された位置）
4. 型定義は `src/shared/types/index.ts` で一元管理する

---

## Step 4: ビルド・型チェック
1. `pnpm build` でビルドエラーがないことを確認する
2. `pnpm type-check` で型エラーがないことを確認する
3. `pnpm lint` で lint エラーがないことを確認する

---

## Step 5: 動作確認・イベント別キャプチャ取得（Playwright MCP使用）
1. `pnpm dev` でローカル開発サーバーを起動する（バックグラウンド実行）
2. Playwright MCP の `browser_navigate` で対象画面を開く
3. **画面イベント表の各イベントについて、実行前後のキャプチャを取得する：**
   - 各イベントの **実行前** の状態をキャプチャ
   - Playwright MCP でイベントを実行（`browser_click`, `browser_type` 等）
   - 各イベントの **実行後** の状態をキャプチャ
4. 以下の観点で確認する：
   - 正常系: 入力 → 送信 → 結果表示の一連の流れ
   - 異常系: バリデーションエラー表示、APIエラー表示
   - 状態遷移: ローディング表示、ボタンの活性/非活性
5. キャプチャの保存ルール：
   - **保存先:** `docs/designs/evidence/`
   - **ファイル名:** `{画面ID}_{連番}_{イベント名}_{before|after}_pending-review.png`
   - 例:
     - `S-01_01_initial_after_pending-review.png` — 初期表示完了後
     - `S-01_02_submit_before_pending-review.png` — 開始ボタン押下前
     - `S-01_03_submit_after_pending-review.png` — 開始ボタン押下後（字幕取得成功）
     - `S-01_04_submit-error_after_pending-review.png` — 開始ボタン押下後（エラー）
     - `S-02_01_initial_after_pending-review.png` — 学習画面初期表示
     - `S-02_02_ask-ai_before_pending-review.png` — AIに聞くボタン押下前
     - `S-02_03_ask-ai_after_pending-review.png` — モーダル表示後
6. `browser_close` でブラウザを閉じる

### Playwright MCP コマンド例
```
browser_navigate → url: "http://localhost:3000"
browser_screenshot → (初期表示 _after)
browser_type → selector: "#url-input", text: "https://..."
browser_screenshot → (入力後 = submit_before)
browser_click → selector: "#start-button"
browser_screenshot → (submit_after)
... イベント表の全行分繰り返す
browser_close
```

---

## Step 6: 実装後チェック
画面設計書と突き合わせて以下をすべて確認する：
- [ ] 画面イベント表の全行が実装されているか
- [ ] 入力バリデーションが設計書通りか
- [ ] エラーメッセージが `requirements.md` のエラー定義と一致しているか
- [ ] APIキーが state のみで保持されているか
- [ ] モックアップの全UI要素が引き続き表示されているか（ロジック追加でUIが壊れていないか）
- [ ] ローディング中のUI（ボタン非活性・スピナー等）が設計書通りか
- [ ] 全イベントの実行前後キャプチャが `docs/designs/evidence/` に保存されているか
- [ ] キャプチャのファイル名が `{画面ID}_{連番}_{イベント名}_{before|after}_pending-review.png` 形式か
