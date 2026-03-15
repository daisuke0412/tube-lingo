import { memo } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import type { TranscriptItem } from "../../../shared/types";

interface TranscriptListProps {
  transcript: TranscriptItem[];
  activeIndex: number;
  chatLineIndices: Set<number>;
  onSeek: (seconds: number) => void;
  onChatIconClick: (index: number) => void;
  setLineRef: (index: number, el: HTMLElement | null) => void;
}

/** 字幕リスト表示コンポーネント（メモ化） */
const TranscriptList = memo(function TranscriptList({
  transcript,
  activeIndex,
  chatLineIndices,
  onSeek,
  onChatIconClick,
  setLineRef,
}: TranscriptListProps) {
  return (
    <Box sx={{ p: 1 }}>
      {transcript.map((item, index) => (
        <Box
          key={`${item.start}-${index}`}
          ref={(el: HTMLElement | null) => setLineRef(index, el)}
          data-line-index={index}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.5,
            px: 1,
            borderRadius: 1,
            bgcolor:
              index === activeIndex
                ? "rgba(33, 150, 243, 0.08)"
                : "transparent",
          }}
        >
          <IconButton
            size="small"
            sx={{ mt: -0.5 }}
            onClick={() => onSeek(item.start)}
          >
            <PlayArrowIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body1"
            sx={{ flex: 1, lineHeight: 1.8, userSelect: "text" }}
          >
            {item.text}
          </Typography>
          {chatLineIndices.has(index) && (
            <IconButton
              size="small"
              sx={{ mt: -0.5 }}
              onClick={() => onChatIconClick(index)}
            >
              <ChatIcon fontSize="small" color="primary" />
            </IconButton>
          )}
        </Box>
      ))}
    </Box>
  );
});

export default TranscriptList;
