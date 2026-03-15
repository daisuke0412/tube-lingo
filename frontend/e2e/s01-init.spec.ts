import { test, expect } from "@playwright/test";

const VALID_URL = "https://www.youtube.com/watch?v=AJpK3YTTKZ4";
const VALID_URL_SHORT = "https://youtu.be/AJpK3YTTKZ4";
const INVALID_URL = "https://example.com/not-youtube";
const VIDEO_ID = "AJpK3YTTKZ4";

test.describe("S-01 初期画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("初期表示: タイトル・URL入力欄・開始ボタン・できること/注意事項が表示される", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "TubeLingo" })).toBeVisible();
    await expect(page.getByLabel("YouTube URL")).toBeVisible();
    await expect(page.getByRole("button", { name: "開始する" })).toBeVisible();
    await expect(page.getByText("できること")).toBeVisible();
    await expect(page.getByText("注意事項")).toBeVisible();
  });

  test("開始ボタン押下（空入力）: エラーメッセージが表示される", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "開始する" }).click();
    await expect(
      page.getByText("有効なYouTube URLを入力してください")
    ).toBeVisible();
  });

  test("開始ボタン押下（不正URL）: エラーメッセージが表示される", async ({
    page,
  }) => {
    await page.getByLabel("YouTube URL").fill(INVALID_URL);
    await page.getByRole("button", { name: "開始する" }).click();
    await expect(
      page.getByText("有効なYouTube URLを入力してください")
    ).toBeVisible();
  });

  test("エラー表示後に入力すると: エラーメッセージが消える", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "開始する" }).click();
    await expect(
      page.getByText("有効なYouTube URLを入力してください")
    ).toBeVisible();

    await page.getByLabel("YouTube URL").fill("a");
    await expect(
      page.getByText("有効なYouTube URLを入力してください")
    ).toBeHidden();
  });

  test("開始ボタン押下（有効URL youtube.com形式）: /learn/{videoId} に遷移する", async ({
    page,
  }) => {
    await page.getByLabel("YouTube URL").fill(VALID_URL);
    await page.getByRole("button", { name: "開始する" }).click();
    await expect(page).toHaveURL(`/learn/${VIDEO_ID}`);
  });

  test("開始ボタン押下（有効URL youtu.be形式）: /learn/{videoId} に遷移する", async ({
    page,
  }) => {
    await page.getByLabel("YouTube URL").fill(VALID_URL_SHORT);
    await page.getByRole("button", { name: "開始する" }).click();
    await expect(page).toHaveURL(`/learn/${VIDEO_ID}`);
  });

  test("Enterキー押下で開始: 有効URL入力後にEnterで遷移する", async ({
    page,
  }) => {
    await page.getByLabel("YouTube URL").fill(VALID_URL);
    await page.getByLabel("YouTube URL").press("Enter");
    await expect(page).toHaveURL(`/learn/${VIDEO_ID}`);
  });
});
