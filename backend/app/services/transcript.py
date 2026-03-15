"""字幕取得サービス"""

import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)
from fastapi import HTTPException

from app.models import TranscriptItem


def extract_video_id(url: str) -> str:
    """YouTube URLから video_id を抽出する"""
    # youtube.com/watch?v=XXXX 形式
    match = re.search(r"youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})", url)
    if match:
        return match.group(1)

    # youtu.be/XXXX 形式
    match = re.search(r"youtu\.be/([a-zA-Z0-9_-]{11})", url)
    if match:
        return match.group(1)

    raise HTTPException(status_code=400, detail="INVALID_URL")


async def fetch_transcript(video_id: str) -> list[TranscriptItem]:
    """youtube-transcript-api で字幕を取得して TranscriptItem[] に整形する"""
    try:
        ytt_api = YouTubeTranscriptApi()
        # 英語優先、自動生成字幕にもフォールバック
        transcript = ytt_api.fetch(video_id, languages=["en", "en-US", "en-GB"])
        return [
            TranscriptItem(text=item.text, start=item.start, duration=item.duration)
            for item in transcript
        ]
    except (NoTranscriptFound, TranscriptsDisabled):
        raise HTTPException(status_code=404, detail="NO_TRANSCRIPT")
    except VideoUnavailable:
        raise HTTPException(status_code=502, detail="YOUTUBE_ERROR")
    except Exception:
        raise HTTPException(status_code=502, detail="YOUTUBE_ERROR")
