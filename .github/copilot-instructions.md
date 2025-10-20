# openElara - AI Coding Agent Instructions
**!important! Do not ever use placeholders in the code unless explicitly instructed by the user. Always use concrete values or ask for clarification if unsure. It is not difficult to leave existing, working code alone while you work in other areas! Do not ever modify existing code without explicit understanding or instructions, especially when it has nothing to do with your designated task.**

## Project Overview
**openElara** is an Electron-based desktop LLM client with RAG (Retrieval-Augmented Generation), multi-character AI companions, and privacy-first architecture. It's a hybrid JavaScript (Node.js/Electron) + Python backend system for local and cloud AI interaction.

**Core Tech Stack:** Electron (main + renderer processes), Python workers (ChromaDB, Scrapy, file conversion), Express.js (optional), axios for API calls.

## Architecture Fundamentals

### 1. Electron IPC Communication Pattern
**Critical:** All main↔renderer communication uses IPC through a secure preload bridge.

**Adding New Features (3-step pattern):**
1. **Main Process Handler** (`src/main/handlers/*.js`): 
   ```javascript
   ipcMain.handle('your-handler-name', async (event, payload) => {
       // Process request, call Python, access filesystem, etc.
       return { success: true, data: result };
   });
   ```
2. **Preload Bridge** (`preload.js`):
   ```javascript
   yourFeature: (args) => ipcRenderer.invoke('your-handler-name', args),
   ```
3. **Renderer Process** (`src/handlers/appHandlers.js` or similar):
   ```javascript
   const result = await window.electronAPI.yourFeature(payload);
   ```

**Handler Registration:** All handlers are registered in `src/main/ipcHandlers.js` via modular setup functions (`setupFileSystemHandlers()`, `setupModelHandlers()`, etc.). Self-registering handlers (like `apiHandlers.js`) use `require()` at the top of `ipcHandlers.js`.

### 2. Python Worker Integration
**Pattern:** All Python scripts are executed via `runPythonScript()` utility (`src/main/utils.js`):
```javascript
const result = await runPythonScript('backend/your_script.py', ['arg1', 'arg2'], inputData);
```
**Location:** Python workers live in `backend/` directory.
**Key Scripts:**
- `rag_backend.py` - ChromaDB vector search, chat history, knowledge base CRUD
- `ingest.py` - Document chunking & embedding for RAG
- `ingestion_orchestrator.py` - Multi-file ingestion coordinator
- `file_to_markdown_worker.py` - PDF/DOCX → Markdown conversion

**Command Structure:** Python scripts receive CLI args + stdin JSON payload, return JSON to stdout.

### 3. RAG System (3-Layer Context Injection)
**Collections:**
- `chat_history` - Conversation turns with timestamps, persona attribution
- `knowledge_base` - Ingested documents (chunked, embedded)

**Context Strategy (`apiHandlers.js` → `getairesponse`):**
1. **Recent Turns** (`get_recent_turns`) - Guarantees last N conversation turns (chronological, deduplicated)
2. **Semantic History** - Relevant past conversations via vector search (filtered to avoid overlap with recent)
3. **Knowledge Base** - Semantic search against ingested documents

**Important:** Token budgets for each layer are configurable via payload (`historyTokenLimit`, `knowledgeTokenLimit`, `recentTurnsCount`).

**RAG Operations** (via `rag_backend.py`):
- `search` - Semantic similarity search with token budget
- `get_recent_turns` - Chronological recent turns (bypasses semantic search)
- `save_chat_turn` - Add turn to history with persona attribution
- `list_items` - Paginated retrieval (offset, limit) with previews
- `delete_items` - Remove by ID array
- `delete_source` - Remove all chunks from a source file
- `clear_collection` - Wipe collection

### 4. Multi-Character System
**Location:** `src/main/characters/`
**Registry:** `index.js` exports `CHARACTERS` object, `getActiveCharacter()`, `loadCharacter()`, `clearCharacterCache()`

**Character Structure (constants file):**
```javascript
module.exports = {
    CHARACTER_NAME: "Elara",
    CHARACTER_ICON_PATH: "./icon.png",
    CHARACTER_DESCRIPTION: "Physical description for image gen",
    CHARACTER_DESCRIPTION_SAFE: "Content-filter safe version",
    CHARACTER_ATTIRE: "Outfit description",
    CHARACTER_PERSONA: "System prompt personality",
    CHARACTER_NEGATIVE_PROMPT: "Image gen exclusions",
    CHARACTER_VOICE_PROFILE: "Voice characteristics"
};
```

**Character Cache:** Active character loaded on app start (`main.js`), cached in memory. Cache cleared on character switch to force reload.

**Adding New Characters:**
1. Create `src/main/characters/yourCharacterConstants.js`
2. Add to `CHARACTERS` registry in `index.js`
3. Create `icon_yourcharacter.png` in project root
4. Test switch via Account Settings UI

## Development Workflows

### Running the App
```bash
npm install              # Install Node deps
pip install -r requirements.txt  # Install Python deps
npm start                # Launch Electron app
```

**Dev Tools:** Available in non-packaged builds via Developer menu (added dynamically in `main.js`).

### Building for Distribution
```bash
npm run build            # Windows NSIS installer
npm run publish          # Build + publish to GitHub releases
```

**Build Config:** `package.json` → `build` section. Uses `electron-builder`.

### Testing RAG System
1. Ingest files via "Ingest Files" button in UI
2. Check database: `%AppData%\Roaming\openelara\db\`
3. Use "View & Manage KB" to verify ingestion
4. Chat with related queries, check logs for context injection
5. View `electron-log` output for Python script debug info

### Adding New LLM Models
**Location:** `src/handlers/modelConstants.js`
```javascript
export const TOGETHER_MODELS = [
    { name: 'model-name', contextWindow: 32768, cost: 0.002 }
];
```
**API Routing:** Handled in `apiHandlers.js` based on `modelConfig.provider` field.

### Python Script Debugging
**Logs:** Python scripts log to stderr (captured by `runPythonScript()` and forwarded to electron-log).
**Testing:** Run scripts manually: `python backend/rag_backend.py search chat_history "C:\Users\...\AppData\Roaming\openelara" 2000 15`

## Project-Specific Conventions

### State Management
**Session Storage:** `conversationHistory`, `canvasFiles`, `attachedFile` stored in `sessionStorage` (renderer process).
**Persistent Storage:** `electron-store` for settings, API keys (encrypted with `safeStorage`), character preferences.

### File Paths
**User Data:** `%AppData%\Roaming\openelara\` (Windows), accessed via `app.getPath('userData')`.
**Output Structure:**
```
Output/
├── exa/        # Research results (.md)
├── scrapy/     # Web scraping results
├── images/     # Generated images
└── videos/     # Generated videos
```

### Security Model
- **Context Isolation:** Enabled in `BrowserWindow` config
- **No Node Integration:** Renderer processes access Node APIs only via `preload.js` bridge
- **API Key Encryption:** All sensitive keys encrypted with `safeStorage` before storing in electron-store
- **Content Security Policy:** Strict CSP in HTML files

### UI/UX Patterns
**Thinking Bubbles:** Show during API calls (added in `appHandlers.js` → `executeApiCall()`)
**Status Messages:** Use `showStatusMessage()` from `domHandlers.js` for ephemeral notifications
**Confirmation Modals:** Use `showConfirmationModal()` pattern for destructive actions (clear history, delete sources)

### Error Handling
**Backend Errors:** Return `{ success: false, error: message }` from IPC handlers.
**Frontend Display:** Use `addMessage()` with 'ai' role to show error messages in chat.
**Python Errors:** Caught by `runPythonScript()`, logged to electron-log, returned as `{ error: string }`.

## Integration Points

### External APIs
**Supported Providers:**
- Ollama (local) - Custom base URL via encrypted `ollamaBaseUrl` setting
- TogetherAI - `togetherApiKey` (encrypted)
- OpenRouter - Via custom API config (plain text, stored in `customApis`)
- OpenAI-compatible - Generic handler in `apiHandlers.js`

**Custom APIs:** Stored in electron-store as array of `{ name, baseUrl, apiKey, models[] }` objects.

### Content Watermarking
**Location:** `src/main/handlers/watermarkHandler.js`
**Automatic:** All AI-generated images/videos watermarked with invisible metadata (EXIF, ffmpeg, JSON sidecar).
**Privacy:** Uses anonymous installation UUID (local-only, never transmitted).

### Power Tools
**Neural Search:** Exa.ai integration (`exaHandler.js`) - results saved to `Output/exa/`
**Web Scraping:** Scrapy worker (`scrapy_worker.py`) - results in `Output/scrapy/`
**Website Cloner:** Smart page extraction with BFS crawl (not yet in this codebase snapshot)

## Common Pitfalls

1. **String Validation:** RAG system requires ALL query inputs to be strings. Always validate `typeof query === 'string'` before passing to Python.
2. **Character Cache:** Switching characters requires `clearCharacterCache()` call to reload constants.
3. **Token Budgets:** Each context layer (recent/semantic/knowledge) has separate token limits. Exceeding causes truncation (oldest-first for recent turns).
4. **Encryption Context:** `safeStorage` keys become invalid if `userData` path changes (handled gracefully in `apiHandlers.js`).
5. **Async Window Creation:** Use `once('ready-to-show')` + `webContents.send()` pattern for popup windows (see `createViewerWindow()` in `main.js`).
6. **Python Environment:** Ensure ChromaDB and dependencies installed: `pip install chromadb pypdf python-docx`.

## Quick Reference

**Key Files:**
- `main.js` - App lifecycle, window management
- `src/main/ipcHandlers.js` - Central IPC registration hub
- `src/handlers/appHandlers.js` - Chat submission, power tools
- `src/main/handlers/apiHandlers.js` - RAG context injection, API routing
- `backend/rag_backend.py` - ChromaDB operations
- `preload.js` - IPC bridge (all `window.electronAPI.*` methods)

**Useful Commands:**
```bash
npm start                 # Run dev
npm run build             # Build installer
electron-log location     # Find logs (main.log in userData/logs/)
```

**Debug Logs:**
- Main Process: `%AppData%\Roaming\openelara\logs\main.log`
- Python stderr: Captured in electron-log output
- Renderer Console: Open DevTools (F12 in dev mode)
