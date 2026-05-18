import { test, expect } from "@playwright/test";

const VIDEO_ID = "AJpK3YTTKZ4";

const MOCK_TRANSCRIPT = {
  transcript: [
    { text: "Hello everyone.", start: 0.0, duration: 2.0 },
    { text: "Today we will learn about plants.", start: 2.0, duration: 3.0 },
    { text: "Photosynthesis is very important.", start: 5.0, duration: 2.5 },
    { text: "Plants need sunlight to grow.", start: 7.5, duration: 2.0 },
    { text: "Thank you for watching.", start: 9.5, duration: 2.0 },
  ],
};

const MOCK_EXPLAIN_RESPONSE = {
  content: "光合成とは植物が光を使う仕組みです。",
};

/** テキスト選択 → AI質問ボタンクリック でモーダルを開くヘルパー */
async function openAiChatModal(page: import("@playwright/test").Page) {
  await page.route("**/api/transcript*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_TRANSCRIPT),
    })
  );

  await page.goto(`/learn/${VIDEO_ID}`);
  await expect(page.getByText("Photosynthesis is very important.")).toBeVisible({
    timeout: 10000,
  });

  // テキスト選択
  const textElement = page.getByText("Photosynthesis is very important.");
  await textElement.evaluate((el) => {
    const range = document.createRange();
    const textNode = el.firstChild!;
    range.setStart(textNode, 0);
    range.setEnd(textNode, 14); // "Photosynthesis"
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await textElement.dispatchEvent("mouseup");

  // AI質問ボタンクリック
  await page.getByRole("button", { name: "AI質問" }).click();
}

test.describe("S-02-M AIチャットモーダル", () => {
  test("AI回答: チャット欄に表示される", async ({
    page,
  }) => {
    // モーダルopen時に自動でAPI呼び出しが走るため、先にモックを設定
    await page.route("**/api/explain", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_EXPLAIN_RESPONSE),
      })
    );

    await openAiChatModal(page);

    // 回答が表示される
    await expect(
      page.getByText("光合成とは植物が光を使う仕組みです。")
    ).toBeVisible({ timeout: 10000 });
  });

  test("ローディング中: 入力欄・送信ボタンがdisabled", async ({
    page,
  }) => {
    // 遅延レスポンスをモック
    await page.route("**/api/explain", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_EXPLAIN_RESPONSE),
      });
    });

    await openAiChatModal(page);

    // ローディング中は入力欄がdisabled
    await expect(
      page.getByPlaceholder("追加で質問する...")
    ).toBeDisabled({ timeout: 3000 });
  });

  test("✕ボタン押下: モーダルが閉じる", async ({ page }) => {
    // モック設定
    await page.route("**/api/explain", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_EXPLAIN_RESPONSE),
      })
    );

    await openAiChatModal(page);

    // 選択テキストがヘッダーに表示されていることを確認
    await expect(page.getByText('"Photosynthesis"')).toBeVisible({
      timeout: 5000,
    });

    // ✕ボタンをクリック
    const closeButton = page.locator("button").filter({ has: page.locator("svg[data-testid='CloseIcon']") });
    await closeButton.click();

    // モーダルが閉じたことを確認（選択テキストのヘッダーが非表示）
    await expect(page.getByText('"Photosynthesis"')).toBeHidden({
      timeout: 3000,
    });
  });

  test("API呼び出し失敗（401）: 認証エラーメッセージが表示される", async ({
    page,
  }) => {
    // 401エラーをモック
    await page.route("**/api/explain", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "INVALID_API_KEY" }),
      })
    );

    await openAiChatModal(page);

    await expect(
      page.getByText("AIサービスの認証に失敗しました。管理者にお問い合わせください")
    ).toBeVisible({ timeout: 10000 });
  });
});
