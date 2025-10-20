@echo off
REM Build script for Token Manager (Windows)

echo ===================================
echo Building Token Manager to .exe
echo ===================================

REM Check if PyInstaller is installed
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo PyInstaller not found. Installing...
    pip install pyinstaller
)

echo.
echo Building executable...
echo.

REM Build the exe
pyinstaller --noconfirm ^
    --onefile ^
    --windowed ^
    --name "Token Manager" ^
    --icon=icon.ico ^
    --add-data "worker_token_manager.py;." ^
    token_manager.py

echo.
echo ===================================
echo Build complete!
echo.
echo Output: dist\Token Manager.exe
echo ===================================
echo.

pause
