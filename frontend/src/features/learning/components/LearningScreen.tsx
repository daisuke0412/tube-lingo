import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Chat as ChatIcon, PlayArrow as PlayArrowIcon } from "@mui/icons-material";
import { useTranscriptSync } from "../hooks/useTranscriptSync";
import AiChatModal from "@/features/ai-chat/components/AiChatModal";
import TranslationModal from "./TranslationModal";
import type { TranscriptItem, ChatMessage } from "@/shared/types";

type LearningScreenProps = {
  transcript: TranscriptItem[] | null;
  transcriptError?: string | null;
  videoId: string;
  onBack: () => void;
};

// AIチャットモーダルの開き方
type AiChatTrigger = {
  selectedText: string;
  contextTranscripts: TranscriptItem[];
  transcriptIndex: number;
} | null;

export default function LearningScreen({
  transcript,
  transcriptError,
  videoId,
  onBack,
}: LearningScreenProps) {
  const { currentIndex, playerRef, seekTo } = useTranscriptSync(transcript ?? []);

  // APIキー（学習画面内で管理）
  const [apiKey, setApiKey] = useState("");

  // 字幕エリアの自動スクロール
  const transcriptAreaRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLDivElement>(null);

  // テキスト選択状態
  const [selectionInfo, setSelectionInfo] = useState<{
    text: string;
    anchorY: number;
    transcriptIndex: number;
  } | null>(null);

  // 翻訳モーダル
  const [translationText, setTranslationText] = useState<string | null>(null);

  // AIチャット済みの字幕インデックスセット
  const [chatAskedIndices, setChatAskedIndices] = useState<Set<number>>(
    new Set()
  );

  // AIチャットモーダル
  const [aiChatTrigger, setAiChatTrigger] = useState<AiChatTrigger>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  // 字幕ごとのチャット履歴
  const [chatHistories, setChatHistories] = useState<
    Map<number, ChatMessage[]>
  >(new Map());

  // YouTube IFrame API を読み込む
  useEffect(() => {
    const initPlayer = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        playerVars: { rel: 0 },
      });
    };

    if (window.YT) {
      initPlayer();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);
    window.onYouTubeIframeAPIReady = initPlayer;
  }, [videoId, playerRef]);

  // 現在字幕を自動スクロール
  useEffect(() => {
    if (currentItemRef.current && transcriptAreaRef.current) {
      currentItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  // テキスト選択を検知（mouseup 時に確定し、他の箇所クリックまで保持）
  const handleMouseUp = useCallback(
    (e: React.MouseEvent, index: number) => {
      // setTimeout で選択が確定した後に取得
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim() ?? "";
        if (selectedText.length > 0) {
          setSelectionInfo({
            text: selectedText,
            anchorY: e.clientY,
            transcriptIndex: index,
          });
        }
      }, 0);
    },
    []
  );

  // 字幕クリックで再生位置を変更
  const handleTranscriptClick = useCallback(
    (item: TranscriptItem) => {
      seekTo(item.offset);
    },
    [seekTo]
  );

  // 翻訳ボタン押下
  const handleTranslate = () => {
    if (!selectionInfo) return;
    setTranslationText(selectionInfo.text);
    setSelectionInfo(null);
  };

  // AIに聞くボタン押下
  const handleAskAi = useCallback(() => {
    if (!selectionInfo || !transcript) return;
    const index = selectionInfo.transcriptIndex;
    // 前後10件の字幕をコンテキストとして取得
    const start = Math.max(0, index - 10);
    const end = Math.min(transcript.length - 1, index + 10);
    const contextTranscripts = transcript.slice(start, end + 1);

    setAiChatTrigger({
      selectedText: selectionInfo.text,
      contextTranscripts,
      transcriptIndex: index,
    });
    setIsAiChatOpen(true);
    setSelectionInfo(null);
  }, [selectionInfo, transcript]);

  // 💬アイコンタップ（履歴復元）
  const handleChatIconClick = useCallback((index: number) => {
    if (!transcript) return;
    const start = Math.max(0, index - 10);
    const end = Math.min(transcript.length - 1, index + 10);
    const contextTranscripts = transcript.slice(start, end + 1);

    setAiChatTrigger({
      selectedText: "",
      contextTranscripts,
      transcriptIndex: index,
    });
    setIsAiChatOpen(true);
  }, [transcript]);

  // モーダルを閉じる
  const handleAiChatClose = (
    transcriptIndex: number,
    history: ChatMessage[]
  ) => {
    setIsAiChatOpen(false);
    if (history.length > 0) {
      setChatAskedIndices((prev) => new Set(prev).add(transcriptIndex));
      setChatHistories((prev) => new Map(prev).set(transcriptIndex, history));
    }
  };

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        mx: "auto",
      }}
    >
      {/* ヘッダー（戻るボタン） */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.5,
          flexShrink: 0,
        }}
      >
        <IconButton onClick={onBack} size="small" aria-label="戻る">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>
          TubeLingo
        </Typography>
      </Box>

      {/* YouTube プレーヤー */}
      <Box sx={{ flexShrink: 0 }}>
        <div id="yt-player" style={{ width: "100%", aspectRatio: "16/9" }} />
      </Box>

      {/* 字幕エリア */}
      <Box
        ref={transcriptAreaRef}
        data-testid="TranscriptArea"
        onClick={() => {
          setSelectionInfo(null);
        }}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 1,
          position: "relative",
        }}
      >
        {/* 字幕ローディング中 */}
        {!transcript && !transcriptError && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 6,
              gap: 1.5,
            }}
          >
            <CircularProgress size={32} />
            <Typography variant="body2">字幕を取得中…</Typography>
            <Typography variant="caption" color="text.secondary">
              数秒程度お待ちください
            </Typography>
          </Box>
        )}

        {/* 字幕取得エラー */}
        {transcriptError && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
              gap: 1,
            }}
          >
            <Typography color="error" variant="body2" textAlign="center">
              {transcriptError}
            </Typography>
          </Box>
        )}

        {transcript?.map((item, index) => (
          <Box
            key={index}
            ref={index === currentIndex ? currentItemRef : null}
            onMouseUp={(e) => {
              e.stopPropagation();
              handleMouseUp(e, index);
            }}
            sx={{
              py: 0.125,
              px: 1,
              borderRadius: 1,
              backgroundColor:
                index === currentIndex
                  ? "#dbeafe"
                  : "transparent",
              "&:hover": { backgroundColor: "action.hover" },
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
            }}
          >
            <PlayArrowIcon
              onClick={(e) => {
                e.stopPropagation();
                handleTranscriptClick(item);
              }}
              sx={{
                fontSize: "1rem",
                cursor: "pointer",
                flexShrink: 0,
                color: "text.secondary",
              }}
            />
            <Typography variant="body1" component="span" sx={{ flexGrow: 1 }}>
              {item.text}
            </Typography>
            {chatAskedIndices.has(index) && (
              <ChatIcon
                fontSize="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChatIconClick(index);
                }}
                sx={{ cursor: "pointer", flexShrink: 0 }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* テキスト選択アクションボタン */}
      {selectionInfo && (
        <Paper
          elevation={3}
          sx={{
            position: "fixed",
            top: selectionInfo.anchorY - 50,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 0.5,
            zIndex: 100,
          }}
        >
          <Button size="small" variant="outlined" onClick={handleTranslate}>
            翻訳
          </Button>
          <Button size="small" variant="contained" onClick={handleAskAi}>
            AIに聞く
          </Button>
        </Paper>
      )}

      {/* 翻訳モーダル */}
      {translationText && (
        <TranslationModal
          selectedText={translationText}
          onClose={() => setTranslationText(null)}
        />
      )}

      {/* AIチャットモーダル */}
      {isAiChatOpen && aiChatTrigger && (
        <AiChatModal
          apiKey={apiKey}
          onApiKeySet={setApiKey}
          selectedText={aiChatTrigger.selectedText}
          contextTranscripts={aiChatTrigger.contextTranscripts}
          transcriptIndex={aiChatTrigger.transcriptIndex}
          initialHistory={
            chatHistories.get(aiChatTrigger.transcriptIndex) ?? []
          }
          onClose={handleAiChatClose}
        />
      )}
    </Box>
  );
}
