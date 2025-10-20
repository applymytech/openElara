# OpenElara Standalone Tools - User Manual

**Version 1.0 | October 2025**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Installation](#installation)
4. [Tool Guides](#tool-guides)
   - [File Converter](#file-converter)
   - [Image Processor](#image-processor)
   - [Watermark Viewer](#watermark-viewer)
   - [Token Manager](#token-manager)
5. [Building Executables](#building-executables)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Usage](#advanced-usage)

---

## Introduction

The **OpenElara Standalone Tools** are a collection of independent Python applications designed to work alongside (or separately from) the main OpenElara application. Each tool serves a specific purpose in AI-assisted workflows.

### Philosophy: "LEGO Blocks"

Each tool is:
- **Self-contained:** Works independently, no dependencies on main app
- **Modular:** Clean separation of UI and logic
- **Distributable:** Can be packaged as standalone .exe files
- **Adaptable:** Source code is open for modification
- **Educational:** Clear patterns for developers

### The Four Tools

1. **File Converter** - Convert documents to Markdown for RAG ingestion
2. **Image Processor** - Batch image operations (resize, convert, enhance, etc.)
3. **Watermark Viewer** - View and verify ethical AI watermark metadata
4. **Token Manager** - Analyze token usage and costs for RAG + LLM workflows

---

## Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Install All Tools (One Command)

```bash
# Navigate to extras folder
cd extras

# Install all dependencies
pip install -r requirements.txt
```

### Install Individual Tools

```bash
# File Converter
pip install -r file-converter/requirements.txt

# Image Processor
pip install -r image-processor/requirements.txt

# Watermark Viewer
pip install -r watermark-viewer/requirements.txt

# Token Manager
pip install -r token-manager/requirements.txt
```

### Run a Tool

```bash
# Navigate to tool folder
cd file-converter

# Run the tool
python file_converter.py
```

---

## Installation

### Step 1: Verify Python

```bash
python --version
```

**Expected:** Python 3.8 or higher

**If not installed:**
- Windows: Download from [python.org](https://python.org)
- During installation, check "Add Python to PATH"

### Step 2: Install Dependencies

**Option A: Install Everything**
```bash
cd openElara/extras
pip install -r requirements.txt
```

**Option B: Install Per-Tool**
```bash
cd openElara/extras/file-converter
pip install -r requirements.txt
python file_converter.py
```

### Step 3: External Dependencies

Some tools require external software:

#### File Converter (OCR)
- **Tesseract OCR** (for image text extraction)
- Download: https://github.com/UB-Mannheim/tesseract/wiki
- After install, add to PATH or note installation directory

#### Watermark Viewer (Video)
- **ffmpeg** (for video metadata extraction)
- Download: https://ffmpeg.org/download.html
- Add to PATH for automatic detection

---

## Tool Guides

### File Converter

**Purpose:** Convert various document formats to Markdown for RAG ingestion.

**Supported Formats:**
- **PDF** → Markdown (with OCR fallback)
- **DOCX** → Markdown (preserves tables)
- **XLSX** → Markdown tables
- **Images** (JPG/PNG) → Markdown via OCR
- **HTML** → Markdown

**How to Use:**

1. **Launch the tool:**
   ```bash
   cd extras/file-converter
   python file_converter.py
   ```

2. **Add files:**
   - Drag & drop files into the blue zone
   - OR click "Browse" button

3. **Configure options:**
   - ✅ **Use OCR:** Extract text from images/scanned PDFs
   - ✅ **Compress images:** Reduce image file sizes
   - ✅ **Extract tables:** Preserve table structure
   - ✅ **Add metadata:** Include file info in output

4. **Select output folder:**
   - Click "Browse" next to "Output Folder"
   - Choose destination

5. **Convert:**
   - Click "🚀 CONVERT FILES"
   - Watch progress in status log
   - Files saved as `{filename}.md`

**Tips:**
- OCR works best with clear, high-contrast images
- Large PDFs may take several minutes
- Tables in DOCX are converted to Markdown tables
- Output files are named `{original}_converted.md`

---

### Image Processor

**Purpose:** Batch image operations for content workflows.

**Operations:**

1. **Convert** - Change format (PNG/JPG/WEBP/BMP/TIFF/GIF)
2. **Resize** - Scale images (with aspect ratio option)
3. **Compress** - Reduce file size (quality slider 1-100)
4. **Enhance** - Adjust brightness/contrast/sharpness
5. **Rotate** - Rotate 90/180/270 degrees
6. **Crop** - Crop to specific dimensions

**How to Use:**

1. **Launch:**
   ```bash
   cd extras/image-processor
   python image_processor.py
   ```

2. **Add images:**
   - Drag & drop into the zone
   - OR click "Browse"

3. **Select operation:**
   - Click radio button for desired operation
   - Settings panel updates dynamically

4. **Configure settings:**
   - **Convert:** Choose target format
   - **Resize:** Set width/height, aspect ratio toggle
   - **Compress:** Adjust quality slider
   - **Enhance:** Adjust brightness/contrast/sharpness
   - **Rotate:** Select angle
   - **Crop:** Enter pixel coordinates

5. **Process:**
   - Select output folder
   - Click "🚀 PROCESS IMAGES"
   - Files saved as `{filename}_processed.{ext}`

**Tips:**
- Maintain aspect ratio for professional results
- Quality 85 is good balance (compress)
- Brightness/contrast/sharpness: 1.0 = no change
- Batch processing saves time on multiple files

---

### Watermark Viewer

**Purpose:** View and verify ethical AI watermark metadata from OpenElara-generated content.

**What It Does:**
- Extracts EXIF metadata from images
- Reads ffmpeg metadata from videos
- Parses sidecar JSON files
- Verifies content signatures (SHA-256)
- Validates OpenElara watermarks

**How to Use:**

1. **Launch:**
   ```bash
   cd extras/watermark-viewer
   python watermark_viewer.py
   ```

2. **Load file:**
   - Drag & drop image/video
   - OR click "Browse"

3. **Analyze:**
   - Click "🔎 Analyze"
   - View results in tabs

**Tabs Explained:**

- **Summary:** High-level watermark status
  - ✅ Watermark detected
  - ⚠️ No watermark found
  - Generator, UUID, model, timestamp

- **EXIF/Metadata:** Raw metadata dump
  - All extracted EXIF fields
  - Image properties
  - Custom metadata fields

- **Sidecar JSON:** Complete watermark data
  - Full JSON structure
  - All embedded fields
  - Technical details

- **Verification:** Content integrity checks
  - Hash verification
  - File integrity status
  - Ethical AI notice

**Export:**
- Click "💾 Export Metadata"
- Save as JSON file
- Share or archive watermark data

**Tips:**
- Watermarks are invisible (metadata only)
- Sidecar JSON files have same name + `.json`
- Hash mismatch = file was modified
- No watermark = not OpenElara content

---

### Token Manager

**Purpose:** Analyze token usage and costs for RAG + LLM workflows.

**What It Does:**
- Counts tokens using tiktoken (OpenAI standard)
- Supports 10 models (GPT-4, Claude, Llama, Mistral, Gemini)
- Analyzes RAG chunk distribution
- Estimates costs (embeddings + prompt + completion)
- Projects scaling costs (10/100/1K/10K queries)

**How to Use:**

1. **Launch:**
   ```bash
   cd extras/token-manager
   python token_manager.py
   ```

2. **Add files/folders:**
   - Click "📄 Add Files" for individual files
   - Click "📁 Add Folder" for recursive scan
   - Drag & drop files/folders

3. **Configure:**
   - **Model:** Select target LLM
   - **RAG Chunk Size:** Tokens per chunk (default 1000)
   - **Include embeddings:** Toggle embedding costs

4. **Analyze:**
   - Click "🔬 ANALYZE TOKENS"
   - Wait for analysis (progress bar shows activity)

**Tabs Explained:**

- **Summary:** Quick overview
  - Total tokens, chunks, files
  - Per-query cost
  - Projected costs (10/100/1K queries)
  - RAG efficiency metrics

- **Cost Breakdown:** Detailed pricing
  - Pricing per 1M tokens
  - Component costs (prompt/completion/embeddings)
  - Scaling projections
  - Optimization tips

- **RAG Analysis:** Chunk statistics
  - Chunk distribution
  - Efficiency percentage
  - Storage estimates
  - Performance recommendations

- **Per-File Details:** Individual breakdowns
  - Sorted by token count
  - Tokens, chunks, size per file
  - Identifies large files

**Supported Models:**

| Model | Provider | Pricing (per 1M tokens) |
|-------|----------|-------------------------|
| GPT-4 | OpenAI | $30 prompt / $60 completion |
| GPT-4-Turbo | OpenAI | $10 prompt / $30 completion |
| GPT-3.5-Turbo | OpenAI | $0.50 prompt / $1.50 completion |
| Claude 3 Opus | Anthropic | $15 prompt / $75 completion |
| Claude 3 Sonnet | Anthropic | $3 prompt / $15 completion |
| Claude 3 Haiku | Anthropic | $0.25 prompt / $1.25 completion |
| Llama 3 70B | Meta | $0.90 / $0.90 |
| Llama 3 8B | Meta | $0.20 / $0.20 |
| Mistral Large | Mistral | $4 prompt / $12 completion |
| Gemini Pro | Google | $0.50 prompt / $1.50 completion |

**Tips:**
- Use RAG chunk size 500-1500 tokens for best results
- Smaller chunks = more embeddings cost, faster retrieval
- Larger chunks = less storage, more context per chunk
- Efficiency 80-120% = well-optimized
- Cache frequently accessed chunks to save costs
- Test with cheap models first (Gemini Pro, GPT-3.5)

**Cost Optimization:**
1. Start with smaller chunk sizes
2. Use local models (Ollama) for development
3. Cache RAG results
4. Batch similar queries
5. Use cheaper models for simple tasks

---

## Building Executables

Each tool includes a `build.bat` script for Windows .exe creation.

### Prerequisites

```bash
pip install pyinstaller
```

### Build Single Tool

```bash
cd extras/file-converter
build.bat
```

**Output:** `dist/File Converter.exe`

### Build All Tools

```bash
# File Converter
cd extras/file-converter
build.bat
cd ../..

# Image Processor
cd extras/image-processor
build.bat
cd ../..

# Watermark Viewer
cd extras/watermark-viewer
build.bat
cd ../..

# Token Manager
cd extras/token-manager
build.bat
cd ../..
```

### Distribution

- **Executables:** Located in `dist/` folder
- **Size:** Typically 15-25 MB per tool
- **Standalone:** No Python installation required (on target machine)
- **External Dependencies:** Tesseract/ffmpeg still required if used

**Sharing:**
1. Copy .exe from `dist/` folder
2. Include README with external dependency notes
3. Test on clean system (no Python)

---

## Troubleshooting

### Python Not Found

```bash
'python' is not recognized as an internal or external command
```

**Solution:**
1. Reinstall Python from python.org
2. Check "Add Python to PATH" during installation
3. OR use full path: `C:\Python311\python.exe file_converter.py`

### Module Not Found

```bash
ModuleNotFoundError: No module named 'tkinterdnd2'
```

**Solution:**
```bash
pip install -r requirements.txt
```

### Tesseract Not Found (File Converter)

```bash
TesseractNotFoundError
```

**Solution:**
1. Download Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to `C:\Program Files\Tesseract-OCR`
3. Add to PATH or update `file_converter.py` with path

### ffmpeg Not Found (Watermark Viewer)

```bash
FileNotFoundError: ffprobe
```

**Solution:**
1. Download ffmpeg: https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH

### TKinter Not Available

```bash
No module named 'tkinter'
```

**Solution:**
- Windows: Reinstall Python with "tcl/tk" option checked
- Linux: `sudo apt-get install python3-tk`
- macOS: Should be included with Python

### Tool Won't Launch (Windows)

**Solution:**
- Right-click .py file → Open with → Python
- OR use Command Prompt: `python file_converter.py`

---

## Advanced Usage

### Custom Modifications

All tools are open-source and modifiable:

**Example: Add new image operation**
1. Edit `image_processor.py` → Add radio button
2. Edit `worker_image_processor.py` → Add processing function
3. Test and distribute

**Example: Add new model (Token Manager)**
1. Edit `worker_token_manager.py`
2. Add model to `MODEL_PRICING` dict
3. Add encoding to `MODEL_ENCODINGS` dict
4. Update UI combobox values

### Batch Processing Scripts

```python
# Example: Batch convert folder
import os
from worker_converter import convert_file

input_folder = "C:/Documents"
output_folder = "C:/Markdown"

for file in os.listdir(input_folder):
    if file.endswith('.pdf'):
        convert_file(
            os.path.join(input_folder, file),
            output_folder,
            {'use_ocr': True, 'extract_tables': True}
        )
```

### Integration with OpenElara

Tools are designed to complement OpenElara:

1. **File Converter** → RAG ingestion pipeline
2. **Image Processor** → Content prep for image gen
3. **Watermark Viewer** → Verify OpenElara outputs
4. **Token Manager** → Optimize RAG costs

---

## License

MIT License (assumed - check repository for official license)

---

## Credits

Developed as part of the OpenElara project.  
Built with questionable coding practices and excessive caffeine consumption. ☕️

**openElara: Your data, your device, your ethical AI companion.** 🔒✨

---

## Support

For issues, questions, or contributions:
- GitHub Issues: [repository link]
- Documentation: See individual tool README files
- Main Manual: `docs/USER_MANUAL.md`

---

**Last Updated:** October 12, 2025
