"""AI解説サービス"""

from pathlib import Path

import anthropic
from fastapi import HTTPException

from app.models import ExplainRequest

# プロンプトファイルのディレクトリ
_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

# 使用モデル（docs/guides/guides.md の AIモデル設定に従う）
_MODEL = "claude-sonnet-4-5"


def _load_prompt(filename: str) -> str:
    """プロンプトファイルを読み込む"""
    return (_PROMPTS_DIR / filename).read_text(encoding="utf-8")


def _build_context_text(request: ExplainRequest) -> str:
    """context_lines を整形テキストに変換する"""
    return "\n".join(
        f"[{item.start:.1f}s] {item.text}" for item in request.context_lines
    )


def _build_initial_system_prompt(request: ExplainRequest) -> str:
    """P-01 初回解説用システムプロンプトを構築する"""
    template = _load_prompt("explain_initial.txt")
    context_text = _build_context_text(request)
    return template.replace("{{selected_text}}", request.selected_text).replace(
        "{{context_lines}}", context_text
    )


def _build_followup_system_prompt() -> str:
    """P-02 追加質問用システムプロンプトを構築する"""
    return _load_prompt("explain_followup.txt")


def get_explanation(request: ExplainRequest, api_key: str) -> str:
    """
    Anthropic SDK で呼び出しを行い、回答テキストを返す。
    APIキーはこの関数のスコープ内のみで使用し、関数終了後に破棄される。
    """
    # chat_history の有無で分岐
    if not request.chat_history:
        # 初回: P-01プロンプト
        system_prompt = _build_initial_system_prompt(request)
        messages = [{"role": "user", "content": f"「{request.selected_text}」について解説してください。"}]
    else:
        # 追加質問: P-02プロンプト + chat_history 全件 + 今回の user_message
        system_prompt = _build_followup_system_prompt()
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.chat_history
        ] + [{"role": "user", "content": request.user_message}]

    try:
        client = anthropic.Anthropic(api_key=api_key)

        response = client.messages.create(
            model=_MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )

        return response.content[0].text

    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="INVALID_API_KEY")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="RATE_LIMIT")
    except anthropic.APIError:
        raise HTTPException(status_code=502, detail="CLAUDE_ERROR")
    finally:
        del api_key
