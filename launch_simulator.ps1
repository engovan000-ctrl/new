# Electrical Machines Virtual Lab Launcher
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ELECTRICAL MACHINES & DRIVES VIRTUAL LABORATORY SIMULATOR" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening simulator in default web browser..." -ForegroundColor Green
$htmlPath = Join-Path $PSScriptRoot "index.html"
Start-Process $htmlPath
Write-Host "Simulator successfully launched!" -ForegroundColor Green
