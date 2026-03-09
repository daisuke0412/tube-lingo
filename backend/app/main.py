"""TubeLingo バックエンド — FastAPI アプリケーション"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import transcript, explain

app = FastAPI(title="TubeLingo API", version="0.1.0")

# CORS: ローカル開発用
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcript.router, prefix="/api")
app.include_router(explain.router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}
