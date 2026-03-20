# PowerShell script to start Wealth Tracker development environment with full paths

Write-Host "Starting Wealth Tracker Dev Environment..." -ForegroundColor Cyan

$baseDir = "c:\Users\choke\Documents\AntiGravity-Projects\wealth-tracker"
$backendDir = "$baseDir\backend"
$frontendDir = "$baseDir\frontend"

# Start Backend in a new window
Write-Host "Launching Backend (NestJS)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; npm run start:dev"

# Start Frontend in a new window
Write-Host "Launching Frontend (Vite)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host "Both processes launched in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000"
Write-Host "Frontend: http://localhost:5173"
