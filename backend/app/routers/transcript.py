"""GET /api/transcript — YouTube 字幕取得"""

import re

from fastapi import APIRouter, HTTPException, Query
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)

router = APIRouter()


def _extract_video_id(url: str) -> str | None:
    """YouTube URL から動画ID を抽出する"""
    patterns = [
        r"(?:youtube\.com/watch\?.*v=)([\w-]{11})",
        r"(?:youtu\.be/)([\w-]{11})",
    ]
    for pattern in patterns:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None


@router.get("/transcript")
def get_transcript(url: str = Query(..., description="YouTube URL")):
    """YouTube 動画の英語字幕を取得する"""

    video_id = _extract_video_id(url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail={"error": "正しいYouTube URLを入力してください", "code": "E-02"},
        )

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id, languages=["en"])
        snippets = transcript.snippets

        if not snippets:
            raise HTTPException(
                status_code=404,
                detail={"error": "この動画には字幕がありません", "code": "E-01"},
            )

        items = [
            {
                "text": s.text,
                "offset": int(s.start * 1000),       # 秒 → ミリ秒
                "duration": int(s.duration * 1000),   # 秒 → ミリ秒
            }
            for s in snippets
        ]

        return {"transcript": items}

    except (NoTranscriptFound, TranscriptsDisabled):
        raise HTTPException(
            status_code=404,
            detail={"error": "この動画には字幕がありません", "code": "E-01"},
        )
    except VideoUnavailable:
        raise HTTPException(
            status_code=404,
            detail={"error": "動画が見つかりません", "code": "E-01"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "通信エラーが発生しました。再度お試しください",
                "code": "E-04",
            },
        ) from e
