"""POST /api/explain — AI 解説（SSE ストリーミング）"""

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import json

# 使用モデル（docs/guides/guides.md に従い変更禁止）
MODEL = "claude-sonnet-4-5"

router = APIRouter()


class ChatMessageModel(BaseModel):
    role: str
    content: str


class TranscriptItemModel(BaseModel):
    text: str
    offset: int
    duration: int


class ExplainRequest(BaseModel):
    selectedText: str
    chatMessage: str
    contextTranscripts: list[TranscriptItemModel]
    chatHistory: list[ChatMessageModel]


@router.post("/explain")
async def explain(body: ExplainRequest, request: Request):
    """選択テキストについて AI が解説する（SSE ストリーミング）"""

    api_key = request.headers.get("x-api-key", "")

    if not api_key or not api_key.startswith("sk-ant-"):
        return StreamingResponse(
            iter(
                [
                    f'data: {json.dumps({"error": "APIキーが設定されていないか無効です。正しいキーを入力してください", "code": "E-03"})}\n\n'
                ]
            ),
            status_code=401,
            media_type="text/event-stream",
        )

    # 前後の字幕テキストをコンテキストとして整形
    context_text = " ".join(item.text for item in body.contextTranscripts)

    is_initial = not any(msg.role == "assistant" for msg in body.chatHistory)

    if is_initial:
        # ── 初回質問: 3セクション構成で詳しく解説 ──
        system_prompt = f"""あなたは英語学習を支援するAIアシスタントです。
ユーザーはYouTube動画の字幕を見ながら英語を学習しています。
選択されたテキストと前後の字幕コンテキストを踏まえて、日本語で分かりやすく解説してください。

以下の3セクションで回答してください。各セクションは最大3文です。#は4つにすること

#### 翻訳
選択されたテキストの日本語訳を示してください。

#### 文脈の解説
前後の字幕から会話の流れを要約し、この文脈の中でなぜ・どのようにこの表現が使われているかを解説してください。

#### 表現の補足
英語特有のことわざ・慣用句・スラングなど、日本語にない独特な表現が含まれる場合のみ、このセクションを出力してください。どういう場面で使われ、話者がどんな意図で発言しているかを解説してください。該当しない場合はこのセクションを省略してください。

コンテキスト（前後の字幕）:
{context_text}"""

        messages: list[dict] = [
            {
                "role": "user",
                "content": f"「{body.selectedText}」について解説してください。",
            }
        ]

    else:
        # ── 追加質問: 履歴を踏まえて簡潔に回答 ──
        system_prompt = f"""あなたは英語学習を支援するAIアシスタントです。
ユーザーはYouTube動画の字幕を見ながら英語を学習しています。
これまでのチャット履歴を踏まえ、ユーザーのチャットメッセージに回答してください。

回答ルール:
- 見出し（#など）は使わず、シンプルな文章で回答する
- 最大3文まで

選択テキスト: 「{body.selectedText}」"""

        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in body.chatHistory
        ]
        # 新しいユーザーメッセージを追加
        if body.chatMessage:
            messages.append({"role": "user", "content": body.chatMessage})

    async def event_generator():
        client = anthropic.Anthropic(api_key=api_key)
        try:
            with client.messages.stream(
                model=MODEL,
                max_tokens=1024,
                system=system_prompt,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    data = json.dumps({"text": text})
                    yield f"data: {data}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            message = str(e)
            error_data = json.dumps(
                {
                    "error": f"AI機能でエラーが発生しました：{message}",
                    "code": "E-05",
                }
            )
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
