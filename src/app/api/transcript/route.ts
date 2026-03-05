import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import type { TranscriptResponse, TranscriptErrorResponse } from "@/shared/types";

// YouTube URLから動画IDを抽出する
function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    const body: TranscriptErrorResponse = {
      error: "正しいYouTube URLを入力してください",
      code: "E-02",
    };
    return NextResponse.json(body, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    const body: TranscriptErrorResponse = {
      error: "正しいYouTube URLを入力してください",
      code: "E-02",
    };
    return NextResponse.json(body, { status: 400 });
  }

  try {
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });

    const transcript = rawTranscript.map((item) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration,
    }));

    const body: TranscriptResponse = { transcript };
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // 字幕が存在しない場合
    if (
      message.includes("Could not get transcripts") ||
      message.includes("Transcript is disabled")
    ) {
      const body: TranscriptErrorResponse = {
        error: "この動画には字幕がありません",
        code: "E-01",
      };
      return NextResponse.json(body, { status: 404 });
    }

    // その他のネットワークエラー等
    const body: TranscriptErrorResponse = {
      error: "通信エラーが発生しました。再度お試しください",
      code: "E-04",
    };
    return NextResponse.json(body, { status: 500 });
  }
}
