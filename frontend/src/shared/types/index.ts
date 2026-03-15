/** 字幕アイテム */
export interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

/** チャットメッセージ */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
