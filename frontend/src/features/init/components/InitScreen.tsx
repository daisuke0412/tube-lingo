import {
  Box,
  Button,
  Container,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import {
  Movie as MovieIcon,
  CheckCircleOutline as CheckIcon,
  WarningAmber as WarningIcon,
} from "@mui/icons-material";
import { useInitForm } from "../hooks/useInitForm";

/** S-01 初期画面 */
export default function InitScreen() {
  const { url, error, handleUrlChange, handleSubmit } = useInitForm();

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      {/* タイトル */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <MovieIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        <Typography variant="h4" fontWeight="bold">
          TubeLingo
        </Typography>
      </Box>

      {/* URL入力 */}
      <TextField
        fullWidth
        label="YouTube URL"
        placeholder="https://youtube.com/watch?v=..."
        value={url}
        onChange={(e) => handleUrlChange(e.target.value)}
        error={!!error}
        helperText={error}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        sx={{ mb: 2 }}
      />

      {/* 開始ボタン */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleSubmit}
        sx={{ mb: 4 }}
      >
        開始する
      </Button>

      <Divider sx={{ mb: 3 }} />

      {/* できること */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <CheckIcon sx={{ color: "success.main" }} />
          <Typography variant="subtitle1" fontWeight="bold">
            できること
          </Typography>
        </Box>
        <Box component="ul" sx={{ pl: 3, m: 0 }}>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            英語字幕を見ながらYouTube動画を視聴できます
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            字幕テキストを選択すると日本語訳を表示できます
          </Typography>
          <Typography component="li" variant="body2">
            字幕テキストを選択してAIに意味・用法を質問できます
          </Typography>
        </Box>
      </Box>

      {/* 注意事項 */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <WarningIcon sx={{ color: "warning.main" }} />
          <Typography variant="subtitle1" fontWeight="bold">
            注意事項
          </Typography>
        </Box>
        <Box component="ul" sx={{ pl: 3, m: 0 }}>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            AI質問機能はClaude (Anthropic) を使用します。モデルはSonnet系です
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            APIキーはご自身で取得・ご用意ください
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            トークン消費はAI質問のみです。翻訳機能はトークン不要です
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            トークンの消費目安は$5 ≒ 約500〜1000回です（Sonnet / 2026-03-15 時点）
          </Typography>
          <Typography component="li" variant="body2">
            APIキーはメモリ上にのみ保持し、サーバー・ブラウザのストレージには一切保存されません
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
