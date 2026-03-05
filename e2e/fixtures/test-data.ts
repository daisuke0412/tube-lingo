// E2Eテスト用の定数

// 字幕が存在する英語動画（テスト用）
export const TEST_VIDEO_URL =
  "https://www.youtube.com/watch?v=jNQXAC9IVRw";

// 字幕が存在しない動画
export const NO_TRANSCRIPT_VIDEO_URL =
  "https://www.youtube.com/watch?v=INVALID_ID_FOR_TEST";

// 無効なURL
export const INVALID_URL = "https://example.com/not-youtube";

// APIキーのプレースホルダー（実際のキーはCI環境変数から取得）
export const MOCK_API_KEY = process.env.TEST_ANTHROPIC_API_KEY ?? "sk-ant-test-key";
