# Image Processor - Standalone Python Tool

**Advanced image processing: resize, compress, convert, enhance, batch operations**

---

## 🎯 What It Does

Professional image processing operations with a simple TKinter UI:
- **Format conversion** (JPG ↔ PNG ↔ WEBP ↔ BMP ↔ TIFF)
- **Resize** (dimensions, percentage, aspect ratio lock)
- **Compress** (reduce file size while maintaining quality)
- **Batch operations** (process entire folders)
- **Enhance** (brightness, contrast, sharpness)
- **Rotate/Flip** (90°, 180°, 270°, horizontal/vertical flip)
- **Crop** (manual crop, auto-crop to content)

Originally part of openElara's character image processing - now standalone!

---

## ⚡ Quick Start

### Run from Source
```bash
pip install -r requirements.txt
python image_processor.py
```

### Build .exe
```bash
build.bat
# Output: dist/Image Processor.exe
```

---

## 🖼️ Interface

```
┌─────────────────────────────────────────┐
│  Image Processor                        │
├─────────────────────────────────────────┤
│  Operation: [Convert Format ▼]         │
│                                         │
│  Format:    [PNG ▼]                    │
│  Quality:   ████████░░ 85%             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Drag & Drop Images Here          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Files: 5 images selected              │
│                                         │
│  Output: [C:\Processed]  [...]         │
│                                         │
│       [Process]        [Clear]         │
└─────────────────────────────────────────┘
```

---

## 📋 Features

### ✅ Operations
1. **Convert Format**
   - JPG → PNG (lossless)
   - PNG → WEBP (smaller size)
   - Any format → Any format
   - Preserve transparency

2. **Resize Images**
   - Fixed dimensions (e.g., 1024x768)
   - Percentage (e.g., 50% of original)
   - Lock aspect ratio
   - Upscale/downscale

3. **Compress**
   - Reduce file size
   - Adjustable quality (1-100)
   - Preview size reduction

4. **Enhance**
   - Brightness adjustment
   - Contrast adjustment
   - Sharpness adjustment
   - Auto-enhance (one-click)

5. **Rotate/Flip**
   - 90° CW/CCW
   - 180°
   - Horizontal/vertical flip

6. **Crop**
   - Manual crop (X, Y, Width, Height)
   - Auto-crop to content
   - Trim transparent edges

7. **Batch Operations**
   - Process entire folders
   - Preserve folder structure
   - Progress tracking

---

## 🔧 Dependencies

```
Pillow>=10.0.0          # Image processing
tkinterdnd2>=0.3.0      # Drag and drop
```

**That's it!** Lightweight and fast.

---

## 🎨 Usage Examples

### Convert Character Images (JPG → PNG)
1. Drag character images onto window
2. Select "Convert Format" operation
3. Choose "PNG" format
4. Click "Process"
5. Done! Transparent PNG images ready

### Compress for Web
1. Drag images
2. Select "Compress" operation
3. Set quality to 75%
4. Click "Process"
5. Smaller files, same visual quality

### Batch Resize
1. Choose folder with images
2. Select "Resize" operation
3. Enter dimensions (e.g., 512x512)
4. ☑ Lock aspect ratio
5. Click "Process"
6. All images resized proportionally

---

## 📁 File Structure

```
image-processor/
├── image_processor.py         # Main TKinter UI
├── worker_image.py            # Image processing logic
├── requirements.txt           # Dependencies
├── build.bat                  # Windows build script
├── README.md                  # This file
└── icon.ico                   # App icon
```

---

## 🤝 Contributing

Ideas for enhancements:
- Watermarking (add text/logo)
- Batch rename
- EXIF data editor
- Color filters (sepia, grayscale, etc.)
- Background removal

---

*The tool that processed openElara's character images!* 🎨
