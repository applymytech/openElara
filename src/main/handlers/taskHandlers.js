const { ipcMain, shell, app } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { runPythonScript } = require('../utils');
const { routeApiCall, getRecentTurns } = require('./apiHandlers');
const { handleExaWebTask } = require('./exaHandler');
const { getActiveCharacter } = require('../characters');
const { buildSelfieSystemPrompt, buildVideoSystemPrompt } = require('../promptConstants');

async function generateSelfieScenePrompt(payload) {
    log.info('Generating selfie scene prompt...');
    
    const character = getActiveCharacter();
    const userName = payload.userName || 'User';
    
    const recentContext = await getRecentTurns('chat_history', 5, payload.historyTokenLimit || 2048, character.CHARACTER_NAME);
    const contextText = recentContext.turns && recentContext.turns.length > 0
        ? `\n\n<recentConversation>\nRecent conversation context (for contextual awareness in your selfie):\n${recentContext.turns.join('\n\n')}\n</recentConversation>`
        : '';
    
    const systemPrompt = buildSelfieSystemPrompt(
        userName,
        character.CHARACTER_PERSONA
    ) + contextText;
    
    const userSuggestion = payload.userSuggestion && payload.userSuggestion.trim().length > 0 
        ? payload.userSuggestion 
        : null;
    
    let userContent;
        if (userSuggestion) {
                userContent = `Generate a creative scene description for an image with this scenario: "${userSuggestion}". Describe the pose, expression, actions, lighting, mood, setting, and environment. You MUST output only the scene description text, written strictly in the First-Person perspective ("I," "my," "me").`;
            } else {
                userContent = `Generate a creative scene description for a selfie image. Describe the pose, expression, actions, lighting, mood, setting, and environment. You MUST output only the scene description text, written strictly in the First-Person perspective ("I," "my," "me").`;
            }
    
    const llmPayload = {
        history: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ],
        modelConfig: payload.modelConfig,
        temperature: 0.8,
        historyTokenLimit: payload.historyTokenLimit || 2048,
        knowledgeTokenLimit: payload.knowledgeTokenLimit || 2048,
        outputReservation: payload.outputReservation,
        recentTurnsCount: payload.recentTurnsCount || 5,
        contextCanvasFiles: payload.contextCanvasFiles,
        attachedFileContent: payload.attachedFileContent,
    };
    
    log.info(`Requesting selfie prompt from ${character.CHARACTER_NAME} using model: ${payload.modelConfig?.modelId || 'unknown'}...`);

    const rawResult = await routeApiCall(llmPayload);
    
    log.info('=== RAW LLM RESPONSE FOR SELFIE SCENE ===');
    log.info(rawResult.answer || rawResult);
    log.info('=== END RAW LLM RESPONSE ===');

    return rawResult;
}

async function generateVideoScenePrompt(payload) {
    log.info('Generating video scene prompt...');

    const character = getActiveCharacter();
    const userName = payload.userName || 'User';

    const recentContext = await getRecentTurns('chat_history', 5, payload.historyTokenLimit || 2048, character.CHARACTER_NAME);
    const contextText = recentContext.turns && recentContext.turns.length > 0
        ? `\n\n<recentConversation>\nRecent conversation context (for contextual awareness in your video):\n${recentContext.turns.join('\n\n')}\n</recentConversation>`
        : '';

    const systemPrompt = buildVideoSystemPrompt(
        userName,
        character.CHARACTER_PERSONA
    ) + contextText;

    const userSuggestion = payload.userSuggestion && payload.userSuggestion.trim().length > 0
        ? payload.userSuggestion
        : null;

    let userContent;
        if (userSuggestion) {
                userContent = `Generate a scene description for a video, with you as the star, with this scenario: "${userSuggestion}". Describe the actions, movements, camera angles, lighting, mood, setting, and environment. **Specifically include cinematic scene directions like camera angle, lighting style, and cinematic motion.** You MUST output only the scene description text, written strictly in the First-Person perspective ("I," "my," "me").`;
            } else {
                userContent = `Generate a creative scene description for a video with you as the star. Describe the actions, movements, camera angles, lighting, mood, setting, and environment. **Specifically include cinematic scene directions like camera angle, lighting style, and cinematic motion.** You MUST output only the scene description text, written strictly in the First-Person perspective ("I," "my," "me").`;
            }

    const llmPayload = {
        history: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ],
        modelConfig: payload.modelConfig,
        temperature: 0.8,
        historyTokenLimit: payload.historyTokenLimit || 2048,
        knowledgeTokenLimit: payload.knowledgeTokenLimit || 2048,
        outputReservation: payload.outputReservation,
        recentTurnsCount: payload.recentTurnsCount || 5,
        contextCanvasFiles: payload.contextCanvasFiles,
        attachedFileContent: payload.attachedFileContent,
    };

    log.info(`Requesting video prompt from ${character.CHARACTER_NAME} using model: ${payload.modelConfig?.modelId || 'unknown'}...`);

    return await routeApiCall(llmPayload);
}

const setupTaskHandlers = () => {
    log.info('Setting up Task IPC handlers...');

    ipcMain.handle('run-scrapy-task', async (event, payload) => {
        try {
            const userDataPath = app.getPath('userData');
            const outputDir = path.join(userDataPath, 'output');
            payload.outputDir = outputDir;
            
            const result = await runPythonScript({
                scriptName: 'scrapy_worker.py',
                args: [JSON.stringify(payload)],
                event: event,
                progressChannel: 'scrapy-progress'
            });
            
            if (typeof result === 'string') {
                try {
                    return JSON.parse(result);
                } catch (e) {
                    return { success: true, data: result };
                }
            }
            return result;
        } catch (error) {
            log.error(`Scrapy task error: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('scrapy-scrape', async (event, { url, mode }) => {
        try {
            const userDataPath = app.getPath('userData');
            const outputDir = path.join(userDataPath, 'output', 'scrapy');
            
            const result = await runPythonScript({
                scriptName: 'scrapy_worker.py',
                args: [JSON.stringify({
                    task: 'scrape',
                    urls: [url],
                    scrapeType: mode || 'content',
                    outputDir: outputDir
                })],
                event: event,
                progressChannel: 'scrapy-progress'
            });
            
            let parsedResult;
            if (typeof result === 'string') {
                try {
                    parsedResult = JSON.parse(result);
                } catch (e) {
                    parsedResult = { success: true, data: result };
                }
            } else {
                parsedResult = result;
            }
            
            if (parsedResult.success && parsedResult.filename) {
                const filePath = path.join(outputDir, parsedResult.filename);
                try {
                    const stats = fs.statSync(filePath);
                    parsedResult.fileSize = stats.size;
                    parsedResult.fileName = parsedResult.filename;
                } catch (e) {
                    log.warn(`Could not get file stats for ${parsedResult.filename}`);
                }
            }
            
            return parsedResult;
        } catch (error) {
            log.error(`Scrapy scrape error: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-external-link', (event, url) => {
        shell.openExternal(url);
    });

    ipcMain.handle('run-web-task', async (event, payload) => {
        log.info('Received run-web-task request (Exa.ai)');
        try {
            const result = await handleExaWebTask(payload); 
            return result;
        } catch (error) {
            log.error(`Exa.ai Web Task Failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('generate-theme-palette', async (event, { color, modelConfig, outputReservation }) => {
        const character = getActiveCharacter();

        const systemPrompt = `<systemPrompt>
<yourPersona>
${character.CHARACTER_PERSONA}
</yourPersona>
</systemPrompt>`;

        const userPrompt = `Hey ${character.CHARACTER_NAME}! Create a complete UI theme using ${color} as inspiration.

IMPORTANT: Make colors that are NOTICEABLY DIFFERENT to the human eye. Don't make tiny changes like shifting by 1-2%. Each background shade should be clearly distinct - use the full range of colors available.

Return ONLY this JSON structure:

{
  "dark": {
    "main-bg-color": "#hexcolor",
    "secondary-bg-color": "#hexcolor",
    "tertiary-bg-color": "#hexcolor",
    "button-bg-color": "#hexcolor",
    "button-hover-bg-color": "#hexcolor",
    "main-text-color": "#hexcolor",
    "secondary-text-color": "#hexcolor",
    "accent-color": "#hexcolor",
    "accent-color-hover": "#hexcolor",
    "accent-contrast-text-color": "#hexcolor",
    "message-user-bg": "#hexcolor",
    "message-ai-bg": "#hexcolor",
    "code-block-bg": "#hexcolor",
    "border-color": "#hexcolor",
    "error-color": "#hexcolor",
    "success-color": "#hexcolor",
    "link-color": "#hexcolor",
    "highlight-color": "#hexcolor",
    "spinner-base-color": "#hexcolor",
    "shadow-color-rgba": "rgba(r,g,b,a)",
    "hug-color": "#hexcolor",
    "punch-color": "#hexcolor",
    "high-five-color": "#hexcolor"
  },
  "light": {
    (same 23 keys as above, but light mode variants)
  }
}`;

        const apiKeys = await require('./apiHandlers').getDecryptedApiKeys();
        const provider = modelConfig.provider;

        let apiResult;
        try {
            if (provider === 'Ollama (Local)') {
                const baseUrl = apiKeys.ollamaBaseUrl ? apiKeys.ollamaBaseUrl : 'http://localhost:11434';
                const response = await axios.post(`${baseUrl}/api/chat`, {
                    model: modelConfig.modelId,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    stream: false,
                    options: { temperature: 0.75, num_predict: outputReservation },
                });
                apiResult = { success: true, rawContent: response.data.message.content };
            } else if (provider.includes('Together') || provider.includes('Free')) {
                const apiKey = apiKeys.togetherApiKey;
                if (!apiKey) throw new Error('TogetherAI API Key is not set.');
                const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
                    model: modelConfig.modelId,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.75,
                    max_tokens: outputReservation
                }, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                apiResult = { success: true, rawContent: response.data.choices[0].message.content };
            } else {
                const customApis = require('electron-store')().get('customApis', []);
                const apiConfig = customApis.find(api => api.name === provider);
                if (!apiConfig || !apiConfig.apiKey || !apiConfig.completionsUrl) {
                    throw new Error(`Custom API '${provider}' configuration missing.`);
                }
                const response = await axios.post(apiConfig.completionsUrl, {
                    model: modelConfig.modelId,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.75,
                    max_tokens: outputReservation
                }, { headers: { 'Authorization': `Bearer ${apiConfig.apiKey}` } });
                apiResult = { success: true, rawContent: response.data.choices[0].message.content };
            }
        } catch (error) {
            log.error('Theme generation API error:', error);
            return { success: false, error: error.message };
        }

        if (!apiResult.success) {
            return { success: false, error: apiResult.error };
        }

        const rawResponse = apiResult.rawContent;
        log.info('[Theme Gen] Raw AI response:', rawResponse);

        const { cleanedAnswer, extractedThinking } = require('./apiHandlers.js').extractAndCleanThought(rawResponse);
        log.info('[Theme Gen] After thinking extraction:', cleanedAnswer);

        try {
            let parsedPalette;

            const jsonMatch = cleanedAnswer.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
            if (jsonMatch) {
                parsedPalette = JSON.parse(jsonMatch[1]);
                log.info('[Theme Gen] Parsed from code block');
            } else {
                const startIndex = cleanedAnswer.indexOf('{');
                if (startIndex !== -1) {
                    let braceCount = 0;
                    let endIndex = startIndex;
                    for (let i = startIndex; i < cleanedAnswer.length; i++) {
                        if (cleanedAnswer[i] === '{') braceCount++;
                        else if (cleanedAnswer[i] === '}') braceCount--;
                        if (braceCount === 0) {
                            endIndex = i;
                            break;
                        }
                    }
                    if (braceCount === 0) {
                        const jsonString = cleanedAnswer.substring(startIndex, endIndex + 1);
                        parsedPalette = JSON.parse(jsonString);
                        log.info('[Theme Gen] Parsed from JSON substring');
                    } else {
                        throw new Error('Incomplete JSON object in response');
                    }
                } else {
                    throw new Error('No JSON found in response');
                }
            }

            log.info(`${character.CHARACTER_NAME} successfully created a custom theme palette!`);
            return {
                success: true,
                palette: parsedPalette,
                debugInfo: {
                    requestPrompt: userPrompt,
                    aiRawResponse: rawResponse,
                    extractedThinking: extractedThinking,
                    cleanedAnswer: cleanedAnswer,
                    parsedPalette: parsedPalette
                }
            };
        } catch (parseError) {
            log.error('Failed to parse theme from AI. Error: ' + parseError.message + '. Cleaned answer: ' + cleanedAnswer);
            return {
                success: false,
                error: 'AI did not return a valid JSON palette.',
                debugInfo: {
                    requestPrompt: userPrompt,
                    aiRawResponse: rawResponse,
                    extractedThinking: extractedThinking,
                    cleanedAnswer: cleanedAnswer,
                    parseError: parseError.message
                }
            };
        }
    });

    ipcMain.handle('generate-selfie-scene-prompt', async (event, payload) => {
        return await generateSelfieScenePrompt(payload);
    });

    ipcMain.handle('generate-video-scene-prompt', async (event, payload) => {
        return await generateVideoScenePrompt(payload);
    });
};

module.exports = { setupTaskHandlers, generateSelfieScenePrompt, generateVideoScenePrompt };