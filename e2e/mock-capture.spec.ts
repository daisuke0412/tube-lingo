import { test } from "@playwright/test";
import path from "path";

// 各画面モックのキャプチャを取得する
// 出力先: docs/designs/mock/

const OUTPUT_DIR = path.join(__dirname, "../docs/designs/mock");

test.describe("画面モックキャプチャ", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14 相当
  });

  test("S-01 初期画面", async ({ page }) => {
    await page.goto("/mock");
    // コントロールパネルを非表示にしてキャプチャ
    await page.locator(".mock-controls").evaluate((el) => {
      (el as HTMLElement).style.display = "none";
    });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "S-01_01_initial_pending-review.png"),
      fullPage: false,
    });
  });

  test("S-02 学習画面（通常）", async ({ page }) => {
    await page.goto("/mock");
    await page.getByRole("button", { name: "S-02 学習画面" }).click();
    await page.locator(".mock-controls").evaluate((el) => {
      (el as HTMLElement).style.display = "none";
    });
    // YouTube IFrame の読み込みを少し待つ
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "S-02_01_initial_pending-review.png"),
      fullPage: false,
    });
  });

  test("S-02 学習画面（テキスト選択）", async ({ page }) => {
    await page.goto("/mock");
    await page.getByRole("button", { name: "S-02 テキスト選択" }).click();
    await page.locator(".mock-controls").evaluate((el) => {
      (el as HTMLElement).style.display = "none";
    });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "S-02_02_text-selection_pending-review.png"),
      fullPage: false,
    });
  });

  test("S-02 学習画面（翻訳結果）", async ({ page }) => {
    await page.goto("/mock");
    await page.getByRole("button", { name: "S-02 翻訳結果" }).click();
    await page.locator(".mock-controls").evaluate((el) => {
      (el as HTMLElement).style.display = "none";
    });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "S-02_03_translation_pending-review.png"),
      fullPage: false,
    });
  });

  test("S-02-M AIチャットモーダル（新規）", async ({ page }) => {
    await page.goto("/mock");
    await page.getByRole("button", { name: "S-02-M 新規チャット" }).click();
    await page.locator(".mock-controls").evaluate((el) => {
      (el as HTMLElement).style.display = "none";
    });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "S-02-M_01_new-chat_pending-review.png"),
      fullPage: false,
    });
  });

  test("S-02-M AIチャットモーダル（履歴あり）", async ({ page }) => {
    await page.goto("/mock");
    await page.getByRole("button", { name: "S-02-M 履歴チャット" }).click();
    await page.locator(".mock-controls").evaluate((el) => {
      (el as HTMLElement).style.display = "none";
    });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "S-02-M_02_chat-history_pending-review.png"),
      fullPage: false,
    });
  });
});
