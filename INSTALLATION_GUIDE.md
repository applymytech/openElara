# openElara Installation Guide

## System Requirements

Before installing openElara, please ensure you have the following dependencies installed on your system:

1. **Python 3.10 or higher** - Required for AI/ML features
2. **Java (OpenJDK 17 or higher)** - Required for document processing
3. **Tesseract OCR** - Required for image text extraction

## Installation Steps

### Step 1: Install System Dependencies

If you don't have the required dependencies installed, please download and install them:

- **Python 3.10+**: [Download from python.org](https://www.python.org/downloads/windows/)
- **Java (Temurin/OpenJDK 17+)**: [Download from adoptium.net](https://adoptium.net/)
- **Tesseract OCR**: [Download from GitHub](https://github.com/UB-Mannheim/tesseract/wiki)

**Important Notes for Python Installation:**
- Make sure to check "Add Python to PATH" during installation
- Verify the installation by opening a new command prompt and running `python --version`

### Step 2: Run the openElara Installer

1. Download the openElara installer from the GitHub releases page
2. Run the installer (openelara-Setup-1.1.0.exe)
3. The installer will check for the required dependencies
4. If any dependencies are missing, you'll be prompted with download links
5. Follow the installation wizard to complete the installation

### Step 3: First Run Setup

When you first run openElara:

1. The application will automatically install Python package dependencies
2. This process may take a few minutes depending on your internet connection
3. You'll see a console window showing the installation progress
4. Once completed, the main application window will appear

## Troubleshooting

### If Python Dependencies Fail to Install

If the automatic Python dependency installation fails:

1. Open a command prompt as Administrator
2. Navigate to the openElara installation directory
3. Run: `python backend\setup_python_env.py`
4. Restart openElara

### Common Issues

**"Python not found" error:**
- Ensure Python is installed and added to your PATH
- Restart your computer after Python installation
- Try running the installer from a new command prompt

**"pip not found" error:**
- This usually means Python wasn't installed correctly
- Reinstall Python and ensure "Add Python to PATH" is checked

**Missing Java/Tesseract:**
- Install the missing dependencies and restart openElara
- Some features may be disabled until dependencies are installed

## Features That Require Dependencies

- **Python**: RAG system, document processing, AI/ML features
- **Java**: Document conversion (DOCX, PDF, etc.)
- **Tesseract**: Image text extraction (OCR)

Features will gracefully degrade if dependencies are missing, but full functionality requires all dependencies.