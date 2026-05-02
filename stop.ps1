# TubeLingo — フロントエンド & バックエンドを停止 (PowerShell)

$stopped = $false

# uvicorn (バックエンド)
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force
    Write-Host "Stopped backend (uvicorn PID $($_.Id))" -ForegroundColor Cyan
    $stopped = $true
}

# python 経由で uvicorn が動いている場合
Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -like "*uvicorn*app.main:app*" } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped backend (python PID $($_.ProcessId))" -ForegroundColor Cyan
        $stopped = $true
    }

# node (フロントエンド vite dev server)
Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*pnpm*dev*" } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped frontend (PID $($_.ProcessId))" -ForegroundColor Cyan
        $stopped = $true
    }

if (-not $stopped) {
    Write-Host "No running TubeLingo processes found." -ForegroundColor Yellow
}
