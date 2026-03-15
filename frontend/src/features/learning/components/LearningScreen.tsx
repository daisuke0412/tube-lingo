import { useState, useCallback } from "react";
import { useParams } from "react-router";
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
  PushPin as PushPinIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { TranscriptItem, ChatMessage } from "../../../shared/types";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";
import { useTranscript } from "../hooks/useTranscript";
import { useTranscriptSync } from "../hooks/useTranscriptSync";
import { useTextSelection } from "../hooks/useTextSelection";
import { useTranslation } from "../hooks/useTranslation";
import TranscriptList from "./TranscriptList";
import AiChatModal from "../../ai-chat/components/AiChatModal";

/** S-02 学習画面 */
export default function LearningScreen() {
  const { videoId } = useParams<{ videoId: string }>();
  const safeVideoId = videoId ?? "";

  // YouTube プレーヤー
  const { containerRef: playerRef, isReady, seekTo, getCurrentTime } =
    useYouTubePlayer(safeVideoId);

  // 字幕取得
  const { transcript, loading, error } = useTranscript(safeVideoId);

  // 再生位置同期
  const { activeIndex, setLineRef } = useTranscriptSync(
    transcript,
    getCurrentTime,
    isReady
  );

  // テキスト選択
  const {
    selectedText,
    selectedLineIndex,
    anchorPosition,
    contextLines,
    containerRef: transcriptContainerRef,
    handleMouseUp,
    clearSelection,
  } = useTextSelection(transcript);

  // 翻訳
  const { translation, translate, closeTranslation } = useTranslation();

  // AIチャット状態
  const [apiKey, setApiKey] = useState("");
  const [chatHistoryMap, setChatHistoryMap] = useState<
    Map<number, ChatMessage[]>
  >(new Map());
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatSelectedText, setAiChatSelectedText] = useState("");
  const [aiChatContextLines, setAiChatContextLines] = useState<
    TranscriptItem[]
  >([]);
  const [aiChatExistingHistory, setAiChatExistingHistory] = useState<
    ChatMessage[] | undefined
  >(undefined);
  const [aiChatLineIndex, setAiChatLineIndex] = useState<number>(-1);

  // 翻訳ボタン押下
  const handleTranslate = useCallback(() => {
    if (selectedText) {
      translate(selectedText);
      clearSelection();
    }
  }, [selectedText, translate, clearSelection]);

  // AI質問ボタン押下
  const handleAskAi = useCallback(() => {
    if (selectedText && selectedLineIndex !== null) {
      setAiChatSelectedText(selectedText);
      setAiChatContextLines(contextLines);
      setAiChatExistingHistory(undefined);
      setAiChatLineIndex(selectedLineIndex);
      setAiChatOpen(true);
      clearSelection();
    }
  }, [selectedText, selectedLineIndex, contextLines, clearSelection]);

  // ChatIcon タップ（履歴復元）
  const handleChatIconClick = useCallback(
    (index: number) => {
      if (!transcript) return;
      const history = chatHistoryMap.get(index);
      const start = Math.max(0, index - 2);
      const end = Math.min(transcript.length, index + 3);

      setAiChatSelectedText(transcript[index].text);
      setAiChatContextLines(transcript.slice(start, end));
      setAiChatExistingHistory(history);
      setAiChatLineIndex(index);
      setAiChatOpen(true);
    },
    [transcript, chatHistoryMap]
  );

  // AIチャットモーダルを閉じる
  const handleAiChatClose = useCallback(
    (messages: ChatMessage[]) => {
      setAiChatOpen(false);
      // チャット履歴を保存
      if (messages.length > 0 && aiChatLineIndex >= 0) {
        setChatHistoryMap((prev) => {
          const next = new Map(prev);
          next.set(aiChatLineIndex, messages);
          return next;
        });
      }
    },
    [aiChatLineIndex]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* YouTubeプレーヤー */}
      <Box
        sx={{
          height: 220,
          bgcolor: "#1a1a1a",
          flexShrink: 0,
        }}
      >
        <Box ref={playerRef} sx={{ width: "100%", height: "100%" }} />
      </Box>

      {/* 字幕エリア */}
      <Box
        ref={transcriptContainerRef}
        onMouseUp={handleMouseUp}
        sx={{ flex: 1, overflow: "auto", position: "relative" }}
      >
        {/* ローディング */}
        {loading && (
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
        {error && !loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              px: 2,
            }}
          >
            <Typography color="text.secondary">{error}</Typography>
          </Box>
        )}

        {/* 字幕リスト */}
        {transcript && !loading && !error && (
          <TranscriptList
            transcript={transcript}
            activeIndex={activeIndex}
            chatHistoryMap={chatHistoryMap}
            onSeek={seekTo}
            onChatIconClick={handleChatIconClick}
            setLineRef={setLineRef}
          />
        )}

        {/* テキスト選択時のアクションボタン（オーバーレイ） */}
        {selectedText && anchorPosition && (
          <Box
            sx={{
              position: "absolute",
              top: anchorPosition.top - 32,
              left: anchorPosition.left,
              display: "flex",
              gap: 0.5,
              zIndex: 2,
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={handleTranslate}
              sx={{
                minWidth: 0,
                px: 1.5,
                py: 0.25,
                fontSize: "0.8rem",
                bgcolor: "white",
              }}
            >
              翻訳
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleAskAi}
              sx={{
                minWidth: 0,
                px: 1.5,
                py: 0.25,
                fontSize: "0.8rem",
                bgcolor: "white",
              }}
            >
              AI質問
            </Button>
          </Box>
        )}

        {/* 翻訳結果モーダル */}
        {translation.word && (
          <>
            <Backdrop
              open
              onClick={closeTranslation}
              sx={{
                position: "absolute",
                zIndex: 1,
                bgcolor: "rgba(0,0,0,0.3)",
              }}
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
                  &quot;{translation.word}&quot;
                </Typography>
                <IconButton size="small" onClick={closeTranslation}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              {/* 翻訳結果 */}
              <Box sx={{ px: 2, py: 2 }}>
                {translation.loading && <CircularProgress size={24} />}
                {translation.error && (
                  <Typography color="error">{translation.error}</Typography>
                )}
                {translation.result && (
                  <Typography variant="body1">{translation.result}</Typography>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Box>

      {/* AIチャットモーダル */}
      <AiChatModal
        open={aiChatOpen}
        onClose={handleAiChatClose}
        selectedText={aiChatSelectedText}
        contextLines={aiChatContextLines}
        existingHistory={aiChatExistingHistory}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
    </Box>
  );
}
