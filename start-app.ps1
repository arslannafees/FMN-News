# Start-App.ps1
# This script starts both the backend and frontend for the FMN News Agency application.

Write-Host "Starting FMN News Agency Backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

Write-Host "Starting FMN News Agency Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Both servers are starting in separate windows."
Write-Host "Backend: http://localhost:5001"
Write-Host "Frontend: Check the output in the new window (usually http://localhost:5173)"
