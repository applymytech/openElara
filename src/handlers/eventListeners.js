// src/handlers/eventlisteners.js

import { 
    showStatusMessage, 
    updateSendCostDisplay, 
    updateUserBudgetUI, 
    updateTokenDisplay,
    addMessageRaw
} from './domHandlers.js';
import { 
    setupTokenManager, 
    DEFAULT_TOKEN_SETTINGS 
} from './tokenManager.js';
import { 
    handleChatFormSubmit, 
    handleSlashCommand, 
    handlePersonalityManagement, 
    handleThemeManagement, 
    handleFileAttachments, 
    handleTokenSettingsChange, 
    handleObjectInsertion, 
    handlePromptManagement, 
    handleScrapySuite,
    handleMemoryManagement,
    handleKnowledgeManagement, 
    handleActionManagement,
    handleGenerativeModals,
    handleThinkingModal,
    handlePromptInsertionForGenModals
} from './appHandlers.js';
import { populateImageModelSelector, updateImageModelControls, populateAdvancedVideoModelSelector, updateAdvancedVideoControls } from './modelUtils.js';


export function setupEventListeners(state, elements) {
    window.state = state;

    // --- GLOBAL MODAL CLOSERS ---
    document.addEventListener('click', (event) => {
        const modal = event.target.closest('.modal');
        const modalContent = event.target.closest('.modal-content');

        if (modal && !modalContent) {
            modal.classList.add('hidden');
        }
    });

    // 2. Close modal when pressing Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const visibleModals = Array.from(document.querySelectorAll('.modal')).filter(m => !m.classList.contains('hidden'));
            if (visibleModals.length > 0) {
                visibleModals[visibleModals.length - 1].classList.add('hidden');
            }
        }
    });
    // --- END GLOBAL MODAL CLOSERS ---


    // Chat & Token Management
    elements.chatForm.addEventListener('submit', (event) => handleChatFormSubmit(event, state, elements));
    
    elements.chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && elements.ctrlEnterToggle.checked) {
            event.preventDefault();
            elements.chatForm.dispatchEvent(new Event('submit'));
        }
    });

    elements.chatInput.addEventListener('input', async () => {
        const userInput = elements.chatInput.textContent;
        const inputTokens = await window.electronAPI.countTokens(userInput);
        updateTokenDisplay(inputTokens);
        
        const selectedModelOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
        const modelCost = { 
            input: parseFloat(selectedModelOption?.dataset.costInput) || 0,
            output: parseFloat(selectedModelOption?.dataset.costOutput) || 0
        };

        updateSendCostDisplay(
            inputTokens, 
            state.attachedFile ? await window.electronAPI.countTokens(state.attachedFile.content) : 0, 
            await window.electronAPI.countTokens(Object.values(state.contextCanvasFiles).join('')), 
            modelCost
        );

        const MAX_INPUT_TOKENS = 20480;
        if (inputTokens > MAX_INPUT_TOKENS) {
            elements.inputTokenEstimate.style.color = 'red';
            elements.chatForm.querySelector('button[type="submit"]').disabled = true;
            showStatusMessage('Input exceeds token limit. Please reduce text or use the "Add to Canvas" feature.', 'error', 10000);
        } else {
            elements.inputTokenEstimate.style.color = '';
            elements.chatForm.querySelector('button[type="submit"]').disabled = false;
            if (elements.statusBar) elements.statusBar.classList.add('hidden');
        }
    });

    elements.chatInput.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('remove-object-btn')) {
            event.preventDefault();
            event.stopPropagation();
            
            const codeObject = target.closest('.code-object-container');
            if (codeObject && codeObject.parentNode) {
                codeObject.parentNode.removeChild(codeObject);
                console.log('Object removed via click handler');
                
                const brElements = elements.chatInput.querySelectorAll('br');
                if (brElements.length > 1) {
                    Array.from(brElements).slice(1).forEach(br => {
                        if (br.nextSibling && br.nextSibling.nodeType === Node.TEXT_NODE && !br.nextSibling.textContent.trim()) {
                            br.remove();
                        }
                    });
                }
                
                elements.chatInput.focus();
                showStatusMessage('Object removed.', 'success', 2000);
            }
        }
    });

    // Handle attachment removal
    elements.attachedFileDisplay?.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('remove-attachment-btn')) {
            event.preventDefault();
            event.stopPropagation();
            
            state.attachedFile = null;
            
            elements.attachedFileDisplay.innerHTML = '';
            elements.attachedFileDisplay.classList.add('hidden');
            
            const fileButtonsContainer = document.getElementById('file-buttons-container');
            if (fileButtonsContainer) {
                fileButtonsContainer.classList.add('hidden');
            }
            
            elements.chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            showStatusMessage('File attachment removed.', 'success', 2000);
        }
    });

    // Model and Personality Selection
    elements.modelSelect.addEventListener('change', async () => {
        window.electronAPI.setStoredValue('lastSelectedModel', elements.modelSelect.value);
        await setupTokenManager(state); 
        const modelsData = sessionStorage.getItem('llmSuiteModels');
        if (!modelsData) return;
        const models = JSON.parse(modelsData);

        const selectedModelId = elements.modelSelect.value;
        const selectedModel = models.find(m => m.modelId === selectedModelId); 
        
        if (selectedModel) {
            elements.modelContextWindow.textContent = selectedModel.contextWindow.toLocaleString();
            elements.modelDisplayName.textContent = selectedModel.displayName;
            updateUserBudgetUI(selectedModel.contextWindow, parseInt(elements.systemReserve.textContent.replace(/,/g, '')), state.tokenSettings);
            state.modelCostPerToken = { input: selectedModel.costInput, output: selectedModel.costOutput };
        }
        
        const userInput = elements.chatInput.textContent;
        const inputTokens = await window.electronAPI.countTokens(userInput);
        updateSendCostDisplay(
            inputTokens, 
            state.attachedFile ? await window.electronAPI.countTokens(state.attachedFile.content) : 0, 
            await window.electronAPI.countTokens(Object.values(state.contextCanvasFiles).join('')), 
            state.modelCostPerToken
        );
    });
    
    elements.personaSelect.addEventListener('change', async (event) => {
        state.currentPersona = event.target.value;
        window.electronAPI.setStoredValue('lastSelectedPersona', state.currentPersona);
        const selectedOption = event.target.options[event.target.selectedIndex];
        if (!selectedOption) return;

        elements.personalityDisplayName.textContent = selectedOption.textContent;
        const personalityTokenLimit = parseInt(selectedOption.dataset.tokenLimit, 10) || 0;

        try {
            const personalityText = selectedOption.dataset.text || '';
            const systemPromptText = await window.electronAPI.getSystemInstruction({
                userName: state.userName,
                personalityText: personalityText,
                outputTokenLimit: state.tokenSettings.output
            });
            const systemMessage = { role: 'system', content: systemPromptText };

            const systemIndex = state.conversationHistory.findIndex(msg => msg.role === 'system');
            if (systemIndex !== -1) {
                state.conversationHistory[systemIndex] = systemMessage;
            } else {
                state.conversationHistory.unshift(systemMessage);
            }

            const systemPromptTokens = await window.electronAPI.countTokens(systemPromptText);
            const safetyMargin = 128;
            state.tokenSettings.systemReserve = systemPromptTokens + safetyMargin;
        } catch (e) {
            console.error('[Persona Change] Failed to regenerate system prompt:', e);
        }

        setupTokenManager(state, personalityTokenLimit);
    });

    elements.showThinkingBtn?.addEventListener('click', () => {
        if (window.state) {
            handleThinkingModal.showThinking(window.state);
        } else {
            console.warn('[Thinking Button] State not available');
            showStatusMessage('No thinking process available to display.', 'info');
        }
    });

    elements.chatHistory.addEventListener('click', (event) => {
        if (event.target.classList.contains('thinking-link')) {
            event.preventDefault();
            handleThinkingModal.showThinking(window.state);
        }
    });

    // Setup close handlers for thinking modal
    elements.closeThinkingBtn?.addEventListener('click', () => handleThinkingModal.closeModal());



    // Token Sliders and Inputs
    elements.knowledgeRagSlider?.addEventListener('input', (e) => 
        handleTokenSettingsChange(e, 'knowledge', elements.knowledgeRagSlider, elements.knowledgeRagInput, state)
    );
    elements.knowledgeRagInput?.addEventListener('change', (e) => 
        handleTokenSettingsChange(e, 'knowledge', elements.knowledgeRagSlider, elements.knowledgeRagInput, state)
    );
    elements.historyRagSlider?.addEventListener('input', (e) => 
        handleTokenSettingsChange(e, 'history', elements.historyRagSlider, elements.historyRagInput, state)
    );
    elements.historyRagInput?.addEventListener('change', (e) => 
        handleTokenSettingsChange(e, 'history', elements.historyRagSlider, elements.historyRagInput, state)
    );
    
    elements.outputLimitSlider?.addEventListener('input', (e) => {
        if(elements.outputLimitInput) elements.outputLimitInput.value = e.target.value;
    });
    elements.outputLimitSlider?.addEventListener('change', (e) => 
        handleTokenSettingsChange(e, 'output', elements.outputLimitSlider, elements.outputLimitInput, state)
    );
    elements.outputLimitInput?.addEventListener('change', (e) => 
        handleTokenSettingsChange(e, 'output', elements.outputLimitSlider, elements.outputLimitInput, state)
    );

    // Reset Buttons
    elements.resetAllBtn?.addEventListener('click', () => {
        localStorage.removeItem('tokenManagerSettings');
        state.tokenSettings = { ...DEFAULT_TOKEN_SETTINGS };
        setupTokenManager(state);
        showStatusMessage('All token settings reset.', 'success');
    });
    
    elements.resetInputBtn?.addEventListener('click', () => {
        state.tokenSettings.knowledge = DEFAULT_TOKEN_SETTINGS.knowledge;
        state.tokenSettings.history = DEFAULT_TOKEN_SETTINGS.history;
        setupTokenManager(state);
        showStatusMessage('Input token settings reset.', 'success');
    });
    
    elements.resetOutputBtn?.addEventListener('click', () => {
        state.tokenSettings.output = DEFAULT_TOKEN_SETTINGS.output;
        state.tokenSettings.outputPercentage = null;
        setupTokenManager(state);
        showStatusMessage('Output token setting reset.', 'success');
    });
    
    elements.accountBtn?.addEventListener('click', () => window.electronAPI.loadAccountPage()); 
    
    // Personality Management
    elements.managePersonalitiesBtn?.addEventListener('click', () => handlePersonalityManagement.showManager());
    elements.closeManagePersonalitiesBtn?.addEventListener('click', () => handlePersonalityManagement.hideManager());
    elements.addPersonalityBtn?.addEventListener('click', () => handlePersonalityManagement.showAddModal());
    elements.cancelPersonalityBtn?.addEventListener('click', () => handlePersonalityManagement.hideAddEditModal());
    elements.savePersonalityBtn?.addEventListener('click', () => handlePersonalityManagement.savePersonality(state));
    elements.personalitiesList?.addEventListener('click', (event) => handlePersonalityManagement.handleListClick(event));

    elements.promptManagerBtn?.addEventListener('click', async () => {
        await window.electronAPI.openPromptManager();
    });
    elements.closeManagePromptsBtn?.addEventListener('click', () => handlePromptManagement.hideManager());
    elements.addPromptBtn?.addEventListener('click', () => handlePromptManagement.showAddModal());
    elements.cancelPromptBtn?.addEventListener('click', () => handlePromptManagement.hideAddEditModal());
    elements.savePromptBtn?.addEventListener('click', () => handlePromptManagement.savePrompt(state));
    elements.promptsList?.addEventListener('click', (event) => handlePromptManagement.handleListClick(event));
    
    // Prompt Type Selector
    elements.promptTypeSelect?.addEventListener('change', (e) => handlePromptManagement.switchPromptType(e.target.value));
    
    // Chat prompt tabs
    elements.tabChatFree?.addEventListener('click', () => handlePromptManagement.switchTab('chat-free'));
    elements.tabChatTemplate?.addEventListener('click', () => handlePromptManagement.switchTab('chat-template'));
    
    // Image prompt tabs
    elements.tabImageFree?.addEventListener('click', () => handlePromptManagement.switchTab('image-free'));
    elements.tabImageStructured?.addEventListener('click', () => handlePromptManagement.switchTab('image-structured'));
    
    // Video prompt tabs
    elements.tabVideoFree?.addEventListener('click', () => handlePromptManagement.switchTab('video-free'));
    elements.tabVideoStructured?.addEventListener('click', () => handlePromptManagement.switchTab('video-structured')); 

    // Action Manager
    elements.actionManagerBtn?.addEventListener('click', async () => {
        await window.electronAPI.openActionManager();
    });
    elements.closeManageActionsBtn?.addEventListener('click', () => handleActionManagement.hideManager());
    elements.addActionBtn?.addEventListener('click', () => handleActionManagement.showAddModal());
    elements.cancelActionBtn?.addEventListener('click', () => handleActionManagement.hideAddEditModal());
    elements.saveActionBtn?.addEventListener('click', () => handleActionManagement.saveAction(state));
    elements.actionsList?.addEventListener('click', (event) => handleActionManagement.handleListClick(event)); 

    // Theme Management Modal
    elements.themeBtn?.addEventListener('click', () => handleThemeManagement.showSettingsModal()); 
    elements.closeThemeSettingsBtn?.addEventListener('click', () => handleThemeManagement.hideSettingsModal());    
    
    // Theme Modal Buttons
    elements.themeToggleModalBtn?.addEventListener('click', () => handleThemeManagement.toggleTheme(state)); 
    elements.themeColorModalBtn?.addEventListener('click', () => handleThemeManagement.showColorPicker()); 
    elements.themeResetModalBtn?.addEventListener('click', () => handleThemeManagement.resetTheme(state)); 
    
    // Color Picker Modal
    elements.colorPickerCancelBtn?.addEventListener('click', () => handleThemeManagement.hideColorPicker());
    elements.colorPickerModal?.addEventListener('click', (event) => { 
        if (event.target === elements.colorPickerModal) handleThemeManagement.hideColorPicker(); 
    });
    elements.colorPickerConfirmBtn?.addEventListener('click', () => handleThemeManagement.generateTheme(state));
    elements.themeLogCloseBtn?.addEventListener('click', () => handleThemeManagement.hideColorPicker());
    
    // Power Knowledge 
    elements.slashCommandBtn?.addEventListener('click', async () => {
        await window.electronAPI.openPowerKnowledge();
    });

    // Object Creation Modal
    elements.createObjectBtn?.addEventListener('click', () => {
        elements.createObjectModal?.classList.remove('hidden');
        if (elements.objectInputTextarea) {
            elements.objectInputTextarea.value = '';
            elements.objectInputTextarea.focus();
        }
    });

    elements.insertObjectBtn?.addEventListener('click', () => handleObjectInsertion(elements)); 
    
    elements.cancelObjectBtn?.addEventListener('click', () => {
        elements.createObjectModal?.classList.add('hidden');
        if (elements.objectInputTextarea) elements.objectInputTextarea.value = '';
    });
    
    elements.objectInputTextarea?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleObjectInsertion(elements); 
        }
    });

    // File Attachments and Canvas
    elements.addToCanvasBtn?.addEventListener('click', () => handleFileAttachments.addToCanvas(state));
    elements.clearCanvasBtn?.addEventListener('click', () => handleFileAttachments.clearCanvas(state));
    elements.attachFileBtn?.addEventListener('click', () => handleFileAttachments.attachFile(state));
    elements.contextFilesList?.addEventListener('click', (event) => handleFileAttachments.handleCanvasFileRemove(event, state));
    
    elements.openOutputFolderBtn?.addEventListener('click', () => window.electronAPI.openOutputFolder());
    elements.openImagesFolderBtn?.addEventListener('click', () => window.electronAPI.openImagesOutputFolder());
    elements.openVideosFolderBtn?.addEventListener('click', () => window.electronAPI.openVideosOutputFolder());
    elements.openConversionsFolderBtn?.addEventListener('click', () => window.electronAPI.openConversionsOutputFolder());
    elements.openExaFolderBtn?.addEventListener('click', () => window.electronAPI.openExaOutputFolder());
    elements.openScrapyFolderBtn?.addEventListener('click', () => window.electronAPI.openScrapyOutputFolder());
    elements.clearAllOutputBtn?.addEventListener('click', () => handleFileAttachments.clearAllOutput());
    elements.openFileConverterBtn?.addEventListener('click', () => window.electronAPI.openFileConverter());

    elements.ingestFilesBtn?.addEventListener('click', () => handleFileAttachments.ingestFiles()); 
    elements.ingestFolderBtn?.addEventListener('click', () => handleFileAttachments.ingestFolder());
    elements.viewKnowledgeFilesBtn?.addEventListener('click', () => handleKnowledgeManagement.viewAndManageKnowledge(state)); // NEW Viewer Window
    elements.clearKnowledgeBtn?.addEventListener('click', () => handleFileAttachments.clearKnowledgeBase()); // Was part of app manager logic

    elements.viewHistoryBtn?.addEventListener('click', () => { 
        const themeData = {
            mode: state.currentTheme.mode,
            isLightActive: state.currentTheme.isLightActive,
            palette: state.currentTheme.palette,
        };

        window.electronAPI.openViewerWindow({ 
            id: 'session-history', 
            type: 'history', 
            themeData: themeData 
        });
    });
    elements.viewMemoriesBtn?.addEventListener('click', () => handleMemoryManagement.viewAndManageMemories(state));
    elements.clearHistoryBtn?.addEventListener('click', () => handleFileAttachments.clearChatHistory(state));
  

    // Prompt Manager Tabs
    elements.tabFreePrompt?.addEventListener('click', () => {
        elements.tabFreePrompt.classList.add('active');
        elements.tabTemplatePrompt.classList.remove('active');
        elements.freePromptContent.classList.remove('hidden');
        elements.templatePromptContent.classList.add('hidden');
    });
    elements.tabTemplatePrompt?.addEventListener('click', () => {
        elements.tabTemplatePrompt.classList.add('active');
        elements.tabFreePrompt.classList.remove('active');
        elements.templatePromptContent.classList.remove('hidden');
        elements.freePromptContent.classList.add('hidden');
    });

    // Action Manager Modal Clicks
    elements.addEditActionModal?.addEventListener('click', (event) => {
        if (event.target === elements.addEditActionModal) handleActionManagement.hideAddEditModal();
    });
    elements.actionStyle?.addEventListener('change', (event) => {
        if(elements.customStyleInput) {
            elements.customStyleInput.style.display = (event.target.value === 'custom') ? 'block' : 'none';
        }
    });

    // Scrapy Suite
    elements.powerScrapeBtn?.addEventListener('click', async () => {
        await window.electronAPI.openScrapyWindow();
    });
    elements.openScrapyWindowBtn?.addEventListener('click', () => window.electronAPI.openScrapyWindow());

    // Image Generation Listeners
    elements.imageAspectRatio?.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if(elements.imageWidth) elements.imageWidth.value = selectedOption.dataset.width;
        if(elements.imageHeight) elements.imageHeight.value = selectedOption.dataset.height;
    });
    elements.stepsSlider?.addEventListener('input', (e) => {
        if(elements.stepsValue) elements.stepsValue.textContent = e.target.value;
    });
    elements.guidanceScaleSlider?.addEventListener('input', (e) => {
        if(elements.guidanceScaleValue) elements.guidanceScaleValue.textContent = e.target.value;
    });
    elements.imageModelSelect?.addEventListener('change', updateImageModelControls);
    
    elements.imageGenCloseBtn?.addEventListener('click', () => elements.imageGenModal.classList.add('hidden'));
    elements.imageGenCancelBtn?.addEventListener('click', () => elements.imageGenModal.classList.add('hidden'));

    // Generative Buttons & Modals
    elements.generateSelfieBtn?.addEventListener('click', handleGenerativeModals.showSelfieModal); // Image Selfie
    elements.selfieGenCancelBtn?.addEventListener('click', handleGenerativeModals.hideSelfieModal);
    elements.selfieGenSubmitBtn?.addEventListener('click', () => handleGenerativeModals.executeSelfie(state, elements));
    
    // Simple Selfie Video
    elements.generateSelfieVideoBtn?.addEventListener('click', async () => {
        elements.videoGenModal?.classList.remove('hidden');
        const characterData = await window.electronAPI.getCharacterConstants();
        const characterName = characterData.name || 'AI';
        const btn = document.getElementById('use-default-video-prompt-btn');
        if (btn) btn.innerHTML = `✨ Use ${characterName} Template`;
    });
    elements.videoGenCancelBtn?.addEventListener('click', () => elements.videoGenModal?.classList.add('hidden'));
    elements.videoGenSubmitBtn?.addEventListener('click', () => handleGenerativeModals.executeSimpleSelfieVideo(state, elements)); 

    // Advanced Video Modal
    elements.generateAdvancedVideoBtn?.addEventListener('click', () => {
        window.electronAPI.openAdvancedVideoGenWindow();
    }); 
    elements.generateAdvancedVideoBtnSubmit?.addEventListener('click', () => handleGenerativeModals.executeAdvancedVideo(state, elements)); 
    
    elements.generateImageBtn?.addEventListener('click', async () => {
        window.electronAPI.openAdvancedImageGenWindow();
    });

    elements.openDeepaiStudioBtn?.addEventListener('click', async () => {
        window.electronAPI.openDeepaiStudioWindow();
    });

    elements.signContentBtn?.addEventListener('click', async () => {
        await window.electronAPI.openSigner();
    });

    
    elements.advancedVideoModelSelect?.addEventListener('change', (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const resolutionSelect = elements.advancedVideoResolution;
        const supportedResolutions = selectedOption.dataset.supportedResolutions?.split(',') || ['720p'];
        
        resolutionSelect.innerHTML = supportedResolutions.map(res => 
            `<option value="${res}">${res === '720p' ? 'HD (720p)' : 
              res === '1080p' ? 'Full HD (1080p)' : 
              res === '360p' ? 'SD (360p)' : res}</option>`
        ).join('');
        
        updateAdvancedVideoControls();
    });

    // Advanced Video Modal Controls
    elements.advancedVideoAspectRatios?.addEventListener('change', updateAdvancedVideoControls);
    elements.advancedVideoStepsSlider?.addEventListener('input', (e) => {
        if(elements.advancedVideoStepsValue) elements.advancedVideoStepsValue.textContent = e.target.value;
    });
    elements.advancedVideoGuidanceScaleSlider?.addEventListener('input', (e) => {
        if(elements.advancedVideoGuidanceScaleValue) elements.advancedVideoGuidanceScaleValue.textContent = e.target.value;
    });

    populateImageModelSelector();
    updateImageModelControls();
    
    populateAdvancedVideoModelSelector(); 
    updateAdvancedVideoControls();
    
    setupInsertTextObjectModal(state);
    setupUrlCounter();
    setupCollapsibleSidebar();
}

function setupUrlCounter() {
    const scrapyUrlInput = document.getElementById('scrapy-url-input');
    const urlCount = document.getElementById('urlCount');

    if (!scrapyUrlInput || !urlCount) return;

    const updateUrlCount = () => {
        const MAX_LINES = 64;
        const lines = scrapyUrlInput.value.split('\n').filter(line => line.trim().length > 0);
        
        let validLines = lines;
        if (lines.length > MAX_LINES) {
            validLines = lines.slice(0, MAX_LINES);
            scrapyUrlInput.value = validLines.join('\n');
        }

        urlCount.textContent = `(${validLines.length}/${MAX_LINES})`;
        urlCount.style.color = (validLines.length >= MAX_LINES) ? 'var(--error-color)' : 'var(--secondary-text-color)';
    };

    scrapyUrlInput.addEventListener('input', updateUrlCount);
    updateUrlCount();
}

function setupCollapsibleSidebar() {
    const collapsibleSections = document.querySelectorAll('.sidebar-section.collapsible');
    
    collapsibleSections.forEach(section => {
        const header = section.querySelector('.sidebar-section-header');
        const content = section.querySelector('.sidebar-section-content');
        const icon = section.querySelector('.collapse-icon');
        
        if (header && content && icon) {
            header.addEventListener('click', () => {
                const isCollapsed = section.classList.contains('collapsed');
                
                if (isCollapsed) {
                    section.classList.remove('collapsed');
                    content.style.display = 'block';
                    icon.textContent = '▼';
                } else {
                    section.classList.add('collapsed');
                    content.style.display = 'none';
                    icon.textContent = '▶';
                }
            });
        }
    });
}

// Setup Insert Text Object modal
function setupInsertTextObjectModal(state) {
    const insertBtn = document.getElementById('insert-text-object-btn');
    const modal = document.getElementById('insert-text-object-modal');
    const textInput = document.getElementById('text-object-input');
    const confirmBtn = document.getElementById('text-object-confirm-btn');
    const cancelBtn = document.getElementById('text-object-cancel-btn');
    const chatInput = document.getElementById('chat-input');

    if (!insertBtn || !modal || !textInput || !confirmBtn || !cancelBtn || !chatInput) {
        console.warn('[Insert Text Object] Some elements not found');
        return;
    }

    insertBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        textInput.value = '';
        textInput.focus();
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        textInput.value = '';
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'O') {
            e.preventDefault();
            if (modal.classList.contains('hidden')) {
                modal.classList.remove('hidden');
                textInput.focus();
            }
        }
        
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            textInput.value = '';
        }
    });

    confirmBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (!text) {
            alert('Please enter some text');
            return;
        }

        const textObject = document.createElement('div');
        textObject.className = 'inserted-object-container code-object-container';
        textObject.setAttribute('contenteditable', 'false');

        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.textContent = text;
        preElement.appendChild(codeElement);
        textObject.appendChild(preElement);

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '&times;';
        removeBtn.className = 'remove-object-btn';
        removeBtn.title = 'Remove object';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const parent = textObject.parentNode;
            if (parent) {
                const nextSibling = textObject.nextSibling;
                parent.removeChild(textObject);
                if (nextSibling && nextSibling.nodeName.toLowerCase() === 'br') {
                    nextSibling.remove();
                }
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
        textObject.appendChild(removeBtn);

        const label = document.createElement('span');
        label.className = 'object-label';
        label.textContent = 'Text';
        textObject.appendChild(label);

        const selection = window.getSelection();
        if (selection.rangeCount > 0 && chatInput.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(textObject);

            const newline = document.createElement('br');
            range.setStartAfter(textObject);
            range.insertNode(newline);

            range.setStartAfter(newline);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            chatInput.appendChild(textObject);
            const br = document.createElement('br');
            chatInput.appendChild(br);
            
            const range = document.createRange();
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        chatInput.dispatchEvent(new Event('input', { bubbles: true }));

        modal.classList.add('hidden');
        textInput.value = '';
        
        chatInput.focus();
    });
}