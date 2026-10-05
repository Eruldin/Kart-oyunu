@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 veya uzeri gerekiyor: https://nodejs.org
  pause
  exit /b 1
)
start "Eruldin" "http://localhost:3000"
node server.mjs
pause
