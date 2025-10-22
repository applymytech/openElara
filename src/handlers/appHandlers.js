import { addMessage, addMessageRaw, showStatusMessage, showConfirmationModal, updateCanvasDisplay } from './domHandlers.js';

// --- RAG SANITIZATION HELPER ---
function sanitizeHistoryForRag(history) {
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
}

let elements;
export function setElements(el) {
    elements = el;
}
async function executeApiCall(payload, state, elements) {
    const thinkingMessage = addMessage('', 'ai');
    thinkingMessage.classList.add('thinking-bubble');
    try {
        const result = await window.electronAPI.getairesponse(payload);
        thinkingMessage.remove();
        console.log('[DEBUG] Received from backend:', result);
        if (result.error) {
            addMessage(`**Error:**
${result.error}`, 'ai');
        } else {
            if (result.answer && result.answer.trim()) {
                state.lastThinkingOutput = result.thinking || '';
                               addMessage(result.answer, 'ai', null, false);
                state.conversationHistory.push({
                    role: 'assistant',
                    content: result.answer,
                    thinking: state.lastThinkingOutput
                });
                sessionStorage.setItem('conversationHistory', JSON.stringify(state.conversationHistory));
                const lastUserMessage = state.conversationHistory[state.conversationHistory.length - 2];
                const lastAssistantMessage = state.conversationHistory[state.conversationHistory.length - 1];
                if (lastUserMessage && lastAssistantMessage) {
                    const historyForTurn = sanitizeHistoryForRag([lastUserMessage, lastAssistantMessage]);
                    const activeCharacterName = await window.electronAPI.getActiveCharacterName();
                    await window.electronAPI.saveChatTurnToRag({
                        id: `turn-${Date.now()}`, 
                        timestamp: Date.now(),    
                        history: historyForTurn,   
                        persona: activeCharacterName
                    });
                }
            } else {
                addMessage("The AI returned an incomplete or empty response.", 'ai');
            }
        }
    } catch (error) {
        thinkingMessage.remove();
        addMessage(`**A critical error occurred:**
${error.message}`, 'ai');
    } finally {
        resetSendButton(state, elements);
        if (state.attachedFile) {
            state.attachedFile = null;
            if (elements.attachedFileDisplay) {
                elements.attachedFileDisplay.innerHTML = '';
                elements.attachedFileDisplay.classList.add('hidden');
                const fileButtonsContainer = document.getElementById('file-buttons-container');
                if (fileButtonsContainer && Object.keys(state.contextCanvasFiles).length === 0) {
                    fileButtonsContainer.classList.add('hidden');
                }
            }
        }
        elements.chatInput.focus();
    }
}
function resetSendButton(state, elements) {
    const sendButton = elements.chatForm.querySelector('button[type="submit"]');
    if (sendButton) {
        state.isSending = false;
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
        sendButton.classList.remove('sending');
    }
}
export const handleChatFormSubmit = async (event, state, elements) => {
    event.preventDefault();
    const sendButton = elements.chatForm.querySelector('button[type="submit"]');
    if (state.isSending) return;
    const userMessageRaw = elements.chatInput.innerText.replace(/\u00A0/g, ' ').trim();
    const rawInputHtml = elements.chatInput.innerHTML.trim();
    
    const containsStructuredObject = /code-object-container|action-object-container|prompt-object-container|inserted-object-container|insertable-object|modifier-object-container/.test(rawInputHtml);
    
    if (!userMessageRaw && !state.attachedFile) {
         return;
    }
    state.isSending = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';
    if (containsStructuredObject) {
        addMessageRaw(rawInputHtml, 'user', state.attachedFile?.filename);
    } else {
        addMessage(userMessageRaw, 'user', state.attachedFile?.filename);
    }
    const container = document.createElement('div');
    container.innerHTML = rawInputHtml;
    const promptBlocks = Array.from(container.querySelectorAll('.prompt-object-container pre code')).map(n => n.textContent || '');

    container.querySelectorAll('.prompt-object-container').forEach(node => node.remove());

    const fence = (txt) => `\`\`\`\n${txt}\n\`\`\``;

    function buildInlineXmlFromNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.nodeValue || '';
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        const el = node;
        if (el.classList?.contains('action-object-container')) {
            const code = el.querySelector('pre code');
            const content = code ? code.textContent || '' : '';
            return `<action>${fence(content)}</action>`;
        }
        if (el.classList?.contains('code-object-container')) {
            const code = el.querySelector('pre code');
            const content = code ? code.textContent || '' : '';
            return `<object>${fence(content)}</object>`;
        }
        if (el.classList?.contains('modifier-object-container')) {
            const code = el.querySelector('pre code');
            const content = code ? code.textContent || '' : '';
            return `<modifier>${fence(content)}</modifier>`;
        }
        if (el.tagName === 'BR') return '\n';
        let acc = '';
        el.childNodes.forEach(child => { acc += buildInlineXmlFromNode(child); });
        return acc;
    }
    let bodyXml = '';
    container.childNodes.forEach(n => { bodyXml += buildInlineXmlFromNode(n); });

    let modifiersXml = '';
    try {
        const rawMods = localStorage.getItem('trailingModifiers') || '';
        const mods = rawMods.split('\n').map(s => s.trim()).filter(Boolean);
        if (mods.length) {
            modifiersXml = `\n<modifiers>\n${mods.map(m => `<modifier>${m}</modifier>`).join('\n')}\n</modifiers>`;
        }
    } catch (_) { /* ignore */ }

    const xmlWrapped = [`<userMessage>`,
        promptBlocks.length ? `${promptBlocks.map(t => `<prompt>${fence(t)}</prompt>`).join('\n')}` : '',
        bodyXml.trim() ? `${bodyXml}` : `${userMessageRaw}`,
        modifiersXml,
        `</userMessage>`
    ].filter(Boolean).join('\n');
    state.conversationHistory.push({ role: 'user', content: state.attachedFile ? `--- ATTACHED FILE: ${state.attachedFile.filename} ---\n${state.attachedFile.content}\n--- END ATTACHED FILE ---\n\n${xmlWrapped}` : xmlWrapped });
    elements.chatInput.innerHTML = '';
    const selectedModelOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
    const payload = {
        history: state.conversationHistory,
        userName: state.userName,
        mode: await window.electronAPI.getActiveCharacterName(),
        modelConfig: {
            modelId: selectedModelOption.value,
            provider: selectedModelOption.dataset.provider,
            contextWindow: parseInt(selectedModelOption.dataset.contextWindow, 10),
            maxOutputLimit: parseInt(selectedModelOption.dataset.maxOutputLimit, 10),
            costInput: parseFloat(selectedModelOption.dataset.costInput),
            costOutput: parseFloat(selectedModelOption.dataset.costOutput),
        },
        temperature: 0.7,
        historyTokenLimit: state.tokenSettings.history,
        knowledgeTokenLimit: state.tokenSettings.knowledge,
        outputReservation: state.tokenSettings.output,
        recentTurnsCount: state.tokenSettings.recentTurns || 5,
        contextCanvasFiles: state.contextCanvasFiles,
        attachedFileContent: state.attachedFile ? state.attachedFile.content : null,
    };
    state.lastPayloadSent = payload;
    await executeApiCall(payload, state, elements);
};

// --- Simple Selfie Video Execution ---
async function executeSimpleSelfieVideo(state, elements) {
    const userSuggestion = elements.videoPromptInput.value.trim();
    const customAttire = elements.attirePromptInputVideo?.value.trim() || '';
    const characterData = await window.electronAPI.getCharacterConstants();
    const characterName = characterData.name || 'AI';
    
    elements.videoGenModal?.classList.add('hidden');
    const thinkingMessage = addMessage(`${characterName} is preparing your Simple Selfie Video...`, 'ai');
    thinkingMessage.classList.add('thinking-bubble');
    if (window.setVideoThinkingMessage) {
        window.setVideoThinkingMessage(thinkingMessage);
    }
    const selectedModelOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
    if (!selectedModelOption || !selectedModelOption.value) {
         showStatusMessage('No language model selected for prompt generation.', 'error');
         thinkingMessage.remove();
         return;
    }
    const chatModelConfig = {
        modelId: selectedModelOption.value,
        provider: selectedModelOption.dataset.provider,
    };
    const llmSuggestion = userSuggestion || 'a general scene'; 
    addMessage(`*Requesting ${characterName} selfie video scene: "${userSuggestion}"*`, 'user');
    try {
        // 1. Ask LLM to generate a rich scene prompt
        const sceneResult = await window.electronAPI.generateVideoPrompt({ 
            history: state.conversationHistory,
            modelConfig: chatModelConfig,
            userSuggestion: llmSuggestion,
            outputReservation: state.tokenSettings.output,
            historyTokenLimit: state.tokenSettings.history,
            knowledgeTokenLimit: state.tokenSettings.knowledge,
            recentTurnsCount: state.tokenSettings.recentTurns || 5,
        });
        
        if (sceneResult.error === 'SCENE_PROMPT_FAILED') {
            addMessage(`**Video Scene Generation Failed**\n\n${sceneResult.message}\n\n${sceneResult.suggestion}`, 'ai');
            return;
        }
        
        if (sceneResult.error || !sceneResult.answer || sceneResult.answer.trim().length < 10) {
            throw new Error(sceneResult.error || "AI failed to generate a descriptive scene.");
        }
        
        if (sceneResult.thinking) {
            state.lastThinkingOutput = sceneResult.thinking;
        }
        
        const finalPromptForGeneration = sceneResult.answer;
        thinkingMessage.textContent = '🎬 Creating your video... This might take a few minutes, but feel free to continue chatting in the meantime!';
        // 2. Call the stable video API endpoint
        const videoResult = await window.electronAPI.generateVideo({ 
            scenePrompt: finalPromptForGeneration,
            customAttire: customAttire,
            isSelfie: true, 
            seed: 0,
            aspect_ratio: '16:9'
        });
        if (!videoResult || !videoResult.success) {
            throw new Error(videoResult?.error || "Video generation failed.");
        }
        console.log('[Selfie Video] Generation result:', videoResult);
        console.log('[Selfie Video] Video path:', videoResult.filePath);
        
        const videoPath = videoResult.filePath;
        const ext = videoPath.toLowerCase().split('.').pop();
        if (!['mp4', 'mov', 'webm', 'avi'].includes(ext)) {
            console.error('[Selfie Video] Invalid file extension:', ext);
            throw new Error(`Invalid video file format: .${ext}`);
        }
        
        console.log('[Selfie Video] Waiting for file system to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[Selfie Video] Converting file path to src...');
        
    // 3. Display video in chat and show output button
    const videoElement = document.createElement('video');
        const videoSrc = await window.electronAPI.convertFileSrc(videoPath);
        console.log('[Selfie Video] Converted src:', videoSrc);
        
        videoElement.src = videoSrc;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = false;
        videoElement.style.maxWidth = '100%';
        videoElement.style.borderRadius = '10px';
        videoElement.onerror = function() {
            console.error('[Selfie Video] Video failed to load:', this.src);
            console.error('[Selfie Video] Error code:', this.error ? this.error.code : 'unknown');
        };
        videoElement.onloadeddata = function() {
            console.log('[Selfie Video] Video loaded successfully');
        };
        
    console.log('[Selfie Video] Video element HTML:', videoElement.outerHTML);
    const hiddenSceneDiv = `<div style="display:none">Scene Prompt: ${finalPromptForGeneration}</div>`;
    const assistantContentVideo = `${hiddenSceneDiv}${videoElement.outerHTML}`;
    const messageElement = addMessage(assistantContentVideo, 'ai', null, true);
        console.log('[Selfie Video] Message element:', messageElement);
        
        state.conversationHistory.push({
            role: 'assistant',
            content: assistantContentVideo,
            isVideo: true,
            videoPath: videoPath,
            timestamp: new Date().toISOString()
        });
        sessionStorage.setItem('conversationHistory', JSON.stringify(state.conversationHistory));
        const lastUserMsgSV = state.conversationHistory[state.conversationHistory.length - 2];
        const lastAiMsgSV = state.conversationHistory[state.conversationHistory.length - 1];
        if (lastUserMsgSV && lastAiMsgSV) {
            const historyForTurn = sanitizeHistoryForRag([lastUserMsgSV, lastAiMsgSV]);
            const activeCharacterName = await window.electronAPI.getActiveCharacterName();
            await window.electronAPI.saveChatTurnToRag({
                id: `selfie-video-${Date.now()}`,
                timestamp: Date.now(),
                history: historyForTurn,
                persona: activeCharacterName
            });
        }
        
        setTimeout(() => {
            const insertedVideo = messageElement.querySelector('video');
            if (insertedVideo) {
                insertedVideo.addEventListener('loadedmetadata', function() {
                    const hasAudio = this.mozHasAudio || 
                                    Boolean(this.webkitAudioDecodedByteCount) || 
                                    Boolean(this.audioTracks && this.audioTracks.length);
                    
                    if (hasAudio) {
                        this.addEventListener('volumechange', function() {
                            if (this.muted) {
                                this.pause();
                            }
                        });
                    }
                });
            }
        }, 100);
        
        elements.openSelfieVideoOutputBtn?.classList.remove('hidden');
    } catch (error) {
        let errorMsg = '';
        if (error && typeof error === 'object') {
            if (error.message) {
                errorMsg = String(error.message);
            } else {
                try {
                    errorMsg = JSON.stringify(error);
                } catch {
                    errorMsg = String(error);
                }
            }
        } else {
            errorMsg = String(error);
        }
        addMessage(`**Simple Selfie Video Failed:**\n${errorMsg}`, 'ai');
    } finally {
        if (window.setVideoThinkingMessage) {
             window.setVideoThinkingMessage(null);
        }
        thinkingMessage.remove();
        elements.videoPromptInput.value = '';
        elements.attirePromptInputVideo.value = '';
    }
}
// --- Advanced Video Execution ---
export async function executeAdvancedVideo(state, elements) {
    const log = elements.advancedVideoGenLog;
    const submitBtn = elements.generateAdvancedVideoBtnSubmit;
    log.classList.remove('hidden');
    log.textContent = 'Gathering Advanced Video settings...';
    submitBtn.disabled = true;
    elements.openVideoOutputBtn?.classList.add('hidden');

    const isI2VActive = elements.tabVideoI2v.classList.contains('active');
    const modelSelect = elements.advancedVideoModelSelect;
    const selectedOption = modelSelect.options[modelSelect.selectedIndex];

    if (isI2VActive && selectedOption.dataset.i2v !== 'true') {
        log.textContent = '❌ Selected model does not support Image-to-Video generation';
        submitBtn.disabled = false;
        return;
    }
    
    if (!elements.advancedVideoResolution) {
        log.textContent = '❌ Error: Resolution element not found. Please refresh the page.';
        submitBtn.disabled = false;
        return;
    }
    const resolution = elements.advancedVideoResolution.value;
    const supportedResolutions = selectedOption.dataset.supportedResolutions?.split(',') || ['720p'];
    if (!supportedResolutions.includes(resolution)) {
        log.textContent = `❌ Selected model does not support ${resolution} resolution. Supported: ${supportedResolutions.join(', ')}`;
        submitBtn.disabled = false;
        return;
    }
    
    const payload = {
        prompt: elements.advancedVideoPrompt.value.trim(),
        modelId: selectedOption.value,
        aspect_ratio: elements.advancedVideoAspectRatio.value,
        resolution: resolution,
        duration: parseInt(elements.advancedVideoFrames.value, 10),
        negative_prompt: elements.advancedVideoNegativePrompt.value.trim() || undefined,
        customPayload: elements.advancedVideoFreePayload.value.trim(),
        i2vImageUrl: null,
    };

    if (isNaN(payload.duration) || payload.duration < 1 || payload.duration > 32) {
        showStatusMessage('Duration must be between 1 and 32', 'error');
        log.textContent = '❌ Invalid duration value. Must be between 1 and 32.';
        submitBtn.disabled = false;
        return;
    }

    const validAspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
    if (!validAspectRatios.includes(payload.aspect_ratio)) {
        showStatusMessage('Invalid aspect ratio', 'error');
        log.textContent = `❌ Invalid aspect ratio. Supported: ${validAspectRatios.join(', ')}`;
        submitBtn.disabled = false;
        return;
    }

    if (payload.customPayload) {
        try {
            JSON.parse(payload.customPayload);
        } catch (e) {
            showStatusMessage('Invalid custom payload JSON', 'error');
            log.textContent = '❌ Custom payload must be valid JSON.';
            submitBtn.disabled = false;
            return;
        }
    }

    if (selectedOption.dataset.provider === 'custom') {
        const customModelId = selectedOption.value.replace('custom:', '');
        payload.customModel = {
            id: customModelId,
            name: selectedOption.textContent.replace('✨ ', ''),
            endpoint: selectedOption.dataset.customEndpoint,
            customPayload: selectedOption.dataset.customPayload ? JSON.parse(selectedOption.dataset.customPayload) : null
        };
        console.log('Using custom video model:', payload.customModel);
    }

    if (!payload.prompt) {
        showStatusMessage('Video prompt is required.', 'error');
        log.textContent = '❌ Generation Failed: Video prompt is required.';
        submitBtn.disabled = false;
        return;
    }
    try {
        let executionMessage = `Requesting Advanced Video (${isI2VActive ? 'I2V' : 'T2V'}) via ${payload.modelId}.`;

        if (isI2VActive) {
            const imageFile = elements.advancedVideoImageUpload.files[0];
            if (!imageFile) {
                throw new Error("Image-to-Video mode requires an uploaded image file.");
            }
            log.textContent = 'Uploading and processing image...';
            const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
            payload.i2vImageUrl = await readFileAsDataURL(imageFile);
            executionMessage = `Requesting Advanced Video (I2V) via ${payload.modelId} using image: ${imageFile.name}.`;
        }
        addMessage(`*${executionMessage}*`, 'user');
        
        log.textContent = `🎬 Generating video... This might take a few minutes, but you can keep chatting!`;

        const thinkingMessage = addMessage('', 'ai');
        thinkingMessage.classList.add('thinking-bubble');
        if (window.setVideoThinkingMessage) {
            window.setVideoThinkingMessage(thinkingMessage);
        }
        const videoResult = await window.electronAPI.generateAdvancedVideo(payload); 

        thinkingMessage.remove();
        if (window.setVideoThinkingMessage) {
            window.setVideoThinkingMessage(null);
        }
        if (!videoResult || !videoResult.success) {
            throw new Error(videoResult?.error || "Advanced Video generation failed.");
        }
        
        console.log('[Advanced Video] Generation result:', videoResult);
        console.log('[Advanced Video] Video path:', videoResult.filePath);
        
        const videoPath = videoResult.filePath;
        const ext = videoPath.toLowerCase().split('.').pop();
        if (!['mp4', 'mov', 'webm', 'avi'].includes(ext)) {
            console.error('[Advanced Video] Invalid file extension:', ext);
            throw new Error(`Invalid video file format: .${ext}`);
        }
        
        console.log('[Advanced Video] Waiting for file system to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[Advanced Video] Converting file path to src...');
        
        const videoElement = document.createElement('video');
        const videoSrc = await window.electronAPI.convertFileSrc(videoPath); 
        console.log('[Advanced Video] Converted src:', videoSrc);
        
        videoElement.src = videoSrc;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = false;
        videoElement.style.maxWidth = '100%';
        videoElement.style.borderRadius = '10px';
        videoElement.onerror = function() {
            console.error('[Advanced Video] Video failed to load:', this.src);
            console.error('[Advanced Video] Error code:', this.error ? this.error.code : 'unknown');
        };
        videoElement.onloadeddata = function() {
            console.log('[Advanced Video] Video loaded successfully');
        };

        const messageElement = addMessage(videoElement.outerHTML, 'ai', null, true);
        console.log('[Advanced Video] Message element:', messageElement);

        state.conversationHistory.push({
            role: 'assistant',
            content: videoElement.outerHTML,
            isVideo: true,
            videoPath: videoPath,
            timestamp: new Date().toISOString()
        });
        sessionStorage.setItem('conversationHistory', JSON.stringify(state.conversationHistory));

        setTimeout(() => {
            const insertedVideo = messageElement.querySelector('video');
            if (insertedVideo) {
                insertedVideo.addEventListener('loadedmetadata', function() {
                    const hasAudio = this.mozHasAudio || 
                                    Boolean(this.webkitAudioDecodedByteCount) || 
                                    Boolean(this.audioTracks && this.audioTracks.length);
                    
                    if (hasAudio) {
                        this.addEventListener('volumechange', function() {
                            if (this.muted) {
                                this.pause();
                            }
                        });
                    }
                });
            }
        }, 100);
        
        log.textContent = `✅ Generation Complete! Video saved to disk.`;
        elements.advancedVideoPreviewsContainer.innerHTML = '';
        elements.openVideoOutputBtn?.classList.remove('hidden');
    } catch (error) {
        log.textContent = `❌ Advanced Generation Failed: ${error.message}`;
        addMessage(`**Advanced Video Failed:**
${error.message}`, 'ai');
        const activeThinkingMessage = elements.chatHistory.querySelector('.thinking-bubble');
        if (activeThinkingMessage) activeThinkingMessage.remove();
    } finally {
        submitBtn.disabled = false;
        elements.advancedVideoGenModal?.classList.add('hidden'); 
    }
}
export const handleGenerativeModals = {
    showSelfieModal: () => document.getElementById('selfie-gen-modal').classList.remove('hidden'),
    hideSelfieModal: () => document.getElementById('selfie-gen-modal').classList.add('hidden'),
    executeSelfie: async (state, elements) => {
        let userSuggestion = document.getElementById('selfie-prompt-input').value.trim();
        userSuggestion = userSuggestion || 'a general scene'; 
        const customAttire = document.getElementById('attire-prompt-input')?.value.trim() || ''; 
        
        const characterData = await window.electronAPI.getCharacterConstants();
        const characterName = characterData.name || 'AI';
        
    handleGenerativeModals.hideSelfieModal();
    addMessage(`*Requesting ${characterName} selfie: "${userSuggestion}"*`, 'user');
    state.conversationHistory.push({ role: 'user', content: `Selfie request: ${userSuggestion}${customAttire ? ` | Attire: ${customAttire}` : ''}` });
        const thinkingMessage = addMessage(`${characterName} is preparing a selfie for you...`, 'ai');
        try {
            const selectedChatModelOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
            const payload = {
                history: state.conversationHistory,
                modelConfig: { 
                    modelId: selectedChatModelOption.value, 
                    provider: selectedChatModelOption.dataset.provider 
                },
                userSuggestion: userSuggestion,
                customAttire: customAttire,
                outputReservation: state.tokenSettings.output,
                historyTokenLimit: state.tokenSettings.history,
                knowledgeTokenLimit: state.tokenSettings.knowledge,
                recentTurnsCount: state.tokenSettings.recentTurns || 5,
            };
            const result = await window.electronAPI.generateSelfie(payload); 
            console.log('[Selfie] Generation result:', result);
            
            if (result.success && result.filePaths && result.filePaths.length > 0) {
                const imageFiles = result.filePaths.filter(path => {
                    const ext = path.toLowerCase().split('.').pop();
                    return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
                });
                
                if (imageFiles.length === 0) {
                    throw new Error("No valid image files found in result");
                }
                
                const imagePath = imageFiles[0];
                console.log('[Selfie] All file paths:', result.filePaths);
                console.log('[Selfie] Filtered image files:', imageFiles);
                console.log('[Selfie] Selected image path:', imagePath);
                
                console.log('[Selfie] Waiting for file system to stabilize...');
                await new Promise(resolve => setTimeout(resolve, 300));
                console.log('[Selfie] Converting file path to src...');
                
                const imgSrc = await window.electronAPI.convertFileSrc(imagePath);
                
                const img = document.createElement('img');
                img.src = imgSrc;
                img.className = 'generated-selfie';
                img.alt = 'AI Generated Selfie';
                img.style.maxWidth = '100%';
                img.style.borderRadius = '10px';
                
                await new Promise(async (resolve, reject) => {
                    let settled = false;
                    const cleanup = () => { if (!settled) settled = true; };

                    img.onload = function() {
                        if (settled) return; cleanup();
                        console.log('[Selfie] Image loaded successfully');
                        resolve();
                    };
                    img.onerror = async function() {
                        if (settled) return;
                        console.warn('[Selfie] file:// image failed to load, attempting base64 fallback:', this.src);
                        try {
                            const base64 = await window.electronAPI.readFileAsBase64(imagePath);
                            if (base64?.success && base64.dataUrl) {
                                img.src = base64.dataUrl;
                                setTimeout(() => {
                                    if (!settled) {
                                        cleanup();
                                        resolve();
                                    }
                                }, 500);
                            } else {
                                cleanup();
                                reject(new Error('Image failed to load (no base64 fallback)'));
                            }
                        } catch (e) {
                            cleanup();
                            reject(new Error('Image failed to load (fallback error)'));
                        }
                    };
                    setTimeout(() => { if (!settled) { settled = true; reject(new Error('Image load timeout')); } }, 30000);
                });
                
                console.log('[Selfie] Image element HTML:', img.outerHTML);
                const messageElement = addMessage(img.outerHTML, 'ai', null, true);
                console.log('[Selfie] Message element:', messageElement);
                
                const assistantContent = img.outerHTML;
                state.conversationHistory.push({
                    role: 'assistant',
                    content: assistantContent,
                    isImage: true,
                    imagePath: imagePath,
                    timestamp: new Date().toISOString()
                });
                sessionStorage.setItem('conversationHistory', JSON.stringify(state.conversationHistory));
                console.log('[Selfie] Saved image to conversationHistory');
                const lastUserMsgImg = state.conversationHistory[state.conversationHistory.length - 2];
                const lastAiMsgImg = state.conversationHistory[state.conversationHistory.length - 1];
                if (lastUserMsgImg && lastAiMsgImg) {
                    const historyForTurn = sanitizeHistoryForRag([lastUserMsgImg, lastAiMsgImg]);
                    const activeCharacterName = await window.electronAPI.getActiveCharacterName();
                    await window.electronAPI.saveChatTurnToRag({
                        id: `selfie-${Date.now()}`,
                        timestamp: Date.now(),
                        history: historyForTurn,
                        persona: activeCharacterName
                    });
                }
                
                elements.openImageOutputBtn?.classList.remove('hidden');
            } else {
                throw new Error(result.error || "Image generation failed.");
            }
        } catch (error) {
            addMessage(`**Selfie Failed:**
${error.message}`, 'ai');
        } finally {
            thinkingMessage.remove();
            document.getElementById('selfie-prompt-input').value = '';
            const attireInput = document.getElementById('attire-prompt-input');
            if(attireInput) attireInput.value = '';
        }
    },
    executeSimpleSelfieVideo: executeSimpleSelfieVideo,
    executeAdvancedVideo: executeAdvancedVideo, 
};
export const handleResend = async (state) => {
    if (state.isSending) {
        showStatusMessage("Please wait for the current request to finish.", "info");
        return;
    }
    if (!state.lastPayloadSent) {
        showStatusMessage("There is no previous message to resend.", "info");
        return;
    }
    state.isSending = true;
    const sendButton = elements.chatForm.querySelector('button[type="submit"]');
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';
    const resendPayload = JSON.parse(JSON.stringify(state.lastPayloadSent));
    const selectedModelOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
    resendPayload.modelConfig = {
        modelId: selectedModelOption.value,
        provider: selectedModelOption.dataset.provider,
        contextWindow: parseInt(selectedModelOption.dataset.contextWindow, 10),
        maxOutputLimit: parseInt(selectedModelOption.dataset.maxOutputLimit, 10),
        costInput: parseFloat(selectedModelOption.dataset.costInput),
        costOutput: parseFloat(selectedModelOption.dataset.costOutput),
    };
    addMessage(`*Resending last prompt with model: ${selectedModelOption.textContent}*`, 'user');
    await executeApiCall(resendPayload, state, elements);
};

// Helper: Build usable text for different prompt shapes
export function buildPromptText(prompt) {
    if (!prompt) return '';
    if (typeof prompt.text === 'string' && prompt.text.trim()) return prompt.text;
    if (prompt.content && typeof prompt.content.text === 'string' && prompt.content.text.trim()) {
        return prompt.content.text;
    }

    if ((prompt.type === 'chat' || !prompt.type) && prompt.promptType === 'template') {
        const role = prompt.role || '';
        const instruction = prompt.instruction || '';
        const data = prompt.data || '';
        const output = prompt.output || '';
        const chunks = [];
        if (role) chunks.push(`Role: ${role}`);
        if (instruction) chunks.push(`\n\nInstruction: ${instruction}`);
        if (data) chunks.push(`\n\nData: ${data}`);
        if (output) chunks.push(`\n\nOutput Format: ${output}`);
        return chunks.join('');
    }

    if (prompt.type === 'image' && prompt.promptType === 'structured') {
        const parts = [];
        if (prompt.character) parts.push(prompt.character);
        if (prompt.scene) parts.push(prompt.scene);
        if (prompt.action) parts.push(prompt.action);
        if (prompt.attire) parts.push(prompt.attire);
        if (prompt.effects) parts.push(prompt.effects);
        if (prompt.style) parts.push(prompt.style);
        return parts.join(', ');
    }

    if (prompt.type === 'video' && prompt.promptType === 'structured') {
        const parts = [];
        if (prompt.character) parts.push(prompt.character);
        if (prompt.scene) parts.push(prompt.scene);
        if (prompt.action) parts.push(prompt.action);
        if (prompt.attire) parts.push(prompt.attire);
        if (prompt.effects) parts.push(prompt.effects);
        if (prompt.cameraMovement) parts.push(prompt.cameraMovement);
        if (prompt.duration) parts.push(`Duration: ${prompt.duration}`);
        return parts.join(', ');
    }

    if (prompt.type === 'modifier') {
        return prompt.text || '';
    }
    return '';
}

function createInsertableObject(content, type) {
    const objectDiv = document.createElement('div');
    objectDiv.className = `inserted-object-container ${type}-object-container`;
    objectDiv.setAttribute('contenteditable', 'false');

    const preElement = document.createElement('pre');
    const codeElement = document.createElement('code');
    codeElement.textContent = content;
    preElement.appendChild(codeElement);
    objectDiv.appendChild(preElement);

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '&times;';
    removeBtn.className = 'remove-object-btn';
    removeBtn.title = 'Remove object';
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const parent = objectDiv.parentNode;
        if (parent) {
            const nextSibling = objectDiv.nextSibling;
            parent.removeChild(objectDiv);
            if (nextSibling && nextSibling.nodeName.toLowerCase() === 'br') {
                nextSibling.remove();
            }
            elements.chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };
    objectDiv.appendChild(removeBtn);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'object-label';
    labelSpan.textContent = type.replace('-', ' ');
    objectDiv.appendChild(labelSpan);

    return objectDiv;
}

export function handlePromptInsertion(promptText, label = 'Prompt', elements) {
    const chatInput = elements.chatInput;
    if (!chatInput) return;

    const sel = window.getSelection();
    let marker = null;
    if (sel && sel.rangeCount > 0 && chatInput.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        marker = document.createElement('span');
        marker.id = 'prompt-caret-marker';
        marker.style.display = 'inline-block';
        marker.style.width = '0px';
        marker.style.height = '0px';
        marker.style.overflow = 'hidden';
        range.insertNode(marker);
    }

    const promptDiv = createInsertableObject(promptText, 'prompt');
    const labelEl = promptDiv.querySelector('.object-label');
    if (labelEl) labelEl.textContent = label;

    chatInput.insertBefore(promptDiv, chatInput.firstChild);
    const br = document.createElement('br');
    chatInput.insertBefore(br, promptDiv.nextSibling);

    if (marker) {
        const restoreSel = window.getSelection();
        const restoreRange = document.createRange();
        restoreRange.setStartAfter(marker);
        restoreRange.collapse(true);
        restoreSel.removeAllRanges();
        restoreSel.addRange(restoreRange);
        marker.remove();
    } else {
        chatInput.focus();
        const range = document.createRange();
        range.selectNodeContents(chatInput);
        range.collapse(false);
        const restoreSel = window.getSelection();
        restoreSel.removeAllRanges();
        restoreSel.addRange(range);
    }

    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
}

export function handleObjectInsertion(elements) {
    const objectTextarea = document.getElementById('object-input-textarea');
    const createObjectModal = document.getElementById('create-object-modal');
    const content = objectTextarea.value.trim();
    if (!content) {
        showStatusMessage("Object cannot be empty.", "error");
        return;
    }

    const objectDiv = createInsertableObject(content, 'code');
    
    const chatInput = elements.chatInput;
    const selection = window.getSelection();
    chatInput.focus();

    let range = null;
    if (selection.rangeCount > 0 && chatInput.contains(selection.anchorNode)) {
        range = selection.getRangeAt(0);
    } else {
        range = document.createRange();
        range.selectNodeContents(chatInput);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    if (range) {
        range.deleteContents();
        range.insertNode(objectDiv);

        const trailingBr = document.createElement('br');
        range.setStartAfter(objectDiv);
        range.insertNode(trailingBr);
        
        range.setStartAfter(trailingBr);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        chatInput.appendChild(objectDiv);
        chatInput.appendChild(document.createElement('br'));
    }

    chatInput.scrollTop = chatInput.scrollHeight;
    elements.chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    objectTextarea.value = '';
    if (createObjectModal) {
        createObjectModal.classList.add('hidden');
    }
}

export function handleActionInsertion(actionContent, actionStyle, actionName, elements) {
    const chatInput = elements.chatInput;
    if (!chatInput) return;
    const sel = window.getSelection();
    let marker = null;
    if (sel && sel.rangeCount > 0 && chatInput.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        marker = document.createElement('span');
        marker.id = 'action-caret-marker';
        marker.style.display = 'inline-block';
        marker.style.width = '0px';
        marker.style.height = '0px';
        marker.style.overflow = 'hidden';
        range.insertNode(marker);
    }

    const actionDiv = createInsertableObject(actionContent, 'action');
    const labelEl = actionDiv.querySelector('.object-label');
    if (labelEl) labelEl.textContent = actionName || 'Action';

    if (marker) {
        marker.parentNode.insertBefore(actionDiv, marker);
        const br = document.createElement('br');
        marker.parentNode.insertBefore(br, marker);
    } else {
        chatInput.appendChild(actionDiv);
        const br = document.createElement('br');
        chatInput.appendChild(br);
    }

    if (marker) {
        const restoreSel = window.getSelection();
        const restoreRange = document.createRange();
        restoreRange.setStartAfter(marker);
        restoreRange.collapse(true);
        restoreSel.removeAllRanges();
        restoreSel.addRange(restoreRange);
        marker.remove();
    } else {
        chatInput.focus();
        const range = document.createRange();
        range.selectNodeContents(chatInput);
        range.collapse(false);
        const restoreSel = window.getSelection();
        restoreSel.removeAllRanges();
        restoreSel.addRange(range);
    }

    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
}

export function handleModifierInsertion(modifierText, label = 'Modifier', elements) {
    const chatInput = elements.chatInput;
    if (!chatInput) return;
    const sel = window.getSelection();
    let marker = null;
    if (sel && sel.rangeCount > 0 && chatInput.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        marker = document.createElement('span');
        marker.id = 'modifier-caret-marker';
        marker.style.display = 'inline-block';
        marker.style.width = '0px';
        marker.style.height = '0px';
        marker.style.overflow = 'hidden';
        range.insertNode(marker);
    }

    const modifierDiv = createInsertableObject(modifierText, 'modifier');
    const labelEl = modifierDiv.querySelector('.object-label');
    if (labelEl) labelEl.textContent = label;

    if (marker) {
        marker.parentNode.insertBefore(modifierDiv, marker);
        const br = document.createElement('br');
        marker.parentNode.insertBefore(br, marker);
    } else {
        chatInput.appendChild(modifierDiv);
        const br = document.createElement('br');
        chatInput.appendChild(br);
    }

    if (marker) {
        const restoreSel = window.getSelection();
        const restoreRange = document.createRange();
        restoreRange.setStartAfter(marker);
        restoreRange.collapse(true);
        restoreSel.removeAllRanges();
        restoreSel.addRange(restoreRange);
        marker.remove();
    } else {
        chatInput.focus();
        const range = document.createRange();
        range.selectNodeContents(chatInput);
        range.collapse(false);
        const restoreSel = window.getSelection();
        restoreSel.removeAllRanges();
        restoreSel.addRange(range);
    }

    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    chatInput.scrollTop = chatInput.scrollHeight;
    chatInput.focus();
}


export const handleSlashCommand = {
    showModal: () => {
        elements.slashCommandModal.classList.remove('hidden');
        elements.slashCommandSaveButtons.classList.add('hidden');
        elements.slashCommandActionButtons.classList.remove('hidden');
    },
    closeModal: (state) => {
        elements.slashCommandModal.classList.add('hidden');
        elements.slashCommandDetails.classList.add('hidden');
        document.getElementById('slash-command-subtitle').classList.add('hidden');
        elements.slashCommandInput.value = '';
        state.currentTask = '';
    },
    selectTask: (event, state) => {
        const target = event.target.closest('button');
        if (!target || !target.dataset.task) return;
        state.currentTask = target.dataset.task;
        elements.slashCommandDetails.classList.remove('hidden');
        const subTitleElement = document.getElementById('slash-command-subtitle');
        subTitleElement.textContent = target.textContent;
        subTitleElement.classList.remove('hidden');
        if (state.currentTask === 'research') {
            elements.slashCommandInput.placeholder = `Enter a detailed research prompt (e.g., "Summarize the latest developments in fusion energy by 2024")`;
        } else if (state.currentTask === 'crawl') {
            elements.slashCommandInput.placeholder = `Enter a single URL to read and summarize.`;
        } else {
            elements.slashCommandInput.placeholder = `Enter query for ${target.textContent}`;
        }
        elements.slashCommandInput.focus();
        elements.slashCommandSaveButtons.classList.add('hidden');
        elements.slashCommandActionButtons.classList.remove('hidden');
    },
    executeCommand: async (state, save, chat) => {
        const query = elements.slashCommandInput.value.trim();
        if (!query) {
            showStatusMessage('Please enter a query or URL.', 'error');
            return;
        }
        const taskName = elements.slashCommandOptions.querySelector(`[data-task="${state.currentTask}"]`).textContent;
        addMessage(`*Running command: /${state.currentTask} (${taskName})...
Query: "${query}"*`, 'user');
        elements.chatInput.textContent = '';
        elements.slashCommandInput.value = '';
        elements.slashCommandModal.classList.add('hidden');
        const thinkingMessage = addMessage('', 'ai');
        thinkingMessage.classList.add('thinking-bubble');
        try {
            const webTaskResult = await window.electronAPI.runWebTask({ 
                task: state.currentTask, 
                query, 
            });
            thinkingMessage.remove();
            if (!webTaskResult || !webTaskResult.success) {
                throw new Error(webTaskResult?.error || `The web task for /${state.currentTask} failed to return valid results.`);
            }
            let outputMessage = '';
            let contentToSave = '';
            const sourceUrls = webTaskResult.sourceUrls || [];
            if (state.currentTask === 'search' || state.currentTask === 'similar') {
                const results = webTaskResult.results;
                if (results && results.length > 0) {
                    outputMessage = `**Found ${results.length} links for "${query}"**`;
                    contentToSave = `Search results for "${query}"`;
                    results.forEach((item, index) => {
                        const scoreText = item.score ? ` (Score: ${item.score.toFixed(3)})` : ''; 
                        outputMessage += `${index + 1}. **[${item.title}](${item.url})**${scoreText}`;
                        contentToSave += `${index + 1}. ${item.title} - ${item.url}${scoreText}`;
                    });
                } else {
                    outputMessage = "No links found for that query.";
                    contentToSave = outputMessage;
                }
            } 
            else if (['crawl', 'answer', 'research'].includes(state.currentTask)) {
                const resultText = webTaskResult.answer; 
                if (resultText && resultText.trim()) {
                    outputMessage = `**Exa.ai ${state.currentTask.toUpperCase()} Result:**${resultText}`;
                    contentToSave = resultText;
                    if (sourceUrls.length > 0) {
                        outputMessage += `*Sources:* ${sourceUrls.join(', ')}`;
                    }
                } else {
                    outputMessage = `Could not retrieve any content for the task: ${query}`;
                    contentToSave = outputMessage;
                }
            }
            if (chat && outputMessage) {
                addMessage(outputMessage, 'ai');
                state.conversationHistory.push({ role: 'assistant', content: outputMessage });
                
                try {
                    const lastUserMessage = state.conversationHistory[state.conversationHistory.length - 2];
                    const lastAssistantMessage = state.conversationHistory[state.conversationHistory.length - 1];
                    if (lastUserMessage && lastAssistantMessage) {
                        const historyForTurn = sanitizeHistoryForRag([lastUserMessage, lastAssistantMessage]);
                        const activeCharacterName = await window.electronAPI.getActiveCharacterName();
                        await window.electronAPI.saveChatTurnToRag({
                            id: `turn-${Date.now()}`,
                            timestamp: Date.now(),
                            history: historyForTurn,
                            persona: activeCharacterName
                        });
                    }
                } catch (ragError) {
                    console.error('Failed to save slash command result to RAG:', ragError);
                }
            }
            if (save && contentToSave) {
                const safeFilename = `${state.currentTask}_${query.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}_${Date.now()}.md`;
                const saveResult = await window.electronAPI.saveFile({ 
                    content: contentToSave, 
                    filename: safeFilename,
                    targetDir: 'exa' 
                });
                if (saveResult.success) {
                    addMessage(`✅ **Save Successful** Content saved to:*${saveResult.filePath}*`, 'ai');
                } else {
                    addMessage(`⚠️ **Save Failed** An error occurred while saving: ${saveResult.error}`, 'ai');
                }
            }
        } catch (error) {
            thinkingMessage.remove();
            addMessage(`**An error occurred with the /${state.currentTask} command:** ${error.message}`, 'ai');
        }
    },
    executeAdvancedResearch: async (state) => {
        const query = document.getElementById('research-query-input').value.trim();
        const numResults = parseInt(document.getElementById('research-num-results').value) || 5;
        const startDate = document.getElementById('research-start-date').value || null;
        const domainIncludes = document.getElementById('research-domain-includes').value.split(',').map(d => d.trim()).filter(d => d);
        const domainExcludes = document.getElementById('research-domain-excludes').value.split(',').map(d => d.trim()).filter(d => d);
        const logElement = document.getElementById('advanced-research-log');
        
        if (!query) {
            showStatusMessage('Please enter a research query.', 'error');
            return;
        }
        
        const executeBtn = document.getElementById('research-execute-btn');
        executeBtn.disabled = true;
        executeBtn.textContent = 'Researching...';
        logElement.classList.remove('hidden');
        logElement.innerHTML = '<p>🔍 Starting advanced research...</p>';
        
        try {
            const selectedModelOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
            const llmModelConfig = {
                modelId: selectedModelOption.value,
                provider: selectedModelOption.dataset.provider
            };
            
            const advancedOptions = {
                numResults,
                startDate,
                domainIncludes,
                domainExcludes
            };
            
            logElement.innerHTML += '<p>📡 Querying Exa.ai with advanced filters...</p>';
            
            const result = await window.electronAPI.runWebTask({
                task: 'research',
                query,
                advancedOptions,
                llmModelConfig
            });
            
            if (!result || !result.success) {
                throw new Error(result?.error || 'Research task failed');
            }
            
            logElement.innerHTML += `<p>✅ Research complete! Found ${result.sourceUrls?.length || 0} sources</p>`;
            logElement.innerHTML += `<div style="margin-top: 15px; padding: 15px; background: var(--secondary-bg-color); border-radius: 8px; max-height: 400px; overflow-y: auto;">
                <h4 style="margin-top: 0;">Research Results:</h4>
                <div style="white-space: pre-wrap;">${result.answer}</div>
                ${result.sourceUrls && result.sourceUrls.length > 0 ? `
                    <h5 style="margin-top: 15px;">Sources:</h5>
                    <ul style="margin: 0;">${result.sourceUrls.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}</ul>
                ` : ''}
            </div>`;
            
            showStatusMessage('Advanced research completed successfully!', 'success');
            
        } catch (error) {
            logElement.innerHTML += `<p style="color: var(--error-color);">❌ Error: ${error.message}</p>`;
            showStatusMessage('Research failed. Check log for details.', 'error');
        } finally {
            executeBtn.disabled = false;
            executeBtn.textContent = 'Execute Research';
        }
    }
};

let allActionsCache = []; 
export const handleActionManagement = {
    showManager: () => {
        elements.manageActionsModal.classList.remove('hidden');
        handleActionManagement.loadActions();
    },

    hideManager: () => {
        elements.manageActionsModal.classList.add('hidden');
    },

    showAddModal: () => {
        elements.actionModalTitle.textContent = 'Add New Action';
        elements.actionName.value = '';
        elements.actionText.value = '';
        elements.actionStyle.value = 'default';
        elements.addEditActionModal.classList.remove('hidden');
        elements.actionName.focus();
    },

    hideAddEditModal: () => {
        elements.addEditActionModal.classList.add('hidden');
    },

    saveAction: async () => {
        const name = elements.actionName.value.trim();
        const content = elements.actionText.value.trim();
        const style = elements.actionStyle.value;
        if (name && content) {
            const originalName = elements.actionName.getAttribute('data-original-name');
            if (originalName && originalName !== name) {
                await window.electronAPI.removeAction(originalName);
            }
            const saveResult = await window.electronAPI.saveAction({ name, content, style });
            if (saveResult.success) {
                showStatusMessage(`Action '${name}' saved successfully.`, 'success');
                handleActionManagement.hideAddEditModal();
                handleActionManagement.loadActions();
            } else {
                 showStatusMessage(`Failed to save: ${saveResult.error}`, 'error');
            }
        } else {
            showStatusMessage('Action name and content cannot be empty.', 'error');
        }
    },

    loadActions: async () => {
        const userActions = await window.electronAPI.getActions() || [];
        const defaultActions = await window.electronAPI.getDefaultActions() || [];
        const allActions = [...userActions];
        defaultActions.forEach(def => {
            if (!allActions.some(a => a.name === def.name)) {
                allActions.push(def);
            }
        });
        allActionsCache = allActions;
        elements.actionsList.innerHTML = '';
        if (allActions && allActions.length > 0) {
             allActions.forEach(action => {
                const isDefault = defaultActions.some(da => da.name === action.name) && !userActions.some(ua => ua.name === action.name);
                const item = document.createElement('div');
                item.classList.add('action-item');
                item.style.borderLeft = `4px solid var(--${action.style || 'default'}-color)`; 
                const nameContent = isDefault ? `<span>${action.name} <small>(Default)</small></span>` : `<span>${action.name}</span>`;
                let buttonsHtml = `<button class="insert-action-btn btn-primary" data-name="${action.name}">Insert</button>`;
                if (!isDefault) {
                    buttonsHtml = `<button class="edit-action-btn btn-secondary" data-name="${action.name}">Edit</button>
                                   <button class="remove-action-btn btn-secondary" data-name="${action.name}">Remove</button>` + buttonsHtml;
                }
                item.innerHTML = `${nameContent}
                              <div>${buttonsHtml}</div>`;
                elements.actionsList.appendChild(item);
            });
        } else {
            elements.actionsList.innerHTML = '<p>No actions found. Click "Add New Action" to create one.</p>';
        }
    },
    handleListClick: async (event) => {
        const target = event.target;
        const name = target.dataset.name;
        if (!name) return;
        if (target.classList.contains('edit-action-btn')) {
            const action = allActionsCache.find(a => a.name === name); 
            if (action && !allActionsCache.some(da => da.name === action.name && !da.content)) {
                elements.actionModalTitle.textContent = 'Edit Action';
                elements.actionName.value = action.name;
                elements.actionName.setAttribute('data-original-name', action.name); 
                elements.actionText.value = action.content;
                elements.actionStyle.value = action.style;
                elements.addEditActionModal.classList.remove('hidden');
                elements.actionName.focus(); 
            } else {
                 showStatusMessage('Default actions cannot be edited.', 'error');
            }
        } else if (event.target.classList.contains('remove-action-btn')) {
            const action = async () => {
                await window.electronAPI.removeAction(name);
                handleActionManagement.loadActions();
                showStatusMessage(`Action '${name}' removed successfully.`, 'success');
            };
            showConfirmationModal(`Confirm Delete Action: ${name}`, `Are you sure you want to delete the action '${name}'?`, action);
        } else if (event.target.classList.contains('insert-action-btn')) {
            const action = allActionsCache.find(a => a.name === name);
            if (action) {
                handleActionInsertion(action.content, action.style, action.name, elements);
                handleActionManagement.hideManager();
            }
        }
    }
};

// --- Scrapy Suite ---
export const handleScrapySuite = {
    showModal: () => {
        elements.scrapyModal.classList.remove('hidden');
        elements.scrapyLog.textContent = '';
        
        window.electronAPI.onScrapyProgress((data) => {
            if (typeof data === 'string') {
                elements.scrapyLog.textContent += data;
                elements.scrapyLog.scrollTop = elements.scrapyLog.scrollHeight;
            } else if (data.error) {
                elements.scrapyLog.textContent += `\n❌ Error: ${data.error}`;
                elements.scrapyLog.scrollTop = elements.scrapyLog.scrollHeight;
            }
        });
    },
    closeModal: () => {
        elements.scrapyModal.classList.add('hidden');
        elements.scrapyLog.textContent = ''; 
        elements.scrapyUrlInput.value = '';
    },
    startScrape: async (state) => {
        const urls = elements.scrapyUrlInput.value.trim().split('\n').filter(url => url.trim() !== '');
        if (urls.length === 0) {
            showStatusMessage('Please enter at least one URL to scrape.', 'error');
            return;
        }
        const scrapeMode = elements.scrapeModeLinks.checked ? 'links' : 'content'; 
        elements.scrapyStartBtn.disabled = true;
        elements.scrapyStartBtn.textContent = 'Scraping...';
        elements.scrapyLog.textContent = `Starting scrape of ${urls.length} URL(s) in ${scrapeMode} mode...\n\n`;
        
        try {
            const result = await window.electronAPI.runScrapyTask({
                task: 'scrape',
                urls: urls,
                scrapeType: scrapeMode,
            });
            
            if (result.success) {
                elements.scrapyLog.textContent += `\n\n✅ Scrape completed successfully! Files saved to output folder.`;
                showStatusMessage('Scrape completed successfully!', 'success');
            } else {
                elements.scrapyLog.textContent += `\n\n❌ Scrape failed: ${result.error}`;
                showStatusMessage('Scrape failed. Check log for details.', 'error');
            }
        } catch (error) {
            elements.scrapyLog.textContent += `\n\n❌ Critical error: ${error.message}`;
            showStatusMessage('Scrape failed with critical error.', 'error');
        }
        
        elements.scrapyStartBtn.disabled = false;
        elements.scrapyStartBtn.textContent = 'Start Scrape';
    }
};
export const handlePersonalityManagement = {
    showManager: () => {
        elements.managePersonalitiesModal.classList.remove('hidden');
        handlePersonalityManagement.loadPersonalities();
    },
    hideManager: () => {
        elements.managePersonalitiesModal.classList.add('hidden');
    },
    showAddModal: () => {
        elements.modalTitle.textContent = 'Add New Modifier';
        elements.personalityName.value = '';
        elements.personalityText.value = '';
        elements.tokenLimit.value = 256;
        elements.addEditPersonalityModal.classList.remove('hidden');
        elements.personalityName.focus();
    },
    hideAddEditModal: () => {
        elements.addEditPersonalityModal.classList.add('hidden');
    },
    savePersonality: async (state) => {
        const name = elements.personalityName.value;
        const text = elements.personalityText.value;
        const tokenLimit = parseInt(elements.tokenLimit.value, 10);
        if (name && text && tokenLimit) {
            try {
                await window.electronAPI.savePersonality({ name, text, tokenLimit });
                showStatusMessage(`Modifier '${name}' saved successfully.`, 'success');
                handlePersonalityManagement.hideAddEditModal();
                
                const { initializePersonalitySelector } = await import('./initializers.js');
                await initializePersonalitySelector();
            } catch (error) {
                showStatusMessage(`Error saving modifier: ${error.message}`, 'error');
            }
        }
    },
    loadPersonalities: async () => {
        const personalities = await window.electronAPI.getPersonalities();
        elements.personalitiesList.innerHTML = '';
        personalities.forEach(personality => {
            const item = document.createElement('div');
            item.classList.add('personality-item');
            item.innerHTML = `
                <span>${personality.name}</span>
                <button class="edit-personality-btn btn-secondary" data-name="${personality.name}">Edit</button>
                <button class="remove-personality-btn btn-secondary" data-name="${personality.name}">Remove</button>
            `;
            elements.personalitiesList.appendChild(item);
        });
    },
    handleListClick: async (event) => {
        const target = event.target;
        if (target.classList.contains('edit-personality-btn')) {
            const name = target.dataset.name;
            const personality = await window.electronAPI.getPersonality(name);
            if (personality) {
                elements.modalTitle.textContent = 'Edit Modifier';
                elements.personalityName.value = personality.name;
                elements.personalityText.value = personality.text;
                elements.tokenLimit.value = personality.tokenLimit;
                elements.addEditPersonalityModal.classList.remove('hidden');
            }
        } else if (target.classList.contains('remove-personality-btn')) {
            const name = target.dataset.name;
            await window.electronAPI.removePersonality(name);
            handlePersonalityManagement.loadPersonalities();
            await initializePersonalitySelector();
            elements.personaSelect.dispatchEvent(new Event('change'));
            showStatusMessage(`Modifier '${name}' removed successfully.`, 'success');
        }
    }
};
export const handleThemeManagement = {
    showSettingsModal: () => {
        elements.themeSettingsModal?.classList.remove('hidden');
    },
    hideSettingsModal: () => {
        elements.themeSettingsModal?.classList.add('hidden');
    },
    toggleTheme: async (state) => {
        console.log('[toggleTheme] CALLED - current isLightActive:', state.currentTheme.isLightActive);
        const newIsLight = !state.currentTheme.isLightActive;
        state.currentTheme.isLightActive = newIsLight;
        console.log('[toggleTheme] New isLightActive:', newIsLight);
        
        if (state.currentTheme.mode === 'custom' && state.currentTheme.palette) {
            const paletteVariant = newIsLight ? state.currentTheme.palette.light : state.currentTheme.palette.dark;
            console.log('[toggleTheme] Custom theme - applying palette variant:', newIsLight ? 'light' : 'dark');
            document.body.classList.remove('light-theme');
            document.body.classList.remove('theme-active');
            applyPalette(paletteVariant);
        } else {
            state.currentTheme.mode = newIsLight ? 'light' : 'dark';
            if (!document.body.classList.contains('theme-active')) {
                document.body.classList.add('theme-active');
            }
            document.body.classList.toggle('light-theme', newIsLight);
        }
        
        await window.electronAPI.setTheme(state.currentTheme);
    },
    showColorPicker: () => {
        elements.colorPickerUI?.classList.remove('hidden');
        elements.themeLogContainer?.classList.add('hidden');
        elements.colorPickerModal?.classList.remove('hidden');
        if (elements.themeLog) elements.themeLog.textContent = '';
        elements.themeLogCloseBtn?.classList.add('hidden');
    },
    hideColorPicker: () => {
        elements.colorPickerModal?.classList.add('hidden');
        elements.colorPickerUI?.classList.remove('hidden');
        elements.themeLogContainer?.classList.add('hidden');
        elements.themeLogCloseBtn?.classList.add('hidden');
    },
    resetTheme: async (state) => {
        document.body.classList.remove('light-theme');
        
        const body = document.body;
        const cssVars = [
            '--main-bg-color', '--secondary-bg-color', '--tertiary-bg-color',
            '--button-bg-color', '--button-hover-bg-color', '--border-color',
            '--main-text-color', '--secondary-text-color', '--accent-color',
            '--accent-color-hover', '--message-user-bg', '--message-ai-bg',
            '--accent-contrast-text-color', '--code-block-bg', '--error-color',
            '--success-color', '--link-color', '--highlight-color',
            '--spinner-base-color', '--shadow-color-rgba'
        ];
        
        cssVars.forEach(varName => {
            body.style.removeProperty(varName);
        });
        
        document.body.classList.add('theme-active');
        
        state.currentTheme = { mode: 'dark', palette: null, isLightActive: false };
        await window.electronAPI.setTheme(state.currentTheme);
        showStatusMessage('Theme reset to default dark.', 'success');
    },
    generateTheme: async (state) => {
        const selectedColor = elements.colorPickerInput.value;
        elements.colorPickerUI?.classList.add('hidden');
        elements.themeLogContainer?.classList.remove('hidden');
        if (elements.themeLog) elements.themeLog.textContent = 'Generating AI theme...';
        try {
            if (!elements.modelSelect || !elements.modelSelect.options || elements.modelSelect.options.length === 0) {
                throw new Error("No model selected or model selector not available. Please select a model first.");
            }
            
            const selectedModelOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
            if (!selectedModelOption) {
                throw new Error("No model selected.");
            }
            
            const modelConfig = {
                modelId: selectedModelOption.value,
                provider: selectedModelOption.dataset.provider
            };
            
            if (elements.themeLog) elements.themeLog.textContent += `\nUsing model: ${modelConfig.modelId}`;
            
            const result = await window.electronAPI.generateThemePalette({ 
                color: selectedColor, 
                modelConfig,
                outputReservation: state.tokenSettings.output
            });
            
            if (!result.success) { throw new Error(result.error); }
            
            console.log('[generateTheme] AI returned palette:', result.palette);
            
            state.currentTheme = { mode: 'custom', palette: result.palette, isLightActive: document.body.classList.contains('light-theme') };
            const currentPalette = state.currentTheme.isLightActive ? result.palette.light : result.palette.dark;
            
            console.log('[generateTheme] Selected palette variant:', state.currentTheme.isLightActive ? 'light' : 'dark');
            console.log('[generateTheme] Palette to apply:', currentPalette);
            
            console.log('[generateTheme] Body classes BEFORE removal:', Array.from(document.body.classList));
            document.body.classList.remove('light-theme');
            document.body.classList.remove('theme-active');
            console.log('[generateTheme] Body classes AFTER removal:', Array.from(document.body.classList));
            
            applyPalette(currentPalette);
            
            await window.electronAPI.setTheme(state.currentTheme);
            console.log('[generateTheme] Theme generated, applied, and saved to disk');
        
            if (result.debugInfo?.extractedThinking) {
                state.lastThinkingOutput = result.debugInfo.extractedThinking;
            }
            
            if (elements.themeLog) elements.themeLog.textContent += '\n\nTheme generated and applied successfully!';
        } catch (error) {
            console.error('[generateTheme] Error:', error);
            
            let userFriendlyMessage = 'An unexpected error occurred while generating the theme.';
            
            const errorMsg = error.message?.toLowerCase() || '';
            
            if (errorMsg.includes('token') && (errorMsg.includes('limit') || errorMsg.includes('exceed'))) {
                userFriendlyMessage = 'Theme generation failed due to token limits. Try using a shorter color description or switch to a model with higher token limits.';
            } else if (errorMsg.includes('json') && errorMsg.includes('parse')) {
                userFriendlyMessage = 'The AI service returned an invalid response. This might be due to high server load. Try again in a few moments or switch to a different model.';
            } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
                userFriendlyMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
            } else if (errorMsg.includes('unauthorized') || errorMsg.includes('401') || errorMsg.includes('api key')) {
                userFriendlyMessage = 'Authentication failed. Please check your API key settings.';
            } else if (errorMsg.includes('model') && (errorMsg.includes('not found') || errorMsg.includes('unavailable'))) {
                userFriendlyMessage = 'The selected model is currently unavailable. Try switching to a different model.';
            } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('connection')) {
                userFriendlyMessage = 'Network connection issue. Please check your internet connection and try again.';
            } else if (errorMsg.includes('quota') || errorMsg.includes('billing')) {
                userFriendlyMessage = 'API quota exceeded. Please check your account billing/limits.';
            }
            
            if (elements.themeLog) elements.themeLog.textContent += `\n\nERROR: ${userFriendlyMessage}`;
        } finally {
            elements.themeLogCloseBtn?.classList.remove('hidden');
        }
    }
};
export const handleFileAttachments = {
    addToCanvas: async (state) => {
        const files = await window.electronAPI.openFile({ properties: ['openFile', 'multiSelections'] });
        if (!files || files.length === 0) return;
        files.forEach(file => {
            if (file.content !== null) {
                state.contextCanvasFiles[file.filename] = file.content;
            } else {
                showStatusMessage(`Could not read file: ${file.filename}`, 'error');
            }
        });
        updateCanvasDisplay(state.contextCanvasFiles, window.electronAPI.countTokens);
        showStatusMessage(`${files.length} file(s) added to Context Canvas.`, 'success');
    },
    clearCanvas: (state) => {
        state.contextCanvasFiles = {};
        updateCanvasDisplay(state.contextCanvasFiles, window.electronAPI.countTokens);
        showStatusMessage("Context Canvas has been cleared.", "success");
    },
    attachFile: async (state) => {
        const files = await window.electronAPI.openFile({ properties: ['openFile'] });
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file || file.content === null) {
            showStatusMessage(`Could not read file: ${file?.filename || 'unknown'}`, 'error');
            return;
        }
        // Mirror Context Canvas behaviour: add the file to contextCanvasFiles as a transient entry
        // This ensures the attachment is injected to the model the same way as files added to the canvas.
        try {
            state.contextCanvasFiles[file.filename] = file.content;
        } catch (e) {
            console.warn('Failed to add attached file to contextCanvasFiles:', e);
        }

        state.attachedFile = {
            filename: file.filename,
            content: file.content
        };
        if (elements.attachedFileDisplay) {
            elements.attachedFileDisplay.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>📎 <strong>Attached:</strong> ${file.filename}</span>
                    <button class="remove-attachment-btn" style="background: none; border: none; color: var(--error-color); cursor: pointer; font-size: 16px; padding: 0; margin: 0;" title="Remove attachment">&times;</button>
                </div>
            `;
            elements.attachedFileDisplay.classList.remove('hidden');
            
            const fileButtonsContainer = document.getElementById('file-buttons-container');
            if (fileButtonsContainer) {
                fileButtonsContainer.classList.remove('hidden');
            }
        }
    },
    handleCanvasFileRemove: (event, state) => {
        if (event.target && event.target.classList.contains('remove-file-btn')) {
            const filenameToRemove = event.target.dataset.filename;
            if (filenameToRemove && state.contextCanvasFiles[filenameToRemove]) {
                delete state.contextCanvasFiles[filenameToRemove];
                updateCanvasDisplay(state.contextCanvasFiles, window.electronAPI.countTokens);
            }
        }
    },
     clearChatHistory: async (state) => {
        const action = async () => {
            const result = await window.electronAPI.clearChatHistory();
            if(result.success) {
                state.conversationHistory = [];
                sessionStorage.removeItem('conversationHistory');
                elements.chatHistory.innerHTML = '';
                showStatusMessage("All chat memories have been cleared.", "success");
            } else {
                showStatusMessage(`Error: ${result.message}`, "error");
            }
        };
        showConfirmationModal("Confirm Clear History", "Are you sure you want to clear ALL CHAT MEMORIES (Session RAG Database)? This cannot be undone.", action);
    },
    clearKnowledgeBase: async () => {
        const action = async () => {
            const result = await window.electronAPI.clearKnowledgeBase();
            if (result.success) {
                showStatusMessage("Knowledge base cleared successfully!", "success");
            } else {
                showStatusMessage(`Error: ${result.message}`, "error");
            }
        };
        showConfirmationModal("Confirm Clear Knowledge Base", "Are you sure you want to clear ALL KNOWLEDGE BASE FILES (RAG Database)? This cannot be undone.", action);
    },

    ingestFiles: async function() {
        try {
            const filePaths = await window.electronAPI.selectKnowledgeFiles();
            if (!filePaths || filePaths.length === 0) return;
            elements.ingestionOverlay.classList.remove('hidden');
            elements.ingestionLog.innerHTML = '<h3>Starting Ingestion...</h3>';
            elements.ingestionCloseContainer.innerHTML = '';
            await window.electronAPI.runIngestion(filePaths);
            showStatusMessage(`${filePaths.length} file(s) queued for ingestion. Follow progress in log window.`, 'success');
        } catch (error) {
            showStatusMessage(`Error selecting files: ${error.message}`, 'error');
            elements.ingestionLog.innerHTML += `<p style="color: var(--error-color);">FATAL ERROR: Could not start ingestion process: ${error.message}</p>`;
        }
    },
    ingestFolder: async function() {
        try {
            const folderPath = await window.electronAPI.selectFolder();
            if (!folderPath) return;
            
            const files = await window.electronAPI.getFilesFromFolder(folderPath);
            if (!files || files.length === 0) {
                showStatusMessage('No compatible files found in folder.', 'info');
                return;
            }
            
            const validExtensions = ['txt', 'md', 'markdown', 'pdf', 'docx', 'csv', 'xlsx', 'py', 'js', 'html', 'css', 'cpp', 'c', 'java', 'cs', 'ts', 'json', 'xml', 'log', 'sql', 'php', 'rb', 'go', 'rs', 'yml', 'yaml', 'ini', 'cfg', 'conf', 'sh', 'bat', 'ps1', 'lua', 'pl', 'tcl', 'r', 'm', 'swift', 'kt', 'scala', 'dart', 'hs', 'ml', 'fs', 'vb', 'asm', 's', 'tex', 'bib', 'sty'];
            const filteredPaths = files.filter(filePath => {
                const ext = filePath.slice((filePath.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
                return validExtensions.includes(ext);
            });
            
            if (filteredPaths.length === 0) {
                showStatusMessage('No compatible files found in folder.', 'info');
                return;
            }
            
            elements.ingestionOverlay.classList.remove('hidden');
            elements.ingestionLog.innerHTML = '<h3>Starting Folder Ingestion...</h3>';
            elements.ingestionCloseContainer.innerHTML = '';
            
            await window.electronAPI.runIngestion(filteredPaths);
            showStatusMessage(`${filteredPaths.length} file(s) from folder queued for ingestion.`, 'success');
        } catch (error) {
            showStatusMessage(`Error selecting folder: ${error.message}`, 'error');
            elements.ingestionLog.innerHTML += `<p style="color: var(--error-color);">FATAL ERROR: Could not start folder ingestion: ${error.message}</p>`;
        }
    },

    clearAllOutput: async () => {
        const action = async () => {
            const result = await window.electronAPI.clearOutputFolder();
            if(result.success) {
                showStatusMessage("All output folders cleared.", "success");
            } else {
                showStatusMessage(`Error clearing output folder: ${result.error}`, "error");
            }
        };
        showConfirmationModal("Confirm Clear Output", "Are you sure you want to delete ALL files from the Output sub-folders (Exa, Scrapy, Images, Videos)? This cannot be undone.", action);
    },
    getExt: (filename) => {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    },
    openOutputFolder: async () => {
        await window.electronAPI.openOutputFolder();
    },
};
export const handleMemoryManagement = {
    viewAndManageMemories: async (state) => {
        const themeData = { mode: state.currentTheme.mode, isLightActive: state.currentTheme.isLightActive, palette: state.currentTheme.palette };
        window.electronAPI.openViewerWindow({ 
            id: 'memories-list', 
            type: 'memories-list',
            collection: 'chat_history',
            themeData: themeData 
        });
    },
    showMemories: () => { console.warn("showMemories is now deprecated. Use viewAndManageMemories."); },
    hideMemories: () => { console.warn("hideMemories is now deprecated."); },
    handleListClick: () => { console.warn("handleListClick is now handled by viewer.js."); }
};
export const handleKnowledgeManagement = {
    viewAndManageKnowledge: async (state) => {
        const themeData = { mode: state.currentTheme.mode, isLightActive: state.currentTheme.isLightActive, palette: state.currentTheme.palette };
        window.electronAPI.openViewerWindow({ 
            id: 'knowledge-list', 
            type: 'knowledge-list',
            collection: 'knowledge_base',
            themeData: themeData 
        });
    },
    showKnowledgeFiles: () => { console.warn("showKnowledgeFiles is now deprecated. Use viewAndManageKnowledge."); },
    hideKnowledgeFiles: () => { console.warn("hideKnowledgeFiles is now deprecated."); },
    handleListClick: () => { console.warn("handleListClick is now handled by viewer.js."); }
};
export const handleTokenSettingsChange = async (event, key, sliderElement, inputElement, state) => {
    let numValue = parseInt(event.target.value, 10);
    if (isNaN(numValue)) return;

    const isSliderChange = event.target === sliderElement;

    if (key === 'knowledge' || key === 'history' || key === 'output') {
        const selectedOption = elements.modelSelect.options[elements.modelSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.contextWindow) {
            const modelContextWindow = parseInt(selectedOption.dataset.contextWindow, 10);
            const modelReportedMaxOutput = parseInt(selectedOption.dataset.maxOutputLimit, 10);
            
            if (key === 'output') {
                const calculatedDefault = Math.max(1024, Math.floor(modelReportedMaxOutput * 0.1));
                const currentKnowledgeValue = parseInt(state.tokenSettings.knowledge) || 0;
                const currentHistoryValue = parseInt(state.tokenSettings.history) || 0;
                const currentInputAllocation = currentKnowledgeValue + currentHistoryValue;
                const dynamicOutputMax = Math.max(128, modelContextWindow - currentInputAllocation - (state.tokenSettings.systemReserve || 0) - (state.personalityTokenLimit || 0));
                const maxAllowed = Math.min(modelReportedMaxOutput, dynamicOutputMax);
                numValue = Math.max(256, Math.min(numValue, maxAllowed));

                state.tokenSettings.outputPercentage = null;
            } else {
                const availableInputBudget = modelContextWindow - state.tokenSettings.output - (state.tokenSettings.systemReserve || 0) - (state.personalityTokenLimit || 0);
                const otherKey = key === 'knowledge' ? 'history' : 'knowledge';
                const otherValue = parseInt(state.tokenSettings[otherKey]) || 0;
                const maxAllowed = availableInputBudget - otherValue;
                numValue = Math.max(0, Math.min(numValue, maxAllowed));
            }
        }
    }

    sliderElement.value = numValue;
    inputElement.value = numValue;
    state.tokenSettings[key] = numValue;
    setupTokenManager(state);
    
    if (key === 'output') {
        try {
            const personalityText = state.conversationHistory?.find(m => m.role === 'system')?.content?.match(/\*\*Additional Personality instructions from the user below\*\*\n([\s\S]*?)\n\*\*The incoming data stream/)?.[1] || '';
            const systemPromptText = await window.electronAPI.getSystemInstruction({
                userName: state.userName,
                personalityText: personalityText,
                outputTokenLimit: numValue
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
            
            setupTokenManager(state);
        } catch (error) {
            console.error("Failed to update system prompt with new token limit:", error);
        }
    }
};
export const handlePromptManagement = {
    showManager: () => {
        elements.managePromptsModal.classList.remove('hidden');
        handlePromptManagement.loadPrompts();
    },
    hideManager: () => {
        elements.managePromptsModal.classList.add('hidden');
    },
    showAddModal: () => {
        elements.promptModalTitle.textContent = 'Add New Prompt';
        handlePromptManagement.resetForm();
        elements.addEditPromptModal.classList.remove('hidden');
        elements.promptTypeSelect.focus();
    },
    hideAddEditModal: () => {
        elements.addEditPromptModal.classList.add('hidden');
    },
    resetForm: () => {
        elements.promptTypeSelect.value = 'chat';
        handlePromptManagement.switchPromptType('chat');
        
        if (elements.chatFreeName) elements.chatFreeName.value = '';
        if (elements.chatFreeText) elements.chatFreeText.value = '';
        if (elements.chatTemplateName) elements.chatTemplateName.value = '';
        if (elements.chatTemplateRole) elements.chatTemplateRole.value = '';
        if (elements.chatTemplateInstruction) elements.chatTemplateInstruction.value = '';
        if (elements.chatTemplateData) elements.chatTemplateData.value = '';
        if (elements.chatTemplateOutput) elements.chatTemplateOutput.value = '';
        
        if (elements.imageFreeName) elements.imageFreeName.value = '';
        if (elements.imageFreeText) elements.imageFreeText.value = '';
        if (elements.imageStructName) elements.imageStructName.value = '';
        if (elements.imageStructCharacter) elements.imageStructCharacter.value = '';
        if (elements.imageStructScene) elements.imageStructScene.value = '';
        if (elements.imageStructAction) elements.imageStructAction.value = '';
        if (elements.imageStructAttire) elements.imageStructAttire.value = '';
        if (elements.imageStructEffects) elements.imageStructEffects.value = '';
        if (elements.imageStructStyle) elements.imageStructStyle.value = '';
        
        if (elements.videoFreeName) elements.videoFreeName.value = '';
        if (elements.videoFreeText) elements.videoFreeText.value = '';
        if (elements.videoStructName) elements.videoStructName.value = '';
        if (elements.videoStructCharacter) elements.videoStructCharacter.value = '';
        if (elements.videoStructScene) elements.videoStructScene.value = '';
        if (elements.videoStructAction) elements.videoStructAction.value = '';
        if (elements.videoStructAttire) elements.videoStructAttire.value = '';
        if (elements.videoStructEffects) elements.videoStructEffects.value = '';
        if (elements.videoStructCamera) elements.videoStructCamera.value = '';
        if (elements.videoStructDuration) elements.videoStructDuration.value = '';
        
        if (elements.modifierName) elements.modifierName.value = '';
        if (elements.modifierText) elements.modifierText.value = '';
    },
    switchPromptType: (type) => {
        const containers = document.querySelectorAll('.prompt-type-container');
        containers.forEach(container => container.classList.add('hidden'));
        
        const selectedContainer = document.getElementById(`${type}-prompt-container`);
        if (selectedContainer) {
            selectedContainer.classList.remove('hidden');
        }
        
        if (type === 'chat') {
            handlePromptManagement.switchTab('chat-free');
        } else if (type === 'image') {
            handlePromptManagement.switchTab('image-free');
        } else if (type === 'video') {
            handlePromptManagement.switchTab('video-free');
        }
    },
    switchTab: (tabId) => {
        const type = tabId.split('-')[0];
        
        const allTabs = document.querySelectorAll(`#${type}-prompt-container .tab-content`);
        allTabs.forEach(tab => tab.classList.add('hidden'));
        
        const allTabBtns = document.querySelectorAll(`#${type}-prompt-container .tab-btn`);
        allTabBtns.forEach(btn => btn.classList.remove('active'));
        
        const selectedTab = document.getElementById(`${tabId}-content`);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        }
        
        const selectedBtn = document.getElementById(`tab-${tabId}`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
    },
    savePrompt: async (state) => {
        const type = elements.promptTypeSelect.value;
        let promptData = { type };
        
        try {
            if (type === 'chat') {
                const activeTab = document.querySelector('#chat-prompt-container .tab-content:not(.hidden)');
                if (activeTab.id === 'chat-free-content') {
                    promptData.name = elements.chatFreeName.value.trim();
                    promptData.text = elements.chatFreeText.value.trim();
                    promptData.promptType = 'free';
                } else if (activeTab.id === 'chat-template-content') {
                    promptData.name = elements.chatTemplateName.value.trim();
                    promptData.role = elements.chatTemplateRole.value.trim();
                    promptData.instruction = elements.chatTemplateInstruction.value.trim();
                    promptData.data = elements.chatTemplateData.value.trim();
                    promptData.output = elements.chatTemplateOutput.value.trim();
                    promptData.promptType = 'template';
                }
            } else if (type === 'image') {
                const activeTab = document.querySelector('#image-prompt-container .tab-content:not(.hidden)');
                if (activeTab.id === 'image-free-content') {
                    promptData.name = elements.imageFreeName.value.trim();
                    promptData.text = elements.imageFreeText.value.trim();
                    promptData.promptType = 'free';
                } else if (activeTab.id === 'image-structured-content') {
                    promptData.name = elements.imageStructName.value.trim();
                    promptData.character = elements.imageStructCharacter.value.trim();
                    promptData.scene = elements.imageStructScene.value.trim();
                    promptData.action = elements.imageStructAction.value.trim();
                    promptData.attire = elements.imageStructAttire.value.trim();
                    promptData.effects = elements.imageStructEffects.value.trim();
                    promptData.style = elements.imageStructStyle.value.trim();
                    promptData.promptType = 'structured';
                }
            } else if (type === 'video') {
                const activeTab = document.querySelector('#video-prompt-container .tab-content:not(.hidden)');
                if (activeTab.id === 'video-free-content') {
                    promptData.name = elements.videoFreeName.value.trim();
                    promptData.text = elements.videoFreeText.value.trim();
                    promptData.promptType = 'free';
                } else if (activeTab.id === 'video-structured-content') {
                    promptData.name = elements.videoStructName.value.trim();
                    promptData.character = elements.videoStructCharacter.value.trim();
                    promptData.scene = elements.videoStructScene.value.trim();
                    promptData.action = elements.videoStructAction.value.trim();
                    promptData.attire = elements.videoStructAttire.value.trim();
                    promptData.effects = elements.videoStructEffects.value.trim();
                    promptData.cameraMovement = elements.videoStructCamera.value.trim();
                    promptData.duration = elements.videoStructDuration.value.trim();
                    promptData.promptType = 'structured';
                }
            } else if (type === 'modifier') {
                promptData.name = elements.modifierName.value.trim();
                promptData.text = elements.modifierText.value.trim();
                promptData.promptType = 'free';
            }
            
            if (!promptData.name) {
                showStatusMessage('Prompt name is required.', 'error');
                return;
            }
            
            if (type === 'modifier') {
                if (!promptData.text) {
                    showStatusMessage('Modifier text is required.', 'error');
                    return;
                }
            } else if (!promptData.text && !promptData.instruction) {
                showStatusMessage('Prompt content is required.', 'error');
                return;
            }
            
            const id = elements.editingPromptId.value.trim() || `prompt_${Date.now()}`;
            promptData.id = id;
            
            const result = await window.electronAPI.savePrompt(promptData);
            if (result.success) {
                showStatusMessage(`Prompt '${promptData.name}' saved successfully.`, 'success');
                handlePromptManagement.hideAddEditModal();
                handlePromptManagement.loadPrompts();
            } else {
                showStatusMessage(`Failed to save prompt: ${result.error}`, 'error');
            }
        } catch (error) {
            showStatusMessage(`Error saving prompt: ${error.message}`, 'error');
        }
    },
    loadPrompts: async () => {
        try {
            const response = await window.electronAPI.getPrompts();
            const prompts = response?.prompts || response || [];
            
            elements.promptsList.innerHTML = '';
            
            if (prompts.length === 0) {
                elements.promptsList.innerHTML = '<p>No prompts found. Click "Add New Prompt" to create one.</p>';
                return;
            }
            
            prompts.forEach(prompt => {
                const item = document.createElement('div');
                item.classList.add('prompt-item');
                
                const typeIcon = {
                    chat: '💬',
                    image: '🖼️',
                    video: '🎬',
                    modifier: '🔧'
                }[prompt.type] || '📝';
                
                const description = buildPromptText(prompt).substring(0, 80) + 
                    (buildPromptText(prompt).length > 80 ? '...' : '');
                
                item.innerHTML = `
                    <div class="prompt-item-header">
                        <span class="prompt-item-icon">${typeIcon}</span>
                        <span class="prompt-item-name">${prompt.name}</span>
                        <span class="prompt-item-type">${prompt.type}</span>
                    </div>
                    <div class="prompt-item-description">${description}</div>
                    <div class="prompt-item-actions">
                        <button class="insert-prompt-btn btn-primary" data-name="${prompt.name}">Insert</button>
                        <button class="edit-prompt-btn btn-secondary" data-name="${prompt.name}">Edit</button>
                        <button class="remove-prompt-btn btn-secondary" data-name="${prompt.name}">Remove</button>
                    </div>
                `;
                
                elements.promptsList.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to load prompts:', error);
            elements.promptsList.innerHTML = '<p>Error loading prompts.</p>';
        }
    },
    handleListClick: async (event) => {
        const target = event.target;
        const name = target.dataset.name;
        
        if (!name) return;
        
        if (target.classList.contains('remove-prompt-btn')) {
            const action = async () => {
                await window.electronAPI.removePrompt(name);
                handlePromptManagement.loadPrompts();
                showStatusMessage(`Prompt '${name}' removed.`, 'success');
            };
            showConfirmationModal(`Confirm Delete Prompt: ${name}`, `Are you sure you want to delete the prompt '${name}'?`, action);
        } else if (target.classList.contains('edit-prompt-btn')) {
            const prompt = await window.electronAPI.getPrompt(name);
            if (prompt) {
                handlePromptManagement.editPrompt(prompt);
            }
        } else if (target.classList.contains('insert-prompt-btn')) {
            const prompt = await window.electronAPI.getPrompt(name);
            if (prompt) {
                const text = buildPromptText(prompt);
                if (text && text.trim()) {
                    if (prompt.type === 'modifier') {
                        handleModifierInsertion(text, prompt.name || 'Modifier', elements);
                    } else {
                        handlePromptInsertion(text, prompt.name || 'Prompt', elements);
                    }
                    handlePromptManagement.hideManager();
                } else {
                    showStatusMessage('Selected prompt has no text content to insert.', 'info');
                }
            }
        }
    },
    editPrompt: (prompt) => {
        elements.promptModalTitle.textContent = 'Edit Prompt';
        elements.promptTypeSelect.value = prompt.type;
        handlePromptManagement.switchPromptType(prompt.type);
        
        if (prompt.type === 'chat') {
            if (prompt.promptType === 'template') {
                handlePromptManagement.switchTab('chat-template');
                if (elements.chatTemplateName) elements.chatTemplateName.value = prompt.name || '';
                if (elements.chatTemplateRole) elements.chatTemplateRole.value = prompt.role || '';
                if (elements.chatTemplateInstruction) elements.chatTemplateInstruction.value = prompt.instruction || '';
                if (elements.chatTemplateData) elements.chatTemplateData.value = prompt.data || '';
                if (elements.chatTemplateOutput) elements.chatTemplateOutput.value = prompt.output || '';
            } else {
                handlePromptManagement.switchTab('chat-free');
                if (elements.chatFreeName) elements.chatFreeName.value = prompt.name || '';
                if (elements.chatFreeText) elements.chatFreeText.value = prompt.text || '';
            }
        } else if (prompt.type === 'image') {
            if (prompt.promptType === 'structured') {
                handlePromptManagement.switchTab('image-structured');
                if (elements.imageStructName) elements.imageStructName.value = prompt.name || '';
                if (elements.imageStructCharacter) elements.imageStructCharacter.value = prompt.character || '';
                if (elements.imageStructScene) elements.imageStructScene.value = prompt.scene || '';
                if (elements.imageStructAction) elements.imageStructAction.value = prompt.action || '';
                if (elements.imageStructAttire) elements.imageStructAttire.value = prompt.attire || '';
                if (elements.imageStructEffects) elements.imageStructEffects.value = prompt.effects || '';
                if (elements.imageStructStyle) elements.imageStructStyle.value = prompt.style || '';
            } else {
                handlePromptManagement.switchTab('image-free');
                if (elements.imageFreeName) elements.imageFreeName.value = prompt.name || '';
                if (elements.imageFreeText) elements.imageFreeText.value = prompt.text || '';
            }
        } else if (prompt.type === 'video') {
            if (prompt.promptType === 'structured') {
                handlePromptManagement.switchTab('video-structured');
                if (elements.videoStructName) elements.videoStructName.value = prompt.name || '';
                if (elements.videoStructCharacter) elements.videoStructCharacter.value = prompt.character || '';
                if (elements.videoStructScene) elements.videoStructScene.value = prompt.scene || '';
                if (elements.videoStructAction) elements.videoStructAction.value = prompt.action || '';
                if (elements.videoStructAttire) elements.videoStructAttire.value = prompt.attire || '';
                if (elements.videoStructEffects) elements.videoStructEffects.value = prompt.effects || '';
                if (elements.videoStructCamera) elements.videoStructCamera.value = prompt.cameraMovement || '';
                if (elements.videoStructDuration) elements.videoStructDuration.value = prompt.duration || '';
            } else {
                handlePromptManagement.switchTab('video-free');
                if (elements.videoFreeName) elements.videoFreeName.value = prompt.name || '';
                if (elements.videoFreeText) elements.videoFreeText.value = prompt.text || '';
            }
        } else if (prompt.type === 'modifier') {
            if (elements.modifierName) elements.modifierName.value = prompt.name || '';
            if (elements.modifierText) elements.modifierText.value = prompt.text || '';
        }
        
        elements.editingPromptId.value = prompt.id || '';
        elements.addEditPromptModal.classList.remove('hidden');
    }
};

// === THINKING MODAL HANDLER ===
export const handleThinkingModal = {
    showThinking: (state) => {
        const modal = document.getElementById('thinking-modal');
        const content = document.getElementById('thinking-content');
        if (modal && content) {
            if (state.lastThinkingOutput && state.lastThinkingOutput.length > 0) {
                
                const formattedThinking = state.lastThinkingOutput
                    .replace(/\\n/g, '\n')
                    .replace(/\\t/g, '\t');
                content.textContent = formattedThinking;
                
                
                console.log('[Thinking Modal] Displaying full thinking output:', formattedThinking.substring(0, 100) + '...');
            } else {
                content.textContent = "No thinking process available. The AI may not have generated reasoning steps for the last response, or the model may not support explicit thinking output.";
            }
            modal.classList.remove('hidden');
        }
    },
    closeModal: () => {
        const modal = document.getElementById('thinking-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};

// === PROMPT INSERTION FOR GEN MODALS ===
export const handlePromptInsertionForGenModals = {
    showImagePromptSelector: async () => {
        const response = await window.electronAPI.getPrompts();
        const prompts = response?.prompts || response || [];
        const imagePrompts = prompts.filter(p => p.type === 'image');
        
        if (imagePrompts.length === 0) {
            showStatusMessage("No image prompts found. Create one in the Prompt Manager first!", "info");
            return;
        }
        
        const selection = await showPromptSelectionModal(imagePrompts, 'image');
        if (selection) {
            const promptTextarea = document.getElementById('image-prompt');
            if (promptTextarea) {
                if (selection.promptType === 'structured') {
                    const parts = [];
                    if (selection.character && selection.character.trim()) parts.push(selection.character);
                    if (selection.scene && selection.scene.trim()) parts.push(selection.scene);
                    if (selection.action && selection.action.trim()) parts.push(selection.action);
                    if (selection.attire && selection.attire.trim()) parts.push(selection.attire);
                    if (selection.effects && selection.effects.trim()) parts.push(selection.effects);
                    if (selection.style && selection.style.trim()) parts.push(selection.style);
                    promptTextarea.value = parts.join(', ');
                } else {
                    promptTextarea.value = selection.text || '';
                }
            }
        }
    },
    
    showVideoPromptSelector: async () => {
        const response = await window.electronAPI.getPrompts();
        const prompts = response?.prompts || response || [];
        const videoPrompts = prompts.filter(p => p.type === 'video');
        
        if (videoPrompts.length === 0) {
            showStatusMessage("No video prompts found. Create one in the Prompt Manager first!", "info");
            return;
        }
        
        const selection = await showPromptSelectionModal(videoPrompts, 'video');
        if (selection) {
            const promptTextarea = document.getElementById('advanced-video-prompt');
            if (promptTextarea) {
                if (selection.promptType === 'structured') {
                    const parts = [];
                    if (selection.character && selection.character.trim()) parts.push(selection.character);
                    if (selection.scene && selection.scene.trim()) parts.push(selection.scene);
                    if (selection.action && selection.action.trim()) parts.push(selection.action);
                    if (selection.attire && selection.attire.trim()) parts.push(selection.attire);
                    if (selection.effects && selection.effects.trim()) parts.push(selection.effects);
                    if (selection.cameraMovement && selection.cameraMovement.trim()) parts.push(`Camera: ${selection.cameraMovement}`);
                    if (selection.duration && selection.duration.trim()) parts.push(`Duration: ${selection.duration}`);
                    promptTextarea.value = parts.join(', ');
                } else {
                    promptTextarea.value = selection.text || '';
                }
            }
        }
    },
    
    useDefaultImagePrompt: async () => {
        const characterData = await window.electronAPI.getCharacterConstants();
        const characterName = characterData.name || 'AI';
        const description = characterData.description || 'An AI character';
        const attire = characterData.attire || 'futuristic outfit';
        
        const defaultPrompt = `${description}, ${attire}, professional portrait, soft lighting, high quality, detailed, photorealistic`;
        
        const promptTextarea = document.getElementById('image-prompt');
        if (promptTextarea) {
            promptTextarea.value = defaultPrompt + '\n\n';
            
            promptTextarea.focus();
            promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);
            
            showStatusMessage(`${characterName} template loaded!`, "success");
        }
        
        const btn = document.getElementById('use-default-image-prompt-btn');
        if (btn) {
            btn.innerHTML = `✨ Use ${characterName} Template`;
        }
    },
    
    useDefaultVideoPrompt: async () => {
        const characterData = await window.electronAPI.getCharacterConstants();
        const characterName = characterData.name || 'AI';
        const description = characterData.description || 'An AI character';
        const attire = characterData.attire || 'futuristic outfit';
        
        const defaultPrompt = `${description}, ${attire}, turning to face camera and waving, smiling, smooth camera movement, high quality video, cinematic lighting`;
        
        const promptTextarea = document.getElementById('advanced-video-prompt');
        if (promptTextarea) {
            promptTextarea.value = defaultPrompt + '\n\n';
            
            promptTextarea.focus();
            promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);
            
            showStatusMessage(`${characterName} video template loaded!`, "success");
        }
        
        const btn = document.getElementById('use-default-video-prompt-btn');
        if (btn) {
            btn.innerHTML = `✨ Use ${characterName} Template`;
        }
    }
};

async function showPromptSelectionModal(prompts, type) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.zIndex = '1100';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '500px';
        
        const title = document.createElement('h3');
        title.textContent = `Select ${type === 'image' ? 'Image' : 'Video'} Prompt`;
        modalContent.appendChild(title);
        
        const listDiv = document.createElement('div');
        listDiv.style.maxHeight = '400px';
        listDiv.style.overflowY = 'auto';
        listDiv.style.marginBottom = '20px';
        
        prompts.forEach(prompt => {
            const item = document.createElement('div');
            item.className = 'prompt-item';
            item.style.cursor = 'pointer';
            item.style.padding = '10px';
            item.style.border = '1px solid var(--border-color)';
            item.style.borderRadius = '5px';
            item.style.marginBottom = '10px';
            item.style.transition = 'background-color 0.2s';
            
            const nameSpan = document.createElement('strong');
            nameSpan.textContent = prompt.name;
            item.appendChild(nameSpan);
            
            const typeSpan = document.createElement('small');
            typeSpan.textContent = ` (${prompt.promptType || 'free'})`;
            typeSpan.style.color = 'var(--secondary-text-color)';
            item.appendChild(typeSpan);
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'var(--tertiary-bg-color)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
            
            item.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(prompt);
            });
            
            listDiv.appendChild(item);
        });
        
        modalContent.appendChild(listDiv);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });
        
        const btnDiv = document.createElement('div');
        btnDiv.style.textAlign = 'center';
        btnDiv.appendChild(cancelBtn);
        modalContent.appendChild(btnDiv);
        
        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);
    });
}