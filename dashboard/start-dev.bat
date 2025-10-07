@echo off
echo 🚀 Starting Marin Pest Control Dashboard - Development Mode
echo.

echo 📦 Installing dependencies...
call npm run install:all
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Starting development servers...
echo 📊 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:5173
echo.

call npm run dev
