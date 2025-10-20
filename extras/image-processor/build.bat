@echo off
REM Build script for Image Processor (Windows)

echo ===================================
echo Building Image Processor to .exe
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
    --name "Image Processor" ^
    --icon=icon.ico ^
    --add-data "worker_image_processor.py;." ^
    image_processor.py

echo.
echo ===================================
echo Build complete!
echo.
echo Output: dist\Image Processor.exe
echo ===================================
echo.

pause
