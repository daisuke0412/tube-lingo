// 字幕アイテム（youtube-transcript の返却形式に準拠）
export type TranscriptItem = {
  text: string;
  offset: number; // 開始時間（ミリ秒）
  duration: number; // 表示時間（ミリ秒）
};

// AIチャットのメッセージ
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// 字幕APIのレスポンス
export type TranscriptResponse = {
  transcript: TranscriptItem[];
};

// 字幕APIのエラーレスポンス
export type TranscriptErrorResponse = {
  error: string;
  code: "E-01" | "E-02" | "E-04";
};

// AI解説APIのリクエストボディ
export type ExplainRequest = {
  selectedText: string;
  contextTranscripts: TranscriptItem[];
  chatHistory: ChatMessage[];
};

// AI解説APIのエラーレスポンス
export type ExplainErrorResponse = {
  error: string;
  code: "E-03" | "E-04" | "E-05";
};
