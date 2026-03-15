import { useState, useEffect, useCallback, useRef } from "react";
import type { TranscriptItem } from "../../../shared/types";

interface SelectionState {
  /** 選択されたテキスト */
  selectedText: string | null;
  /** 選択テキストが含まれる字幕行のインデックス */
  selectedLineIndex: number | null;
  /** ボタン表示座標（字幕エリア内の相対座標） */
  anchorPosition: { top: number; left: number } | null;
  /** AI質問用のコンテキスト行（前後数行） */
  contextLines: TranscriptItem[];
}

/**
 * テキスト選択検知 hook
 * 字幕テキストのドラッグ選択を検知し、選択テキスト・表示座標を返す
 */
export function useTextSelection(transcript: TranscriptItem[] | null) {
  const [state, setState] = useState<SelectionState>({
    selectedText: null,
    selectedLineIndex: null,
    anchorPosition: null,
    contextLines: [],
  });
  const containerRef = useRef<HTMLElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || !selection || !containerRef.current || !transcript) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // data-line-index 属性から字幕行インデックスを取得
    const lineElement = (range.startContainer.parentElement)?.closest(
      "[data-line-index]"
    );
    const lineIndex = lineElement
      ? parseInt(lineElement.getAttribute("data-line-index") ?? "-1", 10)
      : -1;

    if (lineIndex === -1) return;

    // コンテキスト行（前後2行）を算出
    const start = Math.max(0, lineIndex - 2);
    const end = Math.min(transcript.length, lineIndex + 3);
    const contextLines = transcript.slice(start, end);

    setState({
      selectedText: text,
      selectedLineIndex: lineIndex,
      anchorPosition: {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
      },
      contextLines,
    });
  }, [transcript]);

  const clearSelection = useCallback(() => {
    setState({
      selectedText: null,
      selectedLineIndex: null,
      anchorPosition: null,
      contextLines: [],
    });
    window.getSelection()?.removeAllRanges();
  }, []);

  // 字幕エリア外クリックで選択解除
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        state.selectedText &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        clearSelection();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [state.selectedText, clearSelection]);

  return {
    ...state,
    containerRef,
    handleMouseUp,
    clearSelection,
  };
}
