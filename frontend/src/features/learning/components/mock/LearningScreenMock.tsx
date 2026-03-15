import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Backdrop,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Chat as ChatIcon,
  PushPin as PushPinIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

/** ダミー字幕データ */
const DUMMY_TRANSCRIPT = [
  { text: "That's why we need to understand the", start: 10.0, duration: 2.5 },
  { text: "photosynthesis of the plant.", start: 12.5, duration: 3.0, hasChat: true },
  { text: "The process begins when sunlight hits the", start: 15.5, duration: 2.8, hasChat: true },
  { text: "chlorophyll in the leaves.", start: 18.3, duration: 2.0 },
  { text: "This allows the plant to convert CO2 into energy.", start: 20.3, duration: 3.5 },
];

type Pattern = "normal" | "selected" | "translation" | "loading" | "error";

/** S-02 学習画面モック */
export default function LearningScreenMock() {
  const [pattern, setPattern] = useState<Pattern>("normal");
  // ハイライト行（通常表示用）
  const highlightIndex = 1;

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

      {/* 字幕エリア */}
      <Box sx={{ flex: 1, overflow: "auto", position: "relative" }}>
        {/* ローディング */}
        {pattern === "loading" && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* エラー */}
        {pattern === "error" && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              px: 2,
            }}
          >
            <Typography color="text.secondary">
              この動画には字幕がありません
            </Typography>
          </Box>
        )}

        {/* 字幕リスト（通常・選択・翻訳） */}
        {(pattern === "normal" ||
          pattern === "selected" ||
          pattern === "translation") && (
          <Box sx={{ p: 1 }}>
            {DUMMY_TRANSCRIPT.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0.5,
                  px: 1,
                  borderRadius: 1,
                  bgcolor:
                    index === highlightIndex
                      ? "rgba(33, 150, 243, 0.08)"
                      : "transparent",
                }}
              >
                <IconButton size="small" sx={{ mt: -0.5 }}>
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
                <Typography
                  variant="body1"
                  sx={{ flex: 1, lineHeight: 1.8 }}
                >
                  {/* テキスト選択時のハイライト表示 */}
                  {pattern === "selected" && index === 3 ? (
                    <Box component="span" sx={{ position: "relative" }}>
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: "100%",
                          left: 0,
                          display: "flex",
                          gap: 0.5,
                          mb: 0.5,
                          zIndex: 2,
                        }}
                      >
                        <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: "0.8rem", bgcolor: "white" }}>
                          翻訳
                        </Button>
                        <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: "0.8rem", bgcolor: "white" }}>
                          AI質問
                        </Button>
                      </Box>
                      <Box
                        component="span"
                        sx={{ bgcolor: "rgba(33, 150, 243, 0.2)", px: 0.5 }}
                      >
                        chlorophyll
                      </Box>
                      {" in the leaves."}
                    </Box>
                  ) : (
                    item.text
                  )}
                </Typography>
                {item.hasChat && (
                  <IconButton size="small" sx={{ mt: -0.5 }}>
                    <ChatIcon fontSize="small" color="primary" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* 翻訳結果モーダル */}
        {pattern === "translation" && (
          <>
            <Backdrop
              open
              sx={{ position: "absolute", zIndex: 1, bgcolor: "rgba(0,0,0,0.3)" }}
            />
            <Paper
              elevation={4}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                width: "85%",
                maxWidth: 360,
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
                }}
              >
                <PushPinIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" sx={{ flex: 1 }}>
                  &quot;photosynthesis&quot;
                </Typography>
                <IconButton size="small" onClick={() => setPattern("normal")}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              {/* 翻訳結果 */}
              <Box sx={{ px: 2, py: 2 }}>
                <Typography variant="body1">光合成</Typography>
              </Box>
            </Paper>
          </>
        )}
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
          flexWrap: "wrap",
        }}
      >
        {(
          [
            ["normal", "通常"],
            ["selected", "選択"],
            ["translation", "翻訳"],
            ["loading", "ローディング"],
            ["error", "エラー"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="small"
            variant={pattern === key ? "contained" : "outlined"}
            onClick={() => setPattern(key)}
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
