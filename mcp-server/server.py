"""TubeLingo MCPサーバ エントリポイント"""

from mcp.server.fastmcp import FastMCP

from tools.transcript import fetch_transcript

# MCPサーバ初期化
mcp = FastMCP("tube-lingo")

@mcp.tool()
def get_transcript(url: str) -> str:
    """YouTube動画のURLから英語字幕を取得する。

    タイムスタンプ付きの字幕テキストを返す。
    対応URL形式: youtube.com/watch?v=xxx, youtu.be/xxx

    Args:
        url: YouTube動画のURL
    """
    return fetch_transcript(url)


if __name__ == "__main__":
    mcp.run()
