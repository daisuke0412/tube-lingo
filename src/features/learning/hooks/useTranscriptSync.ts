"use client";

import { useState, useEffect, useRef } from "react";
import type { TranscriptItem } from "@/shared/types";

type UseTranscriptSyncReturn = {
  currentIndex: number;
  playerRef: React.MutableRefObject<YT.Player | null>;
  seekTo: (offset: number) => void;
};

// YouTube IFrame API の型（グローバル）
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

// 500ms ごとに再生位置をポーリングし、現在の字幕インデックスを返す
export function useTranscriptSync(
  transcript: TranscriptItem[]
): UseTranscriptSyncReturn {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const playerRef = useRef<YT.Player | null>(null);

  useEffect(() => {
    if (transcript.length === 0) return;

    const timer = setInterval(() => {
      if (!playerRef.current) return;

      try {
        const currentTimeSec = playerRef.current.getCurrentTime();
        const currentTimeMs = currentTimeSec * 1000;

        // 現在時刻に対応する字幕ブロックを探す
        let foundIndex = -1;
        for (let i = 0; i < transcript.length; i++) {
          const item = transcript[i];
          const start = item.offset;
          const end = item.offset + item.duration;
          if (currentTimeMs >= start && currentTimeMs < end) {
            foundIndex = i;
            break;
          }
        }

        setCurrentIndex(foundIndex);
      } catch {
        // プレーヤーが未初期化の場合は無視
      }
    }, 500);

    return () => clearInterval(timer);
  }, [transcript]);

  const seekTo = (offset: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(offset / 1000, true);
  };

  return { currentIndex, playerRef, seekTo };
}
