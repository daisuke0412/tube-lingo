// new-headless モードで字幕取得を検証
// 実行: node poc/fetch-transcript-new-headless.js

const { chromium } = require("playwright");

const VIDEO_URL = "https://youtu.be/AJpK3YTTKZ4?si=_9ce3OgoHYcfKulw";

function extractVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}

async function testMode(label, launchOptions) {
  console.log(`\n=== ${label} ===\n`);

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    locale: "en-US",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // webdriver フラグを隠す
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  let capturedData = null;

  page.on("response", async (response) => {
    if (response.url().includes("/api/timedtext") && !capturedData) {
      try {
        const body = await response.body();
        if (body.length > 0) {
          capturedData = { url: response.url(), size: body.length };
          console.log(`  timedtext キャプチャ成功: ${body.length} bytes`);
        } else {
          console.log(`  timedtext 空レスポンス: ${response.url().substring(0, 80)}...`);
        }
      } catch (e) {
        console.log(`  レスポンス読み取りエラー: ${e.message}`);
      }
    }
  });

  try {
    const videoId = extractVideoId(VIDEO_URL);
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // 同意ダイアログがあれば承認
    try {
      const acceptBtn = page.locator('button:has-text("Accept all")');
      if (await acceptBtn.isVisible({ timeout: 3000 })) {
        await acceptBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch {}

    // 動画をクリックして再生開始
    try {
      await page.click("video", { timeout: 5000 });
    } catch {}

    // 字幕リクエストを待つ
    await page.waitForTimeout(8000);

    if (capturedData) {
      console.log(`\n  結果: 成功 (${capturedData.size} bytes)`);
    } else {
      console.log("\n  結果: 失敗（timedtext レスポンスなし or 空）");
    }
  } catch (err) {
    console.error(`  エラー: ${err.message}`);
  } finally {
    await browser.close();
  }

  return capturedData;
}

async function main() {
  console.log("=".repeat(60));
  console.log(" headless モード比較テスト");
  console.log("=".repeat(60));

  // テスト1: new headless
  const result1 = await testMode("テスト1: new-headless (--headless=new)", {
    headless: true,
    args: [
      "--headless=new",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  // テスト2: new headless + 追加の検出回避
  const result2 = await testMode("テスト2: new-headless + 検出回避強化", {
    headless: true,
    args: [
      "--headless=new",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-dev-shm-usage",
    ],
  });

  // テスト3: headful（比較用ベースライン）
  const result3 = await testMode("テスト3: headful（比較用）", {
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  // 結果まとめ
  console.log("\n" + "=".repeat(60));
  console.log(" 結果まとめ");
  console.log("=".repeat(60));
  console.log(`  new-headless:          ${result1 ? "◎ 成功" : "✕ 失敗"}`);
  console.log(`  new-headless + 回避:   ${result2 ? "◎ 成功" : "✕ 失敗"}`);
  console.log(`  headful (ベースライン): ${result3 ? "◎ 成功" : "✕ 失敗"}`);
}

main();
