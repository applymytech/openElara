const { ipcMain, app } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const sharp = require('sharp');
const { getDecryptedApiKeys } = require('./apiHandlers');
const FormData = require('form-data');

const DIRECTIONS = {
    's': 'facing camera directly (front view)',
    'se': 'facing bottom-right at 45 degrees',
    'e': 'facing right (side profile)',
    'ne': 'facing top-right at 45 degrees',
    'n': 'facing away from camera (back view)',
    'nw': 'facing top-left at 45 degrees',
    'w': 'facing left (side profile)',
    'sw': 'facing bottom-left at 45 degrees'
};

const ANIMATIONS = {
    idle: {
        frames: 1,
        description: 'standing still, idle pose'
    },
    walk: {
        frames: 4,
        description: 'walking animation, multiple-step cycle'
    },
    fall: {
        frames: 1,
        direction: 'down',
        description: 'falling through air, arms up'
    },
    climb: {
        frames: 3,
        direction: 'up',
        description: 'climbing upward, reaching up with multiple frames'
    }
};

const PROMPTS = {
    base: ({characterDescription, attire}) => (
        `2D game sprite character sheet, ${characterDescription}. Outfit: ${attire}. Facing the camera. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`
    ),
    directions: {
        s: () => `2D game sprite character, facing the camera directly. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        e: () => `2D game sprite character, right side profile view. Right foot forward, left foot back as if walking. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        w: () => `2D game sprite character, left side profile view. Left foot forward, right foot back as if walking. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        n: () => `2D game sprite character, back view. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        ne: () => `2D game sprite character, three-quarter view from top-right. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        nw: () => `2D game sprite character, three-quarter view from top-left. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        se: () => `2D game sprite character, three-quarter view from bottom-right. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        sw: () => `2D game sprite character, three-quarter view from bottom-left. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`
    },
    animations: {
        idle: (frameNumber) => `2D game sprite character, idle pose with subtle breathing. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        walk: (frameNumber, dir) => {
            if (dir === 'e') {
                const poses = [
                    '2D game sprite character, right side profile. Right foot forward, left foot back as if walking.',
                    '2D game sprite character, right side profile. Mid-step, left foot forward.',
                    '2D game sprite character, right side profile. Right foot back, left foot forward.',
                    '2D game sprite character, right side profile. Mid-step, left foot back.'
                ];
                return poses[frameNumber % poses.length];
            } else if (dir === 'w') {
                const poses = [
                    '2D game sprite character, left side profile. Left foot forward, right foot back as if walking.',
                    '2D game sprite character, left side profile. Mid-step, right foot forward.',
                    '2D game sprite character, left side profile. Left foot back, right foot forward.',
                    '2D game sprite character, left side profile. Mid-step, right foot back.'
                ];
                return poses[frameNumber % poses.length];
            } else {
                const poses = [
                    '2D game sprite character, front/three-quarter step. Right foot forward.',
                    '2D game sprite character, front/three-quarter step. Left foot forward.',
                    '2D game sprite character, front/three-quarter step. Right foot back.',
                    '2D game sprite character, front/three-quarter step. Left foot back.'
                ];
                return poses[frameNumber % poses.length];
            }
        },
        fall: (frameNumber) => `2D game sprite character, falling through air with arms raised. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`,
        climb: (frameNumber) => {
            const poses = [
                '2D game sprite character, climbing upward: hands reach up, knees lift.',
                '2D game sprite character, climbing upward: hands pull up, body rises.',
                '2D game sprite character, climbing upward: knees push up, feet reposition.'
            ];
            return poses[frameNumber % poses.length];
        },
        generic: (name, desc) => `2D game sprite character, ${name} frame: ${desc}. Full body, head-to-toe. Clean, simple cartoon style with solid colors. White background. No shadows. No text.`
    },
    negative: () => `text, watermark, signature, logo, extra characters, photorealistic, blurry, low-detail, 3D render, complex background, shadows, gradients, realistic lighting`
};

async function sendDeepAIImageRequest(apiKey, options, retryCount) {
    if (!options) options = {};
    const promptText = options.promptText;
    const width = options.width || 512;
    const height = options.height || 512;
    const imageDataUrl = options.imageDataUrl;
    const negative = options.negative || '';
    const image_generator_version = options.image_generator_version || 'standard';
    const mode = options.mode;
    
    if (retryCount === undefined) retryCount = 0;
    const maxRetries = 3;
    
    if (!apiKey) throw new Error('DeepAI API key missing');
    if (!mode || (mode !== 'text2img' && mode !== 'image-editor')) {
        throw new Error("sendDeepAIImageRequest: mode must be provided and either 'text2img' or 'image-editor'");
    }
    
    if (!promptText || typeof promptText !== 'string' || promptText.trim().length === 0) {
        throw new Error('Prompt text is required and must be a non-empty string');
    }
    
    if (width < 1 || width > 1024 || height < 1 || height > 1024) {
        throw new Error('Width and height must be between 1 and 1024 pixels');
    }
    
    if (mode === 'image-editor' && !imageDataUrl) {
        throw new Error('image-editor mode requires imageDataUrl (reference image)');
    }
    
    if (imageDataUrl && typeof imageDataUrl === 'string') {
        const matches = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/);
        if (!matches) {
            throw new Error('Reference image must be a valid data URL with base64 encoded image data');
        }
    }

    log.info('[Shimeji Gen] DeepAI request - mode:', mode, 'prompt length:', (promptText || '').length, 'width:', width, 'height:', height, 'retry:', retryCount);

    try {
        let resp;
        if (mode === 'image-editor') {
            const matches = imageDataUrl.match(/^data:(.+);base64,(.*)$/);
            if (!matches) throw new Error('Reference image provided is not a valid data URL');
            const buffer = Buffer.from(matches[2], 'base64');
            const form = new FormData();
            form.append('image', buffer, { filename: 'reference.png' });
            form.append('text', promptText);
            form.append('width', String(width));
            form.append('height', String(height));
            form.append('image_generator_version', image_generator_version);
            if (negative) form.append('negative_prompt', negative);

            const headers = Object.assign({ 'api-key': apiKey }, form.getHeaders());
            resp = await axios.post('https://api.deepai.org/api/image-editor', form, { headers, timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity });
            log.info('[Shimeji Gen] DeepAI image-editor response status:', resp && resp.status);
        } else {
            const jsonPayload = {
                text: promptText,
                width: String(width),
                height: String(height),
                image_generator_version: image_generator_version
            };
            if (negative) jsonPayload.negative_prompt = negative;

            resp = await axios.post('https://api.deepai.org/api/text2img', jsonPayload, { headers: { 'Content-Type': 'application/json', 'api-key': apiKey }, timeout: 120000 });
            log.info('[Shimeji Gen] DeepAI text2img response status:', resp && resp.status);
        }
        return resp;
    } catch (err) {
        log.error('[Shimeji Gen] DeepAI request failed:', err.message || String(err));
        if (err.response) log.error('[Shimeji Gen] DeepAI response data:', err.response.data);

        if (retryCount < maxRetries && 
            ((err.response && (err.response.status === 429 || err.response.status >= 500 || (err.response.status === 400 && (!err.response.data || !err.response.data.err || !err.response.data.err.includes('Please check your inputs'))))) || 
             (!err.response && (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.message.includes('socket hang up') || err.message.includes('timeout') || err.message.includes('network'))))) {
            const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
            log.info(`[Shimeji Gen] Retrying DeepAI request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendDeepAIImageRequest(apiKey, { promptText, width, height, imageDataUrl, negative, image_generator_version, mode }, retryCount + 1);
        }
        throw err;
    }
}

class ShimejiSpriteGenerator {
    constructor() {
        this.activeGenerations = new Map();
        this.rateLimitDelay = 2000; 
        this.maxRetries = 3; 
        this.minDelay = 1000; 
        this.maxDelay = 5000; 
        this.lastRequestTime = 0; 
        this.imageCache = new Map(); 
        this.maxCacheSize = 100; 
    }
    
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const delay = this.rateLimitDelay - timeSinceLastRequest;
            log.info(`[Shimeji Gen] Rate limiting - waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }
    
    adjustRateLimit(success) {
        if (success) {
            this.rateLimitDelay = Math.max(this.minDelay, this.rateLimitDelay * 0.95);
            log.info(`[Shimeji Gen] Rate limit adjusted to ${this.rateLimitDelay}ms (success)`);
        } else {
            this.rateLimitDelay = Math.min(this.maxDelay, this.rateLimitDelay * 1.1);
            log.info(`[Shimeji Gen] Rate limit adjusted to ${this.rateLimitDelay}ms (failure)`);
        }
    }
    
    async getCachedImage(key) {
        if (this.imageCache.has(key)) {
            const cached = this.imageCache.get(key);
            cached.lastAccessed = Date.now();
            log.info(`[Shimeji Gen] Image cache hit for key: ${key}`);
            return cached.data;
        }
        return null;
    }
    
    async setCachedImage(key, data) {
        if (this.imageCache.size >= this.maxCacheSize) {
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [k, v] of this.imageCache) {
                if (v.lastAccessed < oldestTime) {
                    oldestTime = v.lastAccessed;
                    oldestKey = k;
                }
            }
            if (oldestKey) {
                this.imageCache.delete(oldestKey);
                log.info(`[Shimeji Gen] Removed oldest cached image: ${oldestKey}`);
            }
        }
        
        this.imageCache.set(key, {
            data: data,
            lastAccessed: Date.now()
        });
        log.info(`[Shimeji Gen] Image cached with key: ${key}`);
    }
    
    clearImageCache() {
        this.imageCache.clear();
        log.info(`[Shimeji Gen] Image cache cleared`);
    }
    
    async optimizeSpriteImage(buffer, width = 128, height = 128) {
        try {
            const cacheKey = `optimized_${width}x${height}_${buffer.length}`;
            const cached = await this.getCachedImage(cacheKey);
            if (cached) {
                return cached;
            }

            const optimized = await sharp(buffer)
                .resize(width, height, { 
                    fit: 'contain', 
                    background: { r: 255, g: 255, b: 255, alpha: 0 } 
                })
                .png({ 
                    quality: 90, 
                    compressionLevel: 9, 
                    adaptiveFiltering: true 
                })
                .toBuffer();
            
            await this.setCachedImage(cacheKey, optimized);
            
            return optimized;
        } catch (error) {
            log.error(`[Shimeji Gen] Failed to optimize image: ${error.message}`);
            throw error;
        }
    }
    
    async generateFallbackFrame(characterName, animType, direction, frameNumber, originalPrompt) {
        try {
            log.info(`[Shimeji Gen] Attempting fallback generation for ${animType}/${direction}/frame_${frameNumber}`);
            
            const charactersModule = require('../characters');
            const resolvedKey = (() => {
                if (!characterName || typeof characterName !== 'string') return 'elara';
                const normalized = characterName.toLowerCase();
                if (charactersModule.CHARACTERS[normalized]) return normalized;
                for (const k of Object.keys(charactersModule.CHARACTERS)) {
                    const ch = charactersModule.CHARACTERS[k];
                    if (ch && ch.CHARACTER_NAME && ch.CHARACTER_NAME.toLowerCase() === characterName.toLowerCase()) return k;
                }
                return normalized;
            })();
            
            const resolvedChar = charactersModule.getCharacter(resolvedKey);
            if (!resolvedChar || !resolvedChar.CHARACTER_DESCRIPTION_SAFE) {
                throw new Error('Could not load character constants for fallback generation');
            }
            
            const apiKeys = await getDecryptedApiKeys();
            if (!apiKeys.deepaiApiKey) {
                throw new Error('DeepAI API key not configured');
            }
            
            const simplifiedPrompt = `2D game sprite character, ${animType} animation, ${direction} view, frame ${frameNumber}. Simple cartoon style.`;
            
            log.info(`[Shimeji Gen] Fallback prompt: ${simplifiedPrompt}`);
            
            let response;
            try {
                response = await sendDeepAIImageRequest(apiKeys.deepaiApiKey, {
                    promptText: simplifiedPrompt,
                    width: 512,
                    height: 512,
                    image_generator_version: 'standard',
                    negative: PROMPTS.negative(),
                    mode: 'text2img'
                }, 0);
            } catch (fallbackError) {
                    if (!fallbackError.response && (fallbackError.code === 'ECONNABORTED' || fallbackError.code === 'ECONNRESET' || fallbackError.message.includes('socket hang up'))) {
                    log.warn(`[Shimeji Gen] Fallback also failed with network error, trying once more with longer delay`);
                    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * 3));
                    response = await sendDeepAIImageRequest(apiKeys.deepaiApiKey, {
                        promptText: simplifiedPrompt,
                        width: 512,
                        height: 512,
                        image_generator_version: 'standard',
                        negative: PROMPTS.negative(),
                        mode: 'text2img'
                    }, 0);
                } else {
                    throw fallbackError;
                }
            }
            
            return response;
        } catch (error) {
            log.error(`[Shimeji Gen] Fallback generation failed: ${error.message}`);
            throw error;
        }
    }
    
    async processSpritesForTransparency(characterName) {
        const characterKey = characterName.toLowerCase();
        log.info(`[Shimeji Gen] Processing sprites for transparency: ${characterName}`);
        
        try {
            const characterPath = path.join(app.getPath('userData'), 'pet-assets', 'characters', characterKey);
            const results = [];
            
            const basePath = path.join(characterPath, 'base.png');
            if (await this.fileExists(basePath)) {
                log.info(`[Shimeji Gen] Processing base sprite: ${basePath}`);
                const result = await this.removeBackgroundUsingStoredKey(basePath);
                results.push({ file: 'base.png', ...result });
            }
            
            const directionsPath = path.join(characterPath, 'directions');
            if (await this.fileExists(directionsPath)) {
                for (const [dir] of Object.entries(DIRECTIONS)) {
                    const dirPath = path.join(directionsPath, `${dir}.png`);
                    if (await this.fileExists(dirPath)) {
                        log.info(`[Shimeji Gen] Processing direction sprite: ${dirPath}`);
                        const result = await this.removeBackgroundUsingStoredKey(dirPath);
                        results.push({ file: `directions/${dir}.png`, ...result });
                    }
                }
            }
            
            const spritesPath = path.join(characterPath, 'sprites');
            if (await this.fileExists(spritesPath)) {
                for (const [animType, animConfig] of Object.entries(ANIMATIONS)) {
                    const animPath = path.join(spritesPath, animType);
                    if (await this.fileExists(animPath)) {
                        if (animConfig.direction) {
                            const framePath = path.join(animPath, animConfig.direction, 'frame_0.png');
                            if (await this.fileExists(framePath)) {
                                log.info(`[Shimeji Gen] Processing animation frame: ${framePath}`);
                                const result = await this.removeBackgroundUsingStoredKey(framePath);
                                results.push({ file: `sprites/${animType}/${animConfig.direction}/frame_0.png`, ...result });
                            }
                        } else {
                            const walkDirections = ['s', 'e', 'w'];
                            for (const dir of walkDirections) {
                                const dirPath = path.join(animPath, dir);
                                if (await this.fileExists(dirPath)) {
                                    for (let frame = 0; frame < animConfig.frames; frame++) {
                                        const framePath = path.join(dirPath, `frame_${frame}.png`);
                                        if (await this.fileExists(framePath)) {
                                            log.info(`[Shimeji Gen] Processing animation frame: ${framePath}`);
                                            const result = await this.removeBackgroundUsingStoredKey(framePath);
                                            results.push({ file: `sprites/${animType}/${dir}/frame_${frame}.png`, ...result });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            const successCount = results.filter(r => r.success).length;
            const warningCount = results.filter(r => r.warning).length;
            log.info(`[Shimeji Gen] Transparency processing completed: ${successCount}/${results.length} files processed (${warningCount} warnings)`);
            
            const overallSuccess = results.every(r => r.success || r.warning);
            return {
                success: overallSuccess,
                results: results,
                totalProcessed: successCount,
                warnings: warningCount
            };
            
        } catch (error) {
            log.error(`[Shimeji Gen] Transparency processing failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async generateBaseSprite(characterName) {
        const characterKey = characterName.toLowerCase();
        log.info(`[Shimeji Gen] Starting base sprite generation for: ${characterName}`);
        
        this.clearImageCache();
        
        try {
            const charactersModule = require('../characters');

            const resolvedKey = (() => {
                if (!characterName || typeof characterName !== 'string') return 'elara';
                const normalized = characterName.toLowerCase();
                if (charactersModule.CHARACTERS[normalized]) return normalized;
                for (const k of Object.keys(charactersModule.CHARACTERS)) {
                    const ch = charactersModule.CHARACTERS[k];
                    if (ch && ch.CHARACTER_NAME && ch.CHARACTER_NAME.toLowerCase() === characterName.toLowerCase()) return k;
                }
                return normalized;
            })();

            try {
                charactersModule.loadCharacter(resolvedKey);
            } catch (e) {
                log.warn('[Shimeji Gen] loadCharacter warning: ' + (e.message || String(e)));
            }

            const resolvedChar = charactersModule.getCharacter(resolvedKey);
            if (!resolvedChar || !resolvedChar.CHARACTER_DESCRIPTION_SAFE || !resolvedChar.CHARACTER_ATTIRE) {
                log.error('[Shimeji Gen] Resolved character missing required constants: ' + resolvedKey);
                throw new Error('Could not load canonical character constants for sprite generation');
            }
            const characterDescription = resolvedChar.CHARACTER_DESCRIPTION_SAFE;
            const attire = resolvedChar.CHARACTER_ATTIRE;
            const apiKeys = await getDecryptedApiKeys();
            if (!apiKeys.deepaiApiKey) {
                throw new Error('DeepAI API key not configured');
            }
            
            const userDataPath = app.getPath('userData');
            const characterPath = path.join(userDataPath, 'pet-assets', 'characters', characterKey);
            await fs.mkdir(characterPath, { recursive: true });
            const basePrompt = PROMPTS.base({ characterDescription, attire });
            log.info(`[Shimeji Gen] Base prompt (512): ${basePrompt}`);
            
            let response;
            try {
                await this.waitForRateLimit();
                response = await sendDeepAIImageRequest(apiKeys.deepaiApiKey, { promptText: basePrompt, width: 512, height: 512, image_generator_version: 'standard', negative: PROMPTS.negative(), mode: 'text2img' }, 0);

                this.adjustRateLimit(true);
            } catch (err) {
                log.error(`[Shimeji Gen] Base generation failed (DeepAI): ${err.message}`);
                log.error(`[Shimeji Gen] Error stack: ${err.stack}`);
                
                let errorType = 'unknown';
                let userMessage = err.message;
                
                if (err.response) {
                    if (err.response.status === 429) {
                        errorType = 'rate_limit';
                        userMessage = 'API rate limit exceeded. Please try again later.';
                    } else if (err.response.status >= 500) {
                        errorType = 'server_error';
                        userMessage = 'Server error. Please try again later.';
                    } else if (err.response.status >= 400) {
                        errorType = 'client_error';
                        userMessage = 'Client error. Please check your request.';
                    }
                } else if (err.code === 'ECONNABORTED') {
                    errorType = 'timeout';
                    userMessage = 'Request timeout. Please try again.';
                } else if (err.code === 'ENOTFOUND') {
                    errorType = 'network';
                    userMessage = 'Network error. Please check your connection.';
                }
                
                log.error(`[Shimeji Gen] Error type: ${errorType}`);
                
                this.adjustRateLimit(false);
                
                const enhancedError = new Error(userMessage);
                enhancedError.originalError = err.message;
                enhancedError.errorType = errorType;
                throw enhancedError;
            }

            let b64Data = null;
            if (response.data && response.data.output_url) {
                const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
                b64Data = Buffer.from(imageResponse.data).toString('base64');
            } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
                const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
                b64Data = Buffer.from(imageResponse.data).toString('base64');
            } else if (response.data && response.data.id && response.data.status === 'success' && response.data.output && response.data.output[0]) {

                const imageResponse = await axios.get(response.data.output[0], { responseType: 'arraybuffer' });
                b64Data = Buffer.from(imageResponse.data).toString('base64');
            } else {
                throw new Error('No image data in DeepAI response');
            }
            
            if (!b64Data) {
                throw new Error('Failed to retrieve image data');
            }
            const masterBasePath = path.join(characterPath, 'base_512.png');
            const spriteBasePath = path.join(characterPath, 'base.png');

            const masterBuffer = Buffer.from(b64Data, 'base64');
            await fs.writeFile(masterBasePath, masterBuffer);

                try {
                    const small = await this.optimizeSpriteImage(masterBuffer, 128, 128);
                    await fs.writeFile(spriteBasePath, small);
                    log.info(`[Shimeji Gen] Sprite resized and optimized: ${spriteBasePath}`);
                                   } catch (err) {
                    log.error(`[Shimeji Gen] Failed to resize sprite, using original: ${err.message}`);
                    await fs.writeFile(spriteBasePath, masterBuffer);
                }

            log.info(`[Shimeji Gen] Base master saved to: ${masterBasePath} and sprite saved to: ${spriteBasePath}`);

            return {
                success: true,
                filePath: spriteBasePath,
                masterFilePath: masterBasePath,
                prompt: basePrompt
            };
            
        } catch (error) {
            log.error(`[Shimeji Gen] Base sprite generation failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async generateDirectionalSprites(characterName, baseImagePath) {
        const characterKey = characterName.toLowerCase();
        log.info(`[Shimeji Gen] Starting directional sprites using I2I for: ${characterName}`);
        
        try {
            const charactersModule = require('../characters');
            const resolvedKey = (() => {
                if (!characterName || typeof characterName !== 'string') return 'elara';
                const normalized = characterName.toLowerCase();
                if (charactersModule.CHARACTERS[normalized]) return normalized;
                for (const k of Object.keys(charactersModule.CHARACTERS)) {
                    const ch = charactersModule.CHARACTERS[k];
                    if (ch && ch.CHARACTER_NAME && ch.CHARACTER_NAME.toLowerCase() === characterName.toLowerCase()) return k;
                }
                return normalized;
            })();

            try {
                charactersModule.loadCharacter(resolvedKey);
            } catch (e) {
                log.warn('[Shimeji Gen] loadCharacter warning: ' + (e.message || String(e)));
            }

            const resolvedChar = charactersModule.getCharacter(resolvedKey);
            if (!resolvedChar || !resolvedChar.CHARACTER_DESCRIPTION_SAFE || !resolvedChar.CHARACTER_ATTIRE) {
                log.error('[Shimeji Gen] Resolved character missing required constants for directions: ' + resolvedKey);
                throw new Error('Could not load canonical character constants for directional sprites');
            }
            const characterDescription = resolvedChar.CHARACTER_DESCRIPTION_SAFE;
            const attire = resolvedChar.CHARACTER_ATTIRE;
            const apiKeys = await getDecryptedApiKeys();
            const results = [];
            
            let masterPath = null;
            const characterPath = path.join(app.getPath('userData'), 'pet-assets', 'characters', characterKey);

            if (baseImagePath && typeof baseImagePath === 'string') {
                try {
                    await fs.access(baseImagePath);
                    masterPath = baseImagePath;
                } catch (e) {
                    try {
                        const candidate = baseImagePath.replace(/base\.png$/i, 'base_512.png');
                        await fs.access(candidate);
                        masterPath = candidate;
                    } catch (_) {
                        masterPath = null;
                    }
                }
            }
            if (!masterPath) {
                const candidateMaster = path.join(characterPath, 'base_512.png');
                try {
                    await fs.access(candidateMaster);
                    masterPath = candidateMaster;
                } catch (_) {
                    const candidateSprite = path.join(characterPath, 'base.png');
                    try {
                        await fs.access(candidateSprite);
                        masterPath = candidateSprite;
                    } catch (err) {
                        throw new Error('Reference image not found. Generate a base sprite first or pass a valid baseImagePath');
                    }
                }
            }

            const baseImageBuffer = await fs.readFile(masterPath);
            const baseImageB64 = baseImageBuffer.toString('base64');
            
            const directionsPath = path.join(characterPath, 'directions');
            await fs.mkdir(directionsPath, { recursive: true });
            
            for (const [dir, dirDescription] of Object.entries(DIRECTIONS)) {
                log.info(`[Shimeji Gen] Generating direction: ${dir} (${dirDescription})`);
                
                    const prompt = PROMPTS.directions[dir]();
                
                try {
                    await this.waitForRateLimit();
                    let response;
                    try {
                        response = await sendDeepAIImageRequest(apiKeys.deepaiApiKey, {
                            promptText: prompt,
                            width: 128,
                            height: 128,
                            imageDataUrl: `data:image/png;base64,${baseImageB64}`,
                            image_generator_version: 'standard',
                            negative: PROMPTS.negative(),
                            mode: 'image-editor'
                        }, 0);
                    } catch (error) {
                        log.warn(`[Shimeji Gen] Directional generation failed, attempting fallback for direction: ${dir}`);
                        response = await sendDeepAIImageRequest(apiKeys.deepaiApiKey, {
                            promptText: prompt,
                            width: 128,
                            height: 128,
                            image_generator_version: 'standard',
                            negative: PROMPTS.negative(),
                            mode: 'text2img'
                        }, 0);
                    }
                    
                    this.adjustRateLimit(true);
                    if (!response || !response.data) {
                        throw new Error('No response data from DeepAI');
                    }
                    
                    let b64Data = null;
                    if (response.data && response.data.output_url) {
                        const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
                        b64Data = Buffer.from(imageResponse.data).toString('base64');
                    } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
                        const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
                        b64Data = Buffer.from(imageResponse.data).toString('base64');
                    } else {
                        throw new Error('No image data in DeepAI response for direction ' + dir);
                    }
                    
                    if (!b64Data) {
                        throw new Error('Failed to retrieve image data');
                    }
                    
                    const masterDirPath = path.join(directionsPath, `${dir}_512.png`);
                    const spriteDirPath = path.join(directionsPath, `${dir}.png`);
                    const masterBuffer = Buffer.from(b64Data, 'base64');
                    await fs.writeFile(masterDirPath, masterBuffer);
                    try {
                        const small = await this.optimizeSpriteImage(masterBuffer, 128, 128);
                        await fs.writeFile(spriteDirPath, small);
                        log.info(`[Shimeji Gen] Direction sprite resized and optimized: ${spriteDirPath}`);

                    } catch (err) {
                        log.error(`[Shimeji Gen] Failed to resize direction sprite, using original: ${err.message}`);
                        await fs.writeFile(spriteDirPath, masterBuffer);

                    }
                    
                    results.push({
                        direction: dir,
                        filePath: spriteDirPath,
                        masterFilePath: masterDirPath,
                        success: true
                    });

                    log.info(`[Shimeji Gen] Direction ${dir} saved to: ${spriteDirPath} (master: ${masterDirPath})`);
                    
                } catch (error) {
                    log.error(`[Shimeji Gen] Failed to generate direction ${dir}: ${error.message}`);
                    log.error(`[Shimeji Gen] Error stack: ${error.stack}`);
                    
                    let errorType = 'unknown';
                    let userMessage = error.message;
                    
                    if (error.response) {
                        if (error.response.status === 429) {
                            errorType = 'rate_limit';
                            userMessage = 'API rate limit exceeded. Please try again later.';
                        } else if (error.response.status >= 500) {
                            errorType = 'server_error';
                            userMessage = 'Server error. Please try again later.';
                        } else if (error.response.status >= 400) {
                            errorType = 'client_error';
                            userMessage = 'Client error. Please check your request.';
                        }
                    } else if (error.code === 'ECONNABORTED') {
                        errorType = 'timeout';
                        userMessage = 'Request timeout. Please try again.';
                    } else if (error.code === 'ENOTFOUND') {
                        errorType = 'network';
                        userMessage = 'Network error. Please check your connection.';
                    }
                    
                    log.error(`[Shimeji Gen] Error type: ${errorType}`);
                    
                    this.adjustRateLimit(false);
                    results.push({
                        direction: dir,
                        success: false,
                        error: userMessage,
                        errorType: errorType,
                        originalError: error.message
                    });
                }
            }
            
            return {
                success: results.every(r => r.success),
                results: results,
                totalGenerated: results.filter(r => r.success).length
            };
            
        } catch (error) {
            log.error(`[Shimeji Gen] Directional sprites failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async generateAnimationFrames(characterName, directionalSprites) {
        const characterKey = characterName.toLowerCase();
        log.info(`[Shimeji Gen] Starting animation frame generation using I2I for: ${characterName}`);
        
        try {
            const charactersModule = require('../characters');
            const resolvedKey = (() => {
                if (!characterName || typeof characterName !== 'string') return 'elara';
                const normalized = characterName.toLowerCase();
                if (charactersModule.CHARACTERS[normalized]) return normalized;
                for (const k of Object.keys(charactersModule.CHARACTERS)) {
                    const ch = charactersModule.CHARACTERS[k];
                    if (ch && ch.CHARACTER_NAME && ch.CHARACTER_NAME.toLowerCase() === characterName.toLowerCase()) return k;
                }
                return normalized;
            })();

            try {
                charactersModule.loadCharacter(resolvedKey);
            } catch (e) {
                log.warn('[Shimeji Gen] loadCharacter warning: ' + (e.message || String(e)));
            }

            const resolvedChar = charactersModule.getCharacter(resolvedKey);
            if (!resolvedChar || !resolvedChar.CHARACTER_DESCRIPTION_SAFE) {
                log.error('[Shimeji Gen] Resolved character missing required constants for animations: ' + resolvedKey);
                throw new Error('Could not load canonical character constants for animations');
            }
            const characterDescription = resolvedChar.CHARACTER_DESCRIPTION_SAFE;
            const apiKeys = await getDecryptedApiKeys();
            const results = [];
            
            const characterPath = path.join(app.getPath('userData'), 'pet-assets', 'characters', characterKey);
            const spritesPath = path.join(characterPath, 'sprites');
            
            const baseReferenceImage = path.join(characterPath, 'base_512.png');
            let baseImageExists = false;
            try {
                await fs.access(baseReferenceImage);
                baseImageExists = true;
                log.info(`[Shimeji Gen] Using base image as primary reference: ${baseReferenceImage}`);
            } catch (_) {
                log.warn(`[Shimeji Gen] Base image not found, will try base.png: ${baseReferenceImage}`);
                try {
                    await fs.access(path.join(characterPath, 'base.png'));
                    baseImageExists = true;
                } catch (err) {
                    log.error(`[Shimeji Gen] No base image found for animations`);
                }
            }
            
            const directionMap = {};
            if (directionalSprites && directionalSprites.results) {
                directionalSprites.results.forEach(result => {
                    if (result.success) {
                        directionMap[result.direction] = result.filePath;
                    }
                });
            }
            
            for (const [animType, animConfig] of Object.entries(ANIMATIONS)) {
                const animPath = path.join(spritesPath, animType);
                await fs.mkdir(animPath, { recursive: true });
                
                if (animConfig.direction) {
                    const dirPath = path.join(animPath, animConfig.direction);
                    await fs.mkdir(dirPath, { recursive: true });
                    let referenceImage = baseImageExists ? baseReferenceImage : null;
                    if (!referenceImage && directionMap['s']) {
                        referenceImage = directionMap['s'];
                    } else if (!referenceImage) {
                        const candidateMaster = path.join(characterPath, 'base_512.png');
                        try {
                            await fs.access(candidateMaster);
                            referenceImage = candidateMaster;
                        } catch (_) {
                            const candidateSprite = path.join(characterPath, 'base.png');
                            try {
                                await fs.access(candidateSprite);
                                referenceImage = candidateSprite;
                            } catch (err) {
                                referenceImage = null;
                            }
                        }
                    }
                    
                    await this.generateSingleAnimationFrame(
                        characterName,
                        characterDescription,
                        animType,
                        animConfig.description,
                        animConfig.direction,
                        0,
                        dirPath,
                        results,
                        apiKeys,
                        referenceImage
                    );
                } else {
                    const walkDirections = ['s', 'e', 'w'];
                    
                    for (const dir of walkDirections) {
                        const dirPath = path.join(animPath, dir);
                        await fs.mkdir(dirPath, { recursive: true });
                        let referenceImage = baseImageExists ? baseReferenceImage : null;
                        if (!referenceImage && directionMap[dir]) {
                            referenceImage = directionMap[dir];
                        } else if (!referenceImage) {
                            const candidateMaster = path.join(characterPath, 'base_512.png');
                            try {
                                await fs.access(candidateMaster);
                                referenceImage = candidateMaster;
                            } catch (_) {
                                const candidateSprite = path.join(characterPath, 'base.png');
                                try {
                                    await fs.access(candidateSprite);
                                    referenceImage = candidateSprite;
                                } catch (err) {
                                    referenceImage = null;
                                }
                            }
                        }
                        
                        for (let frame = 0; frame < animConfig.frames; frame++) {
                            await this.generateSingleAnimationFrame(
                                characterName,
                                characterDescription,
                                animType,
                                animConfig.description,
                                dir,
                                frame,
                                dirPath,
                                results,
                                apiKeys,
                                referenceImage
                            );
                        }
                    }
                }
            }
            
            return {
                success: results.every(r => r.success),
                results: results,
                totalGenerated: results.filter(r => r.success).length
            };
            
        } catch (error) {
            log.error(`[Shimeji Gen] Animation frame generation failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async generateSingleAnimationFrame(characterName, characterDescription, animType, animDescription, direction, frameNumber, dirPath, results, apiKeys, referenceImagePath = null) {
        let prompt;
        if (animType === 'idle') {
            prompt = PROMPTS.animations.idle(frameNumber);
        } else if (animType === 'walk') {
            prompt = PROMPTS.animations.walk(frameNumber, direction);
        } else if (animType === 'fall') {
            prompt = PROMPTS.animations.fall(frameNumber);
        } else if (animType === 'climb') {
            prompt = PROMPTS.animations.climb(frameNumber);
        } else {
            prompt = PROMPTS.animations.generic(animType, animDescription);
        }
        let finalPrompt = prompt;
        try {
            const pTrim = (prompt || '').trim();
            if (!pTrim.toLowerCase().startsWith('show the avatar')) {
                finalPrompt = `Show the avatar ${pTrim}`;
            }
        } catch (e) {
            finalPrompt = prompt;
        }

        log.info(`[Shimeji Gen] Generating ${animType}/${direction}/frame_${frameNumber} using I2I with prompt: ${finalPrompt}`);
        
        try {
            await this.waitForRateLimit();
            
            const requestData = {
                promptText: finalPrompt,
                width: 512,
                height: 512,
                image_generator_version: 'standard'
            };
            
            let imageDataUrl = null;
            if (referenceImagePath) {
                try {
                    await fs.access(referenceImagePath);
                    const referenceBuffer = await fs.readFile(referenceImagePath);
                    const referenceB64 = referenceBuffer.toString('base64');
                    imageDataUrl = `data:image/png;base64,${referenceB64}`;
                } catch (err) {
                    log.warn(`[Shimeji Gen] Reference image not available for animation frame: ${referenceImagePath} - proceeding without image`);
                }
            }
            
            let response;
            try {
                response = await sendDeepAIImageRequest(apiKeys.deepaiApiKey, {
                    promptText: requestData.promptText,
                    width: requestData.width,
                    height: requestData.height,
                    imageDataUrl: imageDataUrl,
                    image_generator_version: requestData.image_generator_version,
                    negative: PROMPTS.negative(),
                    mode: imageDataUrl ? 'image-editor' : 'text2img'
                }, 0);
            } catch (error) {
                if (!error.response && (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET' || error.message.includes('socket hang up'))) {
                    log.warn(`[Shimeji Gen] Network error detected, waiting before fallback for ${animType}/${direction}/frame_${frameNumber}`);

                    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * 2));
                    
                    try {
                        response = await sendDeepAIImageRequest(apiKeys.deepaiApiKey, {
                            promptText: requestData.promptText,
                            width: requestData.width,
                            height: requestData.height,
                            imageDataUrl: imageDataUrl,
                            image_generator_version: requestData.image_generator_version,
                            negative: PROMPTS.negative(),
                            mode: imageDataUrl ? 'image-editor' : 'text2img'
                        }, 0);
                    } catch (retryError) {
                        log.warn(`[Shimeji Gen] Retry failed, attempting fallback for ${animType}/${direction}/frame_${frameNumber}`);
                        response = await this.generateFallbackFrame(characterName, animType, direction, frameNumber, finalPrompt);
                    }
                } else {
                    log.warn(`[Shimeji Gen] Primary generation failed, attempting fallback for ${animType}/${direction}/frame_${frameNumber}`);
                    response = await this.generateFallbackFrame(characterName, animType, direction, frameNumber, finalPrompt);
                }
            }
            
            this.adjustRateLimit(true);
            
            let b64Data = null;
            if (response.data && response.data.output_url) {
                const imageResponse = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
                b64Data = Buffer.from(imageResponse.data).toString('base64');
            } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output[0] && response.data.output[0].url) {
                const imageResponse = await axios.get(response.data.output[0].url, { responseType: 'arraybuffer' });
                b64Data = Buffer.from(imageResponse.data).toString('base64');
            } else {
                throw new Error('No image data in DeepAI response for animation frame');
            }
            
            if (!b64Data) {
                throw new Error('Failed to retrieve image data');
            }
            
                const masterFramePath = path.join(dirPath, `frame_${frameNumber}_512.png`);
                const spriteFramePath = path.join(dirPath, `frame_${frameNumber}.png`);
                const masterBuffer = Buffer.from(b64Data, 'base64');
                await fs.writeFile(masterFramePath, masterBuffer);
                try {
                    const small = await this.optimizeSpriteImage(masterBuffer, 128, 128);
                    await fs.writeFile(spriteFramePath, small);
                    log.info(`[Shimeji Gen] Animation frame resized and optimized: ${spriteFramePath}`);

                } catch (err) {
                    log.error(`[Shimeji Gen] Failed to resize animation frame, using original: ${err.message}`);
                    await fs.writeFile(spriteFramePath, masterBuffer);

                }

                results.push({
                    animation: animType,
                    direction: direction,
                    frame: frameNumber,
                    filePath: spriteFramePath,
                    masterFilePath: masterFramePath,
                    success: true
                });

                log.info(`[Shimeji Gen] Frame saved to: ${spriteFramePath} (master: ${masterFramePath})`);
            
        } catch (error) {
            log.error(`[Shimeji Gen] Failed to generate ${animType}/${direction}/frame_${frameNumber}: ${error.message}`);
            log.error(`[Shimeji Gen] Error stack: ${error.stack}`);

            let errorType = 'unknown';
            let userMessage = error.message;
            
            if (error.response) {
                if (error.response.status === 429) {
                    errorType = 'rate_limit';
                    userMessage = 'API rate limit exceeded. Please try again later.';
                } else if (error.response.status >= 500) {
                    errorType = 'server_error';
                    userMessage = 'Server error. Please try again later.';
                } else if (error.response.status === 400) {
                    errorType = 'client_error';
                    userMessage = 'Client error. The request may be invalid. Trying fallback method.';

                    log.info(`[Shimeji Gen] Attempting fallback with simplified prompt for ${animType}/${direction}/frame_${frameNumber}`);
                }
            } else if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                errorType = 'network';
                userMessage = 'Network error. Please check your connection. Retrying...';
            } else if (error.code === 'ENOTFOUND') {
                errorType = 'network';
                userMessage = 'Network error. Please check your connection.';
            }
            
            log.error(`[Shimeji Gen] Error type: ${errorType}`);
            
            this.adjustRateLimit(false);
            results.push({
                animation: animType,
                direction: direction,
                frame: frameNumber,
                success: false,
                error: userMessage,
                errorType: errorType,
                originalError: error.message
            });
        }
    }
    
    async generateManifest(characterName) {
        const characterKey = characterName.toLowerCase();
        log.info(`[Shimeji Gen] Creating manifest for: ${characterName}`);
        
        try {
            const characterPath = path.join(app.getPath('userData'), 'pet-assets', 'characters', characterKey);
            
            try {
                await fs.access(characterPath);
            } catch (error) {
                throw new Error(`Character directory not found: ${characterPath}. Generate sprites first.`);
            }
            
            const manifest = {
                characterName: characterName,
                version: '1.0.0',
                spriteSize: {
                    width: 128,
                    height: 128
                },
                animations: {}
            };
            
            const idleAnim = { directions: {} };
            const idleDirections = ['s', 'e', 'w'];
            for (const dir of idleDirections) {
                const framePath = `sprites/idle/${dir}/frame_0.png`;
                const fullPath = path.join(characterPath, framePath);
                if (await this.fileExists(fullPath)) {
                    idleAnim.directions[dir] = { frames: [framePath], fps: 1 };
                }
            }
            if (Object.keys(idleAnim.directions).length > 0) {
                manifest.animations.idle = idleAnim;
            }
            
            const walkAnim = { directions: {} };
            const walkDirections = ['s', 'e', 'w'];
            for (const dir of walkDirections) {
                const frames = [];
                for (let i = 0; i < 4; i++) {
                    const framePath = `sprites/walk/${dir}/frame_${i}.png`;
                    const fullPath = path.join(characterPath, framePath);
                    if (await this.fileExists(fullPath)) {
                        frames.push(framePath);
                    }
                }
                if (frames.length > 0) {
                    walkAnim.directions[dir] = { frames: frames, fps: 4 };
                }
            }
            if (Object.keys(walkAnim.directions).length > 0) {
                manifest.animations.walk = walkAnim;
            }
            
            const fallFramePath = 'sprites/fall/down/frame_0.png';
            const fallFullPath = path.join(characterPath, fallFramePath);
            if (await this.fileExists(fallFullPath)) {
                manifest.animations.fall = {
                    directions: {
                        down: { frames: [fallFramePath], fps: 1 }
                    }
                };
            }
            
            const climbFramePath = 'sprites/climb/up/frame_0.png';
            const climbFullPath = path.join(characterPath, climbFramePath);
            if (await this.fileExists(climbFullPath)) {
                manifest.animations.climb = {
                    directions: {
                        up: { frames: [climbFramePath], fps: 1 }
                    }
                };
            }
            
            const manifestPath = path.join(characterPath, 'manifest.json');
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
            
            log.info(`[Shimeji Gen] Manifest created at: ${manifestPath}`);
            log.info(`[Shimeji Gen] Manifest contains ${Object.keys(manifest.animations).length} animations`);
            
            return { success: true, manifestPath };
            
        } catch (error) {
            log.error(`[Shimeji Gen] Manifest generation failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const spriteGenerator = new ShimejiSpriteGenerator();

ShimejiSpriteGenerator.prototype.removeBackgroundUsingStoredKey = async function(filePath, retryCount = 0, maxRetries = 5) {
    try {
        try {
            await fs.access(filePath, fs.constants.R_OK);
        } catch (fileError) {
            log.error(`[Shimeji Gen] Cannot access file for background removal: ${filePath} - ${fileError.message}`);
            return { success: false, error: `Cannot access file: ${fileError.message}` };
        }
        
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            log.error(`[Shimeji Gen] File is empty, skipping background removal: ${filePath}`);
            return { success: false, error: 'File is empty' };
        }
        
        if (stats.size > 10 * 1024 * 1024) {
            log.error(`[Shimeji Gen] File too large for background removal: ${filePath} (${stats.size} bytes)`);
            return { success: false, error: 'File too large for background removal (max 10MB)' };
        }

        const apiKeys = await getDecryptedApiKeys();
        const deepaiKey = apiKeys.deepaiApiKey;
        if (!deepaiKey) {
            log.error('[Shimeji Gen] DeepAI API key not configured; cannot remove background.');
            return { success: false, error: 'DeepAI API key not configured' };
        }

        try {
            const fileHandle = await fs.open(filePath, 'r');
            await fileHandle.close();
            log.info(`[Shimeji Gen] Confirmed file can be opened: ${filePath}`);
        } catch (fileAccessError) {
            log.error(`[Shimeji Gen] Cannot open file for reading: ${filePath} - ${fileAccessError.message}`);
            return { success: false, error: `Cannot open file: ${fileAccessError.message}` };
        }

        const imageBuffer = await fs.readFile(filePath);
        log.info(`[Shimeji Gen] File read successfully, buffer size: ${imageBuffer.length} bytes`);
        
        try {
            const imageInfo = await sharp(imageBuffer).metadata();
            log.info(`[Shimeji Gen] Image info: ${JSON.stringify(imageInfo)}`);
        } catch (sharpError) {
            log.warn(`[Shimeji Gen] Could not get image info with sharp: ${sharpError.message}`);
        }
        
        const form = new FormData();
        form.append('image', imageBuffer, { filename: path.basename(filePath) });
        
        log.info(`[Shimeji Gen] Background removal request for: ${filePath}`);
        log.info(`[Shimeji Gen] File size: ${stats.size} bytes`);
        log.info(`[Shimeji Gen] Buffer size: ${imageBuffer.length} bytes`);
        log.info(`[Shimeji Gen] Form headers: ${JSON.stringify(form.getHeaders())}`);
        
        const headers = Object.assign({ 'api-key': deepaiKey }, form.getHeaders());
        log.info(`[Shimeji Gen] Request headers: ${JSON.stringify(headers)}`);
        
        form.getLength((err, length) => {
            if (err) {
                log.warn(`[Shimeji Gen] Could not get form length: ${err.message}`);
            } else {
                log.info(`[Shimeji Gen] Form length: ${length} bytes`);
            }
        });
        
        const resp = await axios.post('https://api.deepai.org/api/background-remover', form, { 
            headers, 
            maxContentLength: Infinity, 
            maxBodyLength: Infinity, 
            timeout: 120000,
            validateStatus: function (status) {
                log.info(`[Shimeji Gen] Background removal response status: ${status}`);
                return status < 500;
            }
        });
        
        log.info(`[Shimeji Gen] Background removal response: ${JSON.stringify({
            status: resp.status,
            statusText: resp.statusText,
            headers: resp.headers,
            data: resp.data
        })}`);
        if (resp.data && resp.data.output_url) {
            log.info(`[Shimeji Gen] Downloading image from output_url: ${resp.data.output_url}`);
            try {
                const downloadResp = await axios.get(resp.data.output_url, { responseType: 'arraybuffer' });
                await fs.writeFile(filePath, Buffer.from(downloadResp.data));
                return { success: true, filePath };
            } catch (err) {
                log.warn('[Shimeji Gen] Failed to download DeepAI output_url, leaving original file. ' + err.message);

                if (resp.data && resp.data.output) {
                    try {
                        let base64Data = null;
                        if (typeof resp.data.output === 'string') {
                            base64Data = resp.data.output;
                        } else if (Array.isArray(resp.data.output) && resp.data.output[0]) {
                            if (typeof resp.data.output[0] === 'string') {
                                base64Data = resp.data.output[0];
                            } else if (resp.data.output[0].image) {
                                base64Data = resp.data.output[0].image;
                            }
                        }
                        
                        if (base64Data) {
                            const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
                            const buffer = Buffer.from(base64Clean, 'base64');
                            await fs.writeFile(filePath, buffer);
                            log.info('[Shimeji Gen] Successfully saved image from base64 data in response');
                            return { success: true, filePath };
                        }
                    } catch (base64Error) {
                        log.warn('[Shimeji Gen] Failed to process base64 data from response: ' + base64Error.message);
                    }
                }
                return { success: false, error: 'Failed to download processed image' };
            }
        }

        if (resp.data && resp.data.id && resp.data.output && Array.isArray(resp.data.output) && resp.data.output.length > 0 && resp.data.output[0].url) {
            log.info(`[Shimeji Gen] Downloading image from output[0].url: ${resp.data.output[0].url}`);
            try {
                const downloadResp = await axios.get(resp.data.output[0].url, { responseType: 'arraybuffer' });
                await fs.writeFile(filePath, Buffer.from(downloadResp.data));
                return { success: true, filePath };
            } catch (err) {
                log.warn('[Shimeji Gen] Failed to download DeepAI output entry, leaving original file. ' + err.message);
                return { success: false, error: 'Failed to download processed image' };
            }
        }

        if (resp.data && resp.data.output) {
            try {
                let base64Data = null;
                if (typeof resp.data.output === 'string') {
                    base64Data = resp.data.output;
                } else if (Array.isArray(resp.data.output) && resp.data.output[0]) {
                    if (typeof resp.data.output[0] === 'string') {
                        base64Data = resp.data.output[0];
                    } else if (resp.data.output[0].image) {
                        base64Data = resp.data.output[0].image;
                    }
                } else if (resp.data.output.image) {
                    base64Data = resp.data.output.image;
                }
                
                if (base64Data) {
                    const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
                    const buffer = Buffer.from(base64Clean, 'base64');
                    await fs.writeFile(filePath, buffer);
                    log.info('[Shimeji Gen] Successfully saved image from base64 data in response');
                    return { success: true, filePath };
                }
            } catch (base64Error) {
                log.warn('[Shimeji Gen] Failed to process base64 data from response: ' + base64Error.message);
            }
        }

        log.warn(`[Shimeji Gen] No output_url or usable data found in response for ${filePath}, continuing with original image`);
        return { success: true, warning: 'No processed image data received from DeepAI', filePath };
    } catch (err) {
        log.error('[Shimeji Gen] DeepAI background removal failed: ' + (err.message || String(err)));
        log.error(`[Shimeji Gen] Error stack: ${err.stack}`);
        
        if (err.response) {
            log.error(`[Shimeji Gen] Response status: ${err.response.status}`);
            log.error(`[Shimeji Gen] Response headers: ${JSON.stringify(err.response.headers)}`);
            log.error(`[Shimeji Gen] Response data: ${JSON.stringify(err.response.data)}`);
        }
        
        let errorType = 'unknown';
        let userMessage = err.message || String(err);
        
        if (err.response) {
            if (err.response.status === 429) {
                errorType = 'rate_limit';
                userMessage = 'API rate limit exceeded. Please try again later.';
            } else if (err.response.status >= 500) {
                errorType = 'server_error';
                userMessage = 'Server error. Please try again later.';
            } else if (err.response.status === 400) {
                errorType = 'client_error';
                userMessage = 'Client error. Please check your request.';

                if (err.response.data && err.response.data.err) {
                    userMessage += ` - ${err.response.data.err}`;
                    log.error(`[Shimeji Gen] DeepAI specific error: ${err.response.data.err}`);
                }
            }
        } else if (err.code === 'ECONNABORTED') {
            errorType = 'timeout';
            userMessage = 'Request timeout. Please try again.';
        } else if (err.code === 'ENOTFOUND') {
            errorType = 'network';
            userMessage = 'Network error. Please check your connection.';
        }
        
        log.error(`[Shimeji Gen] Error type: ${errorType}`);
        
        if (retryCount < maxRetries && 
            ((err.response && (err.response.status === 429 || err.response.status >= 500 || (err.response.status === 400 && (!err.response.data || !err.response.data.err || !err.response.data.err.includes('Please check your inputs'))))) || 
             (!err.response && (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.message.includes('socket hang up') || err.message.includes('timeout') || err.message.includes('network'))))) {
            const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; 
            log.info(`[Shimeji Gen] Retrying DeepAI background removal in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.removeBackgroundUsingStoredKey(filePath, retryCount + 1, maxRetries);
        }
        if (retryCount >= maxRetries) {
            log.warn(`[Shimeji Gen] Background removal failed after ${maxRetries} attempts, continuing without background removal: ${filePath}`);
            return { success: true, warning: `Background removal failed: ${userMessage}`, filePath };
        }
        
        log.warn(`[Shimeji Gen] Background removal failed, continuing without background removal: ${filePath}`);
        return { success: true, warning: `Background removal failed: ${userMessage}`, filePath };
    }
};

function registerShimejiGenerationHandlers() {
    log.info('Registering Shimeji sprite generation handlers...');
    
    ipcMain.handle('shimeji-generate-base', async (event, { characterName }) => {
        return await spriteGenerator.generateBaseSprite(characterName);
    });
    
    ipcMain.handle('shimeji-generate-directions', async (event, { characterName, baseImagePath }) => {
        return await spriteGenerator.generateDirectionalSprites(characterName, baseImagePath);
    });
    
    ipcMain.handle('shimeji-generate-animations', async (event, { characterName, directionalSprites }) => {
        return await spriteGenerator.generateAnimationFrames(characterName, directionalSprites);
    });
    
    ipcMain.handle('shimeji-generate-manifest', async (event, { characterName }) => {
        return await spriteGenerator.generateManifest(characterName);
    });

    ipcMain.handle('shimeji-generate-all', async (event, { characterName }) => {
        const baseResult = await spriteGenerator.generateBaseSprite(characterName);
        if (!baseResult.success) return { success: false, stage: 'base', error: baseResult.error };

        const dirResult = await spriteGenerator.generateDirectionalSprites(characterName, baseResult.filePath);
        if (!dirResult.success) return { success: false, stage: 'directions', error: dirResult.error, results: dirResult.results };

        const animResult = await spriteGenerator.generateAnimationFrames(characterName, dirResult);
        if (!animResult.success) return { success: false, stage: 'animations', error: animResult.error, results: animResult.results };
        const transparencyResult = await spriteGenerator.processSpritesForTransparency(characterName);
        const overallSuccess = baseResult.success && dirResult.success && animResult.success && (transparencyResult.success || transparencyResult.warnings >= 0);
        return {
            success: overallSuccess,
            base: baseResult,
            directions: dirResult,
            animations: animResult,
            backgroundRemoval: transparencyResult
        };
    });
    
    ipcMain.handle('shimeji-process-transparency', async (event, { characterName }) => {
        return await spriteGenerator.processSpritesForTransparency(characterName);
    });
    
    ipcMain.handle('shimeji-cost-estimate', async () => {
        return {
            baseSprite: 0.035,
            directionalSprites: 0.28,
            animationFrames: 0.49,
            backgroundRemoval: 0.15,
            total: 0.955,
            currency: 'USD'
        };
    });

    ipcMain.handle('shimeji-list-pets', async () => {
        try {
            const charactersPath = path.join(app.getPath('userData'), 'pet-assets', 'characters');
            const entries = await fs.readdir(charactersPath, { withFileTypes: true });
            const dirs = entries.filter(e => e.isDirectory()).map(d => d.name);
            return { success: true, characters: dirs };
        } catch (err) {
            log.error('[Shimeji Gen] Failed to list pets: ' + err.message);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('shimeji-delete-pet', async (event, { characterName }) => {
        try {
            const characterPath = path.join(app.getPath('userData'), 'pet-assets', 'characters', characterName.toLowerCase());
            await fs.rm(characterPath, { recursive: true, force: true });
            return { success: true };
        } catch (err) {
            log.error('[Shimeji Gen] Failed to delete pet: ' + err.message);
            return { success: false, error: err.message };
        }
    });
    
    log.info('Shimeji sprite generation handlers registered');
}

module.exports = { registerShimejiGenerationHandlers };