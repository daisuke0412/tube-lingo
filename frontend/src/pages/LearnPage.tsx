import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LearningScreen from "@/features/learning/components/LearningScreen";
import type { TranscriptItem } from "@/shared/types";

export default function LearnPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const fetchTranscript = async () => {
      try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const res = await fetch(
          `/api/transcript?url=${encodeURIComponent(url)}`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.detail?.error ?? data.error ?? "字幕の取得に失敗しました");
          return;
        }

        setTranscript(data.transcript);
      } catch {
        setError("通信エラーが発生しました。再度お試しください");
      }
    };

    fetchTranscript();
  }, [videoId]);

  if (!videoId) return null;

  return (
    <LearningScreen
      transcript={transcript}
      transcriptError={error}
      videoId={videoId}
      onBack={() => navigate("/")}
    />
  );
}
