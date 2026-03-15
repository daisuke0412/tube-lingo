import { useState, useEffect, useRef, useCallback } from "react";
import type { TranscriptItem } from "../../../shared/types";

/**
 * 再生位置と字幕の同期
 * 500msごとにポーリングし、現在再生中の字幕行を算出する
 */
export function useTranscriptSync(
  transcript: TranscriptItem[] | null,
  getCurrentTime: () => number,
  isPlayerReady: boolean
) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const lineRefs = useRef<Map<number, HTMLElement>>(new Map());
  const prevIndexRef = useRef<number>(-1);

  // ref登録用コールバック
  const setLineRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      lineRefs.current.set(index, el);
    } else {
      lineRefs.current.delete(index);
    }
  }, []);

  useEffect(() => {
    if (!transcript || !isPlayerReady) return;

    const interval = setInterval(() => {
      const currentTime = getCurrentTime();

      // 現在再生中の字幕行を特定
      const index = transcript.findIndex(
        (item) =>
          currentTime >= item.start &&
          currentTime < item.start + item.duration
      );

      // 前回と同じなら更新しない（不要な再レンダリング防止）
      if (index === prevIndexRef.current) return;
      prevIndexRef.current = index;

      setActiveIndex(index);

      // 自動スクロール
      if (index !== -1) {
        const el = lineRefs.current.get(index);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [transcript, getCurrentTime, isPlayerReady]);

  return { activeIndex, setLineRef };
}
