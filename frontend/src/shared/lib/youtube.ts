/**
 * YouTube URLからvideoIdを抽出する
 * youtube.com/watch?v=XXX と youtu.be/XXX に対応
 */
export function extractVideoId(url: string): string | null {
  // youtube.com/watch?v=XXX
  const longMatch = url.match(
    /(?:youtube\.com\/watch\?.*v=)([\w-]+)/
  );
  if (longMatch) return longMatch[1];

  // youtu.be/XXX
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

/**
 * YouTube URLが有効な形式かチェックする
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
