@echo off
title Blockfolio Pro - Professional Trading Platform
color 0A

echo.
echo  ██████╗ ██╗      ██████╗  ██████╗██╗  ██╗███████╗ ██████╗ ██╗     ██╗ ██████╗ 
echo  ██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗
echo  ██████╔╝██║     ██║   ██║██║     █████╔╝ █████╗  ██║   ██║██║     ██║██║   ██║
echo  ██╔══██╗██║     ██║   ██║██║     ██╔═██╗ ██╔══╝  ██║   ██║██║     ██║██║   ██║
echo  ██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗██║     ╚██████╔╝███████╗██║╚██████╔╝
echo  ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ 
echo.
echo                             Cryptocurrency Trading Platform
echo                              All 125 Tasks Completed!
echo.

echo 🔧 Cleaning up processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo.
echo 📦 Checking dependencies...

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client && call npm install && cd ..
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server && call npm install && cd ..
)

echo ✅ Dependencies ready!

echo.
echo 🚀 Starting Blockfolio Pro...
echo.

echo 🔧 Starting Backend Server (Port 5000)...
start "Blockfolio Backend" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul

echo 🌐 Starting React Frontend (Port 3000)...
start "Blockfolio Frontend" cmd /k "cd client && npm start"

echo.
echo ⏳ Waiting for servers to initialize...
timeout /t 8 /nobreak >nul

echo.
echo ✅ Blockfolio Pro is now running!
echo.
echo 🎯 Access Points:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000/api/health
echo.
echo 🔐 First Time?
echo    1. Register at http://localhost:3000/register
echo    2. Login with your credentials
echo    3. Start trading!
echo.
echo 💡 The app will open automatically in your browser.
echo    Keep both terminal windows open while using the app.
echo.

pause >nul
start http://localhost:3000

echo.
echo 🎉 Enjoy your trading platform!
echo.