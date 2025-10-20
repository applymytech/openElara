
# Complete directory content of the project folder!

**Reference Map: Use the information in this file as a ground truth reference map to locate files, folders, and their contents within the openElara project.** This document provides a complete, accurate directory structure. When analyzing, discussing, organizing, or referencing code, always cross-reference paths and file details here to ensure precision. Avoid assumptions about locations, sizes, or existence. Empty/ignored dirs (e.g., node_modules, __pycache__) are noted; refresh periodically for changes.

**Last Updated**: October 19, 2025

**For installation instructions, please see:** [INSTALLATION_GUIDE.md](../INSTALLATION_GUIDE.md)

## Project Root Path
*C:\myCodeProjects\openElara*

**Note**: `package-lock.json`, `.vscode`, `.gitignore`, `node_modules`, and other large dependencies are intentionally omitted from payloads to keep context manageable.

---

## Directory Structure

### Root
```
openElara/
├── .gitignore
├── LICENSE
├── account/
│   ├── account.html
│   └── account.js
├── action-manager/
│   ├── action-manager-renderer.js
│   └── action-manager.html
├── advanced-image-gen/
│   ├── advanced-image-gen.html
│   └── advanced-image-gen.js
├── advanced-video-gen/
│   ├── advanced-video-gen.html
│   └── advanced-video-gen.js
├── assets/
│   ├── styles/
│   │   ├── objectStyles.css
│   │   └── style.css
│   ├── README.md
│   └── USER_MANUAL.md
├── backend/
│   ├── content_auth.py
│   ├── content_watermark.py
│   ├── file_to_markdown_worker.py
│   ├── image_converter.py
│   ├── ingest.py
│   ├── ingestion_orchestrator.py
│   ├── markdown_to_docx.py
│   ├── pdf_table_extractor.py
│   ├── pdf_to_markdown.py
│   ├── rag_backend.py
│   ├── scrapy.cfg
│   ├── scrapy_worker.py
│   ├── setup_python_env.py
│   └── text_converter.py
├── build/
│   ├── EULA.txt
│   ├── icon.ico
│   ├── icon.png
│   └── openElara_loading.mp4
├── docs/
│   ├── API_QUICK_REFERENCE.md
│   ├── CONTEXT_INJECTION_IMPROVEMENTS.md
│   ├── CUSTOM_MODEL_PAYLOAD_GUIDE.md
│   ├── DIGITAL_SIGNING_SETUP.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── PROJECT_STRUCTURE.md
│   ├── README.md
│   └── USER_MANUAL.md
├── extras/
│   ├── !important! notes for LLM.txt
│   ├── README.md
│   ├── requirements.txt
│   ├── STRUCTURE.md
│   ├── USER_MANUAL_EXTRAS.md
│   ├── file-converter/
│   │   ├── build.bat
│   │   ├── file_converter.py
│   │   ├── icon.ico
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   └── worker_converter.py
│   ├── image-processor/
│   │   ├── build.bat
│   │   ├── icon.ico
│   │   ├── image_processor.py
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   └── worker_image_processor.py
│   ├── theme-manager/
│   │   ├── aiThemeGenerator.js
│   │   ├── demo.html
│   │   ├── EXAMPLES.md
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── themeManager.js
│   │   └── themeStyles.css
│   ├── token-manager/
│   │   ├── build.bat
│   │   ├── icon.ico
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   ├── token_manager.py
│   │   └── worker_token_manager.py
│   ├── watermark-viewer/
│   │   ├── build.bat
│   │   ├── icon.ico
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   ├── watermark_viewer.py
│   │   └── worker_watermark.py
│   └── _shared/
│       └── README.md
├── file-converter/
│   ├── file-converter.html
│   └── file-converter.js
├── fitz-stubs/
│   └── fitz/
│       └── __init__.pyi
├── pet-assets/
│   ├── TESTING_INSTRUCTIONS.md
│   └── characters/
│       └── elara/
│           └── manifest.json
├── power-knowledge/
│   ├── power-knowledge.html
│   └── power-knowledge.js
├── prompt-manager/
│   ├── prompt-manager-renderer.js
│   └── prompt-manager.html
├── pymupdf-stubs/
│   └── pymupdf/
│       └── __init__.pyi
├── pytesseract-stubs/
│   └── pytesseract/
│       └── __init__.pyi
├── renderer.js
├── requirements.txt
├── scrapy/
│   ├── scrapy.html
│   └── scrapy.js
├── signer/
│   ├── signer.html
│   └── signer.js
├── src/
│   ├── components/
│   │   ├── QuickInsert.css
│   │   └── QuickInsert.js
│   ├── handlers/
│   │   ├── appHandlers.js
│   │   ├── domHandlers.js
│   │   ├── eventListeners.js
│   │   ├── initializers.js
│   │   ├── modelConstants.js
│   │   ├── modelUtils.js
│   │   └── tokenManager.js
│   ├── main/
│   │   ├── characters/
│   │   │   ├── aeliraConstants.js
│   │   │   ├── aeronConstants.js
│   │   │   ├── androsConstants.js
│   │   │   ├── elaraConstants.js
│   │   │   ├── icon_aelira.png
│   │   │   ├── icon_aeron.png
│   │   │   ├── icon_andros.png
│   │   │   ├── icon_elara.png
│   │   │   └── index.js
│   │   ├── constants.js
│   │   ├── handlers/
│   │   │   ├── apiHandlers.js
│   │   │   ├── crudHandlers.js
│   │   │   ├── exaHandler.js
│   │   │   ├── fileConversionHandlers.js
│   │   │   ├── fileSystemHandlers.js
│   │   │   ├── imageHandlers.js
│   │   │   ├── modelHandlers.js
│   │   │   ├── petHandlers.js
│   │   │   ├── shimejiBuildHandler.js
│   │   │   ├── signerHandler.js
│   │   │   ├── taskHandlers.js
│   │   │   ├── themeManager.js
│   │   │   ├── videoHandlers.js
│   │   │   └── watermarkHandler.js
│   │   ├── ipcHandlers.js
│   │   ├── promptConstants.js
│   │   └── utils.js
│   ├── pet/
│   │   ├── petRenderer.html
│   │   ├── petRenderer.js
│   │   └── petWindow.js
├── viewer/
│   ├── viewer.html
│   └── viewer.js
├── icon.ico
├── icon.png
├── index.html
├── loading.html
├── main.js
├── openElara_loading.mp4
├── package-lock.json
├── package.json
├── preload.js
├── privacy.html
├── requirements.txt
├── renderer.js
├── scrapy/
│   ├── scrapy.html
│   └── scrapy.js
├── signer/
│   ├── signer.html
│   └── signer.js
├── viewer/
│   ├── viewer.html
│   └── viewer.js
```
### .root

 Directory of C:\myCodeProjects\openElara

11/10/2025  07:55 PM    <DIR>          .
08/10/2025  05:54 PM    <DIR>          ..
08/10/2025  01:16 PM               398 .gitignore
02/10/2025  05:03 PM    <DIR>          .vscode
11/10/2025  07:58 PM            10,857 account.html
10/10/2025  10:48 AM            15,366 account.js
11/10/2025  07:54 PM    <DIR>          assets
10/10/2025  05:58 AM    <DIR>          backend
06/10/2025  11:34 PM    <DIR>          build
06/10/2025  11:34 PM            12,025 Code Call Audit.md
11/10/2025  09:29 PM             6,712 elaraStructure.md
06/10/2025  11:34 PM    <DIR>          functions
29/09/2025  08:11 PM             1,765 history-renderer.js
11/10/2025  07:58 PM               641 history.html
06/10/2025  11:34 PM           188,079 icon.ico
06/10/2025  11:34 PM         1,366,186 icon.png
11/10/2025  08:41 PM            39,585 index.html
09/10/2025  11:49 PM             2,886 loading.html
10/10/2025  07:35 AM             6,656 main.js
06/10/2025  07:30 PM    <DIR>          node_modules
06/10/2025  11:34 PM         6,028,730 openElara_loading.mp4
06/10/2025  11:34 PM           238,036 package-lock.json
06/10/2025  11:34 PM             2,551 package.json
10/10/2025  12:49 PM             6,970 preload.js
11/10/2025  07:58 PM             4,373 privacy.html
11/10/2025  12:13 PM            12,928 renderer.js
10/10/2025  05:24 AM               136 requirements.txt
08/10/2025  06:02 PM    <DIR>          src
11/10/2025  07:58 PM             1,996 viewer.html
10/10/2025  11:37 AM            11,027 viewer.js
12/10/2025  12:30 AM             5,683 CHARACTER_SYSTEM_README.md
              22 File(s)      7,963,586 bytes
               9 Dir(s)  354,726,227,968 bytes free

### ./functions

 Directory of C:\myCodeProjects\openElara\functions

06/10/2025  11:34 PM    <DIR>          .
09/10/2025  11:41 PM    <DIR>          ..
06/10/2025  11:34 PM            10,365 index.js
               1 File(s)         10,365 bytes
               2 Dir(s)  327,737,028,608 bytes free


### .\src

 Directory of C:\myCodeProjects\openElara\src

08/10/2025  06:02 PM    <DIR>          .
09/10/2025  11:41 PM    <DIR>          ..
08/10/2025  07:10 PM    <DIR>          handlers
09/10/2025  01:19 PM    <DIR>          main
               0 File(s)              0 bytes
               4 Dir(s)  327,737,102,336 bytes free

### .\src\main

 Directory of C:\myCodeProjects\openElara\src\main

12/10/2025  12:30 AM    <DIR>          .
08/10/2025  06:02 PM    <DIR>          ..
12/10/2025  12:18 AM    <DIR>          characters
12/10/2025  12:15 AM               386 constants.js
10/10/2025  02:40 AM    <DIR>          handlers
12/10/2025  12:22 AM             4,789 ipcHandlers.js
10/10/2025  11:47 AM             4,208 utils.js
               3 File(s)          9,383 bytes
               4 Dir(s)  354,724,966,400 bytes free

### .\src\main\characters

 Directory of C:\myCodeProjects\openElara\src\main\characters

12/10/2025  12:30 AM    <DIR>          .
12/10/2025  12:30 AM    <DIR>          ..
12/10/2025  12:20 AM             1,456 andreasConstants.js
12/10/2025  12:19 AM             1,532 elaraConstants.js
12/10/2025  12:21 AM             2,184 index.js
               3 File(s)          5,172 bytes
               2 Dir(s)  354,724,757,504 bytes free

### .\src\main\handlers

 Directory of C:\myCodeProjects\openElara\src\main\handlers

12/10/2025  12:25 AM    <DIR>          .
09/10/2025  01:19 PM    <DIR>          ..
12/10/2025  12:10 AM            11,456 apiHandlers.js
10/10/2025  12:06 PM             3,146 crudHandlers.js
10/10/2025  12:23 PM             6,974 exaHandler.js
10/10/2025  08:46 AM            10,969 fileSystemHandlers.js
12/10/2025  12:23 AM             5,987 imageHandlers.js
10/10/2025  05:03 AM            12,164 modelHandlers.js
12/10/2025  12:16 AM             4,256 taskHandlers.js
12/10/2025  12:24 AM            12,387 videoHandlers.js
               8 File(s)         67,339 bytes
               2 Dir(s)  354,724,757,504 bytes free


### .\src\handlers

 Directory of C:\myCodeProjects\openElara\src\handlers

11/10/2025  07:55 PM    <DIR>          .
08/10/2025  06:02 PM    <DIR>          ..
11/10/2025  08:36 PM            59,898 appHandlers.js
11/10/2025  09:27 PM            16,187 domHandlers.js
11/10/2025  09:33 PM            31,274 eventListeners.js
09/10/2025  11:36 PM             9,798 initializers.js
11/10/2025  09:00 PM             5,920 modelConstants.js
11/10/2025  09:14 PM             6,922 modelUtils.js
08/10/2025  12:17 AM             5,956 tokenManager.js
               7 File(s)        135,955 bytes
               2 Dir(s)  354,724,409,344 bytes free

### .\backend

 Directory of C:\myCodeProjects\openElara\backend

10/10/2025  05:58 AM    <DIR>          .
11/10/2025  07:55 PM    <DIR>          ..
06/10/2025  11:34 PM             4,255 file_to_markdown_worker.py
08/10/2025  11:20 AM             3,708 ingest.py
10/10/2025  11:47 AM             5,328 ingestion_orchestrator.py
10/10/2025  05:24 AM            14,266 rag_backend.py
10/10/2025  05:58 AM               109 scrapy.cfg
10/10/2025  05:58 AM             9,002 scrapy_worker.py
06/10/2025  11:34 PM             1,258 setup_python_env.py
08/10/2025  10:42 AM    <DIR>          __pycache__
               7 File(s)         37,926 bytes
               3 Dir(s)  354,727,227,392 bytes free

### .\assets

 Directory of C:\myCodeProjects\openElara\assets

11/10/2025  07:54 PM    <DIR>          .
11/10/2025  07:55 PM    <DIR>          ..
29/09/2025  07:54 PM               844 README.md
11/10/2025  07:55 PM    <DIR>          styles
08/10/2025  12:55 PM            13,937 USER_MANUAL.md
               2 File(s)         14,781 bytes
               3 Dir(s)  354,727,018,496 bytes free

### .\assets\styles

 Directory of C:\myCodeProjects\openElara\assets\styles

11/10/2025  07:55 PM    <DIR>          .
11/10/2025  07:54 PM    <DIR>          ..
11/10/2025  08:04 PM             3,398 objectStyles.css
11/10/2025  03:28 PM            19,267 style.css
               2 File(s)         22,665 bytes
               2 Dir(s)  354,726,830,080 bytes free


### .\build

 Directory of C:\myCodeProjects\openElara\build

06/10/2025  11:34 PM    <DIR>          .
11/10/2025  07:55 PM    <DIR>          ..
29/09/2025  07:54 PM             4,342 EULA.txt
06/10/2025  11:34 PM           188,079 icon.ico
06/10/2025  11:34 PM         1,366,186 icon.png
06/10/2025  11:34 PM         6,028,730 openElara_loading.mp4
               4 File(s)      7,587,337 bytes
               2 Dir(s)  354,724,786,176 bytes free

└── viewer.js                      # RAG database viewer logic
```

---

## Architecture Overview

### Core Technologies
- **Frontend**: Electron (Chromium + Node.js)
- **Backend**: Python 3.x
- **Database**: ChromaDB (vector database for RAG)
- **LLM Providers**: Ollama (local), TogetherAI, OpenAI-compatible APIs
- **Storage**: electron-store (settings), safeStorage (API keys)

### Data Flow

**Chat Request Flow**:
1. User input → `renderer.js` → `appHandlers.js`
2. Token budget calculation → `tokenManager.js`
3. RAG context injection → `apiHandlers.js` (getairesponse)
   - Recent turns → `rag_backend.py` (get_recent_turns)
   - Semantic search → `rag_backend.py` (search)
   - Knowledge base → `rag_backend.py` (search)
4. API routing → provider-specific handlers
5. Response → UI update → Save to RAG

**File Ingestion Flow**:
1. User selects files → `fileSystemHandlers.js` (run-ingestion)
2. Orchestration → `ingestion_orchestrator.py`
3. Conversion → `file_to_markdown_worker.py` (PDF/DOCX/etc → Markdown)
4. Chunking & embedding → `ingest.py`
5. Storage → ChromaDB collections (knowledge_base)

### Multi-Character System

**Location**: `src/main/characters/`

The app supports **four AI companion characters**, each with unique personas, visual descriptions, and voice profiles.

**Characters**:
1. **Elara** (Default) - Playful, submissive, adventurous AI companion
2. **Aeron** - Rugged, protective guardian with strategic wisdom
3. **Aelira** - Philosophical muse, intellectually honest, challenges ideas
4. **Andros** - Pragmatic problem-solver, business/tech-oriented

**Structure**:
- `characters/index.js` - Character registry, loader, cache manager
- `characters/elaraConstants.js` - Elara definition
- `characters/aeronConstants.js` - Aeron definition
- `characters/aeliraConstants.js` - Aelira definition
- `characters/androsConstants.js` - Andros definition

**Character Properties**:
```javascript
{
  CHARACTER_NAME: "Name",
  CHARACTER_ICON_PATH: "./icon_name.png",
  CHARACTER_DESCRIPTION: "Full visual description",
  CHARACTER_DESCRIPTION_SAFE: "Content-filter safe version",
  CHARACTER_ATTIRE: "Clothing/outfit description",
  CHARACTER_PERSONA: "Detailed personality/behavior prompt",
  CHARACTER_NEGATIVE_PROMPT: "Image generation exclusions",
  CHARACTER_VOICE_PROFILE: "Voice characteristics"
}
```

**Character Caching**: Active character loaded on app start and cached in memory for performance. Cache cleared when switching characters.

### RAG (Retrieval-Augmented Generation)

**Collections**:
- `chat_history` - Conversation turns with timestamps
- `knowledge_base` - Ingested documents grouped by source

**Operations** (via `rag_backend.py`):
- `search` - Semantic similarity search
- `get_recent_turns` - Chronological recent conversations
- `save_chat_turn` - Add conversation to history
- `list_items` - Retrieve all items (for viewers)
- `delete_items` - Remove by ID
- `delete_source` - Remove all chunks from a source file
- `clear_collection` - Wipe entire collection

**Context Injection Strategy** (3-layer):
1. **Recent Turns** - Guaranteed n most recent conversation turns
2. **Semantic History** - Relevant past conversations (deduplicated)
3. **Knowledge Base** - Relevant ingested documents

### Output Folder Structure

**Location**: `%AppData%\Roaming\openelara\Output\`

```
Output/
├── exa/        # Exa.ai research results (.md files)
├── scrapy/     # Web scraping results
├── images/     # Generated images
└── videos/     # Generated videos
```

### IPC Communication

**Main Process** (`src/main/handlers/`) handles:
- File system operations
- Python script execution
- API key management (encrypted)
- Database operations
- External API calls

**Renderer Process** (`src/handlers/`) handles:
- UI updates
- User input processing
- Token budget management
- State management
- Event delegation

**Preload Bridge** (`preload.js`):
- Exposes safe IPC methods to renderer
- No direct Node.js access from renderer (security)

### Recent Major Updates (October 2025)

#### RAG System Enhancements
- **Guaranteed Recent Turns**: Added `get_recent_turns()` to bypass semantic search for recent conversations
- **3-Layer Context**: Recent + semantic history + knowledge base
- **Smart Truncation**: Drops oldest first, truncates last turn if needed
- **Fixed Viewers**: Added missing `inputData` payload to `get-memories` handler

#### UI Improvements
- **Session History Viewer**: Dedicated `history.html` window with scrollable content
- **RAG Database Viewers**: View & manage memories and knowledge base
- **Output Folder Buttons**: Quick access to Exa, Scrapy, Images, Videos folders
- **Ingest Folder**: Recursive folder ingestion capability
- **Theme System**: Dark/light/custom themes with real-time switching
- **Character-Responsive UI**: Personality dropdown now shows active character name

#### Developer Tools
- **Full Prompt Logging**: Complete image/video prompts logged (not truncated)
- **Ingestion Progress**: Real-time progress updates with auto-scroll and close button
- **Error Handling**: Graceful encryption key migration on path changes

### Key Files Explained

**main.js**
- Electron app lifecycle management
- Window creation (main, viewer, history)
- Character loading on startup
- IPC handler setup

**renderer.js**
- Legacy renderer code (being phased out)
- Basic initialization

**appHandlers.js** (Renderer)
- Chat submission logic
- Power Knowledge (Exa) integration
- Scrapy scraper controls
- Image/video generation triggers
- File attachment handling
- Memory/knowledge management

**apiHandlers.js** (Main)
- RAG context injection (3-layer system)
- API routing (Ollama, TogetherAI, OpenAI-compatible)
- Response streaming
- Encryption key management

**tokenManager.js**
- Dynamic token budget allocation
- Context/output/reserve sliders
- Model-aware limits
- Real-time UI updates

**domHandlers.js**
- Element references
- UI manipulation utilities
- Theme application
- Message rendering (Markdown + syntax highlighting)

**eventListeners.js**
- Event binding for all UI interactions
- Keyboard shortcuts
- Modal controls
- Button click handlers

**initializers.js**
- App startup routines
- Model selector population
- Personality selector population
- Theme loading
- Ingestion progress listener setup
- History request listener

### Configuration Files

**package.json**
- Electron app metadata
- Dependencies (axios, electron-store, marked, etc.)
- Build scripts

**requirements.txt**
- Python dependencies (chromadb, pypdf, python-docx, etc.)

**scrapy.cfg**
- Scrapy spider configuration

### Security Model

**API Key Storage**:
- Encrypted using Electron's safeStorage
- Stored in electron-store
- Decrypted only when needed
- Per-installation encryption context

**Python Execution**:
- Scripts run with user's Python environment
- No network access except explicit API calls
- All data local-first

**Content Security Policy**:
- Strict CSP in HTML files
- Context isolation enabled
- Node integration disabled in renderer

---

## Development Workflow

### Adding a New Character
1. Create `src/main/characters/yourCharacterConstants.js`
2. Define all CHARACTER_* properties
3. Import in `characters/index.js`
4. Add to CHARACTERS registry
5. Create `icon_yourcharacter.png` in root
6. Test character switch in Account Settings

### Adding a New LLM Model
1. Update `src/handlers/modelConstants.js`
2. Add model to appropriate provider group
3. Specify context window and cost (if applicable)
4. Test API routing in `apiHandlers.js`

### Adding a New IPC Handler
1. Main process: Add handler in `src/main/handlers/`
2. Register in setup function
3. Renderer: Add API method in `preload.js`
4. Call from `appHandlers.js` or other renderer code

### Testing RAG System
1. Ingest test files via "Ingest Files" button
2. Check `%AppData%\Roaming\openelara\db` for collections
3. Use "View & Manage KB" to verify ingestion
4. Chat with questions related to ingested content
5. Check logs for context injection confirmation

---

## File Locations (User Data)

**Windows**:
- User Data: `%AppData%\Roaming\openelara\`
- Database: `%AppData%\Roaming\openelara\db\`
- Outputs: `%AppData%\Roaming\openelara\Output\`
- Config: `%AppData%\Roaming\openelara\config.json`

**Database Collections**:
- `chat_history` - Conversation memory
- `knowledge_base` - Ingested documents

---

## ! FILE END !