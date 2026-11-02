@echo off
chcp 65001 >nul
title Website (lokal)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte von https://nodejs.org die LTS-Version installieren.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Erster Start: Pakete werden installiert, das dauert einen Moment ...
  call npm install
)

echo.
echo Die Website startet gleich unter http://localhost:3210
echo Aenderungen erscheinen nach dem Speichern automatisch.
echo Zum Beenden dieses Fenster schliessen.
echo.
start "" http://localhost:3210
call npm run website
pause
