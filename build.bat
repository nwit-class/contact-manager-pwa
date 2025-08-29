@echo off
REM build.bat - builds production files into /dist
cd /d "%~dp0"
echo.
echo 🏗️  Building production bundle...
echo.
call npm run build
if errorlevel 1 (
  echo ❌ Build failed.
  pause
  exit /b 1
)
echo ✅ Build complete. Files in .\dist
pause
