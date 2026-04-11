"""TubeLingo MCPサーバ エントリポイント"""

from mcp.server.fastmcp import FastMCP

from tools.transcript import fetch_transcript

# "tube-lingo"という名前のMCPサーバを定義
mcp = FastMCP("tube-lingo")

# YouTube字幕取得ツールをMCPのツールとして登録
@mcp.tool()
def get_transcript(url: str) -> str:
    """YouTube動画のURLから英語字幕を取得する。
    対応URL形式: youtube.com/watch?v=xxx, youtu.be/xxx

    Args:
        url: YouTube動画のURL
    """

    # YouTube字幕取得処理
    return fetch_transcript(url)

# MCPサーバを起動
if __name__ == "__main__":
    mcp.run()
