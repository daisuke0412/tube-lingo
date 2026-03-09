// Playwright を使って YouTube 字幕を取得する検証スクリプト
// 実行: node poc/fetch-transcript.js

const { chromium } = require("playwright");

const VIDEO_URL = "https://youtu.be/AJpK3YTTKZ4?si=_9ce3OgoHYcfKulw";

// YouTube URL から videoId を抽出
function extractVideoId(url) {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
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

async function fetchTranscript(videoId) {
  console.log(`\n=== 字幕取得テスト: videoId=${videoId} ===\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();

  let capturedTranscript = null;
  let capturedUrl = null;

  // ページ読み込み前からネットワーク監視開始
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("timedtext")) {
      try {
        const body = await response.text();
        console.log(`   [capture] timedtext: length=${body.length}, url=${url.substring(0, 150)}...`);
        if (body.length > 0 && !capturedTranscript) {
          capturedTranscript = body;
          capturedUrl = url;
        }
      } catch (e) {
        console.log(`   [capture] error: ${e.message}`);
      }
    }
  });

  try {
    console.log("1. YouTube ページを読み込み中（ネットワーク監視中）...");
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    // ページ内容が描画されるまで少し待つ
    await page.waitForTimeout(5000);
    console.log("   ページ読み込み完了");

    // ページ読み込みで字幕がキャプチャされたか
    if (capturedTranscript) {
      console.log("\n2. ページ読み込み中に字幕をキャプチャ!");
    } else {
      // 動画を再生して字幕ONにする
      console.log("\n2. 動画を再生して字幕を有効化...");

      // Cookie同意バナーを閉じる
      const consentButton = page.locator('button:has-text("Accept all"), button:has-text("Reject all")');
      if (await consentButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await consentButton.first().click();
        await page.waitForTimeout(1000);
      }

      // 再生
      await page.click("video", { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);

      // 字幕ボタンON
      const ccBtn = page.locator("button.ytp-subtitles-button").first();
      if (await ccBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await ccBtn.click();
        console.log("   字幕ボタンをクリック");
      }

      // 待機
      console.log("   字幕データを待機中（最大15秒）...");
      for (let i = 0; i < 30; i++) {
        if (capturedTranscript) break;
        await page.waitForTimeout(500);
      }
    }

    // 結果を表示
    if (capturedTranscript) {
      console.log(`\n3. 字幕キャプチャ成功: ${capturedTranscript.length} bytes`);
      console.log("   URL:", capturedUrl?.substring(0, 150));
      console.log("   先頭200文字:", capturedTranscript.substring(0, 200));

      // XMLパース
      if (capturedTranscript.includes("<text")) {
        const textMatches = [...capturedTranscript.matchAll(/<text start="([^"]+)" dur="([^"]+)"[^>]*>(.*?)<\/text>/gs)];
        console.log(`\n   字幕件数: ${textMatches.length} 件`);
        console.log("   最初の5件:");
        textMatches.slice(0, 5).forEach((m) => {
          const text = m[3].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, "");
          console.log(`     [${parseFloat(m[1]).toFixed(1)}s] ${text}`);
        });
        console.log("   最後の3件:");
        textMatches.slice(-3).forEach((m) => {
          const text = m[3].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, "");
          console.log(`     [${parseFloat(m[1]).toFixed(1)}s] ${text}`);
        });
      }
      // JSONパース
      else if (capturedTranscript.startsWith("{")) {
        const json = JSON.parse(capturedTranscript);
        const events = (json.events || [])
          .filter((e) => e.segs && e.segs.length > 0)
          .map((e) => ({
            text: e.segs.map((s) => s.utf8).join(""),
            offset: e.tStartMs,
          }))
          .filter((item) => item.text.trim() !== "");
        console.log(`\n   字幕件数: ${events.length} 件`);
        events.slice(0, 5).forEach((item) => {
          console.log(`     [${(item.offset / 1000).toFixed(1)}s] ${item.text}`);
        });
      }

      console.log("\n=== 検証完了: 成功 ===");
    } else {
      console.log("\n3. 字幕をキャプチャできませんでした");
      console.log("\n=== 検証完了: 失敗 ===");
    }
  } catch (err) {
    console.error("エラー:", err.message);
  } finally {
    await browser.close();
  }
}

// 実行
const videoId = extractVideoId(VIDEO_URL);
if (!videoId) {
  console.error("無効な URL:", VIDEO_URL);
  process.exit(1);
}
fetchTranscript(videoId);
