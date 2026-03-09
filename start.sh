#!/bin/bash
# TubeLingo — フロントエンド & バックエンドを同時起動

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# バックエンド起動 (port 8000)
echo "Starting backend (port 8000)..."
cd "$SCRIPT_DIR/backend"
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# フロントエンド起動 (port 5173)
echo "Starting frontend (port 5173)..."
cd "$SCRIPT_DIR/frontend"
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "Press Ctrl+C to stop both."
echo ""

wait
