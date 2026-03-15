import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import type { ReactNode } from "react";

const theme = createTheme();

interface Props {
  children: ReactNode;
}

/** MUI ThemeProvider + CssBaseline ラッパー */
export default function ThemeRegistry({ children }: Props) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
