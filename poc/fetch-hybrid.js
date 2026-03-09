// ハイブリッド方式の検証
// 1. Playwright headful でYouTubeにアクセスし、cookie + トークン付きURLを取得
// 2. 取得したcookie + URLで Node.js fetch が通るか検証
//
// 実行: node poc/fetch-hybrid.js

const { chromium } = require("playwright");

const VIDEO_ID = "AJpK3YTTKZ4";

async function main() {
  console.log("\n=== ハイブリッド方式の検証 ===\n");

  // Phase 1: Playwright headful でブラウザのcookie・トークン付きURLを取得
  console.log("Phase 1: Playwright でcookie / timedtext URLを取得...");

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();

  let capturedUrl = null;
  let capturedHeaders = null;
  let capturedResponseBody = null;

  // timedtext リクエスト/レスポンスをインターセプト
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("timedtext") && !capturedUrl) {
      capturedUrl = url;
      capturedHeaders = request.headers();
    }
  });

  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("timedtext") && !capturedResponseBody) {
      try {
        const body = await response.text();
        if (body.length > 0) capturedResponseBody = body;
      } catch {}
    }
  });

  await page.goto(`https://www.youtube.com/watch?v=${VIDEO_ID}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  // 動画を再生して字幕を読み込ませる
  await page.click("video", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // timedtext URLがキャプチャされるまで待つ
  for (let i = 0; i < 20; i++) {
    if (capturedUrl) break;
    await page.waitForTimeout(500);
  }

  // ブラウザのcookieを取得
  const cookies = await page.context().cookies();
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  console.log(`  cookie数: ${cookies.length}`);
  console.log(`  timedtext URL取得: ${capturedUrl ? "成功" : "失敗"}`);

  if (!capturedUrl) {
    console.log("  timedtext URLが取得できませんでした");
    await browser.close();
    return;
  }

  // ブラウザを閉じる
  await browser.close();
  console.log("  ブラウザを閉じました\n");

  // Phase 2: 取得したcookie + URLで Node.js fetch
  console.log("Phase 2: Node.js fetch でtimedtext URLにリクエスト...\n");

  // テスト1: cookie付き
  console.log("  テスト1: cookie + 元のヘッダーで fetch");
  const res1 = await fetch(capturedUrl, {
    headers: {
      "User-Agent": capturedHeaders?.["user-agent"] || "Mozilla/5.0",
      "Cookie": cookieStr,
      "Referer": "https://www.youtube.com/",
    },
  });
  const body1 = await res1.text();
  console.log(`    status: ${res1.status}, length: ${body1.length}`);
  if (body1.length > 0) console.log(`    sample: ${body1.substring(0, 100)}`);

  // テスト2: cookie付き + fmt=json3
  const json3Url = capturedUrl.includes("fmt=json3")
    ? capturedUrl
    : capturedUrl + "&fmt=json3";
  console.log("\n  テスト2: cookie + fmt=json3 で fetch");
  const res2 = await fetch(json3Url, {
    headers: {
      "User-Agent": capturedHeaders?.["user-agent"] || "Mozilla/5.0",
      "Cookie": cookieStr,
      "Referer": "https://www.youtube.com/",
    },
  });
  const body2 = await res2.text();
  console.log(`    status: ${res2.status}, length: ${body2.length}`);
  if (body2.length > 0) console.log(`    sample: ${body2.substring(0, 100)}`);

  // テスト3: cookieなし（URLだけで通るか）
  console.log("\n  テスト3: cookieなし（URLのみ）で fetch");
  const res3 = await fetch(capturedUrl);
  const body3 = await res3.text();
  console.log(`    status: ${res3.status}, length: ${body3.length}`);

  // テスト4: 別の動画IDで同じcookieを使い回せるか
  const otherVideoId = "dQw4w9WgXcQ";
  const otherUrl = capturedUrl.replace(VIDEO_ID, otherVideoId);
  console.log(`\n  テスト4: 別動画(${otherVideoId})で同じcookieを使い回し`);
  const res4 = await fetch(otherUrl, {
    headers: {
      "User-Agent": capturedHeaders?.["user-agent"] || "Mozilla/5.0",
      "Cookie": cookieStr,
      "Referer": "https://www.youtube.com/",
    },
  });
  const body4 = await res4.text();
  console.log(`    status: ${res4.status}, length: ${body4.length}`);
  if (body4.length > 0) console.log(`    sample: ${body4.substring(0, 100)}`);

  // 結果まとめ
  console.log("\n=== 結果まとめ ===");
  console.log(`  テスト1 (cookie+ヘッダー): ${body1.length > 0 ? "✅ 成功" : "❌ 失敗"} (${body1.length} bytes)`);
  console.log(`  テスト2 (cookie+json3):    ${body2.length > 0 ? "✅ 成功" : "❌ 失敗"} (${body2.length} bytes)`);
  console.log(`  テスト3 (URLのみ):         ${body3.length > 0 ? "✅ 成功" : "❌ 失敗"} (${body3.length} bytes)`);
  console.log(`  テスト4 (別動画+cookie):   ${body4.length > 0 ? "✅ 成功" : "❌ 失敗"} (${body4.length} bytes)`);
}

main().catch(console.error);
