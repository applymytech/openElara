// src/main/handlers/deepaiHandlers.js
const { ipcMain, app } = require('electron');
const log = require('electron-log');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const FormData = require('form-data');
const { getDecryptedApiKeys } = require('./apiHandlers');

const OUTPUT_IMAGES_PATH = path.join(app.getPath('userData'), 'Output', 'images');

// Ensure output directory exists
async function ensureOutputDirectory() {
    await fs.mkdir(OUTPUT_IMAGES_PATH, { recursive: true });
}

// Helper function to save image with timestamp
async function saveImageFromBuffer(buffer, prefix = 'deepai') {
    await ensureOutputDirectory();
    const fileName = `${prefix}_${Date.now()}.png`;
    const filePath = path.join(OUTPUT_IMAGES_PATH, fileName);
    await fs.writeFile(filePath, buffer);
    return filePath;
}

// DeepAI Image Editor
async function _deepaiImageEditor(payload) {
    const { prompt, imageDataUrl, strength, steps, negativePrompt } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!imageDataUrl) {
        return { success: false, error: 'No image provided for editing.' };
    }

    if (!prompt) {
        return { success: false, error: 'Editing prompt is required.' };
    }

    try {
        // Extract base64 data from data URL
        const matches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!matches) {
            throw new Error('Invalid image data URL format.');
        }
        
        const imageBuffer = Buffer.from(matches[2], 'base64');
        
        // Create form data
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'input.png' });
        form.append('text', prompt);
        
        if (strength !== undefined) {
            form.append('strength', strength.toString());
        }
        
        if (steps !== undefined) {
            form.append('steps', steps.toString());
        }
        
        if (negativePrompt) {
            form.append('negative_prompt', negativePrompt);
        }

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending image editor request...');
        const response = await axios.post('https://api.deepai.org/api/image-editor', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading edited image...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'edited');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading edited image from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'edited');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Image editor failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

// DeepAI Background Remover
async function _deepaiBackgroundRemover(payload) {
    const { imageDataUrl } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!imageDataUrl) {
        return { success: false, error: 'No image provided for background removal.' };
    }

    try {
        // Extract base64 data from data URL
        const matches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!matches) {
            throw new Error('Invalid image data URL format.');
        }
        
        const imageBuffer = Buffer.from(matches[2], 'base64');
        
        // Create form data
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'input.png' });

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending background remover request...');
        const response = await axios.post('https://api.deepai.org/api/background-remover', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading background removed image...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'bg_removed');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading background removed image from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'bg_removed');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Background remover failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

// DeepAI Colorizer
async function _deepaiColorizer(payload) {
    const { imageDataUrl } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!imageDataUrl) {
        return { success: false, error: 'No image provided for colorization.' };
    }

    try {
        // Extract base64 data from data URL
        const matches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!matches) {
            throw new Error('Invalid image data URL format.');
        }
        
        const imageBuffer = Buffer.from(matches[2], 'base64');
        
        // Create form data
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'input.png' });

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending colorizer request...');
        const response = await axios.post('https://api.deepai.org/api/colorizer', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading colorized image...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'colorized');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading colorized image from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'colorized');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Colorizer failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

// DeepAI Super Resolution
async function _deepaiSuperResolution(payload) {
    const { imageDataUrl } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!imageDataUrl) {
        return { success: false, error: 'No image provided for super resolution.' };
    }

    try {
        // Extract base64 data from data URL
        const matches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!matches) {
            throw new Error('Invalid image data URL format.');
        }
        
        const imageBuffer = Buffer.from(matches[2], 'base64');
        
        // Create form data
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'input.png' });

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending super resolution request...');
        const response = await axios.post('https://api.deepai.org/api/torch-srgan', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading super resolution image...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'super_res');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading super resolution image from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'super_res');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Super resolution failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

// DeepAI Waifu2x
async function _deepaiWaifu2x(payload) {
    const { imageDataUrl } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!imageDataUrl) {
        return { success: false, error: 'No image provided for Waifu2x processing.' };
    }

    try {
        // Extract base64 data from data URL
        const matches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!matches) {
            throw new Error('Invalid image data URL format.');
        }
        
        const imageBuffer = Buffer.from(matches[2], 'base64');
        
        // Create form data
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'input.png' });

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending Waifu2x request...');
        const response = await axios.post('https://api.deepai.org/api/waifu2x', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading Waifu2x image...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'waifu2x');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading Waifu2x image from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'waifu2x');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Waifu2x failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

// DeepAI Creative Upscale
async function _deepaiCreativeUpscale(payload) {
    const { imageDataUrl } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!imageDataUrl) {
        return { success: false, error: 'No image provided for creative upscale.' };
    }

    try {
        // Extract base64 data from data URL
        const matches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!matches) {
            throw new Error('Invalid image data URL format.');
        }
        
        const imageBuffer = Buffer.from(matches[2], 'base64');
        
        // Create form data
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'input.png' });

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending creative upscale request...');
        const response = await axios.post('https://api.deepai.org/api/creative-upscale', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading creative upscale image...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'creative_upscale');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading creative upscale image from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'creative_upscale');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Creative upscale failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

// DeepAI Text to Image
async function _deepaiText2Img(payload) {
    const { prompt } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!prompt) {
        return { success: false, error: 'Text prompt is required for text-to-image generation.' };
    }

    try {
        // Create form data
        const form = new FormData();
        form.append('text', prompt);

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending text-to-image request...');
        const response = await axios.post('https://api.deepai.org/api/text2img', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading text-to-image result...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'text2img');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading text-to-image result from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'text2img');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Text-to-image failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

// DeepAI Inpainting
async function _deepaiInpainting(payload) {
    const { imageDataUrl, maskDataUrl, prompt } = payload;
    const apiKeys = await getDecryptedApiKeys();
    const deepaiKey = apiKeys.deepaiApiKey;

    if (!deepaiKey) {
        return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
    }

    if (!imageDataUrl) {
        return { success: false, error: 'No image provided for inpainting.' };
    }

    if (!maskDataUrl) {
        return { success: false, error: 'No mask provided for inpainting.' };
    }

    if (!prompt) {
        return { success: false, error: 'Prompt is required for inpainting.' };
    }

    try {
        // Extract base64 data from data URLs
        const imageMatches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!imageMatches) {
            throw new Error('Invalid image data URL format.');
        }
        
        const maskMatches = maskDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.*)$/);
        if (!maskMatches) {
            throw new Error('Invalid mask data URL format.');
        }
        
        const imageBuffer = Buffer.from(imageMatches[2], 'base64');
        const maskBuffer = Buffer.from(maskMatches[2], 'base64');
        
        // Create form data
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'input.png' });
        form.append('mask', maskBuffer, { filename: 'mask.png' });
        form.append('text', prompt);

        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        
        log.info('[DeepAI] Sending inpainting request...');
        const response = await axios.post('https://api.deepai.org/api/inpainting', form, { 
            headers, 
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && response.data.output_url) {
            log.info('[DeepAI] Downloading inpainted image...');
            const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'inpainted');
            return { success: true, filePath };
        } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
            log.info('[DeepAI] Downloading inpainted image from array...');
            const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
            const filePath = await saveImageFromBuffer(Buffer.from(imageResponse.data), 'inpainted');
            return { success: true, filePath };
        } else {
            throw new Error('No output URL in DeepAI response.');
        }
    } catch (error) {
        log.error(`[DeepAI] Inpainting failed: ${error.message}`);
        if (error.response) {
            log.error(`[DeepAI] Response status: ${error.response.status}`);
            log.error(`[DeepAI] Response data: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: error.message };
    }
}

const setupDeepAIHandlers = () => {
    ipcMain.handle('deepai-image-editor', async (event, payload) => {
        log.info('[DeepAI] Received image editor request');
        return await _deepaiImageEditor(payload);
    });

    ipcMain.handle('deepai-background-remover', async (event, payload) => {
        log.info('[DeepAI] Received background remover request');
        return await _deepaiBackgroundRemover(payload);
    });

    ipcMain.handle('deepai-colorizer', async (event, payload) => {
        log.info('[DeepAI] Received colorizer request');
        return await _deepaiColorizer(payload);
    });

    ipcMain.handle('deepai-super-resolution', async (event, payload) => {
        log.info('[DeepAI] Received super resolution request');
        return await _deepaiSuperResolution(payload);
    });

    ipcMain.handle('deepai-waifu2x', async (event, payload) => {
        log.info('[DeepAI] Received Waifu2x request');
        return await _deepaiWaifu2x(payload);
    });

    ipcMain.handle('deepai-creative-upscale', async (event, payload) => {
        log.info('[DeepAI] Received creative upscale request');
        return await _deepaiCreativeUpscale(payload);
    });

    ipcMain.handle('deepai-text2img', async (event, payload) => {
        log.info('[DeepAI] Received text-to-image request');
        return await _deepaiText2Img(payload);
    });

    ipcMain.handle('deepai-inpainting', async (event, payload) => {
        log.info('[DeepAI] Received inpainting request');
        return await _deepaiInpainting(payload);
    });

    ipcMain.handle('deepai-test-api-key', async (event) => {
        log.info('[DeepAI] Testing API key');
        const apiKeys = await getDecryptedApiKeys();
        const deepaiKey = apiKeys.deepaiApiKey;

        if (!deepaiKey) {
            return { success: false, error: 'DeepAI API key not configured. Please set it in Account Settings.' };
        }

        try {
            // Test the API key with a simple request
            const response = await axios.get('https://api.deepai.org/docs', {
                headers: { 'api-key': deepaiKey },
                timeout: 10000
            });
            
            // If we get here, the API key is valid
            return { success: true, message: 'DeepAI API key is valid and configured correctly.' };
        } catch (error) {
            log.error(`[DeepAI] API key test failed: ${error.message}`);
            if (error.response && error.response.status === 401) {
                return { success: false, error: 'Invalid DeepAI API key. Please check your key in Account Settings.' };
            }
            return { success: false, error: `Failed to validate DeepAI API key: ${error.message}` };
        }
    });
};

module.exports = { setupDeepAIHandlers };