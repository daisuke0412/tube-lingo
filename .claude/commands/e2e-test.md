# /e2e-test

Playwrightを使ったE2Eテストを作成・実行する。

## 使い方

```
/e2e-test                          # 全テストを実行
/e2e-test [画面ID or 機能名]        # 対象を絞って作成・実行
例: /e2e-test S-01                 # 初期画面のテスト
例: /e2e-test 翻訳ポップアップ
```

---

## セットアップ（初回のみ）

```bash
npm install -D @playwright/test
npx playwright install chromium
```

`package.json` に追加:
```json
{
  "scripts": {
    "test:e2e":      "playwright test",
    "test:e2e:ui":   "playwright test --ui",
    "test:e2e:debug":"playwright test --debug"
  }
}
```

`playwright.config.ts` をプロジェクトルートに作成:
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    // スマホ縦画面を基準とする（docs/screens.md に準拠）
    ...devices['Pixel 7'],
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})
```

---

## テスト作成の手順

1. **対象画面・機能を確認**
   - `docs/screens.md` の該当画面のモックアップ・状態定義を読む
   - `docs/spec.md` の機能要件・エラー定義を確認する

2. **テストケースを列挙してから実装**
   - 正常系・異常系・エッジケースを網羅する
   - 外部依存（YouTube API・Claude API・MyMemory API）はモックする

3. **外部APIのモック方針**

   | API | モック方法 |
   |---|---|
   | `/api/transcript` (自前) | `page.route()` でレスポンスを差し替え |
   | `/api/explain` (自前SSE) | `page.route()` でSSEストリームをシミュレート |
   | MyMemory Translation API | `page.route('**/mymemory**', ...)` で差し替え |
   | YouTube IFrame API | `page.addInitScript()` でスタブを注入 |

4. **実行・確認**
   ```bash
   npm run test:e2e          # ヘッドレス実行
   npm run test:e2e:ui       # UIモードで確認
   npm run test:e2e:debug    # ステップ実行でデバッグ
   ```

---

## テストコード例

```ts
// e2e/s01-init.spec.ts
import { test, expect } from '@playwright/test'
import { MOCK_API_KEY, MOCK_YOUTUBE_URL, MOCK_TRANSCRIPTS } from './fixtures/test-data'

test.beforeEach(async ({ page }) => {
  // /api/transcript をモック
  await page.route('**/api/transcript**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ videoId: 'test123', transcripts: MOCK_TRANSCRIPTS }),
    })
  )
})

test('T-01-01: APIキーとURLを入力して開始すると学習画面に遷移する', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Anthropic API Key').fill(MOCK_API_KEY)
  await page.getByLabel('YouTube URL').fill(MOCK_YOUTUBE_URL)
  await page.getByRole('button', { name: '開始する' }).click()

  await expect(page.getByTestId('transcript-list')).toBeVisible()
})
```

---

## `data-testid` 命名規則

テスト用セレクターはコンポーネントに `data-testid` 属性で付与する。

| コンポーネント | data-testid |
|---|---|
| 字幕リスト全体 | `transcript-list` |
| 字幕ブロック（n番目） | `transcript-item-{n}` |
| AI質問済みアイコン | `chat-mark-{n}` |
| アクションポップアップ | `selection-popup` |
| 翻訳結果表示 | `translation-result` |
| AIチャットモーダル | `ai-chat-modal` |
| チャットメッセージ | `chat-message-{n}` |
| 下部AI回答バー | `ai-answer-bar` |
