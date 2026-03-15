import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:5173",
      cwd: ".",
      reuseExistingServer: true,
    },
    {
      command: "uvicorn app.main:app --port 8000",
      url: "http://localhost:8000/docs",
      cwd: "../backend",
      reuseExistingServer: true,
    },
  ],
});
