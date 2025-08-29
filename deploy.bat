@echo off
cd /d "%~dp0"

echo.
echo 🏗️  Building production bundle...
call npm run build
if errorlevel 1 (
  echo ❌ Build failed.
  pause
  exit /b 1
)

echo.
echo 📦 Committing and pushing to origin/main...
call git add -A
call git commit -m "Deploy: latest changes"
call git push -u origin main

echo.
echo ✅ Push complete. Cloudflare Pages will redeploy automatically.
pause
