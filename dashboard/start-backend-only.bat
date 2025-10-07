@echo off
echo 🚀 Starting Marin Pest Control Backend Only
echo.

echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Starting backend server...
echo 📊 Backend: http://localhost:5000
echo 🔔 Webhook: http://localhost:5000/api/webhook/quickbooks
echo.

call npm run dev
