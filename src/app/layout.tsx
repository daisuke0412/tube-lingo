import type { Metadata } from "next";
import ThemeRegistry from "@/providers/ThemeRegistry";

export const metadata: Metadata = {
  title: "TubeLingo",
  description: "YouTubeの英語動画で英語学習",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
