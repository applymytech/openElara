// src/main/handlers/imageHandlers.js
const { ipcMain, app } = require('electron');
const log = require('electron-log');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { getDecryptedApiKeys, routeApiCall } = require('./apiHandlers');
const { generateSelfieScenePrompt } = require('./taskHandlers');
const { getActiveCharacter } = require('../characters');
const { watermarkManager } = require('./watermarkHandler');

const OUTPUT_IMAGES_PATH = path.join(app.getPath('userData'), 'Output', 'images');
async function _generateOpenImage(payload) {
    const { imageGenSettings, customModel } = payload;
    const apiKeys = await getDecryptedApiKeys();
    
    let baseUrl = apiKeys.imageGenBaseUrl || 'https://api.together.xyz/v1/images/generations';
    let apiKey = apiKeys.imageGenKeyOverride || apiKeys.togetherApiKey;
    
    if (customModel) {
        if (customModel.endpoint) {
            baseUrl = customModel.endpoint;
            log.info(`Using custom endpoint for model ${customModel.id}: ${baseUrl}`);
        }
    
        if (!apiKey) {
            const errorMsg = 'Custom Image Model: API Key Override is required for custom models.';
            log.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    }
    
    if (!apiKey) {
        const errorMsg = 'Image Generation Failed: API Key (TogetherAI) is not set.';
        log.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const apiPayload = {
            prompt: imageGenSettings.prompt,
            model: imageGenSettings.modelConfig.modelId,
            steps: imageGenSettings.steps,
            width: imageGenSettings.width,
            height: imageGenSettings.height,
            guidance_scale: imageGenSettings.guidance_scale,
            n: 1,
            response_format: 'b64_json',
        };

        if (imageGenSettings.negative_prompt) {
            apiPayload.negative_prompt = imageGenSettings.negative_prompt;
        }

        if (imageGenSettings.disable_safety_checker) {
            apiPayload.disable_safety_checker = true;
        }

        if (imageGenSettings.i2iImageUrl) {
            apiPayload.image_url = imageGenSettings.i2iImageUrl;
            log.info('I2I mode: image_url included in payload');
        }

        if (customModel && customModel.customPayload) {
            log.info('Merging custom payload for model:', customModel.id);
            log.info('Custom payload:', JSON.stringify(customModel.customPayload, null, 2));
            Object.assign(apiPayload, customModel.customPayload);
        }

        log.info(`Sending image generation request to: ${baseUrl}`);
        log.info(`Model: ${apiPayload.model}, I2I: ${!!apiPayload.image_url}`);
        if (customModel) {
            log.info(`Custom Model: ${customModel.name} (${customModel.id})`);
        }

        const response = await axios.post(baseUrl, apiPayload, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (response.data && response.data.data) {
            const rawImages = response.data.data;

            const base64Promises = rawImages.map(async (img) => {
                if (img.b64_json) { return img.b64_json; }
                if (img.url) {
                    try {
                        log.info(`Fetching image from URL: ${img.url}`);
                        const imageResponse = await axios.get(img.url, { responseType: 'arraybuffer' });
                        return Buffer.from(imageResponse.data).toString('base64');
                    } catch (fetchError) {
                        log.error(`Failed to download image from ${img.url}: ${fetchError.message}`);
                        return null;
                    }
                }
                return null;
            });

            const base64Images = (await Promise.all(base64Promises)).filter(Boolean);

            if (base64Images.length === 0) {
                throw new Error("API response was successful but contained no valid image data.");
            }
            
            log.info(`Successfully processed ${base64Images.length} image(s).`);

            await fs.mkdir(OUTPUT_IMAGES_PATH, { recursive: true });

            const filePaths = [];
            for (const b64 of base64Images) {
                const filePath = path.join(OUTPUT_IMAGES_PATH, `image_${Date.now()}.png`);
                await fs.writeFile(filePath, Buffer.from(b64, 'base64'));
                filePaths.push(filePath);
                log.info(`Image saved to: ${filePath}`);
                
                log.info(`[Image Watermark] Starting watermarking for: ${filePath}`);
                try {
                    await watermarkManager.watermarkImage(filePath, {
                        model: apiPayload.model,
                        provider: customModel ? 'custom' : 'togetherai',
                        customModelId: customModel ? customModel.id : null,
                        prompt: apiPayload.prompt,
                        settings: {
                            steps: apiPayload.steps,
                            guidance_scale: apiPayload.guidance_scale,
                            width: apiPayload.width,
                            height: apiPayload.height,
                            negative_prompt: apiPayload.negative_prompt
                        },
                        mode: apiPayload.image_url ? 'I2I' : 'T2I'
                    });
                    log.info(`[Image Watermark] Successfully watermarked: ${filePath}`);
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (watermarkError) {
                    log.error(`[Image Watermark] Failed (non-fatal): ${watermarkError.message}`);
                }
            }
            log.info('[Image Watermark] All watermarking complete, returning result...');
            return { success: true, filePaths: filePaths };
        } else {
            const errorMsg = response.data?.error?.message || response.data?.error || 'Invalid response structure from generative API.';
            throw new Error(errorMsg);
        }
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
        
        const errorMsgStr = String(errorMessage || 'Unknown error occurred');
        
        if (!imageGenSettings.disable_safety_checker && (
            errorMsgStr.toLowerCase().includes('policy') || 
            errorMsgStr.toLowerCase().includes('violation') || 
            errorMsgStr.toLowerCase().includes('content filter') ||
            errorMsgStr.toLowerCase().includes('inappropriate') ||
            errorMsgStr.toLowerCase().includes('safety') ||
            errorMsgStr.toLowerCase().includes('nsfw'))) {
            const policyError = `Policy Violation: ${errorMsgStr}`;
            log.error(policyError);
            return { success: false, error: policyError };
        }
        
        log.error(`Image generation failed: ${errorMsgStr}`);
        return { success: false, error: errorMsgStr };
    }
}

const setupImageHandlers = () => {
    ipcMain.handle('generate-open-image', async (event, payload) => {
        log.info('Received generate-open-image request');
        return await _generateOpenImage(payload);
    });

    ipcMain.handle('generate-selfie', async (event, payload) => {
        log.info('Received generate-selfie request');
        try {
            const character = getActiveCharacter();
            
            let sceneResult;
            try {
                sceneResult = await generateSelfieScenePrompt(payload);
            } catch (sceneError) {
                log.error(`Scene prompt generation failed: ${sceneError.message}`);
                return { 
                    success: false, 
                    error: 'SCENE_PROMPT_FAILED',
                    sceneError: sceneError.message,
                    suggestion: 'Try selecting a different LLM model or increasing the output token limit in settings.'
                };
            }

            if (sceneResult.error || !sceneResult.answer || sceneResult.answer.trim().length < 10) {
                log.warn("LLM failed to generate a descriptive scene for the selfie. Using fallback.");
                sceneResult.answer = `Make an image of ${character.CHARACTER_NAME}. Be creative!`;
            }
            
            const { extractAndCleanThought } = require('./apiHandlers');
            const { cleanedAnswer, extractedThinking } = extractAndCleanThought(sceneResult.answer);
            sceneResult.answer = cleanedAnswer;
            if (extractedThinking) {
                sceneResult.thinking = (sceneResult.thinking || '') + '\n\n---\n\n' + extractedThinking;
            }
            
            let sceneData;
            try {
                sceneData = JSON.parse(sceneResult.answer);
                log.info(`Parsed scene JSON:`, sceneData);
            } catch (parseError) {
                log.warn(`Failed to parse scene as JSON, using as plain text: ${parseError.message}`);
                sceneData = {
                    CHARACTER_VISUALS: character.CHARACTER_DESCRIPTION_SAFE_FIRST_PERSON,
                    OUTFIT: payload.customAttire || character.CHARACTER_ATTIRE_FIRST_PERSON,
                    SCENE_ACTION: sceneResult.answer,
                    SCENE_ENVIRONMENT: 'in a natural, outdoor setting with soft lighting',
                    SCENE_CAMERA_QUALITY: 'high quality photo, detailed, photorealistic'
                };
            }

            for (const key in sceneData) {
                if (typeof sceneData[key] === 'string') {
                    const { cleanedAnswer: cleanedValue } = extractAndCleanThought(sceneData[key]);
                    sceneData[key] = cleanedValue;
                }
            }
            
            const finalPrompt = `${sceneData.CHARACTER_VISUALS}, ${sceneData.OUTFIT}, ${sceneData.SCENE_ACTION}, ${sceneData.SCENE_ENVIRONMENT}, ${sceneData.SCENE_CAMERA_QUALITY}`;
            log.info(`=== FULL IMAGE GENERATION PROMPT ===`);
            log.info(finalPrompt);
            log.info(`=== END FULL PROMPT ===`);
            
            const selfieImageGenSettings = {
                modelConfig: { modelId: 'black-forest-labs/FLUX.1-schnell' },
                prompt: finalPrompt,
                negative_prompt: character.CHARACTER_NEGATIVE_PROMPT,
                steps: 5,
                guidance_scale: 3.5,
                width: 1024,
                height: 1024,
                disable_safety_checker: true
            };

            const result = await _generateOpenImage({ imageGenSettings: selfieImageGenSettings });
            
            if (result.success && result.filePaths) {
                log.info(`[Selfie Watermark] Starting watermarking for ${result.filePaths.length} image(s)...`);
                for (const filePath of result.filePaths) {
                    try {
                        log.info(`[Selfie Watermark] Watermarking: ${filePath}`);
                        await watermarkManager.watermarkImage(filePath, {
                            model: 'flux-schnell',
                            provider: 'togetherai',
                            prompt: finalPrompt,
                            settings: {
                                steps: 5,
                                guidance_scale: 3.5,
                                width: 1024,
                                height: 1024
                            },
                            mode: 'selfie',
                            character: character.CHARACTER_NAME
                        });
                        log.info(`[Selfie Watermark] Successfully watermarked: ${filePath}`);
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (watermarkError) {
                        log.error(`[Selfie Watermark] Failed (non-fatal): ${watermarkError.message}`);
                    }
                }
                log.info('[Selfie Watermark] All watermarking complete, returning result to renderer...');
            }
            
            return { ...result, thinking: sceneResult.thinking };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            log.error(`Selfie generation process failed: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    });
};

module.exports = { setupImageHandlers };
