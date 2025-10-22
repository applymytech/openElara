import { populateAdvancedVideoModelSelector, updateAdvancedVideoControls } from '../src/handlers/modelUtils.js';

const elements = {};

function initializeElements() {
    const elementIds = [
        'advanced-video-model-select',
        'advanced-video-steps-slider', 'advanced-video-steps-value',
        'advanced-video-guidance-scale-slider', 'advanced-video-guidance-scale-value',
        'advanced-video-aspect-ratio', 'advanced-video-resolution', 'advanced-video-frames',
        'advanced-video-prompt', 'advanced-video-negative-prompt', 'advanced-video-free-payload',
        'generate-advanced-video-btn-submit', 'advanced-video-gen-log', 'advanced-video-previews-container',
        'tab-video-t2v', 'tab-video-i2v', 'advanced-video-image-upload',
        'insert-video-prompt-btn', 'use-default-video-prompt-btn',
        'open-video-output-btn'
    ];
    
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
            elements[camelCaseId] = element;
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    
    populateAdvancedVideoModelSelector(elements);
    updateAdvancedVideoControls(elements);
    
    window.electronAPI.onLoadPrompt((prompt) => {
        const promptTextarea = document.getElementById('advanced-video-prompt');
        if (promptTextarea) {
            if (prompt.content && prompt.content.promptType === 'structured') {
               
                const parts = [];
                if (prompt.content.character && prompt.content.character.trim()) parts.push(prompt.content.character);
                if (prompt.content.scene && prompt.content.scene.trim()) parts.push(prompt.content.scene);
                if (prompt.content.action && prompt.content.action.trim()) parts.push(prompt.content.action);
                if (prompt.content.attire && prompt.content.attire.trim()) parts.push(prompt.content.attire);
                if (prompt.content.effects && prompt.content.effects.trim()) parts.push(prompt.content.effects);
                if (prompt.content.cameraMovement && prompt.content.cameraMovement.trim()) parts.push(`Camera: ${prompt.content.cameraMovement}`);
                if (prompt.content.duration && prompt.content.duration.trim()) parts.push(`Duration: ${prompt.content.duration}`);
                promptTextarea.value = parts.join(', ');
            } else {
                let contentText = '';
                if (typeof prompt.content === 'string') {
                    contentText = prompt.content;
                } else if (prompt.content && prompt.content.text) {
                    contentText = prompt.content.text;
                }
                promptTextarea.value = contentText;
            }
            
            promptTextarea.focus();
            promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);
        }
    });

    setupEventListeners();

    const characterData = await window.electronAPI.getCharacterConstants();
    const characterName = characterData.name || 'AI';
    const btn = document.getElementById('use-default-video-prompt-btn');
    if (btn) btn.innerHTML = `✨ Use ${characterName} Template`;
});

function setupEventListeners() {
    const tabT2v = document.getElementById('tab-video-t2v');
    const tabI2v = document.getElementById('tab-video-i2v');

    if (tabT2v) {
        tabT2v.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('t2v');
        });
    }
    if (tabI2v) {
        tabI2v.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('i2v');
        });
    }

    const modelSelect = document.getElementById('advanced-video-model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            const resolutionSelect = document.getElementById('advanced-video-resolution');
            const supportedResolutions = selectedOption.dataset.supportedResolutions?.split(',') || ['720p'];

            resolutionSelect.innerHTML = supportedResolutions.map(res =>
                `<option value="${res}">${res === '720p' ? 'HD (720p)' :
                  res === '1080p' ? 'Full HD (1080p)' :
                  res === '360p' ? 'SD (360p)' : res}</option>`
            ).join('');

            updateAdvancedVideoControls(elements);
        });
    }

    const aspectRatio = document.getElementById('advanced-video-aspect-ratio');
    if (aspectRatio) {
        aspectRatio.addEventListener('change', () => updateAdvancedVideoControls(elements));
    }

    const stepsSlider = document.getElementById('advanced-video-steps-slider');
    const guidanceScaleSlider = document.getElementById('advanced-video-guidance-scale-slider');

    if (stepsSlider) {
        stepsSlider.addEventListener('input', (e) => {
            const valueElement = document.getElementById('advanced-video-steps-value');
            if (valueElement) valueElement.textContent = e.target.value;
        });
    }

    if (guidanceScaleSlider) {
        guidanceScaleSlider.addEventListener('input', (e) => {
            const valueElement = document.getElementById('advanced-video-guidance-scale-value');
            if (valueElement) valueElement.textContent = e.target.value;
        });
    }

    const generateBtn = document.getElementById('generate-advanced-video-btn-submit');
    if (generateBtn) {
        generateBtn.addEventListener('click', executeAdvancedVideo);
    }

    const closeBtn = document.getElementById('advanced-video-gen-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => window.close());
    }

    const cancelBtn = document.getElementById('advanced-video-gen-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => window.close());
    }

    const backBtn = document.getElementById('back-to-main-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => window.close());
    }

    const backLink = document.getElementById('back-link');
    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.close();
        });
    }

    const openOutputBtn = document.getElementById('open-video-output-btn');
    if (openOutputBtn) {
        openOutputBtn.addEventListener('click', () => {
            window.electronAPI.openVideosOutputFolder();
        });
    }

    const insertPromptBtn = document.getElementById('insert-video-prompt-btn');
    if (insertPromptBtn) {
        insertPromptBtn.addEventListener('click', showVideoPromptSelector);
    }

    const useDefaultBtn = document.getElementById('use-default-video-prompt-btn');
    if (useDefaultBtn) {
        useDefaultBtn.addEventListener('click', useDefaultVideoPrompt);
    }
}

function switchTab(mode) {
    const tabT2v = document.getElementById('tab-video-t2v');
    const tabI2v = document.getElementById('tab-video-i2v');
    const uploadGroup = document.getElementById('advanced-video-i2v-upload-group');

    if (mode === 't2v') {
        tabT2v?.classList.add('active');
        tabI2v?.classList.remove('active');
        uploadGroup.style.display = 'none';
        populateAdvancedVideoModelSelector(elements);
        updateAdvancedVideoControls(elements);
    } else if (mode === 'i2v') {
        tabT2v?.classList.remove('active');
        tabI2v?.classList.add('active');
        uploadGroup.style.display = 'block';
        
        populateAdvancedVideoModelSelector(elements);
        updateAdvancedVideoControls(elements);
    }
}

async function executeAdvancedVideo(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    try {
        const currentTitle = document.title;
        document.title = currentTitle + ' (Generating...)';
        if (window.electronAPI && window.electronAPI.getCurrentWindow) {
            const win = await window.electronAPI.getCurrentWindow();
            if (win && win.setTitle) {
                win.setTitle(currentTitle + ' (Generating...)');
            }
        }
    } catch (e) {
        console.warn('Could not update window title:', e);
    }

    const log = document.getElementById('advanced-video-gen-log');
    log.classList.remove('hidden');
    log.textContent = 'Gathering Advanced Video settings...';

    const removeProgressListener = window.electronAPI.onVideoGenProgress((data) => {
        if (data.status && data.message) {
            log.textContent = data.message;
            if (data.status === 'failed') {
                log.innerHTML = `<span style="color: var(--error-color)">❌ ${data.message}</span>`;
            } else if (data.status === 'completed') {
                log.innerHTML = `<span style="color: var(--success-color)">✅ ${data.message}</span>`;
            }
        }
    });

    try {
        const isI2VActive = document.getElementById('tab-video-i2v')?.classList.contains('active');
        const modelSelect = document.getElementById('advanced-video-model-select');
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];

        if (isI2VActive && selectedOption.dataset.i2v !== 'true') {
            log.textContent = '❌ Selected model does not support Image-to-Video generation';
            submitBtn.disabled = false;
            return;
        }

        const resolution = document.getElementById('advanced-video-resolution').value;
        const supportedResolutions = selectedOption.dataset.supportedResolutions?.split(',') || ['720p'];
        if (!supportedResolutions.includes(resolution)) {
            log.textContent = `❌ Selected model does not support ${resolution} resolution. Supported: ${supportedResolutions.join(', ')}`;
            submitBtn.disabled = false;
            return;
        }

        const payload = {
            prompt: document.getElementById('advanced-video-prompt').value.trim(),
            modelId: selectedOption.value,
            aspect_ratio: document.getElementById('advanced-video-aspect-ratio').value,
            resolution: resolution,
            duration: parseInt(document.getElementById('advanced-video-frames').value, 10),
            negative_prompt: document.getElementById('advanced-video-negative-prompt').value.trim() || undefined,
            customPayload: document.getElementById('advanced-video-free-payload').value.trim(),
            i2vImageUrl: null,
        };

        if (isNaN(payload.duration) || payload.duration < 1 || payload.duration > 32) {
            alert('Duration must be between 1 and 32');
            log.textContent = '❌ Invalid duration value. Must be between 1 and 32.';
            submitBtn.disabled = false;
            return;
        }

        const validAspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
        if (!validAspectRatios.includes(payload.aspect_ratio)) {
            alert('Invalid aspect ratio');
            log.textContent = `❌ Invalid aspect ratio. Supported: ${validAspectRatios.join(', ')}`;
            submitBtn.disabled = false;
            return;
        }

        if (payload.customPayload) {
            try {
                JSON.parse(payload.customPayload);
            } catch (e) {
                alert('Invalid custom payload JSON');
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
            alert('Video prompt is required.');
            log.textContent = '❌ Generation Failed: Video prompt is required.';
            submitBtn.disabled = false;
            return;
        }

        const executionMessage = `Requesting Advanced Video (${isI2VActive ? 'I2V' : 'T2V'}) via ${payload.modelId}.`;

        if (isI2VActive) {
            const files = document.getElementById('advanced-video-image-upload').files;
            if (!files || files.length === 0) {
                throw new Error("Image-to-Video mode requires an uploaded image file.");
            }
            const imageFile = files[0];
            log.textContent = 'Uploading and processing image...';
            const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
            payload.i2vImageUrl = await readFileAsDataURL(imageFile);
            log.textContent = `Requesting Advanced Video (I2V) via ${payload.modelId} using image: ${imageFile.name}.`;
        }

        log.textContent = `🎬 Generating video... This might take a few minutes, but you can keep chatting!`;

        const videoResult = await window.electronAPI.generateAdvancedVideo(payload);

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

        const previewsContainer = document.getElementById('advanced-video-previews-container');
        previewsContainer.innerHTML = '';
        previewsContainer.appendChild(videoElement);

        setTimeout(() => {
            const insertedVideo = previewsContainer.querySelector('video');
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
        document.getElementById('open-video-output-btn').classList.remove('hidden');

    } catch (error) {
        log.textContent = `❌ Advanced Generation Failed: ${error.message}`;
        alert(`Advanced Video Failed: ${error.message}`);
    } finally {
        if (removeProgressListener) removeProgressListener();
        submitBtn.disabled = false;
        
        try {
            const currentTitle = document.title.replace(' (Generating...)', '');
            document.title = currentTitle;
            if (window.electronAPI && window.electronAPI.getCurrentWindow) {
                const win = await window.electronAPI.getCurrentWindow();
                if (win && win.setTitle) {
                    win.setTitle(currentTitle);
                }
            }
        } catch (e) {
            console.warn('Could not reset window title:', e);
        }
    }
}

async function showVideoPromptSelector() {
    const response = await window.electronAPI.getPrompts();
    const prompts = response?.prompts || response || [];
    const videoPrompts = prompts.filter(p => p.type === 'video' || p.type === 'modifier');

    if (videoPrompts.length === 0) {
        try {
            await window.electronAPI.openPromptManager('advanced-video-gen');
        } catch (error) {
            console.error('Error opening prompt manager:', error);
            alert('Failed to open Prompt Manager. Please try again.');
        }
        return;
    }

    const selection = await showPromptSelectionModal(videoPrompts, 'video');
    if (selection) {
        const promptTextarea = document.getElementById('advanced-video-prompt');
        if (promptTextarea) {
            if (selection.content && selection.content.promptType === 'structured') {
                const parts = [];
                if (selection.content.character && selection.content.character.trim()) parts.push(selection.content.character);
                if (selection.content.scene && selection.content.scene.trim()) parts.push(selection.content.scene);
                if (selection.content.action && selection.content.action.trim()) parts.push(selection.content.action);
                if (selection.content.attire && selection.content.attire.trim()) parts.push(selection.content.attire);
                if (selection.content.effects && selection.content.effects.trim()) parts.push(selection.content.effects);
                if (selection.content.cameraMovement && selection.content.cameraMovement.trim()) parts.push(`Camera: ${selection.content.cameraMovement}`);
                if (selection.content.duration && selection.content.duration.trim()) parts.push(`Duration: ${selection.content.duration}`);
                promptTextarea.value = parts.join(', ');
            } else {
                let contentText = '';
                if (typeof selection.content === 'string') {
                    contentText = selection.content;
                } else if (selection.content && selection.content.text) {
                    contentText = selection.content.text;
                }
                promptTextarea.value = contentText;
            }
            
            promptTextarea.focus();
            setTimeout(() => {
                promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);
            }, 50);
            
            showToast(`Prompt "${selection.name}" inserted`);
        }
    }
}

async function showCharacterTemplateModal(characterData) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.zIndex = '1100';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '500px';

        const title = document.createElement('h3');
        title.textContent = `Select ${characterData.name} Template`;
        modalContent.appendChild(title);

        const description = characterData.description_safe || characterData.description || 'An AI character';
        const attire = characterData.attire || 'futuristic outfit';
        const voiceProfile = characterData.voice_profile || '';

        const options = [
            { id: 'full', name: 'Full Description', value: `${description}, ${attire}` },
            { id: 'description', name: 'Character Description Only', value: description },
            { id: 'attire', name: 'Attire Only', value: attire },
            { id: 'video', name: 'Video Action Template', value: `${description}, ${attire}, turning to face camera and waving, smiling, smooth camera movement, high quality video, cinematic lighting` }
        ];

        if (voiceProfile) {
            options.push({ id: 'voice', name: 'Voice Profile', value: voiceProfile });
        }

        const listDiv = document.createElement('div');
        listDiv.style.maxHeight = '400px';
        listDiv.style.overflowY = 'auto';
        listDiv.style.marginBottom = '20px';

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'prompt-item';
            item.style.cursor = 'pointer';
            item.style.padding = '12px';
            item.style.border = '1px solid var(--border-color)';
            item.style.borderRadius = '5px';
            item.style.marginBottom = '10px';
            item.style.transition = 'background-color 0.2s';

            const nameSpan = document.createElement('strong');
            nameSpan.textContent = option.name;
            item.appendChild(nameSpan);

            const valueSpan = document.createElement('div');
            valueSpan.textContent = option.value.substring(0, 60) + (option.value.length > 60 ? '...' : '');
            valueSpan.style.fontSize = '0.85em';
            valueSpan.style.color = 'var(--text-muted-color)';
            valueSpan.style.marginTop = '5px';
            item.appendChild(valueSpan);

            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'var(--tertiary-bg-color)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });

            item.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(option);
            });

            listDiv.appendChild(item);
        });

        modalContent.appendChild(listDiv);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.style.marginRight = '10px';
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

async function useDefaultVideoPrompt() {
    const characterData = await window.electronAPI.getCharacterConstants();
    const characterName = characterData.name || 'AI';

    const selection = await showCharacterTemplateModal(characterData);
    if (!selection) return;

    const promptTextarea = document.getElementById('advanced-video-prompt');
    if (promptTextarea) {
        promptTextarea.value = selection.value + '\n\n';
        
        promptTextarea.focus();
        setTimeout(() => {
            promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);
        }, 50);

        showToast(`${characterName} ${selection.name} template loaded!`);
    }

    const btn = document.getElementById('use-default-video-prompt-btn');
    if (btn) {
        btn.innerHTML = `✨ Use ${characterName} Template`;
    }
}

function showToast(message) {
    const existingToast = document.getElementById('advanced-gen-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'advanced-gen-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--accent-color);
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

async function showPromptSelectionModal(prompts, type) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.zIndex = '1100';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '600px';

        const title = document.createElement('h3');
        title.textContent = `Select ${type === 'image' ? 'Image' : 'Video'} Prompt`;
        modalContent.appendChild(title);

        const description = document.createElement('p');
        description.textContent = 'Choose a saved prompt to insert into your generation. Only prompts of the correct type are shown.';
        description.style.color = 'var(--text-muted-color)';
        description.style.fontSize = '0.9em';
        description.style.marginBottom = '15px';
        modalContent.appendChild(description);

        const listDiv = document.createElement('div');
        listDiv.style.maxHeight = '400px';
        listDiv.style.overflowY = 'auto';
        listDiv.style.marginBottom = '20px';
        const filteredPrompts = prompts.filter(p => p.type === 'video' || p.type === 'modifier');

        if (filteredPrompts.length === 0) {
            const noPrompts = document.createElement('div');
            noPrompts.textContent = 'No saved video prompts found. Create one in the Prompt Manager first!';
            noPrompts.style.padding = '20px';
            noPrompts.style.textAlign = 'center';
            noPrompts.style.color = 'var(--text-muted-color)';
            listDiv.appendChild(noPrompts);
        } else {
            filteredPrompts.forEach(prompt => {
                const item = document.createElement('div');
                item.className = 'prompt-item';
                item.style.cursor = 'pointer';
                item.style.padding = '12px';
                item.style.border = '1px solid var(--border-color)';
                item.style.borderRadius = '5px';
                item.style.marginBottom = '10px';
                item.style.transition = 'background-color 0.2s';

                const headerDiv = document.createElement('div');
                headerDiv.style.display = 'flex';
                headerDiv.style.justifyContent = 'space-between';
                headerDiv.style.alignItems = 'center';
                headerDiv.style.marginBottom = '5px';

                const nameSpan = document.createElement('strong');
                nameSpan.textContent = prompt.name;
                headerDiv.appendChild(nameSpan);

                const typeBadge = document.createElement('span');
                typeBadge.textContent = prompt.type === 'video' ? '🎬 Video' : '🔧 Modifier';
                typeBadge.style.fontSize = '0.8em';
                typeBadge.style.background = 'var(--tertiary-bg-color)';
                typeBadge.style.padding = '2px 6px';
                typeBadge.style.borderRadius = '4px';
                headerDiv.appendChild(typeBadge);

                item.appendChild(headerDiv);

                let previewText = '';
                if (prompt.content && prompt.content.promptType === 'structured') {
                    const parts = [];
                    if (prompt.content.character) parts.push(prompt.content.character);
                    if (prompt.content.scene) parts.push(prompt.content.scene);
                    if (prompt.content.action) parts.push(prompt.content.action);
                    if (prompt.content.attire) parts.push(prompt.content.attire);
                    if (prompt.content.cameraMovement) parts.push(`Camera: ${prompt.content.cameraMovement}`);
                    previewText = parts.join(', ');
                } else if (prompt.content && prompt.content.text) {
                    previewText = prompt.content.text;
                }

                if (previewText) {
                    const previewDiv = document.createElement('div');
                    previewDiv.textContent = previewText.substring(0, 80) + (previewText.length > 80 ? '...' : '');
                    previewDiv.style.fontSize = '0.85em';
                    previewDiv.style.color = 'var(--text-muted-color)';
                    previewDiv.style.marginTop = '5px';
                    item.appendChild(previewDiv);
                }

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
        }

        modalContent.appendChild(listDiv);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.style.marginRight = '10px';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });

        const openManagerBtn = document.createElement('button');
        openManagerBtn.textContent = 'Open Prompt Manager';
        openManagerBtn.className = 'btn-primary';
        openManagerBtn.addEventListener('click', async () => {
            document.body.removeChild(overlay);
            try {
                await window.electronAPI.openPromptManager('advanced-video-gen');
            } catch (error) {
                console.error('Error opening prompt manager:', error);
                alert('Failed to open Prompt Manager. Please try again.');
            }
        });

        const btnDiv = document.createElement('div');
        btnDiv.style.textAlign = 'center';
        btnDiv.appendChild(cancelBtn);
        btnDiv.appendChild(openManagerBtn);
        modalContent.appendChild(btnDiv);

        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);
    });
}
