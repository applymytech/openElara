const { ipcMain, app } = require('electron');
const log = require('electron-log');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { getActiveCharacter } = require('../characters');
const { getDecryptedApiKeys, routeApiCall } = require('./apiHandlers'); 
const { generateSelfieScenePrompt, generateVideoScenePrompt } = require('./taskHandlers'); 
const { watermarkManager } = require('./watermarkHandler');

const OUTPUT_VIDEOS_PATH = path.join(app.getPath('userData'), 'Output', 'videos');

const MODEL_ENDPOINT_MAP = {
    'aiml/pixverse/v5-full-t2v': { 
        endpoint: 'v2/generate/video/pixverse/generation', 
        model: 'pixverse/v5/text-to-video',
        paramMapping: {
            resolution: (val) => {
                if (!['360p', '540p', '720p', '1080p'].includes(val)) return '720p';
                return val;
            },
            duration: (val) => {
                if (val <= 6) return '5';
                return '8';
            },
            aspect_ratio: (val) => {
                if (!['16:9', '4:3', '1:1', '3:4', '9:16'].includes(val)) return '16:9';
                return val;
            }
        }
    },
    'aiml/pixverse/v5-full-i2v': { 
        endpoint: 'v2/generate/video/pixverse/generation', 
        model: 'pixverse/v5/image-to-video',
        paramMapping: {
            resolution: (val) => '720p',
            duration: (val) => {
                if (val <= 6) return '5';
                return '8';
            },
            aspect_ratio: (val) => {
                if (!['16:9', '4:3', '1:1', '3:4', '9:16'].includes(val)) return '16:9';
                return val;
            }
        }
    },
    
    'aiml/pixverse/t2v-basic': { 
        endpoint: 'v2/generate/video/pixverse/generation', 
        model: 'pixverse/v5/text-to-video',
        paramMapping: {
            duration: (val) => val <= 6 ? '5' : '8'
        }
    },
    'aiml/pixverse/v5-full': { 
        endpoint: 'v2/generate/video/pixverse/generation', 
        model: 'pixverse/v5/text-to-video',
        paramMapping: {
            duration: (val) => val <= 6 ? '5' : '8'
        }
    },
    'aiml/pixverse/i2v-only': { 
        endpoint: 'v2/generate/video/pixverse/generation', 
        model: 'pixverse/v5/image-to-video',
        paramMapping: {
            resolution: (val) => '720p',
            duration: (val) => val <= 6 ? '5' : '8'
        }
    },
    
    'openai/sora-2-t2v': { 
        endpoint: 'v2/video/generations', 
        model: 'openai/sora-2-t2v',
        paramMapping: {
            resolution: (val) => '720p',
            duration: (val) => {
                if (val <= 6) return 4;
                if (val <= 10) return 8;
                return 12;
            },
            aspect_ratio: (val) => {
                return val === '9:16' ? '9:16' : '16:9';
            }
        }
    },
    'openai/sora-2-i2v': { 
        endpoint: 'v2/video/generations', 
        model: 'openai/sora-2-i2v',
        paramMapping: {
            resolution: (val) => '720p',
            duration: (val) => {
                if (val <= 6) return 4;
                if (val <= 10) return 8;
                return 12;
            },
            aspect_ratio: (val) => {
                return val === '9:16' ? '9:16' : '16:9';
            }
        }
    },
    
    'google/veo-3.0-fast': { 
        endpoint: 'v2/generate/video/google/generation', 
        model: 'google/veo-3.0-fast',
        paramMapping: {
            resolution: (val) => {
                if (val.toLowerCase() === '1080p') return '1080P';
                return '720P';
            },
            duration: (val) => {
                if (val <= 5) return 4;
                if (val <= 7) return 6;
                return 8;
            },
            aspect_ratio: (val) => {
                return val === '9:16' ? '9:16' : '16:9';
            }
        },
        defaults: {
            enhance_prompt: true,
            generate_audio: true
        }
    },
    'google/veo-3.0-i2v-fast': { 
        endpoint: 'v2/generate/video/google/generation', 
        model: 'google/veo-3.0-i2v-fast',
        paramMapping: {
            resolution: (val) => {
                if (val.toLowerCase() === '1080p') return '1080P';
                return '720P';
            },
            duration: (val) => {
                if (val <= 5) return 4;
                if (val <= 7) return 6;
                return 8;
            },
            aspect_ratio: (val) => {
                return val === '9:16' ? '9:16' : '16:9';
            }
        },
        defaults: {
            enhance_prompt: true,
            generate_audio: true
        }
    },
    
    // Kling
    'kling-video/v1.6/standard/text-to-video': { 
        endpoint: 'v2/generate/video/kling/generation', 
        model: 'kling-video/v1.6/standard/text-to-video',
        paramMapping: {
            duration: (val) => {
                if (val <= 7) return 5;
                return 10;
            }
        },
        defaults: {
            effect_scene: 'general'
        }
    },
    'kling-video/v1.6/standard/image-to-video': { 
        endpoint: 'v2/generate/video/kling/generation', 
        model: 'kling-video/v1.6/standard/image-to-video',
        paramMapping: {
            duration: (val) => {
                if (val <= 7) return 5;
                return 10;
            }
        },
        defaults: {
            effect_scene: 'general'
        },
        i2vParamMapping: {
            image_url: 'image_list'
        }
    },
};

const API_BASE_URL = 'https://api.aimlapi.com';


async function pollForVideoResult(generationId, endpointPath, headers, event, generationMetadata = {}) {
    const startTime = Date.now();
    const timeout = 30 * 60 * 1000;
    let delay = 2000;
    const maxDelay = 30000;
    let attempt = 0;

    const pollUrl = `${API_BASE_URL}/${endpointPath}`;

    while (Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;

        const progressMessage = `Processing... (Check #${attempt}, next check in ${Math.round(delay / 1000)}s)`;
        event.sender.send('video-generation-progress', { status: 'processing', message: progressMessage });

        try {
            const pollResponse = await axios.get(`${pollUrl}?generation_id=${generationId}`, { headers });
            
            log.info(`[Polling ID: ${generationId}] Status: ${pollResponse.data.status}`);

            const { status, error } = pollResponse.data;

            if (status === 'error') {
                log.error(`Polling returned 'error' status. Full response:`, JSON.stringify(pollResponse.data, null, 2));
                const errorMsg = error || pollResponse.data.message || "Video generation failed due to content or model error. Try simplifying your prompt.";
                
                const errorMsgStr = String(errorMsg || 'Unknown error occurred');
                
                if (errorMsgStr.toLowerCase().includes('policy') || 
                    errorMsgStr.toLowerCase().includes('violation') || 
                    errorMsgStr.toLowerCase().includes('content filter') ||
                    errorMsgStr.toLowerCase().includes('inappropriate')) {
                    throw new Error(`Policy Violation: ${errorMsgStr}`);
                }
                throw new Error(errorMsgStr);
            }

            if (status === 'failed') {
                log.error(`Polling returned 'failed' status. Full response:`, JSON.stringify(pollResponse.data, null, 2));
                const errorMsg = error || pollResponse.data.message || `Video generation failed with status: ${status}`;
                
                const errorMsgStr = String(errorMsg || 'Unknown error occurred');
                
                if (errorMsgStr.toLowerCase().includes('policy') || 
                    errorMsgStr.toLowerCase().includes('violation') || 
                    errorMsgStr.toLowerCase().includes('content filter') ||
                    errorMsgStr.toLowerCase().includes('inappropriate')) {
                    throw new Error(`Policy Violation: ${errorMsgStr}`);
                }
                throw new Error(errorMsgStr);
            }

            if (status === 'rejected') {
                log.error(`Polling returned 'rejected' status. Full response:`, JSON.stringify(pollResponse.data, null, 2));
                const errorMsg = error || pollResponse.data.message || "Video generation was rejected by the API.";
                throw new Error(`Request Rejected: ${errorMsg}`);
            }

            if (status === 'completed') {
                const downloadUrl = pollResponse.data.video?.url;
                if (!downloadUrl) {
                    log.error('Generation complete, but no download URL found. Full response:', JSON.stringify(pollResponse.data, null, 2));
                    throw new Error('Generation complete, but the API did not provide a download URL.');
                }

                log.info(`Video generation complete. Downloading from: ${downloadUrl}`);
                event.sender.send('video-generation-progress', { status: 'downloading', message: 'Video complete! Downloading...' });

                const videoResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
                
                if (!fs.existsSync(OUTPUT_VIDEOS_PATH)) {
                    fs.mkdirSync(OUTPUT_VIDEOS_PATH, { recursive: true });
                }
                const videoPath = path.join(OUTPUT_VIDEOS_PATH, `video_${Date.now()}.mp4`);
                fs.writeFileSync(videoPath, videoResponse.data);
                log.info(`Video saved to: ${videoPath}`);
                
                event.sender.send('video-generation-progress', { status: 'watermarking', message: 'Watermarking video...' });
                log.info(`[Video Watermark] Starting watermarking for: ${videoPath}`);
                try {
                    await watermarkManager.watermarkVideo(videoPath, {
                        model: generationMetadata.model || 'unknown-video-model',
                        provider: 'aiml-api',
                        prompt: generationMetadata.prompt || 'AI-generated video',
                        settings: {
                            aspect_ratio: generationMetadata.aspect_ratio,
                            resolution: generationMetadata.resolution,
                            duration: generationMetadata.duration,
                            style: generationMetadata.style
                        },
                        mode: generationMetadata.mode || 'T2V'
                    });
                    log.info(`[Video Watermark] Successfully watermarked: ${videoPath}`);
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (watermarkError) {
                    log.error(`[Video Watermark] Failed (non-fatal): ${watermarkError.message}`);
                }
                
                log.info('[Video Watermark] Watermarking complete, returning result to renderer...');
                return { success: true, filePath: videoPath };
            }

            delay = Math.min(delay * 1.5, maxDelay);
        } catch (pollError) {
            if (pollError.isAxiosError && !pollError.response) {
                log.warn('Network error during polling, will retry:', pollError.message);
                delay = Math.min(delay * 1.5, maxDelay);
                continue;
            }
            throw pollError;
        }
    }
    throw new Error('Video generation timed out after 30 minutes.');
}

async function _executeVideoGeneration(event, payload) {
    const apiKeys = await getDecryptedApiKeys();
    
    const customModel = payload.customModel;
    
    let apiKey = payload.apiKey || apiKeys.aimlApiKey; 
    if (customModel && customModel.apiKey) {
        apiKey = customModel.apiKey;
    }
    if (!apiKey) throw new Error("AI/ML API Key is not configured in Account Settings.");

    let postUrl;
    let modelToUse;
    let paramMapping = {};
    let modelDefaults = {};
    let endpointPath;
    
    // modelConfig must be visible to later logic (I2V mapping); declare here
    let modelConfig = {};

    if (customModel && customModel.endpoint) {
        postUrl = customModel.endpoint;
        modelToUse = customModel.name;
        endpointPath = customModel.endpoint;
        log.info(`Using custom video model: ${customModel.name} (${customModel.id})`);
        log.info(`Custom endpoint: ${postUrl}`);
        modelConfig = customModel.modelConfig || {};
    } else {
        modelConfig = MODEL_ENDPOINT_MAP[payload.modelId] || { endpoint: 'v2/video/generations', model: payload.modelId };
        endpointPath = modelConfig.endpoint;
        modelToUse = modelConfig.model;
        paramMapping = modelConfig.paramMapping || {};
        modelDefaults = modelConfig.defaults || {};
        postUrl = `${API_BASE_URL}/${endpointPath}`;
    }

    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

    let requestBody = {};
    let generationMode = payload.i2vImageUrl ? 'I2V' : 'T2V';

    const mapParam = (paramName, value) => {
        if (paramMapping[paramName] && typeof paramMapping[paramName] === 'function') {
            return paramMapping[paramName](value);
        }
        return value;
    };

    requestBody = {
        "model": modelToUse,
        "prompt": payload.prompt,
        "aspect_ratio": mapParam('aspect_ratio', payload.aspect_ratio || "16:9"),
        "resolution": mapParam('resolution', payload.resolution || "720p"),
        "duration": mapParam('duration', payload.duration || 8),
    };
    
    Object.assign(requestBody, modelDefaults);
    
    if (payload.negative_prompt) {
        requestBody.negative_prompt = payload.negative_prompt;
    }
    if (payload.style) {
        requestBody.style = payload.style;
    }
    if (payload.seed) {
        requestBody.seed = payload.seed;
    }
    
    if (generationMode === 'I2V') {
        const i2vParamMapping = modelConfig.i2vParamMapping || {};
        const imageParamName = i2vParamMapping.image_url || 'image_url';
        
        if (imageParamName === 'image_list') {
            requestBody.image_list = [payload.i2vImageUrl];
        } else {
            requestBody.image_url = payload.i2vImageUrl;
        }
        
        log.info(`I2V mode: ${imageParamName} included in video request payload`);
    }

    if (payload.customPayload) {
        try {
            const customJson = JSON.parse(payload.customPayload);
            requestBody = { ...requestBody, ...customJson };
            log.info('Custom payload merged into request:', customJson);
        } catch (e) {
            log.warn(`Failed to parse custom payload JSON: ${e.message}`);
        }
    }

    if (customModel && customModel.customPayload) {
        try {
            log.info('Merging custom model payload for:', customModel.id);
            log.info('Custom model payload:', JSON.stringify(customModel.customPayload, null, 2));
            Object.assign(requestBody, customModel.customPayload);
        } catch (e) {
            log.warn(`Failed to merge custom model payload: ${e.message}`);
        }
    }

    log.info(`Submitting ${generationMode} generation task via ${modelToUse} to: ${postUrl}`);
    log.info(`Request body:`, JSON.stringify(requestBody, null, 2));
    const createResponse = await axios.post(postUrl, requestBody, { headers });

    const generationId = createResponse.data.id;
    if (!generationId) {
        log.error('API did not return a generation ID. Full response:', JSON.stringify(createResponse.data, null, 2));
        throw new Error('API did not return a generation ID.');
    }

    log.info(`Video task created with ID: ${generationId}`);
    event.sender.send('video-generation-progress', { status: 'submitted', message: `Task submitted. ID: ${generationId}` });
    
    const generationMetadata = {
        model: modelToUse,
        provider: customModel ? 'custom' : 'aiml-api',
        customModelId: customModel ? customModel.id : null,
        prompt: requestBody.prompt,
        aspect_ratio: requestBody.aspect_ratio,
        resolution: requestBody.resolution,
        duration: requestBody.duration,
        style: requestBody.style,
        mode: generationMode
    };
    
    return await pollForVideoResult(generationId, endpointPath, headers, event, generationMetadata); 
}


const setupVideoHandlers = () => {
    log.info('Setting up Video IPC handlers...');

    ipcMain.handle('generate-video-prompt', async (event, payload) => {
        log.info('Received generate-video-prompt request');
        try {
            return await generateVideoScenePrompt(payload);
        } catch (error) {
            log.error('Video scene prompt generation failed:', error.message);
            return {
                error: 'SCENE_PROMPT_FAILED',
                message: error.message || 'Failed to generate video scene prompt',
                suggestion: 'Try using a different model, increasing token limits, or simplifying your request.'
            };
        }
    });
    ipcMain.handle('generate-video', async (event, payload) => {
        try {
            const character = getActiveCharacter();
            
            const scenePrompt = payload.scenePrompt || `Generate a video of ${character.CHARACTER_NAME}, be creative!`;

            const { extractAndCleanThought } = require('./apiHandlers');
            const { cleanedAnswer, extractedThinking } = extractAndCleanThought(scenePrompt);
            const cleanedScenePrompt = cleanedAnswer;
            
            const finalAttire = payload.customAttire || character.CHARACTER_ATTIRE_FIRST_PERSON;
            const finalPrompt = `${character.CHARACTER_DESCRIPTION_SAFE_FIRST_PERSON}, ${finalAttire}, ${cleanedScenePrompt}`;
            log.info(`=== FULL VIDEO GENERATION PROMPT ===`);
            log.info(finalPrompt);
            log.info(`=== END FULL PROMPT ===`);
            const apiKeys = await getDecryptedApiKeys();
            const apiKey = apiKeys.aimlApiKey;
            if (!apiKey) throw new Error("AI/ML API Key is not configured.");
            
            const postUrl = `${API_BASE_URL}/v2/generate/video/pixverse/generation`;
            const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
            
            const requestBody = {
                model: 'pixverse/v5/text-to-video',
                prompt: finalPrompt,
                negative_prompt: character.CHARACTER_NEGATIVE_PROMPT,
                aspect_ratio: "16:9",
                resolution: "720p",
                duration: "8"
            };
            
            log.info('Submitting simple selfie T2V request...');
            const createResponse = await axios.post(postUrl, requestBody, { headers });
            
            const generationId = createResponse.data.id;
            if (!generationId) {
                throw new Error('API did not return a generation ID.');
            }
            
            log.info(`Simple selfie video task created with ID: ${generationId}`);
            event.sender.send('video-generation-progress', { status: 'submitted', message: `Task submitted. ID: ${generationId}` });
            
            return await pollForVideoResult(generationId, 'v2/generate/video/pixverse/generation', headers, event);

        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || (typeof error.message === 'string' ? error.message : JSON.stringify(error.message));
            log.error(`Simple Video Generation Failed: ${errorMessage}`);
            if (error.response) {
                log.error(`API Response:`, JSON.stringify(error.response.data, null, 2));
            }
            event.sender.send('video-generation-progress', { status: 'failed', message: `Error: ${errorMessage}` });
            return { success: false, error: errorMessage };
        }
    });

    ipcMain.handle('generate-advanced-video', async (event, payload) => {
        log.info('Received generate-advanced-video request');
        log.info('Payload modelId:', payload.modelId);
        log.info('Payload i2vImageUrl present:', !!payload.i2vImageUrl);
        try {
            return await _executeVideoGeneration(event, payload);
        } catch (error) {
            if (error.response) {
                log.error(`API Error Response Status: ${error.response.status}`);
                log.error(`API Error Response Data:`, JSON.stringify(error.response.data, null, 2));
                log.error(`API Error Response Headers:`, JSON.stringify(error.response.headers, null, 2));
            }
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
            log.error(`Advanced Video Generation Failed: ${errorMessage}`);
            event.sender.send('video-generation-progress', { status: 'failed', message: `Error: ${errorMessage}` });
            return { success: false, error: errorMessage };
        }
    });
};

module.exports = { setupVideoHandlers };