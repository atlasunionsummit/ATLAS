@echo off
echo ===================================================
echo Atlas Union Summit - Frontend Local Launcher
echo ===================================================
echo.

:: Check for yarn first using yarn --version
call yarn --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto check_npm

echo [1/2] Found Yarn. Using Yarn to manage packages...
set INSTALL_CMD=yarn install
set START_CMD=yarn start
goto start_server

:check_npm
:: Check for npm using npm --version
call npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto no_pkg_manager

echo [1/2] Found NPM. Using NPM to manage packages...
set INSTALL_CMD=npm install
set START_CMD=npm start
goto start_server

:no_pkg_manager
echo ERROR: Neither Yarn nor Node.js (npm) was found in your PATH.
echo Please download and install Node.js from https://nodejs.org/
pause
exit /b 1

:start_server
echo.
echo [2/2] Starting Frontend Server...
cd frontend
start "Frontend Server" cmd /k "%INSTALL_CMD% && %START_CMD%"

echo.
echo Launch sequence initiated!
echo A new terminal window has been opened for the frontend server.
echo.
pause
