import type { TranscriptItem } from "../types";

/**
 * 指定行の前後を含むコンテキスト行を取得する
 */
export function getContextLines(
  transcript: TranscriptItem[],
  lineIndex: number,
  range: number = 5
): TranscriptItem[] {
  const start = Math.max(0, lineIndex - range);
  const end = Math.min(transcript.length, lineIndex + range + 1);
  return transcript.slice(start, end);
}
