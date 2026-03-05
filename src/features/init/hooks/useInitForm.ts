"use client";

import { useState, useEffect } from "react";
import type { TranscriptItem } from "@/shared/types";

const LAST_URL_KEY = "tubelingo_last_url";

type UseInitFormReturn = {
  apiKey: string;
  youtubeUrl: string;
  apiKeyError: string;
  urlError: string;
  submitError: string;
  isLoading: boolean;
  setApiKey: (value: string) => void;
  setYoutubeUrl: (value: string) => void;
  handleSubmit: () => Promise<void>;
};

type OnStartParams = {
  apiKey: string;
  transcript: TranscriptItem[];
  videoId: string;
};

// YouTube URLから動画IDを抽出する（クライアント側バリデーション用）
function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}

export function useInitForm(onStart: (params: OnStartParams) => void): UseInitFormReturn {
  const [apiKey, setApiKey] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 初期表示時に前回のURLを復元（APIキーは復元しない）
  useEffect(() => {
    const lastUrl = localStorage.getItem(LAST_URL_KEY);
    if (lastUrl) {
      setYoutubeUrl(lastUrl);
    }
  }, []);

  const validate = (): boolean => {
    let valid = true;

    // APIキーのバリデーション（任意だが、入力済みなら形式チェック）
    if (apiKey && !apiKey.startsWith("sk-ant-")) {
      setApiKeyError("APIキーは sk-ant- から始まる形式で入力してください");
      valid = false;
    } else {
      setApiKeyError("");
    }

    // YouTube URL のバリデーション
    if (!youtubeUrl) {
      setUrlError("YouTube URLを入力してください");
      valid = false;
    } else if (!extractVideoId(youtubeUrl)) {
      setUrlError("正しいYouTube URLを入力してください");
      valid = false;
    } else {
      setUrlError("");
    }

    return valid;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!validate()) return;

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/transcript?url=${encodeURIComponent(youtubeUrl)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "エラーが発生しました");
        return;
      }

      // 次回のために URL を保存
      localStorage.setItem(LAST_URL_KEY, youtubeUrl);

      onStart({
        apiKey,
        transcript: data.transcript,
        videoId,
      });
    } catch {
      setSubmitError("通信エラーが発生しました。再度お試しください");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    apiKey,
    youtubeUrl,
    apiKeyError,
    urlError,
    submitError,
    isLoading,
    setApiKey,
    setYoutubeUrl,
    handleSubmit,
  };
}
