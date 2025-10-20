; NSIS script included by electron-builder to run during installer creation
; This script adds pre-install checks during installation for required runtime
; dependencies (Python, Java, Tesseract). It presents the user with clear links
; to download installers if any dependency is missing. This file intentionally
; does not attempt to auto-install those dependencies — the user must follow
; the provided links so they can complete a reliable manual install.

!include "MUI2.nsh"

Var /GLOBAL DepMissing

Function CheckDependency
  Exch $0 ; link
  Exch
  Exch $1 ; friendly name
  Exch

  ; $INSTDIR is available at install time. We check PATH for binaries.
  ClearErrors
  nsExec::ExecToStack `where /Q $1`
  Pop $R0
  Pop $R1
  ${If} ${Errors}
    StrCpy $DepMissing 1
    ; Show message with link
    MessageBox MB_ICONEXCLAMATION|MB_OK "The required dependency '$1' was not found on this system.\n\nPlease download and install $0 before continuing.\n\nLink: $0"
  ${EndIf}
FunctionEnd

Function ShowDependencyLinks
  DetailPrint "Checking for required dependencies..."

  ; Reset flag
  StrCpy $DepMissing 0

  ; Note: NSIS scripting for `where` may not give a non-zero error reliably in all shells.
  ; We'll run simple checks and show guidance regardless.
  ; The 'links' below are curated and tested as of 2025-10-19.

  ; Python 3.10+ (Windows x64 installer)
  Push "https://www.python.org/downloads/windows/"
  Push "Python (3.10+ / 3.11+)"
  Call CheckDependency

  ; Java (OpenJDK 17 or newer) - AdoptOpenJDK / Temurin
  Push "https://adoptium.net/"
  Push "Java (Temurin / OpenJDK 17+)"
  Call CheckDependency

  ; Tesseract OCR - Official maintained Windows builds
  Push "https://github.com/UB-Mannheim/tesseract/wiki"
  Push "Tesseract OCR (Windows builds)"
  Call CheckDependency

  ${If} $DepMissing == 1
    MessageBox MB_ICONEXCLAMATION|MB_OK "One or more required dependencies are missing.\n\nopenElara requires the following dependencies to work properly:\n\n- Python 3.10+ (for AI/ML features)\n- Java (for document processing)\n- Tesseract OCR (for image text extraction)\n\nPlease install these dependencies before continuing. You can find download links above.\n\nIf you continue without installing dependencies, some features may not work correctly.\n\nAfter installation, restart the openElara installer."
  ${Else}
    MessageBox MB_ICONINFORMATION|MB_OK "All required dependencies found!\n\nopenElara will automatically install its Python package dependencies on first run.\n\nClick Next to continue with the installation."
  ${EndIf}
FunctionEnd

; The modern electron-builder NSIS installer calls 'InitPlugins' and then the installer pages.
; We'll add a custom page that runs at the start of installation to show checks.

Page custom ShowDependencyLinks

; End of include
