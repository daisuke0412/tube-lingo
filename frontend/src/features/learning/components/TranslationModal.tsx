import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

type TranslationModalProps = {
  selectedText: string;
  onClose: () => void;
};

export default function TranslationModal({
  selectedText,
  onClose,
}: TranslationModalProps) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初回マウント時に翻訳APIを呼ぶ
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            selectedText
          )}&langpair=en|ja`
        );
        const data = await res.json();
        if (cancelled) return;
        const translated =
          data?.responseData?.translatedText ?? "翻訳できませんでした";
        setTranslatedText(translated);
      } catch {
        if (!cancelled) setError("通信エラーが発生しました。再度お試しください");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedText]);

  return (
    <Box
      onClick={onClose}
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
          maxHeight: "40dvh",
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
            翻訳
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="閉じる">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* 原文 */}
        <Box sx={{ px: 2, py: 1, backgroundColor: "grey.100" }}>
          <Typography variant="caption" color="text.secondary">
            原文
          </Typography>
          <Typography variant="body2" fontStyle="italic">
            &ldquo;{selectedText}&rdquo;
          </Typography>
        </Box>

        <Divider />

        {/* 翻訳結果 */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 2 }}>
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 2,
                gap: 1,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                翻訳中…
              </Typography>
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {translatedText && (
            <Typography variant="body1">{translatedText}</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
