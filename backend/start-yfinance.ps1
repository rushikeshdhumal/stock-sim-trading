# Start yfinance microservice
# This service provides stock/crypto quotes using Yahoo Finance API

Write-Host "Starting yfinance microservice on port 5001..." -ForegroundColor Cyan

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
Write-Host "Checking Python dependencies..." -ForegroundColor Yellow
pip list | Select-String "flask|yfinance" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Start the service
Write-Host "Starting Flask app on http://localhost:5001" -ForegroundColor Green
python yfinance-service.py
