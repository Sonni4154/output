@echo off
echo 🚀 Starting Marin Pest Control Dashboard - Production Mode
echo.

echo 📦 Building applications...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build applications
    pause
    exit /b 1
)

echo.
echo 🔧 Starting production servers with PM2...
call npm run pm2:start

echo.
echo ✅ Production servers started!
echo 📊 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:5173
echo.
echo 📋 To check status: npm run pm2:status
echo 📋 To view logs: npm run pm2:logs
echo 📋 To stop: npm run pm2:stop
echo.
pause
