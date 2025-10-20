const { ipcMain } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const { runPythonScript } = require('../utils');

class WatermarkManager {
    constructor() {
        this.enabled = true;
        this.watermarkVersion = '1.0';
    }

    async watermarkImage(imagePath, generationContext) {
        if (!this.enabled) return { success: false, reason: 'Watermarking disabled' };

        try {
            const metadata = {
                content_type: 'image',
                model_info: {
                    name: generationContext.model || 'unknown',
                    provider: generationContext.provider || 'unknown',
                    type: 'image_generation'
                },
                generation_params: {
                    prompt: generationContext.prompt || '',
                    settings: generationContext.settings || {},
                    seed: generationContext.seed,
                    parent_id: generationContext.parent_id
                }
            };

            const result = await runPythonScript({
                scriptName: 'content_watermark.py',
                args: [JSON.stringify({
                    action: 'watermark',
                    content_path: imagePath,
                    metadata: metadata
                })]
            });

            log.info(`Image watermarked: ${imagePath}`);
            return { success: true, metadata: result };

        } catch (error) {
            log.error(`Watermarking failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async watermarkVideo(videoPath, generationContext) {
        if (!this.enabled) return { success: false, reason: 'Watermarking disabled' };

        try {
            const metadata = {
                content_type: 'video',
                model_info: {
                    name: generationContext.model || 'unknown',
                    provider: generationContext.provider || 'unknown',
                    type: 'video_generation'
                },
                generation_params: {
                    prompt: generationContext.prompt || '',
                    settings: generationContext.settings || {},
                    seed: generationContext.seed,
                    parent_id: generationContext.parent_id
                }
            };

            const result = await runPythonScript({
                scriptName: 'content_watermark.py',
                args: [JSON.stringify({
                    action: 'watermark',
                    content_path: videoPath,
                    metadata: metadata
                })]
            });

            log.info(`Video watermarked: ${videoPath}`);
            return { success: true, metadata: result };

        } catch (error) {
            log.error(`Watermarking failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async watermarkDocument(docPath, generationContext) {
        if (!this.enabled) return { success: false, reason: 'Watermarking disabled' };

        try {
            const metadata = {
                generator: 'OpenElara',
                version: this.watermarkVersion,
                contentType: 'document',
                generatedAt: new Date().toISOString(),
                model: generationContext.model || 'unknown',
                notice: 'AI-assisted content. Created with OpenElara.',
                disclaimer: 'This content was created with AI assistance. Verify information independently.'
            };

            const sidecarPath = docPath + '.openelara.json';
            fs.writeFileSync(sidecarPath, JSON.stringify(metadata, null, 2));

            log.info(`Document watermarked (sidecar): ${docPath}`);
            return { success: true, sidecarPath };

        } catch (error) {
            log.error(`Document watermarking failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async verifyWatermark(filePath) {
        try {
            const sidecarPath = filePath + '.openelara.json';
            if (fs.existsSync(sidecarPath)) {
                const metadata = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
                return {
                    verified: true,
                    source: 'sidecar',
                    metadata: metadata
                };
            }

            const result = await runPythonScript({
                scriptName: 'content_watermark.py',
                args: [JSON.stringify({
                    action: 'verify',
                    content_path: filePath
                })]
            });

            if (result && result.metadata) {
                return {
                    verified: true,
                    source: 'embedded',
                    metadata: result.metadata
                };
            }

            return { verified: false, message: 'No watermark found' };

        } catch (error) {
            log.error(`Verification failed: ${error.message}`);
            return { verified: false, error: error.message };
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        log.info(`Watermarking ${enabled ? 'enabled' : 'disabled'}`);
    }
}

const watermarkManager = new WatermarkManager();


function setupWatermarkHandlers() {
    ipcMain.handle('watermark-image', async (event, { imagePath, context }) => {
        return await watermarkManager.watermarkImage(imagePath, context);
    });

    ipcMain.handle('watermark-video', async (event, { videoPath, context }) => {
        return await watermarkManager.watermarkVideo(videoPath, context);
    });

    ipcMain.handle('watermark-document', async (event, { docPath, context }) => {
        return await watermarkManager.watermarkDocument(docPath, context);
    });

    ipcMain.handle('verify-watermark', async (event, { filePath }) => {
        return await watermarkManager.verifyWatermark(filePath);
    });

    ipcMain.handle('set-watermarking', async (event, { enabled }) => {
        watermarkManager.setEnabled(enabled);
        return { success: true, enabled };
    });

    log.info('Watermark handlers initialized');
}

module.exports = {
    setupWatermarkHandlers,
    watermarkManager
};
