# File Converter - Standalone Python Tool

**Convert PDF, DOCX, images, and other formats to Markdown for AI ingestion**

---

## 🎯 What It Does

Converts various file formats to clean, AI-friendly Markdown:
- **PDF** → Markdown (with OCR support)
- **DOCX/DOC** → Markdown
- **Images (JPG/PNG/etc.)** → Markdown (with OCR)
- **HTML** → Markdown
- **XLSX/XLS** → Markdown tables

Originally built as one of the first openElara tools, now available as a lightweight standalone!

---

## ⚡ Quick Start

### Option 1: Run from Source
```bash
# Install dependencies
pip install -r requirements.txt

# Run the converter
python file_converter.py
```

### Option 2: Build .exe (Windows)
```bash
pip install -r requirements.txt
pip install pyinstaller
build.bat
# Your .exe will be in dist/file_converter.exe
```

### Option 3: Download Pre-Built (Coming Soon)
Download `file-converter.exe` from [Releases](https://github.com/applymytech/openElara/releases)

---

## 🖼️ Interface

**TKinter UI (Windows 3.11 style!):**

```
┌─────────────────────────────────────────┐
│  File Converter to Markdown             │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Drag & Drop Files or Folders     │ │
│  │         Here                      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Choose Files]  [Choose Folder]       │
│                                         │
│  Options:                               │
│  ☑ Enable OCR (for scanned PDFs)       │
│  ☑ Compress images                     │
│  ☑ Extract tables (XLSX/DOCX)          │
│                                         │
│  Output folder: [C:\Converted]  [...]  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Status:                           │ │
│  │ Ready to convert...               │ │
│  │ ████████████░░░░░░░ 60%          │ │
│  └───────────────────────────────────┘ │
│                                         │
│       [Convert]        [Clear]         │
└─────────────────────────────────────────┘
```

---

## 📋 Features

### ✅ Supported Input Formats
- **Documents:** PDF, DOCX, DOC, RTF, TXT
- **Spreadsheets:** XLSX, XLS, CSV
- **Images:** JPG, PNG, WEBP, BMP, TIFF (with OCR)
- **Web:** HTML, HTM
- **Code:** Automatic syntax highlighting preservation

### ✅ Conversion Features
- **OCR** - Extract text from scanned PDFs and images (Tesseract)
- **Table extraction** - Preserve table structure in Markdown
- **Image compression** - Reduce file size before OCR
- **Batch processing** - Convert entire folders
- **Metadata preservation** - Keep document info in frontmatter
- **Error recovery** - Continue on failures, log errors

### ✅ Output Options
- Clean Markdown optimized for LLMs
- Optional frontmatter (YAML metadata)
- Organized output structure
- Conversion log (what succeeded/failed)

---

## 🔧 Dependencies

```
Pillow>=10.0.0          # Image processing
pytesseract>=0.3.10     # OCR engine
pypandoc>=1.13          # Document conversion
python-docx>=1.0.0      # DOCX handling
pdfplumber>=0.10.0      # PDF extraction
openpyxl>=3.1.0         # Excel handling
html2text>=2020.1.16    # HTML to Markdown
```

**External:**
- **Tesseract OCR** - Download from https://github.com/UB-Mannheim/tesseract/wiki
  - Install to default path or set TESSERACT_PATH environment variable

---

## 📦 Building for Distribution

### Windows .exe
```bash
# Install build dependencies
pip install -r requirements.txt
pip install pyinstaller

# Build
build.bat

# Output: dist/file_converter.exe (~15MB)
```

### macOS .app (Coming Soon)
```bash
pyinstaller --windowed --onefile --name "File Converter" file_converter.py
```

### Linux AppImage (Coming Soon)
```bash
# Will be added in future release
```

---

## 🛠️ Usage Examples

### Convert Single File
1. Launch `file_converter.exe`
2. Drag PDF onto window
3. Click "Convert"
4. Done! Markdown saved to output folder

### Batch Convert Folder
1. Click "Choose Folder"
2. Select folder with mixed files (PDFs, DOCX, images)
3. Enable OCR if needed
4. Click "Convert"
5. All files converted, organized in output folder

### OCR Scanned Document
1. Drag scanned PDF
2. ☑ Enable OCR
3. ☑ Compress images (faster OCR)
4. Click "Convert"
5. Text extracted and saved as Markdown

---

## 🎨 Customization

Edit `file_converter.py` to customize:
- **Output format** - Change Markdown template
- **OCR language** - Add other Tesseract language packs
- **File filters** - Add/remove supported formats
- **UI theme** - Adjust TKinter colors/fonts

---

## 🐛 Troubleshooting

### "Tesseract not found"
- Install Tesseract OCR
- Add to PATH or set TESSERACT_PATH environment variable

### "Pandoc not found"
- Install Pandoc from https://pandoc.org/installing.html

### "Out of memory" on large PDFs
- Enable image compression
- Process files individually instead of batch

### OCR results are poor
- Increase image quality before conversion
- Use higher DPI scans
- Try different Tesseract language packs

---

## 📝 File Structure

```
file-converter/
├── file_converter.py          # Main TKinter UI
├── worker_converter.py        # Conversion logic
├── requirements.txt           # Dependencies
├── build.bat                  # Windows build script
├── build.sh                   # macOS/Linux build script
├── README.md                  # This file
└── icon.ico                   # App icon
```

---

## 🤝 Contributing

Improvements welcome!
- Better OCR accuracy
- More input formats
- UI enhancements
- Performance optimizations

---

## 📜 License

Same as openElara (see main LICENSE)

---

## 🔗 Related Tools

- **Image Processor** - Advanced image operations
- **Watermark Viewer** - Read metadata from files
- **Token Manager** - Count tokens in converted files

---

*Built from the original openElara conversion workers - now standalone!* 🎉
