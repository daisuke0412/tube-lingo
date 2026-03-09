"""
YouTube 字幕取得 PoC — Python 版
テスト動画: AJpK3YTTKZ4（Node.js PoC と同じ）
"""

import json
import socket
import sys
import time
import traceback

VIDEO_ID = "AJpK3YTTKZ4"

# グローバルソケットタイムアウト（秒）
socket.setdefaulttimeout(30)


def parse_json3_events(sub_data: dict) -> list[str]:
    """json3形式の字幕データからテキスト行を抽出"""
    events = [e for e in sub_data.get("events", []) if "segs" in e]
    texts = []
    for event in events:
        line = "".join(seg.get("utf8", "") for seg in event.get("segs", []))
        stripped = line.strip()
        if stripped:
            texts.append(stripped)
    return texts


# ============================================================
# 方法1: youtube-transcript-api
# ============================================================
def test_youtube_transcript_api(video_id: str) -> dict:
    """youtube-transcript-api ライブラリで字幕を取得"""
    print("\n" + "=" * 60)
    print("方法1: youtube-transcript-api")
    print("=" * 60)

    result = {"method": "youtube-transcript-api", "success": False, "error": None, "data": None}

    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id, languages=["en"])

        snippets = transcript.snippets
        if snippets and len(snippets) > 0:
            result["success"] = True
            result["data"] = {
                "count": len(snippets),
                "first_3": [
                    {"text": s.text, "start": s.start, "duration": s.duration}
                    for s in snippets[:3]
                ],
                "total_bytes": sum(len(s.text.encode("utf-8")) for s in snippets),
            }
            print(f"  ◎ 成功: {len(snippets)} セグメント取得")
            print(f"  先頭3件: {result['data']['first_3']}")
        else:
            result["error"] = "空のレスポンス（0セグメント）"
            print(f"  ✕ 失敗: {result['error']}")

    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"
        print(f"  ✕ 失敗: {result['error']}")
        traceback.print_exc()

    return result


# ============================================================
# 方法2: yt-dlp（extract_info → URL fetch）
# ============================================================
def test_yt_dlp(video_id: str) -> dict:
    """yt-dlp で字幕メタデータを取得し、URLから直接字幕をfetch"""
    print("\n" + "=" * 60)
    print("方法2: yt-dlp (extract_info → URL fetch)")
    print("=" * 60)

    result = {"method": "yt-dlp", "success": False, "error": None, "data": None}

    try:
        import yt_dlp
        import requests

        ydl_opts = {
            "skip_download": True,
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 20,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://www.youtube.com/watch?v={video_id}", download=False
            )

        # 字幕トラック一覧を表示
        subtitles = info.get("subtitles", {})
        auto_captions = info.get("automatic_captions", {})
        print(f"  手動字幕: {list(subtitles.keys()) if subtitles else 'なし'}")
        print(f"  自動字幕: {list(auto_captions.keys())[:10] if auto_captions else 'なし'}...")

        # 手動字幕 → 自動字幕の順で英語を探す
        en_sub = subtitles.get("en") or auto_captions.get("en")

        if not en_sub:
            result["error"] = "英語字幕トラックなし"
            print(f"  ✕ 失敗: {result['error']}")
            return result

        # json3 形式の URL を探す
        json3_url = None
        available_fmts = []
        for fmt in en_sub:
            available_fmts.append(fmt.get("ext"))
            if fmt.get("ext") == "json3":
                json3_url = fmt.get("url")
                break

        if not json3_url:
            result["error"] = f"json3 形式の URL が見つからない (利用可能: {available_fmts})"
            print(f"  ✕ 失敗: {result['error']}")
            return result

        print(f"  json3 URL 取得成功 (URLの先頭50文字: {json3_url[:50]}...)")

        # URL から直接 fetch
        resp = requests.get(json3_url, timeout=15)
        if resp.status_code == 200 and len(resp.content) > 0:
            sub_data = resp.json()
            texts = parse_json3_events(sub_data)

            result["success"] = True
            result["data"] = {
                "count": len(texts),
                "first_3": texts[:3],
                "total_chars": sum(len(t) for t in texts),
                "response_bytes": len(resp.content),
            }
            print(f"  ◎ 成功: {len(texts)} 行取得 ({len(resp.content)} bytes)")
            print(f"  先頭3行: {texts[:3]}")
        else:
            result["error"] = f"HTTP {resp.status_code}, body={len(resp.content)} bytes"
            print(f"  ✕ 失敗: {result['error']}")

    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"
        print(f"  ✕ 失敗: {result['error']}")
        traceback.print_exc()

    return result


# ============================================================
# 方法3: yt-dlp (コマンドライン相当 — writesubtitles)
# ============================================================
def test_yt_dlp_writesub(video_id: str) -> dict:
    """yt-dlp の writesubtitles 機能で字幕ファイルを書き出す"""
    print("\n" + "=" * 60)
    print("方法3: yt-dlp (writesubtitles)")
    print("=" * 60)

    result = {"method": "yt-dlp-writesub", "success": False, "error": None, "data": None}

    try:
        import yt_dlp
        import tempfile
        import os

        with tempfile.TemporaryDirectory() as tmpdir:
            ydl_opts = {
                "skip_download": True,
                "writesubtitles": True,
                "writeautomaticsub": True,
                "subtitleslangs": ["en"],
                "subtitlesformat": "json3",
                "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
                "quiet": True,
                "no_warnings": True,
                "socket_timeout": 20,
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

            files = os.listdir(tmpdir)
            print(f"  生成ファイル: {files}")

            sub_file = None
            for f in files:
                if ".en." in f and f.endswith(".json3"):
                    sub_file = os.path.join(tmpdir, f)
                    break

            if sub_file:
                with open(sub_file, "r", encoding="utf-8") as fh:
                    sub_data = json.load(fh)

                texts = parse_json3_events(sub_data)

                result["success"] = True
                result["data"] = {
                    "count": len(texts),
                    "first_3": texts[:3],
                    "total_chars": sum(len(t) for t in texts),
                    "file_size": os.path.getsize(sub_file),
                }
                print(f"  ◎ 成功: {len(texts)} 行取得 ({result['data']['file_size']} bytes)")
                print(f"  先頭3行: {texts[:3]}")
            else:
                result["error"] = f"字幕ファイルが生成されなかった (files: {files})"
                print(f"  ✕ 失敗: {result['error']}")

    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"
        print(f"  ✕ 失敗: {result['error']}")
        traceback.print_exc()

    return result


# ============================================================
# メイン
# ============================================================
def main():
    video_id = VIDEO_ID
    if len(sys.argv) > 1:
        video_id = sys.argv[1]

    print(f"テスト動画ID: {video_id}")
    print(f"Python: {sys.version}")

    results = []

    # --- 方法1: youtube-transcript-api ---
    t0 = time.time()
    r1 = test_youtube_transcript_api(video_id)
    r1["elapsed"] = round(time.time() - t0, 2)
    results.append(r1)

    # --- 方法2: yt-dlp (extract_info → URL fetch) ---
    t0 = time.time()
    r2 = test_yt_dlp(video_id)
    r2["elapsed"] = round(time.time() - t0, 2)
    results.append(r2)

    # --- 方法3: yt-dlp (writesubtitles) ---
    t0 = time.time()
    r3 = test_yt_dlp_writesub(video_id)
    r3["elapsed"] = round(time.time() - t0, 2)
    results.append(r3)

    # サマリ
    print("\n" + "=" * 60)
    print("結果サマリ")
    print("=" * 60)
    for r in results:
        status = "◎ 成功" if r["success"] else "✕ 失敗"
        print(f"  {r['method']}: {status} ({r['elapsed']}s)")
        if r["error"]:
            print(f"    原因: {r['error']}")

    # JSON出力
    with open("results_python.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n結果を results_python.json に保存しました")


if __name__ == "__main__":
    main()
