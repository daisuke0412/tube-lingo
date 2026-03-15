import { useState, useCallback, useRef, useEffect } from "react";
import type { TranscriptItem, ChatMessage } from "../../../shared/types";

const AI_ERROR_MESSAGES: Record<number, string> = {
  401: "APIキーが無効です。正しいキーを入力してください",
  429: "リクエストが多すぎます。しばらく待ってからお試しください",
};
const DEFAULT_ERROR = "AIとの通信に失敗しました。しばらく経ってから再試行してください";

/**
 * AIチャット hook
 * JSON一括レスポンスでAI解説を受信し、チャット状態を管理する
 */
export function useAiChat(
  selectedText: string,
  contextLines: TranscriptItem[],
  existingHistory?: ChatMessage[]
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    existingHistory ?? []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialSent, setInitialSent] = useState(
    !!existingHistory && existingHistory.length > 0
  );
  const abortRef = useRef<AbortController | null>(null);
  const chatMessagesRef = useRef<ChatMessage[]>(existingHistory ?? []);
  const [prevHistory, setPrevHistory] = useState(existingHistory);

  // existingHistory変更時にリセット
  if (prevHistory !== existingHistory) {
    setPrevHistory(existingHistory);
    setChatMessages(existingHistory ?? []);
    setError(null);
    setInitialSent(!!existingHistory && existingHistory.length > 0);
  }

  // chatMessagesの最新値をrefに同期（イベントハンドラ内で参照するため）
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // アンマウント時にリクエストキャンセル
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  /** AI解説APIを呼び出す */
  const sendMessage = useCallback(
    async (userMessage: string, apiKey: string) => {
      setError(null);
      setIsLoading(true);

      // 現在のメッセージをchat_historyとして保持（今回のuserメッセージは含めない）
      const chatHistory = chatMessagesRef.current;
      const isInitial = chatHistory.length === 0;

      // ユーザーメッセージを追加
      const userMsg: ChatMessage = { role: "user", content: userMessage };
      setChatMessages((prev) => [...prev, userMsg]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            selected_text: selectedText,
            context_lines: isInitial ? contextLines : [],
            user_message: userMessage,
            chat_history: chatHistory,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          setError(AI_ERROR_MESSAGES[response.status] ?? DEFAULT_ERROR);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.content,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(DEFAULT_ERROR);
        setIsLoading(false);
      }
    },
    [selectedText, contextLines]
  );

  /** 初回質問を自動送信 */
  const sendInitialMessage = useCallback(
    (apiKey: string) => {
      if (initialSent) return;
      setInitialSent(true);
      const message = `「${selectedText}」について解説してください。`;
      sendMessage(message, apiKey);
    },
    [selectedText, sendMessage, initialSent]
  );

  return {
    chatMessages,
    isLoading,
    error,
    sendMessage,
    sendInitialMessage,
  };
}
