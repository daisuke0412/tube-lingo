"""YouTube字幕取得ツール"""

import re

from youtube_transcript_api import YouTubeTranscriptApi


def fetch_transcript(url: str) -> str:
    """YouTube URLから英語字幕を取得し、テキスト形式で返す"""
    # URLから11文字のvideo_idを抽出（youtube.com/watch?v=XXX と youtu.be/XXX の両形式に対応）
    match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", url)
    if not match:
        raise ValueError("INVALID_URL: YouTube URLの形式が不正です")

    # 英語字幕を取得（en-US, en-GB にもフォールバック）
    try:
        transcript = YouTubeTranscriptApi().fetch(match.group(1), languages=["en", "en-US", "en-GB"])
    except Exception:
        raise ValueError("YOUTUBE_ERROR: 字幕の取得に失敗しました")

    # 各字幕セグメントのテキストをスペースで結合して返す
    return " ".join(item.text for item in transcript)
