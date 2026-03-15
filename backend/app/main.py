"""FastAPI アプリ定義・CORS設定・ルーター登録"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import transcript, explain

app = FastAPI(title="TubeLingo API")

# CORS設定（フロントエンド開発サーバーからのリクエストを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "x-api-key"],
)

# ルーター登録
app.include_router(transcript.router)
app.include_router(explain.router)
