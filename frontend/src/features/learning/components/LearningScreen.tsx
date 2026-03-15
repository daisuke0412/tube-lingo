import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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

/** チャット履歴エントリ */
interface ChatEntry {
  messages: ChatMessage[];
  lineIndex: number;
  selectedText: string;
  contextLines: TranscriptItem[];
}

/** chatEntryMapの複合キーを生成 */
function makeChatKey(lineIndex: number, selectedText: string): string {
  return `${lineIndex}:${selectedText}`;
}

/** AIチャットモーダルの状態 */
interface AiChatState {
  isOpen: boolean;
  chatKey: string;
  selectedText: string;
  contextLines: TranscriptItem[];
  existingHistory: ChatMessage[] | undefined;
  lineIndex: number;
}

const INITIAL_AI_CHAT_STATE: AiChatState = {
  isOpen: false,
  chatKey: "",
  selectedText: "",
  contextLines: [],
  existingHistory: undefined,
  lineIndex: -1,
};

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
    contextLines: selectionContextLines,
    containerRef: transcriptContainerRef,
    handleMouseUp,
    clearSelection,
  } = useTextSelection(transcript);

  // 翻訳
  const { translation, translate, closeTranslation } = useTranslation();

  // AIチャット状態
  const [apiKey, setApiKey] = useState("");
  const [chatEntryMap, setChatEntryMap] = useState<Record<string, ChatEntry>>(
    {}
  );
  const [aiChat, setAiChat] = useState<AiChatState>(INITIAL_AI_CHAT_STATE);

  // chatEntryMap を ref で保持
  const chatEntryMapRef = useRef(chatEntryMap);
  useEffect(() => {
    chatEntryMapRef.current = chatEntryMap;
  }, [chatEntryMap]);

  // TranscriptList用: どの行にチャット履歴があるか
  const chatLineIndices = useMemo(() => {
    const indices: Set<number> = new Set();
    for (const entry of Object.values(chatEntryMap)) {
      indices.add(entry.lineIndex);
    }
    return indices;
  }, [chatEntryMap]);

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
      const chatKey = makeChatKey(selectedLineIndex, selectedText);
      const existing = chatEntryMapRef.current[chatKey];
      setAiChat({
        isOpen: true,
        chatKey,
        selectedText,
        contextLines: selectionContextLines,
        existingHistory: existing?.messages,
        lineIndex: selectedLineIndex,
      });
      clearSelection();
    }
  }, [selectedText, selectedLineIndex, selectionContextLines, clearSelection]);

  // ChatIcon タップ（該当行の最新の会話を復元）
  const handleChatIconClick = useCallback(
    (index: number) => {
      if (!transcript) return;
      // この行に紐づくエントリの中から最新を探す
      const entries = Object.entries(chatEntryMapRef.current).filter(
        ([, e]) => e.lineIndex === index
      );
      if (entries.length === 0) return;
      // 最後に追加されたエントリを使う
      const [chatKey, entry] = entries[entries.length - 1];

      setAiChat({
        isOpen: true,
        chatKey,
        selectedText: entry.selectedText,
        contextLines: entry.contextLines,
        existingHistory: entry.messages,
        lineIndex: index,
      });
    },
    [transcript]
  );

  // AIチャットモーダルを閉じる
  const handleAiChatClose = useCallback(
    (messages: ChatMessage[]) => {
      if (messages.length > 0 && aiChat.chatKey) {
        setChatEntryMap((prev) => ({
          ...prev,
          [aiChat.chatKey]: {
            messages,
            lineIndex: aiChat.lineIndex,
            selectedText: aiChat.selectedText,
            contextLines: aiChat.contextLines,
          },
        }));
      }
      setAiChat(INITIAL_AI_CHAT_STATE);
    },
    [aiChat.chatKey, aiChat.lineIndex, aiChat.selectedText, aiChat.contextLines]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* YouTubeプレーヤー */}
      <Box sx={{ height: 220, bgcolor: "#1a1a1a", flexShrink: 0 }}>
        <Box ref={playerRef} sx={{ width: "100%", height: "100%" }} />
      </Box>

      {/* 字幕エリア */}
      <Box
        ref={transcriptContainerRef}
        onMouseUp={handleMouseUp}
        sx={{ flex: 1, overflow: "auto", position: "relative" }}
      >
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

        {transcript && !loading && !error && (
          <TranscriptList
            transcript={transcript}
            activeIndex={activeIndex}
            chatLineIndices={chatLineIndices}
            onSeek={seekTo}
            onChatIconClick={handleChatIconClick}
            setLineRef={setLineRef}
          />
        )}

        {/* テキスト選択時のアクションボタン */}
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
              variant="contained"
              onClick={handleTranslate}
              sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: "0.8rem" }}
            >
              翻訳
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleAskAi}
              sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: "0.8rem" }}
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
              sx={{ position: "fixed", zIndex: 10, bgcolor: "rgba(0,0,0,0.3)" }}
            />
            <Paper
              elevation={8}
              sx={{
                position: "fixed",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 11,
                width: "calc(100% - 32px)",
                maxWidth: 360,
              }}
            >
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
        key={aiChat.chatKey}
        open={aiChat.isOpen}
        onClose={handleAiChatClose}
        selectedText={aiChat.selectedText}
        contextLines={aiChat.contextLines}
        existingHistory={aiChat.existingHistory}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
    </Box>
  );
}
