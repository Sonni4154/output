@echo off
echo Marin Pest Control Dashboard - Upload to Server
echo.

REM Configuration - Update these with your server details
set SERVER_USER=your_username
set SERVER_HOST=your_server_ip
set SERVER_PATH=/tmp

echo Creating project archive...
tar -czf dashboard.tar.gz --exclude=node_modules --exclude=.git --exclude=dist --exclude=*.log .

echo.
echo Uploading to server...
scp dashboard.tar.gz %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/

echo.
echo Upload completed!
echo.
echo Next steps on your server:
echo 1. Extract files: sudo tar -xzf /tmp/dashboard.tar.gz -C /var/dashboard
echo 2. Set permissions: sudo chown -R www-data:www-data /var/dashboard
echo 3. Make executable: sudo chmod +x /var/dashboard/deploy.sh
echo 4. Run deployment: sudo /var/dashboard/deploy.sh
echo.
pause
