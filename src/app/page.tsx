"use client";

import { useState } from "react";
import InitScreen from "@/features/init/components/InitScreen";
import LearningScreen from "@/features/learning/components/LearningScreen";
import type { TranscriptItem } from "@/shared/types";

// 画面状態
type ScreenState = "init" | "learning";

export default function Home() {
  const [screen, setScreen] = useState<ScreenState>("init");
  // APIキーはメモリ上にのみ保持（localStorage 等には保存しない）
  const [apiKey, setApiKey] = useState<string>("");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [videoId, setVideoId] = useState<string>("");

  const handleStart = (params: {
    apiKey: string;
    transcript: TranscriptItem[];
    videoId: string;
  }) => {
    setApiKey(params.apiKey);
    setTranscript(params.transcript);
    setVideoId(params.videoId);
    setScreen("learning");
  };

  const handleBack = () => {
    setScreen("init");
  };

  if (screen === "learning") {
    return (
      <LearningScreen
        apiKey={apiKey}
        transcript={transcript}
        videoId={videoId}
        onBack={handleBack}
      />
    );
  }

  return <InitScreen onStart={handleStart} />;
}
