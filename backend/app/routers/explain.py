"""AI解説 router（A-02）"""

from fastapi import APIRouter

from app.models import ExplainRequest
from app.services.explain import get_explanation

router = APIRouter()


@router.post("/api/explain")
async def post_explain(
    request: ExplainRequest,
) -> dict:
    """Claude による字幕解説をJSON形式で返す"""
    content = get_explanation(request)
    return {"content": content}
