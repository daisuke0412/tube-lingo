/** YouTube IFrame API の型宣言 */
interface Window {
  YT: {
    Player: new (
      element: HTMLElement,
      config: {
        videoId: string;
        height?: string;
        width?: string;
        playerVars?: Record<string, unknown>;
        events?: {
          onReady?: () => void;
          onStateChange?: (event: { data: number }) => void;
        };
      }
    ) => YTPlayer;
    PlayerState: {
      PLAYING: number;
      PAUSED: number;
      ENDED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
}

interface YTPlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  destroy(): void;
}
