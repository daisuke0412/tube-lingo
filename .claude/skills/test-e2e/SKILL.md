---
name: test-e2e
description: E2Eテスト実行スキル。画面設計書の画面イベントを網羅するPlaywrightテストを作成・実行する。「E2Eテストを作成して」「E2Eテストを実行して」「E2Eテストの結果を確認して」と言われた場合に使用する。
---

# E2Eテストスキル

## 概要
画面設計書（`docs/designs/screens/`）に記載された画面イベントを網羅するPlaywrightテストを作成し、
フロントエンド＋バックエンドを起動した状態でテストを実行する。

## 前提
- フロントエンド（`frontend/`）とバックエンド（`backend/`）が実装済みであること
- Playwright がフロントエンドの devDependencies にインストール済みであること
  - 未インストールの場合: `cd frontend && pnpm add -D @playwright/test && npx playwright install chromium`

---

## Step 1: テストケース設計

1. 各画面設計書（`docs/designs/screens/s{XX}-*.md`）の **画面イベント** セクションを読む
2. 各イベントに対して以下の観点でテストケースを洗い出す：
   - **正常系**: 期待される表示・遷移が起きるか
   - **異常系**: エラーメッセージが設計書のテキストと一致するか
   - **状態遷移**: ローディング表示、ボタンの活性/非活性
3. テストケース一覧をユーザーに提示し、**レビューを受けてから実装に進む**
   - ユーザーが承認するまで実装を開始しない

### テストケース一覧のフォーマット

```
## S-01 初期画面
- [ ] 初期表示: タイトル・URL入力欄・開始ボタンが表示される
- [ ] 開始ボタン押下（空入力）: エラーメッセージが表示される
- [ ] 開始ボタン押下（不正URL）: エラーメッセージが表示される
- [ ] 開始ボタン押下（有効URL）: /learn/{videoId} に遷移する
...
```

---

## Step 2: テストファイル作成

1. テストファイルは `frontend/e2e/` に配置する
2. ファイル命名: `s{XX}-{画面名}.spec.ts`（例: `s01-init.spec.ts`, `s02-learning.spec.ts`）
3. 以下のルールに従う：
   - `test.describe` で画面単位にグループ化する
   - `test` のタイトルは日本語で、画面イベント名に対応させる
   - APIモックが必要な場合は `page.route()` でインターセプトする
   - 実際のバックエンドを使うテストと、モックを使うテストを明確に分ける
   - タイムアウトは `test.setTimeout()` で適切に設定する

### Playwright 設定ファイル

`frontend/playwright.config.ts` が存在しない場合は以下の内容で作成する：

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:5173",
      cwd: ".",
      reuseExistingServer: true,
    },
    {
      command: "uvicorn app.main:app --port 8000",
      url: "http://localhost:8000/docs",
      cwd: "../backend",
      reuseExistingServer: true,
    },
  ],
});
```

---

## Step 3: ユーザーレビュー

テストファイルの実装が完了したら、ユーザーにテストコードのレビューを依頼する。
**レビュー承認後にのみ Step 4 に進む。**

---

## Step 4: テスト実行

### 起動コマンド

手動でサーバーを起動する場合（`webServer` 設定を使わない場合）：

```bash
# ターミナル1: フロントエンド
cd frontend && pnpm dev

# ターミナル2: バックエンド
cd backend && uvicorn app.main:app --port 8000

# ターミナル3: テスト実行
cd frontend && npx playwright test
```

### Playwright 設定に `webServer` がある場合

```bash
cd frontend && npx playwright test
```

サーバーは自動で起動・終了される。

### テスト実行オプション

```bash
# 特定ファイルのみ
npx playwright test e2e/s01-init.spec.ts

# 特定テストのみ
npx playwright test -g "開始ボタン押下"

# headed モード（ブラウザ表示）
npx playwright test --headed

# デバッグモード
npx playwright test --debug
```

---

## Step 5: 失敗テストの修正

1. テスト結果を確認し、失敗したテストがあれば原因を調査する
2. 原因の切り分け：
   - **テストコードの問題**: セレクタの変更、タイミング問題 → テストを修正
   - **アプリケーションの問題**: 設計書と実装の乖離 → アプリケーションを修正
3. 修正後にテストを再実行し、全テストが通ることを確認する

---

## Step 6: テスト結果キャプチャ取得（Playwright MCP使用）

テストが全て通った後、主要な画面状態のキャプチャを取得する。

1. Playwright MCP の `browser_navigate` で対象画面を開く
2. 主要な画面状態ごとにスクリーンショットを取得する
3. キャプチャの保存ルール：
   - **保存先:** `docs/designs/screens/captures/e2e/`
   - **ファイル名:** `{画面ID}_{連番}_{状態名}.png`
   - 例:
     - `S-01_01_initial.png`
     - `S-01_02_validation-error.png`
     - `S-02_01_transcript-loaded.png`
     - `S-02-M_01_api-key-input.png`
4. `browser_close` でブラウザを閉じる

---

## 完了条件

- [ ] 全画面設計書の画面イベントがテストケースとしてカバーされている
- [ ] テストケース一覧がユーザーレビュー済み
- [ ] テストファイルが `frontend/e2e/` に配置されている
- [ ] `playwright.config.ts` が正しく設定されている
- [ ] 全テストが通過している（`npx playwright test` で exit code 0）
- [ ] 失敗テストがあれば原因調査・修正済み
- [ ] 主要画面状態のキャプチャが `docs/designs/screens/captures/e2e/` に保存されている
