import { useState } from "react";
import {
  Box,
  Button,
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

type Pattern = "apiKey" | "chat";

/** ダミーチャット履歴 */
const DUMMY_CHAT = [
  {
    role: "user" as const,
    content: "「photosynthesis」について解説してください。",
  },
  {
    role: "assistant" as const,
    content:
      "翻訳: 光合成\n\n解説: これは植物が太陽光をエネルギーに変える仕組みについて説明している場面です。前の字幕で植物の成長に光が必要と述べており、その仕組みの名称として photosynthesis を導入しています。",
  },
  {
    role: "user" as const,
    content: "もう少し簡単に説明してください。",
  },
  {
    role: "assistant" as const,
    content:
      "簡単に言うと、植物が光でご飯を作ることです。太陽の光を使って、空気中の二酸化炭素と水から栄養を作り出します。",
  },
];

/** S-02-M AIチャットモーダルモック */
export default function AiChatModalMock() {
  const [pattern, setPattern] = useState<Pattern>("apiKey");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* YouTubeプレーヤー領域（プレースホルダー） */}
      <Box
        sx={{
          height: 220,
          bgcolor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: "#666" }}>YouTube Player</Typography>
      </Box>

      {/* 字幕エリア（暗転） + モーダル */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          bgcolor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: "100%",
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
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              &quot;photosynthesis&quot;
            </Typography>
            <IconButton size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* APIキー入力パターン */}
          {pattern === "apiKey" && (
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Anthropic APIキー"
                placeholder="sk-ant-..."
                size="small"
                type="password"
              />
              <Button variant="contained" fullWidth>
                AIに質問する
              </Button>
            </Box>
          )}

          {/* チャット表示パターン */}
          {pattern === "chat" && (
            <>
              {/* メッセージ一覧 */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                {DUMMY_CHAT.map((msg, index) => (
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
                          msg.role === "user"
                            ? "primary.main"
                            : "grey.100",
                        color:
                          msg.role === "user" ? "primary.contrastText" : "text.primary",
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
                />
                <IconButton color="primary">
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* パターン切り替えボタン（モック確認用） */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 1,
          justifyContent: "center",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Button
          size="small"
          variant={pattern === "apiKey" ? "contained" : "outlined"}
          onClick={() => setPattern("apiKey")}
        >
          APIキー入力
        </Button>
        <Button
          size="small"
          variant={pattern === "chat" ? "contained" : "outlined"}
          onClick={() => setPattern("chat")}
        >
          チャット
        </Button>
      </Box>
    </Box>
  );
}
