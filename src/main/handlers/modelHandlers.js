// src/main/handlers/modelHandlers.js
const { ipcMain, app: electronApp } = require('electron'); 
const Store = require('electron-store');
const log = require('electron-log');
const axios = require('axios');
const { getDecryptedApiKeys } = require('./apiHandlers');
const { runPythonScript } = require('../utils'); 

const store = new Store();

function normalizeAndFilterModel(model, providerName) {
    try {
        const modelType = model.type || model.architecture?.modality || 'chat';
        if (!modelType.includes('text') && !modelType.includes('chat')) {
            return null;
        }
        if (['embedding', 'rerank', 'moderation', 'image', 'audio'].includes(model.type)) {
            return null;
        }

        if (model.model_spec?.offline === true || model.isDisabled === true) {
            return null;
        }
        
        if (model.created === 0) {
            return null;
        }

        // --- NORMALIZATION LOGIC ---

        const id = model.id || model.name;
        const displayName = model.model_spec?.name || model.name || model.display_name || id;

        const context = model.context_length || model.context_window || model.model_spec?.availableContextTokens || model.contextLength || 8192;
        
        let inputCost = 0;
        let outputCost = 0;

        if (model.pricing) {
            inputCost = parseFloat(model.pricing.prompt || '0');
            outputCost = parseFloat(model.pricing.completion || '0');
        } else if (model.model_spec?.pricing) {
            inputCost = parseFloat(model.model_spec.pricing.input?.usd || 0);
            outputCost = parseFloat(model.model_spec.pricing.output?.usd || 0);
        }

        if (inputCost > 0.01 || outputCost > 0.01) {

        } else if (inputCost > 0 || outputCost > 0) {
            inputCost = inputCost * 1000000;
            outputCost = outputCost * 1000000;
            log.info(`Detected per-token pricing for ${id}. Converted: $${inputCost / 1000000}/$${outputCost / 1000000} per token → $${inputCost}/$${outputCost} per 1M tokens`);
        }

        const isFree = inputCost === 0 && outputCost === 0;

        return {
            modelId: id,
            displayName: displayName,
            provider: providerName,
            contextWindow: context,
            maxOutputLimit: model.top_provider?.max_completion_tokens || model.max_output_tokens || context,
            costInput: inputCost,
            costOutput: outputCost,
            isFree: isFree,
        };

    } catch (e) {
        log.warn(`Failed to normalize model from provider ${providerName}. Model ID: ${model.id}. Error: ${e.message}`);
        return null;
    }
}

async function _saveChatTurnToRAG(turn, app) {
    log.info('Attempting to save chat turn to RAG database...');
    const userDataPath = app.getPath('userData'); 
    try {
        if (!turn.id) {
            turn.id = `turn-${Date.now()}`;
            log.warn(`Turn ID missing, using generated ID: ${turn.id}`);
        }
        if (!turn.timestamp) {
            turn.timestamp = Date.now();
            log.warn(`Turn timestamp missing, using generated timestamp: ${turn.timestamp}`);
        }
        const result = await runPythonScript({
            scriptName: 'rag_backend.py',
            args: ['save_chat_turn', 'chat_history', userDataPath],
            inputData: JSON.stringify(turn),
        });
        if (result.success) {
            log.info('Successfully saved chat turn to RAG.');
        } else {
            log.error('Failed to save chat turn to RAG:', result.error);
        }
        return result;
    } catch (error) {
        log.error('Critical error during RAG chat save:', error.message);
        return { success: false, error: error.message };
    }
}


const setupModelHandlers = (app) => {
    log.info('Setting up Model IPC handlers...');

    ipcMain.handle('save-chat-turn-to-rag', async (event, turn) => {
        return await _saveChatTurnToRAG(turn, app);
    });
   
    ipcMain.handle('get-available-models', async () => {
    const groupedModels = {};
    const customApis = store.get('customApis', []);
    const apiKeys = await getDecryptedApiKeys();
    const baseUrl = apiKeys.ollamaBaseUrl || 'http://localhost:11434';
    
    // --- Ollama (Local) ---
    try {
        const tagResponse = await axios.get(`${baseUrl}/api/tags`);
        const localModelsList = tagResponse.data.models || [];
        const detailedModelsPromises = localModelsList.map(async (model) => {
            const modelId = model.name;
            try {
                const showResponse = await axios.post(`${baseUrl}/api/show`, { model: modelId });
                const details = showResponse.data.model_info || {};
                const contextLength = details['llama.context_length'] || details['general.context_length'] || 4096;
                return { modelId, displayName: modelId, provider: 'Ollama (Local)', contextWindow: contextLength, maxOutputLimit: contextLength, costInput: 0, costOutput: 0, isFree: true };
            } catch (detailError) {
                log.warn(`Failed to fetch details for Ollama model ${modelId}: ${detailError.message}`);
                return { modelId, displayName: modelId, provider: 'Ollama (Local)', contextWindow: 4096, maxOutputLimit: 4096, costInput: 0, costOutput: 0, isFree: true };
            }
        });
        groupedModels['Ollama (Local)'] = await Promise.all(detailedModelsPromises);
    } catch (error) {
        log.warn(`Could not connect to Ollama: ${error.message}`);
    }
    
    // --- TogetherAI ---
    const togetherApiKey = apiKeys.togetherApiKey;
    if (togetherApiKey) {
        try {
            const response = await axios.get(`https://api.together.xyz/v1/models`, { headers: { 'Authorization': `Bearer ${togetherApiKey}` } });
            const blocklist = ['togethercomputer/MoA-1', 'togethercomputer/MoA-1-Turbo'];

                        const togetherAIModels = response.data
                            .filter(model => model.type === 'chat' && model.running === false && model.created > 0 && model.license !== null && !blocklist.includes(model.id))
                            .map(model => {
                                const costInput = model.pricing?.input || 0;
                                const costOutput = model.pricing?.output || 0;
                                return {
                                    modelId: model.id,
                                    displayName: model.display_name,
                                    provider: 'TogetherAI',
                                    contextWindow: model.context_length || 8192,
                                    maxOutputLimit: model.max_output_tokens || model.context_length || 8192,
                                    costInput: costInput,
                                    costOutput: costOutput,
                                    isFree: costInput === 0 && costOutput === 0,
                                };
                            });            const freeTogether = togetherAIModels.filter(m => m.isFree);
            const paidTogether = togetherAIModels.filter(m => !m.isFree);
            if (freeTogether.length > 0) groupedModels['Free Open Source (Together)'] = freeTogether;
            if (paidTogether.length > 0) groupedModels['TogetherAI (Paid)'] = paidTogether;

        } catch (error) {
            log.error(`Failed to fetch Together.ai models: ${error.message}`);
        }
    }

    // --- Custom APIs ---
    for (const api of customApis) {
        if (!api.modelsUrl || !api.apiKey) continue;
        try {
            const response = await axios.get(api.modelsUrl, { headers: { 'Authorization': `Bearer ${api.apiKey}` } });
            const modelsData = response.data.data || response.data || [];
            
            if (!Array.isArray(modelsData)) continue;

            const processedModels = modelsData
                .map(model => normalizeAndFilterModel(model, api.name))
                .filter(Boolean);
            
            const freeModels = processedModels.filter(m => m.isFree);
            const paidModels = processedModels.filter(m => !m.isFree);

            if (freeModels.length > 0) groupedModels[`${api.name} (Free)`] = freeModels;
            if (paidModels.length > 0) groupedModels[`${api.name} (Paid)`] = paidModels;

        } catch (error) {
            log.warn(`Could not fetch models from custom API ${api.name}: ${error.message}`);
        }
    }

    return groupedModels;
    });

    ipcMain.handle('ollama-list-models', async () => {
        try {
            const apiKeys = await getDecryptedApiKeys();
            const baseUrl = apiKeys.ollamaBaseUrl ? apiKeys.ollamaBaseUrl : 'http://localhost:11434';
            const response = await axios.get(`${baseUrl}/api/tags`);
            return response.data.models || [];
        } catch (error) {
            log.error(`Ollama list models failed: ${error.message}`);
            throw error;
        }
    });

    ipcMain.handle('ollama-delete-model', async (event, { modelName }) => {
        const apiKeys = await getDecryptedApiKeys();
        const baseUrl = apiKeys.ollamaBaseUrl ? apiKeys.ollamaBaseUrl : 'http://localhost:11434';
        try {
            await axios({ method: 'delete', url: `${baseUrl}/api/delete`, data: { name: modelName } });
            log.info(`Successfully deleted Ollama model: ${modelName}`);
            return { success: true };
        } catch (error) {
            log.error(`Ollama delete model failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ollama-pull-model', async (event, { modelName }) => {
        const apiKeys = await getDecryptedApiKeys();
        const baseUrl = apiKeys.ollamaBaseUrl ? apiKeys.ollamaBaseUrl : 'http://localhost:11434';
        try {
            log.info(`Starting Ollama model pull: ${modelName}`);
            const response = await axios({ method: 'post', url: `${baseUrl}/api/pull`, data: { name: modelName }, responseType: 'stream' });
            await new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim().length > 0);
                    for (const line of lines) {
                        try {
                            const progress = JSON.parse(line);
                            if (progress.total && progress.completed) {
                                const percent = ((progress.completed / progress.total) * 100).toFixed(2);
                                log.info(`Ollama pull progress: ${progress.status || 'downloading'} ${percent}%`);
                            } else {
                                log.info(`Ollama pull status: ${progress.status || 'processing'}`);
                            }
                            event.sender.send('ollama-pull-progress', { success: true, ...progress });
                        } catch (e) {
                            log.warn(`Could not parse Ollama progress chunk: ${line}`);
                        }
                    }
                });
                response.data.on('end', () => {
                    log.info(`Ollama model pull complete: ${modelName}`);
                    event.sender.send('ollama-pull-progress', { success: true, status: 'Download complete!', done: true });
                    resolve();
                });
                response.data.on('error', (err) => {
                    log.error(`Ollama pull stream error: ${err.message}`);
                    reject(err);
                });
            });
            return { success: true };
        } catch (error) {
            log.error(`Ollama pull model failed: ${error.message}`);
            event.sender.send('ollama-pull-progress', { success: false, error: error.message, done: true });
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-current-model-config', async () => {
        try {
            const lastSelectedModel = store.get('lastSelectedModel');
            if (!lastSelectedModel) {
                return { success: false, error: 'No model selected' };
            }

            const groupedModels = await (async () => {
                const groupedModels = {};
                const customApis = store.get('customApis', []);
                const apiKeys = await getDecryptedApiKeys();
                const baseUrl = apiKeys.ollamaBaseUrl || 'http://localhost:11434';
                
                // --- Ollama (Local) ---
                try {
                    const tagResponse = await axios.get(`${baseUrl}/api/tags`);
                    const localModelsList = tagResponse.data.models || [];
                    const detailedModelsPromises = localModelsList.map(async (model) => {
                        const modelId = model.name;
                        try {
                            const showResponse = await axios.post(`${baseUrl}/api/show`, { model: modelId });
                            const details = showResponse.data.model_info || {};
                            const contextLength = details['llama.context_length'] || details['general.context_length'] || 4096;
                            return { modelId, displayName: modelId, provider: 'Ollama (Local)', contextWindow: contextLength, maxOutputLimit: contextLength, costInput: 0, costOutput: 0, isFree: true };
                        } catch (detailError) {
                            log.warn(`Failed to fetch details for Ollama model ${modelId}: ${detailError.message}`);
                            return { modelId, displayName: modelId, provider: 'Ollama (Local)', contextWindow: 4096, maxOutputLimit: 4096, costInput: 0, costOutput: 0, isFree: true };
                        }
                    });
                    groupedModels['Ollama (Local)'] = await Promise.all(detailedModelsPromises);
                } catch (error) {
                    log.warn(`Could not connect to Ollama: ${error.message}`);
                }
                
                // --- TogetherAI ---
                const togetherApiKey = apiKeys.togetherApiKey;
                if (togetherApiKey) {
                    try {
                        const response = await axios.get(`https://api.together.xyz/v1/models`, { headers: { 'Authorization': `Bearer ${togetherApiKey}` } });
                        const blocklist = ['togethercomputer/MoA-1', 'togethercomputer/MoA-1-Turbo'];

                        const togetherAIModels = response.data
                            .filter(model => model.type === 'chat' && model.running === false && model.created > 0 && model.license !== null && !blocklist.includes(model.id))
                            .map(model => {
                                const costInput = model.pricing?.input || 0;
                                const costOutput = model.pricing?.output || 0;
                                return {
                                    modelId: model.id,
                                    displayName: model.display_name,
                                    provider: 'TogetherAI',
                                    contextWindow: model.context_length || 8192,
                                    maxOutputLimit: model.max_output_tokens || model.context_length || 8192,
                                    costInput: costInput,
                                    costOutput: costOutput,
                                    isFree: costInput === 0 && costOutput === 0,
                                };
                            });
                        
                        const freeTogether = togetherAIModels.filter(m => m.isFree);
                        const paidTogether = togetherAIModels.filter(m => !m.isFree);
                        if (freeTogether.length > 0) groupedModels['Free Open Source (Together)'] = freeTogether;
                        if (paidTogether.length > 0) groupedModels['TogetherAI (Paid)'] = paidTogether;

                    } catch (error) {
                        log.error(`Failed to fetch Together.ai models: ${error.message}`);
                    }
                }

                // --- Custom APIs ---
                for (const api of customApis) {
                    if (!api.modelsUrl || !api.apiKey) continue;
                    try {
                        const response = await axios.get(api.modelsUrl, { headers: { 'Authorization': `Bearer ${api.apiKey}` } });
                        const modelsData = response.data.data || response.data || [];
                        
                        if (!Array.isArray(modelsData)) continue;

                        const processedModels = modelsData
                            .map(model => normalizeAndFilterModel(model, api.name))
                            .filter(Boolean);
                        
                        const freeModels = processedModels.filter(m => m.isFree);
                        const paidModels = processedModels.filter(m => !m.isFree);

                        if (freeModels.length > 0) groupedModels[`${api.name} (Free)`] = freeModels;
                        if (paidModels.length > 0) groupedModels[`${api.name} (Paid)`] = paidModels;

                    } catch (error) {
                        log.warn(`Could not fetch models from custom API ${api.name}: ${error.message}`);
                    }
                }

                return groupedModels;
            })();

            let selectedModel = null;
            let selectedProvider = null;

            for (const [provider, models] of Object.entries(groupedModels)) {
                const model = models.find(m => m.modelId === lastSelectedModel);
                if (model) {
                    selectedModel = model;
                    selectedProvider = provider;
                    break;
                }
            }

            if (!selectedModel) {
                log.warn(`Selected model ${lastSelectedModel} not found, using first available free model`);
                for (const [provider, models] of Object.entries(groupedModels)) {
                    const freeModel = models.find(m => m.isFree);
                    if (freeModel) {
                        selectedModel = freeModel;
                        selectedProvider = provider;
                        break;
                    }
                }
            }

            if (!selectedModel) {
                return { success: false, error: `No suitable LLM model found for summarization` };
            }

            return { 
                success: true, 
                modelConfig: {
                    modelId: selectedModel.modelId,
                    provider: selectedModel.provider
                }
            };
        } catch (error) {
            log.error(`Failed to get current model config: ${error.message}`);
            return { success: false, error: error.message };
        }
    });
};

module.exports = { setupModelHandlers };