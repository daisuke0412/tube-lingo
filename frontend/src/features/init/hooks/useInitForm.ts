import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractVideoId } from "@/shared/lib/youtube";

type UseInitFormReturn = {
  youtubeUrl: string;
  urlError: string;
  setYoutubeUrl: (value: string) => void;
  handleSubmit: () => void;
};

export function useInitForm(): UseInitFormReturn {
  const navigate = useNavigate();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleSubmit = () => {
    // YouTube URL のバリデーション
    if (!youtubeUrl) {
      setUrlError("YouTube URLを入力してください");
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setUrlError("正しいYouTube URLを入力してください");
      return;
    }

    setUrlError("");

    // 学習画面へ遷移
    navigate(`/learn/${videoId}`);
  };

  return {
    youtubeUrl,
    urlError,
    setYoutubeUrl,
    handleSubmit,
  };
}
