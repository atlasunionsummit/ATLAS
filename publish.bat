@echo off
setlocal enabledelayedexpansion
echo ===================================================
echo   Atlas Union Summit - GitHub Publishing Assistant
echo ===================================================
echo.

:: 1. Ensure we are in the correct directory
cd /d "%~dp0"
echo Project directory: %CD%
echo.

:: 2. Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/ and try again.
    goto end
)
echo [OK] Git is installed.

:: 3. Initialize Git repository if not already done
if not exist .git (
    echo Initializing local Git repository...
    git init
    git checkout -b main
) else (
    echo [OK] Local Git repository already initialized.
)

:: 4. Add files and make initial commit
echo.
echo Staging project files...
git add .

:: Check if there are changes to commit
git status --porcelain | findstr /R "^" >nul
if %ERRORLEVEL% EQU 0 (
    echo Creating initial commit...
    git commit -m "Initial commit - Atlas Union Summit v2"
) else (
    echo [OK] No new changes to commit.
)

:: 5. Check if GitHub CLI is installed
echo.
where gh >nul 2>&1
if %ERRORLEVEL% EQU 0 goto gh_installed

echo GitHub CLI (gh) was not found in your PATH.
echo.
echo To publish this repository, please:
echo 1. Go to https://github.com/new and create a private repository.
echo 2. Copy the repository URL (e.g., https://github.com/yourusername/atlasunionsummitv2.git)
echo.
set /p REPO_URL="Enter the GitHub Repository URL: "
if "!REPO_URL!"=="" (
    echo [ERROR] Repository URL cannot be empty.
    goto end
)
git remote remove origin >nul 2>&1
git remote add origin !REPO_URL!
echo.
echo Pushing to GitHub...
git push -u origin main
goto check_success

:gh_installed
echo [OK] GitHub CLI (gh) is installed.
echo.
echo Checking GitHub authentication status...
gh auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] You are not logged in to GitHub via CLI.
    echo Launching GitHub CLI authentication. Please follow the prompts...
    echo.
    gh auth login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] GitHub authentication failed.
        goto end
    )
) else (
    echo [OK] Authenticated with GitHub.
)

:: Prompt for repository name
echo.
set REPO_NAME=atlasunionsummitv2
set /p USER_REPO_NAME="Enter name for the GitHub repository [default: %REPO_NAME%]: "
if not "!USER_REPO_NAME!"=="" (
    set REPO_NAME=!USER_REPO_NAME!
)

echo.
echo Creating private GitHub repository: !REPO_NAME!...
:: Create private repo and push
gh repo create !REPO_NAME! --private --source=. --remote=origin --push
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to create repository via gh CLI.
    echo This could be because the repository already exists.
    echo.
    echo Attempting to push to existing repository...
    set /p REPO_URL="Enter the existing GitHub Repository URL: "
    if not "!REPO_URL!"=="" (
        git remote remove origin >nul 2>&1
        git remote add origin !REPO_URL!
        git push -u origin main
    )
)

:check_success
echo.
git remote -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo [SUCCESS] Project successfully published to GitHub!
    echo ===================================================
) else (
    echo [WARNING] Remote remote origin not set.
)

:end
echo.
pause
