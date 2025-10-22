const { app, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const log = require('electron-log');
const { runPythonScript } = require('../utils');

const OUTPUT_ROOT = path.join(app.getPath('userData'), 'Output');
const OUTPUT_EXA = path.join(OUTPUT_ROOT, 'exa');
const OUTPUT_SCRAPY = path.join(OUTPUT_ROOT, 'scrapy');
const OUTPUT_IMAGES = path.join(OUTPUT_ROOT, 'images');
const OUTPUT_VIDEOS = path.join(OUTPUT_ROOT, 'videos');
const OUTPUT_CONVERSIONS = path.join(OUTPUT_ROOT, 'conversions');
const OUTPUT_SIGNED = path.join(OUTPUT_ROOT, 'signed');

const ensureOutputSubdirs = async () => {
    log.info(`Ensuring output subdirectories exist...`);
    log.info(`OUTPUT_ROOT: ${OUTPUT_ROOT}`);
    log.info(`OUTPUT_EXA: ${OUTPUT_EXA}`);
    
    await fs.mkdir(OUTPUT_EXA, { recursive: true });
    await fs.mkdir(OUTPUT_SCRAPY, { recursive: true });
    await fs.mkdir(OUTPUT_IMAGES, { recursive: true });
    await fs.mkdir(OUTPUT_VIDEOS, { recursive: true });
    await fs.mkdir(OUTPUT_CONVERSIONS, { recursive: true });
    await fs.mkdir(OUTPUT_SIGNED, { recursive: true });
    
    log.info(`Output subdirectories creation attempted`);
};

const setupFileSystemHandlers = (mainWindow) => {
    log.info('Setting up File System IPC handlers...');
    
    ipcMain.handle('dialog:openFile', async (event, options) => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, options);
        if (canceled) return null;
        const files = await Promise.all(filePaths.map(async p => {
            try {
                const raw = await fs.readFile(p);
                let content = raw.toString('utf8');

                const hasReplacement = content.includes('\uFFFD');
                const controlBytes = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content);

                let encodingUsed = 'utf8';
                if (hasReplacement || controlBytes) {
                    content = raw.toString('latin1');
                    encodingUsed = 'latin1';
                }

                if (content.startsWith('\uFEFF')) {
                    content = content.slice(1);
                }

                log.info(`[dialog:openFile] Read file: ${p} (size=${raw.length} bytes, encoding=${encodingUsed})`);

                return { filename: path.basename(p), content: content };
            } catch (err) {
                log.error(`Failed to read file ${p}: ${err}`);
                return { filename: path.basename(p), content: null };
            }
        }));
        return files;
    });

    ipcMain.handle('dialog:selectKnowledgeFiles', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            title: 'Select Knowledge Files for Ingestion',
            filters: [{ name: 'Documents', extensions: ['txt', 'md', 'pdf', 'docx', 'csv', 'xlsx'] }, { name: 'All Files', extensions: ['*'] }]
        });
        if (canceled || filePaths.length === 0) return null;
        return filePaths;
    });

    ipcMain.handle('dialog:selectFolder', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Select Folder for Ingestion'
        });
        if (canceled || filePaths.length === 0) return null;
        return filePaths[0];
    });

    ipcMain.handle('readFileAsBase64', async (event, filePath) => {
        try {
            const data = await fs.readFile(filePath);
            const ext = path.extname(filePath).toLowerCase();
            let mimeType = 'application/octet-stream';
            
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.webp') mimeType = 'image/webp';
            
            return { success: true, dataUrl: `data:${mimeType};base64,${data.toString('base64')}` };
        } catch (error) {
            log.error(`Failed to read file for Base64 conversion (${filePath}): ${error.message}`);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('read-file-as-base64', async (event, filePath) => {
        try {
            const data = await fs.readFile(filePath);
            const ext = path.extname(filePath).toLowerCase();
            let mimeType = 'application/octet-stream';
            
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.webp') mimeType = 'image/webp';
            
            return { success: true, dataUrl: `data:${mimeType};base64,${data.toString('base64')}` };
        } catch (error) {
            log.error(`Failed to read file for Base64 conversion (${filePath}): ${error.message}`);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('getMemoryContentById', async (event, { id, collection }) => {
        const userDataPath = app.getPath('userData');
        try {
            const result = await runPythonScript({ 
                scriptName: 'rag_backend.py', 
                args: ['list_items', collection, userDataPath],
                inputData: JSON.stringify({ ids: [id], full_content: true })
            });
            
            if (result.documents && result.documents.length > 0) {
                return { success: true, content: result.documents[0] };
            } else {
                return { success: false, error: `Item not found or empty in collection: ${collection}.` };
            }
        } catch (error) {
            log.error(`Failed to fetch memory content for ID ${id} in ${collection}: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    // --- RAG Database Handlers ---

    ipcMain.handle('run-ingestion', async (event, filePaths) => {
        if (!filePaths || filePaths.length === 0) return { success: false, error: "No file paths provided." };
        try {
            const userDataPath = app.getPath('userData');
            await runPythonScript({
                scriptName: 'ingestion_orchestrator.py',
                args: [JSON.stringify(filePaths), userDataPath],
                event: event,
                progressChannel: 'ingestion-progress'
            });
            return { success: true, message: 'Ingestion process started.' };
        } catch (error) {
            log.error(`Ingestion failed: ${error}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clear-knowledge-base', () => {
        const userDataPath = app.getPath('userData');
        return runPythonScript({ scriptName: 'rag_backend.py', args: ['clear_collection', 'knowledge_base', userDataPath] });
    });

    ipcMain.handle('clear-chat-history', () => {
        const userDataPath = app.getPath('userData');
        return runPythonScript({ scriptName: 'rag_backend.py', args: ['clear_collection', 'chat_history', userDataPath] });
    });
    
    ipcMain.handle('get-memories', (event, { collection, limit = null, offset = 0 }) => {
        const userDataPath = app.getPath('userData');
        const payload = {
            limit: limit,
            offset: offset 
        };
        return runPythonScript({ 
            scriptName: 'rag_backend.py', 
            args: ['list_items', collection, userDataPath],
            inputData: JSON.stringify(payload)
        });
    });
    
    ipcMain.handle('remove-memory', (event, { collection, id }) => {
        const userDataPath = app.getPath('userData');
        return runPythonScript({ scriptName: 'rag_backend.py', args: ['delete_items', collection, userDataPath], inputData: JSON.stringify([id]) });
    });

    // --- Output Folder Handlers ---
    ipcMain.handle('get-output-path', () => OUTPUT_ROOT); 
    ipcMain.handle('open-output-folder', () => shell.openPath(OUTPUT_ROOT));
    ipcMain.handle('openImagesOutputFolder', () => {
        shell.openPath(OUTPUT_IMAGES);
        return { success: true };
    });
    
    ipcMain.handle('openVideosOutputFolder', () => {
        shell.openPath(OUTPUT_VIDEOS);
        return { success: true };
    });

    ipcMain.handle('openConversionsOutputFolder', () => {
        shell.openPath(OUTPUT_CONVERSIONS);
        return { success: true };
    });

    ipcMain.handle('clear-output-folder', async () => {
        try {
            const dirs = [OUTPUT_EXA, OUTPUT_SCRAPY, OUTPUT_IMAGES, OUTPUT_VIDEOS];
            await Promise.all(dirs.map(async dirPath => {
                const files = await fs.readdir(dirPath);
                await Promise.all(files.map(file => fs.unlink(path.join(dirPath, file))));
            }));
            return { success: true, message: "All output sub-folders cleared." };
        } catch (error) {
            log.error(`Failed to clear output sub-folders: ${error.message}`);
            return { success: false, error: error.message };
        }
    });
    
    // Sub-folder path getters
    ipcMain.handle('get-exa-output-path', () => OUTPUT_EXA);
    ipcMain.handle('get-scrapy-output-path', () => OUTPUT_SCRAPY);
    ipcMain.handle('open-exa-output-folder', () => shell.openPath(OUTPUT_EXA));
    ipcMain.handle('clear-exa-output-folder', async () => {
        try {
            const files = await fs.readdir(OUTPUT_EXA);
            await Promise.all(files.map(file => fs.unlink(path.join(OUTPUT_EXA, file))));
            return { success: true, message: "Exa output folder cleared." };
        } catch (error) {
            log.error(`Failed to clear Exa output folder: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-scrapy-output-folder', () => shell.openPath(OUTPUT_SCRAPY));
    ipcMain.handle('clear-scrapy-output-folder', async () => {
        try {
            const files = await fs.readdir(OUTPUT_SCRAPY);
            await Promise.all(files.map(file => fs.unlink(path.join(OUTPUT_SCRAPY, file))));
            return { success: true, message: "Scrapy output folder cleared." };
        } catch (error) {
            log.error(`Failed to clear Scrapy output folder: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-signed-output-folder', () => shell.openPath(OUTPUT_SIGNED));
    ipcMain.handle('clear-signed-output-folder', async () => {
        try {
            const files = await fs.readdir(OUTPUT_SIGNED);
            await Promise.all(files.map(file => fs.unlink(path.join(OUTPUT_SIGNED, file))));
            return { success: true, message: "Signed output folder cleared." };
        } catch (error) {
            log.error(`Failed to clear signed output folder: ${error.message}`);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('saveFile', async (event, { content, filename, targetDir = 'general' }) => {
        let targetPath;
        switch (targetDir) {
            case 'exa':
                targetPath = OUTPUT_EXA;
                break;
            case 'scrapy':
                targetPath = OUTPUT_SCRAPY;
                break;
            case 'images':
                targetPath = OUTPUT_IMAGES;
                break;
            case 'videos':
                targetPath = OUTPUT_VIDEOS;
                break;
            default:
                targetPath = OUTPUT_ROOT;
                break;
        }

        try {
            await fs.mkdir(targetPath, { recursive: true });
        } catch (mkdirError) {
            log.warn(`Could not create directory ${targetPath}: ${mkdirError.message}`);
        }

        const filePath = path.join(targetPath, filename);
        
        try {
            await fs.writeFile(filePath, content, { encoding: 'utf-8' });
            log.info(`File saved to: ${filePath}`);
            return { success: true, filePath };
        } catch (error) {
            log.error(`Error saving file to ${targetPath}: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-files-from-folder', async (event, folderPath) => {
        try {
            const getAllFiles = async (dirPath) => {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                const files = await Promise.all(entries.map(async (entry) => {
                    const fullPath = path.join(dirPath, entry.name);
                    if (entry.isDirectory()) {
                        return getAllFiles(fullPath);
                    } else {
                        return fullPath;
                    }
                }));
                return files.flat();
            };
            
            return await getAllFiles(folderPath);
        } catch (error) {
            log.error(`Failed to get files from folder: ${error.message}`);
            return [];
        }
    });

    ipcMain.handle('convert-file-src', (event, filePath) => {
        try {
            const { pathToFileURL } = require('url');
            const fileUrl = pathToFileURL(filePath).href;
            log.info(`[convertFileSrc] Input: ${filePath}`);
            log.info(`[convertFileSrc] Output: ${fileUrl}`);
            return fileUrl;
        } catch (e) {
            const normalizedPath = filePath.replace(/\\/g, '/');
            const fileUrl = `file:///${normalizedPath}`;
            log.warn(`[convertFileSrc:FALLBACK] ${e.message}. Using fallback URL: ${fileUrl}`);
            return fileUrl;
        }
    });
    
    ipcMain.handle('removeSource', (event, sourceName) => {
        const userDataPath = app.getPath('userData');
        return runPythonScript({ 
            scriptName: 'rag_backend.py', 
            args: ['delete_source', 'knowledge_base', userDataPath], 
            inputData: sourceName 
        });
    });
};

module.exports = { setupFileSystemHandlers, ensureOutputSubdirs };