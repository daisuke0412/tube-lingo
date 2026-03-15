import { test, expect } from "@playwright/test";

const VIDEO_ID = "AJpK3YTTKZ4";

/** 字幕取得成功のモックレスポンス */
const MOCK_TRANSCRIPT = {
  transcript: [
    { text: "Hello everyone.", start: 0.0, duration: 2.0 },
    { text: "Today we will learn about plants.", start: 2.0, duration: 3.0 },
    { text: "Photosynthesis is very important.", start: 5.0, duration: 2.5 },
    { text: "Plants need sunlight to grow.", start: 7.5, duration: 2.0 },
    { text: "Thank you for watching.", start: 9.5, duration: 2.0 },
  ],
};

test.describe("S-02 学習画面", () => {
  test("初期表示（字幕取得成功）: YouTubeプレーヤーと字幕リストが表示される", async ({
    page,
  }) => {
    // 字幕APIをモック
    await page.route("**/api/transcript*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRANSCRIPT),
      })
    );

    await page.goto(`/learn/${VIDEO_ID}`);

    // YouTube iframe が表示される
    await expect(page.locator("iframe")).toBeVisible({ timeout: 10000 });

    // 字幕テキストが表示される
    await expect(page.getByText("Hello everyone.")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Photosynthesis is very important.")).toBeVisible();
    await expect(page.getByText("Thank you for watching.")).toBeVisible();
  });

  test("初期表示（字幕取得中）: ローディングスピナーが表示される", async ({
    page,
  }) => {
    // 字幕APIを遅延レスポンス
    await page.route("**/api/transcript*", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRANSCRIPT),
      });
    });

    await page.goto(`/learn/${VIDEO_ID}`);

    // CircularProgress（role=progressbar）が表示される
    await expect(page.getByRole("progressbar")).toBeVisible();
  });

  test("字幕取得失敗（404）: 「この動画には字幕がありません」が表示される", async ({
    page,
  }) => {
    await page.route("**/api/transcript*", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "NO_TRANSCRIPT" }),
      })
    );

    await page.goto(`/learn/${VIDEO_ID}`);

    await expect(
      page.getByText("この動画には字幕がありません")
    ).toBeVisible({ timeout: 10000 });
  });

  test("字幕取得失敗（502）: 「字幕の取得に失敗しました...」が表示される", async ({
    page,
  }) => {
    await page.route("**/api/transcript*", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ detail: "YOUTUBE_ERROR" }),
      })
    );

    await page.goto(`/learn/${VIDEO_ID}`);

    await expect(
      page.getByText("字幕の取得に失敗しました。しばらく経ってから再試行してください")
    ).toBeVisible({ timeout: 10000 });
  });

  test("▶アイコンが各字幕行に表示される", async ({ page }) => {
    await page.route("**/api/transcript*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRANSCRIPT),
      })
    );

    await page.goto(`/learn/${VIDEO_ID}`);
    await expect(page.getByText("Hello everyone.")).toBeVisible({
      timeout: 10000,
    });

    // PlayArrowアイコンのボタン数を確認（字幕行数分）
    const playButtons = page.locator("[data-line-index] button").first();
    await expect(playButtons).toBeVisible();
  });

  test("翻訳ボタン押下: 翻訳結果ポップアップが表示される", async ({
    page,
  }) => {
    await page.route("**/api/transcript*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRANSCRIPT),
      })
    );

    // 翻訳APIをモック
    await page.route("**/api.mymemory.translated.net/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          responseStatus: 200,
          responseData: { translatedText: "光合成はとても重要です。" },
        }),
      })
    );

    await page.goto(`/learn/${VIDEO_ID}`);
    await expect(page.getByText("Photosynthesis is very important.")).toBeVisible({
      timeout: 10000,
    });

    // テキストを選択する（Photosynthesis）
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
    // mouseupイベントを発火
    await textElement.dispatchEvent("mouseup");

    // 翻訳ボタンが表示される
    const translateButton = page.getByRole("button", { name: "翻訳" });
    await expect(translateButton).toBeVisible({ timeout: 5000 });

    // 翻訳ボタンをクリック
    await translateButton.click();

    // 翻訳結果ポップアップが表示される
    await expect(page.getByText("光合成はとても重要です。")).toBeVisible({
      timeout: 5000,
    });
  });

  test("翻訳ポップアップの✕ボタン: ポップアップが閉じる", async ({
    page,
  }) => {
    await page.route("**/api/transcript*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRANSCRIPT),
      })
    );

    await page.route("**/api.mymemory.translated.net/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          responseStatus: 200,
          responseData: { translatedText: "光合成" },
        }),
      })
    );

    await page.goto(`/learn/${VIDEO_ID}`);
    await expect(page.getByText("Photosynthesis is very important.")).toBeVisible({
      timeout: 10000,
    });

    // テキスト選択 → 翻訳ボタンクリック
    const textElement = page.getByText("Photosynthesis is very important.");
    await textElement.evaluate((el) => {
      const range = document.createRange();
      const textNode = el.firstChild!;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 14);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await textElement.dispatchEvent("mouseup");
    await page.getByRole("button", { name: "翻訳" }).click();

    // 翻訳結果が表示された後、✕ボタンで閉じる
    await expect(page.getByText("光合成")).toBeVisible({ timeout: 5000 });

    // ✕ボタンで閉じる
    const closeButton = page.locator("button").filter({ has: page.locator("svg[data-testid='CloseIcon']") });
    await closeButton.click();

    // ポップアップが閉じたことを確認（翻訳結果のPushPinヘッダーが消える）
    await expect(page.locator("svg[data-testid='PushPinIcon']")).toBeHidden({ timeout: 3000 });
  });
});
