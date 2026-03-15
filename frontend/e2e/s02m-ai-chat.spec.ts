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
  test("APIキー未入力時: APIキー入力欄と「AIに質問する」ボタン（disabled）が表示される", async ({
    page,
  }) => {
    await openAiChatModal(page);

    // APIキー入力欄が表示される
    await expect(page.getByLabel("Anthropic APIキー")).toBeVisible({
      timeout: 5000,
    });

    // 「AIに質問する」ボタンがdisabled
    await expect(
      page.getByRole("button", { name: "AIに質問する" })
    ).toBeDisabled();
  });

  test("APIキー入力（不正形式）: 「AIに質問する」ボタンがdisabledのまま", async ({
    page,
  }) => {
    await openAiChatModal(page);

    await page.getByLabel("Anthropic APIキー").fill("invalid-key");

    await expect(
      page.getByRole("button", { name: "AIに質問する" })
    ).toBeDisabled();
  });

  test("APIキー入力（sk-ant-形式）: 「AIに質問する」ボタンが有効化される", async ({
    page,
  }) => {
    await openAiChatModal(page);

    await page.getByLabel("Anthropic APIキー").fill("sk-ant-test-key-123");

    await expect(
      page.getByRole("button", { name: "AIに質問する" })
    ).toBeEnabled();
  });

  test("AI回答のSSEストリーミング: チャット欄にリアルタイム表示される", async ({
    page,
  }) => {
    await openAiChatModal(page);

    // SSEレスポンスをモック
    await page.route("**/api/explain", (route) => {
      const body = "data: 光合成\n\ndata: とは植物が\n\ndata: 光を使う仕組みです。\n\ndata: [DONE]\n\n";
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body,
      });
    });

    await page.getByLabel("Anthropic APIキー").fill("sk-ant-test-key-123");
    await page.getByRole("button", { name: "AIに質問する" }).click();

    // ストリーミング結果が表示される
    await expect(
      page.getByText("光合成とは植物が光を使う仕組みです。")
    ).toBeVisible({ timeout: 10000 });
  });

  test("ストリーミング中: 入力欄・送信ボタンがdisabled", async ({
    page,
  }) => {
    await openAiChatModal(page);

    // SSEレスポンスを遅延モック
    await page.route("**/api/explain", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      const body = "data: テスト回答\n\ndata: [DONE]\n\n";
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body,
      });
    });

    await page.getByLabel("Anthropic APIキー").fill("sk-ant-test-key-123");
    await page.getByRole("button", { name: "AIに質問する" }).click();

    // ストリーミング中は入力欄がdisabled
    await expect(
      page.getByPlaceholder("追加で質問する...")
    ).toBeDisabled({ timeout: 3000 });
  });

  test("✕ボタン押下: モーダルが閉じる", async ({ page }) => {
    await openAiChatModal(page);

    // APIキー入力欄が表示されていることを確認
    await expect(page.getByLabel("Anthropic APIキー")).toBeVisible({
      timeout: 5000,
    });

    // ✕ボタンをクリック（CloseIconのボタン）
    // ヘッダー内の閉じるボタンを取得
    const closeButton = page.locator("button").filter({ has: page.locator("svg[data-testid='CloseIcon']") });
    await closeButton.click();

    // モーダルが閉じたことを確認
    await expect(page.getByLabel("Anthropic APIキー")).toBeHidden({
      timeout: 3000,
    });
  });

  test("API呼び出し失敗（401）: 「APIキーが無効です...」が表示される", async ({
    page,
  }) => {
    await openAiChatModal(page);

    // 401エラーをモック
    await page.route("**/api/explain", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "INVALID_API_KEY" }),
      })
    );

    await page.getByLabel("Anthropic APIキー").fill("sk-ant-invalid-key");
    await page.getByRole("button", { name: "AIに質問する" }).click();

    await expect(
      page.getByText("APIキーが無効です。正しいキーを入力してください")
    ).toBeVisible({ timeout: 10000 });
  });
});
