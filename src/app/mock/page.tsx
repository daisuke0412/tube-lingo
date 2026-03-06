"use client";

// モック表示専用ページ（Playwrightキャプチャ用）
// 実際のAPI呼び出しなしで各画面の状態を表示する

import { useState } from "react";
import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import InitScreen from "@/features/init/components/InitScreen";
import LearningScreen from "@/features/learning/components/LearningScreen";
import AiChatModal from "@/features/ai-chat/components/AiChatModal";
import type { TranscriptItem, ChatMessage } from "@/shared/types";

// モック字幕データ
const MOCK_TRANSCRIPT: TranscriptItem[] = [
  { text: "That's why we need to understand the", offset: 0, duration: 2000 },
  { text: "photosynthesis of the plant.", offset: 2000, duration: 2500 },
  { text: "The process begins when sunlight hits", offset: 4500, duration: 2500 },
  { text: "the chlorophyll in the leaves.", offset: 7000, duration: 2500 },
  { text: "This allows the plant to convert", offset: 9500, duration: 2000 },
  { text: "CO2 into energy through a series", offset: 11500, duration: 2500 },
  { text: "of complex chemical reactions.", offset: 14000, duration: 2000 },
  { text: "The glucose produced is then used", offset: 16000, duration: 2500 },
  { text: "to fuel the plant's growth and", offset: 18500, duration: 2000 },
  { text: "maintenance of its cellular structure.", offset: 20500, duration: 2500 },
];

// モックチャット履歴
const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "光合成（photosynthesis）とは、植物が太陽光を使ってエネルギーを作り出す仕組みです。\n\n葉緑素（chlorophyll）が光を吸収し、二酸化炭素（CO2）と水（H2O）からブドウ糖（glucose）と酸素（O2）を生成します。",
  },
  { role: "user", content: "もう少し簡単に教えてください。" },
  {
    role: "assistant",
    content:
      "簡単に言うと、植物が「光で料理をする」仕組みです！\n\n☀️ 太陽の光 + 💧 水 + 🌬️ CO2 → 🍬 栄養（エネルギー）+ 🌿 酸素\n\n人間が食事からエネルギーを得るように、植物は光合成でエネルギーを作っています。",
  },
];

type MockView =
  | "s01-init"
  | "s02-learning"
  | "s02-learning-selection"
  | "s02-learning-translation"
  | "s02m-chat-new"
  | "s02m-chat-history";

export default function MockPage() {
  const [view, setView] = useState<MockView>("s01-init");

  const views: { key: MockView; label: string }[] = [
    { key: "s01-init", label: "S-01 初期画面" },
    { key: "s02-learning", label: "S-02 学習画面" },
    { key: "s02-learning-selection", label: "S-02 テキスト選択" },
    { key: "s02-learning-translation", label: "S-02 翻訳結果" },
    { key: "s02m-chat-new", label: "S-02-M 新規チャット" },
    { key: "s02m-chat-history", label: "S-02-M 履歴チャット" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      {/* ビュー切り替えコントロール（キャプチャ時は非表示） */}
      <Box
        className="mock-controls"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          p: 1,
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Typography variant="caption" sx={{ width: "100%", fontWeight: "bold" }}>
          モック表示切替：
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          {views.map((v) => (
            <Button
              key={v.key}
              onClick={() => setView(v.key)}
              variant={view === v.key ? "contained" : "outlined"}
            >
              {v.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* 画面表示エリア（480px幅でスマホ想定） */}
      <Box sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <MockScreen view={view} />
      </Box>
    </Box>
  );
}

function MockScreen({ view }: { view: MockView }) {
  if (view === "s01-init") {
    // 初期画面（onStartは何もしない）
    return <InitScreen onStart={() => {}} />;
  }

  if (view === "s02-learning") {
    return (
      <MockLearningScreen
        chatAskedIndices={new Set([1, 4])}
        showSelection={false}
        showTranslation={false}
      />
    );
  }

  if (view === "s02-learning-selection") {
    return (
      <MockLearningScreenWithSelection />
    );
  }

  if (view === "s02-learning-translation") {
    return (
      <MockLearningScreenWithTranslation />
    );
  }

  if (view === "s02m-chat-new") {
    return (
      <Box sx={{ position: "relative", height: "100%", overflow: "hidden" }}>
        {/* 背景として学習画面（暗転） */}
        <Box sx={{ filter: "brightness(0.4)", height: "100%" }}>
          <MockLearningScreen
            chatAskedIndices={new Set()}
            showSelection={false}
            showTranslation={false}
          />
        </Box>
        {/* モーダル */}
        <AiChatModal
          apiKey=""
          selectedText="photosynthesis"
          contextTranscripts={MOCK_TRANSCRIPT.slice(0, 5)}
          transcriptIndex={1}
          initialHistory={[]}
          onClose={() => {}}
        />
      </Box>
    );
  }

  if (view === "s02m-chat-history") {
    return (
      <Box sx={{ position: "relative", height: "100%", overflow: "hidden" }}>
        {/* 背景として学習画面（暗転） */}
        <Box sx={{ filter: "brightness(0.4)", height: "100%" }}>
          <MockLearningScreen
            chatAskedIndices={new Set([1])}
            showSelection={false}
            showTranslation={false}
          />
        </Box>
        {/* モーダル（チャット履歴あり） */}
        <AiChatModal
          apiKey="sk-ant-mock"
          selectedText="photosynthesis"
          contextTranscripts={MOCK_TRANSCRIPT.slice(0, 5)}
          transcriptIndex={1}
          initialHistory={MOCK_CHAT_HISTORY}
          onClose={() => {}}
        />
      </Box>
    );
  }

  return null;
}

// 学習画面のモック表示（YouTube IFrame なしで字幕のみ）
function MockLearningScreen({
  chatAskedIndices,
  showSelection,
  showTranslation,
}: {
  chatAskedIndices: Set<number>;
  showSelection: boolean;
  showTranslation: boolean;
}) {
  return (
    <LearningScreen
      apiKey="sk-ant-mock"
      transcript={MOCK_TRANSCRIPT}
      videoId="dQw4w9WgXcQ"
      onBack={() => {}}
    />
  );
}

// テキスト選択状態のモック
function MockLearningScreenWithSelection() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        mx: "auto",
        position: "relative",
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>TubeLingo</Typography>
      </Box>

      {/* YouTube プレーヤー（プレースホルダー） */}
      <Box
        sx={{
          flexShrink: 0,
          backgroundColor: "#000",
          aspectRatio: "16/9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ color: "#fff", opacity: 0.5 }}>YouTube Player</Typography>
      </Box>

      {/* 字幕エリア */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1, position: "relative" }}>
        {MOCK_TRANSCRIPT.map((item, index) => (
          <Box
            key={index}
            sx={{
              py: 0.5,
              px: 1,
              borderRadius: 1,
              backgroundColor: index === 3 ? "#dbeafe" : "transparent",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
            }}
          >
            <Typography
              variant="body1"
              component="span"
              sx={{
                flexGrow: 1,
                backgroundColor: index === 3 ? "rgba(25,118,210,0.3)" : "transparent",
                borderRadius: "3px",
              }}
            >
              {index === 3 ? (
                <>
                  the{" "}
                  <Box
                    component="span"
                    sx={{ backgroundColor: "#b3d4fc", borderRadius: "2px", px: 0.3 }}
                  >
                    chlorophyll
                  </Box>{" "}
                  in the leaves.
                </>
              ) : (
                item.text
              )}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* テキスト選択アクションボタン（固定表示） */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 1,
          p: 0.5,
          backgroundColor: "#fff",
          borderRadius: 1,
          boxShadow: 3,
          zIndex: 100,
        }}
      >
        <Button size="small" variant="outlined">翻訳</Button>
        <Button size="small" variant="contained">AIに聞く</Button>
      </Box>
    </Box>
  );
}

// 翻訳結果表示のモック
function MockLearningScreenWithTranslation() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        mx: "auto",
        position: "relative",
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>TubeLingo</Typography>
      </Box>

      {/* YouTube プレーヤー（プレースホルダー） */}
      <Box
        sx={{
          flexShrink: 0,
          backgroundColor: "#000",
          aspectRatio: "16/9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ color: "#fff", opacity: 0.5 }}>YouTube Player</Typography>
      </Box>

      {/* 字幕エリア */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1, position: "relative" }}>
        {MOCK_TRANSCRIPT.map((item, index) => (
          <Box
            key={index}
            sx={{
              py: 0.5,
              px: 1,
              borderRadius: 1,
              backgroundColor: index === 3 ? "#dbeafe" : "transparent",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
            }}
          >
            <Typography variant="body1" component="span" sx={{ flexGrow: 1 }}>
              {item.text}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 翻訳ポップアップ（固定表示） */}
      <Box
        sx={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          p: 1.5,
          maxWidth: 240,
          backgroundColor: "#fff",
          borderRadius: 1,
          boxShadow: 3,
          zIndex: 100,
          border: "1px solid",
          borderColor: "primary.main",
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">
          翻訳結果
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          クロロフィル（葉緑素）
        </Typography>
      </Box>
    </Box>
  );
}
