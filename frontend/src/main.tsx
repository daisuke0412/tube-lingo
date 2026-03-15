import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Box } from "@mui/material";
import App from "./App";
import ThemeRegistry from "./providers/ThemeRegistry";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeRegistry>
      <Box sx={{ bgcolor: "grey.200", minHeight: "100vh" }}>
        <Box sx={{ maxWidth: 480, mx: "auto", height: "100vh", bgcolor: "white" }}>
          <App />
        </Box>
      </Box>
    </ThemeRegistry>
  </StrictMode>
);
