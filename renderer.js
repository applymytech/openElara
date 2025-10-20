import { elements, initializeElements, insertTextAtCaret } from './src/handlers/domHandlers.js';
import { setupEventListeners } from './src/handlers/eventListeners.js';
import { initializeApplication } from './src/handlers/initializers.js';
import { setElements } from './src/handlers/appHandlers.js';
import { loadTokenSettings } from './src/handlers/tokenManager.js';
import { populateImageModelSelector, populateAdvancedVideoModelSelector } from './src/handlers/modelUtils.js';
import { initQuickInsert } from './src/components/QuickInsert.js';

const state = {
    isInitialized: false,
    userName: sessionStorage.getItem('userName') || 'User',
    contextCanvasFiles: {},
    attachedFile: null,
    conversationHistory: [],
    currentPersona: '',
    modelCostPerToken: { input: 0, output: 0 },
    currentTask: '',
    tokenSettings: loadTokenSettings(),
    currentTheme: { mode: 'dark', palette: null },
    lastThinkingOutput: '',
    isSending: false,
    lastPayloadSent: null,
    selectedModel: ''
};

const handleImageGenResponse = (response) => {
    
    if (response.success && response.filePaths && response.filePaths.length > 0) {
        elements.imageGenLog.innerHTML = `<span style="color: var(--success-color);">✅ Generation Complete! ${response.filePaths.length} image(s) saved.</span>`;
        elements.openImageOutputBtn?.classList.remove('hidden');
    } else {
        const errorMessage = response.error || 'Unknown error during generation.';
        elements.imageGenLog.innerHTML = `<span style="color: var(--error-color);">❌ Generation Failed: ${errorMessage}</span>`;
    }
    elements.imageGenLog.classList.remove('hidden');
};

const handleIngestionProgress = (data) => {
       if (elements.appManagerModal) { 
        elements.appManagerModal.classList.add('hidden');
    }

    elements.ingestionOverlay.classList.remove('hidden');

    const logItem = document.createElement('p');
    logItem.textContent = data.message;
    elements.ingestionLog.appendChild(logItem);
    elements.ingestionLog.scrollTop = elements.ingestionLog.scrollHeight;

    if (data.status === 'completed' || data.status === 'failed') {
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close Ingestion Log';
        closeBtn.classList.add('btn-secondary');
        closeBtn.onclick = () => {
            elements.ingestionOverlay.classList.add('hidden');
            elements.ingestionLog.innerHTML = ''; 
            elements.ingestionCloseContainer.innerHTML = '';
            if (elements.appManagerModal) {
                 elements.appManagerModal.classList.remove('hidden');
            }
        };
        elements.ingestionCloseContainer.appendChild(closeBtn);
    }
};

let videoThinkingMessage = null; 
const handleVideoGenProgress = (data) => {
    if (videoThinkingMessage && data.status && data.message) {
        const contentDiv = videoThinkingMessage.querySelector('.message-content');
        if (contentDiv) {
            if (data.status === 'downloading' || data.status === 'processing' || data.status === 'submitted' || data.status === 'failed') {
                 contentDiv.textContent = data.message;
            }
        }
    }
};

window.setVideoThinkingMessage = (el) => {
    videoThinkingMessage = el;
};

const setupExaTabSwitching = () => {
    console.log('[Tab Switching] Starting setup...');
    
    if (!document.getElementById('tab-simple-query') || !document.getElementById('tab-advanced-research')) {
        console.log('[Tab Switching] Slash command tabs not found, skipping...');
        return;
    }

    const simpleQueryTab = document.getElementById('tab-simple-query');
    const advancedResearchTab = document.getElementById('tab-advanced-research');
    const simpleQueryPanel = document.getElementById('simple-query-tab');
    const advancedResearchPanel = document.getElementById('advanced-research-tab');

    const switchTab = (activeTab, inactiveTab, activePanel, inactivePanel) => {
        activeTab.classList.add('active');
        inactiveTab.classList.remove('active');
        activePanel.classList.add('active');
        inactivePanel.classList.remove('active');
    };

    simpleQueryTab.addEventListener('click', () => {
        console.log('[Tab Switching] Simple query tab clicked');
        switchTab(simpleQueryTab, advancedResearchTab, simpleQueryPanel, advancedResearchPanel);
    });

    advancedResearchTab.addEventListener('click', () => {
        console.log('[Tab Switching] Advanced research tab clicked');
        switchTab(advancedResearchTab, simpleQueryTab, advancedResearchPanel, simpleQueryPanel);
    });

    const tabImageT2i = document.getElementById('tab-image-t2i');
    const tabImageI2i = document.getElementById('tab-image-i2i');
    const imageUploadGroup = document.getElementById('image-upload-group');

    console.log('[Tab Switching] Image tabs found:', {
        t2i: !!tabImageT2i,
        i2i: !!tabImageI2i,
        uploadGroup: !!imageUploadGroup
    });

    if (tabImageT2i && tabImageI2i && imageUploadGroup) {
        tabImageT2i.addEventListener('click', () => {
            console.log('[Tab Switching] Image T2I tab clicked');
            tabImageT2i.classList.add('active');
            tabImageI2i.classList.remove('active');
            imageUploadGroup.style.display = 'none';
            populateImageModelSelector();
        });

        tabImageI2i.addEventListener('click', () => {
            console.log('[Tab Switching] Image I2I tab clicked');
            tabImageI2i.classList.add('active');
            tabImageT2i.classList.remove('active');
            imageUploadGroup.style.display = 'block';
            populateImageModelSelector();
        });
        console.log('[Tab Switching] Image tab listeners added successfully');
    } else {
        console.error('[Tab Switching] Failed to set up image tabs - missing elements');
    }

    const tabVideoT2v = document.getElementById('tab-video-t2v');
    const tabVideoI2v = document.getElementById('tab-video-i2v');
    const videoUploadGroup = document.getElementById('advanced-video-i2v-upload-group');

    console.log('[Tab Switching] Video tabs found:', {
        t2v: !!tabVideoT2v,
        i2v: !!tabVideoI2v,
        uploadGroup: !!videoUploadGroup
    });

    if (tabVideoT2v && tabVideoI2v && videoUploadGroup) {
        console.log('[Tab Switching] Setting up video tab click handlers...');
        
        tabVideoT2v.addEventListener('click', (e) => {
            console.log('[Tab Switching] Video T2V tab clicked - event object:', e);
            e.preventDefault();
            e.stopPropagation();
            tabVideoT2v.classList.add('active');
            tabVideoI2v.classList.remove('active');
            videoUploadGroup.style.display = 'none';
            populateAdvancedVideoModelSelector();
            console.log('[Tab Switching] T2V activated, upload group hidden');
        });

        tabVideoI2v.addEventListener('click', (e) => {
            console.log('[Tab Switching] Video I2V tab clicked - event object:', e);
            e.preventDefault();
            e.stopPropagation();
            tabVideoI2v.classList.add('active');
            tabVideoT2v.classList.remove('active');
            videoUploadGroup.style.display = 'block';
            populateAdvancedVideoModelSelector(); 
            console.log('[Tab Switching] I2V activated, upload group shown');
        });
        
        console.log('[Tab Switching] Video tab listeners added successfully');
    } else {
        console.error('[Tab Switching] Failed to set up video tabs - missing elements');
    }
    
    console.log('[Tab Switching] Setup complete');
};

async function populateActionStyles() {
    if (!window.electronAPI) return;
    try {
        const defaultActions = await window.electronAPI.getDefaultActions();
        const actionStyleSelect = document.getElementById('action-style');
        if (!actionStyleSelect) return;

        const customOption = actionStyleSelect.querySelector('option[value="custom"]');
        actionStyleSelect.innerHTML = '';

        const styleMap = {};
        defaultActions.forEach(action => {
            if (action.style && !styleMap[action.style]) {
                styleMap[action.style] = action.name; 
            }
        });
        
        for (const styleValue in styleMap) {
            const option = document.createElement('option');
            option.value = styleValue;
            option.textContent = styleMap[styleValue]; 
            actionStyleSelect.appendChild(option);
        }

        if (customOption) {
            actionStyleSelect.appendChild(customOption);
        } else {
            const custom = document.createElement('option');
            custom.value = 'custom';
            custom.textContent = 'Custom (Input Below)';
            actionStyleSelect.appendChild(custom);
        }

    } catch (error) {
        console.error("Failed to populate action styles:", error);
    }
}

window.addMessageToHistory = (role, content, thinking) => {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    try {
        const suspect = /(?:Ã.|Â.|ð|�)/;
        if (typeof content === 'string' && suspect.test(content)) {
            content = decodeURIComponent(escape(content));
        }
    } catch {}

    const cleanContent = DOMPurify.sanitize(marked.parse(content || ''));

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${role}-message`);
    messageDiv.innerHTML = `<span class="message-content">${cleanContent}</span>`;
    
    if (thinking && thinking.length > 0) {
        state.lastThinkingOutput = thinking;
          } else {
        state.lastThinkingOutput = '';
    }

    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    chatHistory.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
};

const handleExaResultFromTool = async (payload) => {
    const { task, query, result } = payload;
    
    console.log(`[Renderer] Received Exa result from Power Knowledge: task=${task}, query=${query}`);
    
    try {
        let outputMessage = '';
        const sourceUrls = result.sourceUrls || [];
        
        if (task === 'search' || task === 'similar') {
            const results = result.results;
            if (results && results.length > 0) {
                outputMessage = `**Found ${results.length} links for "${query}"**\n`;
                results.forEach((item, index) => {
                    const scoreText = item.score ? ` (Score: ${item.score.toFixed(3)})` : ''; 
                    outputMessage += `${index + 1}. **[${item.title}](${item.url})**${scoreText}\n`;
                });
            } else {
                outputMessage = "No links found for that query.";
            }
        } else if (task === 'crawl' || task === 'answer' || task === 'research') {
            const resultText = result.answer; 
            if (resultText && resultText.trim()) {
                const taskLabel = task === 'research' ? 'Research' : task.toUpperCase();
                outputMessage = `**Exa.ai ${taskLabel} Result:**\n${resultText}`;
                if (sourceUrls.length > 0) {
                    outputMessage += `\n\n*Sources:* ${sourceUrls.join(', ')}`;
                }
            } else {
                outputMessage = `Could not retrieve any content for the task: ${query}`;
            }
        }
        
        if (outputMessage) {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const safeQuery = query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
                const filename = `${task}_${safeQuery}_${timestamp}.md`;
                
                let fileContent = `# Exa.ai ${task.toUpperCase()} Result\n\n`;
                fileContent += `**Query:** ${query}\n\n`;
                fileContent += `**Timestamp:** ${new Date().toLocaleString()}\n\n`;
                fileContent += `---\n\n`;
                
                if (task === 'search' || task === 'similar') {
                    const results = result.results;
                    if (results && results.length > 0) {
                        fileContent += `## Results (${results.length} found)\n\n`;
                        results.forEach((item, index) => {
                            const scoreText = item.score ? ` (Score: ${item.score.toFixed(3)})` : '';
                            fileContent += `${index + 1}. **${item.title}**${scoreText}\n`;
                            fileContent += `   URL: ${item.url}\n`;
                            if (item.highlights && item.highlights.length > 0) {
                                fileContent += `   Highlights: ${item.highlights.join(' ... ')}\n`;
                            }
                            fileContent += `\n`;
                        });
                    }
                } else if (task === 'crawl' || task === 'answer' || task === 'research') {
                    fileContent += `## Content\n\n${result.answer}\n\n`;
                    if (sourceUrls.length > 0) {
                        fileContent += `## Sources\n\n`;
                        sourceUrls.forEach((url, index) => {
                            fileContent += `${index + 1}. ${url}\n`;
                        });
                    }
                }
                
                console.log(`[Renderer] Attempting to save file: ${filename} to exa folder`);
                
                const saveResult = await window.electronAPI.saveFile({
                    content: fileContent,
                    filename: filename,
                    targetDir: 'exa'
                });
                
                if (saveResult.success) {
                    console.log(`[Renderer] File saved successfully: ${saveResult.filePath}`);
                    outputMessage += `\n\n*Results saved to: Output/exa/${filename}*`;
                } else {
                    console.error(`[Renderer] Failed to save file: ${saveResult.error}`);
                    outputMessage += `\n\n*⚠️ File save failed: ${saveResult.error}*`;
                }
            } catch (saveError) {
                console.error('[Renderer] Exception during file save:', saveError);
                outputMessage += `\n\n*⚠️ File save error: ${saveError.message}*`;
            }
            
            const { addMessage } = await import('./src/handlers/domHandlers.js');
            
            addMessage(outputMessage, 'ai');
            
            state.conversationHistory.push({ role: 'user', content: `*Running command: /${task}...\nQuery: "${query}"*` });
            state.conversationHistory.push({ role: 'assistant', content: outputMessage });
            
            const sanitizeHistoryForRag = (history) => {
                return history.map(msg => {
                    const sanitized = { ...msg };
                    if (sanitized.content === null || sanitized.content === undefined) {
                        sanitized.content = '';
                    } else if (typeof sanitized.content !== 'string') {
                        sanitized.content = JSON.stringify(sanitized.content);
                    }
                    if (sanitized.thinking !== undefined && typeof sanitized.thinking !== 'string') {
                        sanitized.thinking = String(sanitized.thinking);
                    }
                    return sanitized;
                });
            };
            
            const lastUserMessage = state.conversationHistory[state.conversationHistory.length - 2];
            const lastAssistantMessage = state.conversationHistory[state.conversationHistory.length - 1];
            
            if (lastUserMessage && lastAssistantMessage) {
                const historyForTurn = sanitizeHistoryForRag([lastUserMessage, lastAssistantMessage]);
                const activeCharacterName = await window.electronAPI.getActiveCharacterName();
                await window.electronAPI.saveChatTurnToRag({
                    id: `exa-tool-${Date.now()}`,
                    timestamp: Date.now(),
                    history: historyForTurn,
                    persona: activeCharacterName
                });
                console.log('[Renderer] Exa result saved to RAG');
            }
        }
        
    } catch (error) {
        console.error('[Renderer] Error handling Exa result from tool:', error);
    }
};

window.handleExaTaskResponse = async (result, thinkingMessageElement) => {
    if (thinkingMessageElement) {
        thinkingMessageElement.remove();
    }
    
    if (result.success) {
        let content = '';
        
        if (result.answer) {
            content = result.answer; 
        } else if (result.results && result.results.length > 0) {
            content = `**Found ${result.results.length} results from Exa.ai:**\n\n`;
            content += result.results.map((r, i) => 
                `${i + 1}. **[${r.title}]**(${r.url}) - ${r.highlights?.[0] || r.snippet}`
            ).join('\n');
            content += '\n\n***Note:** Use the "Save to File" option in Power Knowledge for better formatting and full content saving.*';
        } else {
            content = "Web task completed successfully but returned no relevant data/answer.";
        }
        
        window.addMessageToHistory('ai', content, result.thinking);
        state.conversationHistory.push({ role: 'assistant', content: content });
        
    } else {
        const errorContent = `**Web Task Failed:** ${result.error || 'An unknown error occurred.'}`;
        window.addMessageToHistory('ai', errorContent);
    }
    state.isSending = false;
   };


window.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('chat-container')) {
        console.log('[Renderer] Not in main app view. Halting initialization.');
        return;
    }
    
    if (state.isInitialized) return;
    state.isInitialized = true;

    console.log('[Renderer] Starting initialization sequence...');

    if (!window.electronAPI) {
        console.error("FATAL: The 'electronAPI' object is not available.");
        document.body.innerHTML = '<h1>FATAL ERROR: Could not connect to backend. Please restart the application.</h1>';
        return;
    }

    window.state = state;

    initializeElements();

    // Provide the freshly-initialized DOM elements to appHandlers.
    // Some handler functions rely on a module-level `elements` variable inside appHandlers,
    // so we must set it here to ensure UI updates (e.g. attached-file-display) work.
    try {
        setElements(elements);
    } catch (e) {
        console.warn('Failed to call setElements on appHandlers:', e);
    }

    await initializeApplication(state);

    setupEventListeners(state, elements);

    setupExaTabSwitching();
    
    await populateActionStyles();

    initQuickInsert();
    console.log('[Renderer] Quick Insert initialized');

    window.electronAPI.onImageGenCompleted(handleImageGenResponse);
    window.electronAPI.onIngestionProgress(handleIngestionProgress);
    
    window.electronAPI.onVideoGenProgress(handleVideoGenProgress);
    
    window.electronAPI.onExaResultFromTool(handleExaResultFromTool);
    
    window.electronAPI.onRefreshModelSelector(async () => {
        console.log('[Renderer] Refreshing model selector due to API changes');
        try {
            const { initializeModelSelector } = await import('./src/handlers/initializers.js');
            await initializeModelSelector(state);
            console.log('[Renderer] Model selector refreshed successfully');
        } catch (error) {
            console.error('[Renderer] Failed to refresh model selector:', error);
        }
    });

    console.log('[Renderer] Initialization complete');
});
