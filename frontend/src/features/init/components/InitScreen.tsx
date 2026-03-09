import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useInitForm } from "../hooks/useInitForm";

export default function InitScreen() {
  const {
    youtubeUrl,
    urlError,
    setYoutubeUrl,
    handleSubmit,
  } = useInitForm();

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 4,
        maxWidth: 480,
        mx: "auto",
      }}
    >
      {/* アプリ名 */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
        TubeLingo
      </Typography>

      {/* YouTube URL 入力 */}
      <TextField
        label="YouTube URL"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        error={!!urlError}
        helperText={urlError}
        fullWidth
        placeholder="https://www.youtube.com/watch?v=..."
        sx={{ mb: 3 }}
      />

      {/* 開始ボタン */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit}
        sx={{ mb: 4 }}
      >
        開始する
      </Button>

      <Divider sx={{ width: "100%", mb: 3 }} />

      {/* ご利用にあたって */}
      <Box sx={{ width: "100%" }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          ご利用にあたって
        </Typography>
        <List dense disablePadding>
          {[
            "字幕の取得には数秒程度かかることがあります",
            "AI機能はClaude (Anthropic) を使用しています。APIキーは学習画面で入力できます",
            "利用モデルはClaude Sonnet系の最新版です",
            "APIキーはこのセッション中のみ保持されます。ページを閉じると即座に消去され、サーバーにも送信されません",
          ].map((text, i) => (
            <ListItem key={i} disablePadding sx={{ alignItems: "flex-start" }}>
              <ListItemText
                primary={`• ${text}`}
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
