@echo off
REM Build script for Watermark Viewer (Windows)

echo ===================================
echo Building Watermark Viewer to .exe
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
    --name "Watermark Viewer" ^
    --icon=icon.ico ^
    --add-data "worker_watermark.py;." ^
    watermark_viewer.py

echo.
echo ===================================
echo Build complete!
echo.
echo Output: dist\Watermark Viewer.exe
echo ===================================
echo.

pause
