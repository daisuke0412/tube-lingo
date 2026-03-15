import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import LearnPage from "./pages/LearnPage";
import AiChatPage from "./pages/AiChatPage";

/** ルート定義 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn/:videoId" element={<LearnPage />} />
        <Route path="/mock/ai-chat" element={<AiChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
