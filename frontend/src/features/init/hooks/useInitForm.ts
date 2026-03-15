import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { extractVideoId, isValidYouTubeUrl } from "../../../shared/lib/youtube";

/**
 * S-01 初期画面のフォーム状態管理
 * URL入力・バリデーション・ナビゲーションを担当
 */
export function useInitForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = useCallback(() => {
    // バリデーション
    if (!url.trim() || !isValidYouTubeUrl(url)) {
      setError("有効なYouTube URLを入力してください");
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError("有効なYouTube URLを入力してください");
      return;
    }

    // エラークリア & 遷移
    setError(null);
    navigate(`/learn/${videoId}`);
  }, [url, navigate]);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    // 入力中はエラーをクリア
    setError(null);
  }, []);

  return { url, error, handleUrlChange, handleSubmit };
}
