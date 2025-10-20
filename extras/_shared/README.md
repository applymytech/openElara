# Shared Utilities for OpenElara Standalone Tools

This folder contains **common code** used by multiple standalone tools to avoid duplication.

## 📦 Modules

### `ui_components.py`
Reusable TKinter widgets and UI patterns:
- Drag-and-drop file/folder areas
- Progress bars
- Status indicators
- Standard button layouts
- Theme/styling constants

### `file_utils.py`
Common file operations:
- File type detection
- Batch file processing
- Path validation
- Directory traversal

### `config_manager.py`
Configuration handling:
- Load/save settings (JSON)
- API key management (encrypted)
- User preferences

### `logger.py`
Logging utilities:
- Console output formatting
- File logging
- Error reporting

## 🔧 Usage in Tools

```python
import sys
import os

# Add _shared to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '_shared'))

# Import utilities
from ui_components import DragDropArea, ProgressBar
from file_utils import detect_file_type, batch_process
from config_manager import ConfigManager
from logger import setup_logger
```

## 📝 Guidelines

- **Keep it lightweight** - No heavy dependencies
- **Document everything** - Docstrings for all functions
- **Test thoroughly** - These are used by multiple tools
- **Version carefully** - Changes affect all tools

---

*Shared utilities make all tools better!* 🧱
