import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAiChat } from "../hooks/useAiChat";
import type { ChatMessage, TranscriptItem } from "@/shared/types";

type AiChatModalProps = {
  apiKey: string;
  onApiKeySet: (key: string) => void;
  selectedText: string;
  contextTranscripts: TranscriptItem[];
  transcriptIndex: number;
  initialHistory: ChatMessage[];
  onClose: (transcriptIndex: number, history: ChatMessage[]) => void;
};

export default function AiChatModal({
  apiKey,
  onApiKeySet,
  selectedText,
  contextTranscripts,
  transcriptIndex,
  initialHistory,
  onClose,
}: AiChatModalProps) {
  const [inputText, setInputText] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isApiKeyValid = apiKey.startsWith("sk-ant-");

  const { chatHistory, isStreaming, error, sendMessage } = useAiChat(
    apiKey,
    selectedText,
    contextTranscripts,
    initialHistory
  );

  // チャット末尾へ自動スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming || !isApiKeyValid) return;
    setInputText("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasHistory = chatHistory.length > 0;

  const handleAsk = () => {
    if (!isApiKeyValid) return;
    sendMessage(`「${selectedText}」について解説してください。`);
  };

  const handleClose = () => {
    onClose(transcriptIndex, chatHistory);
  };

  return (
    // オーバーレイ
    <Box
      onClick={handleClose}
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
        onClick={(e) => e.stopPropagation()}
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

        {/* APIキー入力フォーム */}
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            label="Anthropic API Key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onApiKeySet(e.target.value)}
            fullWidth
            size="small"
            placeholder="sk-ant-..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey((prev) => !prev)}
                    edge="end"
                    size="small"
                    aria-label={showApiKey ? "APIキーを隠す" : "APIキーを表示"}
                  >
                    {showApiKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
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
                  component="div"
                  sx={{
                    color: msg.role === "user" ? "#fff" : "inherit",
                    "& p": { m: 0 },
                    "& p + p": { mt: 1 },
                    "& h2": { fontSize: "0.875rem", fontWeight: "bold", mt: 1.5, mb: 0.5 },
                    "& ul, & ol": { m: 0, pl: 2 },
                    "& li": { fontSize: "0.875rem" },
                    "& code": {
                      backgroundColor: "rgba(0,0,0,0.08)",
                      px: 0.5,
                      borderRadius: 0.5,
                      fontSize: "0.8rem",
                    },
                    "& strong": { fontWeight: "bold" },
                  }}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
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

        {/* フッター: 履歴なし→質問ボタン / 履歴あり→チャット入力 */}
        {!hasHistory ? (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<QuestionAnswerIcon />}
              onClick={handleAsk}
              disabled={!isApiKeyValid || isStreaming}
            >
              この表現について質問する
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="追加で質問する…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || !isApiKeyValid}
              multiline
              maxRows={3}
              sx={{ mr: 1 }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming || !isApiKeyValid}
              color="primary"
              aria-label="送信"
            >
              <SendIcon />
            </IconButton>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
