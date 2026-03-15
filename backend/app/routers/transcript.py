"""字幕取得 router（A-01）"""

from fastapi import APIRouter, Query

from app.models import TranscriptResponse
from app.services.transcript import extract_video_id, fetch_transcript

router = APIRouter()


@router.get("/api/transcript", response_model=TranscriptResponse)
async def get_transcript(url: str = Query(..., description="YouTube動画のURL")) -> TranscriptResponse:
    """YouTube動画の英語字幕を取得する"""
    video_id = extract_video_id(url)
    transcript = await fetch_transcript(video_id)
    return TranscriptResponse(transcript=transcript)
