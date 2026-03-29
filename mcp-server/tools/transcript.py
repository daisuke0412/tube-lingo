"""YouTube字幕取得ツール"""

import re

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)


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

    raise ValueError("INVALID_URL: YouTube URLの形式が不正です")


def format_timestamp(seconds: float) -> str:
    """秒数を M:SS 形式に変換する"""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes}:{secs:02d}"


def fetch_transcript(url: str) -> str:
    """YouTube URLから英語字幕を取得し、テキスト形式で返す"""
    video_id = extract_video_id(url)

    try:
        ytt_api = YouTubeTranscriptApi()
        # 英語優先、自動生成字幕にもフォールバック
        transcript = ytt_api.fetch(video_id, languages=["en", "en-US", "en-GB"])
    except (NoTranscriptFound, TranscriptsDisabled):
        raise ValueError("NO_TRANSCRIPT: この動画に英語字幕が見つかりません")
    except VideoUnavailable:
        raise ValueError("YOUTUBE_ERROR: YouTubeからの字幕取得に失敗しました")
    except Exception:
        raise ValueError("YOUTUBE_ERROR: YouTubeからの字幕取得に失敗しました")

    # ヘッダー情報
    lines = [
        f"YouTube字幕: {url}",
        f"字幕数: {len(transcript)}件",
        "言語: en",
        "",
    ]

    # 字幕テキストを [M:SS] 形式で整形
    for item in transcript:
        timestamp = format_timestamp(item.start)
        lines.append(f"[{timestamp}] {item.text}")

    return "\n".join(lines)
