import { useState, useEffect } from "react";
import type { TranscriptItem } from "../../../shared/types";

/**
 * 字幕取得 hook
 * GET /api/transcript を呼び出し、字幕データを取得する
 */
export function useTranscript(videoId: string) {
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTranscript() {
      setLoading(true);
      setError(null);
      setTranscript(null);

      try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(
          `/api/transcript?url=${encodeURIComponent(url)}`
        );

        if (cancelled) return;

        if (response.status === 404) {
          setError("この動画には字幕がありません");
          return;
        }

        if (!response.ok) {
          setError(
            "字幕の取得に失敗しました。しばらく経ってから再試行してください"
          );
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setTranscript(data.transcript);
        }
      } catch {
        if (!cancelled) {
          setError(
            "字幕の取得に失敗しました。しばらく経ってから再試行してください"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTranscript();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return { transcript, loading, error };
}
