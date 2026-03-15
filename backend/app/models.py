"""共通Pydanticモデル定義"""

from typing import Literal
from pydantic import BaseModel, Field


class TranscriptItem(BaseModel):
    """字幕アイテム"""

    text: str = Field(description="字幕テキスト")
    start: float = Field(description="開始時刻（秒）")
    duration: float = Field(description="表示継続時間（秒）")


class TranscriptResponse(BaseModel):
    """字幕取得APIレスポンス"""

    transcript: list[TranscriptItem] = Field(description="字幕アイテムの配列")


class ChatMessage(BaseModel):
    """チャットメッセージ"""

    role: Literal["user", "assistant"] = Field(description="発言者")
    content: str = Field(description="メッセージ内容")


class ExplainRequest(BaseModel):
    """AI解説APIリクエストボディ"""

    selected_text: str = Field(description="ユーザーが選択した字幕テキスト")
    context_lines: list[TranscriptItem] = Field(description="前後を含む字幕ブロック")
    user_message: str = Field(description="今回のユーザーメッセージ")
    chat_history: list[ChatMessage] = Field(description="過去のチャット履歴（初回は空配列）")
