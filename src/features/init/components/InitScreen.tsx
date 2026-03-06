"use client";

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { useInitForm } from "../hooks/useInitForm";
import type { TranscriptItem } from "@/shared/types";

type InitScreenProps = {
  onStart: (params: {
    apiKey: string;
    transcript: TranscriptItem[];
    videoId: string;
  }) => void;
};

export default function InitScreen({ onStart }: InitScreenProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const {
    apiKey,
    youtubeUrl,
    apiKeyError,
    urlError,
    submitError,
    isLoading,
    setApiKey,
    setYoutubeUrl,
    handleSubmit,
  } = useInitForm(onStart);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 4,
        maxWidth: 480,
        mx: "auto",
      }}
    >
      {/* アプリ名 */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
        TubeLingo
      </Typography>

      {/* APIキー入力 */}
      <TextField
        label="Anthropic API Key"
        type={showApiKey ? "text" : "password"}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        error={!!apiKeyError}
        helperText={apiKeyError || "AIチャット機能を使う場合に入力してください"}
        disabled={isLoading}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowApiKey((prev) => !prev)}
                edge="end"
                aria-label={showApiKey ? "APIキーを隠す" : "APIキーを表示"}
              >
                {showApiKey ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* YouTube URL 入力 */}
      <TextField
        label="YouTube URL"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        error={!!urlError}
        helperText={urlError}
        disabled={isLoading}
        fullWidth
        placeholder="https://www.youtube.com/watch?v=..."
        sx={{ mb: 3 }}
      />

      {/* 送信エラー */}
      {submitError && (
        <Typography color="error" variant="body2" sx={{ mb: 2, width: "100%" }}>
          {submitError}
        </Typography>
      )}

      {/* 開始ボタン */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit}
        disabled={isLoading}
        sx={{ mb: 4 }}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : "開始する"}
      </Button>

      <Divider sx={{ width: "100%", mb: 3 }} />

      {/* ご利用にあたって */}
      <Box sx={{ width: "100%" }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          ご利用にあたって
        </Typography>
        <List dense disablePadding>
          {[
            "トークンの消費はAIチャット機能の利用時のみです",
            "AI機能はClaude (Anthropic) を使用しています",
            "利用モデルはClaude Sonnet系の最新版です",
            "APIキーはこのセッション中のみ保持されます。ページを閉じると即座に消去され、サーバーにも送信されません",
          ].map((text, i) => (
            <ListItem key={i} disablePadding sx={{ alignItems: "flex-start" }}>
              <ListItemText
                primary={`• ${text}`}
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
