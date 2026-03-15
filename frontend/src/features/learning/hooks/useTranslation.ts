import { useState, useCallback } from "react";

const TRANSLATION_ERROR =
  "翻訳に失敗しました。しばらく経ってから再試行してください";

interface TranslationState {
  /** 翻訳対象のテキスト */
  word: string | null;
  /** 翻訳結果 */
  result: string | null;
  /** ローディング中か */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

const INITIAL_STATE: TranslationState = {
  word: null,
  result: null,
  loading: false,
  error: null,
};

/**
 * 翻訳 hook
 * MyMemory API を使って英語→日本語翻訳を行う
 */
export function useTranslation() {
  const [state, setState] = useState<TranslationState>(INITIAL_STATE);

  const translate = useCallback(async (text: string) => {
    setState({ word: text, result: null, loading: true, error: null });

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`
      );

      if (!response.ok) {
        setState((prev) => ({ ...prev, loading: false, error: TRANSLATION_ERROR }));
        return;
      }

      const data = await response.json();

      if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
        setState((prev) => ({ ...prev, loading: false, error: TRANSLATION_ERROR }));
        return;
      }

      setState((prev) => ({
        ...prev,
        result: data.responseData.translatedText,
        loading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: TRANSLATION_ERROR }));
    }
  }, []);

  const closeTranslation = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { translation: state, translate, closeTranslation };
}
