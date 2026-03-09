import { useState, useCallback, useRef } from "react";
import type { ChatMessage, TranscriptItem } from "@/shared/types";

type UseAiChatReturn = {
  chatHistory: ChatMessage[];
  isStreaming: boolean;
  error: string;
  sendMessage: (userMessage: string) => Promise<void>;
};

export function useAiChat(
  apiKey: string,
  selectedText: string,
  contextTranscripts: TranscriptItem[],
  initialHistory: ChatMessage[]
): UseAiChatReturn {
  const [chatHistory, setChatHistory] =
    useState<ChatMessage[]>(initialHistory);
  const chatHistoryRef = useRef<ChatMessage[]>(initialHistory);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = useCallback(
    async (userMessage: string) => {
      setError("");
      setIsStreaming(true);

      // ref から最新の履歴を取得してリクエスト用履歴を組み立てる
      const historyForRequest: ChatMessage[] = [
        ...chatHistoryRef.current,
        { role: "user", content: userMessage },
      ];

      // UI更新: ユーザーメッセージ + アシスタントプレースホルダー
      const withPlaceholder = [
        ...historyForRequest,
        { role: "assistant" as const, content: "" },
      ];
      chatHistoryRef.current = withPlaceholder;
      setChatHistory(withPlaceholder);

      try {
        const res = await fetch("http://localhost:8000/api/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            selectedText,
            chatMessage: userMessage,
            // 初回（assistant応答なし）のみコンテキスト字幕を送信
            contextTranscripts: chatHistoryRef.current.some((m) => m.role === "assistant" && m.content !== "")
              ? []
              : contextTranscripts,
            chatHistory: chatHistoryRef.current.length <= 1
              ? []
              : chatHistoryRef.current.slice(0, -1).filter((m) => m.content !== ""),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "AI機能でエラーが発生しました");
          // プレースホルダーを削除してユーザーメッセージのみ残す
          chatHistoryRef.current = historyForRequest;
          setChatHistory(historyForRequest);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError("ストリーミングの読み込みに失敗しました");
          return;
        }

        const decoder = new TextDecoder();
        let assistantText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                chatHistoryRef.current = historyForRequest;
                setChatHistory(historyForRequest);
                return;
              }
              if (parsed.text) {
                assistantText += parsed.text;
                // リアルタイムで最後のアシスタントメッセージを更新
                const updated = [
                  ...historyForRequest,
                  { role: "assistant" as const, content: assistantText },
                ];
                chatHistoryRef.current = updated;
                setChatHistory(updated);
              }
            } catch {
              // JSON パースエラーは無視
            }
          }
        }
      } catch {
        setError("通信エラーが発生しました。再度お試しください");
        chatHistoryRef.current = historyForRequest;
        setChatHistory(historyForRequest);
      } finally {
        setIsStreaming(false);
      }
    },
    [apiKey, selectedText, contextTranscripts]
  );

  return { chatHistory, isStreaming, error, sendMessage };
}