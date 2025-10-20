openElara Installer notes
=========================

This installer is built with electron-builder using NSIS. The installer includes
an interactive pre-install check which warns users if core runtime dependencies
are missing and points them to trusted download locations. The installer does
NOT attempt to auto-install these external dependencies; users should install
them manually to ensure correct configuration.

Required dependencies (as of 2025-10-19):

- Python 3.10+ (Windows installers): https://www.python.org/downloads/windows/
- Java (Temurin/OpenJDK 17+): https://adoptium.net/
- Tesseract OCR (Windows builds): https://github.com/UB-Mannheim/tesseract/wiki

Signing (optional):

If you wish to sign installers automatically during build, place a file at
`build/signing-keys.env` with environment variable entries matching the
electron-builder expectations, for example:

CERTIFICATE_FILE="C:\\\\path\\to\\cert.pfx"
CERTIFICATE_PASSWORD="yourpassword"

The build script `prepare-signing-optional.js` will load this file into the
environment for the build process. If the file is missing, signing is skipped
and the build continues.

Notes for maintainers:

- Edit `build/installer.nsh` to update dependency links or messaging. Keep the
  messaging clear and show the download pages rather than automating external
  installs.
- The NSIS script uses a custom page to show checks before installation. This
  is intentionally user-facing to avoid leaving users with a non-functional
  app.
