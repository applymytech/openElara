const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const log = require('electron-log');
const fs = require('fs');
const { setupIpcHandlers } = require('./src/main/ipcHandlers.js');
const { ensureOutputSubdirs } = require('./src/main/handlers/fileSystemHandlers.js');

const ensureDirectories = () => {
    const userDataPath = app.getPath('userData');
    const dirsToCreate = [
        path.join(userDataPath, 'logs'),
        path.join(userDataPath, 'knowledge'),
        path.join(userDataPath, 'Output')
    ];
    dirsToCreate.forEach(dirPath => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
};

let mainWindow = null;

let ollamaProcess = null;

const executeOllama = (ollamaExePath) => {
    return new Promise((resolve) => {
        if (ollamaProcess) {
            log.info('Ollama process is already running.');
            return resolve({ success: true, message: "Ollama is already running." });
        }

        log.info(`Attempting to launch Ollama from: ${ollamaExePath}`);

        try {
            ollamaProcess = spawn(ollamaExePath, ['serve'], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true,
            });

            ollamaProcess.unref();

            setTimeout(() => {
                log.info('Ollama launch process started successfully.');
                resolve({ success: true, message: "Ollama process started." });
            }, 5000);
            
            ollamaProcess.on('error', (err) => {
                log.error(`Ollama failed to launch: ${err.message}`);
                ollamaProcess = null;
                resolve({ success: false, error: `Failed to launch Ollama executable: ${err.message}` });
            });

        } catch (e) {
            log.error(`Failed to execute Ollama via spawn: ${e.message}`);
            ollamaProcess = null;
            resolve({ success: false, error: `Critical failure during launch: ${e.message}` });
        }
    });
};

function createWindow() {
    log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
    log.info('Creating main application window...');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
    
    // Load loading.html with proper video path for packaged app
    if (app.isPackaged) {
        // For packaged app, video is in app.asar.unpacked
        const videoPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'openElara_loading.mp4');
        mainWindow.loadFile(path.join(__dirname, 'loading.html'), {
            query: { videoPath: videoPath }
        });
    } else {
        // For development, video is in root directory
        mainWindow.loadFile(path.join(__dirname, 'loading.html'));
    }
    
    mainWindow.on('close', () => {
        const allWindows = BrowserWindow.getAllWindows();
        allWindows.forEach(win => {
            if (win !== mainWindow && !win.isDestroyed()) {
                win.close();
            }
        });
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createViewerWindow(contentId, contentType, themeData) {
    const viewerWindow = new BrowserWindow({
        width: 700,
        height: 500,
        title: `Elara Viewer: ${contentType}`,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    viewerWindow.loadFile(path.join(__dirname, 'viewer', 'viewer.html'));
    viewerWindow.once('ready-to-show', () => {
        viewerWindow.webContents.send('view-content', { id: contentId, type: contentType, theme: themeData });
    });
    
    return viewerWindow;
}


// Function to setup Python environment on first run
async function setupPythonEnvironment() {
    const Store = require('electron-store');
    const store = new Store();
    const hasRunSetup = store.get('hasRunPythonSetup', false);
    
    if (hasRunSetup) {
        log.info('Python environment setup already completed, skipping.');
        return true;
    }
    
    log.info('Setting up Python environment for the first time...');
    
    try {
        const { spawn } = require('child_process');
        const path = require('path');
        
        // Path to the setup script
        const backendPath = app.isPackaged ? path.join(process.resourcesPath, 'backend') : path.join(__dirname, 'backend');
        const setupScriptPath = path.join(backendPath, 'setup_python_env.py');
        
        log.info(`Running Python setup script: ${setupScriptPath}`);
        
        // Run the Python setup script
        const pythonProcess = spawn('python', [setupScriptPath]);
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            log.info(`[Python Setup STDOUT]: ${output}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            const errorOutput = data.toString();
            stderr += errorOutput;
            log.error(`[Python Setup STDERR]: ${errorOutput}`);
        });
        
        return new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    const fullError = (stdout + "\n" + stderr).trim();
                    log.error(`Python setup failed with code ${code}. Full Error: ${fullError}`);
                    reject(new Error(fullError || `Python setup process exited with code ${code}`));
                } else {
                    log.info('Python environment setup completed successfully.');
                    store.set('hasRunPythonSetup', true);
                    resolve(true);
                }
            });
            
            pythonProcess.on('error', (err) => {
                log.error('Failed to start Python setup script:', err);
                reject(err);
            });
        });
    } catch (error) {
        log.error('Error during Python environment setup:', error);
        return false;
    }
}

app.whenReady().then(async () => {
    log.info('<<<<< MAIN.JS app.whenReady() HAS STARTED >>>>>');
    log.info('Electron is ready.');
    ensureDirectories();
    
    // Setup Python environment on first run
    try {
        await setupPythonEnvironment();
        log.info('Python environment setup check completed.');
    } catch (error) {
        log.error('Failed to setup Python environment:', error);
        // We don't want to stop the app from starting if Python setup fails
        // The user will see errors when they try to use Python features
    }
    
    ensureOutputSubdirs().then(() => {
        log.info('Output subdirectories created successfully');
    }).catch(err => {
        log.error('Startup failed to create output folders:', err);
    });

    const Store = require('electron-store');
    const store = new Store();
    const { loadCharacter } = require('./src/main/characters');
    const activeCharacterName = store.get('activeCharacter', 'elara');
    loadCharacter(activeCharacterName);
    log.info(`Active character loaded: ${activeCharacterName}`);

    const menuTemplate = [{ label: 'File', submenu: [{ role: 'quit' }] }];
    if (!app.isPackaged) {
        menuTemplate.push({
            label: 'Developer',
            submenu: [{ role: 'toggleDevTools' }, { role: 'reload' }]
        });
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    createWindow();

    setupIpcHandlers(mainWindow, app);
    log.info('<<<<< MAIN.JS call to setupIpcHandlers() HAS COMPLETED >>>>>');
    
    setTimeout(() => {
        mainWindow.webContents.send('app-ready-to-continue');
    }, 500);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('start-main-app', async () => {
    if (mainWindow) {
        await mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }
    return { success: true };
});

ipcMain.on('return-to-login', async () => {
    if (mainWindow) {
        await mainWindow.webContents.session.clearStorageData({ storages: ['sessionstorage'] });
        await mainWindow.loadFile(path.join(__dirname, 'account', 'account.html'));
    }
});

ipcMain.on('loading-video-finished', () => {
    if (mainWindow) {
        log.info('User clicked to continue, navigating to account.html');
        mainWindow.loadFile(path.join(__dirname, 'account', 'account.html'));
    }
});

ipcMain.handle('open-viewer-window', (event, { id, type, themeData, collection }) => {
    log.info(`Opening viewer window for type: ${type}, ID: ${id}`);
    
    if (type === 'history') {
        createHistoryWindow(themeData);
    } else if (type === 'memories-list' || type === 'knowledge-list') {
        const viewerWindow = createViewerWindow(id, type, themeData);
        viewerWindow.once('ready-to-show', () => {
            viewerWindow.webContents.send('view-content', { 
                id, 
                type, 
                collection,
                theme: themeData 
            });
        });
    } else {
        createViewerWindow(id, type, themeData);
    }
    
    return { success: true };
});

ipcMain.handle('open-file-converter', (event) => {
    log.info('Opening File Converter window');
    createFileConverterWindow();
    return { success: true };
});

ipcMain.handle('open-scrapy-window', (event) => {
    log.info('Opening Enhanced Scrapy window');
    createScrapyWindow();
    return { success: true };
});

ipcMain.handle('open-power-knowledge', (event) => {
    log.info('Opening Power Knowledge window');
    createPowerKnowledgeWindow();
    return { success: true };
});

ipcMain.handle('open-advanced-image-gen-window', (event) => {
    log.info('Opening Advanced Image Generation window');
    createAdvancedImageGenWindow();
    return { success: true };
});

ipcMain.handle('open-advanced-video-gen-window', (event) => {
    log.info('Opening Advanced Video Generation window');
    createAdvancedVideoGenWindow();
    return { success: true };
});

ipcMain.handle('open-deepai-studio-window', (event) => {
    log.info('Opening DeepAI Studio window');
    createDeepAIStudioWindow();
    return { success: true };
});

ipcMain.handle('send-exa-result-to-chat', (event, payload) => {
    log.info('Forwarding Exa result to main window for chat/RAG');
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('exa-result-from-tool', payload);
        return { success: true };
    } else {
        log.warn('Main window not found');
        return { success: false, error: 'Main window not found' };
    }
});

ipcMain.handle('send-history-data', (event, { history, theme }) => {
    const allWindows = BrowserWindow.getAllWindows();
    const historyWindow = allWindows.find(win => win.getTitle().includes('Session History'));
    
    if (historyWindow) {
        historyWindow.webContents.send('history-data', { history, theme });
        return { success: true };
    } else {
        log.warn('History window not found');
        return { success: false, error: 'History window not found' };
    }
});

function createHistoryWindow(themeData) {
    const historyWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Session History',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    historyWindow.loadFile(path.join(__dirname, 'history', 'history.html'));
    historyWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.webContents.send('request-session-history');
        }
    });
    
    return historyWindow;
}

function createFileConverterWindow() {
    const converterWindow = new BrowserWindow({
        width: 950,
        height: 850,
        title: 'File Converter - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: !app.isPackaged,
        },
    });

    converterWindow.loadFile(path.join(__dirname, 'file-converter', 'file-converter.html'));
    
    return converterWindow;
}

function createScrapyWindow() {
    const scrapyWindow = new BrowserWindow({
        width: 950,
        height: 900,
        title: 'Power Scrape - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: !app.isPackaged,
        },
    });

    scrapyWindow.loadFile(path.join(__dirname, 'scrapy', 'scrapy.html'));
    
    return scrapyWindow;
}

function createPowerKnowledgeWindow() {
    const knowledgeWindow = new BrowserWindow({
        width: 1050,
        height: 900,
        title: 'Power Knowledge - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: !app.isPackaged,
        },
    });

    knowledgeWindow.loadFile(path.join(__dirname, 'power-knowledge', 'power-knowledge.html'));
    
    return knowledgeWindow;
}

function createAdvancedImageGenWindow() {
    const imageGenWindow = new BrowserWindow({
        width: 900,
        height: 850,
        title: 'Advanced Image Generation - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    // Prevent window from closing if there's an active generation task
    imageGenWindow.on('close', (event) => {
        const title = imageGenWindow.getTitle();
        if (title.includes('(Generating...)')) {
            const choice = require('electron').dialog.showMessageBoxSync(imageGenWindow, {
                type: 'question',
                buttons: ['Cancel Generation', 'Keep Running in Background', 'Wait for Completion'],
                defaultId: 2,
                cancelId: 1,
                title: 'Image Generation in Progress',
                message: 'An image generation task is currently in progress.',
                detail: 'You can cancel the generation, keep it running in the background, or wait for it to complete.'
            });

            if (choice === 0) {
                // Cancel generation - close window normally
                return;
            } else if (choice === 1) {
                // Keep running in background - hide window but don't close
                event.preventDefault();
                imageGenWindow.hide();
                return false;
            } else {
                // Wait for completion - prevent closing
                event.preventDefault();
                return false;
            }
        }
    });

    imageGenWindow.loadFile(path.join(__dirname, 'advanced-image-gen', 'advanced-image-gen.html'));
    
    return imageGenWindow;
}

function createAdvancedVideoGenWindow() {
    const videoGenWindow = new BrowserWindow({
        width: 900,
        height: 850,
        title: 'Advanced Video Generation - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    // Prevent window from closing if there's an active generation task
    videoGenWindow.on('close', (event) => {
        const title = videoGenWindow.getTitle();
        if (title.includes('(Generating...)')) {
            const choice = require('electron').dialog.showMessageBoxSync(videoGenWindow, {
                type: 'question',
                buttons: ['Cancel Generation', 'Keep Running in Background', 'Wait for Completion'],
                defaultId: 2,
                cancelId: 1,
                title: 'Video Generation in Progress',
                message: 'A video generation task is currently in progress.',
                detail: 'You can cancel the generation, keep it running in the background, or wait for it to complete.'
            });

            if (choice === 0) {
                // Cancel generation - close window normally
                return;
            } else if (choice === 1) {
                // Keep running in background - hide window but don't close
                event.preventDefault();
                videoGenWindow.hide();
                return false;
            } else {
                // Wait for completion - prevent closing
                event.preventDefault();
                return false;
            }
        }
    });

    videoGenWindow.loadFile(path.join(__dirname, 'advanced-video-gen', 'advanced-video-gen.html'));
    
    return videoGenWindow;
}

function createDeepAIStudioWindow() {
    const deepaiWindow = new BrowserWindow({
        width: 1000,
        height: 850,
        title: 'DeepAI Studio - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    deepaiWindow.loadFile(path.join(__dirname, 'deepai-studio', 'deepai-studio.html'));
    
    return deepaiWindow;
}

function createPromptManagerWindow(parentWindowType = null) {
    const promptWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Prompt Manager - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    // Pass parent window type as a query parameter
    const url = parentWindowType 
        ? `file://${path.join(__dirname, 'prompt-manager', 'prompt-manager.html')}?parent=${parentWindowType}`
        : `file://${path.join(__dirname, 'prompt-manager', 'prompt-manager.html')}`;
    
    promptWindow.loadURL(url);
    
    return promptWindow;
}

function createActionManagerWindow() {
    const actionWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        title: 'Action Manager - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    actionWindow.loadFile(path.join(__dirname, 'action-manager', 'action-manager.html'));
    
    return actionWindow;
}

function createSignerWindow() {
    const signerWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        title: 'Digital Content Signer - OpenElara',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged,
        },
    });

    signerWindow.loadFile(path.join(__dirname, 'signer', 'signer.html'));
    
    return signerWindow;
}

module.exports = {
    createPromptManagerWindow,
    createActionManagerWindow,
    createSignerWindow,
    createDeepAIStudioWindow
};
