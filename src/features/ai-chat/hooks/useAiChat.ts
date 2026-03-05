"use client";

import { useState, useCallback } from "react";
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = useCallback(
    async (userMessage: string) => {
      setError("");
      setIsStreaming(true);

      // ユーザーメッセージを履歴に追加
      const updatedHistory: ChatMessage[] = [
        ...chatHistory,
        { role: "user", content: userMessage },
      ];
      setChatHistory(updatedHistory);

      // アシスタントの返答プレースホルダーを追加
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            selectedText,
            contextTranscripts,
            chatHistory: updatedHistory,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "AI機能でエラーが発生しました");
          // プレースホルダーを削除
          setChatHistory(updatedHistory);
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
                setChatHistory(updatedHistory);
                return;
              }
              if (parsed.text) {
                assistantText += parsed.text;
                // リアルタイムで最後のアシスタントメッセージを更新
                setChatHistory((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantText,
                  };
                  return updated;
                });
              }
            } catch {
              // JSON パースエラーは無視
            }
          }
        }
      } catch {
        setError("通信エラーが発生しました。再度お試しください");
        setChatHistory(updatedHistory);
      } finally {
        setIsStreaming(false);
      }
    },
    [apiKey, selectedText, contextTranscripts, chatHistory]
  );

  return { chatHistory, isStreaming, error, sendMessage };
}
