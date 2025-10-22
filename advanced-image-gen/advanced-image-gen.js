// advanced-image-gen.js - Advanced Image Generation Handler

import { populateImageModelSelector, updateImageModelControls } from '../src/handlers/modelUtils.js';

const elements = {};
function initializeElements() {
    const elementIds = [
        'image-model-select',
        'steps-slider', 'steps-value',
        'guidance-scale-slider', 'guidance-scale-value',
        'image-aspect-ratio', 'image-width', 'image-height',
        'image-prompt', 'image-negative-prompt',
        'disable-safety-checker-toggle', 'upscale-toggle',
        'generate-image-btn-submit', 'image-gen-log', 'image-previews-container',
        'tab-image-t2i', 'tab-image-i2i', 'image-upload',
        'insert-image-prompt-btn', 'use-default-image-prompt-btn',
        'open-image-output-btn'
    ];
    
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
            elements[camelCaseId] = element;
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    
    populateImageModelSelector(elements);
    updateImageModelControls(elements);
    setupEventListeners();
    
    window.electronAPI.onLoadPrompt((prompt) => {
        const promptTextarea = document.getElementById('image-prompt');
        if (promptTextarea) {
            if (prompt.content && prompt.content.promptType === 'structured') {
                
                const parts = [];
                if (prompt.content.character && prompt.content.character.trim()) parts.push(prompt.content.character);
                if (prompt.content.scene && prompt.content.scene.trim()) parts.push(prompt.content.scene);
                if (prompt.content.action && prompt.content.action.trim()) parts.push(prompt.content.action);
                if (prompt.content.attire && prompt.content.attire.trim()) parts.push(prompt.content.attire);
                if (prompt.content.effects && prompt.content.effects.trim()) parts.push(prompt.content.effects);
                if (prompt.content.style && prompt.content.style.trim()) parts.push(prompt.content.style);
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

    const characterData = await window.electronAPI.getCharacterConstants();
    const characterName = characterData.name || 'AI';
    const btn = document.getElementById('use-default-image-prompt-btn');
    if (btn) btn.innerHTML = `✨ Use ${characterName} Template`;
});

function setupEventListeners() {
    const tabT2i = document.getElementById('tab-image-t2i');
    const tabI2i = document.getElementById('tab-image-i2i');

    if (tabT2i) {
        tabT2i.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('t2i');
        });
    }
    if (tabI2i) {
        tabI2i.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('i2i');
        });
    }

    const modelSelect = document.getElementById('image-model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', () => updateImageModelControls(elements));
    }

    const aspectRatio = document.getElementById('image-aspect-ratio');
    if (aspectRatio) {
        aspectRatio.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const widthInput = document.getElementById('image-width');
            const heightInput = document.getElementById('image-height');
            if (widthInput) widthInput.value = selectedOption.dataset.width;
            if (heightInput) heightInput.value = selectedOption.dataset.height;
        });
    }

    const stepsSlider = document.getElementById('steps-slider');
    const guidanceScaleSlider = document.getElementById('guidance-scale-slider');

    if (stepsSlider) {
        stepsSlider.addEventListener('input', (e) => {
            const valueElement = document.getElementById('steps-value');
            if (valueElement) valueElement.textContent = e.target.value;
        });
    }

    if (guidanceScaleSlider) {
        guidanceScaleSlider.addEventListener('input', (e) => {
            const valueElement = document.getElementById('guidance-scale-value');
            if (valueElement) valueElement.textContent = e.target.value;
        });
    }

    const generateBtn = document.getElementById('generate-image-btn-submit');
    if (generateBtn) {
        generateBtn.addEventListener('click', executeAdvancedImage);
    }

    const closeBtn = document.getElementById('image-gen-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => window.close());
    }

    const cancelBtn = document.getElementById('image-gen-cancel-btn');
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

    const openOutputBtn = document.getElementById('open-image-output-btn');
    if (openOutputBtn) {
        openOutputBtn.addEventListener('click', () => {
            window.electronAPI.openImagesOutputFolder();
        });
    }

    const insertPromptBtn = document.getElementById('insert-image-prompt-btn');
    if (insertPromptBtn) {
        insertPromptBtn.addEventListener('click', showImagePromptSelector);
    }

    const useDefaultBtn = document.getElementById('use-default-image-prompt-btn');
    if (useDefaultBtn) {
        useDefaultBtn.addEventListener('click', useDefaultImagePrompt);
    }
}

function switchTab(mode) {
    const tabT2i = document.getElementById('tab-image-t2i');
    const tabI2i = document.getElementById('tab-image-i2i');
    const uploadGroup = document.getElementById('image-upload-group');

    if (mode === 't2i') {
        tabT2i?.classList.add('active');
        tabI2i?.classList.remove('active');
        uploadGroup.style.display = 'none';
        populateImageModelSelector(elements);
        updateImageModelControls(elements);
    } else if (mode === 'i2i') {
        tabT2i?.classList.remove('active');
        tabI2i?.classList.add('active');
        uploadGroup.style.display = 'block';
        populateImageModelSelector(elements);
        updateImageModelControls(elements);
    }
}

async function executeAdvancedImage(event) {
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

    const logElement = document.getElementById('image-gen-log');
    logElement.textContent = 'Preparing image generation...';
    logElement.classList.remove('hidden');

    const progressHandler = (data) => {
        if (data.status && data.message) {
            logElement.textContent = data.message;
            if (data.status === 'failed') {
                logElement.innerHTML = `<span style="color: var(--error-color)">❌ ${data.message}</span>`;
            } else if (data.status === 'completed') {
                logElement.innerHTML = `<span style="color: var(--success-color)">✅ ${data.message}</span>`;
            }
        }
    };

    try {
        const isI2iMode = document.getElementById('tab-image-i2i')?.classList.contains('active');
        const modelSelect = document.getElementById('image-model-select');
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];

        if (isI2iMode && selectedOption.dataset.i2i !== 'true') {
            logElement.textContent = '❌ Selected model does not support Image-to-Image generation';
            submitBtn.disabled = false;
            return;
        }

        if (isI2iMode && (!document.getElementById('image-upload').files || document.getElementById('image-upload').files.length === 0)) {
            throw new Error('Please select an image for Image-to-Image mode.');
        }

        const imageGenSettings = {
            modelConfig: {
                modelId: selectedOption.value,
                provider: selectedOption.dataset.provider
            },
            prompt: document.getElementById('image-prompt').value.trim(),
            negative_prompt: document.getElementById('image-negative-prompt').value.trim(),
            steps: parseInt(document.getElementById('steps-slider').value, 10),
            guidance_scale: parseFloat(document.getElementById('guidance-scale-slider').value),
            width: parseInt(document.getElementById('image-width').value, 10),
            height: parseInt(document.getElementById('image-height').value, 10),
            disable_safety_checker: document.getElementById('disable-safety-checker-toggle').checked,
            upscale: document.getElementById('upscale-toggle').checked,
            i2iImageUrl: null 
        };

        if (!imageGenSettings.prompt) {
            throw new Error('Please enter a prompt for the image.');
        }

        let customModel = null;
        if (selectedOption.dataset.provider === 'custom') {
            const customModelId = selectedOption.value.replace('custom:', '');
            customModel = {
                id: customModelId,
                name: selectedOption.textContent.replace('✨ ', ''),
                endpoint: selectedOption.dataset.customEndpoint,
                customPayload: selectedOption.dataset.customPayload ? JSON.parse(selectedOption.dataset.customPayload) : null
            };
            console.log('Using custom image model:', customModel);
        }

        if (isI2iMode && document.getElementById('image-upload').files && document.getElementById('image-upload').files.length > 0) {
            const imageFile = document.getElementById('image-upload').files[0];
            const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            imageGenSettings.i2iImageUrl = await readFileAsDataURL(imageFile);
            logElement.textContent = `Generating I2I image using: ${imageFile.name}...`;
        } else {
            logElement.textContent = customModel ? `Generating image with ${customModel.name}...` : 'Generating image...';
        }

        console.log('About to call window.electronAPI.generateOpenImage');
        const result = await window.electronAPI.generateOpenImage({ imageGenSettings, customModel });
        console.log('generateOpenImage result:', result);

        if (result.success && result.filePaths && result.filePaths.length > 0) {
            logElement.innerHTML = `<span style="color: var(--success-color)">✅ Generation Complete! Image saved to output folder.</span>`;
            document.getElementById('open-image-output-btn').classList.remove('hidden');

            const previewsContainer = document.getElementById('image-previews-container');
            previewsContainer.innerHTML = '';

            for (const filePath of result.filePaths) {
                const imgSrc = await window.electronAPI.convertFileSrc(filePath);
                const img = document.createElement('img');
                img.src = imgSrc;
                img.className = 'generated-image-preview';
                previewsContainer.appendChild(img);
            }
        } else {
            throw new Error(result.error || 'Failed to generate image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Generation Failed: ${error.message}</span>`;
        document.getElementById('open-image-output-btn').classList.add('hidden');
    } finally {
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

async function showImagePromptSelector() {
    const response = await window.electronAPI.getPrompts();
    const prompts = response?.prompts || response || [];
    const imagePrompts = prompts.filter(p => p.type === 'image' || p.type === 'modifier');

    if (imagePrompts.length === 0) {
        try {
            await window.electronAPI.openPromptManager('advanced-image-gen');
        } catch (error) {
            console.error('Error opening prompt manager:', error);
            alert('Failed to open Prompt Manager. Please try again.');
        }
        return;
    }

    const selection = await showPromptSelectionModal(imagePrompts, 'image');
    if (selection) {
        const promptTextarea = document.getElementById('image-prompt');
        if (promptTextarea) {
            if (selection.content && selection.content.promptType === 'structured') {
                const parts = [];
                if (selection.content.character && selection.content.character.trim()) parts.push(selection.content.character);
                if (selection.content.scene && selection.content.scene.trim()) parts.push(selection.content.scene);
                if (selection.content.action && selection.content.action.trim()) parts.push(selection.content.action);
                if (selection.content.attire && selection.content.attire.trim()) parts.push(selection.content.attire);
                if (selection.content.effects && selection.content.effects.trim()) parts.push(selection.content.effects);
                if (selection.content.style && selection.content.style.trim()) parts.push(selection.content.style);
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
            { id: 'portrait', name: 'Professional Portrait', value: `${description}, ${attire}, professional portrait, soft lighting, high quality, detailed, photorealistic` }
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

async function useDefaultImagePrompt() {
    const characterData = await window.electronAPI.getCharacterConstants();
    const characterName = characterData.name || 'AI';

    const selection = await showCharacterTemplateModal(characterData);
    if (!selection) return;

    const promptTextarea = document.getElementById('image-prompt');
    if (promptTextarea) {
        promptTextarea.value = selection.value + '\n\n';
        
        promptTextarea.focus();
        setTimeout(() => {
            promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);
        }, 50);

        showToast(`${characterName} ${selection.name} template loaded!`);
    }

    const btn = document.getElementById('use-default-image-prompt-btn');
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

        const filteredPrompts = prompts.filter(p => p.type === 'image' || p.type === 'modifier');

        if (filteredPrompts.length === 0) {
            const noPrompts = document.createElement('div');
            noPrompts.textContent = 'No saved image prompts found. Create one in the Prompt Manager first!';
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
                typeBadge.textContent = prompt.type === 'image' ? '🖼️ Image' : '🔧 Modifier';
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
                await window.electronAPI.openPromptManager('advanced-image-gen');
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
