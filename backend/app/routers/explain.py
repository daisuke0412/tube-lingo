"""AI解説 router（A-02）"""

from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse

from app.models import ExplainRequest
from app.services.explain import stream_explanation

router = APIRouter()


@router.post("/api/explain")
async def post_explain(
    request: ExplainRequest,
    x_api_key: str = Header(..., alias="x-api-key", description="Anthropic APIキー"),
) -> StreamingResponse:
    """Claude による字幕解説をSSEストリーミングで返す"""
    return StreamingResponse(
        stream_explanation(request, x_api_key),
        media_type="text/event-stream",
    )
