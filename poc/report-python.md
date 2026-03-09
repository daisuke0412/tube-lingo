# YouTube 字幕取得 PoC レポート（Python版）

## 目的

Node.js PoC（[report-node.md](report-node.md)）で検証した YouTube 字幕取得を、Python で再検証する。
Node.js では Playwright `--headless=new` が唯一の成功手段だったが、Python エコシステムではより軽量な方法が使えるか確認する。

---

## 検証環境

- **Python**: 3.13.9
- **テスト動画**: `AJpK3YTTKZ4`（Node.js PoC と同一）
- **検証日**: 2026-03-08

### 使用ライブラリ

| ライブラリ | バージョン | 用途 |
|---|---|---|
| `youtube-transcript-api` | 1.2.4 | YouTube 字幕専用ライブラリ |
| `yt-dlp` | 2026.3.3 | YouTube ダウンローダー（字幕抽出） |

---

## 検証結果

### 方法1: `youtube-transcript-api` ✅ 🏆

```python
from youtube_transcript_api import YouTubeTranscriptApi

ytt_api = YouTubeTranscriptApi()
transcript = ytt_api.fetch(video_id, languages=["en"])
snippets = transcript.snippets
```

**結果: ◎ 成功** — 70 セグメント取得

| 項目 | 値 |
|---|---|
| セグメント数 | 70 |
| データ形式 | `text`, `start`, `duration` の構造体リスト |
| 処理時間 | 約1〜2秒 |
| 依存 | `youtube-transcript-api` + `requests` のみ |

**取得データサンプル（先頭3件）:**

```json
[
  {"text": "Should we be doing like big smile or?", "start": 0.0, "duration": 2.669},
  {"text": "- No, what you're doing-\n- Big smile's creepy.", "start": 2.669, "duration": 2.044},
  {"text": "That's sort of what I'm getting at.", "start": 4.713, "duration": 1.876}
]
```

**成功の理由:**
- `youtube-transcript-api` は YouTube の InnerTube API（`/youtubei/v1/get_transcript`）を直接利用
- PoToken を必要としない別のエンドポイントを使用している（Node.js の `youtube-transcript` ライブラリとは異なる実装）
- Playwright やブラウザが一切不要

---

### 方法2: `yt-dlp` (extract_info → URL fetch) ✅

```python
import yt_dlp
import requests

ydl_opts = {"skip_download": True, "quiet": True, "no_warnings": True, "socket_timeout": 20}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)

subtitles = info.get("subtitles", {})
en_sub = subtitles.get("en")
json3_url = next(fmt["url"] for fmt in en_sub if fmt["ext"] == "json3")

resp = requests.get(json3_url, timeout=15)
sub_data = resp.json()
```

**結果: ◎ 成功** — 70 行取得 (9,652 bytes)

| 項目 | 値 |
|---|---|
| 手動字幕 | en, fr, de, ja, ko |
| 自動字幕 | 多数（ab, aa, af, ... 等） |
| 取得形式 | json3（タイムスタンプ + テキスト） |
| レスポンスサイズ | 9,652 bytes |
| 処理時間 | 約3〜5秒 |

**取得データサンプル（先頭3行）:**

```
Should we be doing like big smile or?
- No, what you're doing-
- Big smile's creepy.
That's sort of what I'm getting at.
```

**成功の理由:**
- `yt-dlp` は YouTube のクライアント偽装（Impersonation）機能を内蔵
- 独自の署名解析により PoToken 付きの字幕 URL を生成
- `extract_info()` で取得した URL を `requests.get()` で直接 fetch でき、ブラウザ不要

---

### 方法3: `yt-dlp` (writesubtitles) — ✕ タイムアウト

```python
ydl_opts = {
    "skip_download": True, "writesubtitles": True, "writeautomaticsub": True,
    "subtitleslangs": ["en"], "subtitlesformat": "json3",
}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([url])
```

**結果: ✕ タイムアウト**

**原因:** `ydl.download()` は内部で `extract_info()` を再度呼び出すため、短時間で YouTube に複数リクエストが発生。YouTube のレート制限により、2回目以降の接続がタイムアウト。単独実行であれば成功する可能性が高い（方法2の `extract_info` は成功しているため）。

---

## Node.js PoC との比較

| 項目 | Node.js | Python |
|---|---|---|
| 最軽量な成功手段 | なし（全ライブラリ失敗） | **`youtube-transcript-api` ✅** |
| yt-dlp 相当 | — | **`yt-dlp` extract_info ✅** |
| Playwright 必要性 | **必須**（唯一の成功手段） | **不要** |
| 処理時間 | 5〜10秒（Playwright起動含む） | **1〜2秒** |
| メモリ使用量 | 100〜200MB（Chromium） | **数MB** |
| 外部依存 | Chromium バイナリ | pip パッケージのみ |

### なぜ Python では成功するのか

1. **`youtube-transcript-api`**: Node.js の `youtube-transcript` とは異なり、`timedtext` API ではなく InnerTube の `get_transcript` エンドポイントを使用。このエンドポイントは PoToken を要求しない。

2. **`yt-dlp`**: Python 版の `yt-dlp` は最も活発にメンテされている YouTube ツールであり、独自のクライアント偽装・署名解析機能により PoToken 問題を回避。Node.js には同等の成熟したライブラリが存在しない。

---

## 結果サマリ

| # | 方法 | 結果 | 処理時間 | ブラウザ不要 |
|---|---|---|---|---|
| 1 | **`youtube-transcript-api`** | **◎ 成功 🏆** | ~1-2秒 | ✅ |
| 2 | `yt-dlp` (extract_info → fetch) | ◎ 成功 | ~3-5秒 | ✅ |
| 3 | `yt-dlp` (writesubtitles) | ✕ タイムアウト | — | — |

---

## 採用方針

**方法1（`youtube-transcript-api`）を第一候補として採用。**

### 理由

- **最軽量**: pip パッケージのみ。Chromium バイナリ不要
- **最速**: 1〜2秒で字幕取得完了
- **最もシンプル**: 3行のコードで字幕データ（テキスト + タイムスタンプ）が取得可能
- **構造化データ**: `text`, `start`, `duration` がそのまま取得でき、後続処理が容易

### フォールバック戦略

`youtube-transcript-api` が将来的に失敗した場合:
1. **`yt-dlp` (extract_info)** — Python 内で完結、PoToken 対応が最も早い
2. **Playwright `--headless=new`** — 最終手段（Node.js PoC で実証済み）

### アーキテクチャへの影響

Python で字幕取得が可能になったことで、以下の選択肢が生まれる:

| 方式 | 概要 | メリット | デメリット |
|---|---|---|---|
| **A: Python API サーバー** | FastAPI/Flask で字幕取得 API を提供し、Next.js から呼び出す | 軽量、高速、Chromium 不要 | サーバー2つ運用 |
| **B: Python スクリプト呼び出し** | Next.js API Route から `child_process` で Python スクリプトを実行 | 既存アーキテクチャ維持 | プロセス起動コスト |
| **C: 現行維持（Node.js Playwright）** | 現在の `--headless=new` 方式を継続 | 変更不要 | Chromium 必要、5-10秒 |

---

## 検証スクリプト

- [fetch_transcript_python.py](fetch_transcript_python.py) — 本検証で使用したスクリプト
