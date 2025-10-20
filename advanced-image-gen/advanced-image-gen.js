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

    const characterData = await window.electronAPI.getCharacterConstants();
    const characterName = characterData.name || 'AI';
    const btn = document.getElementById('use-default-image-prompt-btn');
    if (btn) btn.innerHTML = `✨ Use ${characterName} Template`;
});

function setupEventListeners() {
    const tabT2i = document.getElementById('tab-image-t2i');
    const tabI2i = document.getElementById('tab-image-i2i');

    if (tabT2i) {
        tabT2i.addEventListener('click', () => switchTab('t2i'));
    }
    if (tabI2i) {
        tabI2i.addEventListener('click', () => switchTab('i2i'));
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
        // Refresh model selector so models that only support I2I are hidden on T2I tab
        populateImageModelSelector(elements);
        updateImageModelControls(elements);
    } else if (mode === 'i2i') {
        tabT2i?.classList.remove('active');
        tabI2i?.classList.add('active');
        uploadGroup.style.display = 'block';
        // Refresh model selector so only I2I-capable models are shown on the I2I tab
        populateImageModelSelector(elements);
        updateImageModelControls(elements);
    }
}

async function executeAdvancedImage(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = document.getElementById('image-gen-log');
    logElement.textContent = 'Preparing image generation...';
    logElement.classList.remove('hidden');

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
            // Safely grab the first uploaded file and convert to data URL
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
    }
}

async function showImagePromptSelector() {
    const response = await window.electronAPI.getPrompts();
    const prompts = response?.prompts || response || [];
    const imagePrompts = prompts.filter(p => p.type === 'image');

    if (imagePrompts.length === 0) {
        alert("No image prompts found. Create one in the Prompt Manager first!");
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
}

async function useDefaultImagePrompt() {
    const characterData = await window.electronAPI.getCharacterConstants();
    const characterName = characterData.name || 'AI';
    const description = characterData.description_safe || 'An AI character';
    const attire = characterData.attire || 'futuristic outfit';

    const defaultPrompt = `${description}, ${attire}, professional portrait, soft lighting, high quality, detailed, photorealistic`;

    const promptTextarea = document.getElementById('image-prompt');
    if (promptTextarea) {
        promptTextarea.value = defaultPrompt + '\n\n';

        promptTextarea.focus();
        promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);

        alert(`${characterName} template loaded!`);
    }

    const btn = document.getElementById('use-default-image-prompt-btn');
    if (btn) {
        btn.innerHTML = `✨ Use ${characterName} Template`;
    }
}

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
