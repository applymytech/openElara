const { ipcMain, safeStorage } = require('electron');
const Store = require('electron-store');
const { encode } = require('gpt-tokenizer');
const { setupCrudHandlers } = require('./handlers/crudHandlers');
const { setupFileSystemHandlers } = require('./handlers/fileSystemHandlers');
const { setupTaskHandlers } = require('./handlers/taskHandlers');
const { setupModelHandlers } = require('./handlers/modelHandlers');
const { setupVideoHandlers } = require('./handlers/videoHandlers');
const { setupImageHandlers } = require('./handlers/imageHandlers');
const { setupFileConversionHandlers } = require('./handlers/fileConversionHandlers');
const { setupWatermarkHandlers } = require('./handlers/watermarkHandler'); 
const { setupSignerHandlers } = require('./handlers/signerHandler');
const { registerPetHandlers } = require('./handlers/petHandlers');
const { registerShimejiGenerationHandlers } = require('./handlers/shimejiBuildHandler');
const { setupDeepAIHandlers } = require('./handlers/deepaiHandlers');
const { DEFAULT_ACTIONS } = require('./constants');
const { getActiveCharacter } = require('./characters');
require('./handlers/apiHandlers');

const store = new Store();

const setupIpcHandlers = (mainWindow, app) => {
    setupCrudHandlers();
    setupFileSystemHandlers(mainWindow);
    setupTaskHandlers();
    setupModelHandlers(app);
    setupVideoHandlers();
    setupImageHandlers();
    setupFileConversionHandlers();
    setupWatermarkHandlers();
    setupSignerHandlers();
    registerPetHandlers();
    registerShimejiGenerationHandlers();
    setupDeepAIHandlers();
    
    let windowCreators = null;
    const getWindowCreators = () => {
        if (!windowCreators) {
            windowCreators = require('../../main.js');
        }
        return windowCreators;
    };

// --- CORE & MISC HANDLERS ---
    
    const { buildChatSystemPrompt } = require('./promptConstants');
    
    ipcMain.handle('get-current-window', (event) => {
        return event.sender.getOwnerBrowserWindow();
    });
    
    ipcMain.handle('get-system-instruction', (event, { userName, personalityText, outputTokenLimit }) => {
        const character = getActiveCharacter();
        return buildChatSystemPrompt(
            userName,
            character.CHARACTER_PERSONA,
            personalityText,
            outputTokenLimit
        );
    });
    
    // Core Store, Util, and Theme Handlers
    ipcMain.handle('store:get', (event, key) => store.get(key));
    ipcMain.on('store:set', (event, key, value) => store.set(key, value));
    ipcMain.handle('count-tokens', (event, text) => (typeof text === 'string' ? encode(text).length : 0));
    ipcMain.handle('get-theme', () => store.get('theme'));
    ipcMain.handle('set-theme', (event, theme) => store.set('theme', theme));
    
    // Refresh model selector in main window
    ipcMain.handle('refresh-model-selector', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('refresh-model-selector');
            return { success: true };
        }
        return { success: false, error: 'Main window not found' };
    });

    // Character Management Handlers
    const charactersModule = require('./characters');
    const { loadCharacter, getAvailableCharacters, clearCharacterCache, getCharacter } = charactersModule;

    // Helper: resolve a provided name to the internal character key.
    // Accepts either the internal key (e.g. 'elara') or the display name (e.g. 'Elara').
    const resolveCharacterKey = (name) => {
        if (!name || typeof name !== 'string') return null;
        const normalized = name.toLowerCase();

        // If the normalized string directly matches a key, use it.
        if (charactersModule.CHARACTERS[normalized]) return normalized;

        // Otherwise search for a matching display name.
        for (const key of Object.keys(charactersModule.CHARACTERS)) {
            const ch = charactersModule.CHARACTERS[key];
            if (ch && ch.CHARACTER_NAME && ch.CHARACTER_NAME.toLowerCase() === name.toLowerCase()) {
                return key;
            }
        }

        // Fallback to the normalized input — the caller will decide how to handle a missing character.
        return normalized;
    };

    ipcMain.handle('get-character-constants', (event, characterName) => {
        const key = characterName ? resolveCharacterKey(characterName) : null;
        const character = key ? getCharacter(key) : getActiveCharacter();
        return {
            name: character.CHARACTER_NAME,
            description: character.CHARACTER_DESCRIPTION,
            description_safe: character.CHARACTER_DESCRIPTION_SAFE,
            attire: character.CHARACTER_ATTIRE,
            iconPath: character.CHARACTER_ICON_PATH,
            negativePrompt: character.CHARACTER_NEGATIVE_PROMPT,
            voice_profile: character.CHARACTER_VOICE_PROFILE
        };
    });

    ipcMain.handle('get-available-characters', () => {
        return getAvailableCharacters();
    });

    ipcMain.handle('get-active-character-name', () => {
        const character = getActiveCharacter();
        return character.CHARACTER_NAME;
    });

    ipcMain.handle('get-active-character-icon', () => {
        const character = getActiveCharacter();
        return character.CHARACTER_ICON_PATH || './icon.png';
    });

    ipcMain.handle('set-active-character', (event, characterName) => {
        const resolvedKey = resolveCharacterKey(characterName);
        if (!resolvedKey || !charactersModule.CHARACTERS[resolvedKey]) {
            return { success: false, error: `Character '${characterName}' not found` };
        }

        clearCharacterCache();
        loadCharacter(resolvedKey);
        store.set('activeCharacter', resolvedKey);
        return { success: true, character: resolvedKey };
    });
    
    ipcMain.handle('get-default-actions', () => {
        return DEFAULT_ACTIONS;
    });
    
    // --- POPUP WINDOW HANDLERS ---
    ipcMain.handle('open-prompt-manager', (event, parentWindowType = null) => {
        const { createPromptManagerWindow } = getWindowCreators();
        createPromptManagerWindow(parentWindowType);
        return { success: true };
    });
    
    ipcMain.handle('open-action-manager', () => {
        const { createActionManagerWindow } = getWindowCreators();
        createActionManagerWindow();
        return { success: true };
    });
    
    ipcMain.handle('open-signer', () => {
        const { createSignerWindow } = getWindowCreators();
        createSignerWindow();
        return { success: true };
    });
    
    ipcMain.handle('get-prompts', () => {
        const prompts = store.get('prompts', []);
        return { success: true, prompts };
    });
    
    ipcMain.handle('save-prompt', (event, promptData) => {
        try {
            const prompts = store.get('prompts', []);
            const existingIndex = prompts.findIndex(p => p.id === promptData.id);
            
            if (existingIndex >= 0) {
                prompts[existingIndex] = promptData;
            } else {
                prompts.push(promptData);
            }
            
            store.set('prompts', prompts);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('delete-prompt', (event, promptId) => {
        try {
            const prompts = store.get('prompts', []);
            const filtered = prompts.filter(p => p.id !== promptId);
            store.set('prompts', filtered);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('use-prompt', (event, promptId) => {
        try {
            const prompts = store.get('prompts', []);
            const prompt = prompts.find(p => p.id === promptId);
            
            if (!prompt) {
                return { success: false, error: 'Prompt not found' };
            }
            const { BrowserWindow } = require('electron');
            const allWindows = BrowserWindow.getAllWindows();
            
            const advancedImageWindow = allWindows.find(win => 
                win.getTitle().includes('Advanced Image Generation'));
            const advancedVideoWindow = allWindows.find(win => 
                win.getTitle().includes('Advanced Video Generation'));
            
            if (advancedImageWindow && !advancedImageWindow.isDestroyed() && prompt.type === 'image') {
                advancedImageWindow.webContents.send('load-prompt', prompt);
            } else if (advancedVideoWindow && !advancedVideoWindow.isDestroyed() && prompt.type === 'video') {
                advancedVideoWindow.webContents.send('load-prompt', prompt);
            } else if (mainWindow && !mainWindow.isDestroyed()) {
                
                mainWindow.webContents.send('load-prompt', prompt);
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};

ipcMain.handle('ollama:launch', async (event, ollamaExePath) => {
    if (!executeOllamaFn) {
        return { success: false, error: "Ollama execution function is not available in the main process." };
    }
    return await executeOllamaFn(ollamaExePath);
});

module.exports = { setupIpcHandlers };