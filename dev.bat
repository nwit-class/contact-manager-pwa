@echo off
REM dev.bat - start Vite dev server in CMD (avoids PowerShell execution policy)
cd /d "%~dp0"
echo.
echo 🚀 Starting Contact Manager (dev)...
echo.
call npm run dev
