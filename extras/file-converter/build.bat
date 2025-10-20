@echo off
REM Build script for File Converter (Windows)

echo ===================================
echo Building File Converter to .exe
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
    --name "File Converter" ^
    --icon=icon.ico ^
    --add-data "worker_converter.py;." ^
    file_converter.py

echo.
echo ===================================
echo Build complete!
echo.
echo Output: dist\File Converter.exe
echo ===================================
echo.

pause
