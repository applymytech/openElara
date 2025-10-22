import { IMAGE_MODEL_STATS, ADVANCED_VIDEO_MODEL_STATS } from './modelConstants.js';
import { elements as defaultElements } from './domHandlers.js'; 

export function populateImageModelSelector(elementsOverride = null) {
    const elements = elementsOverride || defaultElements;
    const select = elements.imageModelSelect;
    if (!select) return;

    const isI2iMode = elements.tabImageI2i?.classList.contains('active') || false;

    select.innerHTML = '';
    let hasDefaultSelected = false;

    let customModels = [];
    try {
        const stored = localStorage.getItem('customImageModels');
        if (stored) {
            customModels = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load custom image models:', e);
    }

    Object.entries(IMAGE_MODEL_STATS).forEach(([modelId, stats]) => {

        if (isI2iMode && !stats.i2i) {
            return;
        }
        if (!isI2iMode && !stats.t2i) {
            return;
        }

        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = stats.displayName;
        option.dataset.modelId = modelId;
        option.dataset.provider = stats.provider;
        option.dataset.stepsMin = stats.steps.min;
        option.dataset.stepsMax = stats.steps.max;
        option.dataset.stepsDefault = stats.steps.default;
        option.dataset.guidanceMin = stats.guidance.min;
        option.dataset.guidanceMax = stats.guidance.max;
        option.dataset.guidanceDefault = stats.guidance.default;
        option.dataset.t2i = stats.t2i.toString();
        option.dataset.i2i = stats.i2i.toString();
        option.dataset.maxResolution = stats.maxResolution?.toString() || '1024';
        option.dataset.supportedFormats = stats.supportedFormats?.join(',') || 'png,jpeg';

        if (modelId === 'black-forest-labs/FLUX.1-schnell') {
            option.selected = true;
            hasDefaultSelected = true;
        }

        select.appendChild(option);
    });

    if (customModels.length > 0) {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '─────── Custom Models ───────';
        select.appendChild(separator);

        customModels.forEach(model => {
            if (isI2iMode && !model.supportsI2I) {
                return;
            }
            if (!isI2iMode && !model.supportsT2I) {
                return;
            }

            const option = document.createElement('option');
            option.value = `custom:${model.id}`;
            option.textContent = `✨ ${model.name}`;
            option.dataset.modelId = `custom:${model.id}`;
            option.dataset.provider = 'custom';
            option.dataset.customEndpoint = model.endpoint;
            option.dataset.customPayload = model.customPayload || '';
            option.dataset.stepsMin = '1';
            option.dataset.stepsMax = '50';
            option.dataset.stepsDefault = '20';
            option.dataset.guidanceMin = '1';
            option.dataset.guidanceMax = '20';
            option.dataset.guidanceDefault = '7.5';
            option.dataset.t2i = model.supportsT2I ? 'true' : 'false';
            option.dataset.i2i = model.supportsI2I ? 'true' : 'false';
            option.dataset.maxResolution = '2048';
            option.dataset.supportedFormats = 'png,jpeg';
            select.appendChild(option);
        });
    }

    if (!hasDefaultSelected && select.options.length > 0) {
        select.options[0].selected = true;
    }
}

export function updateImageModelControls(elementsOverride = null) {
    const elements = elementsOverride || defaultElements;
    const modelSelect = elements.imageModelSelect;
    if (!modelSelect) return;
    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    if (!selectedOption) return;

    const stepsSlider = elements.stepsSlider;
    const stepsValue = elements.stepsValue;
    const guidanceSlider = elements.guidanceScaleSlider;
    const guidanceValue = elements.guidanceScaleValue;

    if (stepsSlider) {
        stepsSlider.min = selectedOption.dataset.stepsMin;
        stepsSlider.max = selectedOption.dataset.stepsMax;
        stepsSlider.value = selectedOption.dataset.stepsDefault;
        if(stepsValue) stepsValue.textContent = stepsSlider.value;
    }

    if (guidanceSlider) {
        guidanceSlider.min = selectedOption.dataset.guidanceMin;
        guidanceSlider.max = selectedOption.dataset.guidanceMax;
        guidanceSlider.value = selectedOption.dataset.guidanceDefault;
        if(guidanceValue) guidanceValue.textContent = guidanceSlider.value;
    }

    const isI2iMode = elements.tabImageI2i?.classList.contains('active');
    if (isI2iMode && selectedOption.dataset.i2i === 'false') {
        const uploadGroup = document.getElementById('image-upload-group');
        if (uploadGroup) {
            uploadGroup.style.display = 'none';
        }
    }
}

export function populateAdvancedVideoModelSelector(elementsOverride = null) {
    const elements = elementsOverride || defaultElements;
    const select = elements.advancedVideoModelSelect;
    if (!select) return;

    const isI2vMode = elements.tabVideoI2v?.classList.contains('active') || false;

    select.innerHTML = '';
    let hasDefaultSelected = false;

    let customModels = [];
    try {
        const stored = localStorage.getItem('customVideoModels');
        if (stored) {
            customModels = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load custom video models:', e);
    }

    Object.entries(ADVANCED_VIDEO_MODEL_STATS).forEach(([modelId, stats]) => {
        
        if (isI2vMode && !stats.i2v) {
            return;
        }
        if (!isI2vMode && !stats.t2v) {
            return;
        }

        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = stats.displayName;
        option.dataset.modelId = modelId;
        option.dataset.provider = stats.provider;
        option.dataset.t2v = stats.t2v.toString();
        option.dataset.i2v = stats.i2v.toString();
        option.dataset.stepsMin = stats.steps.min;
        option.dataset.stepsMax = stats.steps.max;
        option.dataset.stepsDefault = stats.steps.default;
        option.dataset.guidanceMin = stats.guidance.min;
        option.dataset.guidanceMax = stats.guidance.max;
        option.dataset.guidanceDefault = stats.guidance.default;
        option.dataset.supportedResolutions = stats.supportedResolutions?.join(',') || '720p';
        option.dataset.defaultResolution = stats.defaultResolution || '720p';
        
        if ((!isI2vMode && modelId === 'aiml/pixverse/v5-full-t2v') ||
            (isI2vMode && modelId === 'aiml/pixverse/v5-full-i2v')) {
            option.selected = true;
            hasDefaultSelected = true;
        }

        select.appendChild(option);
    });
    
    if (customModels.length > 0) {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '─────── Custom Models ───────';
        select.appendChild(separator);

        customModels.forEach(model => {
            if (isI2vMode && !model.supportsI2V) {
                return;
            }
            if (!isI2vMode && !model.supportsT2V) {
                return;
            }

            const option = document.createElement('option');
            option.value = `custom:${model.id}`;
            option.textContent = `✨ ${model.name}`;
            option.dataset.modelId = `custom:${model.id}`;
            option.dataset.provider = 'custom';
            option.dataset.customEndpoint = model.endpoint;
            option.dataset.customPayload = model.customPayload || '';
            option.dataset.t2v = model.supportsT2V ? 'true' : 'false';
            option.dataset.i2v = model.supportsI2V ? 'true' : 'false';
            option.dataset.stepsMin = '1';
            option.dataset.stepsMax = '50';
            option.dataset.stepsDefault = '20';
            option.dataset.guidanceMin = '1';
            option.dataset.guidanceMax = '20';
            option.dataset.guidanceDefault = '7.5';
            option.dataset.supportedResolutions = '360p,540p,720p,1080p';
            option.dataset.defaultResolution = '720p';
            select.appendChild(option);
        });
    }
    
    if (!hasDefaultSelected && select.options.length > 0) {
        select.options[0].selected = true;
    }
}

export function updateAdvancedVideoControls(elementsOverride = null) {
    const elements = elementsOverride || defaultElements;
    const modelSelect = elements.advancedVideoModelSelect;
    if (!modelSelect) return;
    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    if (!selectedOption) return;

    const stepsSlider = elements.advancedVideoStepsSlider;
    const stepsValue = elements.advancedVideoStepsValue;
    const guidanceSlider = elements.advancedVideoGuidanceScaleSlider;
    const guidanceValue = elements.advancedVideoGuidanceScaleValue;
    const tabI2V = elements.tabVideoI2v;

    if (stepsSlider) {
        stepsSlider.min = selectedOption.dataset.stepsMin;
        stepsSlider.max = selectedOption.dataset.stepsMax;
        stepsSlider.value = selectedOption.dataset.stepsDefault;
        if(stepsValue) stepsValue.textContent = stepsSlider.value;
    }

    if (guidanceSlider) {
        guidanceSlider.min = selectedOption.dataset.guidanceMin;
        guidanceSlider.max = selectedOption.dataset.guidanceMax;
        guidanceSlider.value = selectedOption.dataset.guidanceDefault;
        if(guidanceValue) guidanceValue.textContent = guidanceSlider.value;
    }
}