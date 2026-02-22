# Run the Impossible Tasks backend (FastAPI) on http://localhost:8000
# From project root: .\backend\run_backend.ps1
# Or from backend folder: .\run_backend.ps1

$ErrorActionPreference = "Stop"
$backendDir = $PSScriptRoot
if (-not (Test-Path "$backendDir\server.py")) {
    Write-Host "Run this script from the backend folder or project root." -ForegroundColor Red
    exit 1
}

Set-Location $backendDir

# Ensure dependencies (uvicorn, fastapi, etc.) are installed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
$null = python -c "import uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing backend dependencies (pip install -r requirements.txt)..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { Write-Host "pip install failed." -ForegroundColor Red; exit 1 }
}

Write-Host "Starting backend at http://localhost:8000 (API at http://localhost:8000/api)" -ForegroundColor Green
Write-Host "Stop with Ctrl+C" -ForegroundColor Gray
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
