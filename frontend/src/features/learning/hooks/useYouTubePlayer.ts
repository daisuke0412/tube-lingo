import { useRef, useState, useEffect, useCallback } from "react";

/** YouTube IFrame APIスクリプトの読み込み（グローバルに1回のみ） */
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;

  if (window.YT?.Player) {
    apiLoadPromise = Promise.resolve();
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });

  return apiLoadPromise;
}

/**
 * YouTube IFrame Player の管理
 * プレーヤーの初期化・seekTo・getCurrentTime を提供する
 */
export function useYouTubePlayer(videoId: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let destroyed = false;

    loadYouTubeApi().then(() => {
      if (destroyed || !containerRef.current) return;

      // 既存のプレーヤーがあれば破棄（StrictMode対応）
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const player = new window.YT.Player(containerRef.current, {
        videoId,
        height: "100%",
        width: "100%",
        playerVars: {
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (!destroyed) {
              playerRef.current = player;
              setIsReady(true);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        setIsReady(false);
      }
    };
  }, [videoId]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const getCurrentTime = useCallback((): number => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  return { containerRef, isReady, seekTo, getCurrentTime };
}
