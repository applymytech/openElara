// C:/myCodeProjects/openElara/preload.js

const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
    // API Key Management
    getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
    saveApiKeys: (keys) => ipcRenderer.invoke('save-api-keys', keys),

    // Core & Models
    getAvailableModels: () => ipcRenderer.invoke('get-available-models'),
    getSystemInstruction: (payload) => ipcRenderer.invoke('get-system-instruction', payload),
    getairesponse: (payload) => ipcRenderer.invoke('getairesponse', payload),
    countTokens: (text) => ipcRenderer.invoke('count-tokens', text),
    saveChatTurnToRag: (turn) => ipcRenderer.invoke('save-chat-turn-to-rag', turn), 


    // Account & API Settings
    getCustomApis: () => ipcRenderer.invoke('get-custom-apis'),
    saveCustomApis: (apis) => ipcRenderer.send('save-custom-apis', apis),
    refreshModelSelector: () => ipcRenderer.invoke('refresh-model-selector'),
    getCurrentModelConfig: () => ipcRenderer.invoke('get-current-model-config'),

    // External Links
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),

    // Ollama Management
    ollamaListModels: () => ipcRenderer.invoke('ollama-list-models'),
    ollamaPullModel: (args) => ipcRenderer.invoke('ollama-pull-model', args),
    ollamaDeleteModel: (args) => ipcRenderer.invoke('ollama-delete-model', args),
    onOllamaPullProgress: (callback) => ipcRenderer.on('ollama-pull-progress', (_event, value) => callback(value)),
    
    // App Navigation
    startMainApp: () => ipcRenderer.invoke('start-main-app'),
    loadAccountPage: () => ipcRenderer.send('return-to-login'),
    loadingVideoFinished: () => ipcRenderer.send('loading-video-finished'),
    
    // CRUD Operations
    getPersonalities: () => ipcRenderer.invoke('getPersonalities'),
    getPersonality: (name) => ipcRenderer.invoke('getPersonality', name),
    savePersonality: (p) => ipcRenderer.invoke('savePersonality', p),
    removePersonality: (name) => ipcRenderer.invoke('removePersonality', name),
    getPrompts: () => ipcRenderer.invoke('getPrompts'),
    getPrompt: (name) => ipcRenderer.invoke('getPrompt', name),
    savePrompt: (p) => ipcRenderer.invoke('savePrompt', p),
    removePrompt: (name) => ipcRenderer.invoke('removePrompt', name),
    getActions: () => ipcRenderer.invoke('getActions'),
    getAction: (name) => ipcRenderer.invoke('getAction', name),
    saveAction: (a) => ipcRenderer.invoke('saveAction', a),
    removeAction: (name) => ipcRenderer.invoke('removeAction', name),
    getModifiers: () => ipcRenderer.invoke('getModifiers'),
    getModifier: (name) => ipcRenderer.invoke('getModifier', name),
    saveModifier: (m) => ipcRenderer.invoke('saveModifier', m),
    removeModifier: (name) => ipcRenderer.invoke('removeModifier', name),

    // File & Folder System
    openFile: (opts) => ipcRenderer.invoke('dialog:openFile', opts),
    selectKnowledgeFiles: () => ipcRenderer.invoke('dialog:selectKnowledgeFiles'),
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
    getFilesFromFolder: (folderPath) => ipcRenderer.invoke('get-files-from-folder', folderPath),
    getOutputPath: () => ipcRenderer.invoke('get-output-path'),
    openOutputFolder: () => ipcRenderer.invoke('open-output-folder'),
    clearOutputFolder: () => ipcRenderer.invoke('clear-output-folder'),
    readFileAsBase64: (filePath) => ipcRenderer.invoke('read-file-as-base64', filePath),
    saveFile: (payload) => ipcRenderer.invoke('saveFile', payload),


    getExaOutputPath: () => ipcRenderer.invoke('get-exa-output-path'),
    openExaOutputFolder: () => ipcRenderer.invoke('open-exa-output-folder'),
    clearExaOutputFolder: () => ipcRenderer.invoke('clear-exa-output-folder'),
    
    getScrapyOutputPath: () => ipcRenderer.invoke('get-scrapy-output-path'),
    openScrapyOutputFolder: () => ipcRenderer.invoke('open-scrapy-output-folder'),
    clearScrapyOutputFolder: () => ipcRenderer.invoke('clear-scrapy-output-folder'),
    
    // OUTPUT FOLDER HANDLERS
    openImagesOutputFolder: () => ipcRenderer.invoke('openImagesOutputFolder'),
    openVideosOutputFolder: () => ipcRenderer.invoke('openVideosOutputFolder'),
    openConversionsOutputFolder: () => ipcRenderer.invoke('openConversionsOutputFolder'),

    // RAG & Database
    runIngestion: (filePaths) => ipcRenderer.invoke('run-ingestion', filePaths),
    clearKnowledgeBase: () => ipcRenderer.invoke('clear-knowledge-base'),
    getKnowledgeFiles: () => ipcRenderer.invoke('get-knowledge-files'),
    removeKnowledgeFile: (filename) => ipcRenderer.invoke('remove-knowledge-file', filename),
    clearChatHistory: () => ipcRenderer.invoke('clear-chat-history'),
    getMemories: (params) => ipcRenderer.invoke('get-memories', typeof params === 'string' ? { collection: params, limit: null, offset: 0 } : params),
    removeMemory: (payload) => ipcRenderer.invoke('remove-memory', payload),
    removeSource: (sourceName) => ipcRenderer.invoke('removeSource', sourceName),
    getMemoryContentById: (payload) => ipcRenderer.invoke('getMemoryContentById', payload),

    // External Services & Tasks
    runWebTask: (payload) => ipcRenderer.invoke('run-web-task', payload),
    runScrapyTask: (payload) => ipcRenderer.invoke('run-scrapy-task', payload),
    generateThemePalette: (payload) => ipcRenderer.invoke('generate-theme-palette', payload),
    openViewerWindow: (payload) => ipcRenderer.invoke('open-viewer-window', payload),
    openFileConverter: () => ipcRenderer.invoke('open-file-converter'),
    openScrapyWindow: () => ipcRenderer.invoke('open-scrapy-window'),
    openPowerKnowledge: () => ipcRenderer.invoke('open-power-knowledge'),
    openPromptManager: () => ipcRenderer.invoke('open-prompt-manager'),
    openActionManager: () => ipcRenderer.invoke('open-action-manager'),
    openSigner: () => ipcRenderer.invoke('open-signer'),
    openAdvancedImageGenWindow: () => ipcRenderer.invoke('open-advanced-image-gen-window'),
    openAdvancedVideoGenWindow: () => ipcRenderer.invoke('open-advanced-video-gen-window'),
    openDeepaiStudioWindow: () => ipcRenderer.invoke('open-deepai-studio-window'),

    // GENERATIVE APIs (Updated/New)
    generateSelfie: (payload) => ipcRenderer.invoke('generate-selfie', payload),
    generateOpenImage: (payload) => ipcRenderer.invoke('generate-open-image', payload),
    generateVideoPrompt: (payload) => ipcRenderer.invoke('generate-video-prompt', payload),
    generateVideo: (payload) => ipcRenderer.invoke('generate-video', payload), 
    generateAdvancedVideo: (payload) => ipcRenderer.invoke('generate-advanced-video', payload),
    convertFileSrc: (filePath) => ipcRenderer.invoke('convert-file-src', filePath),
    getCharacterConstants: (characterName) => ipcRenderer.invoke('get-character-constants', characterName),
    getDefaultActions: () => ipcRenderer.invoke('get-default-actions'),

    // DeepAI Studio Functions
    deepaiImageEditor: (payload) => ipcRenderer.invoke('deepai-image-editor', payload),
    deepaiBackgroundRemover: (payload) => ipcRenderer.invoke('deepai-background-remover', payload),
    deepaiColorizer: (payload) => ipcRenderer.invoke('deepai-colorizer', payload),
    deepaiSuperResolution: (payload) => ipcRenderer.invoke('deepai-super-resolution', payload),
    deepaiWaifu2x: (payload) => ipcRenderer.invoke('deepai-waifu2x', payload),
    deepaiCreativeUpscale: (payload) => ipcRenderer.invoke('deepai-creative-upscale', payload),
    deepaiText2img: (payload) => ipcRenderer.invoke('deepai-text2img', payload),
    deepaiInpainting: (payload) => ipcRenderer.invoke('deepai-inpainting', payload),
    deepaiTestApiKey: () => ipcRenderer.invoke('deepai-test-api-key'),

    // Character Management
    getAvailableCharacters: () => ipcRenderer.invoke('get-available-characters'),
    getActiveCharacterName: () => ipcRenderer.invoke('get-active-character-name'),
    getActiveCharacterIcon: () => ipcRenderer.invoke('get-active-character-icon'),
    setActiveCharacter: (characterName) => ipcRenderer.invoke('set-active-character', characterName),

    // Desktop Pet Management
    launchPet: (characterName) => ipcRenderer.invoke('launch-pet', characterName),
    closePet: () => ipcRenderer.invoke('close-pet'),
    petSay: (text, duration) => ipcRenderer.invoke('pet-say', text, duration),
    petIsActive: () => ipcRenderer.invoke('pet-is-active'),
    
    // Shimeji Sprite Generation
    shimejiGenerateBase: (payload) => ipcRenderer.invoke('shimeji-generate-base', payload),
    shimejiGenerateDirections: (payload) => ipcRenderer.invoke('shimeji-generate-directions', payload),
    shimejiGenerateAnimations: (payload) => ipcRenderer.invoke('shimeji-generate-animations', payload),
    shimejiGenerateAll: (payload) => ipcRenderer.invoke('shimeji-generate-all', payload),
    shimejiGenerateManifest: (payload) => ipcRenderer.invoke('shimeji-generate-manifest', payload),
    shimejiProcessTransparency: (payload) => ipcRenderer.invoke('shimeji-process-transparency', payload),
    shimejiCostEstimate: () => ipcRenderer.invoke('shimeji-cost-estimate'),
    shimejiListPets: () => ipcRenderer.invoke('shimeji-list-pets'),
    shimejiDeletePet: (payload) => ipcRenderer.invoke('shimeji-delete-pet', payload),

    // Digital Signing
    signFiles: (files) => ipcRenderer.invoke('sign-files', files),
    verifySignature: (filePath) => ipcRenderer.invoke('verify-signature', filePath),

    // Listeners for async events from main
    onIngestionProgress: (cb) => ipcRenderer.on('ingestion-progress', (e, d) => cb(d)),
    onScrapyProgress: (cb) => ipcRenderer.on('scrapy-progress', (e, d) => cb(d)),
    onAppReady: (callback) => ipcRenderer.on('app-ready-to-continue', () => callback()),
    onImageGenCompleted: (cb) => ipcRenderer.on('image-gen-completed', (e, d) => cb(d)),
    onVideoGenProgress: (cb) => ipcRenderer.on('video-generation-progress', (e, d) => cb(d)),
    onRequestSessionHistory: (cb) => ipcRenderer.on('request-session-history', () => cb()),
    sendHistoryData: (payload) => ipcRenderer.invoke('send-history-data', payload),
    onExaResultFromTool: (cb) => ipcRenderer.on('exa-result-from-tool', (e, payload) => cb(payload)),
    onRefreshModelSelector: (cb) => ipcRenderer.on('refresh-model-selector', () => cb()),
    
    // Viewer Window Listeners
    onViewContent: (cb) => ipcRenderer.on('view-content', (e, payload) => cb(payload)),
    onHistoryData: (cb) => ipcRenderer.on('history-data', (e, payload) => cb(payload)),
    onLoadPrompt: (cb) => ipcRenderer.on('load-prompt', (e, prompt) => cb(prompt)),
    
    // Popup Window APIs
    getPopupPrompts: () => ipcRenderer.invoke('get-prompts'),
    savePopupPrompt: (promptData) => ipcRenderer.invoke('save-prompt', promptData),
    deletePopupPrompt: (promptId) => ipcRenderer.invoke('delete-prompt', promptId),
    usePopupPrompt: (promptId) => ipcRenderer.invoke('use-prompt', promptId),
    
    // Store & Secure Storage
    getStoredValue: (key) => ipcRenderer.invoke('store:get', key),
    setStoredValue: (key, value) => ipcRenderer.send('store:set', key, value),
    getTheme: () => ipcRenderer.invoke('get-theme'),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);