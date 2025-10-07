@echo off
setlocal enabledelayedexpansion

:MAIN_MENU
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                MARIN PEST CONTROL DASHBOARD                 ║
echo ║                    Management Console                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Check if we're in the right directory
if not exist "backend" (
    echo ❌ Error: Backend directory not found!
    echo    Please run this script from the project root directory.
    pause
    exit /b 1
)

:: Check server status
echo 🔍 Checking server status...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    set SERVER_STATUS=🟢 ONLINE
) else (
    set SERVER_STATUS=🔴 OFFLINE
)

echo.
echo 📊 Server Status: %SERVER_STATUS%
echo 📍 Backend URL: http://localhost:5000
echo 🎨 Frontend URL: http://localhost:5173
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        MAIN MENU                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 🚀 Start Development (Frontend + Backend)
echo 2. 🔧 Start Backend Only
echo 3. 🏭 Start Production (PM2)
echo 4. ⏹️  Stop All Services
echo 5. 🔄 Restart Services
echo 6. 📊 Check Status & Logs
echo 7. 🧪 Test Webhook
echo 8. 📦 Install/Update Dependencies
echo 9. 🏗️  Build Applications
echo 10. 🔍 Environment Check
echo 11. 📋 Quick Setup Guide
echo 12. 🐛 Debug Menu
echo 13. 🌐 Nginx Management
echo 14. 🖥️  System Management
echo 15. 🔐 SSH Management
echo 16. 📦 Dependencies & Security
echo 17. 📊 Hardware Monitor
echo 18. 👥 User Management
echo 19. ⏰ Cron & Systemd
echo 20. 📝 Export Changes Log
echo 21. ❌ Exit
echo.

set /p choice="Enter your choice (1-21): "

if "%choice%"=="1" goto START_DEV
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_PROD
if "%choice%"=="4" goto STOP_ALL
if "%choice%"=="5" goto RESTART
if "%choice%"=="6" goto CHECK_STATUS
if "%choice%"=="7" goto TEST_WEBHOOK
if "%choice%"=="8" goto INSTALL_DEPS
if "%choice%"=="9" goto BUILD_APPS
if "%choice%"=="10" goto ENV_CHECK
if "%choice%"=="11" goto QUICK_SETUP
if "%choice%"=="12" goto DEBUG_MENU
if "%choice%"=="13" goto NGINX_MENU
if "%choice%"=="14" goto SYSTEM_MENU
if "%choice%"=="15" goto SSH_MENU
if "%choice%"=="16" goto DEPENDENCIES_MENU
if "%choice%"=="17" goto HARDWARE_MONITOR
if "%choice%"=="18" goto USER_MANAGEMENT
if "%choice%"=="19" goto CRON_SYSTEMD
if "%choice%"=="20" goto EXPORT_CHANGES
if "%choice%"=="21" goto EXIT

echo ❌ Invalid choice. Please try again.
pause
goto MAIN_MENU

:START_DEV
cls
echo 🚀 Starting Development Mode...
echo.
echo 📦 Installing dependencies...
call npm run install:all
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    goto MAIN_MENU
)

echo.
echo 🔧 Starting development servers...
echo 📊 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop servers
echo.
call npm run dev
pause
goto MAIN_MENU

:START_BACKEND
cls
echo 🔧 Starting Backend Only...
echo.
cd backend
echo 📦 Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    cd ..
    pause
    goto MAIN_MENU
)

echo.
echo 🚀 Starting backend server...
echo 📊 Backend: http://localhost:5000
echo 🔔 Webhook: http://localhost:5000/api/webhook/quickbooks
echo.
echo Press Ctrl+C to stop server
echo.
call npm run dev
cd ..
pause
goto MAIN_MENU

:START_PROD
cls
echo 🏭 Starting Production Mode...
echo.
echo 📦 Building applications...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build applications
    pause
    goto MAIN_MENU
)

echo.
echo 🔧 Starting production servers with PM2...
call npm run pm2:start

echo.
echo ✅ Production servers started!
echo 📊 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:5173
echo.
pause
goto MAIN_MENU

:STOP_ALL
cls
echo ⏹️ Stopping All Services...
echo.
echo 🛑 Stopping PM2 processes...
call npm run pm2:stop
echo.
echo ✅ All services stopped.
echo.
pause
goto MAIN_MENU

:RESTART
cls
echo 🔄 Restarting Services...
echo.
echo 🛑 Stopping services...
call npm run pm2:stop
timeout /t 3 /nobreak >nul

echo 🚀 Starting services...
call npm run pm2:start

echo.
echo ✅ Services restarted!
echo.
pause
goto MAIN_MENU

:CHECK_STATUS
cls
echo 📊 Checking Status & Logs...
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        PM2 STATUS                           ║
echo ╚══════════════════════════════════════════════════════════════╝
call npm run pm2:status

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    RECENT LOGS                              ║
echo ╚══════════════════════════════════════════════════════════════╝
call npm run pm2:logs --lines 20

echo.
pause
goto MAIN_MENU

:TEST_WEBHOOK
cls
echo 🧪 Testing Webhook Endpoint...
echo.

echo 🔍 Testing webhook health...
curl -s http://localhost:5000/api/webhook/health
echo.

echo.
echo 🧪 Testing webhook with sample payload...
cd backend
call npm run test:webhook
cd ..

echo.
pause
goto MAIN_MENU

:INSTALL_DEPS
cls
echo 📦 Installing/Updating Dependencies...
echo.
echo 📦 Installing root dependencies...
call npm install

echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ All dependencies installed!
echo.
pause
goto MAIN_MENU

:BUILD_APPS
cls
echo 🏗️ Building Applications...
echo.
echo 🏗️ Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Backend build failed
    cd ..
    pause
    goto MAIN_MENU
)
cd ..

echo.
echo 🏗️ Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    cd ..
    pause
    goto MAIN_MENU
)
cd ..

echo.
echo ✅ All applications built successfully!
echo.
pause
goto MAIN_MENU

:ENV_CHECK
cls
echo 🔍 Environment Check...
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    ENVIRONMENT STATUS                       ║
echo ╚══════════════════════════════════════════════════════════════╝

:: Check if .env files exist
if exist "backend\.env" (
    echo ✅ Backend .env file exists
) else (
    echo ❌ Backend .env file missing
    echo    Copy backend\env-template.txt to backend\.env
)

if exist "frontend\.env" (
    echo ✅ Frontend .env file exists
) else (
    echo ❌ Frontend .env file missing
    echo    Create frontend\.env with VITE_API_BASE_URL=http://localhost:5000
)

:: Check if node_modules exist
if exist "node_modules" (
    echo ✅ Root dependencies installed
) else (
    echo ❌ Root dependencies missing - run option 8
)

if exist "backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend dependencies missing - run option 8
)

if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies missing - run option 8
)

:: Check if dist folders exist
if exist "backend\dist" (
    echo ✅ Backend built
) else (
    echo ❌ Backend not built - run option 9
)

if exist "frontend\dist" (
    echo ✅ Frontend built
) else (
    echo ❌ Frontend not built - run option 9
)

echo.
pause
goto MAIN_MENU

:QUICK_SETUP
cls
echo 📋 Quick Setup Guide...
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    QUICK SETUP GUIDE                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 📁 Copy backend\env-template.txt to backend\.env
echo 2. 📝 Edit backend\.env with your QuickBooks credentials
echo 3. 📁 Create frontend\.env with VITE_API_BASE_URL=http://localhost:5000
echo 4. 📦 Run option 8 to install dependencies
echo 5. 🚀 Run option 1 to start development
echo.
echo 📖 For detailed setup, see docs\SETUP.md
echo.
echo 🔗 QuickBooks URLs to configure:
echo    Webhook URL: https://your-domain.com/api/webhook/quickbooks
echo    Redirect URL: https://your-domain.com/auth/qbo/callback
echo    Launch URL: https://your-domain.com/auth/qbo/launch
echo    Disconnect URL: https://your-domain.com/auth/qbo/disconnect
echo.
pause
goto MAIN_MENU

:DEBUG_MENU
cls
echo 🐛 Debug Menu
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        DEBUG OPTIONS                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 📊 Backend Debug (PM2 logs, processes, ports)
echo 2. 🎨 Frontend Debug (Build logs, dev server)
echo 3. 🌐 Network Debug (Ports, connections, firewall)
echo 4. 💾 Database Debug (Connection, queries, logs)
echo 5. 🔔 Webhook Debug (Test, logs, delivery status)
echo 6. 📋 System Resources (CPU, Memory, Disk)
echo 7. 🔍 Process Analysis (Running processes, ports)
echo 8. 📝 Log Analysis (Search logs, errors, patterns)
echo 9. 🔙 Back to Main Menu
echo.

set /p debug_choice="Enter your choice (1-9): "

if "%debug_choice%"=="1" goto BACKEND_DEBUG
if "%debug_choice%"=="2" goto FRONTEND_DEBUG
if "%debug_choice%"=="3" goto NETWORK_DEBUG
if "%debug_choice%"=="4" goto DATABASE_DEBUG
if "%debug_choice%"=="5" goto WEBHOOK_DEBUG
if "%debug_choice%"=="6" goto SYSTEM_RESOURCES
if "%debug_choice%"=="7" goto PROCESS_ANALYSIS
if "%debug_choice%"=="8" goto LOG_ANALYSIS
if "%debug_choice%"=="9" goto MAIN_MENU

echo ❌ Invalid choice. Please try again.
pause
goto DEBUG_MENU

:BACKEND_DEBUG
cls
echo 📊 Backend Debug Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        PM2 STATUS                           ║
echo ╚══════════════════════════════════════════════════════════════╝
call npm run pm2:status

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    RECENT BACKEND LOGS                      ║
echo ╚══════════════════════════════════════════════════════════════╝
call npm run pm2:logs -- --lines 30

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    PORT USAGE                               ║
echo ╚══════════════════════════════════════════════════════════════╝
netstat -an | findstr :5000

echo.
pause
goto DEBUG_MENU

:FRONTEND_DEBUG
cls
echo 🎨 Frontend Debug Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    FRONTEND BUILD STATUS                    ║
echo ╚══════════════════════════════════════════════════════════════╝
if exist "frontend\dist" (
    echo ✅ Frontend built successfully
    dir frontend\dist
) else (
    echo ❌ Frontend not built
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    PORT USAGE                               ║
echo ╚══════════════════════════════════════════════════════════════╝
netstat -an | findstr :5173

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NODE MODULES STATUS                      ║
echo ╚══════════════════════════════════════════════════════════════╝
if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies missing
)

echo.
pause
goto DEBUG_MENU

:NETWORK_DEBUG
cls
echo 🌐 Network Debug Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    LISTENING PORTS                          ║
echo ╚══════════════════════════════════════════════════════════════╝
netstat -an | findstr LISTENING

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    ACTIVE CONNECTIONS                       ║
echo ╚══════════════════════════════════════════════════════════════╝
netstat -an | findstr ESTABLISHED

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    FIREWALL STATUS                          ║
echo ╚══════════════════════════════════════════════════════════════╝
netsh advfirewall show allprofiles state

echo.
pause
goto DEBUG_MENU

:DATABASE_DEBUG
cls
echo 💾 Database Debug Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    DATABASE CONNECTION                      ║
echo ╚══════════════════════════════════════════════════════════════╝
if exist "backend\.env" (
    echo ✅ Backend .env file exists
    echo Checking DATABASE_URL...
    findstr "DATABASE_URL" backend\.env
) else (
    echo ❌ Backend .env file missing
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    DATABASE LOGS                            ║
echo ╚══════════════════════════════════════════════════════════════╝
if exist "backend\logs" (
    echo Recent database-related logs:
    dir backend\logs\*.log
) else (
    echo No database logs found
)

echo.
pause
goto DEBUG_MENU

:WEBHOOK_DEBUG
cls
echo 🔔 Webhook Debug Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    WEBHOOK HEALTH CHECK                     ║
echo ╚══════════════════════════════════════════════════════════════╝
curl -s http://localhost:5000/api/webhook/health

echo.
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    WEBHOOK TEST                             ║
echo ╚══════════════════════════════════════════════════════════════╝
cd backend
call npm run test:webhook
cd ..

echo.
pause
goto DEBUG_MENU

:SYSTEM_RESOURCES
cls
echo 📋 System Resources
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SYSTEM INFORMATION                       ║
echo ╚══════════════════════════════════════════════════════════════╝
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory" /C:"Total Virtual Memory" /C:"Available Virtual Memory"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    DISK USAGE                               ║
echo ╚══════════════════════════════════════════════════════════════╝
wmic logicaldisk get size,freespace,caption

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    CPU USAGE                                ║
echo ╚══════════════════════════════════════════════════════════════╝
wmic cpu get loadpercentage /value

echo.
pause
goto DEBUG_MENU

:PROCESS_ANALYSIS
cls
echo 🔍 Process Analysis
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NODE PROCESSES                           ║
echo ╚══════════════════════════════════════════════════════════════╝
tasklist | findstr node

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    PM2 PROCESSES                            ║
echo ╚══════════════════════════════════════════════════════════════╝
call npm run pm2:status

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    PORT MAPPINGS                            ║
echo ╚══════════════════════════════════════════════════════════════╝
netstat -ano | findstr :5000
netstat -ano | findstr :5173

echo.
pause
goto DEBUG_MENU

:LOG_ANALYSIS
cls
echo 📝 Log Analysis
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    ERROR LOGS                               ║
echo ╚══════════════════════════════════════════════════════════════╝
if exist "backend\logs" (
    echo Recent error logs:
    findstr /i "error" backend\logs\*.log | tail -20
) else (
    echo No error logs found
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    WARNING LOGS                             ║
echo ╚══════════════════════════════════════════════════════════════╝
if exist "backend\logs" (
    echo Recent warning logs:
    findstr /i "warn" backend\logs\*.log | tail -20
) else (
    echo No warning logs found
)

echo.
pause
goto DEBUG_MENU

:NGINX_MENU
cls
echo 🌐 Nginx Management
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NGINX MANAGEMENT                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 📋 Install Nginx Configuration
echo 2. 🗑️  Remove Old Nginx Configs
echo 3. ✅ Test Nginx Configuration
echo 4. 🔄 Complete Nginx Reset
echo 5. 📊 Nginx Status & Logs
echo 6. 🔧 Backup Current Config
echo 7. 🔙 Back to Main Menu
echo.

set /p nginx_choice="Enter your choice (1-7): "

if "%nginx_choice%"=="1" goto INSTALL_NGINX
if "%nginx_choice%"=="2" goto REMOVE_NGINX
if "%nginx_choice%"=="3" goto TEST_NGINX
if "%nginx_choice%"=="4" goto RESET_NGINX
if "%nginx_choice%"=="5" goto NGINX_STATUS
if "%nginx_choice%"=="6" goto BACKUP_NGINX
if "%nginx_choice%"=="7" goto MAIN_MENU

echo ❌ Invalid choice. Please try again.
pause
goto NGINX_MENU

:INSTALL_NGINX
cls
echo 📋 Installing Nginx Configuration...
echo.

echo Creating backup of current config...
if exist "C:\nginx\conf\nginx.conf" (
    copy "C:\nginx\conf\nginx.conf" "C:\nginx\conf\nginx.conf.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    echo ✅ Backup created
)

echo.
echo Installing new Nginx configuration...
if exist "nginx\nginx.conf" (
    copy "nginx\nginx.conf" "C:\nginx\conf\nginx.conf"
    echo ✅ Nginx configuration installed
) else (
    echo ❌ nginx\nginx.conf not found
    echo Please create the nginx configuration file first
)

echo.
pause
goto NGINX_MENU

:REMOVE_NGINX
cls
echo 🗑️ Removing Old Nginx Configurations...
echo.

echo Creating backup before removal...
if exist "C:\nginx\conf\nginx.conf" (
    copy "C:\nginx\conf\nginx.conf" "C:\nginx\conf\nginx.conf.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    echo ✅ Backup created
)

echo.
echo Removing old configurations...
del "C:\nginx\conf\nginx.conf" 2>nul
echo ✅ Old configurations removed

echo.
pause
goto NGINX_MENU

:TEST_NGINX
cls
echo ✅ Testing Nginx Configuration...
echo.

echo Running nginx -t...
C:\nginx\nginx.exe -t
if %errorlevel% equ 0 (
    echo ✅ Nginx configuration test passed
) else (
    echo ❌ Nginx configuration test failed
)

echo.
pause
goto NGINX_MENU

:RESET_NGINX
cls
echo 🔄 Complete Nginx Reset...
echo.

echo Stopping Nginx...
taskkill /f /im nginx.exe 2>nul

echo.
echo Creating backup...
if exist "C:\nginx\conf\nginx.conf" (
    copy "C:\nginx\conf\nginx.conf" "C:\nginx\conf\nginx.conf.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    echo ✅ Backup created
)

echo.
echo Removing old configurations...
del "C:\nginx\conf\nginx.conf" 2>nul

echo.
echo Installing default configuration...
if exist "nginx\nginx.conf" (
    copy "nginx\nginx.conf" "C:\nginx\conf\nginx.conf"
    echo ✅ Default configuration installed
)

echo.
echo Testing configuration...
C:\nginx\nginx.exe -t
if %errorlevel% equ 0 (
    echo ✅ Configuration test passed
    echo Starting Nginx...
    start C:\nginx\nginx.exe
) else (
    echo ❌ Configuration test failed
)

echo.
pause
goto NGINX_MENU

:NGINX_STATUS
cls
echo 📊 Nginx Status & Logs
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NGINX PROCESSES                          ║
echo ╚══════════════════════════════════════════════════════════════╝
tasklist | findstr nginx

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NGINX LOGS                               ║
echo ╚══════════════════════════════════════════════════════════════╝
if exist "C:\nginx\logs\error.log" (
    echo Recent error logs:
    type "C:\nginx\logs\error.log" | tail -20
) else (
    echo No error logs found
)

echo.
pause
goto NGINX_MENU

:BACKUP_NGINX
cls
echo 🔧 Backing Up Current Nginx Configuration...
echo.

set backup_name=nginx_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%

if exist "C:\nginx\conf\nginx.conf" (
    copy "C:\nginx\conf\nginx.conf" "C:\nginx\conf\%backup_name%.conf"
    echo ✅ Backup created: %backup_name%.conf
) else (
    echo ❌ No nginx.conf found to backup
)

echo.
pause
goto NGINX_MENU

:SYSTEM_MENU
cls
echo 🖥️ System Management
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SYSTEM MANAGEMENT                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 🏷️  Hostname Management
echo 2. 📝 Hosts File Management
echo 3. 🌐 FQDN Setup
echo 4. 🔧 System Information
echo 5. 🔄 System Services
echo 6. 🔙 Back to Main Menu
echo.

set /p system_choice="Enter your choice (1-6): "

if "%system_choice%"=="1" goto HOSTNAME_MENU
if "%system_choice%"=="2" goto HOSTS_MENU
if "%system_choice%"=="3" goto FQDN_MENU
if "%system_choice%"=="4" goto SYSTEM_INFO
if "%system_choice%"=="5" goto SYSTEM_SERVICES
if "%system_choice%"=="6" goto MAIN_MENU

echo ❌ Invalid choice. Please try again.
pause
goto SYSTEM_MENU

:HOSTNAME_MENU
cls
echo 🏷️ Hostname Management
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    CURRENT HOSTNAME                         ║
echo ╚══════════════════════════════════════════════════════════════╝
hostname

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    HOSTNAME OPTIONS                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo 1. 📋 View Current Hostname
echo 2. ✏️  Set New Hostname
echo 3. 🔙 Back to System Menu
echo.

set /p hostname_choice="Enter your choice (1-3): "

if "%hostname_choice%"=="1" goto VIEW_HOSTNAME
if "%hostname_choice%"=="2" goto SET_HOSTNAME
if "%hostname_choice%"=="3" goto SYSTEM_MENU

echo ❌ Invalid choice. Please try again.
pause
goto HOSTNAME_MENU

:VIEW_HOSTNAME
cls
echo 📋 Current Hostname Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    HOSTNAME DETAILS                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo Computer Name: %COMPUTERNAME%
echo User Domain: %USERDOMAIN%
echo Logon Server: %LOGONSERVER%

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NETWORK INFORMATION                      ║
echo ╚══════════════════════════════════════════════════════════════╝
ipconfig | findstr "Host Name" /A:5

echo.
pause
goto HOSTNAME_MENU

:SET_HOSTNAME
cls
echo ✏️ Set New Hostname
echo.

echo ⚠️  WARNING: Changing hostname requires administrator privileges
echo ⚠️  and may require a system restart.
echo.

set /p new_hostname="Enter new hostname: "

if "%new_hostname%"=="" (
    echo ❌ Hostname cannot be empty
    pause
    goto HOSTNAME_MENU
)

echo.
echo Setting hostname to: %new_hostname%
echo.
echo ⚠️  This will require administrator privileges and a restart.
echo Please run this script as administrator to change hostname.

echo.
pause
goto HOSTNAME_MENU

:HOSTS_MENU
cls
echo 📝 Hosts File Management
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    HOSTS FILE OPTIONS                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo 1. 📋 View Current Hosts File
echo 2. ✏️  Edit Hosts File
echo 3. 🔧 Add Local Development Entries
echo 4. 🗑️  Clear Hosts File
echo 5. 🔙 Back to System Menu
echo.

set /p hosts_choice="Enter your choice (1-5): "

if "%hosts_choice%"=="1" goto VIEW_HOSTS
if "%hosts_choice%"=="2" goto EDIT_HOSTS
if "%hosts_choice%"=="3" goto ADD_DEV_HOSTS
if "%hosts_choice%"=="4" goto CLEAR_HOSTS
if "%hosts_choice%"=="5" goto SYSTEM_MENU

echo ❌ Invalid choice. Please try again.
pause
goto HOSTS_MENU

:VIEW_HOSTS
cls
echo 📋 Current Hosts File
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    HOSTS FILE CONTENTS                      ║
echo ╚══════════════════════════════════════════════════════════════╝
type C:\Windows\System32\drivers\etc\hosts

echo.
pause
goto HOSTS_MENU

:EDIT_HOSTS
cls
echo ✏️ Edit Hosts File
echo.

echo ⚠️  WARNING: Editing hosts file requires administrator privileges
echo.
echo Opening hosts file in notepad...
echo Please run this script as administrator to edit hosts file.

echo.
pause
goto HOSTS_MENU

:ADD_DEV_HOSTS
cls
echo 🔧 Adding Local Development Entries
echo.

echo Creating backup of hosts file...
copy "C:\Windows\System32\drivers\etc\hosts" "C:\Windows\System32\drivers\etc\hosts.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"

echo.
echo Adding development entries...
echo # Marin Pest Control Development Entries >> "C:\Windows\System32\drivers\etc\hosts"
echo 127.0.0.1 marin-pest-control.local >> "C:\Windows\System32\drivers\etc\hosts"
echo 127.0.0.1 api.marin-pest-control.local >> "C:\Windows\System32\drivers\etc\hosts"
echo 127.0.0.1 dashboard.marin-pest-control.local >> "C:\Windows\System32\drivers\etc\hosts"

echo ✅ Development entries added to hosts file

echo.
pause
goto HOSTS_MENU

:CLEAR_HOSTS
cls
echo 🗑️ Clear Hosts File
echo.

echo ⚠️  WARNING: This will remove all custom entries from hosts file
echo.
set /p confirm="Are you sure? (y/N): "

if /i "%confirm%"=="y" (
    echo Creating backup...
    copy "C:\Windows\System32\drivers\etc\hosts" "C:\Windows\System32\drivers\etc\hosts.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    
    echo Clearing hosts file...
    echo # Copyright (c) 1993-2009 Microsoft Corp. > "C:\Windows\System32\drivers\etc\hosts"
    echo # This is a sample HOSTS file used by Microsoft TCP/IP for Windows. >> "C:\Windows\System32\drivers\etc\hosts"
    echo # >> "C:\Windows\System32\drivers\etc\hosts"
    echo # This file contains the mappings of IP addresses to host names. Each >> "C:\Windows\System32\drivers\etc\hosts"
    echo # entry should be kept on an individual line. The IP address should >> "C:\Windows\System32\drivers\etc\hosts"
    echo # be placed in the first column followed by the corresponding host name. >> "C:\Windows\System32\drivers\etc\hosts"
    echo # The IP address and the host name should be separated by at least one >> "C:\Windows\System32\drivers\etc\hosts"
    echo # space. >> "C:\Windows\System32\drivers\etc\hosts"
    echo # >> "C:\Windows\System32\drivers\etc\hosts"
    echo # Additionally, comments (such as these) may be inserted on individual >> "C:\Windows\System32\drivers\etc\hosts"
    echo # lines or following the machine name denoted by a '#' symbol. >> "C:\Windows\System32\drivers\etc\hosts"
    echo # >> "C:\Windows\System32\drivers\etc\hosts"
    echo # For example: >> "C:\Windows\System32\drivers\etc\hosts"
    echo # >> "C:\Windows\System32\drivers\etc\hosts"
    echo #      102.54.94.97     rhino.acme.com          # source server >> "C:\Windows\System32\drivers\etc\hosts"
    echo #       38.25.63.10     x.acme.com              # x client host >> "C:\Windows\System32\drivers\etc\hosts"
    echo # >> "C:\Windows\System32\drivers\etc\hosts"
    echo # localhost name resolution is handled within DNS itself. >> "C:\Windows\System32\drivers\etc\hosts"
    echo #	127.0.0.1       localhost >> "C:\Windows\System32\drivers\etc\hosts"
    echo #	::1             localhost >> "C:\Windows\System32\drivers\etc\hosts"
    
    echo ✅ Hosts file cleared
) else (
    echo Operation cancelled
)

echo.
pause
goto HOSTS_MENU

:FQDN_MENU
cls
echo 🌐 FQDN Setup
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    FQDN CONFIGURATION                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 📋 View Current FQDN
echo 2. ✏️  Set FQDN
echo 3. 🔧 Configure DNS
echo 4. 🔙 Back to System Menu
echo.

set /p fqdn_choice="Enter your choice (1-4): "

if "%fqdn_choice%"=="1" goto VIEW_FQDN
if "%fqdn_choice%"=="2" goto SET_FQDN
if "%fqdn_choice%"=="3" goto CONFIGURE_DNS
if "%fqdn_choice%"=="4" goto SYSTEM_MENU

echo ❌ Invalid choice. Please try again.
pause
goto FQDN_MENU

:VIEW_FQDN
cls
echo 📋 Current FQDN Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    FQDN DETAILS                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo Computer Name: %COMPUTERNAME%
echo User Domain: %USERDOMAIN%
echo DNS Domain: %USERDNSDOMAIN%

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NETWORK CONFIGURATION                    ║
echo ╚══════════════════════════════════════════════════════════════╝
ipconfig /all | findstr "Host Name" /A:10

echo.
pause
goto FQDN_MENU

:SET_FQDN
cls
echo ✏️ Set FQDN
echo.

echo ⚠️  WARNING: Setting FQDN requires administrator privileges
echo ⚠️  and may require a system restart.
echo.

set /p new_fqdn="Enter new FQDN (e.g., server.marinpestcontrol.com): "

if "%new_fqdn%"=="" (
    echo ❌ FQDN cannot be empty
    pause
    goto FQDN_MENU
)

echo.
echo Setting FQDN to: %new_fqdn%
echo.
echo ⚠️  This will require administrator privileges and a restart.
echo Please run this script as administrator to change FQDN.

echo.
pause
goto FQDN_MENU

:CONFIGURE_DNS
cls
echo 🔧 Configure DNS
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    DNS CONFIGURATION                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 📋 View Current DNS Settings
echo 2. ✏️  Set DNS Servers
echo 3. 🔍 Test DNS Resolution
echo 4. 🔙 Back to FQDN Menu
echo.

set /p dns_choice="Enter your choice (1-4): "

if "%dns_choice%"=="1" goto VIEW_DNS
if "%dns_choice%"=="2" goto SET_DNS
if "%dns_choice%"=="3" goto TEST_DNS
if "%dns_choice%"=="4" goto FQDN_MENU

echo ❌ Invalid choice. Please try again.
pause
goto CONFIGURE_DNS

:VIEW_DNS
cls
echo 📋 Current DNS Settings
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    DNS CONFIGURATION                        ║
echo ╚══════════════════════════════════════════════════════════════╝
ipconfig /all | findstr "DNS Servers" /A:5

echo.
pause
goto CONFIGURE_DNS

:SET_DNS
cls
echo ✏️ Set DNS Servers
echo.

echo ⚠️  WARNING: Setting DNS servers requires administrator privileges
echo.
echo Please run this script as administrator to change DNS settings.

echo.
pause
goto CONFIGURE_DNS

:TEST_DNS
cls
echo 🔍 Test DNS Resolution
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    DNS RESOLUTION TEST                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo Testing localhost resolution...
nslookup localhost

echo.
echo Testing Google DNS...
nslookup google.com

echo.
pause
goto CONFIGURE_DNS

:SYSTEM_INFO
cls
echo 🔧 System Information
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SYSTEM DETAILS                           ║
echo ╚══════════════════════════════════════════════════════════════╝
systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory" /C:"Available Physical Memory"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    NETWORK ADAPTERS                         ║
echo ╚══════════════════════════════════════════════════════════════╝
ipconfig

echo.
pause
goto SYSTEM_MENU

:SYSTEM_SERVICES
cls
echo 🔄 System Services
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SERVICE MANAGEMENT                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 📋 View Running Services
echo 2. 🔧 Start/Stop Services
echo 3. 🔍 Find Specific Service
echo 4. 🔙 Back to System Menu
echo.

set /p service_choice="Enter your choice (1-4): "

if "%service_choice%"=="1" goto VIEW_SERVICES
if "%service_choice%"=="2" goto MANAGE_SERVICES
if "%service_choice%"=="3" goto FIND_SERVICE
if "%service_choice%"=="4" goto SYSTEM_MENU

echo ❌ Invalid choice. Please try again.
pause
goto SYSTEM_SERVICES

:VIEW_SERVICES
cls
echo 📋 Running Services
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    RUNNING SERVICES                         ║
echo ╚══════════════════════════════════════════════════════════════╝
sc query state= running | findstr "SERVICE_NAME"

echo.
pause
goto SYSTEM_SERVICES

:MANAGE_SERVICES
cls
echo 🔧 Manage Services
echo.

echo ⚠️  WARNING: Managing services requires administrator privileges
echo.
echo Please run this script as administrator to manage services.

echo.
pause
goto SYSTEM_SERVICES

:FIND_SERVICE
cls
echo 🔍 Find Specific Service
echo.

set /p service_name="Enter service name to search: "

if "%service_name%"=="" (
    echo ❌ Service name cannot be empty
    pause
    goto SYSTEM_SERVICES
)

echo.
echo Searching for: %service_name%
sc query | findstr /i "%service_name%"

echo.
pause
goto SYSTEM_SERVICES

:SSH_MENU
cls
echo 🔐 SSH Management
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SSH MANAGEMENT                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 🔑 Generate SSH Key Pair
echo 2. 📋 Copy Public Key to Remote Server
echo 3. 🔧 Add Server to Known Hosts
echo 4. 🛡️  SSH Hardening
echo 5. 📊 SSH Configuration
echo 6. 🔍 SSH Connection Test
echo 7. 🔙 Back to Main Menu
echo.

set /p ssh_choice="Enter your choice (1-7): "

if "%ssh_choice%"=="1" goto GENERATE_SSH_KEY
if "%ssh_choice%"=="2" goto COPY_SSH_KEY
if "%ssh_choice%"=="3" goto ADD_KNOWN_HOSTS
if "%ssh_choice%"=="4" goto SSH_HARDENING
if "%ssh_choice%"=="5" goto SSH_CONFIG
if "%ssh_choice%"=="6" goto SSH_TEST
if "%ssh_choice%"=="7" goto MAIN_MENU

echo ❌ Invalid choice. Please try again.
pause
goto SSH_MENU

:GENERATE_SSH_KEY
cls
echo 🔑 Generate SSH Key Pair
echo.

set /p key_name="Enter key name (default: id_rsa): "
if "%key_name%"=="" set key_name=id_rsa

set /p key_email="Enter email for key: "

if "%key_email%"=="" (
    echo ❌ Email is required for SSH key generation
    pause
    goto SSH_MENU
)

echo.
echo Generating SSH key pair...
echo Key name: %key_name%
echo Email: %key_email%

echo.
echo ⚠️  This will generate SSH keys in your .ssh directory
echo Please ensure you have OpenSSH installed.

echo.
echo Generating key...
ssh-keygen -t rsa -b 4096 -C "%key_email%" -f "%USERPROFILE%\.ssh\%key_name%"

if %errorlevel% equ 0 (
    echo ✅ SSH key pair generated successfully
    echo Public key location: %USERPROFILE%\.ssh\%key_name%.pub
    echo Private key location: %USERPROFILE%\.ssh\%key_name%
) else (
    echo ❌ Failed to generate SSH key pair
)

echo.
pause
goto SSH_MENU

:COPY_SSH_KEY
cls
echo 📋 Copy Public Key to Remote Server
echo.

set /p server="Enter server address (user@hostname): "
set /p key_file="Enter key file path (default: %USERPROFILE%\.ssh\id_rsa.pub): "

if "%key_file%"=="" set key_file=%USERPROFILE%\.ssh\id_rsa.pub

if not exist "%key_file%" (
    echo ❌ Key file not found: %key_file%
    pause
    goto SSH_MENU
)

echo.
echo Copying public key to %server%...
echo Key file: %key_file%

echo.
echo ⚠️  This will copy your public key to the remote server
echo You may be prompted for the server password

echo.
echo Copying key...
type "%key_file%" | ssh %server% "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

if %errorlevel% equ 0 (
    echo ✅ Public key copied successfully
) else (
    echo ❌ Failed to copy public key
)

echo.
pause
goto SSH_MENU

:ADD_KNOWN_HOSTS
cls
echo 🔧 Add Server to Known Hosts
echo.

set /p server="Enter server address (hostname or IP): "

if "%server%"=="" (
    echo ❌ Server address cannot be empty
    pause
    goto SSH_MENU
)

echo.
echo Adding %server% to known hosts...
ssh-keyscan -H %server% >> "%USERPROFILE%\.ssh\known_hosts"

if %errorlevel% equ 0 (
    echo ✅ Server added to known hosts
) else (
    echo ❌ Failed to add server to known hosts
)

echo.
pause
goto SSH_MENU

:SSH_HARDENING
cls
echo 🛡️ SSH Hardening
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SSH HARDENING OPTIONS                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 🔧 Generate SSH Config
echo 2. 🛡️  Security Recommendations
echo 3. 🔍 Check SSH Configuration
echo 4. 🔙 Back to SSH Menu
echo.

set /p hardening_choice="Enter your choice (1-4): "

if "%hardening_choice%"=="1" goto GENERATE_SSH_CONFIG
if "%hardening_choice%"=="2" goto SSH_SECURITY_RECOMMENDATIONS
if "%hardening_choice%"=="3" goto CHECK_SSH_CONFIG
if "%hardening_choice%"=="4" goto SSH_MENU

echo ❌ Invalid choice. Please try again.
pause
goto SSH_HARDENING

:GENERATE_SSH_CONFIG
cls
echo 🔧 Generate SSH Config
echo.

echo Creating SSH config file...
echo # SSH Configuration for Marin Pest Control > "%USERPROFILE%\.ssh\config"
echo # Generated on %date% %time% >> "%USERPROFILE%\.ssh\config"
echo. >> "%USERPROFILE%\.ssh\config"
echo Host * >> "%USERPROFILE%\.ssh\config"
echo     ServerAliveInterval 60 >> "%USERPROFILE%\.ssh\config"
echo     ServerAliveCountMax 3 >> "%USERPROFILE%\.ssh\config"
echo     TCPKeepAlive yes >> "%USERPROFILE%\.ssh\config"
echo     Compression yes >> "%USERPROFILE%\.ssh\config"
echo     ForwardAgent yes >> "%USERPROFILE%\.ssh\config"
echo. >> "%USERPROFILE%\.ssh\config"
echo # Marin Pest Control Servers >> "%USERPROFILE%\.ssh\config"
echo Host marin-prod >> "%USERPROFILE%\.ssh\config"
echo     HostName your-production-server.com >> "%USERPROFILE%\.ssh\config"
echo     User root >> "%USERPROFILE%\.ssh\config"
echo     Port 22 >> "%USERPROFILE%\.ssh\config"
echo     IdentityFile ~/.ssh/id_rsa >> "%USERPROFILE%\.ssh\config"
echo. >> "%USERPROFILE%\.ssh\config"
echo Host marin-dev >> "%USERPROFILE%\.ssh\config"
echo     HostName your-dev-server.com >> "%USERPROFILE%\.ssh\config"
echo     User developer >> "%USERPROFILE%\.ssh\config"
echo     Port 22 >> "%USERPROFILE%\.ssh\config"
echo     IdentityFile ~/.ssh/id_rsa >> "%USERPROFILE%\.ssh\config"

echo ✅ SSH config file created at %USERPROFILE%\.ssh\config
echo.
echo ⚠️  Please edit the config file to add your actual server details

echo.
pause
goto SSH_HARDENING

:SSH_SECURITY_RECOMMENDATIONS
cls
echo 🛡️ SSH Security Recommendations
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SECURITY RECOMMENDATIONS                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 🔑 Use SSH key authentication instead of passwords
echo 2. 🚫 Disable root login
echo 3. 🔒 Change default SSH port (22)
echo 4. 🛡️  Use fail2ban to prevent brute force attacks
echo 5. 🔐 Enable two-factor authentication
echo 6. 📝 Keep SSH server updated
echo 7. 🔍 Regularly audit SSH logs
echo 8. 🚫 Disable unused authentication methods
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    RECOMMENDED SSH CONFIG                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo # /etc/ssh/sshd_config
echo Port 2222
echo PermitRootLogin no
echo PasswordAuthentication no
echo PubkeyAuthentication yes
echo AuthorizedKeysFile .ssh/authorized_keys
echo MaxAuthTries 3
echo MaxSessions 2
echo ClientAliveInterval 300
echo ClientAliveCountMax 2
echo.

echo.
pause
goto SSH_HARDENING

:CHECK_SSH_CONFIG
cls
echo 🔍 Check SSH Configuration
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SSH CONFIG STATUS                        ║
echo ╚══════════════════════════════════════════════════════════════╝

if exist "%USERPROFILE%\.ssh\config" (
    echo ✅ SSH config file exists
    echo.
    echo Config file contents:
    type "%USERPROFILE%\.ssh\config"
) else (
    echo ❌ SSH config file not found
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SSH KEYS                                 ║
echo ╚══════════════════════════════════════════════════════════════╝

if exist "%USERPROFILE%\.ssh\id_rsa" (
    echo ✅ Private key exists: id_rsa
) else (
    echo ❌ Private key not found: id_rsa
)

if exist "%USERPROFILE%\.ssh\id_rsa.pub" (
    echo ✅ Public key exists: id_rsa.pub
) else (
    echo ❌ Public key not found: id_rsa.pub
)

echo.
pause
goto SSH_HARDENING

:SSH_CONFIG
cls
echo 📊 SSH Configuration
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SSH CONFIGURATION                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1. 📋 View SSH Config
echo 2. ✏️  Edit SSH Config
echo 3. 🔍 View SSH Keys
echo 4. 🔙 Back to SSH Menu
echo.

set /p config_choice="Enter your choice (1-4): "

if "%config_choice%"=="1" goto VIEW_SSH_CONFIG
if "%config_choice%"=="2" goto EDIT_SSH_CONFIG
if "%config_choice%"=="3" goto VIEW_SSH_KEYS
if "%config_choice%"=="4" goto SSH_MENU

echo ❌ Invalid choice. Please try again.
pause
goto SSH_CONFIG

:VIEW_SSH_CONFIG
cls
echo 📋 SSH Configuration
echo.

if exist "%USERPROFILE%\.ssh\config" (
    echo SSH Config File:
    type "%USERPROFILE%\.ssh\config"
) else (
    echo ❌ SSH config file not found
)

echo.
pause
goto SSH_CONFIG

:EDIT_SSH_CONFIG
cls
echo ✏️ Edit SSH Config
echo.

if exist "%USERPROFILE%\.ssh\config" (
    echo Opening SSH config in notepad...
    notepad "%USERPROFILE%\.ssh\config"
) else (
    echo ❌ SSH config file not found
    echo Please generate SSH config first
)

echo.
pause
goto SSH_CONFIG

:VIEW_SSH_KEYS
cls
echo 🔍 SSH Keys
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    AVAILABLE SSH KEYS                       ║
echo ╚══════════════════════════════════════════════════════════════╝

if exist "%USERPROFILE%\.ssh" (
    dir "%USERPROFILE%\.ssh\*.pub"
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║                    PUBLIC KEY CONTENTS                      ║
    echo ╚══════════════════════════════════════════════════════════════╝
    if exist "%USERPROFILE%\.ssh\id_rsa.pub" (
        echo id_rsa.pub:
        type "%USERPROFILE%\.ssh\id_rsa.pub"
    )
) else (
    echo ❌ SSH directory not found
)

echo.
pause
goto SSH_CONFIG

:SSH_TEST
cls
echo 🔍 SSH Connection Test
echo.

set /p test_server="Enter server to test (user@hostname): "

if "%test_server%"=="" (
    echo ❌ Server address cannot be empty
    pause
    goto SSH_MENU
)

echo.
echo Testing SSH connection to %test_server%...
echo.

ssh -o ConnectTimeout=10 -o BatchMode=yes %test_server% "echo 'SSH connection successful'"

if %errorlevel% equ 0 (
    echo ✅ SSH connection successful
) else (
    echo ❌ SSH connection failed
    echo.
    echo Troubleshooting tips:
    echo 1. Check if SSH service is running on remote server
    echo 2. Verify your SSH key is authorized
    echo 3. Check firewall settings
    echo 4. Verify server address and port
)

echo.
pause
goto SSH_MENU

:EXIT
cls
echo 👋 Goodbye!
echo.
echo Thank you for using Marin Pest Control Dashboard Management Console.
echo.
timeout /t 2 /nobreak >nul
exit /b 0
