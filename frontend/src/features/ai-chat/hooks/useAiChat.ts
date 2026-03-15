import { useState, useCallback, useRef, useEffect } from "react";
import type { TranscriptItem, ChatMessage } from "../../../shared/types";

/**
 * AIチャット hook
 * SSEストリーミングでAI解説を受信し、チャット状態を管理する
 */
export function useAiChat(
  selectedText: string,
  contextLines: TranscriptItem[],
  existingHistory?: ChatMessage[]
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    existingHistory ?? []
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialSentRef = useRef(false);

  // existingHistory変更時にリセット
  useEffect(() => {
    setChatMessages(existingHistory ?? []);
    setError(null);
    initialSentRef.current = !!existingHistory && existingHistory.length > 0;
  }, [existingHistory]);

  // アンマウント時にストリームキャンセル
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  /** SSEストリーミングでAI解説を呼び出す */
  const sendMessage = useCallback(
    async (userMessage: string, apiKey: string) => {
      setError(null);
      setIsStreaming(true);

      // ユーザーメッセージを追加
      const userMsg: ChatMessage = { role: "user", content: userMessage };
      setChatMessages((prev) => [...prev, userMsg]);

      // 空のアシスタントメッセージを追加（ストリーミング用）
      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // chat_historyを構築（今回のユーザーメッセージは含めない）
      const chatHistory = [...(existingHistory ?? [])];
      // 既存のチャット履歴がある場合は現在のメッセージ群から構築
      setChatMessages((current) => {
        // この時点のcurrentからchat_historyを構築（最後の空assistantを除く、最後のuserも除く）
        const historyForApi = current.slice(0, -2);
        chatHistory.length = 0;
        chatHistory.push(...historyForApi);
        return current;
      });

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
            context_lines: contextLines,
            user_message: userMessage,
            chat_history: chatHistory,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorMessage: string;
          if (response.status === 401) {
            errorMessage =
              "APIキーが無効です。正しいキーを入力してください";
          } else if (response.status === 429) {
            errorMessage =
              "リクエストが多すぎます。しばらく待ってからお試しください";
          } else {
            errorMessage =
              "AIとの通信に失敗しました。しばらく経ってから再試行してください";
          }
          setError(errorMessage);
          // 空のアシスタントメッセージを削除
          setChatMessages((prev) => prev.slice(0, -1));
          setIsStreaming(false);
          return;
        }

        // SSEストリーミング処理
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);

            if (payload === "[DONE]") {
              setIsStreaming(false);
              return;
            }

            fullText += payload;
            // アシスタントメッセージをリアルタイム更新
            setChatMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: fullText,
              };
              return updated;
            });
          }
        }

        setIsStreaming(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          "AIとの通信に失敗しました。しばらく経ってから再試行してください"
        );
        // 空のアシスタントメッセージを削除
        setChatMessages((prev) => prev.slice(0, -1));
        setIsStreaming(false);
      }
    },
    [selectedText, contextLines, existingHistory]
  );

  /** 初回質問を自動送信 */
  const sendInitialMessage = useCallback(
    (apiKey: string) => {
      if (initialSentRef.current) return;
      initialSentRef.current = true;
      const message = `「${selectedText}」について解説してください。`;
      sendMessage(message, apiKey);
    },
    [selectedText, sendMessage]
  );

  return {
    chatMessages,
    isStreaming,
    error,
    sendMessage,
    sendInitialMessage,
  };
}
