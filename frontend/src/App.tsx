import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LearnPage from "@/pages/LearnPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/learn/:videoId" element={<LearnPage />} />
    </Routes>
  );
}
