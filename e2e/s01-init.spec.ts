import { test, expect } from "@playwright/test";
import { INVALID_URL } from "./fixtures/test-data";

test.describe("S-01 初期画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("初期表示: フォームが表示される", async ({ page }) => {
    await expect(page.getByText("TubeLingo")).toBeVisible();
    await expect(page.getByLabel("Anthropic API Key")).toBeVisible();
    await expect(page.getByLabel("YouTube URL")).toBeVisible();
    await expect(page.getByRole("button", { name: "開始する" })).toBeVisible();
  });

  test("バリデーション: 空のURLで送信するとエラーが表示される", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "開始する" }).click();
    await expect(
      page.getByText("YouTube URLを入力してください")
    ).toBeVisible();
  });

  test("バリデーション: 無効なURLでエラーが表示される", async ({ page }) => {
    await page.getByLabel("YouTube URL").fill(INVALID_URL);
    await page.getByRole("button", { name: "開始する" }).click();
    await expect(
      page.getByText("正しいYouTube URLを入力してください")
    ).toBeVisible();
  });
});
