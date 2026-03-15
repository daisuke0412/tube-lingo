import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ThemeRegistry from "./providers/ThemeRegistry";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeRegistry>
      <App />
    </ThemeRegistry>
  </StrictMode>
);
