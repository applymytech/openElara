import { elements, updateSendCostDisplay } from './domHandlers.js';

export const DEFAULT_TOKEN_SETTINGS = {
    output: 0,
    knowledge: 2048,
    history: 2048,
    recentTurns: 5,
    systemReserve: 512,
    outputPercentage: 0.1,
    knowledgePercentage: 0.5,
    historyPercentage: 0.5
};

export function loadTokenSettings() {
    try {
        const savedSettings = localStorage.getItem('tokenManagerSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed.output && parsed.output !== DEFAULT_TOKEN_SETTINGS.output) {
                parsed.outputPercentage = null;
            }
            return { ...DEFAULT_TOKEN_SETTINGS, ...parsed };
        }
    } catch (error) {
        console.error('Failed to load token settings from localStorage:', error);
        localStorage.removeItem('tokenManagerSettings');
    }
    return { ...DEFAULT_TOKEN_SETTINGS };
}

function saveTokenSettings(settings) {
    try {
        localStorage.setItem('tokenManagerSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save token settings to localStorage:', error);
    }
}

export async function setupTokenManager(state, personalityTokenLimit = 0) {
    const selectedOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];

    if (!selectedOption || !selectedOption.dataset.contextWindow) {
        if (elements.totalUserBudget) elements.totalUserBudget.textContent = 'N/A';
        if (elements.modelContextWindow) elements.modelContextWindow.textContent = 'N/A';
        if (elements.systemReserve) elements.systemReserve.textContent = '...';
        if (elements.modelDisplayName) elements.modelDisplayName.textContent = 'Model Not Loaded';
        if (elements.modelCostDisplay) elements.modelCostDisplay.innerHTML = 'N/A'; 
        console.warn("[TokenManager] Setup failed: No model selected or context window is missing.");
        return;
    }

    const modelContextWindow = parseInt(selectedOption.dataset.contextWindow, 10);
    const modelReportedMaxOutput = parseInt(selectedOption.dataset.maxOutputLimit, 10); 
    
    state.modelCostPerToken = {
        input: parseFloat(selectedOption.dataset.costInput) || 0,
        output: parseFloat(selectedOption.dataset.costOutput) || 0,
    };

    elements.systemReserve.textContent = (state.tokenSettings.systemReserve || 0).toLocaleString();

    const availableInputBudget = modelContextWindow - state.tokenSettings.output - (state.tokenSettings.systemReserve || 0) - (personalityTokenLimit || 0);
    
    const KNOWLEDGE_MIN = 0;
    const HISTORY_MIN = 0;
    
    const currentKnowledgeValue = parseInt(state.tokenSettings.knowledge) || DEFAULT_TOKEN_SETTINGS.knowledge;
    const currentHistoryValue = parseInt(state.tokenSettings.history) || DEFAULT_TOKEN_SETTINGS.history;
    const currentInputAllocation = currentKnowledgeValue + currentHistoryValue;
    const dynamicOutputMax = Math.max(128, modelContextWindow - currentInputAllocation - (state.tokenSettings.systemReserve || 0) - (personalityTokenLimit || 0));
    const effectiveMaxOutput = Math.min(modelReportedMaxOutput, dynamicOutputMax);
    
    elements.outputLimitSlider.max = effectiveMaxOutput;
    elements.outputLimitInput.max = effectiveMaxOutput;
    
    let outputValue = state.tokenSettings.output;
    if (state.tokenSettings.outputPercentage !== null) {
        outputValue = Math.floor(effectiveMaxOutput * state.tokenSettings.outputPercentage);
    }

    outputValue = Math.max(256, Math.min(outputValue, effectiveMaxOutput));
    
    elements.outputLimitSlider.value = outputValue;
    elements.outputLimitInput.value = outputValue;
    state.tokenSettings.output = outputValue;

    let knowledgeValue = parseInt(state.tokenSettings.knowledge) || DEFAULT_TOKEN_SETTINGS.knowledge;
    let historyValue = parseInt(state.tokenSettings.history) || DEFAULT_TOKEN_SETTINGS.history;

  
    const knowledgeMax = availableInputBudget - historyValue;
    const historyMax = availableInputBudget - knowledgeValue; 

    elements.knowledgeRagSlider.max = Math.max(KNOWLEDGE_MIN, knowledgeMax);
    elements.knowledgeRagInput.max = Math.max(KNOWLEDGE_MIN, knowledgeMax);
    elements.historyRagSlider.max = Math.max(HISTORY_MIN, historyMax);
    elements.historyRagInput.max = Math.max(HISTORY_MIN, historyMax);

    knowledgeValue = Math.max(KNOWLEDGE_MIN, Math.min(knowledgeValue, knowledgeMax));
    historyValue = Math.max(HISTORY_MIN, Math.min(historyValue, historyMax));

    elements.knowledgeRagSlider.value = knowledgeValue;
    elements.knowledgeRagInput.value = knowledgeValue;
    elements.historyRagSlider.value = historyValue;
    elements.historyRagInput.value = historyValue;

    state.tokenSettings.knowledge = knowledgeValue;
    state.tokenSettings.history = historyValue;

    const totalAllocated = knowledgeValue + historyValue;
    const userBudget = availableInputBudget - totalAllocated;

    const budgetElement = elements.totalUserBudget;
    budgetElement.textContent = Math.max(0, userBudget).toLocaleString();
    budgetElement.style.color = 'var(--secondary-text-color)';
    elements.modelContextWindow.textContent = modelContextWindow.toLocaleString();
    elements.modelDisplayName.textContent = selectedOption.textContent;
    elements.modelCostDisplay.innerHTML = `$${(state.modelCostPerToken.input).toFixed(2)} / $${(state.modelCostPerToken.output).toFixed(2)}`;

    saveTokenSettings(state.tokenSettings);
    
    const userInputTokens = await window.electronAPI.countTokens(elements.chatInput.textContent);
    const attachmentTokens = state.attachedFile ? await window.electronAPI.countTokens(state.attachedFile.content) : 0;
    const canvasTokens = await window.electronAPI.countTokens(Object.values(state.contextCanvasFiles).join(''));
    updateSendCostDisplay(userInputTokens, attachmentTokens, canvasTokens, state.modelCostPerToken);
}