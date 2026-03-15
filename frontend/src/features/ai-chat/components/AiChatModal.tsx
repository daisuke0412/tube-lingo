import { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Backdrop,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  PushPin as PushPinIcon,
  Close as CloseIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import type { TranscriptItem, ChatMessage } from "../../../shared/types";
import { useAiChat } from "../hooks/useAiChat";

interface AiChatModalProps {
  open: boolean;
  onClose: (messages: ChatMessage[]) => void;
  selectedText: string;
  contextLines: TranscriptItem[];
  existingHistory?: ChatMessage[];
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

/** S-02-M AIチャットモーダル */
export default function AiChatModal({
  open,
  onClose,
  selectedText,
  contextLines,
  existingHistory,
  apiKey,
  onApiKeyChange,
}: AiChatModalProps) {
  const { chatMessages, isLoading, error, sendMessage, sendInitialMessage } =
    useAiChat(selectedText, contextLines, existingHistory);

  const [input, setInput] = useState("");
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // APIキーのバリデーション
  const isApiKeyValid = /^sk-ant-/.test(localApiKey);

  // チャットメッセージが存在するか（送信後 or 履歴復元）
  const hasChat = chatMessages.length > 0;

  // メッセージ数が増えたときのみスクロール
  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length]);

  // APIキー送信 → 初回質問
  const handleApiKeySubmit = useCallback(() => {
    if (!isApiKeyValid) return;
    onApiKeyChange(localApiKey);
    sendInitialMessage(localApiKey);
  }, [localApiKey, isApiKeyValid, onApiKeyChange, sendInitialMessage]);

  // 追加質問送信
  const handleSendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text, apiKey || localApiKey);
  }, [input, isLoading, sendMessage, apiKey, localApiKey]);

  // ✕ボタン
  const handleClose = useCallback(() => {
    onClose(chatMessages);
  }, [onClose, chatMessages]);

  if (!open) return null;

  return (
    <>
      {/* 背景暗転 */}
      <Backdrop
        open
        onClick={handleClose}
        sx={{
          position: "fixed",
          zIndex: 10,
          bgcolor: "rgba(0,0,0,0.5)",
        }}
      />

      {/* モーダル */}
      <Paper
        elevation={8}
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 11,
          width: "calc(100% - 32px)",
          maxWidth: 400,
          maxHeight: "calc(100vh - 260px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <PushPinIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap>
            &quot;{selectedText}&quot;
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* APIキー入力（新規質問時） */}
        {!hasChat && (
          <Box
            sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              fullWidth
              label="Anthropic APIキー"
              placeholder="sk-ant-..."
              size="small"
              type="password"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApiKeySubmit();
              }}
            />
            <Button
              variant="contained"
              fullWidth
              disabled={!isApiKeyValid || isLoading}
              onClick={handleApiKeySubmit}
            >
              AIに質問する
            </Button>
          </Box>
        )}

        {/* チャット表示 */}
        {hasChat && (
          <>
            {/* メッセージ一覧 */}
            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
              {chatMessages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      px: 2,
                      py: 1,
                      maxWidth: "85%",
                      borderRadius: 2,
                      bgcolor:
                        msg.role === "user" ? "primary.main" : "grey.100",
                      color:
                        msg.role === "user"
                          ? "primary.contrastText"
                          : "text.primary",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {msg.content}
                    </Typography>
                  </Paper>
                </Box>
              ))}

              {/* ローディングスピナー */}
              {isLoading && (
                <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1.5 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {/* エラーメッセージ */}
              {error && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* 入力欄 */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                p: 1.5,
                borderTop: 1,
                borderColor: "divider",
                flexShrink: 0,
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="追加で質問する..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Paper>
    </>
  );
}
