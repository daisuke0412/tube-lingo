import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ExplainRequest } from "@/shared/types";

// 使用モデル（docs/guides/guides.md に従い変更禁止）
const MODEL = "claude-sonnet-4-5";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return new Response(
      JSON.stringify({
        error:
          "APIキーが設定されていないか無効です。正しいキーを入力してください",
        code: "E-03",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: ExplainRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "通信エラーが発生しました。再度お試しください",
        code: "E-04",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { selectedText, contextTranscripts, chatHistory } = body;

  // 前後の字幕テキストをコンテキストとして整形
  const contextText = contextTranscripts
    .map((item) => item.text)
    .join(" ");

  // システムプロンプト
  const systemPrompt = `あなたは英語学習を支援するAIアシスタントです。
ユーザーはYouTube動画の字幕を見ながら英語を学習しています。
選択されたテキストと前後の字幕コンテキストを踏まえて、日本語で分かりやすく解説してください。

コンテキスト（前後の字幕）:
${contextText}`;

  // チャット履歴をAnthropicのメッセージ形式に変換
  const messages: Anthropic.MessageParam[] = [
    ...chatHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
  ];

  // 初回質問の場合はユーザーメッセージを追加
  if (chatHistory.length === 0) {
    messages.push({
      role: "user",
      content: `「${selectedText}」について解説してください。`,
    });
  }

  // SSEストリーミングレスポンスを返す
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // リクエスト処理後にキーを廃棄（スコープ内変数のみ使用）
      const client = new Anthropic({ apiKey });

      try {
        const anthropicStream = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorData = JSON.stringify({
          error: `AI機能でエラーが発生しました：${message}`,
          code: "E-05",
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
