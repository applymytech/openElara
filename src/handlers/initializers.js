// src/handlers/initializers.js

import { elements, addMessage, applyPalette, updateCharacterIcon } from './domHandlers.js';
import { setupTokenManager } from './tokenManager.js';

export function initializeHistory(conversationHistory) {
    const savedHistory = sessionStorage.getItem('conversationHistory');
    let history = [];
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory)) {
                history = parsedHistory.filter(turn => turn.role !== 'system');
            }
        } catch (error) {
            console.error("Failed to parse history from sessionStorage:", error);
            sessionStorage.removeItem('conversationHistory');
        }
    }
    if (elements.chatHistory) {
        elements.chatHistory.innerHTML = '';
        const recentHistory = history.slice(-5);
        recentHistory.forEach(turn => {
            if (turn.role === 'user' || turn.role === 'assistant') {
                const isMedia = turn.isImage || turn.isVideo || false;
                addMessage(turn.content, turn.role, turn.attachedFilename, isMedia);
            }
        });
    }
    return history;
}

export async function initializePersonalitySelector() {
    if (!elements.personaSelect) return;
    try {
        const activeCharacterName = await window.electronAPI.getActiveCharacterName();
        
        const localPersonalities = await window.electronAPI.getPersonalities();
        const personalitiesWithData = await Promise.all(localPersonalities.map(async p => {
            const fullPersonality = await window.electronAPI.getPersonality(p.name);
            return {
                id: `Custom: ${p.name}`,
                displayName: p.name,
                tokenLimit: fullPersonality ? fullPersonality.tokenLimit : 0,
                text: fullPersonality ? fullPersonality.text : ''
            };
        }));

        elements.personaSelect.innerHTML = `<option value="default" data-text="">Default (${activeCharacterName})</option>`;
        
        if (personalitiesWithData.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'Custom Modifiers';
            personalitiesWithData.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.displayName;
                option.dataset.tokenLimit = p.tokenLimit;
                option.dataset.text = p.text;
                optgroup.appendChild(option);
            });
            elements.personaSelect.appendChild(optgroup);
        }

        const lastPersonaId = await window.electronAPI.getStoredValue('lastSelectedPersona');
        if (lastPersonaId && Array.from(elements.personaSelect.options).some(opt => opt.value === lastPersonaId)) {
            elements.personaSelect.value = lastPersonaId;
        } else {
            elements.personaSelect.value = 'default';
        }
        
        const selectedOption = elements.personaSelect.options[elements.personaSelect.selectedIndex];
        if (elements.personalityDisplayName) {
            elements.personalityDisplayName.textContent = selectedOption?.textContent || `Default (${activeCharacterName})`;
        }
        
        elements.personaSelect.dispatchEvent(new Event('change'));

    } catch (error) {
        console.error("Failed to initialize personality modifiers:", error);
        elements.personaSelect.innerHTML = '<option>Error loading modifiers</option>';
    }
}

export async function initializeModelSelector(state) {
    if (!elements.modelSelect) return;
    try {
        const groupedModels = await window.electronAPI.getAvailableModels();
        elements.modelSelect.innerHTML = '';

        if (!groupedModels || Object.keys(groupedModels).length === 0 || Object.values(groupedModels).every(arr => arr.length === 0)) {
            const errorMessage = "No models found. Please ensure Ollama is running and API keys are correctly configured in Account Settings.";
            elements.modelSelect.innerHTML = `<option value="">${errorMessage}</option>`;
            addMessage(`**Configuration Error:**\n${errorMessage}`, 'ai');
            return; 
        }
        
        const allModelsFlat = Object.values(groupedModels).flat();
        sessionStorage.setItem('llmSuiteModels', JSON.stringify(allModelsFlat));
        
        const groupOrder = ['Ollama (Local)', 'Free Models'];

        const populateGroup = (groupName) => {
            const modelList = groupedModels[groupName];
            if (modelList && modelList.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupName;
                modelList.sort((a, b) => a.displayName.localeCompare(b.displayName)).forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.modelId;
                    const prefix = model.provider === 'Ollama (Local)' ? '💻 ' : (model.isFree ? '✅ ' : '💲 ');
                    option.textContent = `${prefix}${model.displayName}`;
                    option.dataset.provider = model.provider;
                    option.dataset.contextWindow = model.contextWindow;
                    option.dataset.maxOutputLimit = model.maxOutputLimit;
                    option.dataset.costInput = (model.costInput || 0).toString();
                    option.dataset.costOutput = (model.costOutput || 0).toString();
                    optgroup.appendChild(option);
                });
                elements.modelSelect.appendChild(optgroup);
            }
        };

        groupOrder.forEach(groupName => populateGroup(groupName));

        for (const groupName in groupedModels) {
            if (!groupOrder.includes(groupName)) {
                populateGroup(groupName);
            }
        }
        
        const lastModelId = await window.electronAPI.getStoredValue('lastSelectedModel');
        if (lastModelId && Array.from(elements.modelSelect.options).some(opt => opt.value === lastModelId)) {
            elements.modelSelect.value = lastModelId;
        } else if (elements.modelSelect.options.length > 0) {
            elements.modelSelect.selectedIndex = 0;
        }
        
        state.selectedModel = elements.modelSelect.value;
        
        const selectedOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
        if (elements.modelDisplayName) {
             elements.modelDisplayName.textContent = selectedOption?.textContent.replace(/^[\s\S]*? /, '') || '...';
        }

    } catch (error) {
        console.error("Failed to initialize model selector:", error);
        const errorMessage = `Could not load LLM models. The backend process may have crashed or is unresponsive. Error: ${error.message}`;
        addMessage(`**CRITICAL ERROR:**\n${errorMessage}`, 'ai');
        if (elements.modelSelect) {
            elements.modelSelect.innerHTML = '<option value="">Error loading models!</option>';
        }
    }
}

async function applySavedTheme(state) {
    let currentTheme = { mode: 'dark', palette: null, isLightActive: false };
    try {
        const savedTheme = await window.electronAPI.getTheme();
        if (savedTheme) {
            currentTheme = savedTheme;
        }
    } catch (error) {
        console.warn('Failed to load saved theme:', error);
    }
    
    state.currentTheme = currentTheme;
    
    if (currentTheme.mode === 'custom' && currentTheme.palette) {
        const paletteVariant = currentTheme.isLightActive ? currentTheme.palette.light : currentTheme.palette.dark;
        console.log('[initializeTheme] Loading saved custom theme - variant:', currentTheme.isLightActive ? 'light' : 'dark');
        document.body.classList.remove('light-theme');
        document.body.classList.remove('theme-active');
        applyPalette(paletteVariant);
    }
    
    if (currentTheme.mode !== 'custom') {
        document.body.classList.add('theme-active');
        document.body.classList.toggle('light-theme', currentTheme.isLightActive);
    }
}

export async function initializeApplication(state) {
    state.conversationHistory = initializeHistory(state.conversationHistory);
    await updateCharacterIcon();
    const activeCharacterName = await window.electronAPI.getActiveCharacterName();
    
    await initializeModelSelector(state); 
    
    await initializePersonalitySelector();

    state.currentPersona = elements.personaSelect.value;
    const selectedPersonalityOption = elements.personaSelect.options[elements.personaSelect.selectedIndex];
    
    let personalityText = '';

    if (selectedPersonalityOption && elements.personalityDisplayName) {
        personalityText = selectedPersonalityOption.dataset.text || '';
    } else if(elements.personalityDisplayName) {
        elements.personalityDisplayName.textContent = `Default (${activeCharacterName})`;
    }

    try {
        const systemPromptText = await window.electronAPI.getSystemInstruction({
            userName: state.userName,
            personalityText: personalityText,
            outputTokenLimit: state.tokenSettings.output
        });
        const systemMessage = { role: 'system', content: systemPromptText };
        const systemPromptTokens = await window.electronAPI.countTokens(systemPromptText);
        const safetyMargin = 128;
        state.tokenSettings.systemReserve = systemPromptTokens + safetyMargin;
        
        state.conversationHistory = state.conversationHistory.filter(msg => msg.role !== 'system');
        state.conversationHistory.unshift(systemMessage);
        
    } catch (error) {
        console.error("Failed to get and set system prompt:", error);
        addMessage(`**CRITICAL ERROR:** Could not initialize AI personality. Error: ${error.message}`, 'ai');
    }

    elements.modelSelect.dispatchEvent(new Event('change'));

    await setupTokenManager(state);
    
    await applySavedTheme(state);
    
    window.electronAPI.onRequestSessionHistory(() => {
        const themeData = {
            mode: state.currentTheme.mode,
            isLightActive: state.currentTheme.isLightActive,
            palette: state.currentTheme.palette,
        };
        window.electronAPI.sendHistoryData({
            history: state.conversationHistory,
            theme: themeData
        });
    });
    
    window.electronAPI.onIngestionProgress((data) => {
        if (elements.ingestionLog) {
            if (typeof data === 'string') {
                const logLine = document.createElement('p');
                logLine.textContent = data;
                elements.ingestionLog.appendChild(logLine);
                elements.ingestionLog.scrollTop = elements.ingestionLog.scrollHeight;
                
                if (data.includes('Ingestion Process Complete') || data.includes('Ingestion complete')) {

                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = 'Close';
                    closeBtn.className = 'btn-primary';
                    closeBtn.style.marginTop = '1rem';
                    closeBtn.onclick = () => {
                        elements.ingestionOverlay.classList.add('hidden');
                        elements.ingestionCloseContainer.innerHTML = '';
                    };
                    elements.ingestionCloseContainer.innerHTML = '';
                    elements.ingestionCloseContainer.appendChild(closeBtn);
                }
            } else if (data.error) {
                const errorLine = document.createElement('p');
                errorLine.style.color = 'var(--error-color)';
                errorLine.textContent = `ERROR: ${data.error}`;
                elements.ingestionLog.appendChild(errorLine);
                elements.ingestionLog.scrollTop = elements.ingestionLog.scrollHeight;
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Close';
                closeBtn.className = 'btn-primary';
                closeBtn.style.marginTop = '1rem';
                closeBtn.onclick = () => {
                    elements.ingestionOverlay.classList.add('hidden');
                    elements.ingestionCloseContainer.innerHTML = '';
                };
                elements.ingestionCloseContainer.innerHTML = '';
                elements.ingestionCloseContainer.appendChild(closeBtn);
            }
        }
    });
}