# TubeLingo — フロントエンド & バックエンドを同時起動 (PowerShell)
# VS Code ターミナル内で完結。Ctrl+C で両方停止。

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# バックエンドをバックグラウンド起動（出力は同じターミナルに表示）
Write-Host "Starting backend (port 8000)..." -ForegroundColor Cyan
$backend = Start-Process -NoNewWindow -PassThru powershell `
  -ArgumentList "-Command", "cd '$ScriptDir\backend'; & '.\.venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --port 8000"

Write-Host "Starting frontend (port 5173)..." -ForegroundColor Cyan
Write-Host ""

# フロントエンドをフォアグラウンド実行（Ctrl+C でここが止まる）
try {
    Set-Location "$ScriptDir\frontend"
    pnpm dev
} finally {
    Set-Location "$ScriptDir"
    # フロントエンド停止後、バックエンドも停止
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped." -ForegroundColor Cyan
}
