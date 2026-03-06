"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Chat as ChatIcon } from "@mui/icons-material";
import { useTranscriptSync } from "../hooks/useTranscriptSync";
import AiChatModal from "@/features/ai-chat/components/AiChatModal";
import type { TranscriptItem, ChatMessage } from "@/shared/types";

type LearningScreenProps = {
  apiKey: string;
  transcript: TranscriptItem[];
  videoId: string;
  onBack: () => void;
};

// 翻訳ポップアップの状態
type TranslationPopup = {
  text: string;
  anchorY: number;
} | null;

// AIチャットモーダルの開き方
type AiChatTrigger = {
  selectedText: string;
  contextTranscripts: TranscriptItem[];
  transcriptIndex: number;
} | null;

export default function LearningScreen({
  apiKey,
  transcript,
  videoId,
  onBack,
}: LearningScreenProps) {
  const { currentIndex, playerRef, seekTo } = useTranscriptSync(transcript);

  // 字幕エリアの自動スクロール
  const transcriptAreaRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLDivElement>(null);

  // テキスト選択状態
  const [selectionInfo, setSelectionInfo] = useState<{
    text: string;
    anchorY: number;
    transcriptIndex: number;
  } | null>(null);

  // 翻訳ポップアップ
  const [translationPopup, setTranslationPopup] =
    useState<TranslationPopup>(null);

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

  // テキスト選択を検知
  const handleMouseUp = useCallback(
    (e: React.MouseEvent, index: number) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() ?? "";
      if (selectedText.length > 0) {
        setSelectionInfo({
          text: selectedText,
          anchorY: e.clientY,
          transcriptIndex: index,
        });
        setTranslationPopup(null);
      } else {
        setSelectionInfo(null);
      }
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
  const handleTranslate = async () => {
    if (!selectionInfo) return;
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          selectionInfo.text
        )}&langpair=en|ja`
      );
      const data = await res.json();
      const translated =
        data?.responseData?.translatedText ?? "翻訳できませんでした";
      setTranslationPopup({
        text: translated,
        anchorY: selectionInfo.anchorY,
      });
    } catch {
      setTranslationPopup({
        text: "通信エラーが発生しました。再度お試しください",
        anchorY: selectionInfo?.anchorY ?? 0,
      });
    }
  };

  // AIに聞くボタン押下
  const handleAskAi = () => {
    if (!selectionInfo) return;
    const index = selectionInfo.transcriptIndex;
    // 前後3件の字幕をコンテキストとして取得
    const start = Math.max(0, index - 3);
    const end = Math.min(transcript.length - 1, index + 3);
    const contextTranscripts = transcript.slice(start, end + 1);

    setAiChatTrigger({
      selectedText: selectionInfo.text,
      contextTranscripts,
      transcriptIndex: index,
    });
    setIsAiChatOpen(true);
    setSelectionInfo(null);
  };

  // 💬アイコンタップ（履歴復元）
  const handleChatIconClick = (index: number) => {
    const start = Math.max(0, index - 3);
    const end = Math.min(transcript.length - 1, index + 3);
    const contextTranscripts = transcript.slice(start, end + 1);

    setAiChatTrigger({
      selectedText: "",
      contextTranscripts,
      transcriptIndex: index,
    });
    setIsAiChatOpen(true);
  };

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
        onClick={() => {
          setSelectionInfo(null);
          setTranslationPopup(null);
        }}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 1,
          position: "relative",
        }}
      >
        {transcript.map((item, index) => (
          <Box
            key={index}
            ref={index === currentIndex ? currentItemRef : null}
            onMouseUp={(e) => {
              e.stopPropagation();
              handleMouseUp(e, index);
            }}
            onClick={() => handleTranscriptClick(item)}
            sx={{
              py: 0.125,
              px: 1,
              borderRadius: 1,
              cursor: "pointer",
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
      {selectionInfo && !translationPopup && (
        <Paper
          elevation={3}
          sx={{
            position: "fixed",
            top: selectionInfo.anchorY - 50,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
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

      {/* 翻訳ポップアップ */}
      {translationPopup && (
        <Paper
          elevation={3}
          onClick={() => setTranslationPopup(null)}
          sx={{
            position: "fixed",
            top: translationPopup.anchorY - 60,
            left: "50%",
            transform: "translateX(-50%)",
            p: 1.5,
            maxWidth: 280,
            zIndex: 100,
            cursor: "pointer",
          }}
        >
          <Typography variant="body2">{translationPopup.text}</Typography>
        </Paper>
      )}

      {/* AIチャットモーダル */}
      {isAiChatOpen && aiChatTrigger && (
        <AiChatModal
          apiKey={apiKey}
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
