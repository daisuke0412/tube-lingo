"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, Send as SendIcon } from "@mui/icons-material";
import { useAiChat } from "../hooks/useAiChat";
import type { ChatMessage, TranscriptItem } from "@/shared/types";

type AiChatModalProps = {
  apiKey: string;
  selectedText: string;
  contextTranscripts: TranscriptItem[];
  transcriptIndex: number;
  initialHistory: ChatMessage[];
  onClose: (transcriptIndex: number, history: ChatMessage[]) => void;
};

export default function AiChatModal({
  apiKey,
  selectedText,
  contextTranscripts,
  transcriptIndex,
  initialHistory,
  onClose,
}: AiChatModalProps) {
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const { chatHistory, isStreaming, error, sendMessage } = useAiChat(
    apiKey,
    selectedText,
    contextTranscripts,
    initialHistory
  );

  // 初回表示（新規）: APIキーがある場合は自動で解説を要求
  useEffect(() => {
    if (!isFirstRender.current) return;
    isFirstRender.current = false;

    // 履歴がない（新規）かつ選択テキストがある場合のみ自動送信
    if (initialHistory.length === 0 && selectedText) {
      if (!apiKey || !apiKey.startsWith("sk-ant-")) {
        // APIキー未設定の場合は自動送信しない（error表示はuseAiChat内ではなくここで出す）
        return;
      }
      sendMessage(`「${selectedText}」について解説してください。`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // チャット末尾へ自動スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    setInputText("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    onClose(transcriptIndex, chatHistory);
  };

  const showApiKeyError =
    !apiKey || !apiKey.startsWith("sk-ant-");

  return (
    // オーバーレイ
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 200,
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 480,
          mx: "auto",
          maxHeight: "70dvh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px 16px 0 0",
        }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            AIチャット
          </Typography>
          <IconButton onClick={handleClose} size="small" aria-label="閉じる">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* 質問元テキスト */}
        {selectedText && (
          <Box sx={{ px: 2, py: 1, backgroundColor: "grey.100" }}>
            <Typography variant="caption" color="text.secondary">
              質問元
            </Typography>
            <Typography variant="body2" fontStyle="italic">
              &ldquo;{selectedText}&rdquo;
            </Typography>
          </Box>
        )}

        <Divider />

        {/* チャット本文 */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1 }}>
          {/* APIキー未設定エラー */}
          {showApiKeyError && chatHistory.length === 0 && (
            <Typography color="error" variant="body2">
              APIキーが設定されていないか無効です。正しいキーを入力してください
            </Typography>
          )}

          {chatHistory.map((msg, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
                mb: 1,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  px: 1.5,
                  py: 1,
                  maxWidth: "80%",
                  backgroundColor:
                    msg.role === "user" ? "primary.light" : "grey.100",
                  borderRadius:
                    msg.role === "user"
                      ? "12px 12px 2px 12px"
                      : "12px 12px 12px 2px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    color: msg.role === "user" ? "#fff" : "inherit",
                  }}
                >
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))}

          {/* ストリーミング中のスピナー */}
          {isStreaming && chatHistory.at(-1)?.content === "" && (
            <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
              <CircularProgress size={20} />
            </Box>
          )}

          {/* エラー表示 */}
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <div ref={chatEndRef} />
        </Box>

        <Divider />

        {/* 入力欄 */}
        <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="追加で質問する…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || showApiKeyError}
            multiline
            maxRows={3}
            sx={{ mr: 1 }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!inputText.trim() || isStreaming || showApiKeyError}
            color="primary"
            aria-label="送信"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
